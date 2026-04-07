---
id: arquitetura-frontend
slug: arquitetura-frontend
title: 4 - Arquitetura Frontend
section: documentacao
order: 4
previousLessonId: visao-produto
nextLessonId: stack-bibliotecas
estimatedReadingMinutes: 6
---

# 4 - Arquitetura Frontend

## stack-base

- Angular com standalone APIs
- Angular Router
- Angular Material e CDK
- `marked` para renderizacao de Markdown

## estrutura-arquitetural-proposta

```text
fulldev-school/
  app/
    docs/
  mock-db/
    navigation/
    lessons/
    audio/
    schemas/
```

## estrutura-de-experiencia

O frontend passa a ter duas camadas principais:

- camada de plataforma
- camada dentro do curso

A camada de plataforma cobre:

- catalogo centralizado de cursos
- gate global de autenticacao
- conta
- progresso consolidado

A camada dentro do curso reaproveita a base atual:

- navegacao lateral
- navegacao superior
- licoes
- modulos
- progresso por bloco e modulo

## camadas-do-frontend

### 1-app-shell

- layout principal
- shell da plataforma
- shell do curso
- sidebar em arvore
- header
- header visual no drawer com a logo completa centralizada
- breadcrumbs
- area de conteudo
- barra fixa de progresso de leitura
- persistencia da expansao da navegacao
- atualizacao centralizada de SEO tecnico por rota

## regra-do-header-lateral

- o `mat-drawer-inner-container` deve ter um header proprio acima da navegacao
- esse header deve ter a mesma altura visual da `mat-toolbar`
- a imagem da marca deve aparecer completa, centralizada e com `object-fit: contain`
- a logo pode variar conforme o tema, mas o enquadramento deve permanecer estavel

## regra-da-plataforma

- a entrada principal da aplicacao nao deve cair direto em uma licao
- a pessoa deve conseguir ver um hub de cursos antes de entrar no conteudo
- a plataforma deve bloquear o uso quando o usuario estiver deslogado
- o login deve acontecer em modal obrigatorio com fundo embaçado
- o modal de autenticacao nao pode ser fechado manualmente antes do login
- deve existir acesso claro para a area da conta
- o visual geral deve continuar simples e clean
- a navegacao lateral e superior continuam sendo o padrao dentro do curso
- o header da plataforma deve ficar fixo no topo, como no shell do curso
- a sidebar da plataforma deve iniciar retraida e expandir apenas com hover no desktop
- a logo completa da FullDev deve aparecer no topo da sidebar da plataforma

## regra-do-toggle-lateral

- no desktop, deve existir um botao vertical ao lado da sidebar para expandir e retrair o menu
- esse botao deve ocupar a altura total da viewport
- o controle deve ficar visualmente discreto, com largura reduzida e sem destaque de cor quente
- o hover deve usar o mesmo tom de superficie de `lesson__body`
- o estado expandido da sidebar deve persistir localmente

### 2-camada-de-navegacao

- ler a arvore do mock-db
- montar rotas amigaveis
- identificar etapa anterior e proxima
- expor metadados para breadcrumbs
- expor contexto para canonical, breadcrumbs estruturados e schema por pagina

## regra-de-rotas

- devem existir rotas de plataforma separadas das rotas de conteudo
- exemplos esperados:
  - home de cursos
  - conta
  - pagina de curso
  - pagina de licao
- o shell de curso deve ser ativado apenas quando a pessoa entra em um curso
- a autenticacao nao deve depender de rota dedicada de login

## regra-de-seo

