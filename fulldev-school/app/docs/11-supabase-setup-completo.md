# 11. Supabase Setup Completo

## Objetivo

Este documento e o guia completo para recriar o Supabase da Fulldev School a partir de uma conta limpa.

Ele cobre:

- configuracao do projeto
- Auth
- providers Google e LinkedIn
- tabelas obrigatorias para o frontend atual
- RLS
- SQL de criacao
- promocao de usuarios para `admin` e `instructor`
- configuracao do frontend

## Escopo

Este guia separa duas camadas:

- `Obrigatorio agora`: tudo o que o frontend atual usa de fato
- `Reservado para proxima fase`: estruturas recomendadas, mas ainda nao usadas pelo frontend

Hoje, o frontend depende diretamente de:

- Supabase Auth
- tabela `profiles`
- tabela `leads`

## Visao geral da arquitetura atual

Hoje o login funciona assim:

1. o usuario autentica via Google, LinkedIn ou e-mail/senha no Supabase Auth
2. a app restaura a sessao
3. a app tenta sincronizar o usuario em `profiles`
4. a app tenta sincronizar o contato em `leads`
5. no caso de Google/LinkedIn, se faltarem campos obrigatorios, a app abre popup para completar cadastro
6. ao salvar, a app atualiza `user_metadata` do Supabase Auth e a tabela `profiles`

Importante:

- o frontend le o papel de acesso a partir do `user_metadata.app_role`
- `profiles.role` deve acompanhar esse valor, mas hoje o papel efetivo na UI vem do usuario autenticado do Auth

## O que criar agora

Crie agora:

- projeto Supabase
- Auth com e-mail/senha
- provider `google`
- provider `linkedin_oidc`
- tabela `profiles`
- tabela `leads`
- funcoes auxiliares de RLS
- policies

## 1. Criar o projeto

No painel do Supabase:

1. crie um novo projeto
2. anote:
   - `Project URL`
   - `Publishable key` ou `anon key`
3. nao use `service_role` no frontend

## 2. Configurar Auth

No painel do Supabase:

1. abra `Authentication`
2. habilite `Email`
3. habilite `Google`
4. habilite `LinkedIn (OIDC)` como `linkedin_oidc`

### Redirect URL

O frontend atual envia o usuario autenticado para:

```text
https://SEU-DOMINIO/courses/home
```

Em desenvolvimento local, normalmente:

```text
http://localhost:4200/courses/home
```

Adicione esses callbacks na allow list do Supabase Auth.

## 3. SQL completo para criar a base atual

Execute o bloco abaixo no SQL Editor do Supabase.

```sql
begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  whatsapp_number text not null default '',
  age integer null check (age is null or age > 0),
  technical_level text null check (
    technical_level is null
    or technical_level in ('iniciante', 'intermediario', 'avancado')
  ),
  education_institution text not null default '',
  avatar_url text null,
  provider text not null check (
    provider in ('google', 'linkedin_oidc', 'email')
  ),
  role text not null default 'user' check (
    role in ('admin', 'instructor', 'user')
  ),
  accepted_terms boolean not null default false,
  accepted_terms_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  provider text not null check (
    provider in ('google', 'linkedin_oidc', 'email')
  ),
  profile_id uuid null references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.role
      from public.profiles p
      where p.id = auth.uid()
      limit 1
    ),
    'user'
  );
$$;

revoke all on function public.current_profile_role() from public;
grant execute on function public.current_profile_role() to authenticated;

alter table public.profiles enable row level security;
alter table public.leads enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or public.current_profile_role() = 'admin'
);

drop policy if exists "profiles_insert_own_or_admin" on public.profiles;
create policy "profiles_insert_own_or_admin"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
  or public.current_profile_role() = 'admin'
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
  or public.current_profile_role() = 'admin'
)
with check (
  auth.uid() = id
  or public.current_profile_role() = 'admin'
);

drop policy if exists "leads_select_admin_only" on public.leads;
create policy "leads_select_admin_only"
on public.leads
for select
to authenticated
using (
  public.current_profile_role() = 'admin'
);

drop policy if exists "leads_insert_authenticated" on public.leads;
create policy "leads_insert_authenticated"
on public.leads
for insert
to authenticated
with check (
  auth.uid() is not null
);

drop policy if exists "leads_update_admin_only" on public.leads;
create policy "leads_update_admin_only"
on public.leads
for update
to authenticated
using (
  public.current_profile_role() = 'admin'
)
with check (
  public.current_profile_role() = 'admin'
);

commit;
```

## 4. O que cada tabela faz

### `public.profiles`

Tabela canonica de perfil do usuario na aplicacao.

Campos:

- `id`: mesmo `uuid` do `auth.users.id`
- `email`: e-mail principal
- `full_name`: nome do usuario
- `whatsapp_number`: telefone ou WhatsApp
- `age`: idade
- `technical_level`: `iniciante`, `intermediario`, `avancado`
- `education_institution`: instituicao de ensino
- `avatar_url`: avatar vindo do provider
- `provider`: `google`, `linkedin_oidc` ou `email`
- `role`: `admin`, `instructor` ou `user`
- `accepted_terms`: aceite de termos
- `accepted_terms_at`: data de aceite
- `created_at`
- `updated_at`

### `public.leads`

Tabela de captura basica de lead ou contato.

Campos:

- `id`
- `email`
- `name`
- `provider`
- `profile_id`
- `created_at`
- `updated_at`

Objetivo atual:

