# 9. Backlog Operacional

## Objetivo

Organizar a execução da Fulldev School em blocos priorizados, separando o que já está entregue, o que está em consolidação e o que vem na próxima fase operacional.

Critério de leitura:

- `Pronto`: já existe no código e deve ser preservado, refinado ou usado como base.
- `Em andamento`: já existe parcialmente, mas ainda precisa fechamento funcional, técnico ou visual.
- `Próximo`: ainda não foi consolidado e deve entrar na sequência de execução.

---

## Pronto

### 1. Plataforma base em Angular 21

Status operacional:

- app em Angular 21 com standalone components, Signals e Angular Material
- rotas principais de legal, catálogo, conta e curso já estruturadas
- shell do curso e shell da plataforma já separados

Entregáveis já existentes:

- navegação principal
- leitura por rota
- estrutura visual base da plataforma

Critério de aceite:

- manter compatibilidade com a arquitetura atual
- evitar regressão das rotas `/courses`, `/courses/:courseSlug`, `/courses/:courseSlug/modules/:moduleSlug` e `/courses/:courseSlug/lessons/:lessonSlug`

### 2. Conteúdo via `mock-db`

Status operacional:

- conteúdo consumido a partir de `mock-db/navigation/tree.json` e `mock-db/doc`
- parsing de frontmatter e Markdown já funcionando
- separação por blocos `##` já implementada

Entregáveis já existentes:

- árvore de navegação
- leitura por `slug`
- relação anterior/próximo

Critério de aceite:

- preservar o `mock-db` como fonte transitória
- não hardcodar conteúdo na UI

### 3. Gate inicial de autenticação

Status operacional:

- login com Google e LinkedIn já implementado
- fluxo de completar perfil OAuth já implementado
- base de integração com Supabase já disponível

Entregáveis já existentes:

- bloqueio da app para usuário não autenticado
- leitura de configuração via runtime config e environment
- suporte a `profiles` no Supabase

Critério de aceite:

- manter autenticação funcional sem expor `service_role`
- preservar fallback seguro quando a tabela `profiles` ainda não existir

### 4. Estrutura de progresso local

Status operacional:

- check de curso, módulo e lição já existe
- estado armazenado em `localStorage`
- percentuais já são usados em partes da UI

Entregáveis já existentes:

- `CourseProgressService`
- botões de concluir em módulo e lição
- leitura de status na conta e no catálogo

Critério de aceite:

- tratar a implementação atual como base temporária
- não considerar o requisito encerrado enquanto não houver persistência alinhada ao usuário autenticado

---

## Em andamento

### 1. Persistência correta do check de cursos, módulos e lições

Objetivo:

- ajustar a forma como os checks de progresso funcionam para que o estado deixe de ser apenas local e passe a ser persistido de forma confiável

Escopo operacional:

- revisar o modelo atual de `CourseProgressService`
- definir chave de persistência por usuário autenticado
- decidir transição entre `localStorage` temporário e persistência remota
- evitar inconsistência entre check de lição, módulo e curso
- recalcular conclusão de módulo e curso a partir do estado real das lições

Entregáveis:

- regra única de conclusão
- persistência consistente por usuário
- UI refletindo estado real após reload e novo login

Critério de aceite:

- usuário autenticado volta e encontra seus checks preservados
- curso concluído não depende de marcação manual isolada em conflito com as lições
- módulo concluído reflete as lições concluídas ou a regra oficial definida

### 2. Preload skeleton para o projeto todo

Objetivo:

- sair do skeleton isolado da página de lição e padronizar estados de carregamento em toda a experiência

Escopo operacional:

- mapear telas sem loading consistente
- definir padrão visual único para skeleton
- aplicar em catálogo, dashboard, conta, módulo, curso e leitura
- separar loading de conteúdo, loading de autenticação e loading de configuração

Entregáveis:

- componente ou padrão compartilhado de skeleton
- cobertura de loading nas principais rotas
- redução de tela vazia durante bootstrap e troca de rota

Critério de aceite:

- nenhuma tela principal deve piscar vazia antes de carregar
- skeleton precisa ser visualmente coerente com a identidade atual
- loading não deve deslocar layout de forma brusca

### 3. Ajustes pendentes de UI

Objetivo:

