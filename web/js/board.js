/* Kikos Tafel: Aufgaben werden wie von Hand auf kariertes Papier geschrieben und gleichzeitig vorgelesen.
   Funktioniert ohne KI und offline (Sprache: im Browser Web Speech, in der Android-App die Android-Sprachausgabe). */
(function (root) {
  'use strict';
  const NATIVE = root.TiaNative || null;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------------- Sprache ----------------
  const SPEECH = {
    muted: false,
    n: 0,
    pending: {},
    native() { try { return !!(NATIVE && NATIVE.ttsAvailable && NATIVE.ttsAvailable()); } catch (e) { return false; } },
    web() { return 'speechSynthesis' in root && typeof SpeechSynthesisUtterance !== 'undefined'; },
    available() { return this.native() || this.web(); },
    voice() {
      if (!this.web()) return null;
      const vs = speechSynthesis.getVoices().filter((v) => /^de/i.test(v.lang));
      return vs.find((v) => /female|anna|petra|helena|katja|google/i.test(v.name)) || vs[0] || null;
    },
    /** Spricht den Text; Promise endet, wenn fertig (oder nach geschätzter Lesezeit, wenn stumm). */
    say(text) {
      text = String(text || '').trim();
      const est = Math.max(900, text.length * 62);
      if (!text) return Promise.resolve();
      if (this.muted || !this.available()) return sleep(est);
      if (this.native()) {
        return new Promise((res) => {
          const id = ++this.n;
          const done = () => { delete this.pending[id]; res(); };
          this.pending[id] = done;
          setTimeout(() => this.pending[id] && done(), est * 2.5 + 4000);
          try { NATIVE.speak(text, String(id)); } catch (e) { done(); }
        });
      }
      // Web: in Sätze teilen (manche Browser brechen lange Texte ab)
      const parts = text.match(/[^.!?]+[.!?]*/g) || [text];
      return parts.reduce((p, part) => p.then(() => new Promise((res) => {
        const u = new SpeechSynthesisUtterance(part.trim());
        u.lang = 'de-DE'; u.rate = 0.98; u.pitch = 1.1;
        const v = this.voice(); if (v) u.voice = v;
        let fin = false; const done = () => { if (!fin) { fin = true; res(); } };
        u.onend = done; u.onerror = done;
        setTimeout(done, Math.max(1500, part.length * 140));
        speechSynthesis.speak(u);
      })), Promise.resolve());
    },
    stop() {
      try { if (this.native()) NATIVE.stopSpeaking(); } catch (e) { /* egal */ }
      try { if (this.web()) speechSynthesis.cancel(); } catch (e) { /* egal */ }
      Object.values(this.pending).forEach((f) => f());
    },
  };
  root.onNativeSpeech = (id) => { const f = SPEECH.pending[id]; if (f) f(); };
  if (SPEECH.web()) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => {}; } catch (e) { /* egal */ } }

  // ---------------- Text-Helfer ----------------
  function textOf(html) {
    const s = String(html || '')
      .replace(/<span class="frac"><span>(.*?)<\/span><span>(.*?)<\/span><\/span>/g, '$1/$2')
      .replace(/<sup>(.*?)<\/sup>/g, '^$1')
      .replace(/<br\s*\/?>/g, ' ')
      .replace(/<li>/g, ' • ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    return s.replace(/\s+/g, ' ').trim();
  }
  const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{2190}-\u{21FF}✔✘]/gu;
  const SUPW = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };

  /** Mathe in Sprache: "3(x − 4) = 3x − 12" -> "3 mal Klammer auf x minus 4 Klammer zu ist gleich 3 x minus 12" */
  function sayMath(t) {
    let s = ' ' + textOf(t) + ' ';
    s = s.replace(/→/g, ', also ').replace(EMOJI, ' ');
    s = s.replace(/cm²/g, ' Quadratzentimeter').replace(/cm³/g, ' Kubikzentimeter').replace(/m²/g, ' Quadratmeter').replace(/m³/g, ' Kubikmeter')
      .replace(/(\d)\s*cm\b/g, '$1 Zentimeter').replace(/(\d)\s*km\b/g, '$1 Kilometer').replace(/(\d)\s*m\b/g, '$1 Meter').replace(/(\d)\s*h\b/g, '$1 Stunden');
    s = s.replace(/([a-z0-9)])²/gi, '$1 Quadrat').replace(/([a-z0-9)])³/gi, '$1 hoch drei')
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => ' hoch ' + m.split('').map((c) => SUPW[c]).join(''))
      .replace(/\^(\d+)/g, ' hoch $1');
    s = s.replace(/√\s*\(?/g, ' Wurzel aus ').replace(/π/g, ' Pi ').replace(/%/g, ' Prozent').replace(/€/g, ' Euro').replace(/°/g, ' Grad');
    s = s.replace(/(\d)\s*\/\s*(\d)/g, '$1 durch $2');
    s = s.replace(/\|\s*/g, ', jetzt rechnen wir ');
    s = s.replace(/·|×|\*/g, ' mal ').replace(/(\d|\))\s*:\s*(\(|\d)/g, '$1 geteilt durch $2');
    s = s.replace(/(\d)\s*\(/g, '$1 mal (').replace(/\)\s*\(/g, ') mal (');
    s = s.replace(/\(/g, ' Klammer auf ').replace(/\)/g, ' Klammer zu ');
    s = s.replace(/\s=\s|=/g, ' ist gleich ').replace(/≈/g, ' ungefähr ').replace(/±/g, ' plus minus ');
    s = s.replace(/\s[−-]\s/g, ' minus ').replace(/(^|\s|\()[−-](?=[\da-z(])/gi, '$1 minus ').replace(/−/g, ' minus ').replace(/\+/g, ' plus ');
    s = s.replace(/\b([a-z])(\d)/gi, '$1 $2').replace(/(\d)([a-z])\b/gi, '$1 $2');
    s = s.replace(/\s\?\s?/g, ' wie viel? ').replace(/\s*•\s*/g, '. ');
    return s.replace(/\s+/g, ' ').replace(/\s([,.!?])/g, '$1').trim();
  }

  // ---------------- Skripte bauen ----------------
  function splitQ(q) {
    const eqs = [];
    const rest = String(q).replace(/<div class="eq">([\s\S]*?)<\/div>/g, (_, e) => { eqs.push(textOf(e)); return ' '; });
    return { prompt: textOf(rest.replace(/<svg[\s\S]*?<\/svg>/g, '')), eqs };
  }

  /** Erklärt eine (ähnliche) Aufgabe Schritt für Schritt. */
  function fromTask(task, topic) {
    const CHECK = root.CHECK;
    const { prompt, eqs } = splitQ(task.q);
    const steps = [];
    steps.push({ clear: true, say: `Ich rechne dir eine ähnliche Aufgabe vor. Pass gut auf!`, lines: [{ t: `${topic.title}`, k: 'h' }] });
    steps.push({ say: sayMath(prompt + ' ' + eqs.join('. ')), lines: [...(prompt ? [{ t: prompt, k: 'n' }] : []), ...eqs.map((e) => ({ t: e, k: 'eq' }))], fig: task.fig || '' });
    if (task.kind === 'mc') steps.push({ say: 'Zur Auswahl stehen: ' + task.choices.map(sayMath).join(', oder ') + '.', lines: task.choices.map((c, i) => ({ t: 'ABCD'[i] + ') ' + textOf(c), k: 'n' })) });
    if (task.hint) steps.push({ say: 'Der Trick: ' + sayMath(task.hint), lines: [{ t: '💡 ' + textOf(task.hint), k: 'n', c: 'v' }] });
    (task.steps || []).forEach((s, i) => {
      const t = textOf(s);
      steps.push({ say: (i === 0 ? 'Los geht\'s. ' : pickWord(i)) + sayMath(t), lines: [{ t, k: 'eq' }] });
    });
    const ans = CHECK ? CHECK.answerText(task) : '';
    if (ans) steps.push({ say: 'Das Ergebnis ist: ' + sayMath(ans) + '.', lines: [{ t: '✔ ' + ans, k: 'res' }] });
    steps.push({ say: 'Super aufgepasst! Jetzt bist du dran – du schaffst das!', lines: [] });
    return steps;
  }
  const NEXTW = ['Jetzt: ', 'Weiter: ', 'Dann: ', 'Als Nächstes: '];
  const pickWord = (i) => NEXTW[i % NEXTW.length];

  /** Ganze Erklärung eines Themas als Tafel-Film (aus den Erklär-Panels). */
  function fromLearn(topic) {
    const steps = [];
    topic.learn.forEach((s, idx) => {
      steps.push({ clear: true, say: s.t.replace(EMOJI, '') + '. ' + sayMath(s.k), lines: [{ t: `${idx + 1}. ${s.t}`, k: 'h' }] });
      if (s.ex && typeof DOMParser !== 'undefined') {
        const doc = new DOMParser().parseFromString('<div>' + s.ex + '</div>', 'text/html');
        [...doc.body.firstChild.childNodes].forEach((n) => {
          if (n.nodeType === 3) { const t = n.textContent.trim(); if (t) steps.push({ say: sayMath(t), lines: [{ t, k: 'n' }] }); return; }
          if (n.nodeType !== 1) return;
          if (n.tagName.toLowerCase() === 'svg') { steps.push({ say: '', fig: n.outerHTML, wait: 1600 }); return; }
          const html = n.innerHTML;
          const t = textOf(html);
          if (!t) return;
          if (n.classList.contains('eq')) steps.push({ say: sayMath(t), lines: [{ t, k: 'eq' }] });
          else if (n.classList.contains('numline') || n.classList.contains('chips') || n.classList.contains('pizza')) steps.push({ say: '', fig: n.outerHTML, wait: 1200 });
          else steps.push({ say: sayMath(t), lines: [{ t, k: 'n' }] });
        });
      }
      if (s.tia) steps.push({ say: 'Tia fragt: ' + sayMath(s.tia), lines: [{ t: 'Tia: „' + textOf(s.tia) + '“', k: 'n', c: 'p' }] });
      if (s.k2) steps.push({ say: sayMath(s.k2), lines: [{ t: 'Kiko: ' + textOf(s.k2), k: 'n', c: 'v' }] });
    });
    steps.push({ clear: true, say: 'Das war\'s! Jetzt probier es selbst bei den Übungen. Ich drück dir die Daumen!', lines: [{ t: 'Jetzt bist du dran! 💪', k: 'h' }] });
    return steps;
  }

  /** Von der KI geliefertes Skript: [{say, write}] */
  function fromAi(list, title) {
    const steps = [{ clear: true, say: '', lines: [{ t: title || 'Hausaufgabe', k: 'h' }] }];
    list.forEach((x) => {
      const w = String(x.write || '').trim();
      steps.push({ say: String(x.say || ''), lines: w ? w.split('\n').map((t) => ({ t, k: /=/.test(t) ? 'eq' : 'n' })) : [] });
    });
    return steps;
  }

  // ---------------- Abspielen ----------------
  let el = null, run = 0, paused = false, idx = 0, script = [], opened = false;

  function ensure() {
    if (el) return el;
    el = document.createElement('div');
    el.id = 'board';
    el.innerHTML = `
      <div class="bhead"><span class="btitle"></span><button class="bbtn" data-b="close" aria-label="Schließen">✕</button></div>
      <div class="paper"><div class="lines"></div><div class="pen">✏️</div></div>
      <div class="bfoot">
        <div class="bkiko"></div>
        <div class="bsub"></div>
      </div>
      <div class="bctl">
        <button class="bbtn" data-b="restart" aria-label="Von vorn">⟲</button>
        <button class="bbtn big" data-b="pause" aria-label="Pause">⏸</button>
        <button class="bbtn" data-b="next" aria-label="Weiter">⏭</button>
        <button class="bbtn" data-b="mute" aria-label="Ton">🔊</button>
      </div>`;
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-b]'); if (!b) return;
      const a = b.dataset.b;
      if (a === 'close') close();
      if (a === 'pause') { paused = !paused; b.textContent = paused ? '▶' : '⏸'; if (paused) SPEECH.stop(); }
      if (a === 'restart') { SPEECH.stop(); start(0); }
      if (a === 'next') { SPEECH.stop(); skip = true; }
      if (a === 'mute') { SPEECH.muted = !SPEECH.muted; b.textContent = SPEECH.muted ? '🔇' : '🔊'; if (SPEECH.muted) SPEECH.stop(); try { localStorage.setItem('tmqMute', SPEECH.muted ? '1' : ''); } catch (er) { /* egal */ } }
    });
    return el;
  }
  let skip = false;

  function open(steps, title) {
    ensure();
    try { SPEECH.muted = localStorage.getItem('tmqMute') === '1'; } catch (e) { /* egal */ }
    el.querySelector('[data-b="mute"]').textContent = SPEECH.muted ? '🔇' : '🔊';
    el.querySelector('[data-b="pause"]').textContent = '⏸';
    el.querySelector('.btitle').textContent = title || 'Kikos Tafel';
    el.querySelector('.bkiko').innerHTML = root.ART ? root.ART.kiko('happy') : '';
    document.body.appendChild(el);
    script = steps; paused = false;
    if (!opened) { opened = true; history.pushState({ board: 1 }, '', location.href); }
    start(0);
  }
  function close(fromPop) {
    run++;
    SPEECH.stop();
    if (el && el.parentNode) el.remove();
    if (opened) { opened = false; if (!fromPop) history.back(); }
  }
  root.addEventListener('popstate', () => { if (opened) close(true); });

  async function start(from) {
    const my = ++run;
    idx = from;
    const lines = el.querySelector('.lines');
    lines.innerHTML = '';
    for (; idx < script.length; idx++) {
      if (my !== run) return;
      while (paused) { await sleep(150); if (my !== run) return; }
      skip = false;
      const st = script[idx];
      if (st.clear && lines.children.length) { lines.classList.add('flip'); await sleep(350); lines.innerHTML = ''; lines.classList.remove('flip'); }
      el.querySelector('.bsub').textContent = textOf(st.say || '').replace(EMOJI, '') ? (st.say || '') : '';
      const k = el.querySelector('.bkiko .kiko'); if (k) k.classList.toggle('talk', !!st.say);
      const speaking = SPEECH.say(st.say);
      const writing = (async () => {
        for (const ln of st.lines || []) {
          for (const part of wrap(ln)) { if (my !== run) return; await writeLine(lines, part, my); }
        }
        if (st.fig) {
          const f = document.createElement('div'); f.className = 'bfig'; f.innerHTML = st.fig; lines.appendChild(f); scrollDown();
          await sleep(st.wait || 900);
        }
      })();
      await Promise.all([speaking, writing]);
      if (my !== run) return;
      if (k) k.classList.remove('talk');
      await sleep(skip ? 50 : 450);
    }
    if (my === run) { el.querySelector('.pen').style.opacity = 0; const k = el.querySelector('.bkiko'); if (k && root.ART) k.innerHTML = root.ART.kiko('cheer'); }
  }

  /** Lange Sätze in Heftzeilen aufteilen, damit jede Zeile einzeln geschrieben wird. */
  function wrap(ln) {
    const paper = el.querySelector('.paper');
    const px = ln.k === 'h' ? 33 : ln.k === 'n' ? 25 : 31;
    const max = Math.max(14, Math.floor((paper.clientWidth - 70) / (px * 0.43)));
    if (ln.t.length <= max) return [ln];
    const out = []; let cur = '';
    ln.t.split(' ').forEach((w) => { if ((cur + ' ' + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
    if (cur) out.push(cur);
    return out.map((t) => ({ ...ln, t }));
  }

  function scrollDown() { const p = el.querySelector('.paper'); p.scrollTop = p.scrollHeight; }

  async function writeLine(box, ln, my) {
    const d = document.createElement('div');
    d.className = 'bl ' + (ln.k || 'n') + (ln.c ? ' c-' + ln.c : '');
    d.textContent = ln.t;
    d.style.clipPath = 'inset(0 100% 0 0)';
    box.appendChild(d);
    scrollDown();
    const pen = el.querySelector('.pen');
    pen.style.opacity = 1;
    const dur = Math.min(4500, Math.max(500, ln.t.length * (ln.k === 'eq' || ln.k === 'res' ? 75 : 38)));
    const t0 = performance.now();
    const paper = el.querySelector('.paper');
    await new Promise((res) => {
      const tick = (now) => {
        if (my !== run) return res();
        const p = skip ? 1 : Math.min(1, (now - t0) / dur);
        // mehrzeilige Zeilen: von oben nach unten und links nach rechts freilegen
        d.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
        const r = d.getBoundingClientRect(), pr = paper.getBoundingClientRect();
        pen.style.left = (r.left - pr.left + r.width * p - 4) + 'px';
        pen.style.top = (r.top - pr.top + paper.scrollTop + r.height - 30) + 'px';
        if (p < 1) requestAnimationFrame(tick); else { d.style.clipPath = 'none'; res(); }
      };
      requestAnimationFrame(tick);
    });
  }

  root.BOARD = { open, close, fromTask, fromLearn, fromAi, sayMath, textOf, SPEECH };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.BOARD;
})(typeof window !== 'undefined' ? window : globalThis);
