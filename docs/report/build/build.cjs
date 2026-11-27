// Builds the graduation report (.docx) from the chapter content files.
// Usage: node build.cjs <out.docx>
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
const LOGO_UNI = path.join(REPO, 'assets/hebron-university.png');

const front = require('./front.cjs');
const chapters = [require('./ch1.cjs'), require('./ch2.cjs'), require('./ch3.cjs'), require('./ch4.cjs'), require('./ch5.cjs'), require('./ch6.cjs')];
const { ch7, refs, appendices } = require('./ch7.cjs');
const blocks = [...chapters.flat(), ...ch7, ...refs, ...appendices];

const FONT = 'Times New Roman';
const PAGE_W = 11906, PAGE_H = 16838, MARGIN = 720; // A4, 0.5" margins as in the university template
const TEXT_W = PAGE_W - 2 * MARGIN; // 10466 twips = 7.27 in
const PX_W = 698; // usable width in px at 96 dpi
const PX_H = 880;

// ── numbering pass: figures and tables per chapter, cross-references ──
const refsMap = {};
{
  let chap = '0', f = 0, t = 0;
  for (const b of blocks) {
    if (b.t === 'h1') {
      const m = /^Chapter (\d+)/.exec(b.text) || /^Appendix ([A-Z])/.exec(b.text);
      if (m) { chap = m[1]; f = 0; t = 0; }
    }
    if (b.t === 'fig' || b.t === 'shots') { b.num = `${chap}.${++f}`; if (b.key) refsMap[b.key] = `Figure ${b.num}`; }
    if (b.t === 'table') { b.num = `${chap}.${++t}`; if (b.key) refsMap[b.key] = `Table ${b.num}`; }
    if (b.t === 'uc') { b.num = `${chap}.${++t}`; refsMap['uc:' + b.id] = `Table ${b.num}`; }
  }
}
const missingRefs = new Set();
const resolve = (s) => s.replace(/\{((?:fig|tab):[\w-]+)\}/g, (_, k) => { if (!refsMap[k]) missingRefs.add(k); return refsMap[k] || `[${k}]`; });

// ── inline formatting: **bold**, *italic*, `code` ──
function runs(text, base = {}) {
  const out = [];
  const parts = resolve(text).split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g).filter(Boolean);
  for (const part of parts) {
    if (part.startsWith('**')) out.push(new TextRun({ text: part.slice(2, -2), bold: true, font: FONT, ...base }));
    else if (part.startsWith('`')) out.push(new TextRun({ text: part.slice(1, -1), font: 'Consolas', size: (base.size || 24) - 2, ...(base.bold ? { bold: true } : {}) }));
    else if (part.startsWith('*') && part.length > 2) out.push(new TextRun({ text: part.slice(1, -1), italics: true, font: FONT, ...base }));
    else out.push(new TextRun({ text: part, font: FONT, ...base }));
  }
  return out;
}

const body = (text, o = {}) => new Paragraph({ children: runs(text, o.run), alignment: o.align ?? AlignmentType.JUSTIFIED, spacing: { after: 120, line: 288 }, ...(o.p || {}) });

let listInstance = 0;
function list(items, numbered, level = 0) {
  const inst = ++listInstance;
  return items.map((it) => new Paragraph({
    children: runs(it),
    numbering: { reference: numbered ? 'nums' : 'bullets', level, instance: numbered ? inst : undefined },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80, line: 276 },
  }));
}

// ── tables ──
const border = { style: BorderStyle.SINGLE, size: 4, color: '8A94A6' };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const cellMargins = { top: 50, bottom: 50, left: 90, right: 90 };

