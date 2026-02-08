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
    
    // Event handlers
    this.onTranscribing = null;
    this.onTranscribed = null;
    this.onError = null;
    this.onSessionStarted = null;
    this.onSessionStopped = null;
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
      
      return true;
    } catch (error) {
      console.error('Initialization error:', error);
      throw new InitializationError();
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
    if (!this.transcriber) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.transcriber.startTranscribingAsync(
        () => {
          this.isListening = true;
          console.log('Transcription started');
          resolve();
        },
        (error) => {
          console.error('Start error:', error);
          const parsedError = parseError(error);
          reject(parsedError);
        }
      );
    });
  }

  /**
   * Stop transcription
   */
  async stop() {
    if (!this.transcriber) return;

    return new Promise((resolve, reject) => {
      this.transcriber.stopTranscribingAsync(
        () => {
          this.isListening = false;
          console.log('Transcription stopped');
          resolve();
        },
        (error) => {
          console.error('Stop error:', error);
          reject(error);
        }
      );
    });
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
    if (this.transcriber) {
      this.transcriber.close();
      this.transcriber = null;
    }
    this.tokenManager.reset();
    this.resetSpeakers();
  }
}

export default SpeechRecognitionService;
