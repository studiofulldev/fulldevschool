# 2. Arquitetura Frontend

## Stack-base

- Angular com standalone APIs
- Angular Router
- Angular Material + CDK
- `ngx-markdown` para renderização de Markdown
- `howler.js` para playback de áudio
- `speak-tts` como camada de TTS em navegador para protótipos e fallback
- `wavesurfer.js` para evolução de waveform e sincronização visual
- `zod` para validar os dados do banco mockado

## Estrutura arquitetural proposta

```text
fulldev-school/
  docs/
  mock-db/
    navigation/
    lessons/
    audio/
    schemas/
  app/                  <- futura app Angular
```

## Camadas do frontend

### 1. App Shell

Responsável por:

- layout principal
- sidebar em árvore
- header
- breadcrumbs
- área de conteúdo
- player fixo de áudio

### 2. Camada de Navegação

Responsável por:

- ler a árvore do `mock-db`
- montar rotas amigáveis
- identificar etapa anterior e próxima
- expor metadados para breadcrumbs

### 3. Camada de Conteúdo

Responsável por:

- buscar lições no `mock-db`
- validar o payload
- renderizar o Markdown
- mapear blocos renderizados com `blockId`

### 4. Camada de Áudio

Responsável por:

- carregar manifesto de áudio da página
- tocar, pausar, retomar e controlar velocidade
- sincronizar o tempo atual com os blocos renderizados

### 5. Camada de Estado Local

Responsável por:

- progresso local
- página atual
- preferências de reprodução
- último ponto de leitura

## Estratégia de dados

A V1 não depende de API real.

O conteúdo vai sair do `mock-db`, tratado como fonte única da interface.

Isso permite:

- evoluir rápido
- validar a UX
- mudar o backend depois sem reescrever a interface inteira

## Estratégia de rotas

Formato sugerido:

```text
/trilha/comece-aqui
/trilha/fundamentos-digitais
/trilha/fundamentos-tecnologia
```

Cada rota resolve:

- metadados da página
- documento Markdown
- manifesto de áudio
- contexto de navegação

## Estratégia de composição

Componentes principais previstos:

- `app-shell`
- `sidebar-tree`
- `breadcrumb-trail`
- `lesson-page`
- `lesson-markdown`
- `audio-player`
- `reading-progress`
- `lesson-navigation`

## Diretriz importante

O conteúdo não deve nascer dentro dos componentes Angular.

A UI deve consumir o conteúdo como dado.
