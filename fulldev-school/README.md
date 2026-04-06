# Fulldev School

Fulldev School é a futura experiência frontend do guia da FullDev.

A proposta é transformar o conteúdo editorial deste repositório em uma aplicação Angular guiada, com:

- navegação em árvore
- leitura progressiva por etapa
- breadcrumbs
- player de áudio por página
- destaque sincronizado de trechos durante a narração
- suporte a conteúdo em formato estruturado, tratado como um banco de dados mockado

Um dos primeiros assuntos da plataforma deve ser o medo de substituição por IA, tratado de forma prática e honesta. A linha editorial da Fulldev School deve reforçar a IA como ferramenta de apoio para estudo, pesquisa, revisão, simulação e produtividade ao longo de toda a jornada.

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
- underline sincronizado por bloco durante a leitura

## Diretriz editorial de IA

Na Fulldev School, inteligência artificial não entra como propaganda vazia nem como discurso apocalíptico.

Ela entra como:

- tema central de contexto de mercado
- ferramenta de apoio ao estudo
- copiloto para prática orientada
- camada transversal a todas as trilhas e áreas

## Voz mais natural

A aplicação agora suporta dois modos de voz:

- `Azure Neural Voice` quando houver configuração do Azure Speech
- `Voz do navegador` como fallback

Para habilitar Azure Speech em ambiente local, defina no navegador:

```js
window.__FULLDEV_SCHOOL_CONFIG__ = {
  azureSpeech: {
    key: 'SUA_CHAVE',
    region: 'SUA_REGION',
    voice: 'pt-BR-FranciscaNeural'
  }
}
```

Ou use `localStorage`:

```js
localStorage.setItem('fds.azure.key', 'SUA_CHAVE')
localStorage.setItem('fds.azure.region', 'SUA_REGION')
localStorage.setItem('fds.azure.voice', 'pt-BR-FranciscaNeural')
```

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
