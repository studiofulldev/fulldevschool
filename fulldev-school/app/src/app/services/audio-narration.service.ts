import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  AudioManifest,
  LessonBlock,
  LessonContent,
  SchoolContentService
} from '../data/school-content.service';

@Injectable({ providedIn: 'root' })
export class AudioNarrationService {
  private readonly content = inject(SchoolContentService);

  private utterance: SpeechSynthesisUtterance | null = null;
  private currentBlockIndex = 0;
  private lessonBlocks: LessonBlock[] = [];

  readonly isPlaying = signal(false);
  readonly isLoading = signal(false);
  readonly playbackRate = signal(1);
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly currentBlockId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly currentLabel = computed(() => this.content.currentLesson()?.meta.title ?? '');
  readonly progressPercent = computed(() => {
    const duration = this.duration();
    return duration > 0 ? (this.currentTime() / duration) * 100 : 0;
  });
  readonly currentTimeLabel = computed(() => this.formatTime(this.currentTime()));
  readonly durationLabel = computed(() => this.formatTime(this.duration()));
  readonly engineLabel = computed(() => 'Voz do navegador');

  constructor() {
    // Audio guiado permanece no projeto como base tecnica, mas a interface foi ocultada
    // temporariamente. Quando a feature voltar, este efeito reidrata a sessao a partir
    // da licao e do manifesto carregados no mock-db.
    effect(() => {
      const lesson = this.content.currentLesson();
      const manifest = this.content.currentAudio();

      this.stop();
      this.lessonBlocks = lesson?.blocks ?? [];
      this.currentBlockIndex = 0;
      this.currentBlockId.set(this.lessonBlocks[0]?.id ?? null);
      this.duration.set(this.resolveDuration(manifest));
      this.errorMessage.set(null);
    });
  }

  async togglePlayback(): Promise<void> {
    // Feature temporariamente fora da UI. Mantido para a retomada do player guiado.
    const lesson = this.content.currentLesson();
    const manifest = this.content.currentAudio();
    if (!lesson || !manifest || !this.lessonBlocks.length) {
      return;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.isPlaying.set(true);
      return;
    }

    if (this.isPlaying()) {
      window.speechSynthesis.pause();
      this.isPlaying.set(false);
      return;
    }

    await this.playFromBlock(this.currentBlockIndex, lesson, manifest);
  }

  async previous(): Promise<void> {
    // Feature temporariamente fora da UI. Mantido para a retomada do player guiado.
    const lesson = this.content.currentLesson();
    const manifest = this.content.currentAudio();
    if (!lesson || !manifest) {
      return;
    }

    const targetIndex = Math.max(0, this.currentBlockIndex - 1);
    await this.playFromBlock(targetIndex, lesson, manifest);
  }

  async next(): Promise<void> {
    // Feature temporariamente fora da UI. Mantido para a retomada do player guiado.
    const lesson = this.content.currentLesson();
    const manifest = this.content.currentAudio();
    if (!lesson || !manifest) {
      return;
    }

    const targetIndex = Math.min(this.lessonBlocks.length - 1, this.currentBlockIndex + 1);
    await this.playFromBlock(targetIndex, lesson, manifest);
  }

  async seekToRatio(ratio: number): Promise<void> {
    // Feature temporariamente fora da UI. Mantido para a retomada do player guiado.
    await this.seekToSecond(this.duration() * Math.min(1, Math.max(0, ratio)));
  }

  async seekToSecond(second: number): Promise<void> {
    // Feature temporariamente fora da UI. Mantido para a retomada do player guiado.
    const lesson = this.content.currentLesson();
    const manifest = this.content.currentAudio();
    if (!lesson || !manifest) {
      return;
    }

    const targetBlockId =
      [...manifest.segments].reverse().find((segment) => second >= segment.start)?.blockId ??
      manifest.segments[0]?.blockId;
    const targetIndex = this.lessonBlocks.findIndex((block) => block.id === targetBlockId);
    this.currentTime.set(second);
    this.currentBlockIndex = Math.max(0, targetIndex);
    this.currentBlockId.set(this.lessonBlocks[this.currentBlockIndex]?.id ?? null);

    if (this.isPlaying()) {
      await this.playFromBlock(this.currentBlockIndex, lesson, manifest);
    }
  }

