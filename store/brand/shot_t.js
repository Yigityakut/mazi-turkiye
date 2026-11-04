const { chromium } = require('playwright');
(async () => {
  const [,, input, out, w, h] = process.argv;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  const svg = require('fs').readFileSync(input, 'utf8');
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace(/width="1024" height="1024"/, `width="${w}" height="${h}"`)}</body></html>`);
  await p.screenshot({ path: out, omitBackground: true });
  await b.close();
})();
