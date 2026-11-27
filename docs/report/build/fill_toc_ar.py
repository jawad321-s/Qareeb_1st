# Arabic version of fill_toc.py: copies the index entries LibreOffice computed
# (report-lo.docx) into the empty TOC / list-of-figures / list-of-tables fields
# of the generated Arabic report, as right-to-left paragraphs.
# Usage: python3 fill_toc_ar.py <lo.docx> <generated.docx> <out.docx>
import re, sys, zipfile, html
src_lo, src, out = sys.argv[1:4]
lo = zipfile.ZipFile(src_lo).read('word/document.xml').decode('utf8')
entries = {'toc': [], 'lof': [], 'lot': []}
for p in re.findall(r'<w:p[ >].*?</w:p>', lo, re.S):
    m = re.search(r'<w:pStyle w:val="(TOC[123])"', p)
    if not m:
        continue
    level = int(m.group(1)[-1])
    parts = re.split(r'<w:tab/>', p)
    title = ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', ''.join(parts[:-1]))).strip()
    page = ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', parts[-1])).strip()
    t = html.unescape(title)
    kind = 'lof' if t.startswith('شكل') else 'lot' if t.startswith('جدول') else 'toc'
    entries[kind].append((level, t, page))
print({k: len(v) for k, v in entries.items()})
FONT = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>'
esc = lambda s: html.escape(s, quote=False)

def para(level, title, page):
    ind = {1: 0, 2: 360, 3: 720}[level]
    main = level == 1 and title.startswith(('الفصل', 'الملحق', 'المراجع'))
    bold = '<w:b/><w:bCs/>' if main else ''
    size = '<w:sz w:val="24"/><w:szCs w:val="24"/>'
    return (f'<w:p><w:pPr><w:pStyle w:val="TOC{level}"/>'
            f'<w:tabs><w:tab w:val="right" w:leader="dot" w:pos="10450"/></w:tabs><w:bidi/>'
            f'<w:spacing w:before="{80 if main else 0}" w:after="40"/><w:ind w:left="{ind}" w:right="0"/><w:jc w:val="left"/></w:pPr>'
            f'<w:r><w:rPr>{FONT}{bold}{size}<w:rtl/></w:rPr><w:t xml:space="preserve">{esc(title)}</w:t></w:r>'
            f'<w:r><w:rPr>{FONT}{size}<w:rtl/></w:rPr><w:tab/></w:r>'
            f'<w:r><w:rPr>{FONT}{bold}{size}<w:rtl/></w:rPr><w:t>{esc(page)}</w:t></w:r></w:p>')

zin = zipfile.ZipFile(src)
doc = zin.read('word/document.xml').decode('utf8')
# docx-js writes <w:highlightCs>, which is not in the Word schema; the plain <w:highlight> is kept.
doc = re.sub(r'<w:highlightCs [^>]*/>', '', doc)
for alias, kind in [('TOC', 'toc'), ('LOF', 'lof'), ('LOT', 'lot')]:
    pat = re.compile(r'(<w:sdt><w:sdtPr><w:alias w:val="' + alias + r'"/></w:sdtPr><w:sdtContent><w:p>.*?<w:fldChar w:fldCharType="separate"/></w:r></w:p>)(<w:p><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>)', re.S)
    m = pat.search(doc)
    assert m, alias
    doc = doc[:m.end(1)] + ''.join(para(*e) for e in entries[kind]) + doc[m.end(1):]
zout = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED)
for item in zin.infolist():
    if item.filename.endswith('/'):
        continue
    data = doc.encode('utf8') if item.filename == 'word/document.xml' else zin.read(item.filename)
    zout.writestr(item, data)
zout.close()
print('written', out)
