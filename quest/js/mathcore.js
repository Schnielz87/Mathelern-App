/* Rechen-Kern: Zufall, Zahlen hübsch anzeigen, Terme einlesen und vergleichen.
   Wird von der App und von den Tests (Node) genutzt. */
(function (root) {
  'use strict';

  // ---------- Zufall ----------
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const nz = (a, b) => { let v; do { v = ri(a, b); } while (v === 0); return v; };
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
  const round = (x, d = 0) => { const f = Math.pow(10, d); return Math.round((x + Math.sign(x) * 1e-12) * f) / f; };

  // ---------- Anzeige ----------
  const MINUS = '−';
  /** Zahl deutsch: Komma, echtes Minus. */
  function fmt(n, dec) {
    if (typeof dec === 'number') n = round(n, dec);
    let s = String(round(n, 10));
    if (s.includes('e')) s = n.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
    s = s.replace('.', ',');
    if (s.startsWith('-')) s = MINUS + s.slice(1);
    // Tausenderpunkte ab 10 000
    const [i, f] = s.split(',');
    const neg = i.startsWith(MINUS);
    let digits = neg ? i.slice(1) : i;
    if (digits.length > 4) digits = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? MINUS : '') + digits + (f !== undefined ? ',' + f : '');
  }
  /** Zahl mit Klammer, wenn negativ: (−3) */
  const par = (n) => (n < 0 ? '(' + fmt(n) + ')' : fmt(n));
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const sup = (n) => String(n).split('').map((c) => SUP[c] || c).join('');

  /** Ein Glied: coef + Variable(n), z. B. term(3,'x') = 3x, term(-1,'x²') = −x */
  function term(c, v = '') {
    if (!v) return fmt(c);
    if (c === 1) return v;
    if (c === -1) return MINUS + v;
    return fmt(c) + v;
  }
  /** Glieder aneinanderreihen: [[3,'x'],[-2,''],[1,'y']] -> 3x − 2 + y */
  function terms(list) {
    let s = '';
    list.forEach(([c, v], i) => {
      if (c === 0 && list.length > 1) return;
      const t = term(Math.abs(c), v);
      if (s === '') s = c < 0 ? MINUS + t : t;
      else s += c < 0 ? ' ' + MINUS + ' ' + t : ' + ' + t;
    });
    return s || '0';
  }

  // ---------- Polynome ----------
  // Ein Polynom ist ein Objekt { schluessel: koeffizient }, schluessel z. B. "", "x", "x^2", "xy".
  function monoKey(vars) {
    return Object.keys(vars).filter((k) => vars[k] !== 0).sort().map((k) => (vars[k] === 1 ? k : k + '^' + vars[k])).join('');
  }
  function keyVars(key) {
    const vars = {};
    const re = /([a-z])(?:\^(\d+))?/g;
    let m;
    while ((m = re.exec(key))) vars[m[1]] = (vars[m[1]] || 0) + (m[2] ? +m[2] : 1);
    return vars;
  }
  const P = {
    c: (n) => ({ '': n }),
    v: (name) => ({ [name]: 1 }),
    clean(p) { const o = {}; for (const k in p) if (Math.abs(p[k]) > 1e-12) o[k] = p[k]; return o; },
    add(a, b) { const o = { ...a }; for (const k in b) o[k] = (o[k] || 0) + b[k]; return P.clean(o); },
    scale(a, s) { const o = {}; for (const k in a) o[k] = a[k] * s; return P.clean(o); },
    neg(a) { return P.scale(a, -1); },
    mul(a, b) {
      const o = {};
      for (const ka in a) for (const kb in b) {
        const va = keyVars(ka), vb = keyVars(kb);
        for (const k in vb) va[k] = (va[k] || 0) + vb[k];
        const key = monoKey(va);
        o[key] = (o[key] || 0) + a[ka] * b[kb];
      }
      return P.clean(o);
    },
    pow(a, n) { let r = P.c(1); for (let i = 0; i < n; i++) r = P.mul(r, a); return r; },
    isConst(a) { return Object.keys(a).every((k) => k === ''); },
    constVal(a) { return a[''] || 0; },
    equal(a, b, tol = 1e-9) {
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      for (const k of keys) { const x = a[k] || 0, y = b[k] || 0; if (Math.abs(x - y) > tol * Math.max(1, Math.abs(y))) return false; }
      return true;
    },
    degree(key) { const v = keyVars(key); return Object.values(v).reduce((s, e) => s + e, 0); },
  };

  /** Polynom hübsch: 3x² − 2x + 5 */
  function fmtPoly(p) {
    const keys = Object.keys(p).sort((a, b) => P.degree(b) - P.degree(a) || (a < b ? -1 : 1));
    if (!keys.length) return '0';
    return terms(keys.map((k) => {
      const v = monoKey(keyVars(k)).replace(/\^(\d+)/g, (_, e) => sup(e));
      return [p[k], v];
    }));
  }

  // ---------- Einlesen (Parser) ----------
  function normalize(s) {
    return String(s)
      .replace(/[−–—]/g, '-')
      .replace(/[·×*⋅•]/g, '*')
      .replace(/[:÷]/g, '/')
      .replace(/,/g, '.')
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => '^' + m.split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join(''))
      .replace(/π/g, 'p')
      .replace(/\s+/g, '')
      .toLowerCase();
  }

  function tokenize(s) {
    const t = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/[0-9.]/.test(c)) {
        let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
        const str = s.slice(i, j);
        if ((str.match(/\./g) || []).length > 1 || str === '.') throw new Error('Zahl');
        t.push({ t: 'n', v: parseFloat(str) }); i = j;
      } else if (c === 'p') { t.push({ t: 'n', v: Math.PI }); i++; }
      else if (/[a-z]/.test(c)) { t.push({ t: 'v', v: c }); i++; }
      else if ('+-*/^()'.includes(c)) { t.push({ t: c }); i++; }
      else throw new Error('Zeichen ' + c);
    }
    return t;
  }

  function parse(input) {
    const toks = tokenize(normalize(input));
    let i = 0;
    const peek = () => toks[i];
    const eat = (t) => { if (!toks[i] || toks[i].t !== t) throw new Error('erwartet ' + t); i++; };

    function expr() {
      let left = mulExpr();
      while (peek() && (peek().t === '+' || peek().t === '-')) {
        const op = toks[i++].t;
        const right = mulExpr();
        left = op === '+' ? P.add(left, right) : P.add(left, P.neg(right));
      }
      return left;
    }
    function mulExpr() {
      let left = unary();
      for (;;) {
        const p = peek();
        if (!p) break;
        if (p.t === '*') { i++; left = P.mul(left, unary()); }
        else if (p.t === '/') {
          i++;
          const d = unary();
          if (!P.isConst(d) || P.constVal(d) === 0) throw new Error('Division');
          left = P.scale(left, 1 / P.constVal(d));
        } else if (p.t === 'n' || p.t === 'v' || p.t === '(') { left = P.mul(left, power()); }
        else break;
      }
      return left;
    }
    function unary() {
      const p = peek();
      if (p && p.t === '-') { i++; return P.neg(unary()); }
      if (p && p.t === '+') { i++; return unary(); }
      return power();
    }
    function power() {
      const base = primary();
      if (peek() && peek().t === '^') {
        i++;
        let sign = 1;
        if (peek() && peek().t === '-') { i++; sign = -1; }
        const e = peek();
        if (!e || e.t !== 'n') throw new Error('Exponent');
        i++;
        const n = e.v * sign;
        if (P.isConst(base)) return P.c(Math.pow(P.constVal(base), n));
        if (!Number.isInteger(n) || n < 0 || n > 40) throw new Error('Exponent');
        return P.pow(base, n);
      }
      return base;
    }
    function primary() {
      const p = peek();
      if (!p) throw new Error('Ende');
      if (p.t === 'n') { i++; return P.c(p.v); }
      if (p.t === 'v') { i++; return P.v(p.v); }
      if (p.t === '(') { i++; const e = expr(); eat(')'); return e; }
      throw new Error('unerwartet');
    }
    const r = expr();
    if (i !== toks.length) throw new Error('Rest');
    return r;
  }

  function tryParse(s) { try { return parse(s); } catch (e) { return null; } }

  /** Anzahl Summanden auf oberster Ebene: "3x+2-x" -> 3 */
  function summands(input) {
    const s = normalize(input);
    let depth = 0, count = 1, prev = '';
    for (let k = 0; k < s.length; k++) {
      const c = s[k];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      else if ((c === '+' || c === '-') && depth === 0 && prev && !'*/^('.includes(prev)) count++;
      prev = c;
    }
    return count;
  }

  /** "x = 4" -> "4" */
  const stripLhs = (s) => String(s).replace(/^\s*[a-z]\s*[₁₂12]?\s*=\s*/i, '');

  const api = { ri, pick, nz, shuffle, gcd, round, fmt, par, sup, term, terms, P, fmtPoly, parse, tryParse, summands, normalize, stripLhs, MINUS, keyVars };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MC = api;
})(typeof window !== 'undefined' ? window : globalThis);
