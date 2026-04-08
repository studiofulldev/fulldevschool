# Fulldev School — Guia de Arquitetura Frontend

Este arquivo é carregado automaticamente pelo Claude Code em toda conversa neste projeto.
Siga estas regras sempre que criar, modificar ou revisar componentes Angular.

---

## Stack

- Angular 19 (standalone components, signals)
- Supabase (auth + DB)
- Angular Material (ícones, menus, botões)
- DOMPurify (sanitização de HTML)
- Deploy: Vercel

---

## Estrutura de pastas

```
src/app/
  data/          — Serviços de dados somente leitura (conteúdo, navegação)
  guards/        — Route guards (CanActivateFn)
  pages/         — Componentes de página (roteáveis, um por rota)
  services/      — Serviços de negócio (auth, progresso, config, temas)
  shells/        — Layouts que envolvem páginas (sidebar, header, router-outlet)
```

Não criar subpastas além dessas sem discutir com o time. Se um novo domínio surgir
(ex: `forms/`, `pipes/`), abrir discussão antes.

---

## Classificação de componentes

### 1. Shell (`shells/`)
Gerencia **layout e roteamento**. Injeta serviços apenas para dados de UI estrutural
(tema, usuário logado para exibir nome/avatar no header). Não executa operações de negócio.

Exemplos: `platform-shell.component.ts`, `course-shell.component.ts`

### 2. Page (`pages/`)
Componente **smart** — coordena serviços, gerencia estado local, lida com ações do usuário.
Uma page por rota. Pode injetar múltiplos serviços.

Regra: a page orquestra, não implementa. Lógica de negócio fica nos serviços.

Exemplos: `login-page.component.ts`, `account-page.component.ts`

### 3. Componentes reutilizáveis (futuro: `components/`)
Componentes **apresentacionais** — recebem dados via `@Input()`, emitem eventos via `@Output()`.
Não injetam serviços de negócio. Completamente agnósticos ao contexto da aplicação.

---

## Separação de responsabilidades

### O que fica no componente (`.component.ts`)
- Estado local de UI (`loading`, `errorMessage`, valores de formulário)
- Métodos handler que delegam para serviços (`async signIn() { await this.auth.signIn(...) }`)
- `computed()` para derivar dados de display a partir de signals de serviço
- Lógica de navegação via `Router` (ex: `router.navigateByUrl('/courses/home')`)

### O que fica nos serviços (`services/` ou `data/`)
- Lógica de negócio (autenticação, persistência, transformação de dados)
- Estado compartilhado entre componentes (signals no serviço, readonly para fora)
- Chamadas ao Supabase, HTTP, localStorage
- Regras de validação de domínio

### Nunca no componente
- Chamadas diretas ao Supabase, fetch ou localStorage
- Regras de negócio (ex: "aceite de termos é obrigatório")
- Transformação complexa de dados que não seja para display

---

## Separação de arquivos por tipo de componente

### Regra geral: sempre separar template e estilos

Separar template e estilos em arquivos próprios é boa prática em qualquer framework —
melhora legibilidade, facilita code review (diff limpo por arquivo) e é o padrão do Angular CLI.

| Elemento       | Inline OK?                                      | Arquivo separado?        |
|----------------|-------------------------------------------------|--------------------------|
| Template HTML  | Nunca em pages/shells. Só em componentes de 1-3 linhas triviais | `templateUrl` sempre em pages/shells |
| Estilos CSS    | Nunca em pages/shells                           | `styleUrl` sempre        |
| Lógica `.ts`   | Até ~150 linhas de lógica de componente         | extrair para serviço     |

**Pages e shells sempre usam arquivos separados:**
```ts
@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
```

**Exceção:** componentes puramente presentacionais de uma única responsabilidade simples
(ex: um `<app-badge>` que exibe um texto com cor) podem ter template de 1-3 linhas inline.
Se tiver `@if`, `@for` ou mais de uma tag, já merece arquivo separado.

