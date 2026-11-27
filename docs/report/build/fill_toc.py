# Copies the index entries LibreOffice computed (report-lo.docx) into the empty
# TOC / List of Figures / List of Tables fields of the original report.docx.
import re, sys, zipfile, html
src_lo, src, out = sys.argv[1:4]
lo = zipfile.ZipFile(src_lo).read('word/document.xml').decode('utf8')
entries = {'toc': [], 'lof': [], 'lot': []}
for p in re.findall(r'<w:p[ >].*?</w:p>', lo, re.S):
    m = re.search(r'<w:pStyle w:val="(TOC[123])"', p)
    if not m: continue
    level = int(m.group(1)[-1])
    # text before the last tab is the title, after it the page number
    parts = re.split(r'<w:tab/>', p)
    title = ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', ''.join(parts[:-1]))).strip()
    page = ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', parts[-1])).strip()
    t = html.unescape(title)
    kind = 'lof' if t.startswith('Figure ') else 'lot' if t.startswith('Table ') else 'toc'
    entries[kind].append((level, t, page))
print({k: len(v) for k, v in entries.items()})
FONT = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>'
def para(level, title, page):
    ind = {1: 0, 2: 300, 3: 600}[level]
    bold = '<w:b/>' if level == 1 and title.startswith(('Chapter', 'Appendix', 'References')) else ''
    esc = lambda s: html.escape(s, quote=False)
    return (f'<w:p><w:pPr><w:pStyle w:val="TOC{level}"/><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="10450"/></w:tabs>'
            f'<w:spacing w:before="0" w:after="50"/><w:ind w:left="{ind}" w:right="500"/></w:pPr>'
            f'<w:r><w:rPr>{FONT}{bold}<w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">{esc(title)}</w:t></w:r>'
            f'<w:r><w:rPr>{FONT}<w:sz w:val="22"/></w:rPr><w:tab/></w:r>'
            f'<w:r><w:rPr>{FONT}{bold}<w:sz w:val="22"/></w:rPr><w:t>{esc(page)}</w:t></w:r></w:p>')
zin = zipfile.ZipFile(src)
doc = zin.read('word/document.xml').decode('utf8')
order = [('Table of Contents', 'toc'), ('List of Figures', 'lof'), ('List of Tables', 'lot')]
for alias, kind in order:
    pat = re.compile(r'(<w:sdt><w:sdtPr><w:alias w:val="' + alias + r'"/></w:sdtPr><w:sdtContent><w:p>.*?<w:fldChar w:fldCharType="separate"/></w:r></w:p>)(<w:p><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>)', re.S)
    m = pat.search(doc)
    assert m, alias
    doc = doc[:m.end(1)] + ''.join(para(*e) for e in entries[kind]) + doc[m.end(1):]
zout = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED)
for item in zin.infolist():
    if item.filename.endswith('/'): continue
    data = doc.encode('utf8') if item.filename == 'word/document.xml' else zin.read(item.filename)
    zout.writestr(item, data)
zout.close()
print('written', out)
