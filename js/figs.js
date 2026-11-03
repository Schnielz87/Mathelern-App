/* Kleine SVG-Zeichnungen für Geometrie-Aufgaben. */
(function (root) {
  'use strict';
  const S = 'stroke="#1a1a2e" stroke-width="3" stroke-linejoin="round"';
  const L = (x, y, t, col = '#1a1a2e', anchor = 'middle') =>
    `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="17" font-weight="800" fill="${col}" font-family="Nunito, sans-serif">${t}</text>`;
  const wrap = (w, h, inner) => `<svg class="fig" viewBox="0 0 ${w} ${h}" role="img">${inner}</svg>`;
  const Q = '#d0315e'; // Farbe für das Gesuchte

  const F = {
    rect(a, b) {
      return wrap(260, 170, `<rect x="40" y="25" width="180" height="105" fill="#ffe3ef" ${S}/>` +
        L(130, 155, a) + L(232, 82, b, '#1a1a2e', 'start'));
    },
    tri(g, h) {
      return wrap(260, 170, `<polygon points="30,135 230,135 160,25" fill="#e0f7ff" ${S}/>` +
        `<line x1="160" y1="25" x2="160" y2="135" stroke="#7a3cff" stroke-width="2.5" stroke-dasharray="6 5"/>` +
        `<rect x="160" y="123" width="12" height="12" fill="none" stroke="#7a3cff" stroke-width="2"/>` +
        L(130, 160, 'g = ' + g) + L(166, 85, 'h = ' + h, '#7a3cff', 'start'));
    },
    para(a, h) {
      return wrap(260, 170, `<polygon points="30,135 190,135 235,30 75,30" fill="#fff3c4" ${S}/>` +
        `<line x1="75" y1="30" x2="75" y2="135" stroke="#7a3cff" stroke-width="2.5" stroke-dasharray="6 5"/>` +
        L(110, 160, 'a = ' + a) + L(82, 90, 'h = ' + h, '#7a3cff', 'start'));
    },
    trapez(a, c, h) {
      return wrap(260, 175, `<polygon points="25,135 235,135 180,35 80,35" fill="#e6ffe9" ${S}/>` +
        `<line x1="80" y1="35" x2="80" y2="135" stroke="#7a3cff" stroke-width="2.5" stroke-dasharray="6 5"/>` +
        L(130, 160, 'a = ' + a) + L(130, 26, 'c = ' + c) + L(87, 92, 'h = ' + h, '#7a3cff', 'start'));
    },
    circle(label) {
      return wrap(220, 180, `<circle cx="110" cy="90" r="70" fill="#f0e6ff" ${S}/>` +
        `<circle cx="110" cy="90" r="4" fill="#1a1a2e"/>` +
        `<line x1="110" y1="90" x2="180" y2="90" stroke="#d0315e" stroke-width="3"/>` + L(145, 82, label, Q));
    },
    /** rechtwinkliges Dreieck; labels {a,b,c} (Text oder '?') */
    right(lab, angle) {
      const ang = angle ? `<path d="M 205 140 A 34 34 0 0 0 197 118" fill="none" stroke="#7a3cff" stroke-width="2.5"/>` + L(178, 132, angle, '#7a3cff') : '';
      return wrap(270, 180, `<polygon points="40,140 230,140 40,30" fill="#e0f7ff" ${S}/>` +
        `<rect x="40" y="126" width="14" height="14" fill="none" stroke="#1a1a2e" stroke-width="2"/>` + ang +
        L(135, 166, lab.b, lab.b.includes('?') ? Q : '#1a1a2e') +
        L(30, 92, lab.a, lab.a.includes('?') ? Q : '#1a1a2e', 'end') +
        L(150, 76, lab.c, lab.c.includes('?') ? Q : '#1a1a2e', 'start'));
    },
    quader(a, b, c) {
      return wrap(260, 180, `<polygon points="40,60 170,60 170,150 40,150" fill="#ffe3ef" ${S}/>` +
        `<polygon points="40,60 90,25 220,25 170,60" fill="#ffd0e3" ${S}/>` +
        `<polygon points="170,60 220,25 220,115 170,150" fill="#ffbcd7" ${S}/>` +
        L(105, 172, a) + L(208, 145, b, '#1a1a2e', 'start') + L(34, 110, c, '#1a1a2e', 'end'));
    },
    zylinder(r, h) {
      return wrap(220, 190, `<path d="M 50 40 L 50 150 A 60 18 0 0 0 170 150 L 170 40" fill="#e0f7ff" ${S}/>` +
        `<ellipse cx="110" cy="40" rx="60" ry="18" fill="#c9efff" ${S}/>` +
        `<line x1="110" y1="40" x2="170" y2="40" stroke="#d0315e" stroke-width="3"/>` +
        L(140, 33, r, Q) + L(178, 100, h, '#1a1a2e', 'start'));
    },
    kegel(r, h) {
      return wrap(220, 190, `<path d="M 50 150 L 110 25 L 170 150" fill="#fff3c4" ${S}/>` +
        `<ellipse cx="110" cy="150" rx="60" ry="16" fill="#ffe89a" ${S}/>` +
        `<line x1="110" y1="25" x2="110" y2="150" stroke="#7a3cff" stroke-width="2.5" stroke-dasharray="6 5"/>` +
        `<line x1="110" y1="150" x2="170" y2="150" stroke="#d0315e" stroke-width="3"/>` +
        L(140, 178, r, Q) + L(116, 100, h, '#7a3cff', 'start'));
    },
    pyramide(a, h) {
      return wrap(240, 190, `<polygon points="30,150 160,150 210,115 110,20" fill="#e6ffe9" ${S}/>` +
        `<line x1="160" y1="150" x2="110" y2="20" ${S}/>` +
        `<line x1="110" y1="20" x2="118" y2="132" stroke="#7a3cff" stroke-width="2.5" stroke-dasharray="6 5"/>` +
        L(95, 175, a) + L(124, 95, h, '#7a3cff', 'start'));
    },
    kugel(r) {
      return wrap(200, 180, `<circle cx="100" cy="90" r="70" fill="#f0e6ff" ${S}/>` +
        `<ellipse cx="100" cy="90" rx="70" ry="18" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-dasharray="5 5"/>` +
        `<line x1="100" y1="90" x2="170" y2="90" stroke="#d0315e" stroke-width="3"/>` + L(135, 82, r, Q));
    },
    /** Koordinatensystem mit Gerade y = m x + b (Bereich −5..5) */
    graph(m, b) {
      const W = 240, c = 120, u = 20;
      let g = '';
      for (let i = -5; i <= 5; i++) {
        g += `<line x1="${c + i * u}" y1="20" x2="${c + i * u}" y2="220" stroke="#d9d2f0" stroke-width="1"/>`;
        g += `<line x1="20" y1="${c - i * u}" x2="220" y2="${c - i * u}" stroke="#d9d2f0" stroke-width="1"/>`;
      }
      g += `<line x1="15" y1="${c}" x2="225" y2="${c}" stroke="#1a1a2e" stroke-width="2"/><line x1="${c}" y1="15" x2="${c}" y2="225" stroke="#1a1a2e" stroke-width="2"/>`;
      g += L(228, c - 6, 'x', '#1a1a2e', 'end') + L(c + 10, 22, 'y', '#1a1a2e', 'start');
      for (let i = -4; i <= 4; i += 2) if (i) { g += `<text x="${c + i * u}" y="${c + 16}" font-size="11" text-anchor="middle" fill="#555">${i}</text><text x="${c - 6}" y="${c - i * u + 4}" font-size="11" text-anchor="end" fill="#555">${i}</text>`; }
      const X = (x) => c + x * u, Y = (y) => c - y * u;
      g += `<g clip-path="url(#gc)"><line x1="${X(-6)}" y1="${Y(m * -6 + b)}" x2="${X(6)}" y2="${Y(m * 6 + b)}" stroke="#d0315e" stroke-width="3.5"/></g>`;
      return `<svg class="fig" viewBox="0 0 ${W} ${W}" role="img"><defs><clipPath id="gc"><rect x="20" y="20" width="200" height="200"/></clipPath></defs>${g}</svg>`;
    },
    /** Strahlensatz-Figur */
    strahlen(a, b, c) {
      return wrap(270, 170, `<line x1="20" y1="150" x2="250" y2="150" ${S}/><line x1="20" y1="150" x2="240" y2="20" ${S}/>` +
        `<line x1="110" y1="150" x2="110" y2="97" stroke="#7a3cff" stroke-width="3"/><line x1="220" y1="150" x2="220" y2="32" stroke="#d0315e" stroke-width="3"/>` +
        L(65, 168, a) + L(165, 168, b) + L(116, 130, c, '#7a3cff', 'start') + L(226, 95, '?', Q, 'start'));
    },
  };

  /** Regenbogen-Pfeile fürs Ausmultiplizieren: factor ( t1 + t2 ... ) */
  F.arrows = function (factor, parts) {
    const cw = 15; // Zeichenbreite (Monospace)
    const colors = ['#ff3d7f', '#00a6d6', '#ffb000', '#7a3cff'];
    let x = 10;
    let txt = '';
    const fx = x + (factor.length * cw) / 2;
    txt += `<text x="${x}" y="80" class="mono">${factor}</text>`;
    x += factor.length * cw;
    txt += `<text x="${x}" y="80" class="mono">(</text>`; x += cw;
    const centers = [];
    parts.forEach((p, i) => {
      if (i > 0) { txt += `<text x="${x}" y="80" class="mono">${p.op}</text>`; x += p.op.length * cw; }
      centers.push(x + (p.t.length * cw) / 2);
      txt += `<text x="${x}" y="80" class="mono" fill="${colors[i % 4]}">${p.t}</text>`; x += p.t.length * cw;
    });
    txt += `<text x="${x}" y="80" class="mono">)</text>`; x += cw;
    let arcs = '';
    centers.forEach((cx, i) => {
      const h = 18 + i * 14;
      arcs += `<path class="arrow a${i}" d="M ${fx} 58 Q ${(fx + cx) / 2} ${58 - h * 1.6} ${cx} 58" fill="none" stroke="${colors[i % 4]}" stroke-width="3.5" marker-end="url(#ah${i})"/>`;
      arcs += `<marker id="ah${i}" markerWidth="4" markerHeight="4" refX="2.5" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="${colors[i % 4]}"/></marker>`;
    });
    return `<svg class="fig arrows" viewBox="0 0 ${x + 10} 95">${arcs}${txt}</svg>`;
  };

  /** Klammer mal Klammer: (a + b)(c + d) mit 4 Pfeilen */
  F.foil = function (l1, op1, l2, r1, op2, r2) {
    const cw = 15, colors = ['#ff3d7f', '#00a6d6', '#ffb000', '#7a3cff'];
    let x = 10, txt = '';
    const put = (s, col) => { const c = x + (s.length * cw) / 2; txt += `<text x="${x}" y="95" class="mono"${col ? ` fill="${col}"` : ''}>${s}</text>`; x += s.length * cw; return c; };
    put('(');
    const A = put(l1, '#1a1a2e'); put(op1); const B = put(l2, '#1a1a2e'); put(')('); const C = put(r1, '#7a3cff'); put(op2); const D = put(r2, '#7a3cff'); put(')');
    const arc = (from, to, h, col, i, below) => {
      const y = below ? 102 : 73;
      const cy = below ? y + h : y - h;
      return `<marker id="fh${i}" markerWidth="4" markerHeight="4" refX="2.5" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="${col}"/></marker>` +
        `<path class="arrow a${i}" d="M ${from} ${y} Q ${(from + to) / 2} ${cy} ${to} ${y}" fill="none" stroke="${col}" stroke-width="3.5" marker-end="url(#fh${i})"/>`;
    };
    const arcs = arc(A, C, 60, colors[0], 0) + arc(A, D, 85, colors[1], 1) + arc(B, C, 30, colors[2], 2, true) + arc(B, D, 50, colors[3], 3, true);
    return `<svg class="fig arrows" viewBox="0 0 ${x + 10} 160">${arcs}${txt}</svg>`;
  };

  root.FIG = F;
  if (typeof module !== 'undefined' && module.exports) module.exports = F;
})(typeof window !== 'undefined' ? window : globalThis);
