/* Band 2 – Klasse 9 */
(function (root) {
  'use strict';
  const MC = root.MC || require('./mathcore.js');
  const FIG = root.FIG || require('./figs.js');
  const { ri, pick, nz, shuffle, fmt, par, term, terms, fmtPoly, tryParse, round, sup } = MC;
  const TOPICS = root.TOPICS;
  const topic = (o) => TOPICS.push(o);
  const { num, mc, multi, ps, fr, eq } = root.TASK;
  const tm = root.TASK.term;
  const B = (s) => `<b class="hl">${s}</b>`;

  // ======================================================================
  topic({
    id: 'potenzen', band: 9, title: 'Potenzen', sub: 'Hochzahlen & Zehnerpotenzen', emoji: '🚀',
    boss: { name: 'Hochzahl-Hydra', emoji: '🐍' }, sticker: { e: '🪐', n: 'Planeten-Profi' }, pre: ['neg'],
    learn: [
      { t: 'Abkürzung fürs Malnehmen', mood: 'happy',
        k: 'Statt 2 · 2 · 2 · 2 · 2 schreiben wir kurz <b>2⁵</b>. Die kleine Zahl oben (Hochzahl) sagt, <b>wie oft</b> man die Zahl mit sich selbst malnimmt.',
        ex: eq('2⁵ = 2 · 2 · 2 · 2 · 2 = 32') + eq('3² = 3 · 3 = 9'),
        tia: 'Also ist 2⁵ nicht 2 · 5?', k2: 'Richtig erkannt! 2 · 5 = 10, aber 2⁵ = 32. Ein häufiger Fehler! ⚠️' },
      { t: 'Zehnerpotenzen', mood: 'wow',
        k: 'Riesige Zahlen schreibt man mit <b>10er-Potenzen</b>. Die Hochzahl zählt die Nullen!',
        ex: eq('10³ = 1.000') + eq('10⁶ = 1.000.000') + eq('4,5 · 10³ = 4.500') + '<p>Komma um 3 Stellen nach rechts schieben.</p>' },
      { t: 'Potenz-Regeln mit x', mood: 'think',
        k: 'Gleiche Basis malnehmen → Hochzahlen <b>addieren</b>.<br>Gleiche Basis teilen → Hochzahlen <b>subtrahieren</b>.',
        ex: eq('x³ · x⁴ = x⁷') + eq('x⁶ : x² = x⁴') + eq('(x²)³ = x⁶'),
        quiz: { q: 'Was ist x² · x⁵?', c: ['x⁷', 'x¹⁰', '2x⁷', 'x³'], a: 0, why: 'Hochzahlen addieren: 2 + 5 = 7.' } },
    ],
    formulas: ['aⁿ = a · a · … · a (n-mal)', 'xᵃ · xᵇ = xᵃ⁺ᵇ', 'xᵃ : xᵇ = xᵃ⁻ᵇ', '(xᵃ)ᵇ = xᵃ·ᵇ', '10ⁿ = 1 mit n Nullen'],
    gen(lvl) {
      if (lvl === 1) {
        const [b, e] = pick([[2, 3], [2, 4], [2, 5], [2, 6], [3, 2], [3, 3], [3, 4], [4, 2], [4, 3], [5, 2], [5, 3], [10, 4], [6, 2], [7, 2], [-2, 3], [-3, 2], [-2, 4]]);
        const v = Math.pow(b, e);
        return num(`Rechne aus: ${eq(par(b) + sup(e) + ' = ?')}`, v, { misc: [{ ans: b * e, msg: `Achtung: ${par(b)}${sup(e)} heißt <b>${e}-mal ${par(b)} malnehmen</b>, nicht ${par(b)} · ${e}!` }], hint: `${Array(e).fill(par(b)).join(' · ')}`, steps: [`${Array(e).fill(par(b)).join(' · ')} = <b>${fmt(v)}</b>`] });
      }
      if (lvl === 2) {
        const m = pick([1.2, 2.5, 3.4, 4.5, 6.8, 7.25, 9.1, 3]); const e = ri(2, 6); const v = round(m * Math.pow(10, e), 6);
        if (ri(0, 1)) return num(`Schreib als normale Zahl: ${eq(fmt(m) + ' · 10' + sup(e))}`, v, { hint: `Schiebe das Komma ${e} Stellen nach rechts.`, steps: [`Komma ${e} Stellen nach rechts → <b>${fmt(v)}</b>`] });
        return num(`Ergänze die Hochzahl: ${eq(fmt(v) + ' = ' + fmt(m) + ' · 10<sup>?</sup>')}`, e, { hint: 'Zähle, um wie viele Stellen das Komma wandern muss.', steps: [`Das Komma wandert ${e} Stellen → Hochzahl <b>${e}</b>`] });
      }
      const t = ri(0, 2); const a = ri(2, 6), b = ri(2, 5);
      if (t === 0) return tm(`Vereinfache: ${eq('x' + sup(a) + ' · x' + sup(b))}`, 'x^' + (a + b), 'mono', { show: 'x' + sup(a + b), misc: [{ ans: 'x^' + a * b, msg: 'Beim Malnehmen werden die Hochzahlen <b>addiert</b>, nicht malgenommen.' }], hint: 'Gleiche Basis malnehmen → Hochzahlen addieren.', steps: [`x${sup(a)} · x${sup(b)} = x${sup(a + '+' + b)} = <b>x${sup(a + b)}</b>`] });
      if (t === 1) { const c = a + b; return tm(`Vereinfache: ${eq('x' + sup(c) + ' : x' + sup(b))}`, 'x^' + a, 'mono', { show: 'x' + sup(a), hint: 'Gleiche Basis teilen → Hochzahlen subtrahieren.', steps: [`x${sup(c)} : x${sup(b)} = x${sup(c + '−' + b)} = <b>x${sup(a)}</b>`] }); }
      return tm(`Vereinfache: ${eq('(x' + sup(a) + ')' + sup(b))}`, 'x^' + a * b, 'mono', { show: 'x' + sup(a * b), misc: [{ ans: 'x^' + (a + b), msg: 'Bei Potenz von Potenz werden die Hochzahlen <b>malgenommen</b>.' }], hint: 'Potenz von einer Potenz → Hochzahlen malnehmen.', steps: [`(x${sup(a)})${sup(b)} = x${sup(a + '·' + b)} = <b>x${sup(a * b)}</b>`] });
    },
  });

  // ======================================================================
  topic({
    id: 'wurzel', band: 9, title: 'Quadratwurzeln', sub: 'Rückwärts-Quadrieren', emoji: '🌱',
    boss: { name: 'Wurzel-Yokai', emoji: '🌳' }, sticker: { e: '🌸', n: 'Sakura-Sturm' }, pre: ['potenzen'],
    learn: [
      { t: 'Was ist eine Wurzel?', mood: 'happy',
        k: 'Die Wurzel fragt: <b>Welche Zahl mal sich selbst ergibt das?</b>',
        ex: eq('√49 = 7, weil 7 · 7 = 49') + eq('√100 = 10') },
      { t: 'Quadratzahlen kennen', mood: 'cheer',
        k: 'Lerne diese Zahlen wie einen Song 🎶 – dann sind Wurzeln ganz leicht:',
        ex: '<div class="chips">' + Array.from({ length: 15 }, (_, i) => `<span>${i + 1}² = ${(i + 1) ** 2}</span>`).join('') + '</div>' },
      { t: 'Schätzen', mood: 'think',
        k: 'Ist die Zahl keine Quadratzahl, liegt die Wurzel <b>zwischen</b> zwei ganzen Zahlen.',
        ex: eq('√50: 7² = 49 und 8² = 64') + '<p>→ √50 liegt zwischen <b>7 und 8</b> (ganz nah an 7).</p>',
        quiz: { q: 'Was ist √81?', c: ['9', '8', '40,5', '18'], a: 0, why: '9 · 9 = 81' } },
    ],
    formulas: ['√a = b, wenn b · b = a', '√(a²) = a'],
    gen(lvl) {
      if (lvl === 1) { const n = ri(2, 15); return num(`Rechne aus: ${eq('√' + n * n + ' = ?')}`, n, { misc: [{ ans: n * n / 2, msg: 'Die Wurzel ist nicht die Hälfte! Frag dich: <b>Welche Zahl mal sich selbst</b> ergibt ' + n * n + '?' }], hint: `Welche Zahl mal sich selbst ergibt ${n * n}?`, steps: [`${n} · ${n} = ${n * n} → √${n * n} = <b>${n}</b>`] }); }
      if (lvl === 2) {
        const n = pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.1, 1.2, 1.5, 20, 30, 40, 50]);
        const sq = round(n * n, 4);
        return num(`Rechne aus: ${eq('√' + fmt(sq) + ' = ?')}`, n, { hint: n < 2 ? 'Denk an das kleine Einmaleins: z. B. √0,25 = 0,5, weil 0,5 · 0,5 = 0,25.' : 'Denk an die Nullen: √400 = 20, weil 20 · 20 = 400.', steps: [`${fmt(n)} · ${fmt(n)} = ${fmt(sq)} → <b>${fmt(n)}</b>`] });
      }
      let x; do { x = ri(5, 150); } while (Number.isInteger(Math.sqrt(x)));
      const lo = Math.floor(Math.sqrt(x));
      return mc(`Zwischen welchen ganzen Zahlen liegt ${eq('√' + x)}`, [`${lo} und ${lo + 1}`, `${lo - 1} und ${lo}`, `${lo + 1} und ${lo + 2}`, `${Math.floor(x / 2)} und ${Math.floor(x / 2) + 1}`], { hint: 'Welche Quadratzahlen liegen knapp darunter und darüber?', steps: [`${lo}² = ${lo * lo} und ${lo + 1}² = ${(lo + 1) ** 2}`, `→ zwischen <b>${lo} und ${lo + 1}</b>`] });
    },
  });

  // ======================================================================
  const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [15, 20, 25]];
  topic({
    id: 'pythagoras', band: 9, title: 'Satz des Pythagoras', sub: 'Rechtwinklige Dreiecke', emoji: '📏',
    boss: { name: 'Dreieck-Tengu', emoji: '🔺' }, sticker: { e: '🗡️', n: 'Katheten-Klinge' }, pre: ['potenzen', 'wurzel'],
    learn: [
      { t: 'Das rechtwinklige Dreieck', mood: 'happy',
        k: 'Hat ein Dreieck einen <b>rechten Winkel</b> (90°, wie eine Buchecke 📘), haben die Seiten Namen: Die längste Seite gegenüber vom rechten Winkel heißt <b>Hypotenuse c</b>. Die zwei kurzen heißen <b>Katheten a und b</b>.',
        ex: FIG.right({ a: 'a', b: 'b', c: 'c' }) },
      { t: 'Der berühmte Satz', mood: 'wow',
        k: 'Pythagoras hat entdeckt:',
        ex: eq('a² + b² = c²') + '<p>Beispiel: a = 3, b = 4 → 9 + 16 = 25 → c = √25 = <b>5</b></p>',
        tia: 'Und wenn c bekannt ist und a gesucht?', k2: 'Dann rechnest du minus: a² = c² − b² 😉' },
      { t: 'Das Rezept', mood: 'cheer',
        k: '<ol class="recipe"><li>Hypotenuse finden (gegenüber vom rechten Winkel).</li><li>Lange Seite gesucht? → <b>quadrieren, addieren, Wurzel</b>.</li><li>Kurze Seite gesucht? → <b>quadrieren, subtrahieren, Wurzel</b>.</li></ol>',
        quiz: { q: 'a = 6 cm, b = 8 cm. Wie lang ist c?', c: ['10 cm', '14 cm', '100 cm', '48 cm'], a: 0, why: '36 + 64 = 100, √100 = 10' } },
    ],
    formulas: ['c² = a² + b²', 'c = √(a² + b²)', 'a = √(c² − b²)'],
    gen(lvl) {
      if (lvl === 1) {
        const [a, b, c] = pick(TRIPLES);
        return num('Berechne die Hypotenuse <b>c</b>.', c, { unit: 'cm', fig: FIG.right({ a: a + ' cm', b: b + ' cm', c: 'c = ?' }), misc: [{ ans: a + b, msg: 'Nicht einfach addieren! Erst <b>quadrieren</b>, dann addieren, dann Wurzel ziehen.' }], hint: 'c = √(a² + b²)', steps: [`${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}`, `c = √${c * c} = <b>${c} cm</b>`] });
      }
      if (lvl === 2) {
        const a = ri(2, 12), b = ri(2, 12); const c = Math.sqrt(a * a + b * b);
        if (Number.isInteger(c)) return this.gen(lvl);
        return num('Berechne <b>c</b> (auf 1 Stelle runden, Taschenrechner erlaubt).', round(c, 1), { unit: 'cm', tol: 0.051, fig: FIG.right({ a: a + ' cm', b: b + ' cm', c: 'c = ?' }), hint: 'c = √(a² + b²)', steps: [`${a}² + ${b}² = ${a * a + b * b}`, `c = √${a * a + b * b} ≈ <b>${fmt(c, 1)} cm</b>`] });
      }
      if (ri(0, 1)) {
        const [a, b, c] = pick(TRIPLES);
        return num('Berechne die Kathete <b>a</b>.', a, { unit: 'cm', fig: FIG.right({ a: 'a = ?', b: b + ' cm', c: c + ' cm' }), misc: [{ ans: round(Math.sqrt(c * c + b * b), 1), msg: 'Gesucht ist eine <b>kurze</b> Seite – dann musst du <b>subtrahieren</b>: a² = c² − b².' }], hint: 'a = √(c² − b²)', steps: [`${c}² − ${b}² = ${c * c} − ${b * b} = ${a * a}`, `a = √${a * a} = <b>${a} cm</b>`] });
      }
      const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]]);
      return num(`Eine Leiter ist <b>${c} m</b> lang. Sie steht unten <b>${a} m</b> von der Wand weg. Wie hoch reicht sie an der Wand?`, b, { unit: 'm', hint: 'Die Leiter ist die Hypotenuse (längste Seite). Gesucht ist eine Kathete.', steps: [`${c}² − ${a}² = ${c * c} − ${a * a} = ${b * b}`, `√${b * b} = <b>${b} m</b>`] });
    },
  });

  // ======================================================================
  topic({
    id: 'linfkt', band: 9, title: 'Lineare Funktionen', sub: 'y = m·x + b', emoji: '📈',
    boss: { name: 'Geraden-Geist', emoji: '👻' }, sticker: { e: '⚡', n: 'Blitz-Rechnerin' }, pre: ['terme', 'neg'],
    learn: [
      { t: 'Eine Funktion ist eine Maschine', mood: 'happy',
        k: 'Eine Funktion ist wie ein Automat 🎰: Du wirfst ein <b>x</b> rein, und es kommt ein <b>y</b> raus.',
        ex: eq('y = 2x + 1') + '<p>x = 3 rein → 2 · 3 + 1 = <b>7</b> raus</p>' },
      { t: 'm und b', mood: 'think',
        k: '<b>b</b> = wo die Gerade die y-Achse schneidet (Startpunkt).<br><b>m</b> = Steigung: Wie viel geht es nach oben, wenn du 1 nach rechts gehst?',
        ex: FIG.graph(2, 1) + eq('y = 2x + 1: Start bei 1, pro Schritt 2 hoch') },
      { t: 'Steigung aus zwei Punkten', mood: 'wow',
        k: 'Hast du zwei Punkte, rechnest du: <b>m = Unterschied der y : Unterschied der x</b>.',
        ex: eq('P(1|3) und Q(3|7): m = (7 − 3) : (3 − 1) = 4 : 2 = 2'),
        quiz: { q: 'Wie groß ist b bei y = 3x − 5?', c: ['−5', '3', '5', '−3'], a: 0, why: 'b ist die Zahl ohne x, mit Vorzeichen: −5.' } },
      { t: 'Nullstelle', mood: 'cheer',
        k: 'Die Nullstelle ist dort, wo die Gerade die x-Achse trifft. Da ist <b>y = 0</b>. Also: Gleichung lösen!',
        ex: eq('0 = 2x − 6  | + 6') + eq('6 = 2x  | : 2') + eq('x = 3') },
    ],
    formulas: ['y = m · x + b', 'm = (y₂ − y₁) : (x₂ − x₁)', 'Nullstelle: y = 0 setzen'],
    gen(lvl) {
      const m = nz(-4, 4), b = ri(-5, 5);
      const fx = terms([[m, 'x'], [b, '']]);
      if (lvl === 1) { const x = ri(-4, 5); const y = m * x + b; return num(`Gegeben ist ${eq('y = ' + fx)} Berechne y für <b>x = ${fmt(x)}</b>.`, y, { lhs: 'y', hint: 'Setze x mit Klammer ein.', steps: [`y = ${fmt(m)} · ${par(x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = <b>${fmt(y)}</b>`] }); }
      if (lvl === 2) {
        const t = ri(0, 2);
        if (t === 0) return num(`Wie groß ist die Steigung <b>m</b> bei ${eq('y = ' + fx)}`, m, { lhs: 'm', hint: 'm ist die Zahl vor dem x.', steps: [`m = <b>${fmt(m)}</b>`] });
        if (t === 1) return num(`Wo schneidet ${eq('y = ' + fx)} die y-Achse? Gib <b>b</b> an.`, b, { lhs: 'b', hint: 'b ist die Zahl ohne x (mit Vorzeichen).', steps: [`b = <b>${fmt(b)}</b>`] });
        return num(`Lies die Steigung <b>m</b> aus dem Bild ab.`, m, { lhs: 'm', fig: FIG.graph(m, b), hint: 'Gehe 1 Kästchen nach rechts. Wie viele Kästchen geht die Linie hoch (+) oder runter (−)?', steps: [`1 nach rechts → ${Math.abs(m)} ${m > 0 ? 'hoch' : 'runter'} → m = <b>${fmt(m)}</b>`] });
      }
      if (ri(0, 1)) {
        const x1 = ri(-3, 2), dx = ri(1, 3); const x2 = x1 + dx; const y1 = m * x1 + b, y2 = m * x2 + b;
        return num(`Eine Gerade geht durch <b>P(${fmt(x1)} | ${fmt(y1)})</b> und <b>Q(${fmt(x2)} | ${fmt(y2)})</b>. Berechne die Steigung m.`, m, { lhs: 'm', hint: 'm = (y₂ − y₁) : (x₂ − x₁)', steps: [`m = (${fmt(y2)} − ${par(y1)}) : (${fmt(x2)} − ${par(x1)}) = ${fmt(y2 - y1)} : ${dx} = <b>${fmt(m)}</b>`] });
      }
      const x0 = nz(-5, 5); const bb = -m * x0;
      const f2 = terms([[m, 'x'], [bb, '']]);
      return num(`Berechne die <b>Nullstelle</b> von ${eq('y = ' + f2)}`, x0, { lhs: 'x', hint: 'Setze y = 0 und löse nach x.', steps: [`0 = ${f2}`, `${term(m, 'x')} = ${fmt(-bb)}`, `x = <b>${fmt(x0)}</b>`] });
    },
  });

  // ======================================================================
  topic({
    id: 'ausmult2', band: 9, title: 'Klammer mal Klammer', sub: 'Jeder mit jedem', emoji: '🤝',
    boss: { name: 'Doppel-Oni', emoji: '👹' }, sticker: { e: '🦋', n: 'Schmetterling' }, pre: ['ausmult'],
    learn: [
      { t: 'Jeder mit jedem!', mood: 'happy',
        k: 'Zwei Klammern sind wie zwei Teams beim Sportfest 🏃‍♀️. <b>Jeder aus Team 1 klatscht mit jedem aus Team 2 ab</b>. Das sind 4 Abklatscher!',
        ex: FIG.foil('x', '+', '2', 'x', '+', '3') + '<p><b class="c0">x·x = x²</b> · <b class="c1">x·3 = 3x</b> · <b class="c2">2·x = 2x</b> · <b class="c3">2·3 = 6</b></p>' + eq('(x + 2)(x + 3) = x² + 3x + 2x + 6 = x² + 5x + 6') },
      { t: 'Am Ende zusammenfassen', mood: 'think',
        k: 'Nach den 4 Abklatschern fasst du die <b>x-Glieder zusammen</b>. Die stehen meistens in der Mitte.',
        ex: eq('(x − 4)(x + 1)') + eq('= x² + x − 4x − 4') + eq('= x² − 3x − 4'),
        tia: 'Und die Vorzeichen?', k2: 'Wie immer: gleiche Zeichen → +, verschiedene → − 🤝' },
      { t: 'Zur Kontrolle', mood: 'cheer',
        k: 'Hast du <b>4 Ergebnisse</b> vor dem Zusammenfassen? Dann hast du niemanden vergessen! ✔',
        quiz: { q: '(x + 1)(x + 5) = ?', c: ['x² + 6x + 5', 'x² + 5', 'x² + 5x + 6', '2x + 6'], a: 0, why: 'x² + 5x + x + 5 = x² + 6x + 5' } },
    ],
    formulas: ['(a + b)(c + d) = ac + ad + bc + bd'],
    gen(lvl) {
      let a = 1, b, c = 1, d;
      if (lvl === 1) { b = ri(1, 9); d = ri(1, 9); }
      else if (lvl === 2) { b = nz(-9, 9); d = nz(-9, 9); }
      else { a = ri(1, 4); c = ri(2, 4); b = nz(-7, 7); d = nz(-7, 7); }
      const ans = ps([[a * c, 'x^2'], [a * d + b * c, 'x'], [b * d, '']]);
      const l = `(${terms([[a, 'x'], [b, '']])})(${terms([[c, 'x'], [d, '']])})`;
      const four = [[a * c, 'x²'], [a * d, 'x'], [b * c, 'x'], [b * d, '']];
      return tm(`Multipliziere aus: ${eq(l)}`, ans, 'expanded', {
        misc: [{ ans: ps([[a * c, 'x^2'], [b * d, '']]), msg: 'Du hast die <b>mittleren</b> Abklatscher vergessen! Jeder mit jedem: das sind 4 Stück. 🤝' }],
        hint: 'Jeder aus der 1. Klammer mit jedem aus der 2. Klammer: 4 Ergebnisse, dann zusammenfassen.',
        steps: [`4 Abklatscher: ${terms(four)}`, `zusammenfassen: <b>${fmtPoly(tryParse(ans))}</b>`],
        fig: FIG.foil(term(a, 'x'), b < 0 ? '−' : '+', String(Math.abs(b)), term(c, 'x'), d < 0 ? '−' : '+', String(Math.abs(d))),
        guided: [
          { q: `Schritt 1: ${term(a, 'x')} · ${term(c, 'x')} = ?`, kind: 'term', answer: ps([[a * c, 'x^2']]) },
          { q: `Schritt 2: ${term(a, 'x')} · ${par(d)} = ?`, kind: 'term', answer: ps([[a * d, 'x']]) },
          { q: `Schritt 3: ${par(b)} · ${term(c, 'x')} = ?`, kind: 'term', answer: ps([[b * c, 'x']]) },
          { q: `Schritt 4: ${par(b)} · ${par(d)} = ?`, kind: 'num', answer: b * d },
        ],
      });
    },
  });

  // ======================================================================
  topic({
    id: 'gleich2', band: 9, title: 'Gleichungen & Textaufgaben', sub: 'Mit Klammern und Geschichten', emoji: '🧩',
    boss: { name: 'Rätsel-Sphinx', emoji: '🦁' }, sticker: { e: '🧠', n: 'Superhirn' }, pre: ['gleich', 'ausmult'],
    learn: [
      { t: 'Klammern zuerst auflösen', mood: 'think',
        k: 'Steht eine Klammer in der Gleichung, <b>multipliziere zuerst aus</b>. Dann löst du wie immer mit der Waage.',
        ex: eq('3(x + 2) = 21') + eq('3x + 6 = 21  | − 6') + eq('3x = 15  | : 3') + eq('x = 5') },
      { t: 'Textaufgaben knacken 🕵️‍♀️', mood: 'happy',
        k: '<ol class="recipe"><li>Was ist gesucht? Das wird <b>x</b>.</li><li>Den Text Stück für Stück in einen Term übersetzen.</li><li>Gleichung aufstellen und lösen.</li><li>Antwortsatz schreiben.</li></ol>',
        ex: '<p>„Tia ist x Jahre alt. Ihr Bruder ist 3 Jahre älter. Zusammen sind sie 31.“</p>' + eq('x + (x + 3) = 31') + eq('2x + 3 = 31 → x = 14') },
      { t: 'Zahlenrätsel', mood: 'cheer',
        k: '„Ich denke mir eine Zahl …“ – die gedachte Zahl ist x!',
        ex: '<p>„Das Dreifache einer Zahl plus 4 ergibt 19.“</p>' + eq('3x + 4 = 19 → x = 5'),
        quiz: { q: '„Das Doppelte einer Zahl minus 3 ergibt 11.“ Welche Zahl?', c: ['7', '4', '8', '14'], a: 0, why: '2x − 3 = 11 → 2x = 14 → x = 7' } },
    ],
    formulas: ['Erst Klammern auflösen, dann Waage', 'Gesuchtes = x'],
    gen(lvl) {
      const x = ri(1, 12);
      if (lvl === 1) {
        const a = ri(2, 6), b = nz(-6, 9);
        return num(eq(`${a}(${terms([[1, 'x'], [b, '']])}) = ${fmt(a * (x + b))}`), x, { lhs: 'x', hint: 'Zuerst die Klammer ausmultiplizieren.', steps: [`${terms([[a, 'x'], [a * b, '']])} = ${fmt(a * (x + b))}`, `${a}x = ${fmt(a * x)}`, `x = <b>${x}</b>`] });
      }
      if (lvl === 2) {
        const a = ri(2, 5), b = nz(-5, 5); let c; do { c = ri(1, 6); } while (c === a); const d = a * (x + b) - c * x;
        return num(eq(`${a}(${terms([[1, 'x'], [b, '']])}) = ${terms([[c, 'x'], [d, '']])}`), x, { lhs: 'x', hint: 'Klammer auflösen, dann alle x auf eine Seite.', steps: [`${terms([[a, 'x'], [a * b, '']])} = ${terms([[c, 'x'], [d, '']])}`, `${terms([[a - c, 'x'], [a * b, '']])} = ${fmt(d)}`, `${term(a - c, 'x')} = ${fmt(d - a * b)}`, `x = <b>${x}</b>`] });
      }
      const t = ri(0, 2);
      if (t === 0) { const age = ri(10, 16), d = ri(2, 6); return num(`Tia ist x Jahre alt. Ihre Schwester ist <b>${d} Jahre älter</b>. Zusammen sind sie <b>${2 * age + d}</b> Jahre alt. Wie alt ist Tia?`, age, { unit: 'Jahre', hint: `x + (x + ${d}) = ${2 * age + d}`, steps: [`x + x + ${d} = ${2 * age + d}`, `2x = ${2 * age}`, `x = <b>${age}</b>`] }); }
      if (t === 1) { const k = ri(2, 5), p = ri(1, 12), n = ri(2, 12); return num(`„Ich denke mir eine Zahl. Das <b>${['', '', 'Doppelte', 'Dreifache', 'Vierfache', 'Fünffache'][k]}</b> davon plus <b>${p}</b> ergibt <b>${k * n + p}</b>.“ Welche Zahl ist es?`, n, { hint: `${k}x + ${p} = ${k * n + p}`, steps: [`${k}x + ${p} = ${k * n + p}`, `${k}x = ${k * n}`, `x = <b>${n}</b>`] }); }
      const price = ri(5, 12), fix = ri(2, 8), cnt = ri(2, 6);
      return num(`Im Manga-Shop zahlt Tia für <b>${cnt}</b> gleich teure Bände und <b>${fix} €</b> Versand zusammen <b>${cnt * price + fix} €</b>. Wie viel kostet ein Band?`, price, { unit: '€', hint: `${cnt}x + ${fix} = ${cnt * price + fix}`, steps: [`${cnt}x + ${fix} = ${cnt * price + fix}`, `${cnt}x = ${cnt * price}`, `x = <b>${price} €</b>`] });
    },
  });

  // ======================================================================
  topic({
    id: 'koerper', band: 9, title: 'Körper', sub: 'Quader, Prisma, Zylinder', emoji: '🧊',
    boss: { name: 'Würfel-Wächter', emoji: '🎲' }, sticker: { e: '💎', n: 'Kristall-Kopf' }, pre: ['flaechen', 'kreis'],
    learn: [
      { t: 'Volumen = Was passt rein?', mood: 'happy',
        k: 'Das <b>Volumen</b> sagt, wie viele 1-cm-Würfelchen in einen Körper passen 🧊. Bei Quader: <b>Länge · Breite · Höhe</b>.',
        ex: FIG.quader('a = 5 cm', 'b = 3 cm', 'c = 2 cm') + eq('V = 5 · 3 · 2 = 30 cm³') },
      { t: 'Der Stapel-Trick', mood: 'wow',
        k: 'Prisma und Zylinder sind wie ein <b>Stapel</b> aus Grundflächen 🥞. Darum: <b>Grundfläche mal Höhe</b>.',
        ex: eq('V = G · h') + FIG.zylinder('r', 'h') + eq('Zylinder: V = π · r² · h') },
      { t: 'Oberfläche', mood: 'think',
        k: 'Die <b>Oberfläche</b> ist alles, was du einpacken müsstest 🎁 – alle Flächen zusammen.',
        ex: eq('Quader: O = 2·(ab + ac + bc)'),
        quiz: { q: 'Würfel mit 3 cm Kantenlänge. Volumen?', c: ['27 cm³', '9 cm³', '18 cm³', '54 cm³'], a: 0, why: '3 · 3 · 3 = 27 cm³' } },
    ],
    formulas: ['Quader: V = a · b · c', 'Würfel: V = a³', 'Prisma/Zylinder: V = G · h', 'Zylinder: V = π · r² · h', 'Quader: O = 2(ab + ac + bc)'],
    gen(lvl) {
      if (lvl === 1) { const a = ri(2, 10), b = ri(2, 8), c = ri(2, 8); return num('Berechne das <b>Volumen</b> des Quaders.', a * b * c, { unit: 'cm³', fig: FIG.quader(`${a} cm`, `${b} cm`, `${c} cm`), hint: 'V = a · b · c', steps: [`V = ${a} · ${b} · ${c} = <b>${a * b * c} cm³</b>`] }); }
      if (lvl === 2) {
        if (ri(0, 1)) { const a = ri(2, 8), b = ri(2, 6), c = ri(2, 6); const O = 2 * (a * b + a * c + b * c); return num('Berechne die <b>Oberfläche</b> des Quaders.', O, { unit: 'cm²', fig: FIG.quader(`${a} cm`, `${b} cm`, `${c} cm`), hint: 'O = 2·(a·b + a·c + b·c)', steps: [`${a}·${b} + ${a}·${c} + ${b}·${c} = ${a * b + a * c + b * c}`, `· 2 = <b>${O} cm²</b>`] }); }
        const G = ri(4, 30), h = ri(2, 12); return num(`Ein Prisma hat die Grundfläche <b>G = ${G} cm²</b> und die Höhe <b>h = ${h} cm</b>. Berechne das Volumen.`, G * h, { unit: 'cm³', hint: 'V = G · h', steps: [`V = ${G} · ${h} = <b>${G * h} cm³</b>`] });
      }
      const r = ri(2, 8), h = ri(3, 15); const V = Math.PI * r * r * h;
      return num('Berechne das Volumen des Zylinders (π ≈ 3,14, auf ganze cm³ runden).', Math.round(V), { unit: 'cm³', tol: Math.max(1, V * 0.004), fig: FIG.zylinder(`r = ${r} cm`, `h = ${h} cm`), hint: 'V = π · r · r · h', steps: [`V = 3,14 · ${r} · ${r} · ${h} ≈ <b>${fmt(Math.round(V))} cm³</b>`] });
    },
  });

  // ======================================================================
  topic({
    id: 'statistik', band: 9, title: 'Statistik', sub: 'Mittelwert, Median & Co.', emoji: '📊',
    boss: { name: 'Daten-Dämon', emoji: '😈' }, sticker: { e: '🐼', n: 'Panda-Pause' }, pre: ['brueche'],
    learn: [
      { t: 'Mittelwert (Durchschnitt)', mood: 'happy',
        k: 'Stell dir vor, alle legen ihre Gummibärchen 🐻 zusammen und verteilen sie <b>gerecht</b>. Das ist der Mittelwert: <b>alles addieren, durch die Anzahl teilen</b>.',
        ex: eq('Noten 2, 3, 1, 2 → (2+3+1+2) : 4 = 2') },
      { t: 'Median (Zentralwert)', mood: 'think',
        k: 'Sortiere die Zahlen der Größe nach. Der <b>Median</b> ist die Zahl genau <b>in der Mitte</b>.',
        ex: eq('7, 2, 9, 4, 5 → sortiert: 2, 4, <u>5</u>, 7, 9') + '<p>Median = <b>5</b></p>' },
      { t: 'Spannweite & Modalwert', mood: 'cheer',
        k: '<b>Spannweite</b> = größter Wert − kleinster Wert.<br><b>Modalwert</b> = der Wert, der <b>am häufigsten</b> vorkommt.',
        ex: eq('3, 5, 5, 8, 10: Spannweite 10 − 3 = 7, Modalwert 5'),
        quiz: { q: 'Mittelwert von 4, 6, 8?', c: ['6', '18', '4', '8'], a: 0, why: '(4 + 6 + 8) : 3 = 18 : 3 = 6' } },
    ],
    formulas: ['Mittelwert = Summe : Anzahl', 'Median = mittlerer Wert (sortiert)', 'Spannweite = Max − Min', 'Modalwert = häufigster Wert'],
    gen(lvl) {
      const n = pick([5, 7]);
      let data = Array.from({ length: n }, () => ri(1, 20));
      const show = () => `<div class="chips">${data.map((d) => `<span>${d}</span>`).join('')}</div>`;
      const sorted = data.slice().sort((a, b) => a - b);
      if (lvl === 1) { const s = sorted[n - 1] - sorted[0]; return num(`Bestimme die <b>Spannweite</b>: ${show()}`, s, { hint: 'Größter Wert minus kleinster Wert.', steps: [`${sorted[n - 1]} − ${sorted[0]} = <b>${s}</b>`] }); }
      if (lvl === 2) {
        if (ri(0, 1)) return num(`Bestimme den <b>Median</b>: ${show()}`, sorted[(n - 1) / 2], { hint: 'Erst sortieren, dann die Mitte suchen.', steps: [`sortiert: ${sorted.join(', ')}`, `Mitte: <b>${sorted[(n - 1) / 2]}</b>`] });
        const v = data[ri(0, n - 1)]; data[ri(0, n - 1)] = v; data[ri(0, n - 1)] = v;
        const cnt = {}; data.forEach((d) => (cnt[d] = (cnt[d] || 0) + 1));
        const max = Math.max(...Object.values(cnt)); const modes = Object.keys(cnt).filter((k) => cnt[k] === max);
        if (modes.length !== 1) return this.gen(lvl);
        return num(`Bestimme den <b>Modalwert</b>: ${show()}`, +modes[0], { hint: 'Welche Zahl kommt am häufigsten vor?', steps: [`${modes[0]} kommt ${max}-mal vor → <b>${modes[0]}</b>`] });
      }
      const sum = data.reduce((a, b) => a + b, 0); const fix = (n - (sum % n)) % n; data[0] += fix;
      const S = sum + fix;
      return num(`Berechne den <b>Mittelwert</b>: ${show()}`, S / n, { tol: 0.01, hint: 'Alle addieren, dann durch die Anzahl teilen.', steps: [`Summe: ${data.join(' + ')} = ${S}`, `${S} : ${n} = <b>${fmt(S / n)}</b>`] });
    },
  });

  // ======================================================================
  topic({
    id: 'wkeit', band: 9, title: 'Wahrscheinlichkeit', sub: 'Würfel, Münzen, Lose', emoji: '🎲',
    boss: { name: 'Glücks-Kitsune', emoji: '🦊' }, sticker: { e: '🐱', n: 'Neko-Glück' }, pre: ['brueche'],
    learn: [
      { t: 'Wie wahrscheinlich?', mood: 'happy',
        k: 'Wahrscheinlichkeit = <b>günstige Fälle : alle Fälle</b>. „Günstig“ heißt: das, was du dir wünschst. 🍀',
        ex: '<p>Würfel: Wie wahrscheinlich ist eine 6?</p>' + eq(`1 günstiger Fall von 6 → P = ${fr(1, 6)}`) },
      { t: 'Beispiel mit Losen', mood: 'think',
        k: 'In einer Box sind 3 rote und 7 blaue Kugeln. Ziehe eine:',
        ex: eq(`P(rot) = ${fr(3, 10)} = 0,3 = 30 %`),
        quiz: { q: 'Würfel: Wie wahrscheinlich ist eine gerade Zahl?', c: ['1/2', '1/6', '1/3', '2/3'], a: 0, why: '2, 4, 6 sind 3 von 6 → 3/6 = 1/2' } },
      { t: 'Zwei Mal hintereinander', mood: 'wow',
        k: 'Zwei Dinge hintereinander? Dann <b>malnehmen</b>! (Pfadregel 🌳)',
        ex: eq(`Zweimal Kopf: ${fr(1, 2)} · ${fr(1, 2)} = ${fr(1, 4)}`) },
    ],
    formulas: ['P = günstige : mögliche Fälle', 'zwei Stufen: Wahrscheinlichkeiten malnehmen'],
    gen(lvl) {
      const opt = { tol: 0.006, hint: 'günstige Fälle : alle Fälle (als Bruch, z. B. 1/6)' };
      if (lvl === 1) {
        const ev = pick([['eine 6', 1], ['eine gerade Zahl', 3], ['eine Zahl größer als 4', 2], ['eine 1 oder 2', 2], ['eine ungerade Zahl', 3], ['eine Zahl kleiner als 5', 4]]);
        return num(`Du würfelst einmal. Wie wahrscheinlich ist <b>${ev[0]}</b>? (als Bruch, z. B. 1/6)`, ev[1] / 6, { ...opt, steps: [`${ev[1]} günstige von 6 → <b>${ev[1]}/6</b>`] });
      }
      if (lvl === 2) {
        const r = ri(1, 9), b = ri(1, 9);
        return num(`In einer Box sind <b>${r} rote</b> und <b>${b} blaue</b> Kugeln. Wie wahrscheinlich ziehst du eine <b>rote</b>?`, r / (r + b), { ...opt, misc: [{ ans: r / b, msg: 'Fast! Unten müssen <b>alle</b> Kugeln stehen: rote + blaue.' }], steps: [`alle: ${r} + ${b} = ${r + b}`, `P = <b>${r}/${r + b}</b>`] });
      }
      if (ri(0, 1)) { const k = ri(2, 3); return num(`Eine Münze wird <b>${k}-mal</b> geworfen. Wie wahrscheinlich ist <b>jedes Mal Kopf</b>?`, Math.pow(0.5, k), { ...opt, tol: 0.003, steps: [`${Array(k).fill('½').join(' · ')} = <b>1/${2 ** k}</b>`] }); }
      return num('Du würfelst <b>zweimal</b>. Wie wahrscheinlich ist <b>zweimal eine 6</b>?', 1 / 36, { ...opt, tol: 0.002, steps: [`${fr(1, 6)} · ${fr(1, 6)} = <b>1/36</b>`] });
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
