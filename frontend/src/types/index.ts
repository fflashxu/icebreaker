export type ProfileRole = 'HR' | 'INTERVIEWER' | 'EXECUTIVE' | 'REFERRAL' | 'CUSTOM';
export type EmailStyle = 'PROFESSIONAL' | 'WARM' | 'CONCISE' | 'STORYTELLING';

export interface SenderProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  role: ProfileRole;
  signature: string;
  personalNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateRequest {
  candidateText: string;
  profileId: string;
  style: EmailStyle;
  targetLanguage: string;
  jobTitle?: string;
  count: 1 | 2 | 3;
}

export interface GeneratedEmail {
  id: string;
  subject: string;
  body: string;
}

export interface ParseResponse {
  text: string;
  source: string;
  charCount: number;
}
