import path from 'path';

// 双模式 PDF 生成：优先 puppeteer（完美中文排版），回退 pdfkit（需字体文件）
let chromePath: string | null = null;
let chromeDetected = false;

function detectChrome(): string | null {
  if (chromeDetected) return chromePath;
  chromeDetected = true;
  const fs = require('fs');
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ];
  for (const p of paths) {
    try {
      if (p && fs.existsSync(p)) {
        chromePath = p;
        console.log('[PDF] Chrome found at:', p);
        return p;
      }
    } catch {}
  }
  console.log('[PDF] Chrome not found, will use pdfkit with font fallback');
  return null;
}

// 启动时检测
detectChrome();

/**
 * 生成 PDF — 双模式
 * 模式1: puppeteer + Chrome 无头模式（中文完美，需安装 Chrome）
 * 模式2: pdfkit + 字体文件（兼容性好，需 simhei.ttf）
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  const execPath = detectChrome();
  if (execPath) {
    try {
      return await puppeteerPdf(html, execPath);
    } catch (e: any) {
      console.warn('[PDF] Puppeteer failed, falling back to pdfkit:', e.message);
    }
  }
  return await pdfkitFromHtml(html);
}

async function puppeteerPdf(html: string, execPath: string): Promise<Buffer> {
  const puppeteer = require('puppeteer-core');
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: execPath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
      printBackground: true,
    });
    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) await browser.close();
  }
}

async function pdfkitFromHtml(html: string): Promise<Buffer> {
  const PDFDocument = require('pdfkit');
  const fs = require('fs');

  const fontPath = findFont();
  if (!fontPath) {
    throw new Error('未找到中文字体文件，无法生成 PDF。请将 simhei.ttf 放入 backend/fonts/ 目录');
  }

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.registerFont('ChineseFont', fontPath);
  doc.font('ChineseFont');

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const text = htmlToText(html);
    doc.fontSize(12).text(text, { lineGap: 4 });
    doc.end();
  });
}

function findFont(): string | null {
  const fs = require('fs');
  // 项目内置字体（优先）
  const projectFontPaths = [
    path.resolve(__dirname, '../../fonts/simhei.ttf'),   // dist/utils/pdf.js → backend/fonts/
    path.resolve(__dirname, '../fonts/simhei.ttf'),       // src/utils/pdf.ts → backend/fonts/
    path.resolve(process.cwd(), 'fonts/simhei.ttf'),      // cwd/fonts/
  ];
  for (const p of projectFontPaths) {
    try {
      if (fs.existsSync(p)) {
        console.log('[PDF] Font found at:', p);
        return p;
      }
    } catch {}
  }
  // 系统字体
  const systemFontPaths = [
    'C:\\Windows\\Fonts\\simhei.ttf',
    'C:\\Windows\\Fonts\\msyh.ttc',
    '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
    '/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc',
    '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
  ];
  for (const p of systemFontPaths) {
    try {
      if (fs.existsSync(p)) {
        console.log('[PDF] System font found at:', p);
        return p;
      }
    } catch {}
  }
  return null;
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n$1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n$1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n\n$1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
    .replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n')
    .replace(/<span[^>]*>(.*?)<\/span>/gi, '$1')
    .replace(/<b>(.*?)<\/b>/gi, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&emsp;/g, '    ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}