function cellParas(text, size, bold, align) {
  const lines = Array.isArray(text) ? text : [text];
  return lines.map((l) => new Paragraph({ children: runs(String(l), { size, ...(bold ? { bold: true } : {}) }), alignment: align ?? AlignmentType.LEFT, spacing: { after: 0, line: 252 } }));
}
function caption(kind, num, text) {
  return new Paragraph({
    style: kind === 'fig' ? 'FigureCaption' : 'TableCaption',
    children: [new TextRun({ text: `${kind === 'fig' ? 'Figure' : 'Table'} ${num}: `, bold: true, font: FONT, size: 21 }), ...runs(text, { size: 21 })],
    alignment: AlignmentType.CENTER,
    keepNext: kind !== 'fig',
    spacing: kind === 'fig' ? { before: 60, after: 240 } : { before: 160, after: 80 },
  });
}
function dataTable(b) {
  const size = Math.round((b.fontSize || 10) * 2);
  const widths = b.widths.map((w) => Math.round((w / 100) * TEXT_W));
  widths[widths.length - 1] += TEXT_W - widths.reduce((a, c) => a + c, 0);
  const n = widths.length;
  const head = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: b.head.map((h, i) => new TableCell({ width: { size: widths[i], type: WidthType.DXA }, borders, margins: cellMargins, shading: { fill: 'D9E2F3', type: ShadingType.CLEAR, color: 'auto' }, verticalAlign: VerticalAlign.CENTER, children: cellParas(h, size, true) })),
  });
  const rows = b.rows.map((r) => {
    if (r.length === 1) {
      return new TableRow({ cantSplit: true, children: [new TableCell({ columnSpan: n, width: { size: TEXT_W, type: WidthType.DXA }, borders, margins: cellMargins, shading: { fill: 'EEF3FC', type: ShadingType.CLEAR, color: 'auto' }, children: cellParas(r[0], size, true) })] });
    }
    return new TableRow({ cantSplit: true, children: r.map((c, i) => new TableCell({ width: { size: widths[i], type: WidthType.DXA }, borders, margins: cellMargins, children: cellParas(c, size) })) });
  });
  return [caption('tab', b.num, b.caption), new Table({ width: { size: TEXT_W, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, rows: [head, ...rows] }), new Paragraph({ children: [], spacing: { after: 120 } })];
}
function ucTable(b) {
  const w1 = 2050, w2 = TEXT_W - w1, size = 20;
  const row = (label, content) => new TableRow({
    cantSplit: false,
    children: [
      new TableCell({ width: { size: w1, type: WidthType.DXA }, borders, margins: cellMargins, shading: { fill: 'EEF3FC', type: ShadingType.CLEAR, color: 'auto' }, children: cellParas(label, size, true) }),
      new TableCell({ width: { size: w2, type: WidthType.DXA }, borders, margins: cellMargins, children: cellParas(content, size) }),
    ],
  });
  const rows = [
    row('Use case', `${b.id}: ${b.name}`),
    row('Description', b.desc),
    row('Actors', b.actors),
    row('Preconditions', b.pre),
    row('Main flow', b.main.map((s, i) => `${i + 1}. ${s}`)),
    row('Alternative flows', b.alt.length ? b.alt : ['None']),
    row('Postconditions', b.post),
    row('Related requirements', b.fr),
    row('Status', b.status),
  ];
  return [caption('tab', b.num, `${b.id} ${b.name}`), new Table({ width: { size: TEXT_W, type: WidthType.DXA }, columnWidths: [w1, w2], layout: TableLayoutType.FIXED, rows }), new Paragraph({ children: [], spacing: { after: 120 } })];
}

