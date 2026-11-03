/* Band 1 – Klasse 8. Jedes Thema: Erklärung (Manga-Panels) + Aufgaben-Generator mit 3 Stufen. */
(function (root) {
  'use strict';
  const MC = root.MC || require('./mathcore.js');
  const FIG = root.FIG || require('./figs.js');
  const { ri, pick, nz, shuffle, gcd, fmt, par, term, terms, fmtPoly, tryParse, round, MINUS } = MC;
  const TOPICS = root.TOPICS = root.TOPICS || [];
  const topic = (o) => TOPICS.push(o);

  // ---- Helfer für Aufgaben ----
  const H = root.TASK = root.TASK || {
    num: (q, answer, x = {}) => ({ kind: 'num', q, answer, ...x }),
    term: (q, answer, form, x = {}) => ({ kind: 'term', q, answer, form, ...x }),
    mc(q, choices, x = {}) {
      choices = choices.filter((c, i) => choices.indexOf(c) === i);
      const order = shuffle(choices.map((c, i) => i));
      return { kind: 'mc', q, choices: order.map((i) => choices[i]), correct: order.indexOf(0), ...x };
    },
    multi: (q, fields, x = {}) => ({ kind: 'multi', q, fields, ...x }),
    /** [[c,'x'],[c,'']] -> parsebarer Text */
    ps: (list) => list.map(([c, v]) => '(' + c + ')' + (v ? '*' + v : '')).join('+') || '0',
    fr: (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`,
    eq: (s) => `<div class="eq">${s}</div>`,
  };
  const { num, mc, multi, ps, fr, eq } = H;
  const tm = H.term;
  const B = (s) => `<b class="hl">${s}</b>`;

  // ======================================================================
  topic({
    id: 'neg', band: 8, title: 'Plus & Minus', sub: 'Rechnen mit negativen Zahlen', emoji: '🌡️',
    boss: { name: 'Minus-Monster', emoji: '👾' }, sticker: { e: '❄️', n: 'Eiskristall' }, pre: [],
    learn: [
      { t: 'Zahlen unter Null', mood: 'happy',
        k: 'Kennst du das Thermometer im Winter? 🥶 Unter 0 °C kommen die <b>Minuszahlen</b>: −1, −2, −3 … Je weiter unten, desto kälter.',
        ex: `<div class="numline">${[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((n) => `<span class="${n < 0 ? 'neg' : n > 0 ? 'pos' : 'zero'}">${fmt(n)}</span>`).join('')}</div>`,
        tia: 'Also ist −5 kleiner als −1?', k2: 'Genau! −5 ist viel kälter als −1. 🧊' },
      { t: 'Plus und Minus rechnen', mood: 'think',
        k: 'Stell dir vor, du stehst auf dem Zahlenstrahl. <b>+ heißt: nach rechts gehen</b> (wärmer). <b>− heißt: nach links gehen</b> (kälter).',
        ex: eq('3 − 7 = ?') + '<p>Start bei 3, gehe 7 Schritte nach links → <b>−4</b> 🎯</p>' + eq('−2 + 6 = 4'),
        quiz: { q: 'Was ist −3 − 4?', c: ['−7', '1', '7', '−1'], a: 0, why: 'Start bei −3 und noch 4 nach links → −7.' } },
      { t: 'Zwei Zeichen nebeneinander', mood: 'wow',
        k: 'Wenn zwei Zeichen zusammenstoßen, wird daraus eins:<br>' + B('+ (+) → +') + ' ' + B('− (−) → +') + '<br>' + B('+ (−) → −') + ' ' + B('− (+) → −'),
        ex: eq('5 − (−3) = 5 + 3 = 8') + eq('5 + (−3) = 5 − 3 = 2'),
        tia: 'Minus Minus gibt Plus?', k2: 'Ja! Wie bei „nicht nicht lustig“ = lustig 😄' },
      { t: 'Mal und Geteilt', mood: 'cheer',
        k: 'Beim Malnehmen und Teilen gilt der <b>Freundschafts-Trick</b> 🤝:<br>Gleiche Zeichen → <b>Plus</b><br>Verschiedene Zeichen → <b>Minus</b>',
        ex: eq('(−4) · (−5) = +20') + eq('(−4) · 5 = −20') + eq('(−20) : 4 = −5'),
        quiz: { q: 'Was ist (−6) · (−2)?', c: ['12', '−12', '−8', '8'], a: 0, why: 'Gleiche Zeichen (− und −) → Plus. 6·2 = 12.' } },
    ],
    formulas: ['− (−a) = + a', '+ (−a) = − a', '(−) · (−) = +', '(−) · (+) = −'],
    gen(lvl) {
      if (lvl === 1) {
        const t = ri(0, 2);
        if (t === 0) { const a = ri(-9, 9), b = ri(3, 15); const r = a - b; return num(eq(`${fmt(a)} − ${b} = ?`), r, { hint: 'Starte bei ' + fmt(a) + ' und gehe ' + b + ' Schritte nach links (kälter).', steps: [`Start bei ${fmt(a)}`, `${b} nach links → <b>${fmt(r)}</b>`] }); }
        if (t === 1) { const a = ri(-15, 5), b = ri(2, 15); const r = a + b; return num(eq(`${fmt(a)} + ${b} = ?`), r, { hint: 'Starte bei ' + fmt(a) + ' und gehe ' + b + ' Schritte nach rechts (wärmer).', steps: [`Start bei ${fmt(a)}`, `${b} nach rechts → <b>${fmt(r)}</b>`] }); }
        const a = ri(-9, 9), b = ri(2, 12); const r = a + b;
        return num(eq(`${fmt(a)} − (−${b}) = ?`), r, { hint: 'Minus und Minus nebeneinander werden zu Plus!', steps: [`${fmt(a)} − (−${b}) = ${fmt(a)} + ${b}`, `= <b>${fmt(r)}</b>`] });
      }
      if (lvl === 2) {
        const a = nz(-12, 12), b = nz(-10, 10);
        if (ri(0, 1)) {
          const r = a * b;
          return num(eq(`${par(a)} · ${par(b)} = ?`), r, { hint: 'Erst das Zeichen: gleiche Zeichen → +, verschiedene → −. Dann die Zahlen malnehmen.', steps: [`Zeichen: ${a < 0 ? '−' : '+'} und ${b < 0 ? '−' : '+'} → ${r < 0 ? '−' : '+'}`, `${Math.abs(a)} · ${Math.abs(b)} = ${Math.abs(r)}`, `Ergebnis: <b>${fmt(r)}</b>`] });
        }
        const p = a * b;
        return num(eq(`${par(p)} : ${par(b)} = ?`), a, { hint: 'Beim Teilen gilt die gleiche Zeichen-Regel wie beim Malnehmen.', steps: [`Zeichen: ${p < 0 ? '−' : '+'} und ${b < 0 ? '−' : '+'} → ${a < 0 ? '−' : '+'}`, `${Math.abs(p)} : ${Math.abs(b)} = ${Math.abs(a)}`, `Ergebnis: <b>${fmt(a)}</b>`] });
      }
      const a = nz(-8, 8), b = nz(-6, 6), c = nz(-15, 15);
      const r = a * b + c;
      return num(eq(`${par(a)} · ${par(b)} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ?`), r, { hint: 'Punkt vor Strich: zuerst malnehmen, dann plus/minus.', steps: [`${par(a)} · ${par(b)} = ${fmt(a * b)}`, `${fmt(a * b)} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = <b>${fmt(r)}</b>`] });
    },
  });

  // ======================================================================
  const FRACS = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [1, 8], [3, 8], [1, 20]];
  topic({
    id: 'brueche', band: 8, title: 'Brüche & Kommazahlen', sub: 'Teile vom Ganzen', emoji: '🍕',
    boss: { name: 'Pizza-Dämon', emoji: '😈' }, sticker: { e: '🍕', n: 'Pizza-Power' }, pre: [],
    learn: [
      { t: 'Was ist ein Bruch?', mood: 'happy',
        k: 'Ein Bruch ist wie eine Pizza 🍕: Die <b>untere Zahl</b> sagt, in wie viele Stücke sie geschnitten wird. Die <b>obere Zahl</b> sagt, wie viele Stücke du bekommst.',
        ex: `<div class="eq">${fr(3, 4)} = 3 von 4 Stücken</div><div class="pizza"><span class="on"></span><span class="on"></span><span class="on"></span><span></span></div>` },
      { t: 'Bruch → Kommazahl', mood: 'think',
        k: 'Der Bruchstrich ist ein <b>Geteilt-Zeichen</b>! Rechne einfach oben : unten.',
        ex: eq(`${fr(1, 4)} = 1 : 4 = 0,25`) + eq(`${fr(3, 5)} = 3 : 5 = 0,6`),
        tia: 'Muss ich das auswendig wissen?', k2: 'Die wichtigsten schon: ½ = 0,5 · ¼ = 0,25 · ¾ = 0,75 · ⅕ = 0,2 · ⅒ = 0,1 😉' },
      { t: 'Ein Bruchteil von etwas', mood: 'cheer',
        k: '„¾ von 20 €“ – zwei Schritte: <b>1.</b> Durch die untere Zahl teilen. <b>2.</b> Mit der oberen Zahl malnehmen.',
        ex: eq(`20 : 4 = 5`) + eq(`5 · 3 = 15 €`),
        quiz: { q: 'Wie viel ist ⅔ von 12?', c: ['8', '6', '4', '18'], a: 0, why: '12 : 3 = 4, dann 4 · 2 = 8.' } },
      { t: 'Brüche addieren', mood: 'wow',
        k: 'Gleiche untere Zahl (Nenner)? Dann einfach die <b>oberen Zahlen addieren</b>. Der Nenner bleibt!',
        ex: eq(`${fr(2, 7)} + ${fr(3, 7)} = ${fr(5, 7)}`) + '<p>Verschiedene Nenner? Erst gleich machen: ½ = 2/4, dann ½ + ¼ = 2/4 + 1/4 = ¾</p>' },
    ],
    formulas: ['Bruch = Zähler : Nenner', '½ = 0,5 · ¼ = 0,25 · ¾ = 0,75', 'a/n + b/n = (a+b)/n'],
    gen(lvl) {
      if (lvl === 1) {
        const [a, b] = pick(FRACS);
        return num(`Schreib als Kommazahl: ${eq(fr(a, b) + ' = ?')}`, a / b, { hint: 'Bruchstrich = Geteilt. Rechne ' + a + ' : ' + b + '.', steps: [`${a} : ${b} = <b>${fmt(a / b)}</b>`] });
      }
      if (lvl === 2) {
        const [a, b] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 10], [3, 10]]);
        const n = b * ri(2, 12);
        const thing = pick(['€', 'Sticker', 'Seiten', 'Minuten']);
        return num(`Wie viel sind ${fr(a, b)} von <b>${n} ${thing}</b>?`, (n / b) * a, { unit: thing, hint: `Erst ${n} : ${b}, dann mal ${a}.`, steps: [`${n} : ${b} = ${n / b}`, `${n / b} · ${a} = <b>${(n / b) * a}</b> ${thing}`] });
      }
      if (ri(0, 1)) {
        const n = pick([3, 5, 7, 8, 9, 10]); const a = ri(1, n - 2), b = ri(1, n - a - 1);
        return num(`Rechne aus (als Bruch, z. B. 3/7, oder Kommazahl): ${eq(fr(a, n) + ' + ' + fr(b, n) + ' = ?')}`, (a + b) / n, { tol: 0.006, hint: 'Gleicher Nenner → nur die oberen Zahlen addieren.', steps: [`${a} + ${b} = ${a + b}`, `Ergebnis: <b>${a + b}/${n}</b>`] });
      }
      const [b1, b2] = pick([[2, 4], [2, 8], [4, 8], [3, 6], [5, 10], [2, 6]]);
      const a1 = 1, a2 = ri(1, b2 - 1);
      const f = b2 / b1;
      return num(`Rechne aus (als Bruch oder Kommazahl): ${eq(fr(a1, b1) + ' + ' + fr(a2, b2) + ' = ?')}`, a1 / b1 + a2 / b2, { tol: 0.006, hint: `Mach die Nenner gleich: ${fr(1, b1)} = ${fr(f, b2)}.`, steps: [`${fr(1, b1)} = ${fr(f, b2)}`, `${fr(f, b2)} + ${fr(a2, b2)} = <b>${fr(f + a2, b2)}</b>`] });
    },
  });

  // ======================================================================
  const TERM_STORIES = [
    () => { const n = ri(2, 5), p = ri(2, 6); return { q: `Ein Manga kostet <b>x €</b>. Tia kauft <b>${n}</b> Mangas und ein Lesezeichen für <b>${p} €</b>. Welcher Term passt?`, c: [`${n}x + ${p}`, `${n}(x + ${p})`, `${n + p}x`, `x + ${n * p}`], why: `${n} Mangas = ${n}x, dazu ${p} € → ${n}x + ${p}` }; },
    () => { const b = ri(2, 9); return { q: `Ein Rechteck ist <b>x cm</b> lang und <b>${b} cm</b> breit. Welcher Term ist der Umfang?`, c: [`2x + ${2 * b}`, `${b}x`, `x + ${b}`, `2x + ${b}`], why: `Umfang = 2 · Länge + 2 · Breite = 2x + ${2 * b}` }; },
    () => { const p = ri(2, 9); return { q: `Tia hat <b>x</b> Sticker. Ihre Freundin hat doppelt so viele und noch <b>${p}</b> mehr. Wie viele hat die Freundin?`, c: [`2x + ${p}`, `x + ${p + 2}`, `2(x + ${p})`, `${p}x + 2`], why: `doppelt so viele = 2x, und ${p} mehr → 2x + ${p}` }; },
    () => { const p = ri(2, 9), f = ri(2, 4); return { q: `Eine Zahl <b>x</b> wird erst um <b>${p}</b> verkleinert und das Ergebnis dann ${['', '', 'verdoppelt', 'verdreifacht', 'vervierfacht'][f]}.`, c: [`${f}(x − ${p})`, `${f}x − ${p}`, `x − ${f * p}`, `${p} − ${f}x`], why: `Erst x − ${p}, dann alles mal ${f} → Klammer: ${f}(x − ${p})` }; },
  ];
  topic({
    id: 'terme', band: 8, title: 'Terme & Variablen', sub: 'Buchstaben statt Zahlen', emoji: '🔤',
    boss: { name: 'Buchstaben-Geist', emoji: '👻' }, sticker: { e: '🎎', n: 'Puppen-Duo' }, pre: ['neg'],
    learn: [
      { t: 'Was ist eine Variable?', mood: 'happy',
        k: 'Eine <b>Variable</b> (meist x) ist wie eine <b>geheime Box 📦</b>. Darin steckt eine Zahl, die wir noch nicht kennen.',
        ex: eq('3x') + '<p>heißt: <b>3 · x</b> (3 mal die Box). Das Malzeichen lässt man einfach weg.</p>' },
      { t: 'Zahlen einsetzen', mood: 'think',
        k: 'Wenn wir wissen, was in der Box ist, setzen wir die Zahl ein. Ersetze jedes x durch die Zahl – am besten <b>mit Klammer</b>!',
        ex: eq('3x + 2  für  x = 4') + eq('3 · (4) + 2 = 12 + 2 = 14'),
        quiz: { q: 'Was ergibt 2x − 1 für x = 5?', c: ['9', '11', '19', '7'], a: 0, why: '2 · 5 − 1 = 10 − 1 = 9' } },
      { t: 'Terme aus Texten', mood: 'cheer',
        k: 'Übersetze Wörter in Mathe: „doppelt“ → 2·x, „um 3 mehr“ → + 3, „die Hälfte“ → x : 2.',
        ex: '<p>„Ein Manga kostet x €. 4 Mangas und 3 € Versand“</p>' + eq('4x + 3'),
        tia: 'Wie bei einer Geheimsprache!', k2: 'Genau – du bist jetzt Übersetzerin 🕵️‍♀️' },
    ],
    formulas: ['3x = 3 · x', 'Einsetzen: x durch die Zahl ersetzen (mit Klammer)'],
    gen(lvl) {
      if (lvl === 1) {
        const a = ri(2, 9), b = ri(1, 15), x = ri(1, 10); const r = a * x + b;
        return num(`Setze <b>x = ${x}</b> ein: ${eq(`${a}x + ${b}`)}`, r, { hint: `Ersetze x durch ${x}: ${a} · ${x} + ${b}`, steps: [`${a} · ${x} + ${b}`, `= ${a * x} + ${b}`, `= <b>${r}</b>`] });
      }
      if (lvl === 2) {
        const x = nz(-6, 6);
        if (ri(0, 1)) {
          const a = nz(-7, 7), b = nz(-12, 12); const r = a * x + b;
          return num(`Setze <b>x = ${fmt(x)}</b> ein: ${eq(terms([[a, 'x'], [b, '']]))}`, r, { hint: 'Setze die Zahl mit Klammer ein und achte auf die Vorzeichen.', steps: [`${fmt(a)} · ${par(x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`, `= ${fmt(a * x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`, `= <b>${fmt(r)}</b>`] });
        }
        const c = ri(1, 9); const r = x * x + c;
        return num(`Setze <b>x = ${fmt(x)}</b> ein: ${eq(`x² + ${c}`)}`, r, { hint: `x² heißt x · x. Also ${par(x)} · ${par(x)}.`, steps: [`${par(x)} · ${par(x)} + ${c}`, `= ${x * x} + ${c}`, `= <b>${r}</b>`] });
      }
      const s = pick(TERM_STORIES)();
      return mc(s.q, s.c, { hint: 'Übersetze Stück für Stück: Was ist x? Was kommt dazu?', steps: [s.why] });
    },
  });

  // ======================================================================
  topic({
    id: 'zusammen', band: 8, title: 'Terme zusammenfassen', sub: 'Gleiches zu Gleichem', emoji: '🧺',
    boss: { name: 'Chaos-Kobold', emoji: '👺' }, sticker: { e: '🍡', n: 'Dango-Trio' }, pre: ['neg', 'terme'],
    learn: [
      { t: 'Äpfel zu Äpfeln', mood: 'happy',
        k: 'Stell dir vor: x sind 🍎 Äpfel, Zahlen sind 🍬 Bonbons. Du darfst nur <b>Gleiches zusammenzählen</b>!',
        ex: eq('3x + 2 + 4x + 5') + '<p>🍎: 3x + 4x = <b>7x</b> · 🍬: 2 + 5 = <b>7</b></p>' + eq('= 7x + 7'),
        tia: 'Und 7x + 7 kann ich nicht zu 14x machen?', k2: 'Nein! Äpfel und Bonbons bleiben getrennt 🙅‍♀️' },
      { t: 'Mit Minus', mood: 'think',
        k: 'Das Zeichen <b>vor</b> einem Glied gehört zu ihm dazu – wie ein Rucksack 🎒. Nimm es beim Sortieren immer mit!',
        ex: eq('5x − 3 − 2x + 8') + '<p>x-Glieder: 5x − 2x = 3x · Zahlen: −3 + 8 = 5</p>' + eq('= 3x + 5'),
        quiz: { q: 'Fasse zusammen: 6x − 4x + 2', c: ['2x + 2', '4x', '10x + 2', '2x − 2'], a: 0, why: '6x − 4x = 2x, die 2 bleibt.' } },
      { t: 'x² ist anders als x', mood: 'wow',
        k: 'x² (x mal x) ist eine andere Sorte als x – wie 🍉 Melonen und 🍎 Äpfel. Also auch getrennt lassen.',
        ex: eq('2x² + 3x + x² − x = 3x² + 2x') },
    ],
    formulas: ['ax + bx = (a + b)x', 'x und x² nicht mischen'],
    gen(lvl) {
      let parts;
      if (lvl === 1) { const k = ri(2, 3); parts = Array.from({ length: k }, () => [ri(1, 9), 'x']); if (ri(0, 1)) parts.push([ri(1, 9), '']); }
      else if (lvl === 2) parts = shuffle([[nz(-9, 9), 'x'], [nz(-9, 9), 'x'], [nz(-12, 12), ''], [nz(-12, 12), '']]);
      else if (ri(0, 1)) parts = shuffle([[nz(-6, 6), 'x²'], [nz(-6, 6), 'x²'], [nz(-9, 9), 'x'], [nz(-9, 9), 'x'], [nz(-9, 9), '']]);
      else parts = shuffle([[nz(-8, 8), 'x'], [nz(-8, 8), 'y'], [nz(-8, 8), 'x'], [nz(-8, 8), 'y']]);
      if (lvl === 1 && parts[0][0] < 0) parts[0][0] = -parts[0][0];
      const ans = tryParse(ps(parts.map(([c, v]) => [c, v.replace('²', '^2')])));
      if (Object.keys(ans).length === 0) return this.gen(lvl);
      const sorts = {};
      parts.forEach(([c, v]) => { (sorts[v] = sorts[v] || []).push(c); });
      const steps = Object.entries(sorts).map(([v, cs]) => `${v || 'Zahlen'}: ${terms(cs.map((c) => [c, v]))} = ${term(cs.reduce((a, b) => a + b, 0), v)}`);
      steps.push('Ergebnis: <b>' + fmtPoly(ans) + '</b>');
      return tm(`Fasse zusammen: ${eq(terms(parts))}`, ps(parts.map(([c, v]) => [c, v.replace('²', '^2')])), 'simplified', { hint: 'Sortiere: erst alle x-Glieder, dann alle Zahlen. Vorzeichen mitnehmen!', steps });
    },
  });

  // ======================================================================
  function ausmultTask(lvl) {
    // liefert {f (Text vor Klammer), fv: [c, v], inner: [[c,v],...]}
    let fc, fv = '', inner;
    if (lvl === 1) {
      fc = ri(2, 9); inner = [[ri(1, 3) === 1 ? 1 : ri(1, 5), 'x'], [ri(1, 9) * (ri(0, 2) ? 1 : -1), '']];
    } else if (lvl === 2) {
      const t = ri(0, 3);
      if (t === 0) { fc = -ri(2, 9); inner = [[ri(1, 4), 'x'], [nz(-9, 9), '']]; }
      else if (t === 1) { fc = -1; inner = [[1, 'x'], [nz(-9, 9), '']]; }
      else if (t === 2) { fc = 1; fv = 'x'; inner = [[1, 'x'], [nz(-9, 9), '']]; }
      else { fc = ri(2, 6); inner = [[nz(-5, 5), 'x'], [nz(-9, 9), '']]; }
    } else {
      const t = ri(0, 2);
      if (t === 0) { fc = nz(-5, 5); fv = 'x'; inner = [[nz(-5, 5), 'x'], [nz(-9, 9), '']]; }
      else if (t === 1) { fc = pick([-6, -5, -4, -3, -2, -1, 2, 3, 4, 5, 6]); inner = [[nz(-5, 5), 'x'], [nz(-5, 5), 'y']]; }
      else { fc = ri(2, 5); inner = [[ri(1, 3), 'x²'], [nz(-5, 5), 'x'], [nz(-9, 9), '']]; }
    }
    return { fc, fv, inner };
  }
  const facText = (fc, fv) => (fv ? term(fc, fv) : fc === -1 ? MINUS : fc === 1 ? '' : fmt(fc));
  const vmul = (a, b) => { // Variablen-Text multiplizieren: 'x'·'x' = 'x²'
    if (!a) return b; if (!b) return a;
    if (a === 'x' && b === 'x') return 'x²';
    if (a === 'x' && b === 'x²') return 'x³';
    return [a, b].sort().join('');
  };
  const forParse = (v) => v.replace('²', '^2').replace('³', '^3');

  topic({
    id: 'ausmult', band: 8, title: 'Ausmultiplizieren', sub: 'Klammern auflösen ⭐', emoji: '🎁', star: true,
    boss: { name: 'Klammer-Oni', emoji: '👹' }, sticker: { e: '🌈', n: 'Regenbogen-Pfeile' }, pre: ['neg', 'zusammen'],
    learn: [
      { t: 'Die Klammer ist eine Party-Box 🎁', mood: 'happy',
        k: 'Eine Klammer ist wie eine Party-Box. Die Zahl <b>vor</b> der Klammer ist ein Gast, der <b>JEDEM</b> in der Box die Hand schüttelt 🤝. Händeschütteln heißt bei uns: <b>malnehmen</b>.',
        ex: FIG.arrows('3', [{ t: 'x' }, { op: '+', t: '4' }]) + '<p>3 schüttelt x die Hand → <b class="c0">3x</b><br>3 schüttelt 4 die Hand → <b class="c1">12</b></p>' + eq('3(x + 4) = 3x + 12'),
        tia: 'Ich hab immer nur 3x + 4 geschrieben …', k2: 'Das passiert ganz vielen! Dann hat die 4 aber keinen Besuch bekommen. Jeder in der Box muss dran sein! 😤' },
      { t: 'Warum das stimmt (mit Geld)', mood: 'think',
        k: '3 Freundinnen kaufen <b>jede</b> einen Manga für x € und ein Getränk für 4 €. Was zahlen sie zusammen?',
        ex: '<p>Zusammengepackt: 3 · (x + 4)</p><p>Einzeln gezählt: 3 Mangas = <b>3x</b>, 3 Getränke = <b>12 €</b></p>' + eq('3 · (x + 4) = 3x + 12') + '<p>Beides ist gleich viel Geld! 💰</p>' },
      { t: 'Das Rezept in 3 Schritten', mood: 'cheer',
        k: '<ol class="recipe"><li>Pfeil von der Zahl vor der Klammer zum <b>1. Glied</b> → malnehmen.</li><li>Pfeil zum <b>2. Glied</b> → malnehmen. <b>Vorzeichen mitnehmen!</b></li><li>Ergebnisse hinschreiben – die Klammer ist weg. 🎉</li></ol>',
        ex: FIG.arrows('5', [{ t: '2x' }, { op: '−', t: '3' }]) + eq('5 · 2x = 10x') + eq('5 · (−3) = −15') + eq('5(2x − 3) = 10x − 15'),
        quiz: { q: 'Was ist 4(x + 2)?', c: ['4x + 8', '4x + 2', 'x + 8', '4x + 6'], a: 0, why: '4 · x = 4x und 4 · 2 = 8 → 4x + 8. Beide bekommen Besuch!' } },
      { t: 'Minus vor der Zahl', mood: 'think',
        k: 'Steht ein Minus vor der Zahl, nimmst du es mit! Denk an den Freundschafts-Trick 🤝:<br><b>gleiche Zeichen → +</b>, <b>verschiedene Zeichen → −</b>',
        ex: FIG.arrows('−2', [{ t: 'x' }, { op: '−', t: '4' }]) + eq('(−2) · x = −2x') + eq('(−2) · (−4) = +8') + eq('−2(x − 4) = −2x + 8'),
        quiz: { q: 'Was ist −3(x + 5)?', c: ['−3x − 15', '−3x + 15', '3x − 15', '−3x + 5'], a: 0, why: '(−3)·x = −3x und (−3)·5 = −15.' } },
      { t: 'Der Umkehr-Zauber 🔄', mood: 'wow',
        k: 'Steht <b>nur ein Minus</b> vor der Klammer, ist das ein Umkehr-Zauber: <b>Alle Vorzeichen in der Klammer drehen sich um</b>. Aus + wird −, aus − wird +.',
        ex: eq('−(x − 7) = −x + 7') + eq('10 − (x + 3) = 10 − x − 3 = 7 − x'),
        tia: 'Also ist das Minus wie −1 vor der Klammer?', k2: 'Ganz genau, du hast es durchschaut! 🦊✨' },
      { t: 'x vor der Klammer', mood: 'cheer',
        k: 'Auch ein <b>x</b> kann Gast sein. Und x mal x schreibt man <b>x²</b> (sprich: „x Quadrat“).',
        ex: FIG.arrows('x', [{ t: 'x' }, { op: '+', t: '5' }]) + eq('x · x = x²') + eq('x · 5 = 5x') + eq('x(x + 5) = x² + 5x'),
        quiz: { q: 'Was ist 2x(x − 3)?', c: ['2x² − 6x', '2x² − 3', '2x − 6x', '2x² + 6x'], a: 0, why: '2x · x = 2x² und 2x · (−3) = −6x.' } },
    ],
    formulas: ['a(b + c) = ab + ac', 'a(b − c) = ab − ac', '−(b − c) = −b + c', 'x · x = x²'],
    gen(lvl) {
      const { fc, fv, inner } = ausmultTask(lvl);
      const f = facText(fc, fv);
      const innerText = terms(inner);
      const prods = inner.map(([c, v]) => [fc * c, vmul(fv, v)]);
      const answer = ps(prods.map(([c, v]) => [c, forParse(v)]));
      const fShown = fc === -1 && !fv ? '(−1)' : fv ? term(fc, fv) : par(fc);
      const steps = inner.map(([c, v], i) => `${fShown} · ${par(c)}${v} = ${term(prods[i][0], prods[i][1])}`);
      steps.push('Ergebnis: <b>' + terms(prods) + '</b>');
      // typische Fehler
      const misc = [];
      if (!fv && fc !== -1) misc.push({ ans: ps([[fc * inner[0][0], forParse(inner[0][1])], ...inner.slice(1).map(([c, v]) => [c, forParse(v)])]), msg: 'Du hast nur das <b>erste</b> Glied malgenommen. Der Gast muss <b>JEDEM</b> in der Klammer die Hand schütteln! 🤝' });
      if (fc === -1 && !fv) misc.push({ ans: ps([[-inner[0][0], 'x'], ...inner.slice(1).map(([c, v]) => [c, forParse(v)])]), msg: 'Der Umkehr-Zauber 🔄 gilt für <b>alle</b> Glieder in der Klammer – auch für das zweite!', gap: 'neg' });
      const showF = f === MINUS ? '−' : f;
      const guided = inner.map(([c, v], i) => ({
        q: `Schritt ${i + 1}: ${fShown} · ${par(c)}${v} = ?`,
        kind: prods[i][1] ? 'term' : 'num',
        answer: prods[i][1] ? ps([[prods[i][0], forParse(prods[i][1])]]) : prods[i][0],
      }));
      return tm(`Multipliziere aus: ${eq(showF + '(' + innerText + ')')}`, answer, 'expanded', {
        hint: 'Jedes Glied in der Klammer bekommt Besuch: ' + inner.map(([c, v]) => fShown + ' · ' + par(c) + v).join(' und ') + '. Vorzeichen-Trick: gleiche → +, verschiedene → −.',
        steps, misc, guided,
        fig: fv || inner.length > 2 ? '' : FIG.arrows(showF || '1', inner.map(([c, v], i) => ({ op: i ? (c < 0 ? '−' : '+') : '', t: (i ? term(Math.abs(c), v) : term(c, v)) }))),
      });
    },
  });

  // ======================================================================
  topic({
    id: 'ausklammern', band: 8, title: 'Ausklammern', sub: 'Rückwärts-Ausmultiplizieren', emoji: '📦',
    boss: { name: 'Teiler-Tengu', emoji: '👺' }, sticker: { e: '🎀', n: 'Schleifen-Heldin' }, pre: ['ausmult'],
    learn: [
      { t: 'Alles wieder einpacken', mood: 'happy',
        k: 'Ausklammern ist <b>Ausmultiplizieren rückwärts</b>. Wir suchen, was <b>in jedem Glied</b> steckt, und stellen es vor die Klammer – wie ein gemeinsames Geschenkband 🎀.',
        ex: eq('6x + 9') + '<p>6 = 3 · 2 und 9 = 3 · 3 → in beiden steckt die <b>3</b></p>' + eq('6x + 9 = 3(2x + 3)') },
      { t: 'So gehst du vor', mood: 'think',
        k: '<ol class="recipe"><li>Größte Zahl finden, durch die <b>alle</b> Zahlen teilbar sind.</li><li>Steckt in allen Gliedern ein x? Dann x auch raus!</li><li>Jedes Glied durch den Faktor teilen → das kommt in die Klammer.</li></ol>',
        ex: eq('4x² + 6x') + '<p>Gemeinsam: 2 und x → <b>2x</b></p>' + eq('4x² : 2x = 2x  ·  6x : 2x = 3') + eq('= 2x(2x + 3)') },
      { t: 'Die Probe', mood: 'cheer',
        k: 'Zur Kontrolle einfach wieder <b>ausmultiplizieren</b>. Kommt das Gleiche raus? Dann hast du gewonnen! 🏆',
        ex: eq('3(2x + 3) = 6x + 9 ✔'),
        quiz: { q: 'Klammere aus: 5x + 10', c: ['5(x + 2)', '5(x + 10)', '10(x + 5)', 'x(5 + 10)'], a: 0, why: 'In 5x und 10 steckt die 5. 5x : 5 = x, 10 : 5 = 2.' } },
    ],
    formulas: ['ab + ac = a(b + c)', 'Probe: wieder ausmultiplizieren'],
    gen(lvl) {
      let k, inner, kv = '';
      if (lvl === 1) { k = ri(2, 9); inner = [[ri(1, 5), 'x'], [ri(1, 9), '']]; }
      else if (lvl === 2) {
        if (ri(0, 1)) { k = ri(2, 6); kv = 'x'; inner = [[ri(1, 4), 'x'], [nz(-9, 9), '']]; }
        else { k = ri(2, 8); inner = [[nz(-5, 5), 'x'], [nz(-7, 7), 'y']]; }
      } else { k = -ri(2, 8); inner = [[ri(1, 4), 'x'], [ri(1, 9), '']]; }
      if (gcd(inner[0][0], inner[1][0]) !== 1) return this.gen(lvl);
      const full = inner.map(([c, v]) => [k * c, vmul(kv, v)]);
      const answer = ps(full.map(([c, v]) => [c, forParse(v)]));
      const fac = term(k, kv) ;
      const showAns = `${fac}(${terms(inner)})`;
      const guided = [{ q: 'Schritt 1: Welche Zahl steckt in allen Gliedern (größter gemeinsamer Teiler)?', kind: 'num', answer: Math.abs(k) }];
      return tm(`Klammere so viel wie möglich aus: ${eq(terms(full))}`, answer, 'factored', {
        show: showAns,
        hint: `Durch welche Zahl kannst du ${full.map(([c]) => Math.abs(c)).join(' und ')} teilen?` + (kv ? ' Steckt auch ein x in jedem Glied?' : '') + (k < 0 ? ' Tipp: Klammere hier ein Minus mit aus.' : ''),
        steps: [`Gemeinsamer Faktor: <b>${fac}</b>`, ...full.map(([c, v], i) => `${term(c, v)} : ${fac} = ${term(inner[i][0], inner[i][1])}`), `Ergebnis: <b>${showAns}</b>`],
        guided: k < 0 ? null : guided,
      });
    },
  });

  // ======================================================================
  topic({
    id: 'gleich', band: 8, title: 'Gleichungen lösen', sub: 'Die Waage im Gleichgewicht', emoji: '⚖️',
    boss: { name: 'Waagen-Wächter', emoji: '🗿' }, sticker: { e: '⚖️', n: 'Gleichgewicht' }, pre: ['neg', 'terme'],
    learn: [
      { t: 'Die Gleichung ist eine Waage', mood: 'happy',
        k: 'Eine Gleichung ist wie eine <b>Waage ⚖️</b>. Links und rechts ist gleich schwer. Wir wollen herausfinden, wie schwer die Box <b>x</b> ist.',
        ex: eq('x + 3 = 8') + '<p>Nimm auf <b>beiden</b> Seiten 3 weg:</p>' + eq('x = 5') },
      { t: 'Die goldene Regel ✨', mood: 'wow',
        k: 'Was du auf der einen Seite machst, musst du <b>auch auf der anderen Seite</b> machen. Sonst kippt die Waage!',
        ex: '<p>Das Gegenteil hilft immer:</p><p>+ 3 weg? → <b>− 3</b> · mal 4 weg? → <b>: 4</b></p>' + eq('4x = 20   | : 4') + eq('x = 5') },
      { t: 'Zwei Schritte', mood: 'think',
        k: 'Zuerst die <b>Zahl ohne x</b> wegschaffen, danach die <b>Zahl vor dem x</b>.',
        ex: eq('3x + 5 = 20   | − 5') + eq('3x = 15   | : 3') + eq('x = 5') + '<p>Probe: 3 · 5 + 5 = 20 ✔</p>',
        quiz: { q: 'Löse: 2x − 4 = 10', c: ['x = 7', 'x = 3', 'x = 12', 'x = 14'], a: 0, why: '+4 → 2x = 14, :2 → x = 7' } },
      { t: 'x auf beiden Seiten', mood: 'cheer',
        k: 'Steht x auf beiden Seiten, sammle erst alle x auf <b>eine</b> Seite.',
        ex: eq('5x + 2 = 2x + 14   | − 2x') + eq('3x + 2 = 14   | − 2') + eq('3x = 12   | : 3') + eq('x = 4') },
    ],
    formulas: ['Auf beiden Seiten das Gleiche tun', '+ ↔ −, · ↔ :', 'Probe: x einsetzen'],
    gen(lvl) {
      const x = lvl === 1 ? ri(1, 15) : nz(-9, 12);
      if (lvl === 1) {
        const t = ri(0, 2);
        if (t === 0) { const a = ri(1, 20); return num(eq(`x + ${a} = ${x + a}`), x, { lhs: 'x', hint: `Rechne auf beiden Seiten − ${a}.`, steps: [`x + ${a} = ${x + a}   | − ${a}`, `x = <b>${x}</b>`] }); }
        if (t === 1) { const a = ri(1, 20); return num(eq(`x − ${a} = ${fmt(x - a)}`), x, { lhs: 'x', hint: `Rechne auf beiden Seiten + ${a}.`, steps: [`x − ${a} = ${fmt(x - a)}   | + ${a}`, `x = <b>${x}</b>`] }); }
        const a = ri(2, 9); return num(eq(`${a}x = ${a * x}`), x, { lhs: 'x', hint: `${a}x heißt ${a} mal x. Das Gegenteil: geteilt durch ${a}.`, steps: [`${a}x = ${a * x}   | : ${a}`, `x = <b>${x}</b>`] });
      }
      if (lvl === 2) {
        const a = nz(-6, 9) || 2, b = nz(-15, 15); const r = a * x + b;
        return num(eq(`${terms([[a, 'x'], [b, '']])} = ${fmt(r)}`), x, {
          lhs: 'x', hint: `Erst ${b < 0 ? '+ ' + Math.abs(b) : '− ' + b} auf beiden Seiten, dann : ${par(a)}.`,
          steps: [`${terms([[a, 'x'], [b, '']])} = ${fmt(r)}   | ${b < 0 ? '+ ' + Math.abs(b) : '− ' + b}`, `${term(a, 'x')} = ${fmt(r - b)}   | : ${par(a)}`, `x = <b>${fmt(x)}</b>`],
          guided: [{ q: `Schritt 1: ${b < 0 ? '+ ' + Math.abs(b) : '− ' + b} auf beiden Seiten. Was steht dann rechts? ${term(a, 'x')} = ?`, kind: 'num', answer: r - b }],
        });
      }
      let a, c; do { a = nz(-6, 9); c = nz(-6, 9); } while (a === c);
      const b = nz(-12, 12); const d = a * x + b - c * x;
      return num(eq(`${terms([[a, 'x'], [b, '']])} = ${terms([[c, 'x'], [d, '']])}`), x, {
        lhs: 'x', hint: `Bring alle x auf die linke Seite: ${c < 0 ? '+ ' + term(-c, 'x') : '− ' + term(c, 'x')}.`,
        steps: [`| ${c < 0 ? '+ ' + term(-c, 'x') : '− ' + term(c, 'x')}  →  ${terms([[a - c, 'x'], [b, '']])} = ${fmt(d)}`, `| ${b < 0 ? '+ ' + Math.abs(b) : '− ' + b}  →  ${term(a - c, 'x')} = ${fmt(d - b)}`, `| : ${par(a - c)}  →  x = <b>${fmt(x)}</b>`],
      });
    },
  });

  // ======================================================================
  topic({
    id: 'prozent', band: 8, title: 'Prozentrechnung', sub: 'Rabatte & Anteile', emoji: '🏷️',
    boss: { name: 'Rabatt-Räuber', emoji: '🦹' }, sticker: { e: '🛍️', n: 'Shopping-Queen' }, pre: ['brueche'],
    learn: [
      { t: 'Prozent = von Hundert', mood: 'happy',
        k: '<b>%</b> heißt „von Hundert“. 25 % heißt: 25 von 100. Wie 25 Gummibärchen aus einer Tüte mit 100 🐻.',
        ex: eq('50 % = die Hälfte') + eq('25 % = ein Viertel') + eq('10 % = ein Zehntel') },
      { t: 'Die drei Wörter', mood: 'think',
        k: '<b>G</b> Grundwert = das Ganze (100 %)<br><b>W</b> Prozentwert = der Teil<br><b>p %</b> Prozentsatz = wie viel Prozent',
        ex: '<p>Ein Manga kostet 20 € (G). 10 % (p) Rabatt sind 2 € (W).</p>' + eq('W = G · p : 100') },
      { t: 'Der 1-%-Trick 🪄', mood: 'cheer',
        k: 'Du kannst alles mit einem Trick lösen: <b>Erst 1 % ausrechnen</b> (durch 100 teilen), dann malnehmen.',
        ex: '<p>15 % von 60 €:</p>' + eq('1 % = 60 : 100 = 0,60 €') + eq('15 % = 0,60 · 15 = 9 €'),
        quiz: { q: 'Wie viel sind 10 % von 80 €?', c: ['8 €', '10 €', '0,8 €', '18 €'], a: 0, why: '10 % = ein Zehntel → 80 : 10 = 8 €' } },
      { t: 'Rückwärts rechnen', mood: 'wow',
        k: 'Gesucht ist der Prozentsatz? Rechne <b>Teil : Ganzes · 100</b>.<br>Gesucht ist das Ganze? Rechne <b>W : p · 100</b>.',
        ex: eq('p = 6 : 24 · 100 = 25 %') + eq('G = 12 : 20 · 100 = 60 €') },
    ],
    formulas: ['W = G · p / 100', 'p = W / G · 100', 'G = W / p · 100', 'Preis nach Rabatt = G − W'],
    gen(lvl) {
      if (lvl === 1) {
        const p = pick([10, 20, 25, 50, 5, 1, 75, 30]); const G = pick([20, 40, 60, 80, 100, 120, 200, 300, 400, 500]);
        const W = G * p / 100;
        return num(`Wie viel sind <b>${p} %</b> von <b>${G} €</b>?`, W, { unit: '€', tol: 0.005, hint: 'Rechne erst 1 %: ' + G + ' : 100. Dann mal ' + p + '.', steps: [`1 % = ${G} : 100 = ${fmt(G / 100)} €`, `${p} % = ${fmt(G / 100)} · ${p} = <b>${fmt(W)} €</b>`] });
      }
      if (lvl === 2) {
        const G = pick([20, 25, 40, 50, 80, 200]); const p = pick([10, 20, 25, 40, 50, 60, 75]); const W = G * p / 100;
        const ctx = pick([[`Tia hat ${W} von ${G} Aufgaben richtig.`, 'Wie viel Prozent sind das?'], [`In der Klasse sind ${G} Kinder, ${W} davon lesen gern Manga.`, 'Wie viel Prozent sind das?']]);
        if (!Number.isInteger(W)) return this.gen(lvl);
        return num(ctx.join(' '), p, { unit: '%', tol: 0.05, hint: 'Teil : Ganzes · 100', steps: [`${W} : ${G} = ${fmt(W / G)}`, `${fmt(W / G)} · 100 = <b>${p} %</b>`] });
      }
      if (ri(0, 1)) {
        const G = pick([40, 60, 80, 120, 150, 250]); const p = pick([10, 20, 25, 30, 50]);
        const W = G * p / 100;
        return num(`Eine Jacke kostet <b>${G} €</b>. Im Sale gibt es <b>${p} % Rabatt</b>. Wie viel kostet sie jetzt?`, G - W, { unit: '€', tol: 0.005, misc: [{ ans: W, msg: 'Das ist nur der <b>Rabatt</b>. Zieh ihn noch vom alten Preis ab!' }], hint: 'Erst den Rabatt ausrechnen, dann vom Preis abziehen.', steps: [`Rabatt: ${G} · ${p} / 100 = ${fmt(W)} €`, `Neuer Preis: ${G} − ${fmt(W)} = <b>${fmt(G - W)} €</b>`] });
      }
      const p = pick([10, 20, 25, 50]); const G = pick([40, 60, 80, 100, 120, 200]); const W = G * p / 100;
      return num(`<b>${p} %</b> sind <b>${fmt(W)} €</b>. Wie viel sind 100 %?`, G, { unit: '€', tol: 0.005, hint: `Rechne ${fmt(W)} : ${p} (das ist 1 %), dann mal 100.`, steps: [`1 % = ${fmt(W)} : ${p} = ${fmt(W / p)} €`, `100 % = ${fmt(W / p)} · 100 = <b>${fmt(G)} €</b>`] });
    },
  });

  // ======================================================================
  topic({
    id: 'zins', band: 8, title: 'Zinsrechnung', sub: 'Geld auf der Bank', emoji: '🏦',
    boss: { name: 'Gierschlund', emoji: '🐲' }, sticker: { e: '💰', n: 'Goldschatz' }, pre: ['prozent'],
    learn: [
      { t: 'Was sind Zinsen?', mood: 'happy',
        k: 'Wenn du Geld auf die Bank bringst, „leihst“ du es der Bank. Dafür bekommst du ein kleines Dankeschön: die <b>Zinsen</b> 💶.',
        ex: '<p>Kapital <b>K</b> = dein Geld · Zinssatz <b>p %</b> · Zinsen <b>Z</b></p>' + eq('Z = K · p / 100') },
      { t: 'Wie Prozentrechnung!', mood: 'cheer',
        k: 'Zinsrechnung ist Prozentrechnung mit anderen Namen: K = Grundwert, Z = Prozentwert.',
        ex: '<p>500 € zu 2 % für ein Jahr:</p>' + eq('Z = 500 · 2 / 100 = 10 €'),
        quiz: { q: '1000 € zu 3 %. Zinsen für ein Jahr?', c: ['30 €', '300 €', '3 €', '13 €'], a: 0, why: '1000 · 3 / 100 = 30 €' } },
      { t: 'Nur ein paar Monate', mood: 'think',
        k: 'Liegt das Geld nur ein paar Monate auf der Bank, gibt es nur einen Teil der Jahreszinsen: <b>mal Monate : 12</b>.',
        ex: eq('Z = K · p / 100 · m / 12') + '<p>600 € zu 2 % für 6 Monate: 12 € · 6 / 12 = <b>6 €</b></p>' },
    ],
    formulas: ['Z = K · p / 100', 'K = Z · 100 / p', 'p = Z · 100 / K', 'Monate: Z · m / 12'],
    gen(lvl) {
      if (lvl === 1) {
        const K = pick([200, 400, 500, 800, 1000, 1200, 2000, 2500]); const p = pick([1, 2, 3, 4, 5]); const Z = K * p / 100;
        return num(`Tia legt <b>${fmt(K)} €</b> zu <b>${p} %</b> Zinsen an. Wie viele Zinsen bekommt sie nach einem Jahr?`, Z, { unit: '€', tol: 0.005, hint: 'Z = K · p / 100', steps: [`Z = ${fmt(K)} · ${p} / 100 = <b>${fmt(Z)} €</b>`] });
      }
      if (lvl === 2) {
        const K = pick([500, 1000, 2000, 4000]); const p = pick([1, 2, 3, 4, 5, 6]); const Z = K * p / 100;
        if (ri(0, 1)) return num(`Für <b>${fmt(K)} €</b> gibt es in einem Jahr <b>${fmt(Z)} €</b> Zinsen. Wie hoch ist der Zinssatz?`, p, { unit: '%', tol: 0.01, hint: 'p = Z · 100 / K', steps: [`p = ${fmt(Z)} · 100 / ${fmt(K)} = <b>${p} %</b>`] });
        return num(`Bei <b>${p} %</b> Zinsen bekommt jemand <b>${fmt(Z)} €</b> im Jahr. Wie viel Geld liegt auf der Bank?`, K, { unit: '€', tol: 0.01, hint: 'K = Z · 100 / p', steps: [`K = ${fmt(Z)} · 100 / ${p} = <b>${fmt(K)} €</b>`] });
      }
      const K = pick([600, 1200, 2400, 3600]); const p = pick([1, 2, 3, 4, 5]); const m = pick([3, 4, 6, 9]); const Z = K * p / 100 * m / 12;
      return num(`<b>${fmt(K)} €</b> liegen <b>${m} Monate</b> zu <b>${p} %</b> auf der Bank. Wie viele Zinsen gibt es?`, Z, { unit: '€', tol: 0.006, hint: 'Erst Jahreszinsen, dann · Monate : 12.', steps: [`Jahreszinsen: ${fmt(K)} · ${p} / 100 = ${fmt(K * p / 100)} €`, `für ${m} Monate: ${fmt(K * p / 100)} · ${m} / 12 = <b>${fmt(Z)} €</b>`] });
    },
  });

  // ======================================================================
  topic({
    id: 'dreisatz', band: 8, title: 'Dreisatz', sub: 'Zuordnungen', emoji: '🔁',
    boss: { name: 'Dreikopf-Drache', emoji: '🐉' }, sticker: { e: '🍙', n: 'Onigiri-Power' }, pre: ['brueche'],
    learn: [
      { t: 'Je mehr, desto mehr', mood: 'happy',
        k: '<b>Proportional</b>: Doppelt so viele Mangas kosten doppelt so viel. 📚📚 → 💶💶',
        ex: '<p>3 Mangas kosten 21 €. Was kosten 5?</p>' + eq('3 → 21 €  | : 3') + eq('1 → 7 €  | · 5') + eq('5 → 35 €') },
      { t: 'Je mehr, desto weniger', mood: 'think',
        k: '<b>Antiproportional</b>: Mehr Helferinnen → weniger Zeit. Dann rechnest du <b>umgekehrt</b>!',
        ex: '<p>4 Freundinnen brauchen 6 Stunden zum Aufräumen. Wie lange brauchen 2?</p>' + eq('4 → 6 h  | : 4 bei Personen, · 4 bei Zeit') + eq('1 → 24 h') + eq('2 → 12 h'),
        tia: 'Eine allein braucht also viel länger?', k2: 'Genau – darum wird die Zeit bei weniger Leuten mehr 😅' },
      { t: 'Das Rezept', mood: 'cheer',
        k: '<ol class="recipe"><li>Was ich weiß hinschreiben.</li><li>Auf <b>1</b> runterrechnen.</li><li>Auf das Gesuchte hochrechnen.</li></ol>',
        quiz: { q: '2 kg Äpfel kosten 6 €. Was kosten 5 kg?', c: ['15 €', '12 €', '30 €', '11 €'], a: 0, why: '1 kg = 3 €, 5 kg = 15 €' } },
    ],
    formulas: ['proportional: beide Seiten gleich (:, ·)', 'antiproportional: umgekehrt (: ↔ ·)'],
    gen(lvl) {
      const anti = lvl === 3 ? true : lvl === 2 ? ri(0, 1) === 1 : false;
      if (!anti) {
        const [thing, unit, pmin, pmax] = pick([['Mangas', '€', 4, 12], ['Kugeln Eis', '€', 1, 2], ['Kinokarten', '€', 6, 11], ['Hefte', '€', 1, 3]]);
        const one = ri(pmin, pmax); const a = ri(2, 6); let b; do { b = ri(2, 9); } while (b === a);
        return num(`<b>${a} ${thing}</b> kosten <b>${a * one} ${unit}</b>. Wie viel kosten <b>${b} ${thing}</b>?`, b * one, { unit, hint: 'Rechne erst aus, was 1 Stück kostet.', steps: [`1 Stück: ${a * one} : ${a} = ${one} ${unit}`, `${b} Stück: ${one} · ${b} = <b>${b * one} ${unit}</b>`] });
      }
      const total = pick([12, 24, 36, 48, 60]);
      const divs = [1, 2, 3, 4, 6, 12].filter((d) => total % d === 0 && d > 1);
      const a = pick(divs); let b; do { b = pick(divs); } while (b === a);
      const [who, what, unit] = pick([['Freundinnen', 'zum Aufräumen', 'Stunden'], ['Maler', 'für eine Wand', 'Stunden'], ['Pumpen', 'für ein Becken', 'Stunden']]);
      return num(`<b>${a} ${who}</b> brauchen ${what} <b>${total / a} ${unit}</b>. Wie lange brauchen <b>${b} ${who}</b>?`, total / b, { unit, misc: [{ ans: (total / a) / a * b, msg: 'Achtung: Mehr Leute brauchen <b>weniger</b> Zeit! Das ist antiproportional – rechne umgekehrt.' }], hint: 'Mehr Leute → weniger Zeit. Rechne erst aus, wie lange 1 allein braucht.', steps: [`1 allein: ${total / a} · ${a} = ${total} ${unit}`, `${b}: ${total} : ${b} = <b>${total / b} ${unit}</b>`] });
    },
  });

  // ======================================================================
  topic({
    id: 'flaechen', band: 8, title: 'Flächen', sub: 'Rechteck, Dreieck, Trapez', emoji: '📐',
    boss: { name: 'Formen-Golem', emoji: '🤖' }, sticker: { e: '🏯', n: 'Mathe-Tempel' }, pre: [],
    learn: [
      { t: 'Rechteck', mood: 'happy',
        k: 'Die Fläche sagt, wie viele 1-cm-Kästchen hineinpassen. Beim Rechteck: <b>Länge mal Breite</b>.',
        ex: FIG.rect('a = 6 cm', 'b = 3 cm') + eq('A = a · b = 6 · 3 = 18 cm²') },
      { t: 'Dreieck', mood: 'think',
        k: 'Ein Dreieck ist ein <b>halbes Rechteck</b>! Darum: Grundseite mal Höhe, <b>geteilt durch 2</b>.',
        ex: FIG.tri('8 cm', '5 cm') + eq('A = g · h : 2 = 8 · 5 : 2 = 20 cm²'),
        tia: 'Was ist die Höhe?', k2: 'Die gestrichelte Linie – sie steht immer senkrecht (im rechten Winkel) auf der Grundseite 📏' },
      { t: 'Parallelogramm & Trapez', mood: 'cheer',
        k: 'Parallelogramm: <b>A = a · h</b> (wie ein schiefes Rechteck).<br>Trapez: <b>A = (a + c) : 2 · h</b> (Mittelwert der beiden parallelen Seiten mal Höhe).',
        ex: FIG.trapez('10 cm', '6 cm', '4 cm') + eq('A = (10 + 6) : 2 · 4 = 32 cm²'),
        quiz: { q: 'Dreieck mit g = 10 cm und h = 4 cm. Fläche?', c: ['20 cm²', '40 cm²', '14 cm²', '80 cm²'], a: 0, why: '10 · 4 : 2 = 20 cm²' } },
    ],
    formulas: ['Rechteck: A = a · b, U = 2a + 2b', 'Dreieck: A = g · h : 2', 'Parallelogramm: A = a · h', 'Trapez: A = (a + c) : 2 · h'],
    gen(lvl) {
      const t = lvl === 1 ? ri(0, 1) : lvl === 2 ? ri(1, 2) : ri(2, 3);
      if (t === 0) {
        const a = ri(3, 15), b = ri(2, 12);
        if (ri(0, 1)) return num('Berechne den <b>Umfang</b> des Rechtecks.', 2 * a + 2 * b, { unit: 'cm', fig: FIG.rect(`a = ${a} cm`, `b = ${b} cm`), hint: 'Umfang = einmal außen herum: a + b + a + b', steps: [`U = 2 · ${a} + 2 · ${b} = <b>${2 * a + 2 * b} cm</b>`] });
        return num('Berechne die <b>Fläche</b> des Rechtecks.', a * b, { unit: 'cm²', fig: FIG.rect(`a = ${a} cm`, `b = ${b} cm`), misc: [{ ans: 2 * a + 2 * b, msg: 'Das ist der <b>Umfang</b> (außen herum). Für die Fläche rechnest du a · b.' }], hint: 'A = a · b', steps: [`A = ${a} · ${b} = <b>${a * b} cm²</b>`] });
      }
      if (t === 1) {
        const g = ri(2, 12) * 2, h = ri(2, 12);
        return num('Berechne die Fläche des Dreiecks.', g * h / 2, { unit: 'cm²', fig: FIG.tri(g + ' cm', h + ' cm'), misc: [{ ans: g * h, msg: 'Fast! Ein Dreieck ist ein <b>halbes</b> Rechteck – teile noch durch 2.' }], hint: 'A = g · h : 2', steps: [`A = ${g} · ${h} : 2 = <b>${g * h / 2} cm²</b>`] });
      }
      if (t === 2) {
        const a = ri(4, 15), h = ri(2, 10);
        return num('Berechne die Fläche des Parallelogramms.', a * h, { unit: 'cm²', fig: FIG.para(a + ' cm', h + ' cm'), hint: 'A = a · h (Höhe, nicht die schräge Seite!)', steps: [`A = ${a} · ${h} = <b>${a * h} cm²</b>`] });
      }
      let a = ri(6, 16), c = ri(2, a - 2); if ((a + c) % 2) c++;
      const h = ri(2, 10);
      return num('Berechne die Fläche des Trapezes.', (a + c) / 2 * h, { unit: 'cm²', fig: FIG.trapez(a + ' cm', c + ' cm', h + ' cm'), hint: 'A = (a + c) : 2 · h', steps: [`(${a} + ${c}) : 2 = ${(a + c) / 2}`, `${(a + c) / 2} · ${h} = <b>${(a + c) / 2 * h} cm²</b>`] });
    },
  });

  // ======================================================================
  topic({
    id: 'kreis', band: 8, title: 'Der Kreis', sub: 'Umfang & Fläche mit π', emoji: '⭕',
    boss: { name: 'Pi-Phantom', emoji: '🌀' }, sticker: { e: '🌙', n: 'Mondkatze' }, pre: ['flaechen'],
    learn: [
      { t: 'Die Zauberzahl π', mood: 'wow',
        k: 'Bei jedem Kreis passt der Durchmesser ungefähr <b>3,14-mal</b> um den Rand. Diese Zahl heißt <b>π</b> („Pi“). 🥧',
        ex: '<p>r = Radius (Mitte bis Rand) · d = Durchmesser = 2 · r</p>' + FIG.circle('r') },
      { t: 'Umfang', mood: 'happy',
        k: 'Der Umfang ist der Weg einmal um den Kreis herum.',
        ex: eq('U = 2 · π · r') + eq('r = 5 cm → U = 2 · 3,14 · 5 = 31,4 cm') },
      { t: 'Fläche', mood: 'cheer',
        k: 'Für die Fläche nimmst du den Radius <b>zweimal</b> (r²).',
        ex: eq('A = π · r · r = π · r²') + eq('r = 3 cm → A = 3,14 · 9 ≈ 28,3 cm²'),
        quiz: { q: 'Der Durchmesser ist 10 cm. Wie groß ist der Radius?', c: ['5 cm', '10 cm', '20 cm', '3,14 cm'], a: 0, why: 'Radius = halber Durchmesser.' } },
    ],
    formulas: ['d = 2 · r', 'U = 2 · π · r = π · d', 'A = π · r²', 'π ≈ 3,14'],
    gen(lvl) {
      const r = ri(2, 12);
      const tolOf = (v) => Math.max(0.06, v * 0.004);
      if (lvl === 1) { const U = 2 * Math.PI * r; return num(`Ein Kreis hat den Radius <b>r = ${r} cm</b>. Berechne den <b>Umfang</b> (π ≈ 3,14, auf 1 Stelle runden).`, round(U, 1), { unit: 'cm', tol: tolOf(U), fig: FIG.circle('r = ' + r + ' cm'), hint: 'U = 2 · π · r', steps: [`U = 2 · 3,14 · ${r} ≈ <b>${fmt(U, 1)} cm</b>`] }); }
      if (lvl === 2) { const A = Math.PI * r * r; return num(`Ein Kreis hat den Radius <b>r = ${r} cm</b>. Berechne die <b>Fläche</b> (π ≈ 3,14, auf 1 Stelle runden).`, round(A, 1), { unit: 'cm²', tol: tolOf(A), fig: FIG.circle('r = ' + r + ' cm'), misc: [{ ans: round(2 * Math.PI * r, 1), msg: 'Das ist der <b>Umfang</b>. Für die Fläche: π · r · r.' }], hint: 'A = π · r · r', steps: [`A = 3,14 · ${r} · ${r} ≈ <b>${fmt(A, 1)} cm²</b>`] }); }
      const d = r * 2; const A = Math.PI * r * r;
      return num(`Eine runde Pizza hat <b>${d} cm</b> Durchmesser. Wie groß ist ihre Fläche? (auf 1 Stelle runden)`, round(A, 1), { unit: 'cm²', tol: tolOf(A), misc: [{ ans: round(Math.PI * d * d, 1), msg: 'Achtung: In die Formel kommt der <b>Radius</b> – das ist der halbe Durchmesser!' }], hint: `Erst den Radius: ${d} : 2 = ${r} cm. Dann A = π · r².`, steps: [`r = ${d} : 2 = ${r} cm`, `A = 3,14 · ${r} · ${r} ≈ <b>${fmt(A, 1)} cm²</b>`] });
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
