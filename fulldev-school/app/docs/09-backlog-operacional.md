# 9. Backlog Operacional

## Objetivo

Organizar a execucao da Fulldev School em blocos priorizados, separando o que ja esta entregue, o que esta em consolidacao e o que entra na proxima fase.

Criterio de leitura:

- `Pronto`: ja existe no codigo e deve ser preservado, refinado ou usado como base
- `Em andamento`: ja existe parcialmente, mas ainda precisa fechamento funcional, tecnico ou visual
- `Proximo`: ainda nao foi consolidado e deve entrar na sequencia de execucao

---

## Pronto

### 1. Plataforma base em Angular 21

Status operacional:

- app em Angular 21 com standalone components, Signals e Angular Material
- rotas principais de legal, catalogo, conta e curso estruturadas
- shell do curso e shell da plataforma separados

Entregaveis ja existentes:

- navegacao principal
- leitura por rota
- estrutura visual base da plataforma

Criterio de aceite:

- manter compatibilidade com a arquitetura atual
- evitar regressao das rotas `/courses`, `/courses/:courseSlug`, `/courses/:courseSlug/modules/:moduleSlug` e `/courses/:courseSlug/lessons/:lessonSlug`

### 2. Conteudo via `mock-db`

Status operacional:

- conteudo consumido a partir de `mock-db/navigation/tree.json` e `mock-db/doc`
- parsing de frontmatter e Markdown funcionando
- separacao por blocos `##` implementada

Entregaveis ja existentes:

- arvore de navegacao
- leitura por `slug`
- relacao anterior/proximo

Criterio de aceite:

- preservar o `mock-db` como fonte transitoria
- nao hardcodar conteudo na UI

### 3. Gate inicial de autenticacao

Status operacional:

- login com Google e LinkedIn implementado
- estado intermediario de autenticacao antes do redirect OAuth implementado
- fluxo de completar perfil OAuth em wizard implementado
- base de integracao com Supabase disponivel
- persistencia complementar em `profiles` e `leads` conectada

Entregaveis ja existentes:

- bloqueio visual da app para usuario nao autenticado
- leitura de configuracao via runtime config e environment
- suporte a `profiles` e `leads` no Supabase

Criterio de aceite:

- manter autenticacao funcional sem expor `service_role`
- preservar fallback seguro quando `profiles` ou `leads` ainda nao existirem

### 4. Estrutura de progresso local

Status operacional:

- check de curso, modulo e licao existe
- estado armazenado em `localStorage`
- percentuais ja sao usados em partes da UI

Entregaveis ja existentes:

- `CourseProgressService`
- botoes de concluir em modulo e licao
- leitura de status na conta e no catalogo

Criterio de aceite:

- tratar a implementacao atual como base temporaria
- nao considerar o requisito encerrado enquanto nao houver persistencia alinhada ao usuario autenticado

---

## Em andamento

### 1. Persistencia correta do check de cursos, modulos e licoes

Objetivo:

- ajustar a forma como os checks de progresso funcionam para deixar de ser apenas local e passar a ser persistido de forma confiavel

Escopo operacional:

- revisar o modelo atual de `CourseProgressService`
- definir chave de persistencia por usuario autenticado
- decidir transicao entre `localStorage` temporario e persistencia remota
- evitar inconsistencia entre check de licao, modulo e curso
- recalcular conclusao de modulo e curso a partir do estado real das licoes

Entregaveis:

- regra unica de conclusao
- persistencia consistente por usuario
- UI refletindo estado real apos reload e novo login

Criterio de aceite:

- usuario autenticado volta e encontra seus checks preservados
- curso concluido nao depende de marcacao manual isolada em conflito com as licoes
- modulo concluido reflete as licoes concluidas ou a regra oficial definida

### 2. Preload skeleton para o projeto todo

Objetivo:

- sair do skeleton isolado da pagina de licao e padronizar estados de carregamento em toda a experiencia

Escopo operacional:

- mapear telas sem loading consistente
- definir padrao visual unico para skeleton
- aplicar em catalogo, dashboard, conta, modulo, curso e leitura
- separar loading de conteudo, loading de autenticacao e loading de configuracao

Entregaveis:

- componente ou padrao compartilhado de skeleton
- cobertura de loading nas principais rotas
- reducao de tela vazia durante bootstrap e troca de rota

Criterio de aceite:

- nenhuma tela principal deve piscar vazia antes de carregar
- skeleton precisa ser visualmente coerente com a identidade atual
- loading nao deve deslocar layout de forma brusca

