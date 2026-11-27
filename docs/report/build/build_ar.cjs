// Builds the Arabic graduation report (.docx, right to left) from the files in ar/.
// Usage: node build_ar.cjs <out.docx>
// Text supports **bold**, *italic*, `code`, {fig:key} / {tab:key} references and
// [[...]] for a highlighted placeholder that the team has to complete.
const fs = require('fs');
const path = require('path');
const D = require('docx');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  AlignmentType, HeadingLevel, Footer, PageNumber, NumberFormat, TableOfContents, StyleLevel, LevelFormat,
  PageBreak, VerticalAlign, PageBorderOffsetFrom, PageBorderDisplay, TableLayoutType,
} = D;

const REPO = path.join(__dirname, '..'); // docs/report
const DIAG = path.join(REPO, 'diagrams');
const SHOTS = path.join(REPO, 'screens');
const SURVEY = path.join(REPO, 'survey');
const LOGO_UNI = path.join(REPO, 'assets/hebron-university.png');
const LOGO_APP = path.join(REPO, 'assets/logo-proposal.jpg');

const front = require('./ar/front.cjs');
const chapters = (process.env.AR_CH || 'ch1,ch2,ch3,ch4,ch5,ch6,ch7').split(',').filter(Boolean).map((c) => require(`./ar/${c}.cjs`));
const { refs, appendices } = require('./ar/back.cjs');
// AR_BODY_ONLY=1 builds only the chosen chapters (AR_CH), without the cover, preliminary pages, references or appendices.
const BODY_ONLY = !!process.env.AR_BODY_ONLY;
const blocks = BODY_ONLY ? chapters.flat() : [...chapters.flat(), ...refs, ...appendices];

const FONT = 'Times New Roman';
const F = { ascii: FONT, hAnsi: FONT, cs: FONT, eastAsia: FONT };
const PAGE_W = 11906, PAGE_H = 16838, MARGIN = 720; // A4 with the margins of the university template
const TEXT_W = PAGE_W - 2 * MARGIN;
const PX_W = 698;
const PX_H = 880;
const BODY = 28; // 14 pt, as in the previous report

// ── numbering pass: figures and tables per chapter, cross-references ──
const refsMap = {};
{
  let chap = '0', f = 0, t = 0;
  for (const b of blocks) {
    if (b.t === 'h1' && b.chap) { chap = b.chap; f = 0; t = 0; }
    if (b.t === 'fig' || b.t === 'shots') { b.num = `${chap}-${++f}`; if (b.key) refsMap[b.key] = `الشكل (${b.num})`; }
    if (b.t === 'table') { b.num = `${chap}-${++t}`; if (b.key) refsMap[b.key] = `الجدول (${b.num})`; }
    if (b.t === 'uc') { b.num = `${chap}-${++t}`; refsMap['uc:' + b.id] = `الجدول (${b.num})`; }
  }
}
const missingRefs = new Set();
const resolve = (s) => s.replace(/\{((?:fig|tab):[\w-]+)\}/g, (_, k) => { if (!refsMap[k]) missingRefs.add(k); return refsMap[k] || `[${k}]`; });

// ── inline formatting ──
const placeholders = [];
function runs(text, base = {}) {
  const out = [];
  const parts = resolve(String(text)).split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g).filter(Boolean);
  for (const part of parts) {
    if (part.startsWith('[[')) {
      placeholders.push(part.slice(2, -2));
      out.push(new TextRun({ text: `[${part.slice(2, -2)}]`, bold: true, highlight: 'yellow', color: '9C0006', font: F, rightToLeft: true, ...base }));
    } else if (part.startsWith('**')) out.push(new TextRun({ text: part.slice(2, -2), bold: true, font: F, rightToLeft: true, ...base }));
    else if (part.startsWith('`')) out.push(new TextRun({ text: '\u200E' + part.slice(1, -1) + '\u200E', font: 'Consolas', size: Math.max(16, (base.size || BODY) - 6), ...(base.bold ? { bold: true } : {}) }));
    else if (part.startsWith('*') && part.length > 2) out.push(new TextRun({ text: part.slice(1, -1), italics: true, font: F, rightToLeft: true, ...base }));
    else out.push(new TextRun({ text: part, font: F, rightToLeft: true, ...base }));
  }
  return out;
}

