export interface MentorSummary {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  photoUrl: string;
  stacks: string[];
}

export interface MentorAvailabilityDay {
  date: string; // YYYY-MM-DD
  slots: string[]; // HH:mm
}

export interface MentorDetail extends MentorSummary {
  experience: string;
  socials: { label: string; url: string }[];
  availability: MentorAvailabilityDay[];
}

