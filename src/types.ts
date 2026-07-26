export interface StatItem {
  id: string;
  value: string;
  label: string;
}

export interface SocialLink {
  id: string;
  name: string;
  iconName: 'Github' | 'Instagram' | 'Youtube' | 'Tiktok' | 'Linkedin' | 'Twitter' | 'Mail';
  url: string;
  handle: string;
}

export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  tags: string[];
  demoUrl: string;
  githubUrl: string;
  featured?: boolean;
}

export interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
  highlights: string[];
}

export interface SkillCategory {
  category: string;
  skills: {
    name: string;
    level: number;
    icon: string;
  }[];
}
