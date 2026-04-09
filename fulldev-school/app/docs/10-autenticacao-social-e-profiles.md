# 10. Autenticacao Social e Persistencia de Profiles

## Objetivo

Registrar como a Fulldev School faz login com Google, LinkedIn e e-mail/senha, onde os dados do usuario ficam e qual o papel das tabelas `profiles` e `leads`.

## Visao geral

Hoje a autenticacao da app e baseada em Supabase Auth.

Os provedores ativos na interface sao:

- `google`
- `linkedin_oidc`
- `email` e `password`

O frontend nao implementa um cadastro social separado.

Na pratica:

- o primeiro acesso social acontece no proprio Supabase Auth
- a sessao autenticada volta para a app
- a app tenta sincronizar o usuario nas tabelas `leads` e `profiles`
- a app verifica se faltam dados obrigatorios de perfil
- se faltarem dados, abre o fluxo de completar perfil
- depois faz update dos dados restantes em `user_metadata` do Supabase Auth e na tabela `profiles`
- no cadastro por e-mail e senha, os dados obrigatorios ja entram completos de uma vez

## Onde o login começa

O gate de entrada fica no componente raiz da app.

Botoes expostos hoje:

- `Entrar com Google`
- `Entrar com LinkedIn`

Arquivos envolvidos:

- `src/app/app.ts`
- `src/app/services/auth.service.ts`
- `src/app/services/supabase.service.ts`

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

## Fluxo de login e cadastro com e-mail e senha

Hoje a interface tambem possui:

- login com e-mail e senha
- cadastro completo com e-mail e senha

No login por e-mail:

- a app chama `signInWithPassword`
- restaura o usuario autenticado
- tenta sincronizar `leads` e `profiles`

No cadastro por e-mail:

- a app coleta todos os campos obrigatorios no primeiro envio
- chama `signUp`
- envia os metadados completos no usuario do Supabase Auth
- tenta gravar o mesmo conjunto em `profiles`
- grava nome e e-mail em `leads`

## Como a sessao e reconhecida

Depois do redirect, a app reconstrói a sessao de duas formas:

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

Na implementacao atual:

- usuario novo nasce como `user`
- `admin` e `instructor` devem ser atribuidos por dados persistidos no Supabase

## Quando o perfil social e considerado incompleto

Para login via Google ou LinkedIn, a app exige complemento de perfil se faltar qualquer um destes campos:

- `age`
- `technicalLevel`
- `acceptedTerms`

Regra atual:

- usuario social autenticado entra
- se faltar perfil minimo, a app abre o modal de completar perfil
- o usuario precisa salvar para liberar a plataforma

Para usuario `email`, essa checagem nao e aplicada do mesmo jeito.

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

Isso significa que os dados do perfil social ficam salvos no proprio usuario do Supabase Auth.

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

O comportamento atual foi desenhado assim:

- se a gravacao em `profiles` funcionar, os dados ficam persistidos tambem na tabela
- se a gravacao em `leads` funcionar, o contato fica registrado ja no primeiro acesso
- se a gravacao falhar, o login continua funcionando

Isso acontece porque o `upsertProfile()` esta dentro de `try/catch`.

Conclusao pratica:

- autenticacao e sessao dependem de Supabase Auth
- persistencia tabular adicional depende de `profiles` e `leads`
- `profiles` e `leads` hoje sao complementares, nao bloqueantes

## Cadastro por e-mail

Embora esteja fora da UI no momento, o codigo ainda possui fluxo de cadastro por e-mail e senha.

Nesse fluxo, a app tambem:

- cria usuario no Supabase Auth
- envia metadados iniciais
- tenta gravar em `profiles`
- grava nome e e-mail em `leads`

Ou seja:

- Google e LinkedIn usam OAuth
- email usa `signUp`
- todos convergem para a mesma ideia de perfil complementar

## Dependencias e pre-condicoes

Para o fluxo atual funcionar corretamente, o projeto precisa de:

- configuracao do Supabase no frontend
- `publishableKey` e `Project URL`
- provider `google` habilitado
- provider `linkedin_oidc` habilitado
- callback do projeto liberado no Supabase
- opcionalmente, tabela `profiles`
- opcionalmente, tabela `leads`

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

Isso permite separar:

- autenticacao
- perfil operacional
- base de leads e relacionamento

## Recomendacao tecnica para a proxima fase

Se a plataforma for evoluir para progresso persistido, administracao de usuarios e papeis de administrador/instrutor, o caminho recomendado e:

- manter autenticacao no Supabase Auth
- tratar `profiles` como tabela canonica de dados de perfil da aplicacao
- tratar `leads` como camada de captura e relacionamento comercial ou operacional
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

No fluxo de e-mail e senha:

1. usuario pode entrar com conta existente
2. usuario pode se cadastrar preenchendo tudo de uma vez
3. a app envia os metadados completos no `signUp`
4. depois tenta gravar `profiles` e `leads`

## Diferenciacao de acesso

O frontend agora reconhece tres papeis:

- `admin`
- `instructor`
- `user`

Uso pretendido:

- `admin`: acesso a area administrativa
- `instructor`: acesso a area de instrutor e aos cursos vinculados
- `user`: acesso comum de aluno ou usuario final

Hoje a base de autenticacao ja mapeia esse papel no usuario autenticado e disponibiliza helpers para validacao de acesso.
