import { Injectable, computed, effect, inject, signal } from '@angular/core';
import SpeakTts from 'speak-tts';
import { Howl } from 'howler';
import {
  AudioManifest,
  LessonBlock,
  LessonContent,
  SchoolContentService
} from '../data/school-content.service';
import { RuntimeConfigService } from './runtime-config.service';

type AudioEngine = 'azure' | 'browser' | 'prerecorded' | 'none';

@Injectable({ providedIn: 'root' })
export class AudioNarrationService {
  private readonly content = inject(SchoolContentService);
  private readonly config = inject(RuntimeConfigService);
  private readonly speaker = new SpeakTts();

  private howl: Howl | null = null;
  private browserVoice: string | null = null;
  private progressTimer: number | null = null;
  private speechReady = false;
  private currentBlockIndex = 0;
  private currentLessonId: string | null = null;
  private isPaused = false;
  private objectUrl: string | null = null;

  readonly isPlaying = signal(false);
  readonly isLoading = signal(false);
  readonly playbackRate = signal(1);
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly currentBlockId = signal<string | null>(null);
  readonly engine = signal<AudioEngine>('none');
  readonly errorMessage = signal<string | null>(null);

  readonly currentLabel = computed(() => this.content.currentLesson()?.meta.title ?? '');
  readonly progressPercent = computed(() => {
    const duration = this.duration();
    return duration > 0 ? (this.currentTime() / duration) * 100 : 0;
  });
  readonly currentTimeLabel = computed(() => this.formatTime(this.currentTime()));
  readonly durationLabel = computed(() => this.formatTime(this.duration()));
  readonly engineLabel = computed(() => {
    switch (this.engine()) {
      case 'azure':
        return 'Azure Neural Voice';
      case 'browser':
        return 'Voz do navegador';
      case 'prerecorded':
        return 'Audio gravado';
      default:
        return 'Sem audio';
    }
  });

  constructor() {
    effect(() => {
      const lesson = this.content.currentLesson();
      const manifest = this.content.currentAudio();

      this.resetState();

      if (!lesson || !manifest) {
        return;
      }

      this.currentLessonId = lesson.meta.id;
      this.duration.set(this.resolveDuration(manifest));
      this.currentBlockId.set(lesson.blocks[0]?.id ?? null);
      this.currentBlockIndex = 0;
      this.engine.set(this.resolveEngine(manifest));
    });
  }

  async togglePlayback(): Promise<void> {
    if (this.isLoading()) {
      return;
    }

    const lesson = this.content.currentLesson();
    const manifest = this.content.currentAudio();

    if (!lesson || !manifest) {
      return;
    }

    if (this.engine() === 'azure' || this.engine() === 'prerecorded') {
      await this.toggleHowlerPlayback(lesson, manifest);
      return;
    }

    await this.toggleBrowserPlayback(lesson, manifest);
  }

  async previous(): Promise<void> {
    if (this.engine() === 'azure' || this.engine() === 'prerecorded') {
      const target = Math.max(0, this.currentTime() - 10);
      await this.seekToSecond(target);
      return;
    }

    const lesson = this.content.currentLesson();
    if (!lesson) {
      return;
    }

    const nextIndex = Math.max(0, this.currentBlockIndex - 1);
    await this.playBrowserBlock(nextIndex, lesson, true);
  }

  async next(): Promise<void> {
    if (this.engine() === 'azure' || this.engine() === 'prerecorded') {
      const target = Math.min(this.duration(), this.currentTime() + 10);
      await this.seekToSecond(target);
      return;
    }

    const lesson = this.content.currentLesson();
    if (!lesson) {
      return;
    }

    const nextIndex = Math.min(lesson.blocks.length - 1, this.currentBlockIndex + 1);
    await this.playBrowserBlock(nextIndex, lesson, true);
  }

  async seekToRatio(ratio: number): Promise<void> {
    const target = this.duration() * ratio;
    await this.seekToSecond(target);
  }

  async seekToSecond(second: number): Promise<void> {
    const lesson = this.content.currentLesson();
    const manifest = this.content.currentAudio();

    if (!lesson || !manifest) {
      return;
    }

    if (this.engine() === 'azure' || this.engine() === 'prerecorded') {
      if (!this.howl) {
        await this.prepareHowlerSource(lesson, manifest);
      }

      if (this.howl) {
        this.howl.seek(second);
        this.currentTime.set(second);
        this.syncCurrentBlockFromTime(second, manifest);
      }
      return;
    }

    const blockIndex = this.findBlockIndexByTime(second, manifest, lesson.blocks);
    await this.playBrowserBlock(blockIndex, lesson, this.isPlaying());
    this.currentTime.set(second);
    this.syncCurrentBlockFromTime(second, manifest);
  }

