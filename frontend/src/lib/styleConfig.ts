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

export function recommendStyle(candidateText: string, jobTitle: string): EmailStyle {
  const text = (candidateText + ' ' + jobTitle).toLowerCase();
  const scores: Record<EmailStyle, number> = { PROFESSIONAL: 0, WARM: 0, CONCISE: 0, STORYTELLING: 0 };

  const keywords: Record<EmailStyle, string[]> = {
    PROFESSIONAL: ['finance', 'banking', 'consulting', 'executive', 'director', 'vp ', 'cfo', 'coo', 'cto', 'ceo', 'investment', 'legal', '金融', '银行', '咨询', '总监', '副总', '律师'],
    WARM: ['startup', 'internet', 'mobile', 'app', 'social', 'saas', 'platform', '创业', '互联网', '移动', '平台'],
    CONCISE: ['engineer', 'developer', 'backend', 'frontend', 'infra', 'cloud', 'algorithm', 'system', 'devops', '工程师', '开发', '架构', '算法', '系统'],
    STORYTELLING: ['product manager', ' pm ', 'growth', 'marketing', 'brand', 'designer', ' ux', 'operation', '产品经理', '产品', '运营', '市场'],
  };

  for (const [style, kws] of Object.entries(keywords)) {
    for (const kw of kws) if (text.includes(kw)) scores[style as EmailStyle]++;
  }

  const max = Math.max(...Object.values(scores));
  if (max === 0) return 'WARM';
  return Object.entries(scores).find(([, v]) => v === max)![0] as EmailStyle;
}
