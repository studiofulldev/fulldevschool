# 2. Arquitetura Frontend

## Stack-base

- Angular com standalone APIs
- Angular Router
- Angular Material + CDK
- `marked` para renderização de Markdown

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

Responsável por:

- layout principal
- sidebar principal da plataforma
- sidebar de curso com a mesma linguagem visual da plataforma
- header fixo
- área de conteúdo
- progresso visual de leitura
- persistência do estado de expansão da navegação
- remoção de footer no shell de curso para manter leitura direta
- `mat-expansion-panel` sem shadow por padrão em shell e conteúdo
- gate de autenticacao centralizado no componente raiz, com entrada por Google e LinkedIn
- estado intermediario de autenticacao durante o redirecionamento OAuth
- wizard de complemento de cadastro social com termos em popup e avatar default quando o provider nao envia foto
- padrao visual de botoes vermelhos reaproveitado entre plataforma e conteudo do curso

### 2. Camada de Navegação

Responsável por:

- ler a árvore do `mock-db`
- montar rotas amigáveis
- identificar etapa anterior e próxima
- expor metadados para breadcrumbs

### 3. Camada de Conteúdo

Responsável por:

- buscar lições no `mock-db`
- renderizar o Markdown
- mapear blocos renderizados com `blockId`
- persistir expansão dos blocos por lição no navegador
- renderizar componentes auxiliares por contexto, como o painel de boas-vindas com vídeo incorporado e a árvore expansível da visão geral

### 4. Camada de Estado Local

Responsável por:

- expansões persistidas em `localStorage`
- página atual
- progresso de leitura por scroll

## Estratégia de dados

A V1 não depende de API real.

O conteúdo vai sair do `mock-db`, tratado como fonte única da interface.

Isso permite:

- evoluir rápido
- validar a UX
- mudar o backend depois sem reescrever a interface inteira

## Estratégia de rotas

Formato atual:

```text
/courses
/courses/:courseSlug
/courses/:courseSlug/lessons/:lessonSlug
/courses/:courseSlug/modules/:moduleSlug
```

Cada rota resolve:

- metadados da página
- documento Markdown
- contexto de navegação
- redirecionamento automático do curso para a primeira lição disponível

## Estratégia de composição

Componentes principais previstos:

- `app-shell`
- `sidebar-tree`
- `breadcrumb-trail`
- `lesson-page`
- `reading-progress`
- `lesson-navigation`

## Diretriz importante

O conteúdo não deve nascer dentro dos componentes Angular.

A UI deve consumir o conteúdo como dado.
