# Fulldev School App

Aplicação Angular da `Fulldev School`.

## Objetivo

Entregar a experiência guiada da `Fulldev School` com:

- leitura guiada do conteúdo editorial via `mock-db`
- áudio por blocos usando a voz do navegador
- navegação por árvore e rota de lições

## Stack

- Angular 19+
- standalone components
- Signals
- Speech Synthesis API do navegador

## Componentes esperados

- `SchoolContentService`
- `LessonPageComponent`
- `AudioNarrationService`

## Rodando localmente

```bash
npm install
npm start
```

Abra `http://localhost:4200`.

## Direção de implementação

- usar `ChangeDetectionStrategy.OnPush`
- manter a `Fulldev School` como fluxo principal
- usar `speechSynthesis` no player das lições
- evoluir a navegação e a leitura guiada sem acoplar conteúdo na UI
