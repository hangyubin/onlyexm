import fs from 'fs';
import path from 'path';

const FONT_PATHS = [
  // 项目内置字体（优先）
  path.join(__dirname, '..', '..', '..', 'fonts', 'simhei.ttf'),        // dist/src/utils -> project/backend/fonts/
  path.join(__dirname, '..', '..', 'fonts', 'simhei.ttf'),              // src/utils -> project/backend/fonts/
  path.join(__dirname, '..', '..', '..', 'fonts', 'NotoSansSC-Regular.otf'),
  path.join(__dirname, '..', 'fonts', 'simhei.ttf'),
  // Windows 系统字体（兜底）
  'C:\\Windows\\Fonts\\simhei.ttf',
  'C:\\Windows\\Fonts\\simsun.ttc',
  'C:\\Windows\\Fonts\\msyh.ttc',
  'C:\\Windows\\Fonts\\msyhbd.ttf',
  // Docker 镜像字体
  '/usr/share/fonts/NotoSansSC-Regular.otf',
  '/usr/share/fonts/NotoSansSC-Regular.ttf',
  '/usr/share/fonts/truetype/noto/NotoSansSC-Regular.ttf',
  '/usr/share/fonts/noto/NotoSansSC-Regular.ttf',
  '/usr/share/fonts/noto/NotoSansSC-Regular.otf',
  '/usr/share/fonts/noto/NotoSansCJK-Regular.ttc',
  '/usr/share/fonts/noto/NotoSansCJK-Bold.ttc',
  '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
  '/usr/share/fonts/truetype/simhei.ttf',
  '/usr/share/fonts/wqy-microhei.ttc',
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