const body = (text, o = {}) => new Paragraph({ bidirectional: true, children: runs(text, o.run), alignment: o.align ?? AlignmentType.JUSTIFIED, spacing: { after: 120, line: 312 }, ...(o.p || {}) });
const ltr = (text, o = {}) => new Paragraph({ children: [new TextRun({ text, font: F, size: o.size || 24, italics: !!o.italics, bold: !!o.bold })], alignment: o.align ?? AlignmentType.JUSTIFIED, spacing: { after: o.after ?? 160, line: 288 } });

let listInstance = 0;
function list(items, numbered) {
  const inst = ++listInstance;
  return items.map((it) => new Paragraph({
    bidirectional: true,
    children: runs(it),
    numbering: { reference: numbered ? 'nums' : 'bullets', level: 0, instance: numbered ? inst : undefined },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80, line: 300 },
  }));
}

// ── tables (first column on the right) ──
const border = { style: BorderStyle.SINGLE, size: 4, color: '8A94A6' };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const cellMargins = { top: 50, bottom: 50, left: 90, right: 90 };

function cellParas(text, size, bold, align) {
  const lines = Array.isArray(text) ? text : [text];
  return lines.map((l) => new Paragraph({ bidirectional: true, children: runs(String(l), { size, ...(bold ? { bold: true } : {}) }), alignment: align ?? (process.env.CELLALIGN === "both" ? AlignmentType.JUSTIFIED : process.env.CELLALIGN === "right" ? AlignmentType.RIGHT : process.env.CELLALIGN === "start" ? AlignmentType.START : AlignmentType.LEFT), spacing: { after: 0, line: 264 } }));
}
function caption(kind, num, text) {
  return new Paragraph({
    bidirectional: true,
    style: kind === 'fig' ? 'FigureCaption' : 'TableCaption',
    children: [new TextRun({ text: `${kind === 'fig' ? 'شكل' : 'جدول'} (${num}): `, bold: true, font: F, size: 24, rightToLeft: true }), ...runs(text, { size: 24 })],
    alignment: AlignmentType.CENTER,
    keepNext: kind !== 'fig',
    spacing: kind === 'fig' ? { before: 60, after: 240 } : { before: 160, after: 80 },
  });
}
function dataTable(b) {
  const size = Math.round((b.fontSize || 11) * 2);
  const widths = b.widths.map((w) => Math.round((w / 100) * TEXT_W));
  widths[widths.length - 1] += TEXT_W - widths.reduce((a, c) => a + c, 0);
  const n = widths.length;
  const head = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: b.head.map((h, i) => new TableCell({ width: { size: widths[i], type: WidthType.DXA }, borders, margins: cellMargins, shading: { fill: 'D9E2F3', type: ShadingType.CLEAR, color: 'auto' }, verticalAlign: VerticalAlign.CENTER, children: cellParas(h, size, true, AlignmentType.CENTER) })),
  });
  const rows = b.rows.map((r) => {
    if (r.length === 1) {
      return new TableRow({ cantSplit: true, children: [new TableCell({ columnSpan: n, width: { size: TEXT_W, type: WidthType.DXA }, borders, margins: cellMargins, shading: { fill: 'EEF3FC', type: ShadingType.CLEAR, color: 'auto' }, children: cellParas(r[0], size, true) })] });
    }
    return new TableRow({ cantSplit: true, children: r.map((c, i) => new TableCell({ width: { size: widths[i], type: WidthType.DXA }, borders, margins: cellMargins, children: cellParas(c, size) })) });
  });
  return [caption('tab', b.num, b.caption), new Table({ visuallyRightToLeft: true, width: { size: TEXT_W, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, rows: [head, ...rows] }), new Paragraph({ bidirectional: true, children: [], spacing: { after: 120 } })];
}
function ucTable(b) {
  const w1 = 2200, w2 = TEXT_W - w1, size = 22;
  const row = (label, content) => new TableRow({
    cantSplit: false,
    children: [
      new TableCell({ width: { size: w1, type: WidthType.DXA }, borders, margins: cellMargins, shading: { fill: 'EEF3FC', type: ShadingType.CLEAR, color: 'auto' }, children: cellParas(label, size, true) }),
      new TableCell({ width: { size: w2, type: WidthType.DXA }, borders, margins: cellMargins, children: cellParas(content, size) }),
    ],
  });
  const rows = [
    row('اسم العملية', `${b.name} (${b.id})`),
    row('وصف العملية', b.desc),
    row('الممثلون', b.actors),
    row('شروط سابقة', b.pre),
    row('تسلسل الخطوات', b.main.map((s, i) => `${i + 1}. ${s}`)),
    row('سيناريوهات بديلة', b.alt.length ? b.alt : ['لا يوجد.']),
    row('شروط لاحقة', b.post),
    row('المتطلبات المرتبطة', b.fr),
    row('حالة التنفيذ', b.status),
  ];
  return [caption('tab', b.num, `عملية ${b.name}`), new Table({ visuallyRightToLeft: true, width: { size: TEXT_W, type: WidthType.DXA }, columnWidths: [w1, w2], layout: TableLayoutType.FIXED, rows }), new Paragraph({ bidirectional: true, children: [], spacing: { after: 120 } })];
}
// A highlighted empty box that marks where the team adds content.
function slot(b) {
  const dashed = { style: BorderStyle.DASHED, size: 8, color: 'C55A11' };
  const lines = b.lines ?? 4;
  return [
    new Table({
      visuallyRightToLeft: true,
      width: { size: TEXT_W, type: WidthType.DXA }, columnWidths: [TEXT_W], layout: TableLayoutType.FIXED,
      rows: [new TableRow({ children: [new TableCell({
        width: { size: TEXT_W, type: WidthType.DXA },
        borders: { top: dashed, bottom: dashed, left: dashed, right: dashed },
        shading: { fill: 'FFF7E0', type: ShadingType.CLEAR, color: 'auto' },
        margins: { top: 100, bottom: 100, left: 160, right: 160 },
        children: [
          new Paragraph({ bidirectional: true, alignment: AlignmentType.JUSTIFIED, spacing: { after: 60 }, children: [new TextRun({ text: 'مساحة يكملها الفريق: ', bold: true, color: 'C55A11', font: F, size: 24, rightToLeft: true }), ...runs(b.text, { size: 24, color: '7F4F00' })] }),
          ...Array.from({ length: lines }, () => new Paragraph({ bidirectional: true, children: [], spacing: { after: 0, line: 360 } })),
        ],
      })] })],
    }),
    new Paragraph({ bidirectional: true, children: [], spacing: { after: 160 } }),
  ];
}

