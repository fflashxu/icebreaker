import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as cheerio from 'cheerio';
import { ProxyAgent } from 'undici';
import { env } from '../../config/env';
import { ValidationError, UnprocessableError } from '../../shared/errors';
import { authenticate } from '../../middleware/authenticate';
import OpenAI, { APIError } from 'openai';
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
const SYSTEM_PROXY = 'http://127.0.0.1:33210';

/**
 * Fetch and parse a URL into clean text + best-effort title.
 * Falls back to system proxy when direct fetch fails (GFW-blocked sites).
 */
async function parseUrl(url: string): Promise<{ text: string; title: string }> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
  };

  let fetchRes: globalThis.Response;
  try {
    fetchRes = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
  } catch {
    const proxyAgent = new ProxyAgent({ uri: SYSTEM_PROXY, requestTls: { rejectUnauthorized: false } });
    fetchRes = await fetch(url, { headers, signal: AbortSignal.timeout(20000), dispatcher: proxyAgent as any });
  }

  if (fetchRes.status === 451) throw new Error(`This site blocks automated access (HTTP 451)`);
  if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status}`);

  const html = await fetchRes.text();
  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, aside, .nav, .menu, .sidebar, .ad, .cookie, iframe, noscript').remove();

  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || '';
  const ogDesc = $('meta[property="og:description"]').attr('content')?.trim() || '';
  const pageTitle = $('title').text().trim();
  const h1Text = $('h1').first().text().trim();
  const h2Text = $('h2').first().text().trim();
  const metaAuthor = $('meta[name="author"]').attr('content')?.trim() || '';

  let title = '';
  if (ogTitle && ogTitle === pageTitle) {
    const descName = ogDesc.split('\n')[0]?.replace(/\s*\|.*$/, '').trim() || '';
    title = (descName.length > 2 && descName.length < 80 ? descName : '') || h1Text || h2Text || ogTitle;
  }
  if (!title) title = ogTitle || metaAuthor || h1Text || h2Text || pageTitle;

  const contentSelectors = ['main', 'article', '[role="main"]', '.content', '#content', '.post', '.entry'];
  let text = '';
  for (const sel of contentSelectors) {
    const el = $(sel);
    if (el.length && el.text().trim().length >= 100) { text = el.text(); break; }
  }
  if (!text) text = $('body').text();

  return { text: cleanText(text), title };
}

/**
 * Extract a user-friendly error message from an OpenAI/DashScope API error.
 */
function extractApiError(e: unknown): string {
  if (e instanceof APIError) {
    const detail = (e as any).error?.message || e.message;
    if (e.status === 401) {
      return `DashScope API key is invalid or expired. Please update it in Settings. (${detail})`;
    }
    return `DashScope API error: ${detail}`;
  }
  if (e instanceof Error) return e.message;
  return String(e);
}

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
      // Surface the real error for OCR failures (key invalid, quota, etc.)
      throw new UnprocessableError(extractApiError(e));
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

  const info = await parser.getInfo({ parsePageInfo: true });
  const pageCount = Math.min(maxPages, info.total);

  const screenshotResult = await parser.getScreenshot({
    first: pageCount,
    scale: 2.0,
  });

  const errors: string[] = [];
  const texts = await Promise.all(
    screenshotResult.pages.map(async (screenshot) => {
      try {
        return await ocrImageBase64(screenshot.dataUrl, dashscopeKey);
      } catch (e) {
        const msg = extractApiError(e);
        console.error(`OCR failed for page ${screenshot.pageNumber}:`, msg);
        errors.push(msg);
        return '';
      }
    })
  );

  const combined = texts.filter(Boolean).join('\n\n');
  // If all pages failed OCR, surface the error
  if (!combined && errors.length > 0) {
    throw new UnprocessableError(errors[0]);
  }
  return combined;
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

// ── URL Parsing Routes ──

parseRouter.post('/url', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') return next(new ValidationError('url required'));
    const { text, title } = await parseUrl(url);
    if (!text) return next(new UnprocessableError('Could not extract text from URL'));
    res.json({ text, title, source: 'url', url, charCount: text.length });
  } catch (e: any) { next(new UnprocessableError(`Failed to fetch URL: ${e.message}`)); }
});

parseRouter.post('/urls', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { urls } = req.body as { urls: string[] };
    if (!Array.isArray(urls) || urls.length === 0) return next(new ValidationError('urls array required'));
    const results = await Promise.allSettled(
      urls.map(async (url) => {
        const { text, title } = await parseUrl(url);
        const emailMatch = text.match(/\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/i);
        return { name: title.substring(0, 60) || url, email: emailMatch ? emailMatch[0] : undefined, rawText: text, source: 'url', sourceUrl: url };
      })
    );
    const candidates = results.map((r, i) => ({
      url: urls[i], ok: r.status === 'fulfilled', candidate: r.status === 'fulfilled' ? r.value : null, error: r.status === 'rejected' ? (r.reason as Error).message : null,
    }));
    res.json({ candidates });
  } catch (e) { next(e); }
});

// ── File Upload Route ──

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
    // Convert raw API errors (DashScope 401 etc.) to readable errors
    if (e instanceof APIError) {
      return next(new UnprocessableError(extractApiError(e)));
    }
    next(e);
  } finally {
    fs.unlink(filePath, () => {});
  }
});
