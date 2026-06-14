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

    renderHtmlToPdfkit(doc, html);
    doc.end();
  });
}

// ========== HTML 解析与 pdfkit 渲染 ==========

interface PdfElement {
  tag: string;
  text: string;
  indent?: number;
  fontSize?: number;
  color?: string;
  align?: string;
  children?: PdfElement[];
  isCorrect?: boolean;
}

/**
 * 解析 HTML 并用 pdfkit 原生 API 渲染格式化 PDF
 */
function renderHtmlToPdfkit(doc: any, html: string): void {
  // 提取 body 内容
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  const elements = parseHtmlElements(bodyContent);

  for (const el of elements) {
    switch (el.tag) {
      case 'h1':
        doc.fontSize(22).font('ChineseFont').fillColor('#222222')
          .text(el.text, { align: 'center' });
        doc.moveDown(0.3);
        break;

      case 'h2':
        doc.moveDown(0.5);
        doc.fontSize(15).font('ChineseFont').fillColor('#222222')
          .text(el.text, { align: 'left' });
        // h2 下划线
        doc.moveTo(50, doc.y).lineTo(545, doc.y)
          .strokeColor('#333333').lineWidth(0.5).stroke();
        doc.moveDown(0.3);
        break;

      case 'h3':
        doc.moveDown(0.5);
        doc.fontSize(15).font('ChineseFont').fillColor('#222222')
          .text(el.text, { align: 'left' });
        doc.moveDown(0.2);
        break;

      case 'subtitle':
        doc.fontSize(14).font('ChineseFont').fillColor('#555555')
          .text(el.text, { align: 'center' });
        doc.moveDown(0.3);
        break;

      case 'info':
        doc.fontSize(14).font('ChineseFont').fillColor('#222222')
          .text(el.text, { align: 'left' });
        doc.moveDown(0.5);
        break;

      case 'question-block':
        renderQuestionBlock(doc, el);
        break;

      case 'answer-block':
        renderAnswerBlock(doc, el);
        break;

      case 'p':
        if (el.text.trim()) {
          doc.fontSize(el.fontSize || 13).font('ChineseFont').fillColor(el.color || '#222222')
            .text(el.text, 50 + (el.indent || 0), undefined, { lineGap: 3 });
          doc.moveDown(0.15);
        }
        break;

      case 'footer':
        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(545, doc.y)
          .strokeColor('#cccccc').lineWidth(0.5).stroke();
        doc.moveDown(0.3);
        doc.fontSize(11).font('ChineseFont').fillColor('#999999')
          .text(el.text, { align: 'center' });
        break;

      default:
        if (el.text && el.text.trim()) {
          doc.fontSize(13).font('ChineseFont').fillColor('#222222')
            .text(el.text, { lineGap: 3 });
        }
        break;
    }
  }
  doc.fillColor('#222222');
}

/**
 * 将 HTML body 内容解析为结构化元素列表
 */
