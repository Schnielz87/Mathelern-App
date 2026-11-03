/* Antworten prüfen und typische Fehler erkennen. */
(function (root) {
  'use strict';
  const MC = root.MC || require('./mathcore.js');
  const { P, tryParse, summands, normalize, stripLhs, gcd } = MC;

  const SIGN_MSG = 'Fast! Die Zahlen stimmen, aber ein <b>Vorzeichen</b> (+ oder −) ist falsch. Denk an: Minus mal Minus = Plus, Minus mal Plus = Minus.';

  function numOk(val, want, tol) {
    return Math.abs(val - want) <= (tol == null ? 1e-6 : tol) + 1e-9;
  }

  function checkMisc(task, val, isPoly) {
    for (const m of task.misc || []) {
      if (isPoly) {
        const mp = tryParse(m.ans);
        if (mp && P.equal(val, mp)) return { ok: false, msg: m.msg, gap: m.gap };
      } else if (typeof m.ans === 'number' && numOk(val, m.ans, task.tol)) {
        return { ok: false, msg: m.msg, gap: m.gap };
      }
    }
    return null;
  }

  function onlySignDiffers(a, b) {
    const ka = Object.keys(a).sort().join('|'), kb = Object.keys(b).sort().join('|');
    if (ka !== kb) return false;
    let diff = false;
    for (const k in a) {
      if (Math.abs(Math.abs(a[k]) - Math.abs(b[k])) > 1e-9) return false;
      if (Math.abs(a[k] - b[k]) > 1e-9) diff = true;
    }
    return diff;
  }

  function checkNum(task, input) {
    const s = stripLhs(input).trim();
    if (!s) return { ok: false, empty: true, msg: 'Gib zuerst eine Antwort ein.' };
    const p = tryParse(s);
    if (!p || !P.isConst(p)) return { ok: false, invalid: true, msg: 'Das kann ich nicht lesen. Bitte nur eine Zahl eingeben (Komma ist erlaubt).' };
    const v = P.constVal(p);
    if (numOk(v, task.answer, task.tol)) return { ok: true };
    const misc = checkMisc(task, v, false);
    if (misc) return misc;
    if (task.answer !== 0 && numOk(-v, task.answer, task.tol)) return { ok: false, msg: SIGN_MSG, gap: task.signGap || 'neg' };
    return { ok: false };
  }

  function checkTerm(task, input) {
    const s = String(input).trim();
    if (!s) return { ok: false, empty: true, msg: 'Gib zuerst eine Antwort ein.' };
    const p = tryParse(stripLhs(s));
    if (!p) return { ok: false, invalid: true, msg: 'Das kann ich nicht lesen. Prüfe Klammern und Zeichen.' };
    const want = tryParse(task.answer);
    const n = normalize(s);
    if (P.equal(p, want)) {
      const form = task.form;
      if ((form === 'expanded' || form === 'simplified') && n.includes('(')) {
        return { ok: false, close: true, msg: 'Richtig gerechnet, aber da ist noch eine <b>Klammer</b>. Löse sie ganz auf!' };
      }
      if ((form === 'expanded' || form === 'simplified') && summands(s) > Object.keys(want).length) {
        return { ok: false, close: true, msg: 'Fast fertig! Du kannst noch <b>gleichartige Glieder zusammenfassen</b> (x zu x, Zahlen zu Zahlen).', gap: 'zusammen' };
      }
      if (form === 'mono' && (summands(s) > 1 || n.includes('(') || n.includes('*') || /([a-z]).*\1/.test(n.replace(/\^\d+/g, '')))) {
        return { ok: false, close: true, msg: 'Stimmt vom Wert her – schreib es aber kürzer als <b>eine</b> Potenz, z. B. x⁷.' };
      }
      if (form === 'factored') {
        const a = n.indexOf('('), b = n.lastIndexOf(')');
        if (a < 0 || b < n.length - 1) return { ok: false, close: true, msg: 'Der Wert stimmt, aber du sollst <b>ausklammern</b>: Faktor vor die Klammer, z. B. 3(x + 2).' };
        const inner = tryParse(n.slice(a + 1, b));
        if (inner) {
          const coefs = Object.values(inner).map((c) => Math.round(c));
          const g = coefs.reduce((x, y) => gcd(x, y), 0);
          if (g > 1) return { ok: false, close: true, msg: 'Gut! Aber da geht noch mehr: In der Klammer haben alle Zahlen noch den Teiler <b>' + g + '</b>.' };
          const keys = Object.keys(inner);
          const vars = 'abcxyz'.split('').filter((v) => keys.every((k) => k.includes(v)));
          if (vars.length) return { ok: false, close: true, msg: 'Gut! Aber in der Klammer steckt in jedem Glied noch ein <b>' + vars[0] + '</b>. Das kannst du auch noch ausklammern.' };
        }
      }
      return { ok: true };
    }
    const misc = checkMisc(task, p, true);
    if (misc) return misc;
    if (onlySignDiffers(p, want)) return { ok: false, msg: SIGN_MSG, gap: 'neg' };
    return { ok: false };
  }

  function checkMulti(task, inputs) {
    const fields = task.fields;
    const vals = inputs.map((x) => { const p = tryParse(stripLhs(x)); return p && P.isConst(p) ? P.constVal(p) : null; });
    if (vals.some((v) => v === null)) return { ok: false, invalid: true, msg: 'Bitte in jedes Feld eine Zahl eintragen.' };
    let ok;
    if (task.unordered) {
      const want = fields.map((f) => f.answer).sort((a, b) => a - b);
      const got = vals.slice().sort((a, b) => a - b);
      ok = want.every((w, i) => numOk(got[i], w, task.tol));
    } else {
      ok = fields.every((f, i) => numOk(vals[i], f.answer, task.tol));
    }
    if (ok) return { ok: true };
    const some = fields.filter((f, i) => numOk(vals[i], f.answer, task.tol)).length;
    if (some > 0) return { ok: false, close: true, msg: 'Ein Teil stimmt schon! Schau dir den anderen Wert nochmal an.' };
    return { ok: false };
  }

  /** Ergebnis: { ok, msg?, gap?, close? } */
  function check(task, input) {
    if (task.kind === 'mc') return { ok: input === task.correct };
    if (task.kind === 'multi') return checkMulti(task, input);
    if (task.kind === 'term') return checkTerm(task, input);
    return checkNum(task, input);
  }

  /** Musterlösung als Text für Tests und "Lösung zeigen". */
  function answerText(task) {
    if (task.kind === 'mc') return task.choices[task.correct];
    if (task.kind === 'multi') return task.fields.map((f) => f.label + ' ' + MC.fmt(f.answer)).join('; ');
    if (task.kind === 'term') return task.show || MC.fmtPoly(tryParse(task.answer));
    return (task.lhs ? task.lhs + ' = ' : '') + MC.fmt(task.answer) + (task.unit ? ' ' + task.unit : '');
  }

  const api = { check, answerText };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CHECK = api;
})(typeof window !== 'undefined' ? window : globalThis);
