# 10. Autenticacao Social e Persistencia de Profiles

## Objetivo

Registrar como a Fulldev School faz login com Google e LinkedIn, onde os dados do usuario ficam e qual o papel das tabelas `profiles` e `leads`.

## Visao geral

Hoje a autenticacao da app e baseada em Supabase Auth.

Os provedores ativos na interface sao:

- `google`
- `linkedin_oidc`

Na pratica:

- o primeiro acesso social acontece no proprio Supabase Auth
- a sessao autenticada volta para a app
- a app tenta sincronizar o usuario nas tabelas `leads` e `profiles`
- a app verifica se faltam dados obrigatorios de perfil
- se faltarem dados, redireciona para a rota de completar perfil
- depois faz update dos dados restantes em `user_metadata` do Supabase Auth e na tabela `profiles`

Observacao:

- o codigo ainda preserva base para e-mail/senha no servico, mas a UI atual expoe apenas login social

## Onde o login comeca

O fluxo de entrada fica na rota `/login`.

Botoes expostos hoje:

- `Entrar com Google`
- `Entrar com LinkedIn`

Arquivos envolvidos:

- `src/app/pages/login-page/login-page.component.ts`
- `src/app/services/auth.service.ts`
- `src/app/services/supabase.service.ts`
- `src/app/guards/auth.guard.ts`
- `src/app/guards/profile-completion.guard.ts`
- `src/app/guards/profile-completion-required.guard.ts`

## Fluxo de login com Google e LinkedIn

### 1. Usuario clica no botao social

O clique chama:

- `signInWithGoogle()`
- `signInWithLinkedIn()`

Esses metodos delegam para `AuthService`.

### 2. AuthService chama Supabase OAuth

O `AuthService` usa:

- `signInWithOAuth('google')`
- `signInWithOAuth('linkedin_oidc')`

O `SupabaseService` chama:

```ts
client.auth.signInWithOAuth({
  provider,
  options: {
    redirectTo: window.location.origin + '/courses/home'
  }
})
```

Ou seja:

- o provedor autentica o usuario fora da app
- o Supabase cria ou reaproveita a conta do usuario no Auth
- ao finalizar, o usuario volta para `/courses/home`

### 3. Estado intermediario de autenticacao

Ao iniciar o OAuth, a rota `/login` troca temporariamente para estado de carregamento enquanto o redirecionamento esta sendo iniciado.

Objetivo:

- evitar clique duplo
- comunicar que a autenticacao esta em andamento

## Como a sessao e reconhecida

Depois do redirect, a app reconstrui a sessao de duas formas:

- `getSession()`
- `onAuthStateChange(...)`

Responsabilidades atuais:

- restaurar sessao ao carregar a app
- atualizar o estado autenticado quando o Supabase emitir eventos
- limpar cache local quando a sessao some
- sincronizar `leads` e `profiles` quando o usuario autenticado e reconhecido

Importante:

- a decisao de autenticacao usa o usuario verificado pelo Supabase
- o `localStorage` e apenas cache visual temporario, nao fonte de verdade de auth
- a protecao efetiva das areas privadas acontece nos guards de rota

## Como o usuario e mapeado na app

O usuario autenticado do Supabase e convertido para o modelo interno `AuthUser`.

Campos usados hoje:

- `id`
- `name`
- `email`
- `avatarUrl`
- `provider`
- `role`
- `whatsappNumber`
- `age`
- `technicalLevel`
- `educationInstitution`
- `acceptedTerms`
- `acceptedTermsAt`

Fonte principal desses campos:

- `user.user_metadata`
- `user.app_metadata.provider`

Papel de acesso atual:

- `admin`
- `instructor`
- `user`

## Quando o perfil social e considerado incompleto

Para login via Google ou LinkedIn, a app exige complemento de perfil se faltar qualquer um destes campos:

- `age`
- `technicalLevel`
- `acceptedTerms`

Regra atual:

- usuario social autenticado entra
- se faltar perfil minimo, o guard redireciona o usuario para `/complete-profile`
- o usuario precisa salvar para liberar a plataforma

## Fluxo de complemento de cadastro

O complemento de cadastro hoje funciona como wizard em etapas na rota `/complete-profile`.