- fechar a camada visual ainda inconsistente da plataforma e do fluxo de curso

Escopo operacional:

- revisar placeholders de vídeo
- revisar hierarquia visual de dashboard, catálogo, módulos e conta
- revisar labels truncados e abreviações da sidebar
- revisar alinhamento, espaçamento e consistência de botões de ação
- revisar warnings de style budget em `lesson-page.component.ts` e `app.scss`

Entregáveis:

- interface mais consistente entre plataforma e curso
- redução de áreas com cara de placeholder
- padronização visual dos estados de ação, loading e conclusão

Critério de aceite:

- telas principais com acabamento visual consistente
- sem elementos com aparência provisória onde o fluxo já está ativo
- style budget revisado ou justificado tecnicamente

### 4. Alinhamento documental com o estado real da app

Objetivo:

- manter a documentação aderente ao que está implementado

Escopo operacional:

- continuar removendo descrições antigas de rotas e comportamento
- refletir Angular 21, plataforma `/courses` e papel transitório do `mock-db`
- registrar decisões de produto sobre admin e instrutor

Entregáveis:

- documentação técnica coerente com o código
- backlog vivo de execução

Critério de aceite:

- documentos principais sem drift relevante em relação à implementação

---

## Próximo

### 1. Navegação real para links internos estilo Obsidian

Objetivo:

- transformar links `[[...]]` em navegação real da plataforma

Escopo operacional:

- mapear slug de destino a partir do conteúdo
- substituir `href="#"` por rota válida
- tratar casos com alias e links quebrados

Entregáveis:

- parser de links internos integrado à navegação
- fallback explícito para referências não resolvidas

Critério de aceite:

- links internos navegam para páginas válidas
- conteúdo legado não quebra renderização

### 2. Correção de encoding e revisão editorial final

Objetivo:

- eliminar caracteres corrompidos e ruídos herdados dos Markdown e da documentação

Escopo operacional:

- revisar arquivos com encoding quebrado
- corrigir textos visíveis na UI e docs
- validar consistência de acentuação e nomenclatura

Entregáveis:

- base editorial limpa
- UI sem strings corrompidas

Critério de aceite:

- ausência de caracteres quebrados nos fluxos principais
- textos revisados nas páginas mais acessadas

### 3. Dashboard e catálogo menos placeholder

Objetivo:

- substituir blocos genéricos por funcionalidades reais de plataforma

Escopo operacional:

- definir cards e atalhos reais para home
- exibir progresso, retomada e recomendações
- enriquecer catálogo com status, capa, contexto e entrada no curso

Entregáveis:

- home útil
- catálogo mais informativo

Critério de aceite:

- dashboard com função operacional real
- catálogo deixando de ser apenas estrutura inicial

### 4. Evolução da camada de conteúdo além do `mock-db`

Objetivo:

- preparar a migração gradual do conteúdo para backend real

Escopo operacional:

- definir modelo de dados para cursos, módulos, lições e permissões
- definir backoffice administrativo
- definir área de instrutor com escopo restrito aos próprios cursos
- planejar migração sem quebrar a leitura atual

Entregáveis:

- blueprint técnico da camada administrativa
- estratégia de migração

Critério de aceite:

- backlog técnico fechado para admin e instrutor
- contrato de dados definido antes de remover o `mock-db`

### 5. Retomada futura do áudio guiado

Objetivo:

- reativar o áudio quando a base principal de conteúdo, progresso e UI estiver estável

Escopo operacional:

- decidir entre TTS, áudio pronto ou modo híbrido
- reintroduzir player sem poluir o fluxo de leitura
- persistir progresso de áudio quando a feature voltar

Entregáveis:

- estratégia validada para player
- plano de implementação desacoplado da leitura principal

Critério de aceite:

- áudio volta como feature real, não como placeholder

---

## Ordem prática de execução

### Bloco 1

- persistência correta do check de cursos, módulos e lições
- preload skeleton para o projeto todo
- ajustes pendentes de UI nas telas já ativas

### Bloco 2

- links internos estilo Obsidian
- correção de encoding e revisão editorial final
- dashboard e catálogo com função real

### Bloco 3

- desenho da área administrativa
- desenho da área de instrutor
- plano de migração do `mock-db` para backend real