  stop(): void {
    // Feature temporariamente fora da UI. Mantido para a retomada do player guiado.
    window.speechSynthesis.cancel();
    this.utterance = null;
    this.isPlaying.set(false);
    this.currentTime.set(0);
    this.currentBlockIndex = 0;
    this.currentBlockId.set(this.lessonBlocks[0]?.id ?? null);
  }

  increaseRate(): void {
    // Feature temporariamente fora da UI. Mantido para a retomada do player guiado.
    this.playbackRate.set(Math.min(1.5, this.playbackRate() + 0.1));
    if (this.isPlaying()) {
      void this.restartCurrentBlock();
    }
  }

  decreaseRate(): void {
    // Feature temporariamente fora da UI. Mantido para a retomada do player guiado.
    this.playbackRate.set(Math.max(0.75, this.playbackRate() - 0.1));
    if (this.isPlaying()) {
      void this.restartCurrentBlock();
    }
  }

  replay(): void {
    // Feature temporariamente fora da UI. Mantido para a retomada do player guiado.
    const lesson = this.content.currentLesson();
    const manifest = this.content.currentAudio();
    if (!lesson || !manifest) {
      return;
    }

    void this.playFromBlock(0, lesson, manifest);
  }

  private async restartCurrentBlock(): Promise<void> {
    const lesson = this.content.currentLesson();
    const manifest = this.content.currentAudio();
    if (!lesson || !manifest) {
      return;
    }

    await this.playFromBlock(this.currentBlockIndex, lesson, manifest);
  }

  private async playFromBlock(
    blockIndex: number,
    lesson: LessonContent,
    manifest: AudioManifest
  ): Promise<void> {
    const block = lesson.blocks[blockIndex];
    if (!block) {
      return;
    }

    window.speechSynthesis.cancel();
    this.utterance = null;
    this.currentBlockIndex = blockIndex;
    this.currentBlockId.set(block.id);
    this.currentTime.set(this.segmentStart(block.id, manifest));

    const utterance = new SpeechSynthesisUtterance(this.stripMarkdown(block.markdown));
    utterance.lang = manifest.voice?.lang || 'pt-BR';
    utterance.rate = this.playbackRate();
    utterance.pitch = manifest.voice?.pitch || 1;
    utterance.onstart = () => {
      this.isPlaying.set(true);
    };
    utterance.onboundary = (event) => {
      const elapsedSeconds = event.elapsedTime / 1000;
      this.currentTime.set(this.segmentStart(block.id, manifest) + elapsedSeconds);
      this.currentBlockId.set(block.id);
    };
    utterance.onend = () => {
      const nextIndex = blockIndex + 1;
      if (nextIndex < lesson.blocks.length && this.isPlaying()) {
        void this.playFromBlock(nextIndex, lesson, manifest);
        return;
      }

      this.isPlaying.set(false);
      this.currentTime.set(this.duration());
      this.currentBlockId.set(lesson.blocks[lesson.blocks.length - 1]?.id ?? null);
      this.utterance = null;
    };
    utterance.onerror = () => {
      this.isPlaying.set(false);
      this.errorMessage.set('O navegador nao conseguiu reproduzir a narracao.');
      this.utterance = null;
    };

    this.utterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  private resolveDuration(manifest: AudioManifest | null): number {
    return manifest?.segments.at(-1)?.end ?? 0;
  }

  private segmentStart(blockId: string, manifest: AudioManifest): number {
    return manifest.segments.find((segment) => segment.blockId === blockId)?.start ?? 0;
  }

  private stripMarkdown(markdown: string): string {
    return markdown
      .replace(/^##\s+/gm, '')
      .replace(/^- /gm, '')
      .replace(/\n+/g, ' ')
      .trim();
  }

  private formatTime(value: number): string {
    const safe = Math.max(0, Math.floor(value));
    const minutes = Math.floor(safe / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (safe % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
}
