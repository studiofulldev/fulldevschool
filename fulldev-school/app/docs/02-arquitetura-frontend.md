# 2. Arquitetura Frontend

## Stack-base

- Angular com standalone APIs
- Angular Router
- Angular Material + CDK
- `marked` para renderizacao de Markdown

## Estrutura arquitetural proposta

```text
fulldev-school/
  app/
    docs/
  mock-db/
    navigation/
    lessons/
    audio/
    schemas/
```

## Camadas do frontend

### 1. App Shell

Responsavel por:

- layout principal
- sidebar principal da plataforma
- sidebar de curso com a mesma linguagem visual da plataforma
- header fixo
- area de conteudo
- progresso visual de leitura
- persistencia do estado de expansao da navegacao
- remocao de footer no shell de curso para manter leitura direta
- `mat-expansion-panel` sem shadow por padrao em shell e conteudo
- rota dedicada de login com entrada por Google e LinkedIn
- estado intermediario de autenticacao durante o redirecionamento OAuth
- wizard de complemento de cadastro social em rota protegida, com termos e avatar default quando o provider nao envia foto
- padrao visual de botoes vermelhos reaproveitado entre plataforma e conteudo do curso

### 2. Camada de Navegacao

Responsavel por:

- ler a arvore do `mock-db`
- montar rotas amigaveis
- identificar etapa anterior e proxima
- expor metadados para breadcrumbs

### 3. Camada de Conteudo

Responsavel por:

- buscar licoes no `mock-db`
- renderizar o Markdown
- mapear blocos renderizados com `blockId`
- persistir expansao dos blocos por licao no navegador
- renderizar componentes auxiliares por contexto, como o painel de boas-vindas com video incorporado e a arvore expansivel da visao geral

### 4. Camada de Estado Local

Responsavel por:

- expansoes persistidas em `localStorage`
- pagina atual
- progresso de leitura por scroll

## Estrategia de dados

A V1 nao depende de API real.

O conteudo vai sair do `mock-db`, tratado como fonte unica da interface.

Isso permite:

- evoluir rapido
- validar a UX
- mudar o backend depois sem reescrever a interface inteira

## Estrategia de rotas

Formato atual:

```text
/courses
/courses/:courseSlug
/courses/:courseSlug/lessons/:lessonSlug
/courses/:courseSlug/modules/:moduleSlug
```

Cada rota resolve:

- metadados da pagina
- documento Markdown
- contexto de navegacao
- redirecionamento automatico do curso para a primeira licao disponivel

## Rotas (V2 / fluxo de produto)

O fluxo novo (wireframe) usa um shell dedicado em `/app/*` e organiza as telas por `features/` com lazy loading.

Formato:

```text
/app/home
/app/courses
/app/courses/:courseSlug
/app/courses/:courseSlug/content
/app/mentoring
/app/mentoring/:mentorId
/app/profile
```

Diretrizes:

- manter V1 (`/courses/*`) enquanto o V2 evolui
- `features/shared/ui` concentra componentes reutilizÃ¡veis (header, empty state, loading)

## Estrategia de composicao

Componentes principais previstos:

- `app-shell`
- `sidebar-tree`
- `breadcrumb-trail`
- `lesson-page`
- `reading-progress`
- `lesson-navigation`

## Diretriz importante

O conteudo nao deve nascer dentro dos componentes Angular.

A UI deve consumir o conteudo como dado.

## Regra de arquivos de componente

Para manter rastreabilidade e reduzir acoplamento visual com logica:

- `shells` devem usar `templateUrl` e `styleUrl`
- `pages` com markup relevante ou CSS relevante devem usar `templateUrl` e `styleUrl`
- componentes inline ficam restritos a casos pequenos e locais
- quando um `.ts` mistura logica, HTML e CSS de tela, ele deve ser extraido

Aplicacao ja feita nesta fase:

- `app.ts` foi separado em `app.component.html` e `app.component.scss`
- `platform-shell.component.ts` foi separado em `platform-shell.component.html` e `platform-shell.component.scss`

Pendencia ainda aberta:

- ainda existem `pages` grandes inline e isso deve continuar sendo reduzido nas proximas refatoracoes
