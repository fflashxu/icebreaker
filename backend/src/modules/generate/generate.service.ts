import OpenAI, { APIError } from 'openai';
import { SenderProfile } from '../profiles/profiles.service';
import { AppError } from '../../shared/errors';

function handleOpenAIError(err: unknown): never {
  if (err instanceof APIError) {
    if (err.status === 401 || err.status === 403) {
      throw new AppError(422, 'DashScope Key 无效或无权限，请在设置中检查');
    }
    if (err.status === 429) {
      throw new AppError(429, 'DashScope 请求超限，请稍后再试');
    }
    throw new AppError(502, `AI 服务错误 (${err.status}): ${err.message}`);
  }
  throw err;
}

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

const ANGLE_HINTS = [
  'Lead with a specific achievement or project from their background.',
  'Lead with a compelling question about their career growth.',
  'Lead with a unique company culture or mission angle.',
];

async function generateSingleEmail(
  openai: OpenAI,
  req: Omit<GenerateRequest, 'dashscopeKey' | 'count'>,
  angleHint: string
): Promise<GeneratedEmail> {
  const { candidateText, profile, style, targetLanguage, jobTitle } = req;

  const systemPrompt = `You are an expert recruitment email writer. Generate a highly personalized, authentic outreach email.

Key principles:
- Reference specific details from the candidate's background (skills, experience, projects, achievements)
- Be value-oriented: what's in it for them, not just what you need
- Avoid template-like phrasing ("I came across your profile", "I wanted to reach out")
- The email should feel like it was written specifically for this person
- Keep the email under 300 words
- Use natural language that matches the sender's role and style
- Write in the specified target language

Return ONLY valid JSON in this exact format:
{"subject": "...", "body": "..."}`;

  const userPrompt = `Generate 1 recruitment email with these details:

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

ANGLE: ${angleHint}

Requirements:
- Reference at least 2-3 specific details from the candidate's background
- Subject line should be intriguing but not clickbait
- Do NOT use generic openers
- Sign off with the sender's name and signature

Return JSON: {"subject": "...", "body": "..."}`;

  let response;
  try {
    response = await openai.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });
  } catch (err) {
    handleOpenAIError(err);
  }

  const content = response!.choices[0]?.message?.content || '{}';
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }

  return {
    id: `email-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    subject: parsed.subject || '',
    body: parsed.body || '',
  };
}

export async function generateEmails(req: GenerateRequest): Promise<GeneratedEmail[]> {
  const { count, dashscopeKey, ...rest } = req;
  const openai = createClient(dashscopeKey);

  const tasks = Array.from({ length: count }, (_, i) =>
    generateSingleEmail(openai, rest, ANGLE_HINTS[i] ?? ANGLE_HINTS[0])
  );

  return Promise.all(tasks);
}

export async function translateEmail(
  subject: string,
  body: string,
  targetLanguage: string,
  dashscopeKey: string
): Promise<{ subject: string; body: string }> {
  const openai = createClient(dashscopeKey);

  let response;
  try {
    response = await openai.chat.completions.create({
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
  } catch (err) {
    handleOpenAIError(err);
  }

  const content = response!.choices[0]?.message?.content || '{}';
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }
  return {
    subject: parsed.subject || subject,
    body: parsed.body || body,
  };
}
