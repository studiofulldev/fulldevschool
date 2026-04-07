---
id: estrutura-repositorio
slug: estrutura-repositorio
title: 2 - Estrutura do Repositorio
section: documentacao
order: 2
previousLessonId: home
nextLessonId: visao-produto
estimatedReadingMinutes: 3
---

# 2 - Estrutura do Repositorio

## resumo

Esta pasta concentra a documentacao e a implementacao da Fulldev School, agora pensada como plataforma de cursos da FullDev.

## estrutura-atual

- `app/`: aplicacao Angular
- `app/docs/`: visao do produto, arquitetura, stack, modelo de conteudo e estrategia de audio
- `mock-db/`: arvore de navegacao, licoes e manifestos de audio

## documento-operacional-novo

Para a fase de plataforma, o documento central de execucao passa a ser:

- `mock-db/lessons/documentacao/arquitetura-da-plataforma.md`

## direcao-de-plataforma

A estrutura atual representa principalmente a camada `dentro do curso`.

Ou seja:

- navegacao lateral
- navegacao superior
- licao
- modulo
- progresso local

Sobre essa base, a plataforma deve ganhar mais camadas:

- hub centralizado de cursos
- autenticacao
- conta do usuario
- persistencia de progresso em backend real
- integracao futura com outros sistemas da FullDev

## direcao-de-backend

Como o primeiro produto a sair sera a School, o backend inicial pode nascer em `Supabase`.

Esse backend deve servir como base para:

- autenticacao com email e Google
- perfis de usuario
- progresso por curso e modulo
- catalogo de cursos
- futura reutilizacao por outros sistemas da FullDev

## direcao-tecnica

- fluxo principal orientado a conteudo
- navegacao por slug
- licoes renderizadas a partir do mock-db
- audio guiado por blocos com `speechSynthesis`
- app centrada na jornada editorial da Fulldev School
- UI simples e clean
