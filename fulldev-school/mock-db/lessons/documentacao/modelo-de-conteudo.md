---
id: modelo-conteudo
slug: modelo-conteudo
title: 6 - Modelo de Conteudo
section: documentacao
order: 6
previousLessonId: stack-bibliotecas
nextLessonId: audio-narracao
estimatedReadingMinutes: 5
---

# 6 - Modelo de Conteudo

## ideia-central

O conteudo funciona como um banco de dados mockado.

Ou seja:

- nada fica hardcoded na interface
- tudo vem de arquivos estruturados
- o Angular so le, valida e renderiza

Na nova fase do produto, esse modelo deve representar a camada `dentro do curso`, enquanto o catalogo, a conta e o progresso do usuario passam a existir como entidades de plataforma.

## unidades-principais

### navigation-tree

Define hierarquia, ordem de leitura, slugs, labels e ids.

### lesson

Representa uma pagina consumivel.

Deve conter:

- metadados
- markdown
- blocos identificaveis
- contexto de navegacao

### audio-manifest

Representa:

- qual audio tocar
- se a pagina usa TTS ou arquivo pronto
- segmentos sincronizados

### progress-state

Na V1 pode ficar local. Depois pode ir para API real.

### course

Representa um curso da plataforma.

Deve conter:

- id
- slug
- titulo
- descricao curta
- capa
- status
- ordem

### module

Representa um agrupador de licoes dentro de um curso.

Deve conter:

- id
- courseId
- titulo
- descricao opcional
- ordem

### user-progress

Representa o estado do usuario na plataforma.

Deve conter:

- userId
- courseId
- moduleId ou lessonId
- status de conclusao
- ultima interacao

### account-profile

Representa a conta da pessoa.

Deve conter:

- id
- nome
- email
- avatar
- provider de login

## decisao-recomendada

Usar modelo hibrido:

- Markdown para conteudo humano
- JSON para navegacao, metadados e audio
- Supabase para autenticacao, conta, catalogo e progresso quando a plataforma sair do modo mockado

## regra-de-ouro

Cada bloco relevante do texto precisa ter um identificador estavel.

Isso permite sincronizacao de leitura, destaque visual, retomada de progresso e comentarios futuros.
