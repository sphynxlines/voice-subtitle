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
    this.speakerMap = new Map();
    this.lastInitialized = null;
    this.sessionStartTime = null;
    this.sessionHealthCheckTimer = null;
    
    // SINGLE SOURCE OF TRUTH - only this matters
    this._state = 'stopped'; // 'stopped', 'starting', 'listening', 'stopping'
    
    // Event handlers
    this.onTranscribing = null;
    this.onTranscribed = null;
    this.onError = null;
    this.onSessionStarted = null;
    this.onSessionStopped = null;
    this.onSessionExpiring = null;
  }
  
  /**
   * Get current state - SINGLE SOURCE OF TRUTH
   */
  get state() {
    return this._state;
  }
  
  /**
   * Check if currently listening
   */
  get isListening() {
    return this._state === 'listening';
  }
  
  /**
   * Check if busy (transitioning)
   */
  get isBusy() {
    return this._state === 'starting' || this._state === 'stopping';
  }
  
  /**
   * Force reset to stopped state - recovery mechanism
   */
  forceReset() {
    console.warn('FORCE RESET - recovering from bad state');
    this._state = 'stopped';
    this.stopSessionHealthCheck();
    this.sessionStartTime = null;
    
    if (this.transcriber) {
      try {
        this.transcriber.close();
      } catch (e) {
        console.warn('Error closing transcriber during reset:', e);
      }
      this.transcriber = null;
    }
  }

  /**
   * Initialize transcriber
   */
  async initialize() {
    try {
      const { token, region } = await this.tokenManager.getToken();
      
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechRecognitionLanguage = CONFIG.SPEECH.LANGUAGE;
      
      // Configure for continuous recognition
      speechConfig.setProperty(
        SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
        "15000"
      );
      
      // Disable speech context to avoid websocket errors
      speechConfig.setProperty(
        SpeechSDK.PropertyId.SpeechServiceConnection_EnableAudioLogging,
        "false"
      );
      
      // Set endpoint silence timeout
      speechConfig.setProperty(
        SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
        "3000"
      );
      
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      
      // Use SpeechRecognizer for simpler setup
      this.transcriber = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      
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
    this.transcriber.recognizing = (s, e) => {
      if (e.result.text && this.onTranscribing) {
        const speaker = this.getSpeakerLabel(e.result.speakerId || 'default');
        this.onTranscribing(speaker, e.result.text, true);
      }
    };

    // Final transcription (sentence complete)
    this.transcriber.recognized = (s, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech && this.onTranscribed) {
        const speaker = this.getSpeakerLabel(e.result.speakerId || 'default');
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
   * Start transcription - SIMPLIFIED
   */
  async start() {
    console.log(`[START] Current state: ${this._state}`);
    
    // Auto-recovery: if stuck in bad state, force reset
    if (this._state === 'starting' || this._state === 'stopping') {
      console.warn('Stuck in transition state, forcing reset');
      this.forceReset();
    }
    
    // Already listening? Just return
    if (this._state === 'listening') {
      console.log('Already listening');
      return;
    }
    
    this._state = 'starting';
    
    try {
      // Ensure fresh transcriber
      await this.ensureFreshTranscriber();

      // Start continuous recognition
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Start timeout'));
        }, 10000); // 10 second timeout
        
        this.transcriber.startContinuousRecognitionAsync(
          () => {
            clearTimeout(timeout);
            this._state = 'listening';
            this.sessionStartTime = Date.now();
            this.startSessionHealthCheck();
            console.log('[START] Success - now listening');
            resolve();
          },
          (error) => {
            clearTimeout(timeout);
            console.error('[START] Failed:', error);
            this._state = 'stopped';
            reject(parseError(error));
          }
        );
      });
    } catch (error) {
      // On any error, force back to stopped
      console.error('[START] Error, forcing stopped state');
      this._state = 'stopped';
      this.stopSessionHealthCheck();
      throw error;
    }
  }
  
  /**
   * Monitor session health during long sessions
   */
  startSessionHealthCheck() {
    this.stopSessionHealthCheck();
    
    this.sessionHealthCheckTimer = setInterval(() => {
      // Double-check we're actually listening
      if (this._state !== 'listening') {
        this.stopSessionHealthCheck();
        return;
      }
      
      const sessionDuration = Date.now() - this.sessionStartTime;
      const sessionMinutes = Math.floor(sessionDuration / 60000);
      
      console.log(`[HEALTH] Session: ${sessionMinutes} minutes, State: ${this._state}`);
      
      // Warn at 7 minutes
      if (sessionMinutes === 7 && this.onSessionExpiring) {
        console.warn('[HEALTH] Session approaching token expiry');
        this.onSessionExpiring();
      }
      
      // Force restart at 8.5 minutes
      if (sessionMinutes >= 8.5) {
        console.warn('[HEALTH] Session too long, forcing restart');
        if (this.onError) {
          this.onError({
            type: 'session-timeout',
            message: '会话时间过长，正在重新连接...'
          });
        }
      }
    }, 60000);
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
   * Stop transcription - SIMPLIFIED
   */
  async stop() {
    console.log(`[STOP] Current state: ${this._state}`);
    
    // Auto-recovery: if stuck in bad state, force reset
    if (this._state === 'starting' || this._state === 'stopping') {
      console.warn('Stuck in transition state, forcing reset');
      this.forceReset();
      return;
    }
    
    // Already stopped? Just return
    if (this._state === 'stopped') {
      console.log('Already stopped');
      return;
    }
    
    this._state = 'stopping';
    this.stopSessionHealthCheck();
    
    try {
      if (!this.transcriber) {
        console.log('[STOP] No transcriber, just reset state');
        this._state = 'stopped';
        this.sessionStartTime = null;
        return;
      }

      // Stop continuous recognition with timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn('[STOP] Timeout, forcing stopped');
          this._state = 'stopped';
          this.sessionStartTime = null;
          resolve();
        }, 5000); // 5 second timeout
        
        this.transcriber.stopContinuousRecognitionAsync(
          () => {
            clearTimeout(timeout);
            this._state = 'stopped';
            this.sessionStartTime = null;
            console.log('[STOP] Success - now stopped');
            resolve();
          },
          (error) => {
            clearTimeout(timeout);
            console.error('[STOP] Error, forcing stopped anyway:', error);
            this._state = 'stopped';
            this.sessionStartTime = null;
            resolve(); // Don't reject - we're stopped anyway
          }
        );
      });
    } catch (error) {
      // On any error, force to stopped
      console.error('[STOP] Error, forcing stopped state');
      this._state = 'stopped';
      this.sessionStartTime = null;
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
    this._state = 'stopped';
  }
  
  /**
   * Get health status for diagnostics
   */
  getHealthStatus() {
    const sessionDuration = this.sessionStartTime ? Date.now() - this.sessionStartTime : null;
    
    return {
      state: this._state,
      hasTranscriber: !!this.transcriber,
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
