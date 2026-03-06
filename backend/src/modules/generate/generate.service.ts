import OpenAI from 'openai';
import { SenderProfile } from '../profiles/profiles.service';

type EmailStyle = 'PROFESSIONAL' | 'WARM' | 'CONCISE' | 'STORYTELLING';

const STYLE_DESCRIPTIONS: Record<EmailStyle, string> = {
  PROFESSIONAL: 'Formal and structured. Clear value proposition, precise language, explicit next steps. Suitable for finance/consulting/executive roles.',
  WARM: 'First-person, genuine, conversational. Express authentic interest, invite a casual chat. Suitable for internet/startup cultures.',
  CONCISE: 'Under 150 words. No filler. One core question or hook. Straight to the point. Suitable for engineering cultures.',
  STORYTELLING: 'Open with a scene or story, narrative transition, open-ended close. Suitable for product/growth roles.',
};

function createClient(dashscopeKey: string): OpenAI {
  return new OpenAI({
    apiKey: dashscopeKey,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  });
}

export interface GenerateRequest {
  candidateText: string;
  profile: SenderProfile;
  style: EmailStyle;
  targetLanguage: string;
  jobTitle?: string;
  count: 1 | 2 | 3;
  dashscopeKey: string;
}

export interface GeneratedEmail {
  id: string;
  subject: string;
  body: string;
}

export async function generateEmails(req: GenerateRequest): Promise<GeneratedEmail[]> {
  const { candidateText, profile, style, targetLanguage, jobTitle, count, dashscopeKey } = req;
  const openai = createClient(dashscopeKey);

  const systemPrompt = `You are an expert recruitment email writer. Generate highly personalized, authentic outreach emails.

Key principles:
- Reference specific details from the candidate's background (skills, experience, projects, achievements)
- Be value-oriented: what's in it for them, not just what you need
- Avoid template-like phrasing ("I came across your profile", "I wanted to reach out")
- Each email should feel like it was written specifically for this person
- Keep emails under 300 words
- Use natural language that matches the sender's role and style
- Write in the specified target language

Return ONLY valid JSON in this exact format:
{"emails": [{"subject": "...", "body": "..."}]}`;

  const userPrompt = `Generate ${count} recruitment email(s) with these details:

SENDER:
- Name: ${profile.name}
- Title: ${profile.title}
- Company: ${profile.company}
- Role type: ${profile.role}
- Signature: ${profile.signature}
${profile.personalNote ? `- Personal note/context: ${profile.personalNote}` : ''}

CANDIDATE BACKGROUND:
${candidateText}

TARGET ROLE: ${jobTitle || 'Not specified - infer from candidate background'}

EMAIL STYLE: ${style} - ${STYLE_DESCRIPTIONS[style]}

TARGET LANGUAGE: ${targetLanguage}

Requirements:
- Each email must reference at least 2-3 specific details from the candidate's background
- Subject line should be intriguing but not clickbait
- Do NOT use generic openers
- Sign off with the sender's name and signature
${count > 1 ? `- Each of the ${count} emails should have a distinct angle/hook` : ''}

Return JSON: {"emails": [{"subject": "...", "body": "..."}]}`;

  const response = await openai.chat.completions.create({
    model: 'qwen-plus',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8,
  });

  const content = response.choices[0]?.message?.content || '{"emails":[]}';
  const parsed = JSON.parse(content);

  const emails: GeneratedEmail[] = (parsed.emails || []).map((e: any, i: number) => ({
    id: `email-${Date.now()}-${i}`,
    subject: e.subject || '',
    body: e.body || '',
  }));

  return emails;
}

export async function translateEmail(
  subject: string,
  body: string,
  targetLanguage: string,
  dashscopeKey: string
): Promise<{ subject: string; body: string }> {
  const openai = createClient(dashscopeKey);

  const response = await openai.chat.completions.create({
    model: 'qwen-plus',
    messages: [
      {
        role: 'system',
        content: `You are an expert translator specializing in professional emails. Translate the given email to ${targetLanguage}.
Preserve: tone, personalization details, emotional color, formatting.
Do NOT translate proper nouns (company names, product names, person names).
Return ONLY valid JSON: {"subject": "...", "body": "..."}`,
      },
      {
        role: 'user',
        content: `Translate to ${targetLanguage}:\n\nSubject: ${subject}\n\nBody:\n${body}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  return {
    subject: parsed.subject || subject,
    body: parsed.body || body,
  };
}
