---
id: mock-db
slug: mock-db
title: 9 - Mock DB
section: implementacao
order: 9
previousLessonId: app-fulldev-school
estimatedReadingMinutes: 3
---

# 9 - Mock DB

## resumo

Esta pasta guarda a camada de dados fake da Fulldev School.

Ela existe para simular o backend antes de existir uma API real.

## objetivo

Permitir que o frontend Angular seja construido consumindo dados estruturados desde o comeco.

## areas-principais

- `navigation/`: arvore do conteudo
- `lessons/`: markdown das paginas
- `audio/`: manifestos de audio e referencias de assets
- `schemas/`: esquemas e contratos esperados

## regra

O frontend nao deve depender da estrutura solta da raiz do repositorio.

Ele deve consumir o conteudo a partir desta pasta.
