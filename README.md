# Guia de Tecnologia

Repositório do guia editorial da FullDev com uma aplicação Angular para navegação, leitura e consulta do conteúdo em Markdown.

## Estado atual

- o conteúdo principal fica em `doc/`
- a aplicação Angular fica em `fulldev-school/app`
- a app consome uma cópia publicada da documentação em `fulldev-school/mock-db/doc`
- a navegação lateral usa a estrutura de `fulldev-school/mock-db/navigation/tree.json`
- cada página é carregada por `slug`
- cada seção interna do Markdown com `##` vira um bloco expansível na leitura
- os painéis do menu lateral e do conteúdo usam visual reto, sem sombra padrão do Material

## Produto atual

O projeto hoje não é mais um reader estilo Speechify. O fluxo principal é um guia navegável de entrada na área de tecnologia, com:

- menu lateral por tópicos
- páginas renderizadas a partir de `.md`
- skeleton de carregamento
- navegação entre páginas anterior e próxima
- visual alinhado ao projeto `D:\\Repo\\fulldev\\front`

## Estrutura

- `doc/`: fonte principal da documentação
- `fulldev-school/mock-db/doc/`: espelho usado pela aplicação no frontend
- `fulldev-school/mock-db/navigation/tree.json`: árvore da navegação
- `fulldev-school/app/`: aplicação Angular

## Decisões atuais

- o áudio guiado foi adiado
- a `player-bar` foi removida da interface
- a home da app abre pela rota `/`
- a sidebar abre seções por painel expansível
- o conteúdo da página abre subtópicos por painéis expansíveis simples
- a UI usa `Inter` como tipografia base
- os títulos do menu lateral podem ser abreviados para manter uma linha só

## Pontos em aberto

- revisar encoding dos arquivos Markdown que ainda têm caracteres corrompidos
- transformar links internos do estilo Obsidian em navegação real
- revisar ortografia final dos textos próprios da UI

## Execução

```bash
cd fulldev-school/app
npm install
npm start
```

Build:

```bash
cd fulldev-school/app
npm run build
```
