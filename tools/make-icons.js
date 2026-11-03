/* Erzeugt App-Icon (Android + PWA) aus der Kiko-Grafik.
   Start: NODE_PATH=$(npm root -g) node tools/make-icons.js  (braucht Playwright) */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const ART = require(path.join(ROOT, 'web/js/art.js'));
const font = fs.readFileSync(path.join(ROOT, 'web/fonts/bangers.woff2')).toString('base64');

function burst(cx, cy, r1, r2, n) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const r = i % 2 ? r2 : r1;
    pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
  }
  return pts.join(' ');
}
const sym = (x, y, t, s, rot) => `<text x="${x}" y="${y}" font-family="B" font-size="${s}" fill="#fff" stroke="#1a1a2e" stroke-width="${s / 9}" paint-order="stroke" text-anchor="middle" transform="rotate(${rot} ${x} ${y})">${t}</text>`;

function layer({ bg = true, fg = true, scale = 1 }) {
  const kiko = ART.kiko('cheer').replace('<svg class="kiko "', '<svg').replace('viewBox="0 0 200 200"', `x="${256 - 150 * scale}" y="${262 - 150 * scale}" width="${300 * scale}" height="${300 * scale}" viewBox="0 0 200 200"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <style>@font-face{font-family:B;src:url(data:font/woff2;base64,${font})}</style>
    <radialGradient id="bg" cx="0.5" cy="0.45" r="0.75"><stop offset="0" stop-color="#ff5fa2"/><stop offset="0.5" stop-color="#8a2be2"/><stop offset="1" stop-color="#2b1055"/></radialGradient>
  </defs>
  ${bg ? `<rect width="512" height="512" fill="url(#bg)"/>
  <g opacity="0.18" fill="#fff">${Array.from({ length: 24 }, (_, i) => { const a = i * 15; return `<polygon points="256,256 ${256 + 600 * Math.cos((a - 3) * Math.PI / 180)},${256 + 600 * Math.sin((a - 3) * Math.PI / 180)} ${256 + 600 * Math.cos((a + 3) * Math.PI / 180)},${256 + 600 * Math.sin((a + 3) * Math.PI / 180)}"/>`; }).join('')}</g>
  ${sym(84, 120, '+', 78, -12)}${sym(430, 128, 'x<tspan font-size="38" dy="-24">2</tspan>', 62, 10)}${sym(92, 438, '÷', 66, 8)}${sym(424, 440, 'π', 70, -10)}` : ''}
  ${fg ? `<polygon points="${burst(256, 262, 150 * scale, 118 * scale, 14)}" fill="#ffd23f" stroke="#1a1a2e" stroke-width="${8 * scale}" stroke-linejoin="round"/>${kiko}` : ''}
</svg>`;
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  async function shot(svg, size, out, transparent = false) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<html><body style="margin:0;background:transparent"><div style="width:${size}px;height:${size}px">${svg.replace('width="512" height="512"', `width="${size}" height="${size}"`)}</div></body></html>`);
    await p.waitForTimeout(150);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await p.screenshot({ path: out, omitBackground: transparent });
  }
  const full = layer({ scale: 1.08 });
  await shot(full, 512, path.join(ROOT, 'web/icons/icon-512.png'));
  await shot(full, 192, path.join(ROOT, 'web/icons/icon-192.png'));
  await shot(full, 180, path.join(ROOT, 'web/icons/apple-touch-icon.png'));
  await shot(layer({ scale: 0.82 }), 512, path.join(ROOT, 'web/icons/icon-maskable-512.png'));
  await shot(layer({ scale: 1.08 }), 1024, path.join(ROOT, 'docs/icon-1024.png'));
  // Android: adaptive Ebenen (108dp, xxxhdpi = 432px) + klassisches Icon
  const res = path.join(ROOT, 'app/src/main/res');
  await shot(layer({ fg: false }), 432, path.join(res, 'drawable-xxxhdpi/ic_launcher_background.png'));
  await shot(layer({ bg: false, scale: 0.72 }), 432, path.join(res, 'drawable-xxxhdpi/ic_launcher_foreground.png'), true);
  await shot(full, 192, path.join(res, 'mipmap-xxxhdpi/ic_launcher.png'));
  await p.setViewportSize({ width: 192, height: 192 });
  await p.setContent(`<html><body style="margin:0;background:transparent"><div style="width:192px;height:192px;border-radius:50%;overflow:hidden">${full.replace('width="512" height="512"', 'width="192" height="192"')}</div></body></html>`);
  await p.screenshot({ path: path.join(res, 'mipmap-xxxhdpi/ic_launcher_round.png'), omitBackground: true });
  await b.close();
  console.log('Icons erzeugt.');
})();
