import fs from 'fs';

const FONT_PATHS = [
  'C:\\Windows\\Fonts\\simhei.ttf',                              // Windows
  '/usr/share/fonts/truetype/simhei.ttf',                         // Linux (Docker)
  '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',       // Linux Noto
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
  console.warn('No Chinese font found, PDF may have garbled text');
}
