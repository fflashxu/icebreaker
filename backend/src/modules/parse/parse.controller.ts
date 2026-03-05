import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../../config/env';
import { ValidationError } from '../../shared/errors';
import OpenAI from 'openai';

export const parseRouter = Router();

const upload = multer({
  dest: env.UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const openai = new OpenAI({
  apiKey: env.DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .substring(0, 4000);
}

async function parsePdf(filePath: string): Promise<string> {
  // Dynamic import to avoid issues with pdf-parse's test file detection
  const pdfParse = require('pdf-parse');
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return cleanText(data.text);
}

async function parseDocx(filePath: string): Promise<string> {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ path: filePath });
  return cleanText(result.value);
}

async function parseImage(filePath: string, mimeType: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const response = await openai.chat.completions.create({
    model: 'qwen-vl-plus',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: dataUrl },
          } as any,
          {
            type: 'text',
            text: 'Please extract and transcribe all text from this image. Output only the extracted text, no commentary.',
          },
        ],
      },
    ],
  });

  return cleanText(response.choices[0]?.message?.content || '');
}

parseRouter.post('/', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file;
  if (!file) {
    return next(new ValidationError('No file uploaded'));
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const filePath = file.path;

  try {
    let text = '';
    let source = '';

    if (ext === '.pdf') {
      text = await parsePdf(filePath);
      source = 'pdf';
    } else if (ext === '.docx') {
      text = await parseDocx(filePath);
      source = 'docx';
    } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
      };
      text = await parseImage(filePath, mimeMap[ext]);
      source = 'image_ocr';
    } else {
      throw new ValidationError(`Unsupported file type: ${ext}. Supported: .pdf, .docx, .jpg, .png`);
    }

    res.json({ text, source, charCount: text.length });
  } catch (e) {
    next(e);
  } finally {
    fs.unlink(filePath, () => {});
  }
});
