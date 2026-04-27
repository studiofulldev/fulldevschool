export interface CourseSummary {
  slug: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  hours: number;
  instructorName: string;
}

export interface CourseTopic {
  slug: string;
  title: string;
  minutes: number;
}

export interface CourseModule {
  slug: string;
  title: string;
  subtitle: string;
  topics: CourseTopic[];
}

export interface CourseDetail extends CourseSummary {
  longDescription: string;
  modules: CourseModule[];
}