function parseHtmlElements(html: string): PdfElement[] {
  const elements: PdfElement[] = [];

  // 移除 style 标签
  let content = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // 解析 h1
  content = content.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, inner) => {
    elements.push({ tag: 'h1', text: cleanText(inner) });
    return '';
  });

  // 解析 h2
  content = content.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, inner) => {
    elements.push({ tag: 'h2', text: cleanText(inner) });
    return '';
  });

  // 解析 h3（题型标题）
  content = content.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, inner) => {
    elements.push({ tag: 'h3', text: cleanText(inner) });
    return '';
  });

  // 解析 subtitle class 的 p 标签
  content = content.replace(/<p[^>]*class=["']subtitle["'][^>]*>([\s\S]*?)<\/p>/gi, (_m, inner) => {
    elements.push({ tag: 'subtitle', text: cleanText(inner) });
    return '';
  });

  // 解析 info class 的 p 标签
  content = content.replace(/<p[^>]*class=["']info["'][^>]*>([\s\S]*?)<\/p>/gi, (_m, inner) => {
    elements.push({ tag: 'info', text: cleanText(inner) });
    return '';
  });

  // 解析答题卡中的题目 div（带 border 样式，表示对/错）
  content = content.replace(/<div[^>]*style="[^"]*border:1px\s+solid\s+(#[0-9a-fA-F]+)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, (_m, borderColor, inner) => {
    const isCorrect = borderColor.toLowerCase() === '#4ade80';
    elements.push(parseAnswerBlock(inner, isCorrect));
    return '';
  });

  // 解析空白试卷中的题目 div（margin-bottom 样式）
  content = content.replace(/<div[^>]*style="[^"]*margin-bottom:\d+px[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, (_m, inner) => {
    elements.push(parseQuestionBlock(inner));
    return '';
  });

  // 解析底部 footer（margin-top + text-align:center 的 p）
  content = content.replace(/<p[^>]*style="[^"]*margin-top:\d+px[^"]*"[^>]*>([\s\S]*?)<\/p>/gi, (_m, inner) => {
    elements.push({ tag: 'footer', text: cleanText(inner) });
    return '';
  });

  // 解析普通 p 标签
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, inner) => {
    const text = cleanText(inner);
    if (text.trim()) {
      const indentMatch = inner.match(/^\s{2,}/);
      const indent = indentMatch ? 20 : 0;
      const colorMatch = inner.match(/color:\s*(#[0-9a-fA-F]{3,6})/);
      elements.push({
        tag: 'p',
        text: text.trimStart(),
        indent,
        fontSize: 13,
        color: colorMatch ? colorMatch[1] : '#222222',
      });
    }
    return '';
  });

  // 清理剩余内容
  const remaining = cleanText(content).trim();
  if (remaining) {
    elements.push({ tag: 'text', text: remaining });
  }

  return elements;
}

/**
 * 解析空白试卷的题目块
 */
