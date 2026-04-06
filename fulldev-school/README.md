# Fulldev School

Fulldev School é a futura experiência frontend do guia da FullDev.

A proposta é transformar o conteúdo editorial deste repositório em uma aplicação Angular guiada, com:

- navegação em árvore
- leitura progressiva por etapa
- breadcrumbs
- player de áudio por página
- destaque sincronizado de trechos durante a narração
- suporte a conteúdo em formato estruturado, tratado como um banco de dados mockado

## Objetivo desta pasta

Esta pasta existe para concentrar a fundação técnica do produto:

- documentação de arquitetura
- decisões de stack
- modelo de conteúdo
- estratégia de áudio
- exemplos iniciais do banco de dados mockado

## Estrutura inicial

- `docs/`: documentação técnica e arquitetural
- `mock-db/`: conteúdo estruturado, navegação, metadados e manifestos de áudio
- `app/`: aplicação Angular

## Estado atual

V1 de planejamento técnico.

Já existe uma base funcional da aplicação Angular com:

- app shell responsivo
- sidebar lateral
- dark mode / light mode
- carregamento de lição a partir do `mock-db`
- player fixo no rodapé usando TTS como primeira versão

## Como rodar a aplicação

```bash
cd fulldev-school/app
npm install
npm start
```

Depois, abra:

```text
http://localhost:4200
```
