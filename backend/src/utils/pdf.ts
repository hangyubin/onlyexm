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

interface MatchInfo {
  start: number;
  end: number;
  element: PdfElement;
}

/**
 * 找到匹配的 </div> 位置（处理嵌套）
 */
function findMatchingCloseDiv(html: string, startPos: number): number {
  let depth = 1;
  let pos = startPos;
  while (depth > 0 && pos < html.length) {
    const nextOpen = html.indexOf('<div', pos);
    const nextClose = html.indexOf('</div>', pos);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + 4;
    } else {
      depth--;
      if (depth === 0) return nextClose;
      pos = nextClose + 6;
    }
  }
  return html.length;
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
 * 将 HTML body 内容解析为结构化元素列表（保持文档顺序）
 */
function parseHtmlElements(html: string): PdfElement[] {
  const matches: MatchInfo[] = [];
  // 移除 style 标签
  const content = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  let m: RegExpExecArray | null;

  // h1
  const h1Re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  while ((m = h1Re.exec(content)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, element: { tag: 'h1', text: cleanText(m[1]) } });
  }

  // h2
  const h2Re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  while ((m = h2Re.exec(content)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, element: { tag: 'h2', text: cleanText(m[1]) } });
  }

  // h3（题型标题）
  const h3Re = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  while ((m = h3Re.exec(content)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, element: { tag: 'h3', text: cleanText(m[1]) } });
  }

  // subtitle class 的 p 标签
  const subtitleRe = /<p[^>]*class=["']subtitle["'][^>]*>([\s\S]*?)<\/p>/gi;
  while ((m = subtitleRe.exec(content)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, element: { tag: 'subtitle', text: cleanText(m[1]) } });
  }

  // info class 的 p 标签
  const infoRe = /<p[^>]*class=["']info["'][^>]*>([\s\S]*?)<\/p>/gi;
  while ((m = infoRe.exec(content)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, element: { tag: 'info', text: cleanText(m[1]) } });
  }

  // 答题卡中的题目 div（带 border 样式，表示对/错）
  const answerDivRe = /<div[^>]*style="[^"]*border:1px\s+solid\s+(#[0-9a-fA-F]+)[^"]*"[^>]*>/gi;
  while ((m = answerDivRe.exec(content)) !== null) {
    const borderColor = m[1];
    const isCorrect = borderColor.toLowerCase() === '#4ade80';
    const innerStart = m.index + m[0].length;
    const innerEnd = findMatchingCloseDiv(content, innerStart);
    const inner = content.substring(innerStart, innerEnd);
    matches.push({ start: m.index, end: innerEnd + 6, element: parseAnswerBlock(inner, isCorrect) });
  }

  // 空白试卷中的题目 div（margin-bottom 样式）
  const questionDivRe = /<div[^>]*style="[^"]*margin-bottom:\d+px[^"]*"[^>]*>/gi;
  while ((m = questionDivRe.exec(content)) !== null) {
    const innerStart = m.index + m[0].length;
    const innerEnd = findMatchingCloseDiv(content, innerStart);
    const inner = content.substring(innerStart, innerEnd);
    matches.push({ start: m.index, end: innerEnd + 6, element: parseQuestionBlock(inner) });
  }

  // 底部 footer（margin-top 的 p）
  const footerRe = /<p[^>]*style="[^"]*margin-top:\d+px[^"]*"[^>]*>([\s\S]*?)<\/p>/gi;
  while ((m = footerRe.exec(content)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, element: { tag: 'footer', text: cleanText(m[1]) } });
  }

  // 普通 p 标签
  const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  while ((m = pRe.exec(content)) !== null) {
    const text = cleanText(m[1]);
    if (text.trim()) {
      const indentMatch = m[1].match(/^\s{2,}/);
      const indent = indentMatch ? 20 : 0;
      const colorMatch = m[1].match(/color:\s*(#[0-9a-fA-F]{3,6})/);
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        element: { tag: 'p', text: text.trimStart(), indent, fontSize: 13, color: colorMatch ? colorMatch[1] : '#222222' },
      });
    }
  }

  // 按位置排序，保持文档顺序
  matches.sort((a, b) => a.start - b.start);

  // 去除重叠匹配（保留先出现的，即外层容器优先于内层元素）
  const filtered: MatchInfo[] = [];
  let lastEnd = -1;
  for (const match of matches) {
    if (match.start >= lastEnd) {
      filtered.push(match);
      lastEnd = match.end;
    }
  }

  return filtered.map(m => m.element);
}

/**
 * 解析空白试卷的题目块
 */
function parseQuestionBlock(inner: string): PdfElement {
  // 提取题目文本（第一个 p 标签）
  const pMatch = inner.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const questionText = pMatch ? cleanText(pMatch[1]) : cleanText(inner);

  // 提取所有选项（直接从 span 中提取 A. B. C. D. 格式）
  const options: { key: string; text: string }[] = [];
  const spanMatches = [...inner.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)];
  for (const sm of spanMatches) {
    const text = cleanText(sm[1]).trim();
    const optMatch = text.match(/^([A-Z])\.\s*(.*)/);
    if (optMatch) {
      options.push({ key: optMatch[1], text: `${optMatch[1]}. ${optMatch[2]}` });
    }
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

  // 选项成对组合（A+B 一行，C+D 一行）
  const optionLines: PdfElement[] = [];
  for (let i = 0; i < options.length; i += 2) {
    const o1 = options[i];
    const o2 = options[i + 1];
    if (o2) {
      optionLines.push({ tag: 'p', text: `${o1.text}        ${o2.text}`, indent: 24, fontSize: 13, color: '#333333' });
    } else {
      optionLines.push({ tag: 'p', text: o1.text, indent: 24, fontSize: 13, color: '#333333' });
    }
  }

  const children: PdfElement[] = [
    ...optionLines,
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

  // 提取所有选项（直接从 span 中提取，保留颜色信息）
  const options: { key: string; text: string; color: string }[] = [];
  const spanRe = /<span[^>]*style="[^"]*color:([^;"]+)[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
  let sm: RegExpExecArray | null;
  while ((sm = spanRe.exec(inner)) !== null) {
    const text = cleanText(sm[2]).trim();
    const optMatch = text.match(/^([A-Z])\.\s*(.*)/);
    if (optMatch) {
      options.push({ key: optMatch[1], text: `${optMatch[1]}. ${optMatch[2]}`, color: sm[1].trim() });
    }
  }
  // 如果没有带颜色的 span，尝试提取普通 span
  if (options.length === 0) {
    const plainSpans = [...inner.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)];
    for (const ps of plainSpans) {
      const text = cleanText(ps[1]).trim();
      const optMatch = text.match(/^([A-Z])\.\s*(.*)/);
      if (optMatch) {
        options.push({ key: optMatch[1], text: `${optMatch[1]}. ${optMatch[2]}`, color: '#333333' });
      }
    }
  }

  // 选项成对组合
  const optionLines: PdfElement[] = [];
  for (let i = 0; i < options.length; i += 2) {
    const o1 = options[i];
    const o2 = options[i + 1];
    if (o2) {
      optionLines.push({ tag: 'p', text: `${o1.text}        ${o2.text}`, indent: 20, fontSize: 12, color: '#333333' });
    } else {
      optionLines.push({ tag: 'p', text: o1.text, indent: 20, fontSize: 12, color: o1.color || '#333333' });
    }
  }

  const children: PdfElement[] = [
    ...optionLines,
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