// ── images ──
function imgSize(file) {
  const buf = fs.readFileSync(file);
  if (buf[0] === 0x89) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), type: 'png', buf };
  let i = 2;
  while (i < buf.length) {
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7), type: 'jpg', buf };
    i += 2 + len;
  }
  throw new Error('size? ' + file);
}
function figure(b) {
  const file = path.join(b.dir === 'survey' ? SURVEY : DIAG, b.file);
  const { w, h, type, buf } = imgSize(file);
  const sc = b.scale || 1;
  let cw = w / sc, ch = h / sc;
  const maxW = b.maxW || PX_W, maxH = b.maxH || PX_H;
  const k = Math.min(1, maxW / cw, maxH / ch);
  cw = Math.round(cw * k); ch = Math.round(ch * k);
  return [
    new Paragraph({ bidirectional: true, children: [new ImageRun({ data: buf, type, transformation: { width: cw, height: ch }, altText: { title: b.caption, description: b.caption, name: b.file } })], alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 0 } }),
    caption('fig', b.num, b.caption),
  ];
}
function shotsBlock(b) {
  const colW = Math.floor(TEXT_W / 3);
  const cells = b.files.map((f, i) => {
    const { w, h, type, buf } = imgSize(path.join(SHOTS, f));
    const dw = 196, dh = Math.round((dw * h) / w);
    return new TableCell({
      width: { size: colW, type: WidthType.DXA }, borders: noBorders, margins: { top: 40, bottom: 40, left: 60, right: 60 },
      children: [
        new Paragraph({ bidirectional: true, children: [new ImageRun({ data: buf, type, transformation: { width: dw, height: dh }, altText: { title: b.labels[i], description: b.labels[i], name: f } })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
        new Paragraph({ bidirectional: true, children: runs(b.labels[i], { size: 20 }), alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
      ],
    });
  });
  return [
    new Table({ visuallyRightToLeft: true, width: { size: colW * 3, type: WidthType.DXA }, columnWidths: [colW, colW, colW], alignment: AlignmentType.CENTER, borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder }, rows: [new TableRow({ cantSplit: true, children: cells })] }),
    caption('fig', b.num, b.caption),
  ];
}
function codeBlock(lines) {
  return lines.map((l, i) => new Paragraph({
    children: [new TextRun({ text: l.length ? l : ' ', font: 'Consolas', size: 17 })],
    shading: { fill: 'F3F5F9', type: ShadingType.CLEAR, color: 'auto' },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: '2B4C9B', space: 6 } },
    alignment: AlignmentType.LEFT,
    spacing: { after: i === lines.length - 1 ? 160 : 0, line: 240 },
    indent: { left: 200 },
    keepNext: i !== lines.length - 1,
  }));
}

// ── render blocks ──
const heading = (level, text, extra = {}) => new Paragraph({ bidirectional: true, heading: level, children: runs(text), ...extra });
function render(items) {
  const out = [];
  for (const b of items) {
    switch (b.t) {
      case 'h1': out.push(heading(HeadingLevel.HEADING_1, b.text, { pageBreakBefore: true })); break;
      case 'h2': out.push(heading(HeadingLevel.HEADING_2, b.text)); break;
      case 'h3': out.push(heading(HeadingLevel.HEADING_3, b.text)); break;
      case 'p': out.push(body(b.text)); break;
      case 'note': out.push(body(b.text, { run: { italics: true } })); break;
      case 'bullets': out.push(...list(b.items, false)); break;
      case 'numbers': out.push(...list(b.items, true)); break;
      case 'table': out.push(...dataTable(b)); break;
      case 'uc': out.push(...ucTable(b)); break;
      case 'fig': out.push(...figure(b)); break;
      case 'shots': out.push(...shotsBlock(b)); break;
      case 'code': out.push(...codeBlock(b.lines)); break;
      case 'slot': out.push(...slot(b)); break;
      case 'refs': b.items.forEach((r, i) => out.push(new Paragraph({ children: [new TextRun({ text: `[${i + 1}]\t`, font: F, size: 24 }), new TextRun({ text: r, font: F, size: 24 })], alignment: AlignmentType.LEFT, tabStops: [{ type: 'left', position: 620 }], indent: { left: 620, hanging: 620 }, spacing: { after: 100 } }))); break;
      case 'pb': out.push(new Paragraph({ children: [new PageBreak()] })); break;
      default: throw new Error('unknown block ' + b.t);
    }
  }
  return out;
}

// ── preliminary pages ──
const C = front.COVER;
const centered = (text, o = {}) => new Paragraph({ bidirectional: true, children: runs(text, { size: o.size || 32, bold: !!o.bold, ...(o.underline ? { underline: {} } : {}) }), alignment: AlignmentType.CENTER, spacing: { before: o.before || 0, after: o.after ?? 120, line: o.line || 300 } });
const prelimTitle = (text) => new Paragraph({ bidirectional: true, style: 'PrelimTitle', children: runs(text), pageBreakBefore: true });

const cover = [
  new Paragraph({ children: [new ImageRun({ data: fs.readFileSync(LOGO_UNI), type: 'png', transformation: { width: 220, height: 220 }, altText: { title: 'شعار جامعة الخليل', description: 'شعار جامعة الخليل', name: 'hebron-university' } })], alignment: AlignmentType.CENTER, spacing: { before: 600, after: 360 } }),
  centered(C.college, { size: 36, bold: true, after: 100 }),
  centered(C.doc, { size: 30, after: 800 }),
  centered(C.titleLabel, { size: 34, bold: true, underline: true, after: 160 }),
  centered(C.title, { size: 38, bold: true, after: 800 }),
  centered(C.teamLabel, { size: 32, bold: true, after: 140 }),
  ...C.team.map((n) => centered(n, { size: 30, after: 60 })),
  centered(C.supLabel, { size: 32, bold: true, before: 640, after: 140 }),
  centered(C.supervisor, { size: 30, after: 1100 }),
  centered(C.year, { size: 30, bold: true }),
];

const D_ = front.dedication;
const dedication = [
  prelimTitle('الإهداء'),
  centered(D_.basmala, { size: 32, bold: true }),
  centered(D_.verse, { size: 30, after: 300 }),
  ...D_.paras.flatMap(([lead, text]) => [
    ...(lead ? [centered(lead, { size: 30, bold: true, after: 40 })] : []),
    centered(text, { size: 28, after: 200, line: 320 }),
  ]),
];
const A_ = front.acknowledgments;
const ack = [
  prelimTitle('شكر وتقدير'),
  centered(A_.verse, { size: 30, after: 300 }),
  ...A_.paras.map((t) => body(t, { p: { spacing: { after: 200, line: 340 } } })),
];
const L_ = front.logo;
const logoPage = [
  prelimTitle(L_.title),
  body(L_.text),
  new Paragraph({ children: [new ImageRun({ data: fs.readFileSync(LOGO_APP), type: 'jpg', transformation: { width: 560, height: Math.round((560 * 1024) / 1536) }, altText: { title: 'شعار قريب', description: 'شعار تطبيق قريب', name: 'logo' } })], alignment: AlignmentType.CENTER, spacing: { before: 240, after: 0 } }),
  new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, spacing: { before: 60, after: 240 }, children: runs(L_.caption, { size: 24, italics: true }) }),
];
const abstractAr = [
  prelimTitle('الملخص'),
  ...front.abstractAr.map((t) => body(t, { p: { spacing: { after: 180, line: 336 } } })),
  body(front.keywordsAr, { run: { italics: true } }),
];
const abstractEn = [
  new Paragraph({ style: 'PrelimTitleEn', children: [new TextRun({ text: 'Abstract', font: F })], pageBreakBefore: true }),
  ...front.abstractEn.map((t) => ltr(t)),
  ltr(front.keywordsEn, { italics: true }),
];
const tocs = [
  prelimTitle('فهرس المحتويات'),
  new TableOfContents('TOC', { hyperlink: true, headingStyleRange: '1-3' }),
  prelimTitle('فهرس الأشكال'),
  new TableOfContents('LOF', { hyperlink: true, stylesWithLevels: [new StyleLevel('FigureCaption', 1)] }),
  prelimTitle('فهرس الجداول'),
  new TableOfContents('LOT', { hyperlink: true, stylesWithLevels: [new StyleLevel('TableCaption', 1)] }),
];
const abbrev = [
  prelimTitle('قائمة الاختصارات'),
  new Table({
    width: { size: 8200, type: WidthType.DXA }, columnWidths: [1700, 3400, 3100], alignment: AlignmentType.CENTER, visuallyRightToLeft: true,
    rows: [['الاختصار', 'المعنى بالإنجليزية', 'المعنى بالعربية'], ...front.abbreviations].map((r, ri) => new TableRow({ tableHeader: ri === 0, children: r.map((c, ci) => new TableCell({
      width: { size: [1700, 3400, 3100][ci], type: WidthType.DXA }, borders, margins: cellMargins,
      shading: ri === 0 ? { fill: 'D9E2F3', type: ShadingType.CLEAR, color: 'auto' } : undefined,
      children: [ci === 1 && ri > 0
        ? new Paragraph({ children: [new TextRun({ text: c, font: F, size: 22 })], alignment: AlignmentType.LEFT, spacing: { after: 0 } })
        : new Paragraph({ bidirectional: true, children: runs(c, { size: 22, bold: ri === 0 || ci === 0 }), alignment: ci === 0 ? AlignmentType.CENTER : AlignmentType.JUSTIFIED, spacing: { after: 0 } })],
    })) })),
  }),
];