- registrar nome e e-mail logo no primeiro login
- manter uma base separada de contato

## 5. Como o frontend usa essas tabelas

### `profiles`

O frontend faz `upsert` em `profiles` quando:

- restaura sessao
- recebe evento de auth
- usuario faz cadastro com e-mail
- usuario completa o cadastro social

### `leads`

O frontend faz `upsert` em `leads` quando:

- restaura sessao
- recebe evento de auth
- usuario faz cadastro com e-mail

Conflito usado:

- `email`

Por isso a tabela `leads.email` precisa ser `unique`.

## 6. Campos de metadata no Auth

O frontend tambem grava dados no proprio usuario do Supabase Auth.

Campos usados em `user_metadata`:

- `full_name`
- `whatsapp_number`
- `age`
- `technical_level`
- `education_institution`
- `accepted_terms`
- `accepted_terms_at`
- `app_role`

Importante:

- o frontend hoje le o papel de acesso principalmente de `user_metadata.app_role`
- entao mudar so `profiles.role` nao e suficiente para a UI refletir a permissao imediatamente

## 7. Como promover um usuario para admin ou instructor

Hoje, para promover um usuario, atualize:

- `auth.users.raw_user_meta_data`
- `public.profiles.role`

### Promover para admin

```sql
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('app_role', 'admin')
where email = 'admin@seudominio.com';

update public.profiles
set role = 'admin'
where email = 'admin@seudominio.com';
```

### Promover para instructor

```sql
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('app_role', 'instructor')
where email = 'instrutor@seudominio.com';

update public.profiles
set role = 'instructor'
where email = 'instrutor@seudominio.com';
```

### Rebaixar para user

```sql
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('app_role', 'user')
where email = 'usuario@seudominio.com';

update public.profiles
set role = 'user'
where email = 'usuario@seudominio.com';
```

## 8. Seed inicial recomendado

Se quiser deixar uma conta administrativa pronta, use:

```sql
select id, email from auth.users order by created_at desc;
```

Depois promova o usuario desejado com os comandos acima.

## 9. Configuracao do frontend

O frontend pode ser configurado de tres formas:

### Opcao 1. `public/runtime-config.js`

Crie um arquivo local baseado em `public/runtime-config.example.js`:

```js
window.__FULLDEV_SCHOOL_CONFIG__ = {
  supabase: {
    url: 'https://SEU-PROJETO.supabase.co',
    publishableKey: 'SUA-CHAVE-PUBLICA'
  }
};
```

### Opcao 2. `environment.ts`

Preencha:

```ts
export const environment = {
  production: false,
  supabase: {
    url: 'https://SEU-PROJETO.supabase.co',
    publishableKey: 'SUA-CHAVE-PUBLICA'
  }
};
```

### Opcao 3. `localStorage`

Use as chaves:

- `fds.supabase.url`
- `fds.supabase.publishableKey`

## 10. Ordem de leitura da config no frontend

O frontend resolve a config nesta ordem:

1. `window.__FULLDEV_SCHOOL_CONFIG__.supabase`
2. `localStorage`
3. `environment.ts` ou `environment.prod.ts`

## 11. Checklist de validacao

Depois de criar tudo, valide:

1. login com Google redireciona de volta para `/courses/home`
2. login com LinkedIn redireciona de volta para `/courses/home`
3. cadastro com e-mail cria usuario
4. login com e-mail funciona
5. ao logar, uma linha aparece em `public.leads`
6. ao logar, um registro aparece ou atualiza em `public.profiles`
7. no login social incompleto, o popup de completar cadastro aparece
8. ao salvar o popup, `profiles` e `user_metadata` sao atualizados
9. ao promover um usuario para `admin`, o papel aparece refletido na app

## 12. Consultas uteis

### Ver usuarios autenticados

```sql
select id, email, raw_user_meta_data, created_at
from auth.users
order by created_at desc;
```

### Ver profiles

```sql
select *
from public.profiles
order by updated_at desc;
```

### Ver leads

```sql
select *
from public.leads
order by updated_at desc;
```

## 13. Problemas comuns

### Google ou LinkedIn autenticam mas nao voltam para a app

Causa comum:

- redirect URL nao cadastrada no Supabase

### Usuario entra mas o popup aparece sempre

Causa comum:

- `age`, `technical_level` ou `accepted_terms` nao foram gravados em `user_metadata`

### Usuario vira admin em `profiles`, mas a app continua como user

Causa:

- o frontend le o papel do `user_metadata.app_role`

Correcao:

- atualize tambem `auth.users.raw_user_meta_data`

### `profiles` ou `leads` nao recebem dados

Causas comuns:

- tabela nao criada
- RLS sem policy de insert/update
- colunas divergentes do que o frontend envia

## 14. Proxima fase recomendada

Quando a plataforma evoluir, o proximo passo natural e criar:

- `course_memberships`
- `course_instructors`
- `courses`
- `modules`
- `lessons`
- `lesson_progress`
- `module_progress`
- `course_progress`

Mas essas tabelas ainda nao sao exigidas pelo frontend atual.

## Resumo executivo

Para a app funcionar hoje em um projeto Supabase limpo, voce precisa recriar:

- Auth com Google, LinkedIn e e-mail
- tabela `profiles`
- tabela `leads`
- metadata `app_role`
- policies de RLS
- config publica do frontend

Sem isso, o login pode ate autenticar, mas a aplicacao vai ficar sem persistencia coerente de perfil e lead.
