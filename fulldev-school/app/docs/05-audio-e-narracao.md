# 5. Audio e Narracao

## Objetivo

Dar ao usuario a opcao de acompanhar a leitura com audio, sem depender de uma implementacao improvisada dentro do componente.

## Modos suportados pela arquitetura

### 1. TTS em tempo real

Opcoes previstas:

- `speechSynthesis` do navegador
- motores TTS externos avaliados futuramente

Uso:

- prototipo
- testes rapidos
- paginas sem audio gravado

Vantagens:

- acelera MVP
- dispensa pipeline inicial de geracao

Limitacoes:

- depende das vozes do navegador ou de integracao externa
- qualidade pode variar
- sincronizacao de blocos fica menos previsivel

### 2. Audio pre-gerado

Biblioteca prevista para playback:

- `howler.js`

Uso:

- produto mais solido
- paginas importantes
- experiencia mais controlada

Vantagens:

- experiencia consistente
- mais previsibilidade para sincronizacao
- melhor base para acessibilidade

Limitacoes:

- exige processo de geracao de audio
- aumenta volume de assets

## Referencias futuras de TTS

Estas referencias foram registradas para avaliacao tecnica quando a frente de audio voltar a ser priorizada:

- Coqui TTS: https://github.com/coqui-ai/TTS
- Video de referencia enviado pelo time: https://www.youtube.com/watch?v=C6QNcdVu3b8

Uso recomendado dessas referencias:

- avaliar pipeline local de geracao de voz
- comparar qualidade, custo operacional e tempo de resposta
- decidir se o projeto vai para TTS sob demanda, pre-geracao, ou modelo hibrido

## Criterios de avaliacao para TTS futuro

Quando esta frente for retomada, validar pelo menos:

- qualidade natural da voz em portugues
- tempo de geracao por bloco ou por licao
- facilidade de automacao no ambiente do projeto
- custo de infraestrutura
- tamanho final dos audios gerados
- possibilidade de versionar ou cachear saidas
- compatibilidade com sincronizacao por `blockId`

## Sincronizacao de texto

A sincronizacao vai depender de `segments` no manifesto.

Cada segmento aponta:

- `blockId`
- `start`
- `end`

Exemplo:

```json
{
  "segments": [
    { "blockId": "intro", "start": 0.0, "end": 11.2 },
    { "blockId": "mitos", "start": 11.2, "end": 27.6 }
  ]
}
```

## Comportamentos esperados do player

- play
- pause
- seek
- controle de velocidade
- avanco para proxima pagina
- retomada do ultimo ponto

## Componentes previstos

- `audio-player-shell`
- `audio-progress-bar`
- `audio-speed-control`
- `lesson-audio-sync`

## Regras tecnicas

- a UI nao deve saber de onde o audio veio
- a UI so consome um `AudioManifest`
- o player precisa ter modo `tts` e modo `prerecorded`

## Estrategia recomendada de implementacao

### Fase 1

- player funcional
- suporte a TTS simples para prototipo
- suporte a manifesto sem sincronizacao fina

### Fase 2

- avaliacao pratica de Coqui TTS ou stack equivalente
- definicao de pipeline de geracao
- audio por pagina
- sincronizacao por bloco

### Fase 3

- waveform opcional com `wavesurfer.js`
- resume automatico
- progresso persistido
- decisao final entre TTS sob demanda e audio pre-gerado
