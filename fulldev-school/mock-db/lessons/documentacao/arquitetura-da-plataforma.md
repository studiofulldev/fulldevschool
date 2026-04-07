---
id: arquitetura-da-plataforma
slug: arquitetura-da-plataforma
title: 4.1 - Arquitetura da Plataforma
section: documentacao
order: 41
previousLessonId: arquitetura-frontend
nextLessonId: stack-bibliotecas
estimatedReadingMinutes: 8
---

# 4.1 - Arquitetura da Plataforma

## objetivo

Definir a arquitetura operacional da Fulldev School como plataforma de cursos, mantendo a estrutura atual como a camada `dentro do curso`.

O primeiro curso da plataforma sera:

- `Start: Comecando na tecnologia`

## visao-geral

A plataforma deve ser simples e clean.

Ela precisa ter dois niveis de experiencia:

### camada-de-plataforma

- home de cursos
- descoberta e selecao de cursos
- autenticacao
- conta do usuario
- progresso consolidado

### camada-dentro-do-curso

- navegacao lateral
- navegacao superior
- modulos
- licoes
- progresso por modulo e curso

## shells-principais

### 1-shell-da-plataforma

Responsavel por:

- header principal
- navegacao global
- acesso a conta
- listagem de cursos
- cards de cursos
- bloqueio de autenticacao antes do uso da plataforma

### 2-shell-do-curso

Responsavel por:

- header do curso
- sidebar de modulos e licoes
- navegacao superior entre conteudos
- pagina da licao
- controle de progresso dentro do curso

## mapa-de-rotas

Rotas recomendadas para a V1:

### plataforma

- `/`
  redireciona para `courses`
- `/courses/home`
  hub inicial da plataforma
- `/courses/catalog`
  catalogo centralizado de cursos
- `/courses/account`
  dados da conta, cursos iniciados e progresso
- `/courses/:courseSlug`
  landing do curso

### dentro-do-curso

- `/courses/:courseSlug/modules/:moduleSlug`
  pagina de modulo
- `/courses/:courseSlug/lessons/:lessonSlug`
  pagina de licao

## entidades-do-supabase

Supabase entra como backend inicial da plataforma.

### auth.users

Gerenciado pelo proprio Supabase Auth.

Uso esperado:

- login com email
- login com Google
- recuperacao de senha

## requisitos-de-cadastro

O cadastro proprio da plataforma deve coletar:

- `full_name`
- `email`
- `password`
- `whatsapp_number` opcional
- `age`
- `technical_level`
- `education_institution` opcional
- `accepted_terms`
- `accepted_terms_at`
- `accepted_email_consent`
- `accepted_email_consent_at`

Google Login continua permitido, mas a plataforma deve complementar o perfil quando esses dados nao vierem do provider.

### profiles

Tabela de perfil publico/privado da conta.

Campos iniciais recomendados:

- `id`
- `email`
- `full_name`
- `whatsapp_number`
- `age`
- `technical_level`
- `education_institution`
- `avatar_url`
- `provider`
- `accepted_terms`
- `accepted_terms_at`
- `accepted_email_consent`
- `accepted_email_consent_at`
- `created_at`
- `updated_at`

### email_leads

Tabela dedicada para disparo de emails e convites.

Campos iniciais recomendados:

- `id`
- `user_id` opcional
- `email`
- `full_name`
- `source`
- `consent_version`
- `accepted_email_consent_at`
- `created_at`
- `updated_at`

### courses

Tabela de cursos da plataforma.

Campos iniciais recomendados:

- `id`
- `slug`
- `title`
- `short_description`
- `cover_image_url`
- `status`
- `is_published`
- `order_index`
- `created_at`
- `updated_at`

### modules

Tabela de modulos por curso.

Campos iniciais recomendados:

- `id`
- `course_id`
- `slug`
- `title`
- `short_description`
- `order_index`
- `created_at`
- `updated_at`

### lessons

Tabela de licoes por modulo.

Campos iniciais recomendados:

