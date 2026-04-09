# Fulldev School

Implementação do frontend e da publicação local do guia de tecnologia.

## Organização

- `app/`: aplicação Angular
- `app/docs/`: documentação técnica do frontend
- `mock-db/navigation/`: árvore da navegação
- `mock-db/doc/`: conteúdo publicado para consumo da app nesta fase transitória
- `mock-db/audio/`: reservado para uma retomada futura do áudio guiado

## Como a app funciona hoje

- a app carrega a árvore em `mock-db/navigation/tree.json`
- a rota `/` redireciona para `/courses`
- o catálogo da plataforma abre em `/courses`
- a leitura do curso acontece em `/courses/:courseSlug/lessons/:lessonSlug`
- o Markdown é carregado via `HttpClient`
- cada seção `##` vira um bloco expansível no corpo da página

## Interface atual

- shell com menu lateral expansível e persistido em `localStorage`
- toolbar fixa com barra de progresso de leitura
- página de leitura com hero, breadcrumb, blocos expansíveis persistidos e navegação anterior/próxima
- visão geral com painel de boas-vindas para vídeo e árvore expansível da estrutura do projeto
- hero com contagem de tópicos, vídeos e tempo estimado de leitura
- tipografia padronizada com `Inter`
- paleta escura com acento vermelho
- painéis retos, sem sombras padrão do Material
- itens laterais com labels abreviados quando necessário para caber em uma linha

## Status do áudio

O áudio guiado está fora da interface por enquanto. A estrutura relacionada foi desacoplada do fluxo principal para manter o foco na documentação e na leitura.

## Pendências relevantes

- corrigir encoding restante em alguns `.md`
- revisar textos documentais herdados
- manter o `mock-db` como fonte local enquanto a área administrativa e a área de instrutor não forem implementadas
- planejar a futura migração para um backend com administração de usuários e cursos
- planejar a futura área de instrutor para cadastrar e editar apenas os cursos pertencentes a cada instrutor
