# 4. Modelo de Conteúdo

## Ideia central

O conteúdo vai funcionar como um banco de dados mockado.

Ou seja:

- nada fica hardcoded na interface
- tudo vem de arquivos estruturados
- o Angular só lê, valida e renderiza

## Unidades principais

### 1. Navigation Tree

Define:

- hierarquia
- ordem de leitura
- slugs
- labels
- ids

### 2. Lesson

Representa uma página consumível.

Deve conter:

- metadados
- markdown
- blocos identificáveis
- contexto de navegação

### 3. Audio Manifest

Representa:

- qual áudio tocar
- se a página usa TTS ou arquivo pronto
- segmentos sincronizados

### 4. Progress State

Na V1 pode ficar local.

Depois pode ir para API real.

## Estrutura sugerida de lesson

```json
{
  "id": "comece-aqui",
  "slug": "comece-aqui",
  "title": "2 - Comece Aqui",
  "section": "fundacao",
  "order": 2,
  "previousLessonId": "home",
  "nextLessonId": "fundamentos-digitais",
  "markdownPath": "lessons/fundacao/comece-aqui.md",
  "audioManifestPath": "audio/fundacao/comece-aqui.audio.json",
  "estimatedReadingMinutes": 8,
  "estimatedListeningMinutes": 7
}
```

## Estrutura sugerida de audio manifest

```json
{
  "mode": "prerecorded",
  "audioSrc": "/audio/fundacao/comece-aqui.mp3",
  "segments": [
    { "blockId": "intro", "start": 0, "end": 12.4 },
    { "blockId": "mercado", "start": 12.4, "end": 31.8 }
  ]
}
```

## Formas de modelar o texto

### Opção A

Guardar Markdown puro em arquivo `.md`.

### Opção B

Guardar um JSON com blocos e gerar a página.

## Decisão recomendada

Usar modelo híbrido:

- Markdown para conteúdo humano
- JSON para navegação, metadados e áudio

## Benefício do modelo híbrido

- edição editorial continua fácil
- frontend continua previsível
- áudio e sincronização não ficam presos ao parser de Markdown

## Regra de ouro

Cada bloco relevante do texto precisa ter um identificador estável.

Isso é o que vai permitir:

- sincronização de leitura
- destaque visual
- retomada de progresso
- comentários futuros
