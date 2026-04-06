# Fulldev School

Implementação do frontend e da publicação local do guia de tecnologia.

## Organização

- `app/`: aplicação Angular
- `mock-db/navigation/`: árvore da navegação
- `mock-db/doc/`: conteúdo publicado para consumo da app
- `mock-db/audio/`: reservado para uma retomada futura do áudio guiado

## Como a app funciona hoje

- a app carrega a árvore em `mock-db/navigation/tree.json`
- a rota `/` resolve o primeiro documento da árvore
- a rota `/:slug` abre a página correspondente
- o Markdown é carregado via `HttpClient`
- cada seção `##` vira um bloco expansível no corpo da página

## Interface atual

- shell com menu lateral expansível
- toolbar enxuta
- página de leitura com hero, breadcrumb, blocos expansíveis e navegação anterior/próxima
- tipografia padronizada com `Inter`
- paleta escura com acento vermelho
- painéis retos, sem sombras padrão do Material
- itens laterais com labels abreviados quando necessário para caber em uma linha

## Status do áudio

O áudio guiado está fora da interface por enquanto. A estrutura relacionada foi desacoplada do fluxo principal para manter o foco na documentação e na leitura.

## Pendências relevantes

- corrigir encoding restante em alguns `.md`
- revisar textos documentais herdados
- decidir se `mock-db/doc` continuará sendo espelho manual ou gerado por script
