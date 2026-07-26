import { StatItem, SocialLink, Project, Service, SkillCategory } from './types';

export const HERO_STATS: StatItem[] = [
  {
    id: '1',
    value: '40+',
    label: 'Project Completed',
  },
  {
    id: '2',
    value: '1+',
    label: 'Years Experience',
  },
  {
    id: '3',
    value: '0+',
    label: 'Happy Clients',
  },
];

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'github',
    name: 'GitHub',
    iconName: 'Github',
    url: 'https://github.com',
    handle: '@ryan-dev',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    iconName: 'Instagram',
    url: 'https://instagram.com',
    handle: '@ryan.code',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    iconName: 'Youtube',
    url: 'https://youtube.com',
    handle: 'Ryan Code Studio',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    iconName: 'Tiktok',
    url: 'https://tiktok.com',
    handle: '@ryan.dev.tok',
  },
];

export const SERVICES: Service[] = [
  {
    id: 'web-dev',
    icon: 'Code2',
    title: 'Custom Web Development',
    description: 'Crafting responsive, high-performance web applications tailored to modern standards with clean HTML, CSS, JavaScript, and React.',
    highlights: ['Semantic HTML5 & Modern CSS3', 'Component-Driven Architecture', 'Cross-Browser Compatibility'],
  },
  {
    id: 'responsive-design',
    icon: 'Smartphone',
    title: 'Pixel-Perfect Responsive UI',
    description: 'Ensuring seamless layout adaptation across mobile phones, tablets, laptops, and ultra-wide desktop displays.',
    highlights: ['Mobile-First Strategy', 'Fluid Typography & Spacing', 'Touch-Optimized Controls'],
  },
  {
    id: 'performance',
    icon: 'Zap',
    title: 'Performance & Optimization',
    description: 'Optimizing web applications for blazing fast load times, silky smooth 60fps animations, and efficient asset delivery.',
    highlights: ['Lighthouse 95+ Score Target', 'Asset & Code Splitting', 'SEO Friendly Structure'],
  },
  {
    id: 'frontend-integration',
    icon: 'Layers',
    title: 'Frontend API Integration',
    description: 'Connecting frontend interfaces smoothly with backend services, REST APIs, and client-side data management.',
    highlights: ['Asynchronous Data Fetching', 'State Management', 'Interactive Micro-Animations'],
  },
];

export const PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'Nexus Dark Portfolio',
    category: 'Web App',
    description: 'A ultra-sleek dark developer portfolio featuring electric accents, glassmorphism badges, and smooth scroll animations.',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    tags: ['React', 'Tailwind CSS', 'TypeScript', 'Motion'],
    demoUrl: '#',
    githubUrl: 'https://github.com',
    featured: true,
  },
  {
    id: 'proj-2',
    title: 'Pulse Analytics Dashboard',
    category: 'Dashboard',
    description: 'A dark mode real-time metrics dashboard built with high-density data visualization and customizable widget layouts.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    tags: ['HTML5', 'CSS3', 'JavaScript', 'ChartJS'],
    demoUrl: '#',
    githubUrl: 'https://github.com',
    featured: true,
  },
  {
    id: 'proj-3',
    title: 'Vanguard E-Commerce UI',
    category: 'E-Commerce',
    description: 'Modern storefront web interface with fluid cart slide-over, dynamic product filtering, and mobile-optimized checkout.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    tags: ['React', 'Tailwind CSS', 'JavaScript'],
    demoUrl: '#',
    githubUrl: 'https://github.com',
    featured: true,
  },
  {
    id: 'proj-4',
    title: 'Cyberpunk Game Portal',
    category: 'Landing Page',
    description: 'A high-octane gaming event portal with glowing red typography, video backgrounds, and interactive character cards.',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    tags: ['HTML5', 'Tailwind CSS', 'JavaScript'],
    demoUrl: '#',
    githubUrl: 'https://github.com',
    featured: false,
  },
];

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    category: 'Frontend Core',
    skills: [
      { name: 'HTML5', level: 95, icon: 'FileCode' },
      { name: 'CSS3 / Tailwind', level: 92, icon: 'Palette' },
      { name: 'JavaScript (ES6+)', level: 88, icon: 'Braces' },
      { name: 'TypeScript', level: 82, icon: 'FileJson' },
    ],
  },
  {
    category: 'Frameworks & Libraries',
    skills: [
      { name: 'React.js', level: 85, icon: 'Atom' },
      { name: 'Vite', level: 90, icon: 'Zap' },
      { name: 'Framer Motion', level: 80, icon: 'Sparkles' },
      { name: 'Lucide Icons', level: 95, icon: 'Icons' },
    ],
  },
  {
    category: 'Tools & Workflow',
    skills: [
      { name: 'Git / GitHub', level: 88, icon: 'GitBranch' },
      { name: 'Responsive Design', level: 96, icon: 'Smartphone' },
      { name: 'VS Code', level: 92, icon: 'Terminal' },
      { name: 'Chrome DevTools', level: 90, icon: 'Cpu' },
    ],
  },
];
