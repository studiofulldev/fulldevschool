# Mapa do Repositorio - Overview Geral

## Como usar este documento

Este documento foi pensado para apresentacao ao vivo.

A ideia aqui nao e ser tecnico demais nem institucional demais.

Ele existe para te ajudar a explicar, com clareza:

- o que ja temos hoje
- o que este repositorio concentra
- o que ja esta em pe
- o que ainda e rascunho
- para onde queremos levar o projeto

## Frase simples para abrir a apresentacao

Hoje este repositorio ja concentra duas frentes principais:

- o primeiro curso da Fulldev School, que e um guia de entrada na area de tecnologia
- a base da plataforma que vai transformar esse guia em uma experiencia real de produto

Ou seja:
nao e so um monte de documento solto, e tambem nao e so uma aplicacao vazia esperando conteudo.

Ja temos conteudo, ja temos estrutura, ja temos plataforma, e agora estamos organizando isso para virar uma experiencia educacional mais completa.

## O que este repositorio e hoje

Hoje este repositorio funciona como:

- base editorial do primeiro curso
- base de produto da plataforma Fulldev School
- base tecnica da experiencia autenticada
- base de navegacao entre modulos e licoes
- base de evolucao para novos cursos, novos autores e novos fluxos

## O que ja temos hoje de forma concreta

### 1. Ja temos um primeiro curso

O primeiro curso e o guia de entrada na area de tecnologia.

Ele foi pensado para quem ainda esta tentando entender:

- como entrar na area
- quais caminhos existem
- o que estudar primeiro
- como nao se perder em excesso de conteudo
- como escolher uma direcao inicial com mais clareza

Esse curso hoje nao e um curso tecnico de uma stack especifica.

Ele funciona mais como:

- onboarding de carreira
- guia de orientacao
- base de repertorio
- ponte entre curiosidade e escolha consciente

### 2. Ja temos uma plataforma web funcional

Nao estamos partindo do zero.

Ja existe uma aplicacao Angular que:

- autentica usuario
- protege rotas
- exibe catalogo
- exibe area de conta
- abre o curso
- navega por modulo e licao
- renderiza o conteudo em Markdown

Entao, quando falamos de construir a plataforma, nao estamos falando de uma ideia abstrata.

Ja existe uma fundacao real em funcionamento.

### 3. Ja temos a separacao entre conteudo e interface

Esse e um ponto importante para explicar para o time.

Hoje o conteudo nao nasce hardcoded dentro dos componentes da interface.

A logica atual ja separa:

- conteudo
- navegacao
- experiencia visual

Isso significa que o projeto ja esta sendo construindo com uma mentalidade de escala.

## Como o repositorio esta organizado

### `doc/`

Aqui esta a base editorial principal.

O que existe nessa pasta:

- o primeiro guia
- modulos do curso
- textos-base
- recursos complementares
- anexos e templates

O que voce pode dizer em live:

"Essa pasta e onde mora a espinha dorsal do primeiro curso. E daqui que sai a narrativa, a estrutura dos modulos, os topicos e a base do que sera apresentado ao aluno."

### `fulldev-school/app/`

Aqui esta a aplicacao Angular da plataforma.

O que existe nessa pasta:

- paginas
- rotas
- guards
- services
- shells da plataforma
- tela de curso
- tela de conta
- autenticacao
- renderizacao do conteudo

O que voce pode dizer em live:

"Essa pasta e a camada de produto. E onde o conteudo deixa de ser apenas documento e passa a virar experiencia de plataforma."

### `fulldev-school/mock-db/`

Aqui esta a fonte transitoria consumida pela app.

Hoje ela guarda:

- arvore de navegacao
- documentos publicados para a interface
- estruturas auxiliares de conteudo
- base reservada para audio futuro

O que voce pode dizer em live:

"Hoje ainda nao estamos usando um CMS ou painel administrativo final. Entao essa camada funciona como uma publicacao local que alimenta a app enquanto o produto amadurece."

### `fulldev-school/app/docs/`

Aqui esta a documentacao tecnica do frontend e do produto.

Hoje ja existe documentacao sobre:

- visao do produto
- arquitetura do frontend
- stack e bibliotecas
- modelo de conteudo
- autenticacao
- backlog operacional
- setup de Supabase
- politicas e termos

O que voce pode dizer em live:

"Nao estamos construindo isso no improviso. Ja existe uma base documental para produto, arquitetura e operacao."

### `supabase/`

Aqui esta a base de apoio para autenticacao e persistencia.

O que voce pode dizer em live:

"A plataforma ja esta sendo pensada com autenticacao real e com uma camada futura de persistencia e administracao."

## O que temos dentro do primeiro curso

Hoje a base inicial do primeiro guia contempla estes modulos:

- visao geral do guia
- comece aqui
- fundamentos digitais
- fundamentos de tecnologia
- como aprender
- mapa das areas
- teste de perfil
- comparando caminhos
- escolha sua trilha
- projetos e portfolio
- mercado de trabalho
- mentalidade e consistencia
- comunidade e networking
- glossario
- recursos curados
- faq do iniciante
- painel de progresso

## Como explicar o primeiro curso

Uma forma simples de descrever esse primeiro curso e:

"O primeiro curso nao tenta ensinar uma tecnologia isolada. Ele organiza a entrada da pessoa no universo da tecnologia. Ele ajuda a pessoa a entender o ambiente, comparar caminhos, aprender a estudar e escolher uma trilha com mais maturidade."

## O que temos de plataforma hoje

Hoje a plataforma ja possui base para:

- login social com Google e LinkedIn
- reconhecimento de sessao
- protecao de rotas
- area de plataforma
- catalogo de cursos
- area de conta
- experiencia de curso
- leitura de licoes em Markdown
- navegacao lateral por estrutura de curso
- navegacao entre paginas
- fluxo complementar de perfil social
- progresso local inicial

