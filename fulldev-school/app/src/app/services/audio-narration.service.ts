import { Injectable, computed, inject, signal } from '@angular/core';
import SpeakTts from 'speak-tts';
import { SchoolContentService } from '../data/school-content.service';

@Injectable({ providedIn: 'root' })
export class AudioNarrationService {
  private readonly content = inject(SchoolContentService);
  private readonly speaker = new SpeakTts();
  private initialized = false;

  readonly isPlaying = signal(false);
  readonly playbackRate = signal(1);
  readonly currentLabel = computed(() => this.content.currentLesson()?.meta.title ?? '');

  async togglePlayback(): Promise<void> {
    if (this.isPlaying()) {
      window.speechSynthesis.cancel();
      this.isPlaying.set(false);
      return;
    }

    const lesson = this.content.currentLesson();
    if (!lesson) {
      return;
    }

    await this.ensureInitialized();
    const audioManifest = this.content.currentAudio();
    const text = lesson.markdown
      .replace(/^#+\s?/gm, '')
      .replace(/[-*]\s/g, '')
      .replace(/\n+/g, ' ');

    this.isPlaying.set(true);
    await this.speaker.speak({
      text,
      listeners: {
        onend: () => this.isPlaying.set(false)
      },
      rate: this.playbackRate(),
      pitch: audioManifest?.voice?.pitch ?? 1,
      lang: audioManifest?.voice?.lang ?? 'pt-BR'
    });
  }

  stop(): void {
    window.speechSynthesis.cancel();
    this.isPlaying.set(false);
  }

  increaseRate(): void {
    this.playbackRate.set(1.2);
  }

  decreaseRate(): void {
    this.playbackRate.set(0.8);
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.speaker.init({
      volume: 1,
      lang: 'pt-BR',
      rate: 1,
      pitch: 1,
      splitSentences: true
    });
    this.initialized = true;
  }
}
