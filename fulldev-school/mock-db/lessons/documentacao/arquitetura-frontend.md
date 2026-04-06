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
- `marked` para renderizacao de Markdown

## estrutura-arquitetural-proposta

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

## camadas-do-frontend

### 1-app-shell

- layout principal
- sidebar em arvore
- header
- breadcrumbs
- area de conteudo
- barra fixa de progresso de leitura
- persistencia da expansao da navegacao

### 2-camada-de-navegacao

- ler a arvore do mock-db
- montar rotas amigaveis
- identificar etapa anterior e proxima
- expor metadados para breadcrumbs

### 3-camada-de-conteudo

- buscar licoes no mock-db
- renderizar o Markdown
- mapear blocos renderizados com `blockId`
- persistir expansao dos blocos por licao
- compor elementos especiais da visao geral, como boas-vindas e arvore customizada
- renderizar `lesson__video-slot` apenas em blocos de conteudo elegiveis

## regra-de-video-por-bloco

- a licao inicial nao deve renderizar `lesson__video-slot` nos paines de conteudo
- na visao geral, o unico video permitido fica no painel `Boas-vindas`
- nas demais licoes, o `lesson__video-slot` aparece abaixo da explicacao do bloco
- o slot de video nao deve aparecer em `Proxima acao pratica`
- o slot de video nao deve aparecer em `Referencias por topico e videos sugeridos`
- o slot de video nao deve aparecer em `Topicos do roadmap e videos sugeridos`
- o slot de video nao deve aparecer em `Verificacao por topico`
- o slot de video nao deve aparecer em `Bibliografia`

## diretriz-importante

O conteudo nao deve nascer dentro dos componentes Angular.

A UI deve consumir o conteudo como dado.