## O que ainda e rascunho ou transitorio

Essa parte e importante para deixar o time alinhado.

Nem tudo esta fechado.

Hoje ainda estao em fase de rascunho, consolidacao ou transicao:

- parte da linguagem editorial final
- ordem e profundidade final de alguns modulos
- refinamento visual da plataforma
- persistencia real de progresso por usuario
- camada administrativa final
- area de instrutor
- substituicao futura do `mock-db`
- estrategia final de audio

## O que eu posso dizer com transparencia para a equipe

Voce pode falar algo nessa linha:

"Hoje a gente ja tem uma base real. Nao estamos no campo da ideia. Ja existe um primeiro curso estruturado, ja existe uma plataforma funcional e ja existe uma direcao tecnica clara. Ao mesmo tempo, ainda estamos em uma fase de lapidacao. Algumas partes ainda sao base inicial, outras estao em consolidacao, e outras entram como proxima fase do projeto."

## Backlog geral do projeto

## Bloco 1 - Consolidar o que ja existe

Meta:
fazer a base atual ficar estavel, coerente e pronta para crescer.

Itens principais:

- revisar a UX geral da plataforma
- reduzir telas com cara de placeholder
- ajustar home e catalogo
- melhorar consistencia visual entre plataforma e curso
- finalizar estados de loading
- corrigir textos quebrados e problemas de encoding
- alinhar documentacao com o estado real da app

Resultado esperado:
uma base mais limpa, confiavel e apresentavel.

## Bloco 2 - Fortalecer o primeiro curso

Meta:
transformar o guia inicial em um produto editorial mais forte e mais claro.

Itens principais:

- revisar linguagem do curso
- fechar melhor a narrativa entre os modulos
- validar o papel de cada secao
- aprofundar os topicos mais importantes
- priorizar trilhas derivadas
- consolidar o material de apoio

Resultado esperado:
um primeiro curso forte o suficiente para funcionar como porta de entrada oficial.

## Bloco 3 - Melhorar a experiencia do aluno

Meta:
fazer a plataforma parecer menos prototipo e mais produto.

Itens principais:

- persistencia correta de progresso por usuario
- retomada de leitura mais consistente
- melhor leitura de estado do curso
- dashboard mais util
- catalogo mais informativo
- fluxo de autenticacao mais fluido
- experiencia de conta mais clara

Resultado esperado:
uma experiencia mais solida para quem entra, consome e volta para continuar estudando.

## Bloco 4 - Preparar a camada operacional real

Meta:
tirar o projeto da dependencia de uma estrutura transitoria de publicacao local.

Itens principais:

- definir modelo real de dados
- preparar migracao alem do `mock-db`
- estruturar backoffice
- consolidar Supabase como base de autenticacao e persistencia
- definir contratos de dados de curso, modulo, licao e progresso

Resultado esperado:
base preparada para escala, administracao e manutencao real.

## Bloco 5 - Abrir a plataforma para crescimento

Meta:
fazer a Fulldev School deixar de ser apenas um curso inicial e virar estrutura de plataforma.

Itens principais:

- suportar novos cursos
- suportar area de instrutor
- suportar fluxo de revisao e aprovacao de cursos
- suportar area administrativa
- suportar gestao de usuarios e papeis

Resultado esperado:
plataforma preparada para multiplos conteudos e multiplos atores.

## Metas do projeto

## Meta 1 - Curto prazo

Entregar uma base estavel do primeiro curso com plataforma funcional, autenticacao, navegacao e leitura bem resolvidas.

## Meta 2 - Medio prazo

Transformar a base atual em um produto educacional consistente, com progresso real, melhor onboarding e mais confianca para escalar.

## Meta 3 - Longo prazo

Transformar a Fulldev School em uma plataforma capaz de hospedar varios cursos, varios fluxos de aprendizagem e diferentes perfis de usuario.

## BHAGs do projeto

BHAG aqui e a ambicao grande, nao a tarefa da semana.

## BHAG 1

Construir uma plataforma educacional que ajude iniciantes a entrarem na area de tecnologia com mais clareza, menos ruido e mais direcao real.

## BHAG 2

Fazer a Fulldev School sair de um unico guia inicial e virar um ecossistema de cursos, trilhas e experiencias de aprendizagem conectadas.

## BHAG 3

Criar uma base de produto e conteudo que permita escala sem perder consistencia editorial nem qualidade de experiencia.

## BHAG 4

Criar uma plataforma em que conteudo, tecnologia e operacao possam crescer juntos, sem depender de reconstruir tudo a cada nova fase.

## O que eu ainda pretendo fazer

Hoje, alem de consolidar o que existe, a direcao que faz mais sentido e:

- fortalecer o primeiro curso
- deixar a plataforma mais redonda
- estruturar a camada real de administracao
- permitir crescimento para novos cursos
- criar base para instrutores e operacao de conteudo

## Resumo final para fechar a live

Se voce quiser fechar em um tom simples e forte, pode usar algo nessa linha:

"Hoje a gente ja tem uma base real de conteudo e uma base real de plataforma. O primeiro curso ja existe como estrutura, a plataforma ja existe como fundacao e o repositorio ja mostra com clareza para onde queremos ir. O proximo passo nao e inventar do zero. O proximo passo e consolidar, lapidar e escalar."

## Observacao final

Este documento representa um overview vivo.

Alguns itens ainda vao mudar de ordem, prioridade ou profundidade.

Mas, para apresentar o projeto hoje, esta e uma fotografia honesta, transparente e suficientemente completa do que temos e do que queremos construir.