// ── images ──
function pngSize(file) {
  const buf = fs.readFileSync(file);
  if (buf[0] === 0x89) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), type: 'png', buf };
  // JPEG: walk the markers to the SOF frame
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
  const file = path.join(DIAG, b.file);
  const { w, h, type, buf } = pngSize(file);
  const sc = b.scale || 1;
  let cw = w / sc, ch = h / sc;
  const maxW = b.maxW || PX_W, maxH = b.maxH || PX_H;
  const k = Math.min(1, maxW / cw, maxH / ch);
  cw = Math.round(cw * k); ch = Math.round(ch * k);
  return [
    new Paragraph({ children: [new ImageRun({ data: buf, type, transformation: { width: cw, height: ch }, altText: { title: b.caption, description: b.caption, name: b.file } })], alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 0 } }),
    caption('fig', b.num, b.caption),
  ];
}
function shotsBlock(b) {
  const colW = Math.floor(TEXT_W / 3);
  const cells = b.files.map((f, i) => {
    const { w, h, type, buf } = pngSize(path.join(SHOTS, f));
    const dw = 196, dh = Math.round((dw * h) / w);
    return new TableCell({
      width: { size: colW, type: WidthType.DXA }, borders: noBorders, margins: { top: 40, bottom: 40, left: 60, right: 60 },
      children: [
        new Paragraph({ children: [new ImageRun({ data: buf, type, transformation: { width: dw, height: dh }, altText: { title: b.labels[i], description: b.labels[i], name: f } })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
        new Paragraph({ children: runs(b.labels[i], { size: 18 }), alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
      ],
    });
  });
  return [
    new Table({ width: { size: colW * 3, type: WidthType.DXA }, columnWidths: [colW, colW, colW], alignment: AlignmentType.CENTER, borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder }, rows: [new TableRow({ cantSplit: true, children: cells })] }),
    caption('fig', b.num, b.caption),
  ];
}
function codeBlock(lines) {
  return lines.map((l, i) => new Paragraph({
    children: [new TextRun({ text: l.length ? l : ' ', font: 'Consolas', size: 17 })],
    shading: { fill: 'F3F5F9', type: ShadingType.CLEAR, color: 'auto' },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: '2B4C9B', space: 6 } },
    spacing: { after: i === lines.length - 1 ? 160 : 0, line: 240 },
    indent: { left: 200 },
    keepNext: i !== lines.length - 1,
  }));
}

// ── render blocks ──
function render(list) {
  const out = [];
  for (const b of list) {
    switch (b.t) {
      case 'h1': out.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: b.text, font: FONT })], pageBreakBefore: true })); break;
      case 'h2': out.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: b.text, font: FONT })] })); break;
      case 'h3': out.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: b.text, font: FONT })] })); break;
      case 'p': out.push(body(b.text)); break;
      case 'note': out.push(body(b.text, { run: { italics: true } })); break;
      case 'bullets': out.push(...list_(b.items, false)); break;
      case 'numbers': out.push(...list_(b.items, true)); break;
      case 'table': out.push(...dataTable(b)); break;
      case 'uc': out.push(...ucTable(b)); break;
      case 'fig': out.push(...figure(b)); break;
      case 'shots': out.push(...shotsBlock(b)); break;
      case 'code': out.push(...codeBlock(b.lines)); break;
      case 'refs': b.items.forEach((r, i) => out.push(new Paragraph({ children: [new TextRun({ text: `[${i + 1}]\t`, font: FONT }), ...runs(r)], tabStops: [{ type: 'left', position: 620 }], indent: { left: 620, hanging: 620 }, spacing: { after: 100 } }))); break;
      case 'pb': out.push(new Paragraph({ children: [new PageBreak()] })); break;
      default: throw new Error('unknown block ' + b.t);
    }
  }
  return out;
}
const list_ = list;

// ── preliminary pages ──
const C = front.COVER;
const centered = (text, o = {}) => new Paragraph({ children: Array.isArray(text) ? text : [new TextRun({ text, font: FONT, size: o.size || 28, bold: !!o.bold, underline: o.underline ? {} : undefined, italics: !!o.italics })], alignment: AlignmentType.CENTER, spacing: { before: o.before || 0, after: o.after ?? 120 } });
const arabic = (text, size = 30, bold = false) => new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text, rightToLeft: true, bold, size, font: { ascii: FONT, hAnsi: FONT, cs: FONT } })] });
const prelimTitle = (text) => new Paragraph({ style: 'PrelimTitle', children: [new TextRun({ text, font: FONT })], pageBreakBefore: true });

const cover = [
  new Paragraph({ children: [new ImageRun({ data: fs.readFileSync(LOGO_UNI), type: 'png', transformation: { width: 230, height: 230 }, altText: { title: 'Hebron University logo', description: 'Hebron University logo', name: 'hebron-university' } })], alignment: AlignmentType.CENTER, spacing: { before: 720, after: 360 } }),
  centered(C.college, { size: 34, bold: true, after: 100 }),
  centered(C.doc, { size: 27, italics: true, after: 900 }),
  centered(C.titleLabel, { size: 30, bold: true, underline: true, after: 160 }),
  centered(C.title, { size: 36, bold: true, after: 960 }),
  centered(C.teamLabel, { size: 29, bold: true, after: 140 }),
  ...C.team.map((n) => centered(n, { size: 27, after: 60 })),
  centered(C.supLabel, { size: 29, bold: true, before: 760, after: 140 }),
  centered(C.supervisor, { size: 27, after: 1300 }),
  centered(C.year, { size: 27, bold: true }),
];

