---
id: visao-produto
slug: visao-produto
title: 3 - Visao do Produto
section: documentacao
order: 3
previousLessonId: estrutura-repositorio
nextLessonId: arquitetura-frontend
estimatedReadingMinutes: 6
---

# 3 - Visao do Produto

## nome

Fulldev School.

## resumo

Fulldev School sera uma plataforma de cursos da FullDev.

O curso que existe hoje passa a se chamar `Start: Comecando na tecnologia`.

Em vez de consumir o conteudo apenas como notas e documentos, a pessoa podera navegar por uma experiencia mais orientada, com cara de plataforma educacional, catalogo de cursos, progresso e conta de usuario.

## problema-que-o-produto-resolve

Hoje o conteudo e forte editorialmente, mas ainda depende de leitura manual e navegacao por documentos.

Isso cria limitacoes para:

- descoberta de cursos
- consumo em mobile
- experiencia mais visual
- acompanhamento com audio
- retencao por leitura guiada
- futuras features de progresso, favoritos, trilhas personalizadas e conta

## visao-de-plataforma

A FullDev deve evoluir para um ecossistema com varios sistemas compartilhando o mesmo backend e a mesma base de dados.

No inicio, como o primeiro produto sera a School, a stack de backend pode nascer em `Supabase`.

A ideia e ter:

- um hub centralizado de cursos
- autenticacao simples, incluindo login com Google
- cadastro proprio com coleta de perfil do aluno
- area da conta
- acompanhamento de cursos e modulos concluidos
- arquitetura preparada para outros sistemas da FullDev no futuro

## requisitos-de-cadastro

O cadastro da Fulldev School deve permitir:

- login com Google
- login com email e senha

No fluxo de cadastro proprio, a plataforma deve pedir:

- nome
- email
- senha
- numero de WhatsApp opcional
- idade
- nivel tecnico
- instituicao de ensino opcional
- aceite de termos

O aceite de termos tambem deve cobrir o consentimento para:

- salvar nome e email em base de disparo
- enviar comunicacoes da FullDev relacionadas a plataforma, cursos, convites e atualizacoes

Nome e email devem ser salvos de forma estruturada para uso em campanhas, convites para beta e comunicacoes oficiais da FullDev.

## objetivo-principal

Transformar o guia em uma plataforma web educacional simples, clean e preparada para crescer para varios cursos.

Tambem e objetivo do produto reforcar a IA como ferramenta de apoio transversal para estudo, pratica, revisao e produtividade.

## objetivos-da-v1

- centralizar a entrada da plataforma em uma tela de cursos
- manter o curso `Start: Comecando na tecnologia` como curso inicial
- renderizar a experiencia dentro do curso com navegacao lateral e superior
- permitir login, incluindo Google
- permitir cadastro com email e senha
- criar area simples de conta
- permitir marcar cursos e modulos como concluidos
- iniciar backend e autenticacao em Supabase
- manter a experiencia atual como base para a camada `dentro do curso`

## fora-da-v1

- marketplace completo de cursos
- recomendacao personalizada avancada
- CMS editorial completo
- analytics avancado
- comentarios
- geracao automatica de audio no servidor
- unificacao completa dos outros sistemas FullDev no mesmo backend
