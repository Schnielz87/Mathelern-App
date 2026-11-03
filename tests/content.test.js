/* Prüft alle Themen: Jede erzeugte Aufgabe muss mit der eigenen Musterlösung als richtig erkannt werden.
   Start: node tests/content.test.js */
'use strict';
const path = require('path');
const W = path.join(__dirname, '..', 'web', 'js');
const MC = require(path.join(W, 'mathcore.js'));
require(path.join(W, 'figs.js'));
require(path.join(W, 'topics8.js'));
require(path.join(W, 'topics9.js'));
require(path.join(W, 'topics10.js'));
const CHECK = require(path.join(W, 'check.js'));
const TOPICS = globalThis.TOPICS;

let fails = 0, total = 0;
const fail = (msg) => { fails++; if (fails < 400) console.log('FEHLER', msg); };
const asInput = (n) => String(MC.round(n, 10)).replace('.', ',');

// Parser-Grundtests
const eqT = (a, b) => MC.P.equal(MC.parse(a), MC.parse(b));
[['3(x+4)', '3x+12'], ['-(x-7)', '-x+7'], ['(x+2)(x+3)', 'x²+5x+6'], ['2x·3x', '6x^2'], ['−2x−6', '-2(x+3)'], ['x³·x⁴', 'x^7'], ['1/2+1/4', '0,75'], ['(x−5)²', 'x^2-10x+25']]
  .forEach(([a, b]) => { total++; if (!eqT(a, b)) fail(`Parser ${a} != ${b}`); });
[['3x+6', { kind: 'term', answer: '3*x+6', form: 'expanded' }, true], ['3x+4', { kind: 'term', answer: '3*x+12', form: 'expanded' }, false],
 ['3(x+2)', { kind: 'term', answer: '3*x+6', form: 'factored' }, true], ['3x+6', { kind: 'term', answer: '3*x+6', form: 'factored' }, false],
 ['x=4', { kind: 'num', answer: 4 }, true], ['4,0', { kind: 'num', answer: 4 }, true], ['−4', { kind: 'num', answer: 4 }, false]]
  .forEach(([inp, task, want]) => { total++; if (CHECK.check(task, inp).ok !== want) fail(`check ${inp} -> ${want}`); });

const ids = new Set();
for (const t of TOPICS) {
  if (ids.has(t.id)) fail('doppelte id ' + t.id); ids.add(t.id);
  (t.pre || []).forEach((p) => { if (!TOPICS.find((x) => x.id === p)) fail(`${t.id}: Voraussetzung ${p} fehlt`); });
  if (!t.learn || t.learn.length < 2) fail(t.id + ': zu wenig Erklärung');
  for (const s of t.learn) if (s.quiz && !(s.quiz.a >= 0 && s.quiz.c[s.quiz.a])) fail(t.id + ': Quiz kaputt');
  for (let lvl = 1; lvl <= 3; lvl++) {
    for (let i = 0; i < 400; i++) {
      total++;
      let task;
      try { task = t.gen(lvl); } catch (e) { fail(`${t.id} L${lvl}: gen wirft ${e.stack}`); break; }
      const txt = JSON.stringify(task);
      if (/undefined|NaN|Infinity|\[object/.test(txt)) { fail(`${t.id} L${lvl}: kaputter Text ${txt.slice(0, 300)}`); continue; }
      let input;
      if (task.kind === 'mc') input = task.correct;
      else if (task.kind === 'multi') input = task.fields.map((f) => asInput(f.answer));
      else if (task.kind === 'term') input = CHECK.answerText(task);
      else input = asInput(task.answer);
      const r = CHECK.check(task, input);
      if (!r.ok) fail(`${t.id} L${lvl}: Musterlösung abgelehnt: ${input} (${r.msg || ''}) q=${task.q.replace(/<[^>]+>/g, '')}`);
      if (task.kind === 'term' && task.form === 'expanded') {
        const shown = CHECK.answerText(task);
        if (!CHECK.check(task, shown).ok) fail(`${t.id} L${lvl}: angezeigte Lösung ${shown} wird abgelehnt`);
      }
      if (task.kind === 'mc' && (task.choices.length < 2 || task.correct < 0)) fail(`${t.id}: MC kaputt`);
      for (const g of task.guided || []) {
        const gi = g.kind === 'term' ? g.answer : asInput(g.answer);
        if (!CHECK.check(g, gi).ok) fail(`${t.id} L${lvl}: Zwischenschritt ${g.q} lehnt ${gi} ab`);
      }
    }
  }
}
console.log(`${TOPICS.length} Themen, ${total} Prüfungen, ${fails} Fehler`);
process.exit(fails ? 1 : 0);
