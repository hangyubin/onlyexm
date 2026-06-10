import fs from 'fs';
import path from 'path';

const FONT_PATHS = [
  // 项目内置字体（优先）
  path.join(__dirname, '..', '..', 'fonts', 'NotoSansSC-Regular.ttf'),
  path.join(__dirname, '..', 'fonts', 'NotoSansSC-Regular.ttf'),
  // Windows 系统字体
  'C:\\Windows\\Fonts\\simhei.ttf',
  'C:\\Windows\\Fonts\\msyh.ttc',
  'C:\\Windows\\Fonts\\simsun.ttc',
  // Linux 常见字体路径
  '/usr/share/fonts/truetype/noto/NotoSansSC-Regular.ttf',
  '/usr/share/fonts/noto/NotoSansSC-Regular.ttf',
  '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
  '/usr/share/fonts/truetype/simhei.ttf',
  // Alpine 字体路径（font-noto-cjk 包）
  '/usr/share/fonts/noto/NotoSansCJK-Regular.ttc',
  '/usr/share/fonts/noto/NotoSansCJK-Bold.ttc',
];

export function registerChineseFont(doc: any): void {
  for (const fp of FONT_PATHS) {
    try {
      if (fs.existsSync(fp)) {
        doc.registerFont('ChineseFont', fp);
        doc.font('ChineseFont');
        console.log('PDF font loaded:', fp);
        return;
      }
    } catch (e) { /* try next path */ }
  }
  // 兜底：尝试使用 PDFKit 内置字体（仅支持英文）
  console.warn('No Chinese font found, PDF Chinese text may be garbled. Install a CJK font in the image.');
  doc.font('Helvetica');
}
