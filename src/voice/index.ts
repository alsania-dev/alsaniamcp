/**
 * Voice activation and processing module for AlsaniaMCP
 * Provides voice command recognition and activation capabilities
 *
 * Note: This module is designed for client-side use in browsers.
 * Server-side Node.js environments should use alternative implementations.
 * TODO: Move to separate client package to avoid server-side compilation issues.
 */

// Browser API type declarations (server-side stub - will be overridden by browser APIs when running in browser)
// @ts-ignore: Browser APIs not available in Node.js
declare const window: any;
// @ts-ignore: Browser APIs not available in Node.js
declare const navigator: any;

// @ts-ignore: Speech Recognition API types for browser compatibility
declare const SpeechRecognition: any;
// @ts-ignore: Speech Synthesis API types for browser compatibility
declare const SpeechSynthesis: any;
// @ts-ignore: Speech Synthesis Utterance API types for browser compatibility
declare const SpeechSynthesisUtterance: any;
// @ts-ignore: Speech Synthesis Voice API types for browser compatibility
declare const SpeechSynthesisVoice: any;

export interface VoiceConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  keywords: string[];
  activationThreshold: number;
}

export interface SpeechResult {
  transcript: string;
  confidence: number;
  timestamp: number;
}

export interface TTSConfig {
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

/**
 * Voice Activation and Processing Engine
 * Handles wake word detection and voice command processing
 */
export class VoiceEngine {
  private _isActive: boolean = false;
  private _isListening: boolean = false;
  private mediaStream: any = null;
  private audioContext: any = null;

  constructor(private config: VoiceConfig) {}

  /**
   * Check if browser supports required Web Audio APIs
   */
  static isSupported(): boolean {
    return !!(window.AudioContext || (window as any).webkitAudioContext) &&
           !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Initialize voice engine with user media permissions
   */
  async initialize(): Promise<void> {
    if (!VoiceEngine.isSupported()) {
      throw new Error('Voice activation not supported in this browser');
    }

    try {
      // Request microphone permission
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
        },
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      console.log('[VoiceEngine] Initialized with config:', this.config);
    } catch (error) {
      console.error('[VoiceEngine] Initialization failed:', error);
      throw new Error(`Failed to initialize voice engine: ${error}`);
    }
  }

  /**
   * Start listening for voice activation
   */
  async startListening(): Promise<void> {
    if (!this.audioContext || !this.mediaStream) {
      throw new Error('Voice engine not initialized');
    }

    this._isListening = true;
    this._isActive = false;

    console.log('[VoiceEngine] Started listening');
    // Implementation continues below...
  }

  /**
   * Stop listening for voice activation
   */
  async stopListening(): Promise<void> {
    this._isListening = false;
    this._isActive = false;

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track: any) => track.stop());
      this.mediaStream = null;
    }

    console.log('[VoiceEngine] Stopped listening');
  }

  /**
   * Register callback for voice activation events
   */
  onActivation(callback: (keyword: string, confidence: number) => void): void {
    // Store callback for activation events
    // Implementation to follow...
  }

  /**
   * Check if voice engine is currently active
   */
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * Check if voice engine is currently listening
   */
  get isListening(): boolean {
    return this._isListening;
  }

  /**
   * Get current configuration
   */
  getConfig(): VoiceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[VoiceEngine] Configuration updated:', this.config);
  }
}

/**
 * Speech-to-Text Engine
 * Handles speech recognition and transcription
 */
export class SpeechToTextEngine {
  private recognition: any = null;

  constructor() {
    this.initializeRecognition();
  }

