import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-dashboard-home-page',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <div class="grid">
      <mat-card class="card">
        <mat-card-title>Bem-vindo(a)</mat-card-title>
        <mat-card-content>
          <p>Continue de onde parou ou explore novos cursos e mentorias.</p>
        </mat-card-content>
      </mat-card>

      <mat-card class="card">
        <mat-card-title>Próximos passos</mat-card-title>
        <mat-card-content>
          <ul>
            <li>Explorar cursos</li>
            <li>Agendar mentoria</li>
            <li>Atualizar seu perfil</li>
          </ul>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .card {
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      mat-card-title {
        font-weight: 700;
      }

      p,
      li {
        color: rgba(232, 234, 240, 0.85);
      }

      @media (max-width: 960px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardHomePageComponent {}

