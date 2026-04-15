# Fulldev School — OKRs & Plano de Execução
> Ciclo: Q2 2026 (90 dias) · Última atualização: 2026-04-15

## Contexto

Fulldev School é uma plataforma educacional de desenvolvimento de software — cursos, trilhas, projetos práticos, comunidade.

**Usuário primário:** desenvolvedor em formação:
- Iniciante que quer entrar no mercado (quer emprego, não diploma)
- Junior que quer evoluir (já trabalha, quer crescer na carreira)
- Pessoa em transição de carreira (quer se tornar dev)

**Comportamento real:** assiste aulas no celular no ônibus, no desktop em casa. Zero paciência para conteúdo lento ou mal produzido. Compara tudo com o YouTube — se o conteúdo for menos interessante, abre o YouTube.

**Maior inimigo:** abandono silencioso — o aluno que para de acessar sem cancelar. Não fala nada. Simplesmente some.

**Competidores:** Alura, Rocketseat, DIO.

---

## Estado do Produto (em 2026-04-15)

### O que existe
- Angular 19 standalone + signals com arquitetura limpa (shells / pages / services / data / guards)
- Auth completa no Supabase: cadastro por email, login por email, Google OAuth, LinkedIn OAuth
- `LoginPageComponent` com UI completa — rota `/login` declarada em `app.routes.ts` (merged na main)
- `CourseProgressService` — persiste progresso de lição/módulo/curso com **sync para o Supabase** (usuários autenticados têm progresso persistido no servidor; `localStorage` como cache otimista e fallback offline) — **PR #22 entregue**
- Tabela `user_progress` no Supabase com RLS completa (SELECT, INSERT, UPDATE, DELETE) — **PR #31 entregue**
- Policy DELETE em `user_progress` para compliance LGPD — **PR #35 entregue**
- `SchoolContentService` lendo conteúdo do mock-db (Markdown + JSON tree)
- `AudioNarrationService` via Web Speech API — removido da UI intencionalmente (comentário no código confirma)
- `SeoService` + `ThemeService` (dark/light)
- `AuthGuard` com verificação correta de sessão
- `RoleGuard` para controle de acesso por papel
- Docker + nginx para deploy containerizado
- Vercel configurado
- Página 404 com humor dev e efeito matrix vermelho no fundo
- **Dependabot configurado** (segurança de dependências automática) — **PR #32 entregue**
- **CI com testes unitários automáticos** em todo PR (25 specs para `CourseProgressService` + specs para `AuthService`) — **PR #34 entregue**
- **Segurança: grants excessivos do role `anon` revogados** em todas as tabelas — **PR #35 entregue**

### Páginas existentes (rotas)
- `/login` — LoginPageComponent com Google + LinkedIn OAuth (existe — merged na main)
- `/courses/home` — PlatformDashboard (placeholder estático, sem dados reais)
- `/courses/catalog` — listagem de cursos com cards
- `/courses/account` — perfil do usuário + % de progresso nos cursos
- `/courses/:courseSlug` — CourseOverview com módulos
- `/courses/:courseSlug/modules/:moduleSlug` — ModulePage
- `/courses/:courseSlug/lessons/:lessonSlug` — LessonPage (Markdown com painéis expansíveis, nav anterior/próximo, barra de leitura)
- `/legal/privacy` e `/legal/terms`
- `/**` — Página 404 com humor dev

### Conteúdo
- 1 curso: "Start: Começando na tecnologia"
- 58 lições em `tree.json` distribuídas em 16 seções temáticas
- Todo conteúdo em Markdown — 0/58 `audioManifestPath` preenchidos
- Conteúdo editorial rico: mapas de área, trilhas de especialidade, mercado de trabalho, portfólio, mindset, glossário, FAQ

### Gaps críticos (atualizado em 2026-04-15)