const D_ = front.dedication;
const dedication = [
  prelimTitle('Dedication'),
  arabic(D_.basmala, 30, true),
  arabic(D_.verse, 28),
  centered(D_.verseEn, { size: 22, italics: true, after: 300 }),
  ...D_.paras.map(([lead, text]) => new Paragraph({ children: [...(lead ? [new TextRun({ text: lead + ' ', bold: true, font: FONT })] : []), new TextRun({ text, font: FONT })], alignment: AlignmentType.CENTER, spacing: { after: 200, line: 300 } })),
];
const A_ = front.acknowledgments;
const ack = [
  prelimTitle('Acknowledgments'),
  arabic(A_.verse, 28),
  centered(A_.verseEn, { size: 22, italics: true, after: 300 }),
  ...A_.paras.map((t) => body(t, { p: { spacing: { after: 200, line: 300 } } })),
];
const abstract = [
  prelimTitle('Abstract'),
  ...front.abstract.map((t) => body(t, { p: { spacing: { after: 180, line: 300 } } })),
  body(front.keywords, { run: { italics: true } }),
];
const tocs = [
  prelimTitle('Table of Contents'),
  new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
  prelimTitle('List of Figures'),
  new TableOfContents('List of Figures', { hyperlink: true, stylesWithLevels: [new StyleLevel('FigureCaption', 1)] }),
  prelimTitle('List of Tables'),
  new TableOfContents('List of Tables', { hyperlink: true, stylesWithLevels: [new StyleLevel('TableCaption', 1)] }),
];
const abbrev = [
  prelimTitle('List of Abbreviations'),
  new Table({
    width: { size: 7000, type: WidthType.DXA }, columnWidths: [1800, 5200], alignment: AlignmentType.CENTER,
    rows: front.abbreviations.map(([a, d]) => new TableRow({ children: [
      new TableCell({ width: { size: 1800, type: WidthType.DXA }, borders: noBorders, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: a, bold: true, font: FONT })], spacing: { after: 0 } })] }),
      new TableCell({ width: { size: 5200, type: WidthType.DXA }, borders: noBorders, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: d, font: FONT })], spacing: { after: 0 } })] }),
    ] })),
  }),
];

// ── document ──
const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 22 })] })] });
const pageProps = (extra = {}) => ({ page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, header: 360, footer: 360 }, ...extra } });
const pageBorder = { style: BorderStyle.SINGLE, size: 18, color: '000000', space: 24 };

const mainChildren = render(blocks);
if (missingRefs.size) console.warn('Missing references:', [...missingRefs].join(', '));

const doc = new Document({
  creator: 'Qareeb team',
  title: C.title,
  description: 'Graduation project documentation',
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: FONT, size: 24 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 36, bold: true, color: '1F2A44' }, paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 240, after: 360 }, keepNext: true, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 28, bold: true, color: '1F2A44' }, paragraph: { spacing: { before: 300, after: 140 }, keepNext: true, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 25, bold: true, color: '2B4C9B' }, paragraph: { spacing: { before: 220, after: 100 }, keepNext: true, outlineLevel: 2 } },
      { id: 'PrelimTitle', name: 'Preliminary Title', basedOn: 'Normal', next: 'Normal', run: { font: FONT, size: 34, bold: true, color: '1F2A44' }, paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 240, after: 360 }, keepNext: true } },
      { id: 'FigureCaption', name: 'FigureCaption', basedOn: 'Normal', next: 'Normal', run: { font: FONT, size: 21 }, paragraph: { alignment: AlignmentType.CENTER } },
      { id: 'TableCaption', name: 'TableCaption', basedOn: 'Normal', next: 'Normal', run: { font: FONT, size: 21 }, paragraph: { alignment: AlignmentType.CENTER, keepNext: true } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      { reference: 'nums', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
    ],
  },
  sections: [
    { properties: pageProps({ borders: { pageBorderTop: pageBorder, pageBorderBottom: pageBorder, pageBorderLeft: pageBorder, pageBorderRight: pageBorder, pageBorders: { display: PageBorderDisplay.ALL_PAGES, offsetFrom: PageBorderOffsetFrom.PAGE } } }), children: cover },
    { properties: { ...pageProps({ pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } }) }, footers: { default: footer }, children: [...dedication, ...ack, ...abstract, ...tocs, ...abbrev] },
    { properties: { ...pageProps({ pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } }) }, footers: { default: footer }, children: mainChildren },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(process.argv[2], buf);
  const figs = blocks.filter((b) => b.t === 'fig' || b.t === 'shots').length;
  const tabs = blocks.filter((b) => b.t === 'table' || b.t === 'uc').length;
  console.log('written', process.argv[2], (buf.length / 1024 / 1024).toFixed(2) + ' MB', figs, 'figures', tabs, 'tables');
});
