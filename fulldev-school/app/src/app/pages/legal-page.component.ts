import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

type LegalSection = {
  heading: string;
  paragraphs: string[];
};

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: 'Visao Geral',
    paragraphs: [
      'Esta Politica de Privacidade descreve como a Fulldev School e iniciativas relacionadas do ecossistema FullDev tratam dados pessoais de visitantes, alunos, membros da comunidade e participantes de projetos futuros vinculados a esta operacao.',
      'Ao utilizar a plataforma, formularios, areas logadas, canais de contato ou espacos comunitarios, a pessoa usuaria declara ciencia desta politica, sem prejuizo dos direitos garantidos pela legislacao aplicavel.'
    ]
  },
  {
    heading: 'Dados Tratados',
    paragraphs: [
      'Podemos tratar dados como nome, e-mail, telefone ou WhatsApp, idade ou faixa etaria, nivel tecnico, instituicao de ensino, dados de autenticacao, preferencias de uso, historico de interacoes, cookies, logs e informacoes tecnicas de acesso.',
      'O tratamento busca respeitar os principios de necessidade, minimizacao, seguranca, transparencia e adequacao a finalidade.'
    ]
  },
  {
    heading: 'Finalidades',
    paragraphs: [
      'Os dados podem ser usados para criar e manter contas, autenticar acessos, liberar funcionalidades, registrar consentimentos, responder suporte, prevenir fraude, manter seguranca, melhorar a experiencia e cumprir obrigacoes legais, regulatorias e contratuais.',
      'Dados nao devem ser utilizados para finalidades incompativeis com o contexto de coleta sem nova base legal adequada.'
    ]
  },
  {
    heading: 'Compartilhamento E Retencao',
    paragraphs: [
      'Os dados podem ser compartilhados com provedores de infraestrutura, autenticacao, banco de dados, hospedagem, analytics, mensageria e suporte, sempre dentro de necessidade operacional e com controles apropriados.',
      'Os dados sao mantidos apenas pelo tempo necessario para operacao do servico, seguranca, auditoria, defesa de direitos e cumprimento de obrigacoes legais, podendo depois ser excluidos, anonimizados ou bloqueados.'
    ]
  },
  {
    heading: 'Direitos Da Pessoa Usuaria',
    paragraphs: [
      'Observados os limites legais e tecnicos, a pessoa usuaria pode solicitar confirmacao de tratamento, acesso, correcao, exclusao, bloqueio, anonimização, informacao sobre compartilhamentos relevantes, revogacao de consentimento e oposicao a tratamentos indevidos.',
      'Solicitacoes de privacidade devem ser encaminhadas ao canal oficial de atendimento quando publicado pela operacao.'
    ]
  }
];

