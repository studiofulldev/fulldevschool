# Fulldev School App

Aplicação Angular que renderiza o guia de tecnologia a partir de conteúdo Markdown.

## Stack

- Angular 19
- standalone components
- Signals
- Angular Material
- `marked` para renderização de Markdown

## Fluxo atual

- sidebar baseada na árvore de navegação
- cursos usam a mesma linguagem visual da sidebar principal da plataforma
- dentro de um curso, a sidebar mostra `Home` e o atalho do curso atual
- carregamento de páginas por `slug`
- renderização de conteúdo a partir de `mock-db/doc`
- skeleton durante carregamento
- blocos internos expansíveis por seção, com estado persistido no navegador
- sidebar com seções expansíveis, persistidas e labels abreviados quando necessário
- toolbar fixa com barra de progresso de leitura
- hero com contagem de tópicos, vídeos e tempo de leitura
- `/courses/:courseSlug` redireciona direto para a primeira lição
- visão geral com painel de boas-vindas com embed de vídeo e árvore expansível customizada
- `mat-expansion-panel` deve permanecer sem sombra em toda a interface
- o shell dos cursos não usa footer próprio

## Arquivos centrais

- `src/app/app.ts`
- `src/app/app.html`
- `src/app/app.scss`
- `src/app/pages/lesson-page.component.ts`
- `src/app/data/school-content.service.ts`

## Documentação técnica

- `docs/`: visão do produto, arquitetura, stack, modelo de conteúdo e estratégia de áudio

## Rodando localmente

```bash
npm install
npm start
```

## Build

```bash
npm run build
```

## Observações

- a interface de áudio está adiada
- o conteúdo depende de `fulldev-school/mock-db/doc`
- ainda existem arquivos `.md` com encoding a revisar
- existem warnings de style budget em `lesson-page.component.ts` e `app.scss`
