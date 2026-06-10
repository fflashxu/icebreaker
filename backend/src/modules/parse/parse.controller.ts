import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../../config/env';
import { ValidationError, UnprocessableError } from '../../shared/errors';
import { authenticate } from '../../middleware/authenticate';
import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';

export const parseRouter = Router();

const upload = multer({
  dest: env.UPLOAD_DIR,
  limits: { fileSize: 20 * 1024 * 1024 },
});

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .substring(0, 10000);
}

const TEXT_MIN_CHARS = 50;
const OCR_MAX_PAGES = 3;

/**
 * Parse PDF with text extraction first, then OCR fallback for scanned/image-based PDFs.
 */
async function parsePdf(filePath: string, dashscopeKey?: string): Promise<{ text: string; source: string }> {
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const textResult = await parser.getText();
  const text = cleanText(textResult.text);

  if (text.length >= TEXT_MIN_CHARS) {
    return { text, source: 'pdf' };
  }

  // OCR fallback for scanned PDFs
  if (dashscopeKey) {
    try {
      const ocrText = await ocrPdfPages(filePath, dashscopeKey);
      if (ocrText.trim().length > text.length) {
        return { text: cleanText(ocrText), source: 'pdf_ocr' };
      }
    } catch (e) {
      console.error('PDF OCR fallback failed:', e);
    }
  }

  return { text, source: 'pdf' };
}

/**
 * Render PDF pages to images via pdf-parse Screenshot, then OCR each page with DashScope.
 */
async function ocrPdfPages(filePath: string, dashscopeKey: string, maxPages = OCR_MAX_PAGES): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  // First get total page count
  const info = await parser.getInfo({ parsePageInfo: true });
  const pageCount = Math.min(maxPages, info.total);

  const screenshotResult = await parser.getScreenshot({
    first: pageCount,
    scale: 2.0,
  });

  const texts = await Promise.all(
    screenshotResult.pages.map(async (screenshot) => {
      try {
        return await ocrImageBase64(screenshot.dataUrl, dashscopeKey);
      } catch (e) {
        console.error(`OCR failed for page ${screenshot.pageNumber}:`, e);
        return '';
      }
    })
  );

  return texts.filter(Boolean).join('\n\n');
}

/**
 * OCR a single image (data URL) via DashScope qwen-vl-plus.
 */
async function ocrImageBase64(dataUrl: string, dashscopeKey: string): Promise<string> {
  const openai = new OpenAI({
    apiKey: dashscopeKey,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  });

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

  return response.choices[0]?.message?.content || '';
}

async function parseDocx(filePath: string): Promise<string> {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ path: filePath });
  return cleanText(result.value);
}

async function parseImage(filePath: string, mimeType: string, dashscopeKey: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64}`;
  return ocrImageBase64(dataUrl, dashscopeKey);
}

parseRouter.post('/', authenticate, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
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
      const result = await parsePdf(filePath, req.user!.dashscopeKey ?? undefined);
      text = result.text;
      source = result.source;
    } else if (ext === '.docx') {
      text = await parseDocx(filePath);
      source = 'docx';
    } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      const dashscopeKey = req.user!.dashscopeKey;
      if (!dashscopeKey) {
        throw new UnprocessableError('DashScope API key is required for image OCR. Please add it in Settings.');
      }
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
      };
      text = await parseImage(filePath, mimeMap[ext], dashscopeKey);
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