function parseQuestionBlock(inner: string): PdfElement {
  // 提取题目 p 标签
  const pMatch = inner.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const questionText = pMatch ? cleanText(pMatch[1]) : cleanText(inner);

  // 提取选项
  const optionsDiv = inner.match(/<div[^>]*style="[^"]*padding-left:\d+px[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const options: string[] = [];
  if (optionsDiv) {
    options.push(...parseOptions(optionsDiv[1]));
  }

  // CASE 题型的下划线填空行
  const blankLines: string[] = [];
  const blankMatches = [...inner.matchAll(/<p[^>]*style="[^"]*color:#999[^"]*"[^>]*>([\s\S]*?)<\/p>/gi)];
  for (const bm of blankMatches) {
    const line = cleanText(bm[1]);
    if (line.includes('___') || line.includes('_')) {
      blankLines.push(line);
    }
  }

  const children: PdfElement[] = [
    ...options.map(o => ({ tag: 'p' as string, text: o, indent: 24, fontSize: 13, color: '#333333' })),
    ...blankLines.map(l => ({ tag: 'p' as string, text: l, indent: 0, fontSize: 13, color: '#999999' })),
  ];

  return {
    tag: 'question-block',
    text: questionText,
    children,
  };
}

/**
 * 解析答题卡的题目块
 */
function parseAnswerBlock(inner: string, isCorrect: boolean): PdfElement {
  // 提取所有 p 标签内容
  const pMatches = [...inner.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];

  let questionText = '';
  let answerLine = '';

  for (const pm of pMatches) {
    const pInner = pm[1];
    if (pInner.includes('考生答案') || pInner.includes('正确答案') || pInner.includes('得分：')) {
      answerLine += (answerLine ? '    ' : '') + cleanText(pInner);
    } else {
      questionText = cleanText(pInner);
    }
  }

  // 提取选项
  const optionsDiv = inner.match(/<div[^>]*style="[^"]*padding-left:\d+px[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const options: string[] = [];
  if (optionsDiv) {
    options.push(...parseOptions(optionsDiv[1]));
  }

  const children: PdfElement[] = [
    ...options.map(o => ({ tag: 'p' as string, text: o, indent: 20, fontSize: 12, color: '#333333' })),
  ];
  if (answerLine) {
    children.push({ tag: 'p', text: answerLine, indent: 20, fontSize: 12, color: '#666666' });
  }

  return {
    tag: 'answer-block',
    text: questionText,
    children,
    isCorrect,
  };
}

/**
 * 解析选项 HTML，返回选项文本数组
 */
function parseOptions(html: string): string[] {
  const options: string[] = [];
  // 匹配 flex 布局中的选项对
  const flexMatches = [...html.matchAll(/<div[^>]*style="[^"]*display:flex[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)];
  if (flexMatches.length > 0) {
    for (const fm of flexMatches) {
      const spans = [...fm[1].matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)];
      const pair = spans.map(s => cleanText(s[1])).filter(t => t.trim());
      if (pair.length > 0) {
        options.push(pair.join('        '));
      }
    }
  } else {
    // 没有flex布局，直接提取span
    const spans = [...html.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)];
    for (const s of spans) {
      const text = cleanText(s[1]);
      if (text.trim()) options.push(text);
    }
  }
  return options;
}

/**
 * 渲染空白试卷的题目块
 */
function renderQuestionBlock(doc: any, el: PdfElement): void {
  doc.moveDown(0.3);
  doc.fontSize(14).font('ChineseFont').fillColor('#222222')
    .text(el.text, { lineGap: 3 });

  if (el.children) {
    for (const child of el.children) {
      doc.fontSize(child.fontSize || 13).font('ChineseFont').fillColor(child.color || '#333333')
        .text(child.text, 50 + (child.indent || 0), undefined, { lineGap: 2 });
    }
  }
  doc.moveDown(0.2);
}

/**
 * 渲染答题卡的题目块（用左侧色条标记对/错）
 */
function renderAnswerBlock(doc: any, el: PdfElement): void {
  const barColor = el.isCorrect ? '#4ade80' : '#f87171';
  const statusText = el.isCorrect ? ' [正确]' : ' [错误]';

  doc.moveDown(0.2);

  // 先测量内容高度
  const startY = doc.y;
  const leftMargin = 56; // 留出左侧色条空间

  // 题目文本 + 正确/错误标记
  doc.fontSize(14).font('ChineseFont').fillColor('#222222')
    .text(el.text + statusText, leftMargin, undefined, { lineGap: 3 });

  // 选项和答案行
  if (el.children) {
    for (const child of el.children) {
      doc.fontSize(child.fontSize || 12).font('ChineseFont').fillColor(child.color || '#333333')
        .text(child.text, leftMargin + (child.indent || 0), undefined, { lineGap: 2 });
    }
  }

  const endY = doc.y;

  // 绘制左侧色条（3px 宽的竖线）
  doc.save();
  doc.rect(50, startY - 2, 4, endY - startY + 4).fill(barColor);
  doc.restore();

  doc.moveDown(0.2);
}

/**
 * 清理 HTML 标签，返回纯文本
 */
function cleanText(html: string): string {
  return html
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '$1')
    .replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&emsp;/g, '    ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&lowbar;/g, '_')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ========== 字体查找 ==========

function findFont(): string | null {
  const fs = require('fs');
  // 项目内置字体（优先）— 兼容多种部署路径
  const projectFontPaths = [
    path.resolve(__dirname, '../../fonts/simhei.ttf'),   // dist/utils/pdf.js → backend/fonts/ (本地开发)
    path.resolve(__dirname, '../../../fonts/simhei.ttf'), // dist/utils/pdf.js → fonts/ (Docker: /app/backend/dist/utils → /app/backend/fonts)
    path.resolve(__dirname, '../fonts/simhei.ttf'),       // src/utils/pdf.ts → backend/fonts/
    path.resolve(process.cwd(), 'fonts/simhei.ttf'),      // cwd/fonts/
    path.resolve(process.cwd(), '../fonts/simhei.ttf'),   // Docker: cwd=dist → ../fonts/
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
    '/usr/share/fonts/NotoSansSC-Regular.otf',            // Docker 镜像中安装的字体
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
