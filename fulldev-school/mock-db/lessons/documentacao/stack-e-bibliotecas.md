---
id: stack-bibliotecas
slug: stack-bibliotecas
title: 5 - Stack e Bibliotecas
section: documentacao
order: 5
previousLessonId: arquitetura-frontend
nextLessonId: modelo-conteudo
estimatedReadingMinutes: 6
---

# 5 - Stack e Bibliotecas

## angular

Angular com standalone components e roteamento moderno.

Motivos principais:

- boa estrutura para app maior
- otimo encaixe com layout de portal educacional
- roteamento forte
- ecossistema maduro para componentes

## angular-material-e-cdk

`@angular/material` e `@angular/cdk`.

Motivos principais:

- componentes estaveis
- acessibilidade
- base pronta para drawer, toolbar, tabs, menu e navegacao
- CDK ajuda em arvore, overlays e padroes de interacao

## markdown

`ngx-markdown`.

Motivos principais:

- integracao madura com Angular
- suporte a standalone
- parsing de Markdown para HTML
- possibilidade de custom renderer

## audio

Bibliotecas previstas no documento original:

- `howler.js` para playback
- `speak-tts` para TTS de navegador
- `wavesurfer.js` para waveform e sincronizacao visual

## validacao-de-dados

`zod` como camada de validacao do mock-db.

## recomendacao-pratica

Construir a arquitetura preparada para mais de um modo de audio, sem acoplar a interface a uma unica estrategia.
