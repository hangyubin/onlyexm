import puppeteer from 'puppeteer-core';

// Windows 常见 Chrome 安装路径
const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  // Linux Docker
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
];

let chromePath: string | null = null;

function getChromePath(): string | null {
  if (chromePath) return chromePath;
  const fs = require('fs');
  for (const p of CHROME_PATHS) {
    try {
      if (p && fs.existsSync(p)) {
        chromePath = p;
        console.log('Chrome found at:', p);
        return p;
      }
    } catch {}
  }
  return null;
}

/**
 * 使用 Chrome 无头模式将 HTML 渲染为 PDF
 * 从根本上解决中文编码问题——浏览器原生支持 UTF-8
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  const execPath = getChromePath();
  if (!execPath) {
    throw new Error('未找到 Chrome 浏览器，无法生成 PDF。请安装 Google Chrome 后重试。');
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: execPath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  } catch (e: any) {
    throw new Error(`启动 Chrome 失败: ${e.message}`);
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
      printBackground: true,
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}