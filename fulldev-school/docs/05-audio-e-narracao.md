# 5. Áudio e Narração

## Objetivo

Dar ao usuário a opção de acompanhar a leitura com áudio, sem depender de uma implementação improvisada dentro do componente.

## Modos suportados pela arquitetura

### 1. TTS em tempo real

Biblioteca prevista:

- `speak-tts`

Uso:

- protótipo
- testes rápidos
- páginas sem áudio gravado

Vantagens:

- acelera MVP
- dispensa pipeline inicial de geração

Limitações:

- depende das vozes do navegador
- qualidade pode variar
- sincronização de blocos fica menos previsível

### 2. Áudio pré-gerado

Biblioteca prevista para playback:

- `howler.js`

Uso:

- produto mais sólido
- páginas importantes
- experiência mais controlada

Vantagens:

- experiência consistente
- mais previsibilidade para sincronização
- melhor base para acessibilidade

Limitações:

- exige processo de geração de áudio
- aumenta volume de assets

## Sincronização de texto

A sincronização vai depender de `segments` no manifesto.

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
- avanço para próxima página
- retomada do último ponto

## Componentes previstos

- `audio-player-shell`
- `audio-progress-bar`
- `audio-speed-control`
- `lesson-audio-sync`

## Regras técnicas

- a UI não deve saber de onde o áudio veio
- a UI só consome um `AudioManifest`
- o player precisa ter modo `tts` e modo `prerecorded`

## Estratégia recomendada de implementação

### Fase 1

- player funcional
- suporte a `speak-tts`
- suporte a manifesto sem sincronização fina

### Fase 2

- `howler.js`
- áudio por página
- sincronização por bloco

### Fase 3

- waveform opcional com `wavesurfer.js`
- resume automático
- progresso persistido