// ── document ──
const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: F, size: 22 })] })] });
const pageProps = (extra = {}) => ({ page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, header: 360, footer: 360 }, ...extra } });
const pb = (style) => ({ style, size: 24, color: '000000', space: 24 });

const mainChildren = render(blocks);
if (missingRefs.size) console.warn('Missing references:', [...missingRefs].join(', '));

const H = (id, name, size, color, extra = {}) => ({ id, name, basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: F, size, bold: true, color, rightToLeft: true }, paragraph: { bidirectional: true, keepNext: true, ...extra } });
const doc = new Document({
  creator: 'Qareeb team',
  title: C.title,
  description: 'تقرير مشروع التخرج',
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: F, size: BODY } } },
    paragraphStyles: [
      H('Heading1', 'Heading 1', 40, '1F2A44', { alignment: AlignmentType.CENTER, spacing: { before: 240, after: 360 }, outlineLevel: 0 }),
      H('Heading2', 'Heading 2', 32, '1F2A44', { alignment: AlignmentType.JUSTIFIED, spacing: { before: 300, after: 140 }, outlineLevel: 1 }),
      H('Heading3', 'Heading 3', 28, '2B4C9B', { alignment: AlignmentType.JUSTIFIED, spacing: { before: 220, after: 100 }, outlineLevel: 2 }),
      H('PrelimTitle', 'Preliminary Title', 38, '1F2A44', { alignment: AlignmentType.CENTER, spacing: { before: 240, after: 360 } }),
      { id: 'PrelimTitleEn', name: 'Preliminary Title English', basedOn: 'Normal', next: 'Normal', run: { font: F, size: 34, bold: true, color: '1F2A44' }, paragraph: { bidirectional: false, alignment: AlignmentType.CENTER, spacing: { before: 240, after: 360 }, keepNext: true } },
      { id: 'FigureCaption', name: 'FigureCaption', basedOn: 'Normal', next: 'Normal', run: { font: F, size: 24, rightToLeft: true }, paragraph: { bidirectional: true, alignment: AlignmentType.CENTER } },
      { id: 'TableCaption', name: 'TableCaption', basedOn: 'Normal', next: 'Normal', run: { font: F, size: 24, rightToLeft: true }, paragraph: { bidirectional: true, alignment: AlignmentType.CENTER, keepNext: true } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 560, hanging: 280 } } } }] },
      { reference: 'nums', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 560, hanging: 380 } } } }] },
    ],
  },
  sections: BODY_ONLY ? [{ properties: { ...pageProps({ pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } }) }, footers: { default: footer }, children: mainChildren }] : [
    { properties: pageProps({ borders: { pageBorderTop: pb(BorderStyle.THIN_THICK_SMALL_GAP), pageBorderLeft: pb(BorderStyle.THIN_THICK_SMALL_GAP), pageBorderBottom: pb(BorderStyle.THICK_THIN_SMALL_GAP), pageBorderRight: pb(BorderStyle.THICK_THIN_SMALL_GAP), pageBorders: { display: PageBorderDisplay.ALL_PAGES, offsetFrom: PageBorderOffsetFrom.PAGE } } }), children: cover },
    { properties: { ...pageProps({ pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } }) }, footers: { default: footer }, children: process.env.AR_NOFRONT ? [body('-')] : [...dedication, ...ack, ...logoPage, ...abstractAr, ...abstractEn, ...tocs, ...abbrev] },
    { properties: { ...pageProps({ pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } }) }, footers: { default: footer }, children: mainChildren },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(process.argv[2], buf);
  const figs = blocks.filter((b) => b.t === 'fig' || b.t === 'shots').length + 1;
  const tabs = blocks.filter((b) => b.t === 'table' || b.t === 'uc').length;
  console.log('written', process.argv[2], (buf.length / 1024 / 1024).toFixed(2) + ' MB', figs, 'figures', tabs, 'tables', placeholders.length, 'placeholders', blocks.filter((b) => b.t === 'slot').length, 'slots');
});
