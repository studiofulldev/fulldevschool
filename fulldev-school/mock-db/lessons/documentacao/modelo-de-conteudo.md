---
id: modelo-conteudo
slug: modelo-conteudo
title: 6 - Modelo de Conteudo
section: documentacao
order: 6
previousLessonId: stack-bibliotecas
nextLessonId: audio-narracao
estimatedReadingMinutes: 5
---

# 6 - Modelo de Conteudo

## ideia-central

O conteudo funciona como um banco de dados mockado.

Ou seja:

- nada fica hardcoded na interface
- tudo vem de arquivos estruturados
- o Angular so le, valida e renderiza

## unidades-principais

### navigation-tree

Define hierarquia, ordem de leitura, slugs, labels e ids.

### lesson

Representa uma pagina consumivel.

Deve conter:

- metadados
- markdown
- blocos identificaveis
- contexto de navegacao

### audio-manifest

Representa:

- qual audio tocar
- se a pagina usa TTS ou arquivo pronto
- segmentos sincronizados

### progress-state

Na V1 pode ficar local. Depois pode ir para API real.

## decisao-recomendada

Usar modelo hibrido:

- Markdown para conteudo humano
- JSON para navegacao, metadados e audio

## regra-de-ouro

Cada bloco relevante do texto precisa ter um identificador estavel.

Isso permite sincronizacao de leitura, destaque visual, retomada de progresso e comentarios futuros.
