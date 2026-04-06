# Mock DB

Esta pasta guarda a camada de dados fake da Fulldev School.

Ela existe para simular o backend antes de existir uma API real.

## Objetivo

Permitir que o frontend Angular seja construído consumindo dados estruturados desde o começo.

## Áreas principais

- `navigation/`: árvore do conteúdo
- `lessons/`: markdown das páginas
- `audio/`: manifestos de áudio e referências de assets
- `schemas/`: esquemas e contratos esperados

## Regra

O frontend não deve depender da estrutura solta da raiz do repositório.

Ele deve consumir o conteúdo a partir desta pasta.
