// Renders every docs/report/diagrams/*.mmd to a PNG (2x) with the local Mermaid build.
// Usage: node render.cjs <diagrams dir> [only-name]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const dir = process.argv[2];
const only = process.argv[3];
const mermaidJs = fs.readFileSync(path.join(__dirname, 'node_modules/mermaid/dist/mermaid.min.js'), 'utf8');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 2 })).newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.setContent('<!doctype html><html><head><style>body{margin:0;background:#fff;font-family:Arial,Helvetica,sans-serif} #box{display:inline-block;padding:18px;background:#fff} #box.wide{display:block;width:1100px}</style></head><body><div id="box"></div></body></html>');
  await p.addScriptTag({ content: mermaidJs });
  await p.evaluate(() => {
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      fontFamily: 'Arial, Helvetica, sans-serif',
      themeVariables: {
        fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '15px',
        primaryColor: '#EEF3FC', primaryBorderColor: '#2B4C9B', primaryTextColor: '#111827',
        secondaryColor: '#FFF4E8', tertiaryColor: '#F7F9FC', lineColor: '#4B5563',
        clusterBkg: '#FAFBFE', clusterBorder: '#94A3B8', noteBkgColor: '#FFF8DB', noteBorderColor: '#C9A227',
        actorBkg: '#EEF3FC', actorBorder: '#2B4C9B', signalColor: '#374151', labelBoxBkgColor: '#EEF3FC',
        edgeLabelBackground: '#FFFFFF',
      },
      flowchart: { htmlLabels: true, curve: 'basis', nodeSpacing: 34, rankSpacing: 46, padding: 10, wrappingWidth: 260 },
      sequence: { mirrorActors: false, messageAlign: 'center', actorMargin: 22, boxMargin: 6, noteMargin: 6, wrap: true, width: 128, messageFontSize: 15, actorFontSize: 15, noteFontSize: 14 },
      er: { layoutDirection: 'TB', minEntityWidth: 100, fontSize: 17, entityPadding: 12 },
      gantt: { barHeight: 26, fontSize: 14, sectionFontSize: 15, leftPadding: 130, gridLineStartPadding: 30, useWidth: 1150 },
      class: { padding: 8 },
    });
  });
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mmd') && (!only || f.startsWith(only))).sort();
  const sizes = {};
  for (const f of files) {
    const code = fs.readFileSync(path.join(dir, f), 'utf8');
    const ok = await p.evaluate(async ({ code, id }) => {
      try {
        const { svg } = await window.mermaid.render(id, code);
        const bx = document.getElementById('box'); bx.className = code.startsWith('gantt') ? 'wide' : ''; bx.innerHTML = svg;
        const s = document.querySelector('#box svg');
        const vb = s.viewBox.baseVal;
        s.removeAttribute('style');
        s.setAttribute('width', vb.width);
        s.setAttribute('height', vb.height);
        return 'ok';
      } catch (e) { return 'ERR ' + e.message; }
    }, { code, id: 'd' + f.replace(/\W/g, '') });
    if (ok !== 'ok') { console.log(f, ok.slice(0, 300)); continue; }
    const box = await p.$('#box');
    const out = path.join(dir, f.replace('.mmd', '.png'));
    await box.screenshot({ path: out });
    const bb = await box.boundingBox();
    sizes[f.replace('.mmd', '')] = [Math.round(bb.width), Math.round(bb.height)];
    console.log('rendered', f, sizes[f.replace('.mmd', '')].join('x'));
  }
  fs.writeFileSync(path.join(dir, 'sizes.json'), JSON.stringify({ ...(fs.existsSync(path.join(dir, 'sizes.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'sizes.json'), 'utf8')) : {}), ...sizes }, null, 1));
  if (errs.length) console.log('page errors', errs.slice(0, 3));
  await b.close();
})();