- cada pagina deve atualizar `title`, `description`, `canonical` e metas sociais dinamicamente
- a home e as licoes devem publicar `JSON-LD` com `WebSite`, `BreadcrumbList` e `LearningResource` ou `CollectionPage`
- o `lang` principal da aplicacao deve ser `pt-BR`
- o `title` nao deve repetir o nome da secao quando titulo e secao forem equivalentes
- a descricao de cada licao deve ser derivada do proprio conteudo, sem texto generico repetido
- o projeto deve expor arquivos publicos para crawler e IA, incluindo `robots.txt` e `llms.txt`
- a estrategia editorial de SEO deve refletir o posicionamento do projeto como guia completo para entrar na area de tecnologia
- favicon, apple touch icon e imagens de compartilhamento devem usar as logos oficiais do projeto

## regra-da-navegacao-superior

- cada conteudo deve ter uma navegacao minimalista no topo, alem da navegacao completa do rodape
- essa navegacao deve ficar abaixo do breadcrumb, em container proprio
- o bloco superior deve ser compacto, com tipografia pequena e baixa hierarquia visual
- os links devem expor apenas `Anterior` e `Proximo`, com icones proporcionais
- o estilo do container deve seguir a mesma linguagem visual de `lesson__body`, mas com espacamento mais enxuto

### 3-camada-de-conteudo

- buscar licoes no mock-db
- renderizar o Markdown
- mapear blocos renderizados com `blockId`
- persistir expansao dos blocos por licao
- compor elementos especiais da visao geral, como boas-vindas e arvore customizada
- renderizar `lesson__video-slot` apenas em blocos de conteudo elegiveis
- renderizar ao final da licao um painel fixo de `Apoio de conteudo` com cards de contribuidores

## regra-de-video-por-bloco

- a licao inicial nao deve renderizar `lesson__video-slot` nos paines de conteudo
- na visao geral, o unico video permitido fica no painel `Boas-vindas`
- nas demais licoes, o `lesson__video-slot` aparece abaixo da explicacao do bloco
- o slot de video nao deve aparecer em `Proxima acao pratica`
- o slot de video nao deve aparecer em `Referencias por topico e videos sugeridos`
- o slot de video nao deve aparecer em `Topicos do roadmap e videos sugeridos`
- o slot de video nao deve aparecer em `Verificacao por topico`
- o slot de video nao deve aparecer em `Bibliografia`

## regra-de-expansao-inicial

- por padrao, os paineis expansivos de conteudo devem iniciar fechados
- a unica excecao global e o painel `Resumo`, que deve iniciar aberto
- na licao `Visao Geral do Guia`, o painel `Resumo` nao abre automaticamente
- na licao `Visao Geral do Guia`, o painel `Boas-vindas` e o unico que deve iniciar aberto

## regra-de-apoio-de-conteudo

- toda licao deve terminar com um painel chamado `Apoio de conteudo`
- esse painel lista cards de contribuidores que ajudaram a alimentar os videos e referencias da pagina
- cada card deve seguir fluxo vertical
- primeiro vem a imagem ou avatar ocupando toda a largura util do card
- a midia deve respeitar proporcao `1:1`
- abaixo da imagem ficam nome e cargo
- por ultimo ficam os icones de redes sociais ou links associados
- a lista de contribuidores deve ser centralizada no frontend, para evitar duplicacao no markdown

## regra-da-estrutura-do-projeto

- no bloco `Estrutura do projeto`, a visualizacao deve seguir o fluxo real do conteudo do projeto
- `Visao Geral` deve aparecer no topo, centralizada, como ponto inicial
- abaixo dela, a sequencia deve continuar a partir de `E HAJA LUZ!`
- as demais etapas devem seguir em cadeia vertical, uma abaixo da outra, com conectores visuais
- em `Mapa das Areas`, os grupos principais devem aparecer lado a lado
- os subtopicos dentro desses grupos devem ficar em coluna
- os itens que possuem subtopicos devem ser expansivos
- os cards dos subtopicos devem manter alinhamento no topo, texto alinhado a esquerda e largura minima de `220px`
- quando o container for maior que `220px`, os subtopicos devem ocupar `100%` da largura disponivel

## diretriz-importante

O conteudo nao deve nascer dentro dos componentes Angular.

A UI deve consumir o conteudo como dado.
