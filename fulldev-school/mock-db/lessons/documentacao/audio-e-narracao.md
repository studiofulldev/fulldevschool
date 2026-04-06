---
id: audio-narracao
slug: audio-narracao
title: 7 - Audio e Narracao
section: documentacao
order: 7
previousLessonId: modelo-conteudo
nextLessonId: app-fulldev-school
estimatedReadingMinutes: 5
---

# 7 - Audio e Narracao

## objetivo

Dar ao usuario a opcao de acompanhar a leitura com audio, sem depender de uma implementacao improvisada dentro do componente.

## modos-suportados-pela-arquitetura

### tts-em-tempo-real

Biblioteca prevista:

- `speak-tts`

Uso:

- prototipo
- testes rapidos
- paginas sem audio gravado

### audio-pre-gerado

Biblioteca prevista para playback:

- `howler.js`

Uso:

- produto mais solido
- paginas importantes
- experiencia mais controlada

## sincronizacao-de-texto

A sincronizacao depende de `segments` no manifesto.

Cada segmento aponta:

- `blockId`
- `start`
- `end`

## comportamentos-esperados-do-player

- play
- pause
- seek
- controle de velocidade
- avanco para proxima pagina
- retomada do ultimo ponto

## estrategia-recomendada

Fase 1:

- player funcional
- suporte a TTS
- suporte a manifesto sem sincronizacao fina

Fase 2:

- audio por pagina
- sincronizacao por bloco