### 3. Ajustes pendentes de UI

Objetivo:

- fechar a camada visual ainda inconsistente da plataforma e do fluxo de curso

Escopo operacional:

- revisar placeholders de video
- revisar hierarquia visual de dashboard, catalogo, modulos e conta
- revisar labels truncados e abreviacoes da sidebar
- revisar alinhamento, espacamento e consistencia de botoes de acao
- revisar warnings de style budget em `lesson-page.component.ts` e `app.scss`

Entregaveis:

- interface mais consistente entre plataforma e curso
- reducao de areas com cara de placeholder
- padronizacao visual dos estados de acao, loading e conclusao

Criterio de aceite:

- telas principais com acabamento visual consistente
- sem elementos com aparencia provisoria onde o fluxo ja esta ativo
- style budget revisado ou justificado tecnicamente

### 4. Alinhamento documental com o estado real da app

Objetivo:

- manter a documentacao aderente ao que esta implementado

Escopo operacional:

- continuar removendo descricoes antigas de rotas e comportamento
- refletir Angular 21, plataforma `/courses`, papel transitorio do `mock-db` e fluxo atual de autenticacao
- registrar decisoes de produto sobre admin e instrutor

Entregaveis:

- documentacao tecnica coerente com o codigo
- backlog vivo de execucao

Criterio de aceite:

- documentos principais sem drift relevante em relacao a implementacao

---

## Proximo

### 1. Navegacao real para links internos estilo Obsidian

Objetivo:

- transformar links `[[...]]` em navegacao real da plataforma

Escopo operacional:

- mapear slug de destino a partir do conteudo
- substituir `href="#"` por rota valida
- tratar casos com alias e links quebrados

Entregaveis:

- parser de links internos integrado a navegacao
- fallback explicito para referencias nao resolvidas

Criterio de aceite:

- links internos navegam para paginas validas
- conteudo legado nao quebra renderizacao

### 2. Correcao de encoding e revisao editorial final

Objetivo:

- eliminar caracteres corrompidos e ruidos herdados dos Markdown e da documentacao

Escopo operacional:

- revisar arquivos com encoding quebrado
- corrigir textos visiveis na UI e docs
- validar consistencia de acentuacao e nomenclatura

Entregaveis:

- base editorial limpa
- UI sem strings corrompidas

Criterio de aceite:

- ausencia de caracteres quebrados nos fluxos principais
- textos revisados nas paginas mais acessadas

### 3. Dashboard e catalogo menos placeholder

Objetivo:

- substituir blocos genericos por funcionalidades reais de plataforma

Escopo operacional:

- definir cards e atalhos reais para home
- exibir progresso, retomada e recomendacoes
- enriquecer catalogo com status, capa, contexto e entrada no curso

Entregaveis:

- home util
- catalogo mais informativo

Criterio de aceite:

- dashboard com funcao operacional real
- catalogo deixando de ser apenas estrutura inicial

### 4. Evolucao da camada de conteudo alem do `mock-db`

Objetivo:

- preparar a migracao gradual do conteudo para backend real

Escopo operacional:

- definir modelo de dados para cursos, modulos, licoes e permissoes
- definir backoffice administrativo
- definir area de instrutor com escopo restrito aos proprios cursos
- planejar migracao sem quebrar a leitura atual

Entregaveis:

- blueprint tecnico da camada administrativa
- estrategia de migracao

Criterio de aceite:

- backlog tecnico fechado para admin e instrutor
- contrato de dados definido antes de remover o `mock-db`

### 5. Retomada futura do audio guiado

Objetivo:

- reativar o audio quando a base principal de conteudo, progresso e UI estiver estavel

Escopo operacional:

- decidir entre TTS, audio pronto ou modo hibrido
- avaliar Coqui TTS e referencias futuras registradas em `docs/05-audio-e-narracao.md`
- reintroduzir player sem poluir o fluxo de leitura
- persistir progresso de audio quando a feature voltar

Entregaveis:

- estrategia validada para player
- plano de implementacao desacoplado da leitura principal

Criterio de aceite:

- audio volta como feature real, nao como placeholder

---

## Ordem pratica de execucao

### Bloco 1

- persistencia correta do check de cursos, modulos e licoes
- preload skeleton para o projeto todo
- ajustes pendentes de UI nas telas ja ativas

### Bloco 2

- links internos estilo Obsidian
- correcao de encoding e revisao editorial final
- dashboard e catalogo com funcao real

### Bloco 3

- desenho da area administrativa
- desenho da area de instrutor
- plano de migracao do `mock-db` para backend real
