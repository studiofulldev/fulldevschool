import { MentorDetail } from './mentoring.models';

export const MOCK_MENTORS: MentorDetail[] = [
  {
    id: 'm1',
    name: 'Ana Silva',
    specialty: 'Frontend & Carreira',
    bio: 'Mentora focada em fundamentos, portfólio e evolução para vagas frontend.',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=640&q=80',
    stacks: ['Angular', 'TypeScript', 'UX'],
    experience: '8 anos em produtos B2C e times de design systems.',
    socials: [
      { label: 'LinkedIn', url: 'https://linkedin.com' },
      { label: 'GitHub', url: 'https://github.com' }
    ],
    availability: [
      { date: '2026-05-02', slots: ['10:00', '11:00', '15:00'] },
      { date: '2026-05-03', slots: ['09:00', '14:00'] }
    ]
  },
  {
    id: 'm2',
    name: 'Bruno Costa',
    specialty: 'Backend & Entrevistas',
    bio: 'Mentoria para arquitetura, APIs, testes e preparação para entrevistas.',
    photoUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=640&q=80',
    stacks: ['Node.js', 'PostgreSQL', 'SRE'],
    experience: '10 anos em backend, escalabilidade e observabilidade.',
    socials: [{ label: 'LinkedIn', url: 'https://linkedin.com' }],
    availability: [
      { date: '2026-05-01', slots: ['13:00', '16:00'] },
      { date: '2026-05-04', slots: ['10:00', '11:30', '17:00'] }
    ]
  }
];

