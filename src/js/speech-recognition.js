/**
 * Speech Recognition Service - Handles Azure Speech SDK integration
 */

import { CONFIG } from './config.js';
import { parseError, InitializationError, StartError } from './errors.js';
import TokenManager from './token-manager.js';

export class SpeechRecognitionService {
  constructor() {
    this.transcriber = null;
    this.tokenManager = new TokenManager();
    this.isListening = false;
    this.speakerMap = new Map();
    this.lastInitialized = null;
    this.sessionStartTime = null;
    this.sessionHealthCheckTimer = null;
    this.isTransitioning = false; // Prevent race conditions
    
    // Event handlers
    this.onTranscribing = null;
    this.onTranscribed = null;
    this.onError = null;
    this.onSessionStarted = null;
    this.onSessionStopped = null;
    this.onSessionExpiring = null; // New: warn before token expires
  }

  /**
   * Initialize transcriber
   */
  async initialize() {
    try {
      const { token, region } = await this.tokenManager.getToken();
      
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechRecognitionLanguage = CONFIG.SPEECH.LANGUAGE;
      
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      
      this.transcriber = new SpeechSDK.ConversationTranscriber(speechConfig, audioConfig);
      
      this.setupEventHandlers();
      
      // Store initialization time for health checks
      this.lastInitialized = Date.now();
      
      return true;
    } catch (error) {
      console.error('Initialization error:', error);
      throw new InitializationError();
    }
  }
  
  /**
   * Check if transcriber needs reinitialization
   * Reinitialize if token might be stale or transcriber is old
   */
  needsReinitialization() {
    if (!this.transcriber) return true;
    
    // Check if token is expiring soon
    if (this.tokenManager.isExpiringSoon()) {
      console.log('Token expiring soon, needs reinitialization');
      return true;
    }
    
    // Check if transcriber is too old (8 minutes - before token expires)
    const age = Date.now() - this.lastInitialized;
    const maxAge = 8 * 60 * 1000; // 8 minutes
    if (age > maxAge) {
      console.log('Transcriber too old, needs reinitialization');
      return true;
    }
    
    return false;
  }
  
  /**
   * Ensure transcriber is fresh and ready
   */
  async ensureFreshTranscriber() {
    if (this.needsReinitialization()) {
      console.log('Reinitializing transcriber for reliability');
      
      // Clean up old transcriber
      if (this.transcriber) {
        try {
          this.transcriber.close();
        } catch (e) {
          console.warn('Error closing old transcriber:', e);
        }
        this.transcriber = null;
      }
      
      // Initialize fresh transcriber
      await this.initialize();
    }
  }

  /**
   * Setup event handlers for transcriber
   */
  setupEventHandlers() {
    // Real-time transcription (while speaking)
    this.transcriber.transcribing = (s, e) => {
      if (e.result.text && this.onTranscribing) {
        const speaker = this.getSpeakerLabel(e.result.speakerId);
        this.onTranscribing(speaker, e.result.text, true);
      }
    };

    // Final transcription (sentence complete)
    this.transcriber.transcribed = (s, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech && this.onTranscribed) {
        const speaker = this.getSpeakerLabel(e.result.speakerId);
        this.onTranscribed(speaker, e.result.text, false);
      }
    };

    // Error handling
    this.transcriber.canceled = (s, e) => {
      console.error('Transcription canceled:', e.reason, e.errorDetails);
      
      if (e.reason === SpeechSDK.CancellationReason.Error && this.onError) {
        const error = parseError({ errorDetails: e.errorDetails });
        this.onError(error);
      }
    };

    // Session events
    this.transcriber.sessionStarted = (s, e) => {
      console.log('Session started');
      if (this.onSessionStarted) {
        this.onSessionStarted();
      }
    };