  stop(): void {
    this.stopProgressTimer();
    this.isPlaying.set(false);
    this.isPaused = false;

    if (this.howl) {
      this.howl.stop();
    }

    this.speaker.cancel();
    this.currentTime.set(0);
    this.currentBlockId.set(this.content.currentLesson()?.blocks[0]?.id ?? null);
  }

  increaseRate(): void {
    this.playbackRate.set(Math.min(1.5, this.playbackRate() + 0.1));
    if (this.howl?.playing()) {
      this.howl.rate(this.playbackRate());
    }
  }

  decreaseRate(): void {
    this.playbackRate.set(Math.max(0.8, this.playbackRate() - 0.1));
    if (this.howl?.playing()) {
      this.howl.rate(this.playbackRate());
    }
  }

  private resolveEngine(manifest: AudioManifest): AudioEngine {
    if (manifest.mode === 'prerecorded' && manifest.audioSrc) {
      return 'prerecorded';
    }

    if (manifest.mode === 'tts' && this.config.azureSpeech) {
      return 'azure';
    }

    if (manifest.mode === 'tts') {
      return 'browser';
    }

    return 'none';
  }

  private async toggleHowlerPlayback(lesson: LessonContent, manifest: AudioManifest): Promise<void> {
    if (!this.howl || this.currentLessonId !== lesson.meta.id) {
      await this.prepareHowlerSource(lesson, manifest);
    }

    if (!this.howl) {
      return;
    }

    if (this.howl.playing()) {
      this.howl.pause();
      this.isPlaying.set(false);
      this.stopProgressTimer();
      return;
    }

    this.howl.rate(this.playbackRate());
    this.howl.play();
    this.isPlaying.set(true);
    this.startProgressTimer(manifest);
  }

  private async prepareHowlerSource(lesson: LessonContent, manifest: AudioManifest): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      let source = manifest.audioSrc;
      if (this.engine() === 'azure') {
        source = await this.synthesizeWithAzure(lesson);
      }

      if (!source) {
        throw new Error('Nenhuma fonte de áudio disponível para esta lição.');
      }

      this.destroyHowler();
      this.howl = new Howl({
        src: [source],
        html5: false,
        preload: true,
        onend: () => {
          this.isPlaying.set(false);
          this.stopProgressTimer();
          this.currentTime.set(this.duration());
        }
      });

