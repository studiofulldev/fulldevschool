# 1. Visão do Produto

## Nome

Fulldev School

## Resumo

Fulldev School será a versão frontend guiada do conteúdo deste repositório.

Em vez de consumir o guia apenas como notas e documentos, a pessoa poderá navegar por uma experiência mais orientada, com cara de plataforma educacional:

- árvore de conteúdo
- leitura por etapas
- progresso
- áudio de acompanhamento
- sincronização entre texto e narração

## Problema que o produto resolve

Hoje o conteúdo está muito forte editorialmente, mas ainda depende de leitura manual e navegação por documentos.

Isso cria limitações para:

- consumo em mobile
- experiência mais visual
- acompanhamento com áudio
- retenção por leitura guiada
- futuras features de progresso, favoritos e trilhas personalizadas

Além disso, o início da jornada de muita gente hoje é travado por medo de substituição por IA, confusão sobre mercado e dúvida sobre ainda valer a pena entrar na área. O produto precisa enfrentar esse tema logo no começo, sem hype e sem fatalismo.

## Objetivo principal

Transformar o guia em uma aplicação web educacional com navegação clara, boa legibilidade e suporte a áudio.

Também é objetivo do produto reforçar a IA como ferramenta de apoio transversal para estudo, prática, revisão e produtividade.

## Objetivos da V1

- renderizar o conteúdo em Angular
- navegar por árvore e breadcrumbs
- carregar páginas a partir do `mock-db` como fonte transitória da interface
- reproduzir áudio por página
- preparar sincronização entre áudio e blocos de texto
- abrir a jornada com uma etapa clara sobre IA, mercado, medo e oportunidade

## Fora da V1

- backend real com gestão de usuários e cursos
- área administrativa para gerenciar usuários e cursos
- área de instrutor para cadastrar e editar cursos pertencentes ao próprio instrutor
- CMS real
- analytics avançado
- comentários
- geração automática de áudio no servidor

## Princípios do produto

- leitura simples primeiro
- arquitetura escalável desde a base
- conteúdo desacoplado da interface
- áudio como apoio, não como enfeite
- inteligência artificial tratada como ferramenta de apoio, não como atalho mágico nem como sentença de substituição
- baixo atrito para evoluir depois para site público
