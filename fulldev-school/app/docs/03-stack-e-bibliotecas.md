# 3. Stack e Bibliotecas

## Angular

### Escolha

Angular com standalone components e roteamento moderno.

### Motivo

- boa estrutura para app maior
- ótimo encaixe com layout de portal educacional
- roteamento forte
- ecossistema maduro para componentes

### Fonte

- Angular overview: https://angular.dev/overview
- Angular local setup: https://angular.dev/tools/cli/setup-local

## Angular Material + CDK

### Escolha

`@angular/material` e `@angular/cdk`

### Motivo

- componentes estáveis
- acessibilidade
- base pronta para drawer, toolbar, tabs, menu e navegação
- CDK ajuda em árvore, overlays e padrões de interação

### Fonte

- Angular Components: https://github.com/angular/components
- Angular Material docs: https://material.angular.dev/

## Markdown

### Escolha

`ngx-markdown`

### Motivo

- integração madura com Angular
- suporte a standalone
- parsing de Markdown para HTML
- possibilidade de custom renderer
- boa base para syntax highlight e extensões futuras

### Fonte

- https://github.com/jfcere/ngx-markdown

## Áudio

### Playback

#### Escolha

`howler.js`

#### Motivo

- abstrai diferenças de áudio entre navegadores
- API simples
- robusto para player customizado

### TTS de navegador para protótipo

#### Escolha

`speak-tts`

#### Motivo

- encapsula a Speech Synthesis API
- melhor do que falar direto com a API nativa em todos os componentes
- útil para gerar narração de protótipo enquanto não existe pipeline definitivo

### Visualização e sincronização

#### Escolha

`wavesurfer.js`

#### Motivo

- waveform opcional
- boa base para exibir progresso e regiões
- útil caso a sincronização por segmentos evolua para UX mais rica

### Fontes

- speak-tts npm: https://www.npmjs.com/package/speak-tts
- howler npm: https://www.npmjs.com/package/howler
- wavesurfer docs: https://wavesurfer.xyz/

## Validação de dados

### Escolha

`zod`

### Motivo

- valida o conteúdo do `mock-db`
- protege contra quebra de estrutura
- ajuda a inferir tipos em TypeScript

### Fonte

- https://zod.dev/

## Decisão importante sobre TTS

Na V1, vamos separar duas estratégias:

### 1. Narração gerada em tempo real

Boa para protótipo rápido.

Fluxo:

- carregar texto
- quebrar em blocos
- gerar fala no navegador via `speak-tts`

### 2. Áudio pronto por página

Melhor para produto real.

Fluxo:

- página aponta para arquivo de áudio
- player usa `howler.js`
- manifesto sincroniza tempo com blocos do texto

## Recomendação prática

Construir a arquitetura já preparada para os dois modos.

Assim, a interface não fica presa a uma única estratégia de áudio.