1. ~~**Progresso não persiste no servidor**~~ — **RESOLVIDO (PR #22 + #31).** `CourseProgressService` agora sincroniza com Supabase para usuários autenticados.
2. **Dashboard é placeholder estático** — `/courses/home` tem HTML estático. Agora desbloqueado: pode consumir os dados reais do progresso persistido no Supabase.
3. **Nenhum mecanismo de engajamento recorrente** — zero streak, zero notificação, zero lembrete. Nada que traga o usuário de volta amanhã.
4. **Nenhuma trilha de onboarding** — o cadastro coleta `technicalLevel` mas essa informação não roteia para nenhuma trilha de aprendizado.
5. **Sem certificado** — sem estrutura para emissão de certificado ao concluir o curso.
6. **Zero analytics** — sem eventos de tracking. Taxa de conclusão, retenção no dia 7 — nada disso é mensurável hoje.
7. **Links internos do Obsidian quebrados** — links `[[...]]` do Obsidian não viram navegação real.
8. **`PlatformDataService` hardcoded para 1 curso** — `computed(() => [this.buildStartCourse()])`. Publicar um segundo curso exige refatoração do serviço.
9. **Encoding corrompido** — o README menciona arquivos Markdown com caracteres corrompidos ainda pendentes de revisão.

---

## OKRs — Q2 2026

### Objetivo 1: O aluno termina a primeira semana com sensação de progresso real

**Contexto:** O dashboard ainda é placeholder estático, mas o bloqueador mais crítico foi resolvido — o progresso agora sincroniza com o Supabase (PR #22 + #31). Usuários autenticados não perdem mais o progresso ao trocar de dispositivo. O próximo bloqueador é o dashboard real e os eventos de tracking (sem os quais nenhum KR é mensurável).

| Key Result | Meta | Baseline |
|---|---|---|
| KR1: % de usuários que se cadastram e completam ao menos 1 lição na primeira sessão | ≥ 70% | Não mensurável (sem tracking) |
| KR2: Retenção no dia 7 (usuários que voltam à plataforma no 7º dia) | ≥ 40% | Não mensurável |
| KR3: Progresso de lições sincronizado com Supabase para 100% dos usuários autenticados | 100% | **100% — CONCLUÍDO (PR #22 + #31)** |

---

### Objetivo 2: O produto tem cara — não parece beta eterno

**Contexto:** O dashboard ainda é estático e o onboarding não usa o `technicalLevel` coletado. Mas agora que o progresso está no servidor, o dashboard real está desbloqueado — pode consumir `last_lesson_accessed` e `% progresso` diretamente do Supabase. O onboarding ainda depende de produto + design antes de implementação.

| Key Result | Meta | Baseline |
|---|---|---|
| KR1: Fluxo de auth funcional ponta a ponta: rota `/login`, `/register`, redirect pós-auth correto, estado de loading visível durante verificação de sessão | Funcional | `/login` merged — validar `/register` e redirect pós-auth E2E |
| KR2: Dashboard exibe ao menos 3 elementos dinâmicos reais: última lição acessada, % de progresso no curso atual, próxima lição recomendada | Funcional | Placeholder estático — **desbloqueado pelo PR #22** |
| KR3: Onboarding pós-cadastro roteia o usuário para a primeira lição da trilha compatível com seu `technicalLevel`, reduzindo o tempo "cadastro → primeira lição" para menos de 60 segundos | < 60s | Não implementado |

---

### Objetivo 3: O aluno tem motivo para voltar amanhã

**Contexto:** O maior inimigo é o abandono silencioso. Hoje não há nenhum mecanismo ativo de retenção — sem streak, sem certificado, nada. A sync de progresso no servidor (PR #22) agora é a fundação que faltava para implementar streak e certificado com consistência real. Anteriormente esses dados viviam apenas em localStorage — agora estão no Supabase, prontos para alimentar lógica de retenção.

| Key Result | Meta | Baseline |
|---|---|---|
| KR1: Streak implementado e visível na UI — ao menos 30% dos usuários ativos formam sequência de 3 dias no primeiro mês | 30% | Não implementado — **desbloqueado pelo PR #22** |
| KR2: Tela de conclusão com certificado (PDF ou imagem compartilhável) publicada — 100% dos usuários que concluírem o "Start" recebem certificado | 100% | Não implementado — **desbloqueado pelo PR #22** |
| KR3: Média de streak dos usuários ativos (3+ acessos) chega a 5 dias no período | 5 dias | Não mensurável |

---

## Plano de Execução

### Fase 1 — Semanas 1–3: Corrigir os gaps críticos

Tudo que estava quebrado ou faltando e impedia a jornada básica de funcionar.

**Semanas 1–2:**
- [x] ~~Criar rota `/login` e `LoginPageComponent`~~ — **FEITO (merged na main).** Wizard OAuth com Google + LinkedIn está no ar.
- [x] ~~Criar tabela `user_progress` no Supabase com RLS (SELECT, INSERT, UPDATE)~~ — **FEITO (PR #31).**
- [x] ~~Migrar `CourseProgressService` para persistir no Supabase quando o usuário estiver autenticado, mantendo localStorage como cache otimista~~ — **FEITO (PR #22).**
- [x] ~~Configurar Dependabot para segurança de dependências~~ — **FEITO (PR #32).**
- [x] ~~Workflow de CI com testes unitários automáticos em todo PR~~ — **FEITO (PR #34). 25 specs para `CourseProgressService` + specs para `AuthService`.**
- [x] ~~Revogar grants excessivos do role `anon`; adicionar policy DELETE em `user_progress` (LGPD)~~ — **FEITO (PR #35).**
- [ ] Verificar rota `/register` e redirect pós-auth funcionando ponta a ponta (smoke test do fluxo completo de auth)
- [ ] Corrigir encoding corrompido nos arquivos Markdown (tarefa editorial, baixo custo técnico)
- [ ] Transformar links `[[Obsidian]]` em `RouterLink` reais no `SchoolContentService`

**Semana 3 (próximo passo imediato):**
- [ ] **Adicionar eventos básicos de tracking (Posthog ou direto no Supabase): `lesson_started`, `lesson_completed`, `session_started`** — **sem isso, nenhum KR é mensurável. É a tarefa mais urgente agora.**
- [ ] Adicionar `last_lesson_accessed` na tabela `user_progress` ou `enrollments` (necessário para o dashboard — verificar se PR #22 já persiste esse campo; se não, adicionar)

**O que NÃO fazer ainda:** streak, certificado, áudio — sem o caminho crítico de tracking funcionando, os KRs de retenção são imensuráveis.

---

### Fase 2 — Semanas 4–6: Dashboard real + onboarding funcional

O produto precisa ter cara. A sync de progresso (PR #22) desbloqueou esta fase.

**Semanas 4–5:**
- [ ] Redesenhar `PlatformDashboardComponent` com dados reais: última lição acessada, % de progresso no "Start", próxima lição (consumindo o progresso agora persistido no Supabase)
- [ ] Onboarding pós-cadastro: ao criar conta, redirecionar para página de seleção de trilha; se `technicalLevel === 'beginner'`, ir direto para a primeira lição do "Start"
- [ ] Barra de progresso completa do curso visível na sidebar do `CourseShellComponent`

**Semana 6:**
- [ ] Refatorar `PlatformDataService` para suportar múltiplos cursos sem hardcode — `courses = computed(() => [this.buildStartCourse()])` precisa vir do Supabase ou de um array JSON. Desbloqueia publicação de um segundo curso sem refatoração urgente.

**O que NÃO fazer ainda:** certificado (depende de conclusão consolidada no servidor estabilizada), streak (depende do tracking de eventos para ser mensurável).

---

### Fase 3 — Semanas 7–10: Retenção ativa

Agora os mecanismos de hábito, porque a base está sólida — e o progresso no servidor (PR #22) é a fundação que faltava.

**Semanas 7–8:**
- [ ] Streak: colunas `streak_count` + `last_active_date` no perfil no Supabase; componente visual simples no dashboard e no course shell; lógica de atualização em cada `lesson_completed` — **o número "seu streak: 4 dias" muda comportamento; não precisa ser elaborado**

**Semanas 9–10:**
- [ ] Tela de conclusão do curso: disparada quando `setCourseCompleted` for chamado pela primeira vez; emite evento de tracking `course_completed`
- [ ] Certificado: geração client-side com Canvas ou html2canvas com nome do aluno, curso e data — suficiente para compartilhar no LinkedIn; sem necessidade de servidor por ora
- [ ] Email de reengajamento após 3 dias sem acesso (via Supabase Edge Functions) — apenas para usuários que completaram ao menos 1 lição

---

### Cadeia de dependências das features

```
rotas /login + /register (corrigir)
  → progresso sincronizado no Supabase ✅ CONCLUÍDO (PR #22 + #31)
      → tracking de eventos (próximo passo imediato)
          → dashboard real (desbloqueado)
              → streak (desbloqueado pela sync)
                  → certificado (desbloqueado pela sync)

segurança do banco ✅ CONCLUÍDO (PR #35)
CI com testes automáticos ✅ CONCLUÍDO (PR #34)
Dependabot ✅ CONCLUÍDO (PR #32)

tracking de eventos
  → todos os KRs acima se tornam mensuráveis
  (sem tracking, no dia 90 o time está voando às cegas)
```

**Tracking entra agora, imediatamente.** Com a sync de progresso resolvida, o tracking é o único bloqueador restante para que todos os KRs sejam mensuráveis.

---

## O que NÃO construir nos próximos 90 dias

| Feature | Motivo |
|---|---|
| Narração em áudio | `AudioNarrationService` implementado corretamente, mas gravar/sincronizar áudio para 58 lições é trabalho editorial massivo. A UI foi removida por uma boa razão. Não voltar até ter tração com conteúdo escrito. |
| Segundo curso novo | Antes de escalar o catálogo, resolver a retenção no curso existente. 20% de conclusão em um bom curso bate 5 cursos com 3%. |
| App mobile nativo | Angular com responsivo resolve a necessidade real de dispositivos de entrada agora. |
| Comunidade / fórum | Alto custo de moderação, baixo retorno antes de ter base de usuários. Backlog pós-OKR 3. |
| Gamificação complexa (badges, pontos, leaderboard) | Sem substância, aumenta churn depois. Streak simples basta por 90 dias. |
| CMS para instrutores | mock-db + Markdown é suficiente para o time publicar conteúdo. CMS visual custa semanas de dev. |

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| ~~Rota `/login` ausente quebra o auth guard em produção~~ | ~~**Crítico**~~ | ~~**Crítico**~~ | **RESOLVIDO** — `LoginPageComponent` merged na main. |
| ~~Progresso em localStorage = abandono silencioso por frustração técnica~~ | ~~Alta~~ | ~~Alta~~ | **RESOLVIDO** — sync com Supabase entregue no PR #22 + #31. |
| ~~Grants excessivos do role `anon` expõem dados dos usuários~~ | ~~Alta~~ | ~~Alto~~ | **RESOLVIDO** — PR #35 revogou grants e adicionou policy DELETE (LGPD). |
| Sem tracking = impossível saber se os KRs foram alcançados | Alta | Crítico | Adicionar eventos de tracking na Fase 1 — **próximo passo imediato, não negociável** |
| Encoding corrompido prejudica a percepção de qualidade | Alta | Médio | Dev é o usuário; percebe erros de encoding antes de qualquer outra coisa |
| `PlatformDataService` hardcoded bloqueia crescimento do catálogo | Médio | Médio | Tratar na Fase 2, semana 6, antes de virar dívida técnica bloqueando a Fase 3 |
| Onboarding genérico desperdiça a segmentação coletada | Alta | Médio | `technicalLevel` precisa rotear a jornada — Fase 2 |
| Testes unitários existem mas E2E ainda ausente — regressões em fluxos críticos de auth podem passar despercebidas | Médio | Alto | Avaliar smoke tests E2E na Fase 2 (Playwright ou Cypress) após o dashboard real estar estável |
