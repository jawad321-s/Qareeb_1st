# Opens a .docx in headless LibreOffice, updates every index (TOC, lists of
# figures and tables) twice so page numbers settle, then saves .docx and .pdf.
import subprocess, sys, time, os, uno
from com.sun.star.beans import PropertyValue

src, out_docx, out_pdf = [os.path.abspath(p) for p in sys.argv[1:4]]
port = 2083
proc = subprocess.Popen(['soffice', '--headless', '--invisible', '--nologo', '--norestore',
                         f'--accept=socket,host=127.0.0.1,port={port};urp;StarOffice.ComponentContext'],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
def prop(n, v):
    p = PropertyValue(); p.Name = n; p.Value = v; return p
ctx = None
local = uno.getComponentContext()
resolver = local.ServiceManager.createInstanceWithContext('com.sun.star.bridge.UnoUrlResolver', local)
for _ in range(60):
    try:
        ctx = resolver.resolve(f'uno:socket,host=127.0.0.1,port={port};urp;StarOffice.ComponentContext'); break
    except Exception:
        time.sleep(1)
smgr = ctx.ServiceManager
desktop = smgr.createInstanceWithContext('com.sun.star.frame.Desktop', ctx)
doc = desktop.loadComponentFromURL(uno.systemPathToFileUrl(src), '_blank', 0, (prop('Hidden', True),))
for _ in range(2):
    idx = doc.getDocumentIndexes()
    for i in range(idx.getCount()):
        idx.getByIndex(i).update()
    doc.refresh()
print('indexes', doc.getDocumentIndexes().getCount())
doc.storeToURL(uno.systemPathToFileUrl(out_docx), (prop('FilterName', 'MS Word 2007 XML'),))
doc.storeToURL(uno.systemPathToFileUrl(out_pdf), (prop('FilterName', 'writer_pdf_Export'),))
doc.close(True)
try:
    desktop.terminate()
except Exception:
    pass
proc.wait(timeout=30)
print('saved')
