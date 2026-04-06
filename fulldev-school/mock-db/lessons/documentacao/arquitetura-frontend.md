---
id: arquitetura-frontend
slug: arquitetura-frontend
title: 4 - Arquitetura Frontend
section: documentacao
order: 4
previousLessonId: visao-produto
nextLessonId: stack-bibliotecas
estimatedReadingMinutes: 6
---

# 4 - Arquitetura Frontend

## stack-base

- Angular com standalone APIs
- Angular Router
- Angular Material e CDK
- `ngx-markdown` para renderizacao de Markdown
- `howler.js` para playback de audio
- `speak-tts` como camada de TTS em navegador para prototipos e fallback
- `wavesurfer.js` para evolucao de waveform e sincronizacao visual
- `zod` para validar os dados do banco mockado

## estrutura-arquitetural-proposta

```text
fulldev-school/
  docs/
  mock-db/
    navigation/
    lessons/
    audio/
    schemas/
  app/
```

## camadas-do-frontend

### 1-app-shell

- layout principal
- sidebar em arvore
- header
- breadcrumbs
- area de conteudo
- player fixo de audio

### 2-camada-de-navegacao

- ler a arvore do mock-db
- montar rotas amigaveis
- identificar etapa anterior e proxima
- expor metadados para breadcrumbs

### 3-camada-de-conteudo

- buscar licoes no mock-db
- validar o payload
- renderizar o Markdown
- mapear blocos renderizados com `blockId`

### 4-camada-de-audio

- carregar manifesto de audio da pagina
- tocar, pausar, retomar e controlar velocidade
- sincronizar o tempo atual com os blocos renderizados

## diretriz-importante

O conteudo nao deve nascer dentro dos componentes Angular.

A UI deve consumir o conteudo como dado.