- `id`
- `course_id`
- `module_id`
- `slug`
- `title`
- `content_source`
- `order_index`
- `estimated_reading_minutes`
- `estimated_listening_minutes`
- `created_at`
- `updated_at`

### enrollments

Tabela para ligar usuario e curso.

Campos iniciais recomendados:

- `id`
- `user_id`
- `course_id`
- `status`
- `started_at`
- `completed_at`
- `last_lesson_id`
- `updated_at`

### lesson_progress

Tabela granular de progresso por licao.

Campos iniciais recomendados:

- `id`
- `user_id`
- `course_id`
- `module_id`
- `lesson_id`
- `status`
- `completed`
- `last_block_id`
- `updated_at`

## fluxos-principais

### fluxo-de-login

1. usuario acessa qualquer rota da plataforma
2. se estiver deslogado, um modal obrigatorio abre com fundo embacado
3. usuario escolhe email/senha ou Google
4. se for cadastro proprio, preenche nome, email, senha, idade, nivel tecnico e aceite de termos
5. campos opcionais de WhatsApp e instituicao podem ser informados no mesmo fluxo
6. Supabase Auth valida
7. plataforma cria ou atualiza `profiles`
8. nome e email sao sincronizados com `email_leads` para disparo de comunicacoes
9. o modal some e a pessoa continua na rota atual

### fluxo-de-entrada-no-curso

1. usuario entra na home de cursos
2. seleciona um curso
3. acessa a landing do curso
4. inicia o curso
5. entra no shell `dentro do curso`

### fluxo-de-conclusao

1. usuario conclui uma licao
2. progresso da licao e atualizado
3. modulo calcula status agregado
4. curso calcula progresso geral
5. conta exibe historico e percentual

## modelo-de-ui

### home-de-cursos

Deve mostrar:

- header principal
- navegacao lateral global
- cards de cursos
- progresso resumido para usuario autenticado

### card-de-curso

Deve mostrar:

- capa
- titulo
- descricao curta
- status
- botao de entrar ou continuar

### conta

Deve mostrar:

- nome
- email
- avatar
- cursos iniciados
- cursos concluidos
- ultimo acesso

## regra-de-navegacao

- a navegacao lateral e superior continuam existindo dentro do curso
- o menu lateral organiza modulos e licoes
- a navegacao superior organiza anterior e proximo
- a plataforma nao deve depender de breadcrumbs longos para descoberta de curso
- o shell da plataforma deve usar sidebar fixa e header fixo no topo
- no desktop, a sidebar da plataforma inicia retraida e expande apenas com hover ou foco
- o item `Minha conta` fica isolado no final da sidebar com borda superior separando
- o topo da sidebar deve exibir a logo da FullDev
- o header da plataforma deve mostrar `Guia de tecnologia` e `Fulldev School` a esquerda
- o lado direito do header deve mostrar nome e avatar do usuario com menu de conta e deslogar

## regra-de-progressao

- usuario pode marcar modulo e licao como concluidos
- progresso local pode continuar existindo como fallback
- quando usuario estiver autenticado, o Supabase vira a fonte principal do progresso

## regra-de-migracao

Enquanto o backend real nao estiver pronto por completo:

- o conteudo continua vindo do mock-db
- a navegacao continua vindo do mock-db
- o curso `Start` continua sendo a base editorial
- as tabelas do Supabase entram primeiro para auth, profiles e progresso
- o cadastro deve nascer com estrutura pronta para consentimento e disparo de emails

## decisao-recomendada-para-v1

Construir em ordem:

1. home de cursos
2. gate de autenticacao com Google via Supabase
3. conta simples
4. adaptacao do shell atual para `dentro do curso`
5. persistencia de progresso por curso e modulo

## criterio-de-sucesso

A V1 esta bem resolvida quando:

- a pessoa consegue entrar na plataforma e entender que existem cursos
- o curso `Start` fica claramente identificado como porta de entrada
- login e conta funcionam sem friccao
- o shell atual funciona bem como experiencia dentro do curso
- progresso de cursos e modulos fica claro e persistente
