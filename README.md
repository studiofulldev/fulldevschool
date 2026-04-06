# PRD - Speechify-like Reader (Angular 19 + HeadTTS)

## Objetivo

Criar um leitor de texto frontend estilo Speechify, com:

- leitura fluida com TTS neural local
- highlight sincronizado palavra por palavra
- scroll automático
- controles de reprodução
- experiência moderna e responsiva

Sem backend, sem API key e 100% browser.

## Stack

- Angular 19+ com standalone components
- Signals para estado reativo
- HeadTTS com `webgpu` e `wasm`
- Web Worker para processamento de TTS
- HTML e CSS modernos com UX estilo Medium

## Biblioteca principal

- HeadTTS
  Repo: https://github.com/met4citizen/HeadTTS

## Inicialização do TTS

```ts
import { HeadTTS } from 'headtts';

const tts = new HeadTTS({
  endpoints: ['webgpu', 'wasm'],
  languages: ['en-us'],
  voices: ['af_bella']
});

await tts.load();
```

## Arquitetura

### 1. `TtsEngineAdapter`

Responsável por:

- inicializar o HeadTTS
- gerar áudio
- retornar timestamps de fonemas

```ts
generateAudio(text: string): Promise<{
  audioBuffer: AudioBuffer;
  phonemes: Phoneme[];
}>
```

### 2. `ReadingSessionService`

Responsável por:

- texto atual
- lista de palavras
- palavra atual
- estado de reprodução
- sincronização entre áudio e texto

```ts
currentWordIndex = signal(0);
isPlaying = signal(false);
```

### 3. `ReaderComponent`

Responsável por:

- renderizar palavras
- aplicar highlight
- scroll automático
- expor a UI de controle

## Tokenização

```ts
function tokenize(text: string): string[] {
  return text.split(/\s+/);
}
```

## Renderização

```html
<div class="reader">
  <span
    *ngFor="let word of words; let i = index"
    [class.active]="i === currentWordIndex()"
    #wordEl
  >
    {{ word }}
  </span>
</div>
```

## Highlight sincronizado

Estratégia:

- usar timestamps do HeadTTS
- mapear fonemas para palavras

```ts
function mapPhonemesToWords(phonemes, words) {
  // agrupar fonemas por palavra
}
```

## Loop de sincronização

```ts
function sync(audio: HTMLAudioElement) {
  function loop() {
    const currentTime = audio.currentTime;

    updateCurrentWord(currentTime);

    requestAnimationFrame(loop);
  }

  loop();
}
```

## Auto scroll

```ts
activeElement.scrollIntoView({
  behavior: 'smooth',
  block: 'center'
});
```

## Controles

- play
- pause
- resume
- stop
- velocidade entre `0.75x` e `1.5x`

## Performance

- `ChangeDetectionStrategy.OnPush`
- Signals no lugar de RxJS para o estado central
- evitar re-render completo
- atualizar apenas a palavra ativa

## Fallback

Se o HeadTTS falhar:

```ts
speechSynthesis.speak(
  new SpeechSynthesisUtterance(text)
);
```

## UX

Experiência inspirada em Speechify:

- palavra atual com destaque
- underline ou background na palavra ativa
- leitura fluida
- scroll automático
- layout limpo tipo Medium

## Desafios

- carregamento do modelo com feedback de loading
- sincronização precisa de fonema para palavra
- textos grandes
- performance em tempo real

## Diferenciais opcionais

- highlight progressivo em estilo karaokê
- clicar para pular para um trecho
- salvar progresso
- dark mode

## Entrega esperada

- `TtsEngineAdapter` completo
- `ReadingSessionService` funcional
- `ReaderComponent` pronto
- exemplo funcional rodando
