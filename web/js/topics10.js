/* Band 3 – Klasse 10 */
(function (root) {
  'use strict';
  const MC = root.MC || require('./mathcore.js');
  const FIG = root.FIG || require('./figs.js');
  const { ri, pick, nz, fmt, par, term, terms, fmtPoly, tryParse, round, sup } = MC;
  const TOPICS = root.TOPICS;
  const topic = (o) => TOPICS.push(o);
  const { num, mc, multi, ps, fr, eq } = root.TASK;
  const tm = root.TASK.term;

  // ======================================================================
  topic({
    id: 'binom', band: 10, title: 'Binomische Formeln', sub: 'Die drei Abkürzungen', emoji: '✨',
    boss: { name: 'Binom-Baku', emoji: '🐘' }, sticker: { e: '🔥', n: 'Feuer-Formel' }, pre: ['ausmult2'],
    learn: [
      { t: 'Eine Abkürzung', mood: 'happy',
        k: '(a + b)² heißt (a + b)(a + b) – also Klammer mal Klammer! Weil das so oft vorkommt, gibt es eine <b>Abkürzung</b>.',
        ex: eq('(a + b)² = a² + 2ab + b²') + '<p>1. Binomische Formel</p>' },
      { t: 'Der beliebteste Fehler ⚠️', mood: 'think',
        k: '(x + 3)² ist <b>nicht</b> x² + 9! Der <b>Mittelteil 2 · x · 3</b> wird oft vergessen.',
        ex: eq('(x + 3)² = x² + 2·x·3 + 3² = x² + 6x + 9'),
        tia: 'Ohh, deshalb war das immer falsch!', k2: 'Jetzt weißt du den Trick: Mittelteil = 2 mal erstes mal zweites 💪' },
      { t: 'Alle drei Formeln', mood: 'cheer',
        k: '1. <b>(a + b)² = a² + 2ab + b²</b><br>2. <b>(a − b)² = a² − 2ab + b²</b><br>3. <b>(a + b)(a − b) = a² − b²</b>',
        ex: eq('(x − 5)² = x² − 10x + 25') + eq('(x + 4)(x − 4) = x² − 16'),
        quiz: { q: '(x + 2)² = ?', c: ['x² + 4x + 4', 'x² + 4', 'x² + 2x + 4', '2x + 4'], a: 0, why: 'x² + 2·x·2 + 2² = x² + 4x + 4' } },
    ],
    formulas: ['(a + b)² = a² + 2ab + b²', '(a − b)² = a² − 2ab + b²', '(a + b)(a − b) = a² − b²'],
    gen(lvl) {
      const b = ri(1, 9);
      if (lvl === 3 && ri(0, 1)) {
        const s = ri(0, 1) ? 1 : -1;
        return mc(`Welche Klammer gehört zu ${eq(terms([[1, 'x²'], [2 * b * s, 'x'], [b * b, '']]))}`, [`(x ${s > 0 ? '+' : '−'} ${b})²`, `(x ${s > 0 ? '−' : '+'} ${b})²`, `(x + ${b})(x − ${b})`, `(x ${s > 0 ? '+' : '−'} ${b * b})²`], { hint: 'Wurzel aus der letzten Zahl ist b. Das Vorzeichen der Mitte verrät + oder −.', steps: [`√${b * b} = ${b}, Mitte ${s > 0 ? '+' : '−'}${2 * b}x → <b>(x ${s > 0 ? '+' : '−'} ${b})²</b>`] });
      }
      const a = lvl === 3 ? ri(2, 4) : 1;
      const t = lvl === 1 ? 0 : ri(0, 2);
      const A = term(a, 'x');
      if (t === 0) return tm(`Rechne mit der 1. binomischen Formel: ${eq(`(${A} + ${b})²`)}`, ps([[a * a, 'x^2'], [2 * a * b, 'x'], [b * b, '']]), 'expanded', { misc: [{ ans: ps([[a * a, 'x^2'], [b * b, '']]), msg: 'Der <b>Mittelteil 2 · ' + A + ' · ' + b + '</b> fehlt! Das ist der beliebteste Fehler. 😉', gap: 'ausmult2' }], hint: '(a + b)² = a² + 2ab + b²', steps: [`a = ${A}, b = ${b}`, `${A}² + 2·${A}·${b} + ${b}² = <b>${fmtPoly(tryParse(ps([[a * a, 'x^2'], [2 * a * b, 'x'], [b * b, '']])))}</b>`] });
      if (t === 1) return tm(`Rechne mit der 2. binomischen Formel: ${eq(`(${A} − ${b})²`)}`, ps([[a * a, 'x^2'], [-2 * a * b, 'x'], [b * b, '']]), 'expanded', { misc: [{ ans: ps([[a * a, 'x^2'], [-b * b, '']]), msg: 'Der <b>Mittelteil</b> fehlt, und am Ende steht <b>+</b>, weil (−' + b + ')² positiv ist.', gap: 'ausmult2' }, { ans: ps([[a * a, 'x^2'], [b * b, '']]), msg: 'Der <b>Mittelteil − 2 · ' + A + ' · ' + b + '</b> fehlt!', gap: 'ausmult2' }], hint: '(a − b)² = a² − 2ab + b²', steps: [`${A}² − 2·${A}·${b} + ${b}² = <b>${fmtPoly(tryParse(ps([[a * a, 'x^2'], [-2 * a * b, 'x'], [b * b, '']])))}</b>`] });
      return tm(`Rechne mit der 3. binomischen Formel: ${eq(`(${A} + ${b})(${A} − ${b})`)}`, ps([[a * a, 'x^2'], [-b * b, '']]), 'expanded', { hint: '(a + b)(a − b) = a² − b²', steps: [`${A}² − ${b}² = <b>${fmtPoly(tryParse(ps([[a * a, 'x^2'], [-b * b, '']])))}</b>`] });
    },
  });

  // ======================================================================
  topic({
    id: 'lgs', band: 10, title: 'Gleichungssysteme', sub: 'Zwei Unbekannte', emoji: '🔗',
    boss: { name: 'Zwillings-Oni', emoji: '👯' }, sticker: { e: '🎌', n: 'Quest-Flagge' }, pre: ['gleich'],
    learn: [
      { t: 'Zwei Geheimnisse', mood: 'happy',
        k: 'Jetzt gibt es <b>zwei</b> geheime Boxen: x und y. Dafür bekommst du auch <b>zwei</b> Gleichungen als Hinweise. 🔍',
        ex: eq('I: y = 2x + 1') + eq('II: y = x + 4') },
      { t: 'Gleichsetzen', mood: 'think',
        k: 'Steht in beiden Gleichungen „y = …“, setzt du die rechten Seiten gleich – dann ist y weg!',
        ex: eq('2x + 1 = x + 4  | − x − 1') + eq('x = 3') + '<p>Einsetzen: y = 3 + 4 = <b>7</b></p>' },
      { t: 'Addieren', mood: 'wow',
        k: 'Steht einmal +y und einmal −y? Dann <b>addiere</b> die Gleichungen – y verschwindet!',
        ex: eq('x + y = 10') + eq('x − y = 4') + eq('2x = 14 → x = 7, y = 3'),
        quiz: { q: 'x + y = 8 und x − y = 2. Was ist x?', c: ['5', '3', '6', '10'], a: 0, why: 'Addieren: 2x = 10 → x = 5' } },
    ],
    formulas: ['Gleichsetzungsverfahren', 'Einsetzungsverfahren', 'Additionsverfahren'],
    gen(lvl) {
      const x = nz(-5, 8), y = nz(-5, 9);
      const fields = [{ label: 'x =', answer: x }, { label: 'y =', answer: y }];
      if (lvl === 1) {
        let a, c; do { a = nz(-3, 4); c = nz(-3, 4); } while (a === c);
        const b = y - a * x, d = y - c * x;
        return multi(`Löse das Gleichungssystem: ${eq('I: y = ' + terms([[a, 'x'], [b, '']]))}${eq('II: y = ' + terms([[c, 'x'], [d, '']]))}`, fields, { hint: 'Setze die rechten Seiten gleich, löse nach x, dann x einsetzen.', steps: [`${terms([[a, 'x'], [b, '']])} = ${terms([[c, 'x'], [d, '']])}`, `${term(a - c, 'x')} = ${fmt(d - b)} → x = <b>${fmt(x)}</b>`, `y = ${fmt(a)} · ${par(x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = <b>${fmt(y)}</b>`] });
      }
      if (lvl === 2) {
        return multi(`Löse das Gleichungssystem: ${eq('I: x + y = ' + fmt(x + y))}${eq('II: x − y = ' + fmt(x - y))}`, fields, { hint: 'Addiere beide Gleichungen – dann fällt y weg.', steps: [`I + II: 2x = ${fmt(2 * x)} → x = <b>${fmt(x)}</b>`, `in I: ${fmt(x)} + y = ${fmt(x + y)} → y = <b>${fmt(y)}</b>`] });
      }
      const m = ri(4, 12), p = ri(2, 8), km = ri(2, 3);
      return multi(`Im Manga-Laden kosten <b>${km} Mangas und 1 Poster ${km * m + p} €</b>. <b>1 Manga und 1 Poster</b> kosten <b>${m + p} €</b>. Was kostet ein Manga (x), was ein Poster (y)?`, [{ label: 'x =', answer: m }, { label: 'y =', answer: p }], { hint: `I: ${km}x + y = ${km * m + p} · II: x + y = ${m + p}. Ziehe II von I ab.`, steps: [`I − II: ${km - 1}x = ${(km - 1) * m} → x = <b>${m} €</b>`, `in II: ${m} + y = ${m + p} → y = <b>${p} €</b>`] });
    },
  });

  // ======================================================================
  topic({
    id: 'quadrat', band: 10, title: 'Quadratische Funktionen', sub: 'Parabeln & x²-Gleichungen', emoji: '🎢',
    boss: { name: 'Parabel-Phönix', emoji: '🐦‍🔥' }, sticker: { e: '🌊', n: 'Wellen-Kraft' }, pre: ['potenzen', 'wurzel', 'binom'],
    learn: [
      { t: 'Die Parabel', mood: 'happy',
        k: 'Die Funktion <b>y = x²</b> sieht aus wie eine Achterbahn-Mulde 🎢: die <b>Parabel</b>. Ihr tiefster Punkt heißt <b>Scheitelpunkt S</b>.',
        ex: eq('x = −2, −1, 0, 1, 2 → y = 4, 1, 0, 1, 4') },
      { t: 'Verschieben', mood: 'think',
        k: 'Bei <b>y = (x − d)² + e</b> liegt der Scheitelpunkt bei <b>S(d | e)</b>. Achtung: In der Klammer steht <b>minus</b> d!',
        ex: eq('y = (x − 3)² + 2 → S(3 | 2)') + eq('y = (x + 1)² − 4 → S(−1 | −4)'),
        tia: 'Warum ist bei +1 der Punkt bei −1?', k2: 'Weil x + 1 = x − (−1). Die Klammer ist ein kleiner Schummler 😜' },
      { t: 'x² = Zahl', mood: 'wow',
        k: 'x² = 25 hat <b>zwei</b> Lösungen: 5 und −5! Denn auch (−5)·(−5) = 25.',
        ex: eq('x² = 25 → x₁ = 5, x₂ = −5') },
      { t: 'Die p-q-Formel', mood: 'cheer',
        k: 'Für x² + px + q = 0 gibt es eine Zauberformel:',
        ex: eq('x = −p/2 ± √((p/2)² − q)') + '<p>x² − 2x − 8 = 0: p = −2, q = −8 → x = 1 ± √(1 + 8) = 1 ± 3 → <b>4 und −2</b></p>',
        quiz: { q: 'Wo ist der Scheitelpunkt von y = (x − 2)² + 5?', c: ['S(2 | 5)', 'S(−2 | 5)', 'S(5 | 2)', 'S(2 | −5)'], a: 0, why: 'y = (x − d)² + e → S(d | e) = S(2 | 5)' } },
    ],
    formulas: ['y = (x − d)² + e → S(d | e)', 'x² = a → x = ±√a', 'x² + px + q = 0 → x = −p/2 ± √((p/2)² − q)'],
    gen(lvl) {
      if (lvl === 1) {
        if (ri(0, 1)) { const x = nz(-5, 5), c = ri(-9, 9); return num(`Berechne y für <b>x = ${fmt(x)}</b>: ${eq('y = ' + terms([[1, 'x²'], [c, '']]))}`, x * x + c, { lhs: 'y', misc: [{ ans: -x * x + c, msg: 'Achtung: ' + par(x) + '² = ' + par(x) + ' · ' + par(x) + ' ist immer <b>positiv</b>!', gap: 'neg' }], hint: 'x² = x · x. Negative Zahl mit Klammer!', steps: [`${par(x)}² ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${x * x} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = <b>${x * x + c}</b>`] }); }
        const n = ri(1, 12);
        return multi(`Löse: ${eq('x² = ' + n * n)}`, [{ label: 'x₁ =', answer: n }, { label: 'x₂ =', answer: -n }], { unordered: true, hint: 'Es gibt zwei Lösungen: eine positive und eine negative!', steps: [`√${n * n} = ${n} → x₁ = <b>${n}</b>, x₂ = <b>−${n}</b>`] });
      }
      if (lvl === 2) {
        const d = nz(-6, 6), e = ri(-8, 8);
        const f = `y = (x ${d < 0 ? '+' : '−'} ${Math.abs(d)})²${e ? (e < 0 ? ' − ' : ' + ') + Math.abs(e) : ''}`;
        return multi(`Gib den Scheitelpunkt an: ${eq(f)}`, [{ label: 'S: x =', answer: d }, { label: 'S: y =', answer: e }], { hint: 'y = (x − d)² + e → S(d | e). Vorzeichen in der Klammer umdrehen!', steps: [`S(<b>${fmt(d)}</b> | <b>${fmt(e)}</b>)`] });
      }
      let x1, x2; do { x1 = nz(-7, 7); x2 = nz(-7, 7); } while (x1 === x2 || (x1 + x2) % 2 !== 0);
      const p = -(x1 + x2), q = x1 * x2;
      return multi(`Löse mit der p-q-Formel: ${eq(terms([[1, 'x²'], [p, 'x'], [q, '']]) + ' = 0')}`, [{ label: 'x₁ =', answer: x1 }, { label: 'x₂ =', answer: x2 }], { unordered: true, hint: `p = ${fmt(p)}, q = ${fmt(q)}. x = −p/2 ± √((p/2)² − q)`, steps: [`−p/2 = ${fmt(-p / 2)}`, `(p/2)² − q = ${fmt(p * p / 4)} − ${par(q)} = ${fmt(p * p / 4 - q)}`, `√${fmt(p * p / 4 - q)} = ${fmt(Math.sqrt(p * p / 4 - q))}`, `x₁ = <b>${fmt(Math.max(x1, x2))}</b>, x₂ = <b>${fmt(Math.min(x1, x2))}</b>`] });
    },
  });

  // ======================================================================
  topic({
    id: 'koerper2', band: 10, title: 'Spitze & runde Körper', sub: 'Pyramide, Kegel, Kugel', emoji: '🔺',
    boss: { name: 'Pyramiden-Pharao', emoji: '🧟' }, sticker: { e: '🪄', n: 'Zauberstab' }, pre: ['koerper'],
    learn: [
      { t: 'Spitze Körper', mood: 'happy',
        k: 'Eine Pyramide oder ein Kegel (wie eine Eiswaffel 🍦) passt genau <b>3-mal</b> in ein Prisma/Zylinder mit gleicher Grundfläche und Höhe. Darum: <b>ein Drittel</b>!',
        ex: eq('V = ⅓ · G · h') },
      { t: 'Pyramide & Kegel', mood: 'think',
        k: 'Pyramide mit quadratischer Grundfläche: G = a · a. Kegel: G = π · r².',
        ex: FIG.pyramide('a = 6 cm', 'h = 5 cm') + eq('V = ⅓ · 6 · 6 · 5 = 60 cm³') + eq('Kegel: V = ⅓ · π · r² · h') },
      { t: 'Die Kugel', mood: 'wow',
        k: 'Für die Kugel ⚽ gibt es eine eigene Formel:',
        ex: eq('V = 4/3 · π · r³') + eq('O = 4 · π · r²'),
        quiz: { q: 'Warum steht bei der Pyramide ⅓?', c: ['Sie passt 3-mal ins Prisma', 'Sie hat 3 Ecken', 'Wegen π', 'Weil h durch 3 geteilt wird'], a: 0, why: 'Eine Pyramide füllt genau ein Drittel des passenden Prismas.' } },
    ],
    formulas: ['Pyramide: V = ⅓ · G · h', 'Kegel: V = ⅓ · π · r² · h', 'Kugel: V = 4/3 · π · r³', 'Kugel: O = 4 · π · r²'],
    gen(lvl) {
      if (lvl === 1) { const a = ri(2, 10), h = ri(1, 6) * 3; return num('Berechne das Volumen der Pyramide (quadratische Grundfläche).', a * a * h / 3, { unit: 'cm³', fig: FIG.pyramide(`a = ${a} cm`, `h = ${h} cm`), misc: [{ ans: a * a * h, msg: 'Fast! Das wäre der Quader. Bei der Pyramide noch <b>durch 3</b> teilen.' }], hint: 'V = ⅓ · a · a · h', steps: [`G = ${a} · ${a} = ${a * a} cm²`, `V = ${a * a} · ${h} : 3 = <b>${a * a * h / 3} cm³</b>`] }); }
      if (lvl === 2) { const r = ri(2, 8), h = ri(3, 15); const V = Math.PI * r * r * h / 3; return num('Berechne das Volumen des Kegels (auf ganze cm³ runden).', Math.round(V), { unit: 'cm³', tol: Math.max(1, V * 0.004), fig: FIG.kegel(`r = ${r} cm`, `h = ${h} cm`), hint: 'V = ⅓ · π · r² · h', steps: [`V = 3,14 · ${r} · ${r} · ${h} : 3 ≈ <b>${Math.round(V)} cm³</b>`] }); }
      const r = ri(2, 10);
      if (ri(0, 1)) { const V = 4 / 3 * Math.PI * r ** 3; return num('Berechne das Volumen der Kugel (auf ganze cm³ runden).', Math.round(V), { unit: 'cm³', tol: Math.max(1, V * 0.004), fig: FIG.kugel(`r = ${r} cm`), hint: 'V = 4/3 · π · r³', steps: [`r³ = ${r ** 3}`, `V = 4 · 3,14 · ${r ** 3} : 3 ≈ <b>${Math.round(V)} cm³</b>`] }); }
      const O = 4 * Math.PI * r * r; return num('Berechne die Oberfläche der Kugel (auf ganze cm² runden).', Math.round(O), { unit: 'cm²', tol: Math.max(1, O * 0.004), fig: FIG.kugel(`r = ${r} cm`), hint: 'O = 4 · π · r²', steps: [`O = 4 · 3,14 · ${r * r} ≈ <b>${Math.round(O)} cm²</b>`] });
    },
  });

  // ======================================================================
  topic({
    id: 'massstab', band: 10, title: 'Maßstab & Strahlensatz', sub: 'Vergrößern & Verkleinern', emoji: '🗺️',
    boss: { name: 'Karten-Kappa', emoji: '🐢' }, sticker: { e: '🧭', n: 'Kompass' }, pre: ['dreisatz'],
    learn: [
      { t: 'Was heißt 1 : 25 000?', mood: 'happy',
        k: 'Auf der Karte ist alles verkleinert. <b>1 : 25 000</b> heißt: 1 cm auf der Karte sind <b>25 000 cm</b> in echt.',
        ex: eq('25 000 cm = 250 m') + '<p>4 cm auf der Karte → 4 · 250 m = <b>1 km</b></p>' },
      { t: 'Einheiten umrechnen', mood: 'think',
        k: 'Merke: <b>100 cm = 1 m</b> und <b>1000 m = 1 km</b>. Also 100 000 cm = 1 km.',
        ex: eq('1 : 100 000 → 1 cm = 1 km'),
        quiz: { q: 'Maßstab 1 : 100. 5 cm auf dem Plan sind in echt …', c: ['5 m', '50 cm', '500 m', '0,5 m'], a: 0, why: '5 · 100 = 500 cm = 5 m' } },
      { t: 'Strahlensatz', mood: 'wow',
        k: 'Zwei Strahlen und zwei parallele Linien: Die Längen wachsen <b>im gleichen Verhältnis</b>. Wie ein Schatten, der mit der Entfernung größer wird. 🌳',
        ex: FIG.strahlen('2 m', '4 m', '1,5 m') + eq('? : 1,5 = 6 : 2 → ? = 4,5 m') },
    ],
    formulas: ['1 : n → 1 cm = n cm', '100 cm = 1 m, 1000 m = 1 km', 'Strahlensatz: gleiche Verhältnisse'],
    gen(lvl) {
      if (lvl === 1) { const n = pick([100, 200, 500, 1000]); const k = ri(2, 12); return num(`Ein Bauplan hat den Maßstab <b>1 : ${fmt(n)}</b>. Eine Wand ist auf dem Plan <b>${k} cm</b> lang. Wie lang ist sie in echt (in m)?`, k * n / 100, { unit: 'm', hint: `${k} · ${fmt(n)} cm, dann durch 100 für Meter.`, steps: [`${k} · ${fmt(n)} = ${fmt(k * n)} cm`, `= <b>${fmt(k * n / 100)} m</b>`] }); }
      if (lvl === 2) {
        const n = pick([25000, 50000, 100000]); const k = ri(2, 12);
        if (ri(0, 1)) return num(`Eine Wanderkarte hat den Maßstab <b>1 : ${fmt(n)}</b>. Der Weg ist auf der Karte <b>${k} cm</b> lang. Wie weit ist das in echt (in km)?`, k * n / 100000, { unit: 'km', tol: 0.001, hint: `${k} · ${fmt(n)} cm. 100.000 cm = 1 km.`, steps: [`${k} · ${fmt(n)} = ${fmt(k * n)} cm`, `= <b>${fmt(k * n / 100000)} km</b>`] });
        const km = k * n / 100000;
        return num(`Maßstab <b>1 : ${fmt(n)}</b>. Zwei Orte sind in echt <b>${fmt(km)} km</b> voneinander entfernt. Wie weit sind sie auf der Karte (in cm)?`, k, { unit: 'cm', tol: 0.01, hint: 'km in cm umrechnen (· 100.000), dann durch ' + fmt(n) + '.', steps: [`${fmt(km)} km = ${fmt(km * 100000)} cm`, `${fmt(km * 100000)} : ${fmt(n)} = <b>${k} cm</b>`] });
      }
      const a = ri(1, 5), b = a * ri(2, 4), c = ri(1, 6) / 2 * 1;
      const x = c * b / a;
      return num('Strahlensatz: Die beiden senkrechten Linien sind parallel. Berechne die rote Länge „?“.', round(x, 2), { unit: 'm', tol: 0.01, fig: FIG.strahlen(fmt(a) + ' m', fmt(b) + ' m', fmt(c) + ' m'), hint: `Gesamtlänge unten: ${b} m ist ${b / a}-mal so lang wie ${a} m. Also ist auch ? ${b / a}-mal so lang wie ${fmt(c)} m.`, steps: [`${b} : ${a} = ${fmt(b / a)}`, `? = ${fmt(c)} · ${fmt(b / a)} = <b>${fmt(x)} m</b>`] });
    },
  });

  // ======================================================================
  topic({
    id: 'trigo', band: 10, title: 'Trigonometrie', sub: 'sin, cos, tan', emoji: '📐',
    boss: { name: 'Sinus-Samurai', emoji: '🥷' }, sticker: { e: '🐲', n: 'Legenden-Drache' }, pre: ['pythagoras'],
    learn: [
      { t: 'Neue Namen im Dreieck', mood: 'think',
        k: 'Von einem Winkel α aus gesehen: Die Seite <b>gegenüber</b> heißt <b>Gegenkathete (G)</b>, die Seite <b>daneben</b> heißt <b>Ankathete (A)</b>, die längste bleibt <b>Hypotenuse (H)</b>.',
        ex: FIG.right({ a: 'G', b: 'A', c: 'H' }, 'α') },
      { t: 'Der Merksatz mit den Hunden 🐶', mood: 'wow',
        k: '<b>sin = G : H</b> · <b>cos = A : H</b> · <b>tan = G : A</b><br>Merksatz: „<b>G</b>ute <b>H</b>unde · <b>A</b>uf <b>H</b>öfen · <b>G</b>ehen <b>A</b>us“ 🐶',
        ex: eq('sin(α) = G / H') + eq('cos(α) = A / H') + eq('tan(α) = G / A') },
      { t: 'Seite berechnen', mood: 'cheer',
        k: 'Mit dem Taschenrechner (auf DEG stellen!) kannst du Seiten ausrechnen:',
        ex: eq('H = 10 cm, α = 30° → G = sin(30°) · 10 = 5 cm'),
        quiz: { q: 'Welche Formel ist richtig?', c: ['tan = G : A', 'sin = A : H', 'cos = G : H', 'tan = H : A'], a: 0, why: 'tan(α) = Gegenkathete : Ankathete' } },
    ],
    formulas: ['sin(α) = G / H', 'cos(α) = A / H', 'tan(α) = G / A'],
    gen(lvl) {
      const D = Math.PI / 180;
      if (lvl === 1) {
        const w = pick([['sin(α)', 'Gegenkathete : Hypotenuse'], ['cos(α)', 'Ankathete : Hypotenuse'], ['tan(α)', 'Gegenkathete : Ankathete']]);
        const all = ['Gegenkathete : Hypotenuse', 'Ankathete : Hypotenuse', 'Gegenkathete : Ankathete', 'Hypotenuse : Ankathete'];
        return mc(`Was bedeutet <b>${w[0]}</b>?`, [w[1], ...all.filter((x) => x !== w[1])], { hint: 'Gute Hunde (sin) · Auf Höfen (cos) · Gehen Aus (tan)', steps: [`${w[0]} = <b>${w[1]}</b>`] });
      }
      if (lvl === 2) {
        const al = pick([20, 25, 30, 35, 40, 45, 50, 55, 60]), H = ri(4, 15);
        if (ri(0, 1)) { const G = Math.sin(al * D) * H; return num(`Rechtwinkliges Dreieck: <b>α = ${al}°</b>, Hypotenuse <b>${H} cm</b>. Berechne die <b>Gegenkathete</b> (1 Stelle, Taschenrechner).`, round(G, 1), { unit: 'cm', tol: 0.051, fig: FIG.right({ a: 'G = ?', b: 'A', c: H + ' cm' }, al + '°'), hint: 'sin(α) = G / H → G = sin(α) · H', steps: [`G = sin(${al}°) · ${H} ≈ <b>${fmt(G, 1)} cm</b>`] }); }
        const A = Math.cos(al * D) * H; return num(`Rechtwinkliges Dreieck: <b>α = ${al}°</b>, Hypotenuse <b>${H} cm</b>. Berechne die <b>Ankathete</b> (1 Stelle, Taschenrechner).`, round(A, 1), { unit: 'cm', tol: 0.051, fig: FIG.right({ a: 'G', b: 'A = ?', c: H + ' cm' }, al + '°'), hint: 'cos(α) = A / H → A = cos(α) · H', steps: [`A = cos(${al}°) · ${H} ≈ <b>${fmt(A, 1)} cm</b>`] });
      }
      const G = ri(2, 12), A = ri(2, 12); const al = Math.atan(G / A) / D;
      return num(`Gegenkathete <b>${G} cm</b>, Ankathete <b>${A} cm</b>. Wie groß ist der Winkel α? (auf ganze Grad runden)`, Math.round(al), { unit: '°', tol: 0.6, fig: FIG.right({ a: G + ' cm', b: A + ' cm', c: 'H' }, 'α?'), hint: 'tan(α) = G / A → α = tan⁻¹(G / A) (Taste „shift tan“)', steps: [`tan(α) = ${G} / ${A} = ${fmt(G / A, 3)}`, `α = tan⁻¹(${fmt(G / A, 3)}) ≈ <b>${Math.round(al)}°</b>`] });
    },
  });

  // ======================================================================
  topic({
    id: 'wachstum', band: 10, title: 'Wachstum & Zinseszins', sub: 'Exponentiell', emoji: '🌿',
    boss: { name: 'Wachstums-Wurm', emoji: '🐛' }, sticker: { e: '👑', n: '{g:Mathe-Prinzessin|Mathe-Prinz|Mathe-Krone}' }, pre: ['prozent', 'potenzen'],
    learn: [
      { t: 'Zinsen auf Zinsen', mood: 'happy',
        k: 'Beim <b>Zinseszins</b> bekommst du im nächsten Jahr auch Zinsen auf die alten Zinsen. Das Geld wächst wie ein Schneeball ⛄!',
        ex: '<p>100 € mit 10 %: nach 1 Jahr 110 €, nach 2 Jahren 121 € (nicht 120 €!)</p>' },
      { t: 'Der Wachstumsfaktor q', mood: 'think',
        k: '+ p % heißt: <b>mal (1 + p/100)</b>. − p % heißt: <b>mal (1 − p/100)</b>.',
        ex: eq('+ 5 % → q = 1,05') + eq('− 20 % → q = 0,8') },
      { t: 'Die Formel', mood: 'wow',
        k: 'Nach n Jahren: n-mal mit q malnehmen.',
        ex: eq('Kₙ = K · qⁿ') + eq('500 € · 1,03² = 530,45 €'),
        quiz: { q: 'Welcher Faktor gehört zu + 4 %?', c: ['1,04', '0,04', '4', '1,4'], a: 0, why: '1 + 4/100 = 1,04' } },
    ],
    formulas: ['q = 1 + p/100 (Zunahme)', 'q = 1 − p/100 (Abnahme)', 'Kₙ = K · qⁿ'],
    gen(lvl) {
      if (lvl === 1) { const p = ri(1, 30); const up = ri(0, 1); const q = up ? 1 + p / 100 : 1 - p / 100; return num(`Wie groß ist der Wachstumsfaktor <b>q</b> bei einer ${up ? '<b>Zunahme</b>' : '<b>Abnahme</b>'} um <b>${p} %</b>?`, round(q, 4), { lhs: 'q', tol: 0.0001, hint: up ? 'q = 1 + p/100' : 'q = 1 − p/100', steps: [`q = 1 ${up ? '+' : '−'} ${fmt(p / 100)} = <b>${fmt(q)}</b>`] }); }
      if (lvl === 2) { const K = pick([500, 1000, 2000, 5000]), p = ri(1, 5), n = ri(2, 5); const Kn = K * Math.pow(1 + p / 100, n); return num(`<b>${fmt(K)} €</b> werden <b>${n} Jahre</b> mit <b>${p} %</b> Zinseszins angelegt. Wie viel Geld ist es dann? (auf Cent runden)`, round(Kn, 2), { unit: '€', tol: 0.02, misc: [{ ans: round(K + K * p / 100 * n, 2), msg: 'Das wäre ohne Zinseszins. Beim Zinseszins rechnest du <b>K · qⁿ</b>.' }], hint: `Kₙ = ${fmt(K)} · ${fmt(1 + p / 100)}${sup(n)}`, steps: [`q = ${fmt(1 + p / 100)}`, `${fmt(K)} · ${fmt(1 + p / 100)}${sup(n)} ≈ <b>${fmt(Kn, 2)} €</b>`] }); }
      const K = pick([10000, 15000, 20000, 30000]), p = pick([10, 15, 20]), n = ri(2, 4); const Kn = K * Math.pow(1 - p / 100, n);
      return num(`Ein Auto kostet <b>${fmt(K)} €</b> und verliert jedes Jahr <b>${p} %</b> an Wert. Wie viel ist es nach <b>${n} Jahren</b> wert? (auf ganze € runden)`, Math.round(Kn), { unit: '€', tol: 1, hint: `q = 1 − ${p}/100 = ${fmt(1 - p / 100)}. Dann K · qⁿ.`, steps: [`${fmt(K)} · ${fmt(1 - p / 100)}${sup(n)} ≈ <b>${fmt(Math.round(Kn))} €</b>`] });
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
