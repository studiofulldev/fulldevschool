import { CourseDetail } from './courses.models';

export const MOCK_COURSES: CourseDetail[] = [
  {
    slug: 'guia-de-tecnologia',
    title: 'Guia de Tecnologia',
    description: 'A porta de entrada para escolher sua trilha na área de tecnologia.',
    longDescription:
      'Um curso editorial para orientar sua entrada na área, com módulos de base, mapa de áreas, trilhas e plano de ação.',
    category: 'Carreira',
    imageUrl: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1200&q=80',
    hours: 12,
    instructorName: 'FullDev',
    modules: [
      {
        slug: 'comece-aqui',
        title: 'Comece Aqui',
        subtitle: 'Entenda o jogo e comece com clareza',
        topics: [
          { slug: 'boas-vindas', title: 'Boas-vindas', minutes: 6 },
          { slug: 'como-aprender', title: 'Como aprender', minutes: 14 },
          { slug: 'armadilhas', title: 'Armadilhas comuns', minutes: 10 }
        ]
      },
      {
        slug: 'mapa-das-areas',
        title: 'Mapa das Áreas',
        subtitle: 'Escolha com contexto',
        topics: [
          { slug: 'frontend', title: 'Frontend', minutes: 12 },
          { slug: 'backend', title: 'Backend', minutes: 12 },
          { slug: 'dados', title: 'Dados', minutes: 12 }
        ]
      }
    ]
  }
];