  /**
   * Check if speech recognition is supported
   */
  static isSupported(): boolean {
    return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  private initializeRecognition(): void {
    if (!SpeechToTextEngine.isSupported()) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    console.log('[SpeechToTextEngine] Initialized');
  }

  /**
   * Start speech recognition session
   */
  async recognize(): Promise<SpeechResult> {
    if (!this.recognition) {
      throw new Error('Speech recognition not initialized');
    }

    return new Promise((resolve, reject) => {
      this.recognition!.onresult = (event: any) => {
        const result = event.results[0];
        if (result.isFinal) {
          resolve({
            transcript: result[0].transcript.trim(),
            confidence: result[0].confidence,
            timestamp: Date.now(),
          });
        }
      };


      this.recognition!.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition!.start();
    });
  }

  /**
   * Stop current recognition session
   */
  stop(): void {
    if (this.recognition && this.recognition.continuous) {
      this.recognition.stop();
    }
  }

  /**
   * Abort recognition immediately
   */
  abort(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
  }
}

/**
 * Text-to-Speech Engine
 * Handles speech synthesis for voice responses
 */
export class TextToSpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      console.log('[TextToSpeechEngine] Initialized');
    } else {
      throw new Error('Text-to-speech not supported in this browser');
    }
  }

  /**
   * Check if TTS is supported
   */
  static isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  /**
   * Speak text with configuration
   */
  async speak(text: string, config: Partial<TTSConfig> = {}): Promise<void> {
    if (!this.synth) {
      throw new Error('TTS not initialized');
    }

    // Cancel any ongoing speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);

    // Apply configuration
    const voices = this.getVoices();
    const configVoice = config.voice ? voices.find(v => v.name === config.voice || v.voiceURI === config.voice) : null;
    if (configVoice) utterance.voice = configVoice;
    if (config.rate !== undefined) utterance.rate = config.rate;
    if (config.pitch !== undefined) utterance.pitch = config.pitch;
    if (config.volume !== undefined) utterance.volume = config.volume;

    this.currentUtterance = utterance;

    return new Promise((resolve, reject) => {
      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };
      utterance.onerror = (event: any) => {
        this.currentUtterance = null;
        reject(new Error(`TTS error: ${event.error}`));
      };

      this.synth!.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Check if TTS is currently speaking
   */
  get isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  /**
   * Check if TTS is currently paused
   */
  get isPaused(): boolean {
    return this.synth ? this.synth.paused : false;
  }
}

/**
 * Voice Command Processor
 * Main interface for voice-activated MCP commands
 */
export class VoiceCommandProcessor {
  private voiceEngine: VoiceEngine;
  private sttEngine: SpeechToTextEngine;
  private ttsEngine: TextToSpeechEngine;
  private isProcessing: boolean = false;

  constructor(config: VoiceConfig) {
    this.voiceEngine = new VoiceEngine(config);
    this.sttEngine = new SpeechToTextEngine();
    this.ttsEngine = new TextToSpeechEngine();
  }

  /**
   * Check if all required APIs are supported
   */
  static isSupported(): boolean {
    return VoiceEngine.isSupported() &&
           SpeechToTextEngine.isSupported() &&
           TextToSpeechEngine.isSupported();
  }

  /**
   * Initialize all voice components
   */
  async initialize(): Promise<void> {
    try {
      await this.voiceEngine.initialize();
      console.log('[VoiceCommandProcessor] Initialized successfully');
    } catch (error) {
      console.error('[VoiceCommandProcessor] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start voice command processing
   */
  async start(): Promise<void> {
    await this.voiceEngine.startListening();

    // Set up activation handler
    this.voiceEngine.onActivation(async (keyword, confidence) => {
      if (this.isProcessing) return;

      console.log(`[VoiceCommandProcessor] Activation detected: ${keyword} (${confidence.toFixed(2)})`);

      this.isProcessing = true;
      try {
        await this.processCommand();
      } finally {
        this.isProcessing = false;
      }
    });
  }

  /**
   * Stop voice command processing
   */
  async stop(): Promise<void> {
    await this.voiceEngine.stopListening();
  }

  /**
   * Process a voice command after activation
   */
  private async processCommand(): Promise<void> {
    try {
      // Speak acknowledgment
      await this.ttsEngine.speak('Listening for command...');

      // Listen for command
      const result = await this.sttEngine.recognize();

      console.log('[VoiceCommandProcessor] Recognized:', result);

      // Process command (placeholder - integrate with MCP tools later)
      await this.ttsEngine.speak(`You said: ${result.transcript}`);
      await this.ttsEngine.speak('Command processing will be implemented soon.');

    } catch (error) {
      console.error('[VoiceCommandProcessor] Command processing error:', error);
      await this.ttsEngine.speak('Sorry, I couldn\'t understand that. Please try again.');
    }
  }

  /**
   * Get current status
   */
  getStatus(): {
    isActive: boolean;
    isListening: boolean;
    isProcessing: boolean;
    isSupported: boolean;
  } {
    return {
      isActive: this.voiceEngine.isActive,
      isListening: this.voiceEngine.isListening,
      isProcessing: this.isProcessing,
      isSupported: VoiceCommandProcessor.isSupported(),
    };
  }
}

// Default configurations
export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  sampleRate: 16000,
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  keywords: ['hey alsania', 'alsania', 'computer'],
  activationThreshold: 0.6,
};

export const DEFAULT_TTS_CONFIG: TTSConfig = {
  voice: 'default',
  rate: 1.0,
  pitch: 1.0,
  volume: 0.8,
};

console.log('[Voice Module] Voice activation module loaded');