const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: 'Objeto E Aceite',
    paragraphs: [
      'Estes Termos de Uso regulam o acesso e a utilizacao da Fulldev School, da comunidade FullDev e de produtos, paginas e projetos futuros vinculados ao mesmo ecossistema operacional.',
      'Ao acessar ou utilizar a plataforma, a pessoa usuaria concorda com estes termos e com a politica de privacidade aplicavel.'
    ]
  },
  {
    heading: 'Uso Permitido',
    paragraphs: [
      'A plataforma pode ser utilizada para fins licitos, pessoais, educacionais, profissionais e comunitarios dentro dos limites das funcionalidades disponibilizadas.',
      'Nao e permitido fraudar sistemas, violar seguranca, raspar dados sem autorizacao, contornar mecanismos de acesso, praticar abuso, assedio, spam ou publicar conteudo que viole direitos de terceiros.'
    ]
  },
  {
    heading: 'Conta E Responsabilidades',
    paragraphs: [
      'A pessoa usuaria e responsavel pela veracidade das informacoes prestadas, pela guarda de suas credenciais e pelo uso adequado de sua conta e de seus dispositivos.',
      'A plataforma pode restringir ou suspender acessos em casos de fraude, risco tecnico, uso abusivo, violacao destes termos ou necessidade legitima de seguranca.'
    ]
  },
  {
    heading: 'Propriedade Intelectual E Comunidade',
    paragraphs: [
      'Marca, interface, software, documentacao, estrutura editorial e demais ativos proprios permanecem protegidos por seus titulares, salvo indicacao expressa em contrario.',
      'Em espacos colaborativos, a pessoa usuaria permanece responsavel pelo conteudo que publica e concede apenas a licenca necessaria para hospedagem, exibicao, moderacao e operacao do servico.'
    ]
  },
  {
    heading: 'Disponibilidade E Limites',
    paragraphs: [
      'A plataforma pode alterar, evoluir, interromper ou descontinuar funcionalidades, trilhas, integracoes e fluxos operacionais, temporaria ou permanentemente.',
      'Nao ha garantia de disponibilidade ininterrupta, ausencia absoluta de falhas ou resultado educacional, profissional ou financeiro especifico.'
    ]
  }
];

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule],
  template: `
    <section class="legal-page">
      <header class="legal-hero">
        <span class="legal-eyebrow">Documentos legais</span>
        <h1>{{ title() }}</h1>
        <p>{{ intro() }}</p>

        <div class="legal-actions">
          <a mat-stroked-button class="legal-button" routerLink="/">Voltar para a plataforma</a>
          <a
            mat-flat-button
            class="legal-button legal-button--primary"
            [routerLink]="alternatePath()"
          >
            {{ alternateLabel() }}
          </a>
        </div>
      </header>

      <section class="legal-content">
        @for (section of sections(); track section.heading) {
          <article class="legal-section">
            <h2>{{ section.heading }}</h2>
            @for (paragraph of section.paragraphs; track paragraph) {
              <p>{{ paragraph }}</p>
            }
          </article>
        }
      </section>
    </section>
  `,
  styles: [
    `
      .legal-page {
        display: grid;
        gap: 20px;
        max-width: 920px;
        margin: 0 auto;
        padding: 32px 20px 48px;
      }

      .legal-hero,
      .legal-section {
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
      }

      .legal-hero {
        display: grid;
        gap: 14px;
        padding: 28px;
      }

      .legal-eyebrow {
        color: var(--fd-soft);
        font-size: var(--fd-text-xs);
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .legal-hero h1,
      .legal-hero p,
      .legal-section h2,
      .legal-section p {
        margin: 0;
      }

      .legal-hero p,
      .legal-section p {
        color: var(--fd-muted);
        line-height: 1.7;
      }

      .legal-content {
        display: grid;
        gap: 16px;
      }

      .legal-section {
        display: grid;
        gap: 10px;
        padding: 22px 24px;
      }

      .legal-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .legal-button {
        min-height: 44px;
        padding-inline: 18px;
        border-radius: var(--fd-radius);
        font-weight: 600;
      }

      .legal-button--primary {
        border: 1px solid var(--fd-accent) !important;
        color: var(--fd-white) !important;
        background: var(--fd-accent) !important;
        box-shadow: none !important;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly documentType = computed(() => this.route.snapshot.data['document'] as 'privacy' | 'terms');

  protected readonly title = computed(() =>
    this.documentType() === 'privacy' ? 'Politica de Privacidade' : 'Termos de Uso'
  );

  protected readonly intro = computed(() =>
    this.documentType() === 'privacy'
      ? 'Documento publico base sobre coleta, uso, armazenamento, protecao e direitos relacionados a dados pessoais no ecossistema FullDev.'
      : 'Documento publico base que regula acesso, uso permitido, responsabilidades, limites operacionais e protecoes juridicas da plataforma.'
  );

  protected readonly sections = computed(() =>
    this.documentType() === 'privacy' ? PRIVACY_SECTIONS : TERMS_SECTIONS
  );

  protected readonly alternateLabel = computed(() =>
    this.documentType() === 'privacy' ? 'Ler Termos de Uso' : 'Ler Politica de Privacidade'
  );

  protected readonly alternatePath = computed(() =>
    this.documentType() === 'privacy' ? '/legal/terms' : '/legal/privacy'
  );
}