    this.transcriber.sessionStopped = (s, e) => {
      console.log('Session stopped');
      if (this.onSessionStopped) {
        this.onSessionStopped();
      }
    };
  }

  /**
   * Get speaker label
   */
  getSpeakerLabel(speakerId) {
    if (!speakerId) return '?';
    
    if (!this.speakerMap.has(speakerId)) {
      const index = this.speakerMap.size;
      const label = CONFIG.SPEAKER_LABELS[index] || `说话者${index + 1}`;
      this.speakerMap.set(speakerId, label);
    }
    
    return this.speakerMap.get(speakerId);
  }

  /**
   * Start transcription
   */
  async start() {
    // Prevent race conditions
    if (this.isTransitioning) {
      console.warn('Start called while transitioning, ignoring');
      throw new Error('Operation in progress');
    }
    
    if (this.isListening) {
      console.warn('Already listening');
      return;
    }
    
    this.isTransitioning = true;
    
    try {
      // Always ensure transcriber is fresh and token is valid
      await this.ensureFreshTranscriber();

      await new Promise((resolve, reject) => {
        this.transcriber.startTranscribingAsync(
          () => {
            this.isListening = true;
            this.sessionStartTime = Date.now();
            console.log('Transcription started');
            
            // Start session health monitoring
            this.startSessionHealthCheck();
            
            resolve();
          },
          (error) => {
            console.error('Start error:', error);
            const parsedError = parseError(error);
            reject(parsedError);
          }
        );
      });
    } finally {
      this.isTransitioning = false;
    }
  }
  
  /**
   * Monitor session health during long sessions
   */
  startSessionHealthCheck() {
    // Clear any existing timer
    this.stopSessionHealthCheck();
    
    // Check every minute
    this.sessionHealthCheckTimer = setInterval(() => {
      if (!this.isListening) {
        this.stopSessionHealthCheck();
        return;
      }
      
      const sessionDuration = Date.now() - this.sessionStartTime;
      const sessionMinutes = Math.floor(sessionDuration / 60000);
      
      console.log(`Session health check: ${sessionMinutes} minutes active`);
      
      // Warn at 7 minutes (2 minutes before token expires)
      if (sessionMinutes === 7 && this.onSessionExpiring) {
        console.warn('Session approaching token expiry');
        this.onSessionExpiring();
      }
      
      // Force restart at 8.5 minutes to prevent token expiry during session
      if (sessionMinutes >= 8.5) {
        console.warn('Session too long, forcing restart for token refresh');
        if (this.onError) {
          this.onError({
            type: 'session-timeout',
            message: '会话时间过长，正在重新连接...'
          });
        }
      }
    }, 60000); // Check every minute
  }
  
  /**
   * Stop session health monitoring
   */
  stopSessionHealthCheck() {
    if (this.sessionHealthCheckTimer) {
      clearInterval(this.sessionHealthCheckTimer);
      this.sessionHealthCheckTimer = null;
    }
  }

  /**
   * Stop transcription
   */
  async stop() {
    // Prevent race conditions
    if (this.isTransitioning) {
      console.warn('Stop called while transitioning, ignoring');
      throw new Error('Operation in progress');
    }
    
    if (!this.isListening) {
      console.warn('Not listening, nothing to stop');
      return;
    }
    
    this.isTransitioning = true;
    
    try {
      // Stop health monitoring first
      this.stopSessionHealthCheck();
      
      if (!this.transcriber) {
        console.warn('No transcriber to stop');
        this.isListening = false;
        this.sessionStartTime = null;
        return;
      }

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn('Stop timeout, forcing state reset');
          this.isListening = false;
          this.sessionStartTime = null;
          resolve();
        }, 5000); // 5 second timeout
        
        this.transcriber.stopTranscribingAsync(
          () => {
            clearTimeout(timeout);
            this.isListening = false;
            this.sessionStartTime = null;
            console.log('Transcription stopped');
            resolve();
          },
          (error) => {
            clearTimeout(timeout);
            console.error('Stop error:', error);
            // Even on error, reset state to allow retry
            this.isListening = false;
            this.sessionStartTime = null;
            reject(error);
          }
        );
      });
    } catch (error) {
      // Ensure state is reset even on error
      this.isListening = false;
      this.sessionStartTime = null;
      throw error;
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Reset speaker mapping
   */
  resetSpeakers() {
    this.speakerMap.clear();
  }

  /**
   * Cleanup
   */
  destroy() {
    // Stop health monitoring
    this.stopSessionHealthCheck();
    
    if (this.transcriber) {
      try {
        this.transcriber.close();
      } catch (e) {
        console.warn('Error closing transcriber:', e);
      }
      this.transcriber = null;
    }
    this.tokenManager.reset();
    this.resetSpeakers();
    this.lastInitialized = null;
    this.sessionStartTime = null;
    this.isListening = false;
    this.isTransitioning = false;
  }
  
  /**
   * Get health status for diagnostics
   */
  getHealthStatus() {
    const sessionDuration = this.sessionStartTime ? Date.now() - this.sessionStartTime : null;
    
    return {
      hasTranscriber: !!this.transcriber,
      isListening: this.isListening,
      isTransitioning: this.isTransitioning,
      hasToken: !!this.tokenManager.token,
      tokenExpiringSoon: this.tokenManager.isExpiringSoon(),
      needsReinitialization: this.needsReinitialization(),
      transcriberAge: this.lastInitialized ? Date.now() - this.lastInitialized : null,
      sessionDuration: sessionDuration,
      sessionMinutes: sessionDuration ? Math.floor(sessionDuration / 60000) : null
    };
  }
}

export default SpeechRecognitionService;
