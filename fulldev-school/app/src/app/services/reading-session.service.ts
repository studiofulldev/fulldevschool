import { Injectable, signal } from '@angular/core';
import { TtsEngineAdapter, TtsWordMarker } from './tts-engine.adapter';

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused';

@Injectable({ providedIn: 'root' })
export class ReadingSessionService {
  private readonly adapter = new TtsEngineAdapter();
  private source: AudioBufferSourceNode | null = null;
  private raf = 0;
  private startTimestamp = 0;
  private pausedOffset = 0;
  private wordsList: TtsWordMarker[] = [];
  private lastBuffer: AudioBuffer | null = null;

  readonly words = signal<TtsWordMarker[]>([]);
  readonly currentWordIndex = signal(0);
  readonly playbackRate = signal(1);
  readonly state = signal<PlaybackState>('idle');

  async start(text: string): Promise<void> {
    this.state.set('loading');
    this.stop();
    const result = await this.adapter.synthesize(text, this.playbackRate());
    this.wordsList = this.normalizeWords(result.words, text);
    this.words.set(this.wordsList);
    this.lastBuffer = result.audioBuffer;
    this.source = this.createSource(result.audioBuffer);
    this.playInternal();
  }

  pause(): void {
    if (this.source && this.state() === 'playing') {
      this.source.stop();
      this.pausedOffset = this.adapter.audioContext!.currentTime - this.startTimestamp;
      this.state.set('paused');
    }
  }

  resume(): void {
    if (this.state() === 'paused' && this.lastBuffer) {
      this.source = this.createSource(this.lastBuffer);
      this.startTimestamp = this.adapter.audioContext!.currentTime - this.pausedOffset;
      this.state.set('playing');
      this.source?.start(0, this.pausedOffset);
      this.trackProgress();
    }
  }

  stop(): void {
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
      this.source = null;
    }
    cancelAnimationFrame(this.raf);
    this.currentWordIndex.set(0);
    this.state.set('idle');
    this.pausedOffset = 0;
  }

  setSpeed(rate: number): void {
    this.playbackRate.set(rate);
    if (this.source?.playbackRate) {
      this.source.playbackRate.value = rate;
    }
    this.adapter.setSpeed(rate);
  }

  private createSource(buffer: AudioBuffer): AudioBufferSourceNode {
    const ctx = this.adapter.audioContext!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = this.playbackRate();
    source.connect(ctx.destination);
    source.onended = () => {
      this.state.set('idle');
      this.currentWordIndex.set(this.wordsList.length - 1);
      cancelAnimationFrame(this.raf);
    };
    return source;
  }

  private playInternal(): void {
    if (!this.source) return;
    const ctx = this.adapter.audioContext!;
    this.startTimestamp = ctx.currentTime;
    this.pausedOffset = 0;
    this.state.set('playing');
    this.source.start();
    this.trackProgress();
  }

  private trackProgress(): void {
    const ctx = this.adapter.audioContext!;
    const update = () => {
      if (!this.source || this.state() !== 'playing') return;
      const elapsed = (ctx.currentTime - this.startTimestamp) * 1000;
      const index = this.wordsList.findIndex((word) => elapsed >= word.start && elapsed < word.end);
      if (index >= 0 && index !== this.currentWordIndex()) {
        this.currentWordIndex.set(index);
      } else {
        const lastEnd = this.wordsList.length ? this.wordsList[this.wordsList.length - 1].end : 0;
        if (elapsed >= lastEnd) {
          this.currentWordIndex.set(this.wordsList.length - 1);
        }
      }
      this.raf = requestAnimationFrame(update);
    };
    this.raf = requestAnimationFrame(update);
  }

  private normalizeWords(words: TtsWordMarker[], text: string): TtsWordMarker[] {
    const tokens = text.split(/\s+/).filter(Boolean);
    if (!words.length) {
      return tokens.map((token, index) => ({
        text: token,
        start: index * 300,
        end: index * 300 + 250
      }));
    }
    return words.map((word, index) => ({
      text: word.text || tokens[index] || '',
      start: word.start,
      end: word.end,
      phonemes: word.phonemes
    }));
  }
}
