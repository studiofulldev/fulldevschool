---
id: app-fulldev-school
slug: app-fulldev-school
title: 8 - App Fulldev School
section: implementacao
order: 8
previousLessonId: audio-narracao
nextLessonId: mock-db
estimatedReadingMinutes: 4
---

# 8 - App Fulldev School

## objetivo

Entregar a experiencia guiada da Fulldev School com:

- leitura guiada do conteudo editorial via mock-db
- audio por blocos usando a voz do navegador
- navegacao por arvore e rota de licoes

## stack

- Angular 19+
- standalone components
- Signals
- Speech Synthesis API do navegador

## componentes-esperados

- `SchoolContentService`
- `LessonPageComponent`
- `AudioNarrationService`

## direcao-de-implementacao

- usar `ChangeDetectionStrategy.OnPush`
- manter a Fulldev School como fluxo principal
- usar `speechSynthesis` no player das licoes
- evoluir a navegacao e a leitura guiada sem acoplar conteudo na UI
