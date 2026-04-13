import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-platform-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dashboard-page">
      <article class="dashboard-card">
        <span class="dashboard-eyebrow">Home</span>
        <h1>Central da Fulldev School</h1>
        <p>
          Este espaco vai concentrar avisos, novidades da plataforma, recomendacoes de estudo e atalhos
          para os proximos cursos.
        </p>
      </article>

      <section class="dashboard-grid">
        <article class="dashboard-card">
          <span class="dashboard-eyebrow">Status</span>
          <strong>Estrutura inicial da plataforma</strong>
          <p>Base pronta para catalogo de cursos, login, conta e progresso por modulo.</p>
        </article>

        <article class="dashboard-card">
          <span class="dashboard-eyebrow">Proximo passo</span>
          <strong>Catalogo e recomendacoes</strong>
          <p>Vamos organizar melhor esta area depois, com destaques, trilhas e recomendacoes.</p>
        </article>
      </section>
    </section>
  `,
  styles: [
    `
      .dashboard-page,
      .dashboard-grid {
        display: grid;
        gap: 18px;
      }

      .dashboard-grid {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }

      .dashboard-card {
        display: grid;
        gap: 10px;
        padding: 24px;
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
      }

      .dashboard-eyebrow {
        color: var(--fd-soft);
        font-size: var(--fd-text-xs);
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .dashboard-card h1,
      .dashboard-card p,
      .dashboard-card strong {
        margin: 0;
      }

      .dashboard-card p {
        color: var(--fd-muted);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformDashboardComponent {}
