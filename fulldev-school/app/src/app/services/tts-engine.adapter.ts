import { Injectable, signal } from '@angular/core';

declare module '@met4citizen/headtts/modules/headtts.mjs' {
  export class HeadTTS {
    constructor(settings?: Record<string, unknown>, onerror?: (error: unknown) => void);
    connect(): Promise<void>;
    synthesize(data: Record<string, unknown>): Promise<any>;
  }
}

export interface TtsWordMarker {
  text: string;
  start: number;
  end: number;
  phonemes?: string[];
}

export interface TtsGeneration {
  audioBuffer: AudioBuffer;
  words: TtsWordMarker[];
}

@Injectable({ providedIn: 'root' })
export class TtsEngineAdapter {
  private headtts: any | null = null;
  private context: AudioContext | null = null;
  private readyFlag = signal(false);
  readonly loading = signal(true);
  readonly ready = this.readyFlag.asReadonly();

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      const { HeadTTS } = await import(
        '@met4citizen/headtts/modules/headtts.mjs'
      );
      const workerUrl = new URL(
        '@met4citizen/headtts/modules/worker-tts.mjs',
        import.meta.url
      ).href;
      this.context = new AudioContext();
      this.headtts = new HeadTTS({
        endpoints: ['webgpu', 'wasm'],
        workerModule: workerUrl,
        languages: ['en-us'],
        voices: ['af_bella'],
        audioCtx: this.context
      });
      await this.headtts.connect();
      this.readyFlag.set(true);
    } catch (error) {
      console.error('HeadTTS failed to initialize', error);
    } finally {
      this.loading.set(false);
    }
  }

  async synthesize(text: string, speed = 1): Promise<TtsGeneration> {
    if (!this.readyFlag() || !this.headtts) {
      return this.fallbackSpeech(text, speed);
    }

    try {
      const metadata = await this.headtts.synthesize({
        input: text,
        speed,
        voice: 'af_bella'
      });

      const audioData =
        metadata.audio instanceof ArrayBuffer
          ? metadata.audio
          : metadata.audio?.buffer ?? metadata.audio;
      if (!audioData || !this.context) {
        throw new Error('HeadTTS returned no audio');
      }

      const arrayBuffer =
        audioData instanceof ArrayBuffer
          ? audioData
          : audioData.slice?.(0) ?? audioData;
      const decoded = await this.context.decodeAudioData(arrayBuffer);

      return {
        audioBuffer: decoded,
        words:
          metadata.words?.map((word: any) => ({
            text: word.word ?? word.text ?? '',
            start: word.start ?? 0,
            end: (word.start ?? 0) + (word.duration ?? 0),
            phonemes: word.phonemes ?? []
          })) ?? []
      };
    } catch (error) {
      console.error('HeadTTS synthesis failed, falling back', error);
      return this.fallbackSpeech(text, speed);
    }
  }

  setSpeed(rate: number): void {
    if (this.headtts) {
      this.headtts.ttsSetup.speed = rate;
    }
  }

  private fallbackSpeech(text: string, speed: number): Promise<TtsGeneration> {
    const audioCtx = this.context ?? new AudioContext();
    const tokens = text.split(/\s+/).filter(Boolean);
    const words = tokens.map((token, index) => ({
      text: token,
      start: index * 300,
      end: index * 300 + 250,
      phonemes: []
    }));
    const buffer = audioCtx.createBuffer(1, 1, audioCtx.sampleRate);
    return Promise.resolve({
      audioBuffer: buffer,
      words
    });
  }

  get audioContext(): AudioContext | null {
    return this.context;
  }
}