      await new Promise<void>((resolve, reject) => {
        this.howl?.once('load', () => {
          const duration = this.howl?.duration() || this.resolveDuration(manifest);
          this.duration.set(duration);
          resolve();
        });
        this.howl?.once('loaderror', () => reject(new Error('Falha ao carregar o áudio.')));
      });
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Falha ao preparar o áudio.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async synthesizeWithAzure(lesson: LessonContent): Promise<string> {
    const azure = this.config.azureSpeech;
    if (!azure) {
      throw new Error('Azure Speech não configurado.');
    }

    const text = lesson.blocks.map((block) => this.stripMarkdown(block.markdown)).join(' ');
    const ssml = `
      <speak version="1.0" xml:lang="pt-BR">
        <voice name="${azure.voice || 'pt-BR-FranciscaNeural'}">
          <prosody rate="${this.playbackRate()}">${this.escapeXml(text)}</prosody>
        </voice>
      </speak>
    `.trim();

    const response = await fetch(
      `https://${azure.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azure.key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-160kbitrate-mono-mp3'
        },
        body: ssml
      }
    );

    if (!response.ok) {
      throw new Error('Falha ao sintetizar voz neural com Azure Speech.');
    }

    const audioData = await response.arrayBuffer();

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }

    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    this.objectUrl = URL.createObjectURL(blob);
    return this.objectUrl;
  }

  private async toggleBrowserPlayback(lesson: LessonContent, manifest: AudioManifest): Promise<void> {
    await this.ensureSpeechReady();

    if (this.isPaused) {
      this.speaker.resume();
      this.isPaused = false;
      this.isPlaying.set(true);
      return;
    }

    if (this.isPlaying()) {
      this.speaker.pause();
      this.isPaused = true;
      this.isPlaying.set(false);
      return;
    }

    const startIndex = this.findBlockIndexByTime(this.currentTime(), manifest, lesson.blocks);
    await this.playBrowserBlock(startIndex, lesson, true);
  }

  private async playBrowserBlock(index: number, lesson: LessonContent, autoplay: boolean): Promise<void> {
    const manifest = this.content.currentAudio();
    const block = lesson.blocks[index];
    if (!manifest || !block) {
      return;
    }

    this.currentBlockIndex = index;
    this.currentBlockId.set(block.id);
    this.currentTime.set(this.getSegmentStart(block.id, manifest));

    if (!autoplay) {
      this.isPlaying.set(false);
      return;
    }

    this.speaker.cancel();
    this.isPaused = false;
    this.isPlaying.set(true);

    await this.speaker.speak({
      text: this.stripMarkdown(block.markdown),
      queue: false,
      rate: this.playbackRate(),
      pitch: 1,
      voice: this.browserVoice || undefined,
      listeners: {
        onboundary: (event: SpeechSynthesisEvent) => {
          const elapsedSeconds = event.elapsedTime / 1000;
          const currentTime = this.getSegmentStart(block.id, manifest) + elapsedSeconds;
          this.currentTime.set(currentTime);
          this.currentBlockId.set(block.id);
        },
        onend: () => {
          const nextIndex = index + 1;
          if (nextIndex < lesson.blocks.length && this.isPlaying()) {
            void this.playBrowserBlock(nextIndex, lesson, true);
          } else {
            this.isPlaying.set(false);
            this.currentTime.set(this.duration());
          }
        }
      }
    });
  }

  private async ensureSpeechReady(): Promise<void> {
    if (this.speechReady) {
      return;
    }

    const result = await this.speaker.init({
      volume: 1,
      lang: 'pt-BR',
      rate: 1,
      pitch: 1,
      splitSentences: true
    });

    const voices = Array.isArray(result.voices) ? result.voices : [];
    const preferredVoice = voices
      .filter((voice: SpeechSynthesisVoice) => voice.lang?.toLowerCase().startsWith('pt-br'))
      .sort((a: SpeechSynthesisVoice, b: SpeechSynthesisVoice) =>
        this.voiceScore(b.name) - this.voiceScore(a.name)
      )[0];

    if (preferredVoice?.name) {
      this.browserVoice = preferredVoice.name;
      this.speaker.setVoice(preferredVoice.name);
    }

    this.speechReady = true;
  }

  private voiceScore(name: string): number {
    const normalized = name.toLowerCase();
    let score = 0;
    if (normalized.includes('natural')) score += 5;
    if (normalized.includes('microsoft')) score += 4;
    if (normalized.includes('google')) score += 3;
    if (normalized.includes('online')) score += 2;
    if (normalized.includes('francisca')) score += 3;
    if (normalized.includes('luciana')) score += 2;
    return score;
  }

  private startProgressTimer(manifest: AudioManifest): void {
    this.stopProgressTimer();
    this.progressTimer = window.setInterval(() => {
      if (!this.howl) {
        return;
      }

      const currentTime = Number(this.howl.seek() || 0);
      this.currentTime.set(currentTime);
      this.syncCurrentBlockFromTime(currentTime, manifest);
    }, 120);
  }

  private stopProgressTimer(): void {
    if (this.progressTimer) {
      window.clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  private syncCurrentBlockFromTime(currentTime: number, manifest: AudioManifest): void {
    const match = [...manifest.segments].reverse().find(
      (segment) => currentTime >= segment.start && currentTime <= segment.end + 0.25
    );

    this.currentBlockId.set(match?.blockId ?? manifest.segments[0]?.blockId ?? null);
  }

  private findBlockIndexByTime(time: number, manifest: AudioManifest, blocks: LessonBlock[]): number {
    const blockId =
      [...manifest.segments].reverse().find((segment) => time >= segment.start)?.blockId ??
      manifest.segments[0]?.blockId;
    const index = blocks.findIndex((block) => block.id === blockId);
    return index >= 0 ? index : 0;
  }

  private getSegmentStart(blockId: string, manifest: AudioManifest): number {
    return manifest.segments.find((segment) => segment.blockId === blockId)?.start ?? 0;
  }

  private resolveDuration(manifest: AudioManifest): number {
    return manifest.segments.at(-1)?.end ?? 0;
  }

  private stripMarkdown(markdown: string): string {
    return markdown
      .replace(/^#+\s?/gm, '')
      .replace(/[-*]\s/g, '')
      .replace(/\n+/g, ' ')
      .trim();
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private resetState(): void {
    this.stop();
    this.currentTime.set(0);
    this.duration.set(0);
    this.currentBlockId.set(null);
    this.errorMessage.set(null);
  }

  private destroyHowler(): void {
    if (this.howl) {
      this.howl.unload();
      this.howl = null;
    }
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
