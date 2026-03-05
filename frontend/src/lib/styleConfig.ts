import { EmailStyle } from '../types';

export interface StyleInfo {
  id: EmailStyle;
  name: string;
  nameZh: string;
  scenario: string;
  description: string;
  icon: string;
}

export const STYLES: StyleInfo[] = [
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    nameZh: '专业正式',
    scenario: 'Finance / Consulting / Executive',
    description: 'Structured and polished. Clear value proposition, precise language, explicit next steps.',
    icon: '💼',
  },
  {
    id: 'WARM',
    name: 'Warm & Genuine',
    nameZh: '温暖亲切',
    scenario: 'Internet / Startup',
    description: 'First-person, authentic and conversational. Invites a casual chat.',
    icon: '☕',
  },
  {
    id: 'CONCISE',
    name: 'Concise',
    nameZh: '简洁直接',
    scenario: 'Engineering Culture',
    description: 'Under 150 words. No filler. One core hook. Straight to the point.',
    icon: '⚡',
  },
  {
    id: 'STORYTELLING',
    name: 'Storytelling',
    nameZh: '讲故事',
    scenario: 'Product / Growth',
    description: 'Opens with a scene, narrative transition, open-ended close.',
    icon: '📖',
  },
];

export const LANGUAGES = [
  { code: 'Chinese', label: '中文' },
  { code: 'English', label: 'English' },
  { code: 'Japanese', label: '日本語' },
  { code: 'Korean', label: '한국어' },
  { code: 'French', label: 'Français' },
  { code: 'Spanish', label: 'Español' },
];

export const ROLE_LABELS: Record<string, string> = {
  HR: 'HR / Recruiter',
  INTERVIEWER: 'Interviewer',
  EXECUTIVE: 'Executive',
  REFERRAL: 'Internal Referral',
  CUSTOM: 'Custom',
};
