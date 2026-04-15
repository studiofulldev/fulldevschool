# Fulldev School — Guia do Projeto

Este arquivo é carregado automaticamente pelo Claude Code em toda conversa neste projeto.
Contém visão de produto, estado atual, OKRs, backlog e regras de arquitetura.

---

## Visão do Produto

**Fulldev School** é uma plataforma educacional de desenvolvimento de software da FullDev.

O objetivo é transformar o conteúdo editorial existente em uma experiência de plataforma real: com login, progresso, conta, trilhas e comunidade — tudo clean, funcional e preparado para crescer.

### Usuário principal

Desenvolvedor em formação:
- Iniciante que quer entrar no mercado (quer emprego, não diploma)
- Junior que quer evoluir (já trabalha, quer crescer na carreira)
- Pessoa em transição de carreira (quer se tornar dev)

**Comportamento real:** assiste aulas no celular no ônibus, no desktop em casa. Zero paciência para conteúdo lento ou mal produzido. Compara tudo com o YouTube. Se a experiência for pior, abre o YouTube.

**Maior inimigo:** abandono silencioso — o aluno que para de acessar sem cancelar. Não fala nada. Simplesmente some.

**Competidores:** Alura, Rocketseat, DIO.

### Diferencial da Fulldev School

- Ambiente real de desenvolvimento (não apenas teoria)
- Review de PRs pela comunidade
- IA como ferramenta de aceleração de carreira, não como atalho
- Comunidade de devs que fazem parte de algo maior
- Conteúdo editorial forte: trilhas, mapa de área, mercado, portfólio, mindset

---

## Estado Atual do Produto (abril 2026)

### ✅ Pronto