---

## Padrão de signals

**Serviço** — expõe signals como readonly:
```ts
private readonly _state = signal<AuthUser | null>(null);
readonly state = this._state.asReadonly();
readonly isActive = computed(() => this._state() !== null);
```

**Componente** — injeta e usa os signals do serviço para display:
```ts
protected readonly auth = inject(AuthService);
protected readonly label = computed(() => this.auth.user()?.name ?? 'Visitante');
```

**Estado local de UI** — signal no próprio componente:
```ts
protected readonly loading = signal(false);
protected readonly errorMessage = signal<string | null>(null);
```

---

## Formulários

- Não usar `FormsModule` com `[(ngModel)]` para formulários complexos — preferir
  Angular Reactive Forms (`FormBuilder`, `FormGroup`) quando houver validação cruzada.
- Para formulários simples de login/cadastro com poucos campos, `ngModel` é aceitável.
- Nunca fazer validação de regras de negócio no template — mover para o serviço ou para
  um método do componente antes de chamar o serviço.

---

## Inputs e acessibilidade

- Todo `<input>` deve ter `id` e `<label for="...">` correspondente.
- Botões de submit devem ter `type="submit"` explícito dentro de `<form>`.
- Mensagens de erro devem ter `role="alert"` para leitores de tela.
- Imagens devem ter `alt` descritivo (nunca vazio para imagens com conteúdo).

---

## Segurança (regras fixas, não negociáveis)

- **Nunca renderizar HTML sem DOMPurify.** Todo output de `marked` ou qualquer
  renderização dinâmica passa por `DOMPurify.sanitize()`.
- **Nunca confiar em dados do `localStorage` para decisões de autenticação.**
  `isAuthenticated` depende de sessão verificada pelo Supabase.
- **Nunca fazer `.trim()` em senhas.** Espaços são caracteres válidos.
- **Validar URLs externas** antes de usar como `src` de imagem — usar allowlist de domínios.
- **Route guards em todas as rotas protegidas.** Não depender apenas de UI condicional.

---

## Checklist antes de qualquer commit de componente

- [ ] Lógica de negócio está no serviço, não no componente?
- [ ] Template tem mais de 80 linhas? → extrair para `.html`
- [ ] Estilos têm mais de 100 linhas? → extrair para `.scss`
- [ ] Inputs têm `label` e `id` correspondente?
- [ ] Mensagens de erro têm `role="alert"`?
- [ ] `ng build` passou sem erros?

---

## O que NÃO fazer

```ts
// ❌ Chamada direta ao Supabase no componente
async login() {
  const { data } = await supabase.auth.signIn(...)
}

// ✅ Delegar ao serviço
async login() {
  const result = await this.auth.signInWithEmail(this.email, this.password);
}
```

```ts
// ❌ Lógica de negócio no componente
if (!this.email.includes('@') || this.password.length < 8) { ... }

// ✅ Validação no serviço
const result = await this.auth.signInWithEmail(this.email, this.password);
if (!result.ok) this.errorMessage.set(result.message);
```

```html
<!-- ❌ Renderizar HTML sem sanitização -->
<div [innerHTML]="rawHtml"></div>

<!-- ✅ Sempre sanitizar -->
<div [innerHTML]="sanitizedHtml()"></div>
<!-- onde sanitizedHtml = computed(() => DOMPurify.sanitize(this.rawHtml())) -->
```

---

## Referências no código

| Padrão               | Onde ver                          |
|----------------------|-----------------------------------|
| Service com signals  | `services/auth.service.ts`        |
| Route guard          | `guards/auth.guard.ts`            |
| Shell layout         | `shells/platform-shell.component.ts` |
| Template separado    | `shells/course-shell.component.ts` |
| Page smart           | `pages/account-page.component.ts` |
| Sanitização markdown | `data/school-content.service.ts`  |
| Validação de URL     | `services/auth.service.ts` → `sanitizeAvatarUrl()` |
