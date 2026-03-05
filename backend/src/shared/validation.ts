import { z } from 'zod';

export const createProfileSchema = z.object({
  name: z.string().min(1).max(100),
  title: z.string().min(1).max(100),
  company: z.string().min(1).max(100),
  role: z.enum(['HR', 'INTERVIEWER', 'EXECUTIVE', 'REFERRAL', 'CUSTOM']),
  signature: z.string().min(1).max(500),
  personalNote: z.string().max(500).optional(),
});

export const updateProfileSchema = createProfileSchema.partial();

export const generateSchema = z.object({
  candidateText: z.string().min(10).max(6000),
  profileId: z.string().uuid(),
  style: z.enum(['PROFESSIONAL', 'WARM', 'CONCISE', 'STORYTELLING']),
  targetLanguage: z.string().min(2).max(20),
  jobTitle: z.string().max(200).optional(),
  count: z.number().int().min(1).max(3),
});

export const translateSchema = z.object({
  subject: z.string(),
  body: z.string(),
  targetLanguage: z.string().min(2).max(20),
});