- **Autenticação completa** — login Google, LinkedIn e email/senha via Supabase
- **Conteúdo mockado funcional** — app renderiza a partir de `mock-db/navigation/tree.json` e `mock-db/doc/`, sem hardcode na UI
- **1 curso:** "Start: Começando na tecnologia" com 58 lições em 16 seções temáticas
- **Progresso sincronizado com Supabase** — `CourseProgressService` persiste progresso de lição/módulo/curso no Supabase para usuários autenticados; `localStorage` como cache otimista e fallback offline. Tabela `user_progress` com RLS completa (SELECT, INSERT, UPDATE, DELETE). Entregue nos PRs #22 e #31.
- **Arquitetura Angular 19 limpa** — shells / pages / services / data / guards com signals e OnPush
- **Papéis de usuário** — `admin`, `instructor`, `user` na base de auth
- **Guards** — `authGuard`, `profileCompletionGuard`, `roleGuard` funcionando
- **`AudioNarrationService`** via Web Speech API — código existe, removido da UI intencionalmente (aguarda conteúdo de áudio)
- **Docker + nginx** para deploy containerizado
- **Vercel** configurado
- **Página 404** com humor dev e matrix rain vermelho no fundo
- **Segurança do banco reforçada** — grants excessivos do role `anon` revogados em todas as tabelas; policy DELETE em `user_progress` para compliance LGPD (PR #35)
- **CI com testes unitários automáticos** — workflow executa em todo PR; 25 specs para `CourseProgressService` + specs para `AuthService` (PR #34)
- **Dependabot configurado** — atualizações de segurança de dependências automáticas (PR #32)

### 🔄 Em andamento

- **Nenhum item em andamento no momento.** Os gaps críticos de infraestrutura foram resolvidos.

### 📋 Próximo (backlog priorizado)

1. **Tracking de eventos** — sem `lesson_started`, `lesson_completed`, `session_started` nenhum KR é mensurável; usar Posthog ou direto no Supabase. **Prioridade máxima — bloqueia a mensuração de todos os OKRs.**
2. **Dashboard real** — `/courses/home` ainda é placeholder estático; agora desbloqueado pela sync de progresso (PR #22). Precisa mostrar: última lição acessada, % de progresso no curso atual, próxima lição recomendada.
3. **Verificar rota `/register` e redirect pós-auth** — smoke test do fluxo completo de auth ponta a ponta
4. **Corrigir encoding corrompido nos Markdowns** — tarefa editorial, baixo custo técnico
5. **Transformar links `[[Obsidian]]` em `RouterLink` reais** no `SchoolContentService`
6. **Onboarding pós-cadastro** — usar `technicalLevel` coletado no cadastro para rotear o usuário à trilha correta; reduzir "cadastro → primeira lição" para menos de 60 segundos
7. **Áreas admin e instrutor** — papéis existem na base, mas flows de gestão ainda estão fora da V1
8. **Cursos alimentados por instrutores** — conteúdo ainda vem do `mock-db`; próximo passo é permitir cadastro/edição por instrutores
9. **Áudio guiado** — base técnica existe no frontend; aguarda consolidação do conteúdo
10. **Edição completa de perfil e imagem** — dados extras do cadastro existem parcialmente; edição e troca de avatar ainda não fechados
11. **Streak de acesso** — retenção ativa; colunas `streak_count` + `last_active_date` no perfil; desbloqueado pela sync de progresso (PR #22)
12. **Certificado de conclusão** — tela de conclusão + geração client-side com Canvas ou html2canvas; desbloqueado pela sync de progresso (PR #22)
13. **Fórum por tópico** — promover interações entre membros; moderação a definir
14. **Votos no curso** — métrica de sucesso do conteúdo
15. **Ranking de membros** — gamificação inteligente; precisa ser discutida antes de implementar para não banalizar

---

## OKRs — Q2 2026 (90 dias)

### Objetivo 1: O aluno termina a primeira semana com sensação de progresso real

**Contexto:** o dashboard é um placeholder estático e o progresso some ao trocar de dispositivo. Os bloqueadores críticos são a sync de progresso e um dashboard real. Sem isso, os outros OKRs são ficção.

| Key Result | Meta | Baseline |
|---|---|---|
| KR1: % de usuários que se cadastram e completam ao menos 1 lição na primeira sessão | ≥ 70% | Não mensurável (sem tracking) |
| KR2: Retenção no dia 7 (usuários que voltam à plataforma no 7º dia) | ≥ 40% | Não mensurável |
| KR3: Progresso de lições sincronizado com Supabase para 100% dos usuários autenticados | 100% | 0% (só localStorage) |

---

### Objetivo 2: O produto tem cara — não parece beta eterno

**Contexto:** o dashboard é estático, o onboarding não usa o `technicalLevel` coletado. O produto coleta dados do usuário mas não faz nada com eles. Isso quebra a confiança na primeira sessão — exatamente quando a comparação com o YouTube é mais violenta.

| Key Result | Meta | Baseline |
|---|---|---|
| KR1: Fluxo de auth funcional ponta a ponta: `/login`, `/complete-profile`, redirect pós-auth correto, estado de loading visível | Funcional | Auth existe; E2E não validado |
| KR2: Dashboard mostra ao menos 3 elementos dinâmicos reais: última lição, % progresso no curso atual, próxima lição recomendada | Funcional | Placeholder estático |
| KR3: Onboarding pós-cadastro redireciona para trilha compatível com `technicalLevel`, reduzindo tempo "cadastro → primeira lição" para < 60 segundos | < 60s | Não implementado |

---

### Objetivo 3: O aluno tem motivo para voltar amanhã

**Contexto:** o maior inimigo é o abandono silencioso. Hoje não há nenhum mecanismo ativo de retenção — sem streak, sem certificado, sem nada. O conteúdo existe (58 lições) mas a plataforma não cria o hábito.

| Key Result | Meta | Baseline |
|---|---|---|
| KR1: Streak implementado e visível na UI — ao menos 30% dos usuários ativos formam sequência de 3 dias no primeiro mês | 30% | Não implementado |
| KR2: Tela de conclusão com certificado (PDF ou imagem compartilhável) publicada — 100% dos que concluírem o "Start" recebem certificado | 100% | Não implementado |
| KR3: Média de streak de usuários ativos (3+ acessos) chega a 5 dias no período | 5 dias | Não mensurável |

---

## O que NÃO construir nos próximos 90 dias

| Feature | Motivo |
|---|---|
| Narração em áudio | `AudioNarrationService` implementado, mas gravar/sincronizar áudio para 58 lições é trabalho editorial massivo. Não voltar até ter tração com conteúdo escrito. |
| Segundo curso novo | Antes de escalar catálogo, resolver retenção no curso existente. |
| App mobile nativo | Angular com responsivo resolve a necessidade real agora. |
| Comunidade/fórum | Alto custo de moderação, baixo retorno antes de ter base de usuários. Backlog pós-OKR 3. |
| Gamificação complexa (badges, pontos, leaderboard) | Sem substância, aumenta churn depois. Streak simples basta por 90 dias. |
| CMS visual para instrutores | `mock-db` + Markdown é suficiente para o time publicar conteúdo agora. |

---

## Cadeia de dependências de features

```
auth completo (login + complemento de perfil)
  → progresso sincronizado no Supabase
      → dashboard real
          → streak
              → certificado

tracking de eventos
  → todos os KRs acima se tornam mensuráveis
  (sem tracking, o time voa cego)
```

**Tracking entra na Fase 1.** É a segunda coisa mais urgente depois da sync de progresso.

---

## Tabelas Supabase (modelo de dados)

| Tabela | Função | Status |
|---|---|---|
| `auth.users` | Gerenciado pelo Supabase Auth | Ativo |
| `profiles` | Perfil público/privado do usuário (`full_name`, `avatar_url`, `technical_level`, `streak_count`, `last_active_date`, etc.) | Ativo |
| `email_leads` | Emails coletados no cadastro para disparo de comunicações | Ativo |
| `user_progress` | Progresso por usuário autenticado — lições, módulos, cursos; RLS com SELECT, INSERT, UPDATE, DELETE; policy DELETE para LGPD | **Criada (PR #31)** |
| `courses` | Catálogo de cursos | Planejada |
| `modules` | Módulos por curso | Planejada |
| `lessons` | Lições por módulo | Planejada |
| `enrollments` | Vínculo usuário ↔ curso (`last_lesson_id`, `status`, `completed_at`) | Planejada |
| `lesson_progress` | Progresso granular por lição (`completed`, `status`, `last_block_id`) | Planejada — avaliar consolidação com `user_progress` |

---

## Arquitetura Técnica

### Stack

- **Angular 19** (standalone components, signals, OnPush)
- **Supabase** (auth + DB + Edge Functions)
- **Angular Material** (ícones, menus, botões)
- **DOMPurify** (sanitização de HTML)
- **Deploy:** Vercel (prod) / Docker + nginx (local/container)

### Estrutura de pastas

```
src/app/
  data/          — Serviços de dados somente leitura (conteúdo, navegação)
  guards/        — Route guards (CanActivateFn)
  pages/         — Componentes de página (roteáveis, um por rota)
  services/      — Serviços de negócio (auth, progresso, config, temas)
  shells/        — Layouts que envolvem páginas (sidebar, header, router-outlet)
```

Não criar subpastas além dessas sem discutir com o time.

### Classificação de componentes

**Shell (`shells/`)** — gerencia layout e roteamento. Injeta serviços apenas para dados de UI estrutural. Não executa operações de negócio.

**Page (`pages/`)** — componente smart. Coordena serviços, gerencia estado local, lida com ações do usuário. Uma page por rota. A page orquestra, não implementa.

**Componente reutilizável (futuro: `components/`)** — apresentacional. Recebe `@Input()`, emite `@Output()`. Não injeta serviços de negócio.

### Separação de responsabilidades

**No componente (`.component.ts`):**
- Estado local de UI (`loading`, `errorMessage`, valores de formulário)
- Métodos handler que delegam para serviços
- `computed()` para derivar dados de display
- Lógica de navegação via `Router`

**Nos serviços (`services/` ou `data/`):**
- Lógica de negócio (autenticação, persistência, transformação)
- Estado compartilhado entre componentes (signals readonly para fora)
- Chamadas ao Supabase, HTTP, localStorage
- Regras de validação de domínio

**Nunca no componente:**
- Chamadas diretas ao Supabase, fetch ou localStorage
- Regras de negócio
- Transformação complexa de dados que não seja para display

### Separação de arquivos

Pages e shells sempre usam arquivos separados:
```ts
@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
```

Componentes de 1-3 linhas triviais podem ter template inline.

### Padrão de signals

```ts
// Serviço — expõe signals como readonly
private readonly _state = signal<AuthUser | null>(null);
readonly state = this._state.asReadonly();
readonly isActive = computed(() => this._state() !== null);

// Componente — injeta e usa
protected readonly auth = inject(AuthService);
protected readonly label = computed(() => this.auth.user()?.name ?? 'Visitante');

// Estado local de UI
protected readonly loading = signal(false);
protected readonly errorMessage = signal<string | null>(null);
```

---

## Segurança (não negociável)

- **Nunca renderizar HTML sem DOMPurify.** Todo output de `marked` ou renderização dinâmica passa por `DOMPurify.sanitize()`.
- **Nunca confiar em localStorage para decisões de autenticação.** `isAuthenticated` depende de sessão verificada pelo Supabase.
- **Nunca fazer `.trim()` em senhas.** Espaços são caracteres válidos.
- **Validar URLs externas** antes de usar como `src` de imagem — usar allowlist de domínios.
- **Route guards em todas as rotas protegidas.** Não depender apenas de UI condicional.

---

## Formulários

- Formulários complexos: Angular Reactive Forms (`FormBuilder`, `FormGroup`)
- Formulários simples (login, poucos campos): `ngModel` aceitável
- Nunca validar regras de negócio no template

## Inputs e acessibilidade

- Todo `<input>` deve ter `id` e `<label for="...">` correspondente
- Botões de submit: `type="submit"` explícito dentro de `<form>`
- Mensagens de erro: `role="alert"` para leitores de tela
- Imagens: `alt` descritivo (nunca vazio para imagens com conteúdo)

---

## Checklist antes de qualquer commit de componente

- [ ] Lógica de negócio está no serviço, não no componente?
- [ ] Template tem mais de 80 linhas? → extrair para `.html`
- [ ] Estilos têm mais de 100 linhas? → extrair para `.scss`
- [ ] Inputs têm `label` e `id` correspondente?
- [ ] Mensagens de erro têm `role="alert"`?
- [ ] `ng build` passou sem erros?

---

## Referências no código

| Padrão | Onde ver |
|---|---|
| Service com signals | `services/auth.service.ts` |
| Route guard | `guards/auth.guard.ts` |
| Shell layout | `shells/platform-shell.component.ts` |
| Template separado | `shells/course-shell.component.ts` |
| Page smart | `pages/account-page/account-page.component.ts` |
| Sanitização markdown | `data/school-content.service.ts` |
| Validação de URL | `services/auth.service.ts` → `sanitizeAvatarUrl()` |
| Mock content | `mock-db/navigation/tree.json` + `mock-db/doc/` |
| OKRs e plano de execução | `plan/okrs.md` |