Campos operacionais:

- primeiro nome
- segundo nome
- WhatsApp
- idade
- senioridade tecnica
- instituicao de ensino
- aceite de termos

Lista atual de senioridade:

- `iniciante`
- `intermediario`
- `avancado`

Comportamentos relevantes:

- se o provider nao enviar foto, o frontend usa o fallback `/user-default.jpg`

## O que acontece ao completar o perfil social

Quando o usuario envia o formulario de complemento, a app executa duas persistencias.

### 1. Atualiza `user_metadata` no Supabase Auth

A app chama:

```ts
client.auth.updateUser({
  data: metadata
})
```

Campos enviados hoje:

- `full_name`
- `whatsapp_number`
- `age`
- `technical_level`
- `education_institution`
- `accepted_terms`
- `accepted_terms_at`
- `app_role`

### 2. Tenta gravar na tabela `profiles`

Depois disso, a app chama um `upsert` em:

```ts
client.from('profiles').upsert(profile).select('id').single()
```

Campos enviados hoje:

- `id`
- `email`
- `full_name`
- `whatsapp_number`
- `age`
- `technical_level`
- `education_institution`
- `avatar_url`
- `provider`
- `role`
- `accepted_terms`
- `accepted_terms_at`
- `updated_at`

### 3. Grava ou atualiza a tabela `leads`

Sempre que a app reconhece um usuario autenticado, ela tenta gravar:

- `email`
- `name`
- `provider`
- `profile_id`
- `updated_at`

Objetivo atual:

- garantir captura basica de lead logo no primeiro login
- manter nome e e-mail sincronizados mesmo antes de o perfil estar completo

## Estamos salvando em alguma tabela

Sim.

A app tenta salvar dados nas tabelas:

- `profiles`
- `leads`

Mas isso nao e obrigatorio para o login funcionar.

Conclusao pratica:

- autenticacao e sessao dependem de Supabase Auth
- persistencia tabular adicional depende de `profiles` e `leads`
- `profiles` e `leads` hoje sao complementares, nao bloqueantes

## Papel atual da tabela `profiles`

Hoje a tabela `profiles` serve como camada complementar para dados de perfil.

Ela ainda nao sustenta sozinha:

- login
- sessao
- autorizacao

Hoje esses pontos continuam no Supabase Auth.

## Papel atual da tabela `leads`

Hoje a tabela `leads` funciona como captura inicial de contato.

Ela deve receber pelo menos:

- nome
- e-mail
- provedor de origem
- referencia ao usuario autenticado quando existir

## Recomendacao tecnica para a proxima fase

Se a plataforma for evoluir para progresso persistido, administracao de usuarios e papeis de administrador ou instrutor, o caminho recomendado e:

- manter autenticacao no Supabase Auth
- tratar `profiles` como tabela canonica de dados de perfil da aplicacao
- tratar `leads` como camada de captura e relacionamento operacional
- adicionar campos e relacoes de papel, permissao e vinculacao de cursos
- parar de depender apenas de `user_metadata` para dados de negocio

## Resumo executivo

Hoje o fluxo funciona assim:

1. usuario entra com Google ou LinkedIn via Supabase Auth
2. a app restaura a sessao pelo Supabase
3. a app tenta sincronizar `leads` e `profiles`
4. se faltarem dados obrigatorios, a app exige completar perfil
5. ao salvar, atualiza `user_metadata`
6. em seguida, atualiza `profiles`
7. se `profiles` ou `leads` falharem, a autenticacao continua funcionando

## Diferenciacao de acesso

O frontend reconhece tres papeis:

- `admin`
- `instructor`
- `user`

Uso pretendido:

- `admin`: acesso a area administrativa
- `instructor`: acesso a area de instrutor e aos cursos vinculados
- `user`: acesso comum de aluno ou usuario final

## Observacao de estrutura frontend

O fluxo de autenticacao foi desacoplado do shell global.

Estado atual:

- a rota `/login` concentra a interface de entrada
- a rota `/complete-profile` concentra o wizard de complemento
- a protecao de acesso fica em guards
- o shell nao deve carregar modal global de autenticacao

Diretriz complementar:

- componentes de shell e telas grandes nao devem manter HTML e CSS inline no `.ts`
