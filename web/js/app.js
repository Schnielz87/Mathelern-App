/* Tias Mathe-Quest – Oberfläche, Lernlogik, Belohnungen, Updates. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const app = $('#app');
  const { ri, pick, shuffle, fmt } = window.MC;
  const TOP = window.TOPICS;
  const byId = Object.fromEntries(TOP.map((t) => [t.id, t]));
  const NATIVE = window.TiaNative || null;
  const RAW_V = NATIVE ? NATIVE.version() : window.APP_VERSION;
  const VERSION = !RAW_V || RAW_V.startsWith('__') ? '0.0.0' : RAW_V;
  const BANDS = { 8: 'Band 1 · Klasse 8', 9: 'Band 2 · Klasse 9', 10: 'Band 3 · Klasse 10' };
  const DAILY_GOAL = 60;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ================= Speicher =================
  const KEY = 'tiaMatheQuest.v1';
  const DEF = () => ({
    name: 'Tia', xp: 0, topics: {}, gaps: {}, stickers: {}, streak: { n: 0, last: '' }, days: {}, missions: {},
    totalOk: 0, totalTasks: 0, history: [], checkup: false, settings: { sound: true, vib: true, guided: 'auto' }, created: Date.now(),
  });
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s === 'object') return Object.assign(DEF(), s, { settings: Object.assign(DEF().settings, s.settings || {}) });
    } catch (e) { /* leer */ }
    return DEF();
  }
  let S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* voll/privat */ } }
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* egal */ }
  const tp = (id) => S.topics[id] || (S.topics[id] = { m: 0, lvl: 1, seen: 0, ok: 0, bad: 0, streak: 0, wrongRow: 0, last: 0, due: 0, learned: false, boss: false });
  const dayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = () => dayKey();
  const yesterday = () => dayKey(new Date(Date.now() - 864e5));

  // ================= Ränge & Sticker =================
  const RANKS = [[0, 'Mathe-Neuling', '🌱'], [100, 'Lehrling', '📘'], [250, 'Kämpferin', '⚔️'], [500, 'Heldin', '🦸‍♀️'], [900, 'Mathe-Ninja', '🥷'], [1400, 'Sensei-Schülerin', '🎓'], [2000, 'Meisterin', '🏅'], [3000, 'Legende', '🐉'], [4500, 'Mathe-Göttin', '👑']];
  const rankIdx = (xp) => RANKS.reduce((i, r, k) => (xp >= r[0] ? k : i), 0);
  const SPECIAL = [
    { id: 's_check', e: '🧪', n: 'Forscherin', how: 'Einstufungstest gemacht' },
    { id: 's_first', e: '🏆', n: 'Erster Sieg', how: 'Ersten Boss besiegt' },
    { id: 's_perfect', e: '💯', n: 'Perfekte Runde', how: 'Runde mit 8+ Aufgaben ohne Fehler' },
    { id: 's_mission', e: '🎯', n: 'Missions-Profi', how: 'Erste Tagesmission geschafft' },
    { id: 's_streak3', e: '🔥', n: 'Feuer-Serie', how: '3 Tage am Stück gelernt' },
    { id: 's_streak7', e: '🌟', n: 'Wochen-Star', how: '7 Tage am Stück gelernt' },
    { id: 's_ok100', e: '⭐', n: 'Sternenstaub', how: '100 Aufgaben richtig' },
    { id: 's_ok500', e: '🌠', n: 'Sternschnuppe', how: '500 Aufgaben richtig' },
    { id: 's_ninja', e: '🥷', n: 'Ninja-Rang', how: 'Rang „Mathe-Ninja“ erreicht' },
  ];
  const STICKERS = [...TOP.map((t) => ({ id: 't_' + t.id, e: t.sticker.e, n: t.sticker.n, how: `Boss „${t.boss.name}“ besiegen` })), ...SPECIAL];
  let newStickers = [];
  function award(id) {
    if (S.stickers[id]) return;
    const s = STICKERS.find((x) => x.id === id);
    if (!s) return;
    S.stickers[id] = Date.now();
    newStickers.push(s);
    save();
  }

  function addXP(n) {
    if (n <= 0) return;
    const before = rankIdx(S.xp);
    S.xp += n;
    const d = today();
    S.days[d] = (S.days[d] || 0) + n;
    if (S.streak.last !== d) {
      S.streak.n = S.streak.last === yesterday() ? S.streak.n + 1 : 1;
      S.streak.last = d;
    }
    if (S.streak.n >= 3) award('s_streak3');
    if (S.streak.n >= 7) award('s_streak7');
    if (S.totalOk >= 100) award('s_ok100');
    if (S.totalOk >= 500) award('s_ok500');
    const after = rankIdx(S.xp);
    if (after >= 4) award('s_ninja');
    if (after > before) setTimeout(() => modal(`${window.ART.kiko('wow')}<h2>Rang-Aufstieg! ${RANKS[after][2]}</h2><p>Du bist jetzt <b>${RANKS[after][1]}</b>!<br>Kiko ist mega stolz auf dich! 🎉</p><button class="btn pink block" data-close>Weiter so!</button>`), 900);
    save();
  }

  // ================= Ton & Vibration =================
  let AC = null;
  function sound(type) {
    if (!S.settings.sound) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const seq = { ok: [[660, 0], [880, .08], [1320, .16]], bad: [[240, 0], [190, .13]], tap: [[600, 0]], win: [[523, 0], [659, .12], [784, .24], [1047, .36], [1319, .52]], hit: [[320, 0], [160, .07]], up: [[440, 0], [660, .1], [990, .2]] }[type] || [];
      const t0 = AC.currentTime;
      seq.forEach(([f, d]) => {
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = type === 'bad' ? 'square' : 'triangle';
        o.frequency.value = f;
        const vol = type === 'tap' ? 0.05 : type === 'bad' ? 0.06 : 0.16;
        g.gain.setValueAtTime(0.0001, t0 + d);
        g.gain.exponentialRampToValueAtTime(vol, t0 + d + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + (type === 'tap' ? 0.05 : 0.17));
        o.connect(g).connect(AC.destination);
        o.start(t0 + d); o.stop(t0 + d + 0.2);
      });
    } catch (e) { /* kein Ton */ }
  }
  function vib(ms) {
    if (!S.settings.vib) return;
    try { if (NATIVE) NATIVE.vibrate(ms); else if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* egal */ }
  }

  // ================= Kleine UI-Helfer =================
  let ACT = {};
  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !app.contains(el)) return;
    const f = ACT[el.dataset.act];
    if (f) { sound('tap'); f(el.dataset.arg, el, e); }
  });
  function toast(msg, ms = 2600) {
    const t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }
  function modal(html, onClose) {
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `<div class="panel">${html}</div>`;
    document.body.appendChild(m);
    const close = () => { m.remove(); onClose && onClose(); };
    m.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
    return { el: m, close };
  }
  const topbar = (title, right = '') => `<div class="topbar"><button class="back" data-act="back" aria-label="Zurück">←</button><h2>${title}</h2>${right}</div>`;
  ACT.back = () => back();
  function back() { if (history.length > 1) history.back(); else go(''); }
  function go(h) { location.hash = '#/' + h; }
  const pct = (m) => Math.round(m);
  const lvlStars = (l) => '⭐'.repeat(l) + '☆'.repeat(3 - l);
  function ringStyle(m) { return `background: conic-gradient(var(--pink) ${m * 3.6}deg, #eee ${m * 3.6}deg)`; }
  function fx(text, cls = '') {
    const f = document.createElement('div');
    f.className = 'fx';
    f.innerHTML = `<div class="lines"></div><div class="stamp ${cls}">${text}</div>`;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 900);
  }
  function xpFloat(n) {
    const f = document.createElement('div');
    f.className = 'fx';
    f.innerHTML = `<div class="xp">+${n} XP</div>`;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1000);
  }
  function confetti(n = 40) {
    const cols = ['#ff5fa2', '#ffd23f', '#3ee6ff', '#7a3cff', '#22c55e', '#ff8a3d'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = pick(cols);
      c.style.animationDuration = 1.6 + Math.random() * 1.8 + 's';
      c.style.animationDelay = Math.random() * 0.4 + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4000);
    }
  }

  // ================= Lern-Empfehlung & Schwächen =================
  function need(t) {
    const st = tp(t.id), g = S.gaps[t.id] || 0;
    if (st.seen === 0) return g > 0 ? 40 + g * 15 : 0;
    return (100 - st.m) + (st.due && st.due < Date.now() ? 25 : 0) + g * 12;
  }
  function weakTopics() {
    return TOP.filter((t) => { const st = tp(t.id); return (st.seen >= 3 && st.m < 60) || (S.gaps[t.id] || 0) >= 2; })
      .sort((a, b) => need(b) - need(a));
  }
  function recommendation() {
    const gapIds = Object.entries(S.gaps).filter(([id, c]) => c >= 2 && byId[id] && tp(id).m < 70).sort((a, b) => b[1] - a[1]);
    if (gapIds.length) {
      const t = byId[gapIds[0][0]];
      return { t, act: 'practice', why: `Mir ist aufgefallen: Bei <b>${t.title}</b> gibt es noch eine kleine Lücke. Lass sie uns schließen – dann wird alles andere leichter! 🧩` };
    }
    for (const t of TOP) {
      const st = tp(t.id);
      if (st.seen >= 6 && st.m < 35) {
        const weakPre = (t.pre || []).map((id) => byId[id]).find((p) => tp(p.id).m < 50);
        if (weakPre) return { t: weakPre, act: tp(weakPre.id).learned ? 'practice' : 'learn', why: `<b>${t.title}</b> ist gerade knifflig, oder? Das liegt oft an <b>${weakPre.title}</b>. Lass uns das kurz festigen! 💪` };
        return { t, act: 'learn', why: `Bei <b>${t.title}</b> schauen wir uns am besten die Erklärung nochmal an. Ganz in Ruhe! 📖` };
      }
    }
    const am = tp('ausmult');
    if (am.m < 70) return { t: byId.ausmult, act: am.learned ? 'practice' : 'learn', why: am.seen ? `Weiter geht's mit <b>Ausmultiplizieren</b>! Du bist schon bei ${pct(am.m)} %. 🎁` : 'Lass uns mit <b>Ausmultiplizieren</b> starten – ich erkläre es dir ganz einfach, versprochen! 🦊' };
    const due = TOP.filter((t) => tp(t.id).seen > 0 && tp(t.id).due < Date.now()).sort((a, b) => tp(a.id).m - tp(b.id).m)[0];
    if (due) return { t: due, act: 'practice', why: `Zeit zum Wiederholen: <b>${due.title}</b>. So bleibt es im Kopf! 🧠` };
    const next = TOP.find((t) => tp(t.id).m < 60);
    if (next) return { t: next, act: tp(next.id).learned ? 'practice' : 'learn', why: tp(next.id).seen ? `Bei <b>${next.title}</b> fehlt nicht mehr viel! 🔥` : `Neues Kapitel: <b>${next.title}</b>! Bereit fürs nächste Abenteuer? ⚔️` };
    return { t: null, why: 'Wow, du hast alles drauf! Zeit für das Prüfungs-Training. 👑' };
  }

  // ================= Startseite =================
  function home() {
    const r = rankIdx(S.xp), nextR = RANKS[r + 1];
    const prog = nextR ? (S.xp - RANKS[r][0]) / (nextR[0] - RANKS[r][0]) * 100 : 100;
    const todayXp = S.days[today()] || 0;
    const rec = recommendation();
    const weak = weakTopics().length;
    const mission = S.missions[today()];
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const showIOS = !NATIVE && isIOS && !standalone && !sessionStorage.getItem('iosHint');
    app.innerHTML = `
      <div class="hero">
        ${window.ART.tia('happy')}
        <div class="grow"><h1>Hey ${esc(S.name)}! 👋</h1><span class="rank">${RANKS[r][2]} ${RANKS[r][1]}</span></div>
        <button class="back" data-act="go" data-arg="settings" aria-label="Einstellungen">⚙️</button>
      </div>
      ${UPD.pending ? `<div class="banner">✨ <span class="grow">Neues Update <b>${esc(UPD.pending.version)}</b> ist da!</span><button class="btn small pink" data-act="update">Holen</button></div>` : ''}
      ${showIOS ? `<div class="banner ios">📲 <span class="grow small">Als App installieren: unten auf <b>Teilen</b> ⬆️ tippen, dann <b>„Zum Home-Bildschirm“</b>.</span><button class="btn small white" data-act="iosok">OK</button></div>` : ''}
      <div class="panel" style="padding:12px">
        <div class="row small"><span class="grow">${RANKS[r][1]}</span><span>${nextR ? `${S.xp} / ${nextR[0]} XP` : S.xp + ' XP'}</span></div>
        <div class="bar" style="margin-top:4px"><i style="width:${prog}%"></i></div>
        <div class="stats">
          <div class="stat"><div class="v">🔥 ${S.streak.last === today() || S.streak.last === yesterday() ? S.streak.n : 0}</div><div class="l">Tage-Serie</div></div>
          <div class="stat"><div class="v">${Math.min(todayXp, DAILY_GOAL)}/${DAILY_GOAL}</div><div class="l">Tagesziel XP</div></div>
          <div class="stat"><div class="v">🃏 ${Object.keys(S.stickers).length}</div><div class="l">Sticker</div></div>
        </div>
      </div>
      <div class="sensei">${window.ART.kiko(rec.t ? 'happy' : 'wow')}<div class="bubble">${rec.why}
        ${rec.t ? `<br><button class="btn small pink" data-act="rec">${rec.act === 'learn' ? '📖 Erklär es mir' : '✏️ Los geht\'s'}</button>` : ''}</div></div>
      <div class="menu">
        <button class="tile big mission ${!S.checkup ? '' : mission ? '' : 'glow'}" data-act="go" data-arg="mission"><span class="e">⚔️</span><span><span class="t">Tagesmission</span><br><span class="s">${mission ? '✔ Heute geschafft! Nochmal?' : '10 Aufgaben – genau für dich gemischt'}</span></span></button>
        ${!S.checkup ? `<button class="tile big glow" data-act="go" data-arg="check"><span class="e">🧪</span><span><span class="t">Einstufungstest</span><br><span class="s">Kiko findet heraus, wo du stehst (5 Min.)</span></span></button>` : ''}
        <button class="tile train" data-act="go" data-arg="train">${weak ? `<span class="badge">${weak}</span>` : ''}<span class="e">🎯</span><span class="t">Schwächen-Training</span><span class="s">Lücken schließen</span></button>
        <button class="tile" data-act="go" data-arg="kapitel"><span class="e">📚</span><span class="t">Kapitel</span><span class="s">Klasse 8 – 10</span></button>
        <button class="tile" data-act="go" data-arg="exam"><span class="e">🎓</span><span class="t">Prüfungs-Training</span><span class="s">Bunt gemischt</span></button>
        <button class="tile" data-act="go" data-arg="album"><span class="e">🃏</span><span class="t">Sammelalbum</span><span class="s">${Object.keys(S.stickers).length} / ${STICKERS.length}</span></button>
        <button class="tile" data-act="go" data-arg="formeln"><span class="e">📌</span><span class="t">Formeln</span><span class="s">Spickzettel</span></button>
        <button class="tile" data-act="go" data-arg="progress"><span class="e">📊</span><span class="t">Fortschritt</span><span class="s">auch für Eltern</span></button>
      </div>
      <p class="center small" style="color:#fff;opacity:.6;margin-top:22px">Version ${VERSION}</p>`;
    ACT = {
      go: (a) => go(a), back,
      rec: () => (rec.act === 'learn' ? go('learn/' + rec.t.id) : startSession({ mode: 'practice', topic: rec.t.id })),
      update: () => showUpdate(UPD.pending),
      iosok: () => { sessionStorage.setItem('iosHint', '1'); home(); },
    };
    if (UPD.pending && !UPD.shown) { UPD.shown = true; showUpdate(UPD.pending); }
  }

  // ================= Kapitel =================
  function kapitel(band) {
    band = +(band || sessionStorage.getItem('band') || 8);
    sessionStorage.setItem('band', band);
    const list = TOP.filter((t) => t.band === band);
    app.innerHTML = topbar('📚 Kapitel') + `
      <div class="tabs">${[8, 9, 10].map((b) => `<button class="tab ${b === band ? 'on' : ''}" data-act="band" data-arg="${b}">Klasse ${b}</button>`).join('')}</div>
      <div class="chapno">${BANDS[band]}</div>
      ${list.map((t, i) => { const st = tp(t.id); return `
        <button class="tcard ${t.star ? 'star' : ''}" data-act="topic" data-arg="${t.id}">
          ${st.boss ? '<span class="crown">👑</span>' : t.star ? '<span class="crown">⭐</span>' : ''}
          <span class="e">${t.emoji}</span>
          <span class="grow"><span class="t">Kapitel ${i + 1}: ${t.title}</span><br><span class="s">${t.sub}${(S.gaps[t.id] || 0) >= 2 ? ' · 🧩 Lücke' : ''}</span>
            <span class="bar ${st.m >= 80 ? 'green' : 'pink'}" style="display:block"><i style="width:${st.m}%"></i></span></span>
          <span class="small" style="width:40px;text-align:right">${pct(st.m)}%</span>
        </button>`; }).join('')}`;
    ACT = { back, band: (b) => { sessionStorage.setItem('band', b); history.replaceState(null, '', '#/kapitel/' + b); kapitel(b); }, topic: (id) => go('topic/' + id) };
  }

  // ================= Thema =================
  function topicView(id) {
    const t = byId[id]; if (!t) return go('');
    const st = tp(id);
    const pre = (t.pre || []).map((p) => byId[p]);
    app.innerHTML = topbar(t.title) + `
      <div class="panel topic-head tilt">
        <div class="e">${t.emoji}</div>
        <div class="muted">${t.sub} · ${BANDS[t.band]}</div>
        <div class="ring" style="${ringStyle(st.m)}"><div>${pct(st.m)}%</div></div>
        <div class="stars" title="Stufe">${lvlStars(st.lvl)}</div>
        <div class="small muted">${st.seen ? `${st.ok} richtig · ${st.bad} falsch` : 'Noch nicht geübt'}${st.boss ? ' · 👑 Boss besiegt' : ''}</div>
        <div class="actions">
          <button class="btn ${st.learned ? 'white' : 'pink'} block" data-act="learn">📖 Erklärung ${st.learned ? 'ansehen' : '– starte hier!'}</button>
          <button class="btn ${st.learned ? 'pink' : 'white'} block" data-act="practice">✏️ Üben (10 Aufgaben)</button>
          <button class="btn violet block" data-act="boss">${t.boss.emoji} Boss-Kampf: ${t.boss.name}</button>
        </div>
        ${st.m < 50 && !st.boss ? '<div class="small muted" style="margin-top:8px">Tipp: Der Boss ist leichter ab 50 % 😉</div>' : ''}
      </div>
      ${pre.length ? `<div class="panel"><h3>🔗 Das hilft dabei</h3>${pre.map((p) => `<div class="row" style="margin:6px 0"><span>${p.emoji}</span><span class="grow">${p.title}</span><span class="small">${pct(tp(p.id).m)}%</span><button class="btn small white" data-act="topic" data-arg="${p.id}">→</button></div>`).join('')}</div>` : ''}
      <div class="panel tilt2"><h3>📌 Spickzettel</h3>${t.formulas.map((f) => `<div class="formula">${f}</div>`).join('')}</div>`;
    ACT = { back, learn: () => go('learn/' + id), practice: () => startSession({ mode: 'practice', topic: id }), boss: () => startSession({ mode: 'boss', topic: id }), topic: (p) => go('topic/' + p) };
  }

  // ================= Erklärung (Manga-Panels) =================
  function learn(id, idx) {
    const t = byId[id]; if (!t) return go('');
    let i = +(idx || 0);
    const draw = () => {
      const s = t.learn[i];
      const last = i === t.learn.length - 1;
      app.innerHTML = topbar(`${t.emoji} ${t.title}`) + `
        <div class="dots">${t.learn.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>
        <div class="mpanel">
          <div class="ptitle">${i + 1}. ${s.t}</div>
          <div class="say">${window.ART.kiko(s.mood || 'happy')}<div class="bubble">${s.k}</div></div>
          ${s.ex ? `<div class="exbox">${s.ex}</div>` : ''}
          ${s.tia ? `<div class="say tia-say">${window.ART.tia()}<div class="bubble right">${s.tia}</div></div>` : ''}
          ${s.k2 ? `<div class="say">${window.ART.kiko('cheer')}<div class="bubble">${s.k2}</div></div>` : ''}
          ${s.quiz ? `<div class="quiz"><b>🎮 Probier mal:</b> ${s.quiz.q}<div class="opts">${shuffle(s.quiz.c.map((c, k) => k)).map((k) => `<button class="choice" data-act="quiz" data-arg="${k}">${s.quiz.c[k]}</button>`).join('')}</div><div id="qwhy"></div></div>` : ''}
        </div>
        <div class="row">
          <button class="btn white" data-act="prev" ${i === 0 ? 'disabled' : ''}>← Zurück</button>
          <button class="btn ${last ? 'pink' : 'cyan'} grow" data-act="next">${last ? '✏️ Jetzt üben!' : 'Weiter →'}</button>
        </div>`;
    };
    draw();
    ACT = {
      back,
      prev: () => { if (i > 0) { i--; draw(); window.scrollTo(0, 0); } },
      next: () => {
        if (i < t.learn.length - 1) { i++; draw(); window.scrollTo(0, 0); return; }
        const st = tp(id);
        if (!st.learned) { st.learned = true; addXP(15); toast('+15 XP fürs Lernen 📖'); }
        save();
        history.replaceState(null, '', '#/topic/' + id);
        startSession({ mode: 'practice', topic: id });
      },
      quiz: (k, el) => {
        const q = t.learn[i].quiz;
        const ok = +k === q.a;
        el.classList.add(ok ? 'ok' : 'bad');
        if (ok) { sound('ok'); fx(pick(['SUPER!', 'JA!', 'YATTA!'])); app.querySelectorAll('.quiz .choice').forEach((b) => (b.disabled = true)); }
        else { sound('bad'); vib(60); }
        $('#qwhy').innerHTML = `<p>${ok ? '✔ Richtig! ' : '✘ Noch nicht – '}${q.why}</p>`;
      },
    };
  }

  // ================= Übungs-Sitzungen =================
  const CHECKUP = [['neg', 1], ['neg', 2], ['brueche', 1], ['terme', 1], ['zusammen', 1], ['zusammen', 2], ['ausmult', 1], ['ausmult', 2], ['ausklammern', 1], ['gleich', 1], ['gleich', 2], ['prozent', 1], ['dreisatz', 1], ['flaechen', 1]];
  let SESS = null;

  function weightedPick(list, w) {
    const ws = list.map(w); const sum = ws.reduce((a, b) => a + b, 0);
    if (sum <= 0) return pick(list);
    let r = Math.random() * sum;
    for (let k = 0; k < list.length; k++) { r -= ws[k]; if (r <= 0) return list[k]; }
    return list[list.length - 1];
  }

  function planQueue(o) {
    if (o.mode === 'practice' || o.mode === 'boss') return Array(o.count).fill(o.topic);
    if (o.mode === 'check') return CHECKUP.map((x) => x[0]);
    if (o.mode === 'train') {
      const w = weakTopics().slice(0, 4);
      if (!w.length) return null;
      return Array.from({ length: o.count }, () => weightedPick(w, need).id);
    }
    if (o.mode === 'exam') {
      const pool = TOP.filter((t) => t.band <= o.band);
      return shuffle(Array.from({ length: o.count }, (_, k) => pool[k % pool.length].id));
    }
    // Tagesmission
    const started = TOP.filter((t) => tp(t.id).seen > 0);
    const rec = recommendation().t || byId.ausmult;
    const due = started.filter((t) => tp(t.id).due < Date.now());
    return Array.from({ length: o.count }, () => {
      const r = Math.random();
      if (started.length && r < 0.5) return weightedPick(started, need).id;
      if (due.length && r < 0.7) return pick(due).id;
      return rec.id;
    });
  }

  function startSession(o) {
    const defaults = { practice: 10, mission: 10, train: 10, boss: 8, check: CHECKUP.length, exam: 15 };
    o.count = o.count || defaults[o.mode];
    const queue = planQueue(o);
    if (!queue) {
      modal(`${window.ART.kiko('wow')}<h2>Keine Schwächen! 💪</h2><p>Kiko hat gerade keine Lücken bei dir gefunden. Mach die Tagesmission oder ein neues Kapitel!</p><button class="btn pink block" data-close>Okay!</button>`);
      return;
    }
    SESS = { ...o, queue, i: 0, results: [], combo: 0, maxCombo: 0, xp: 0, hearts: o.mode === 'boss' ? 3 : null, hp: o.mode === 'boss' ? o.count : null, startM: {}, gaps: [], cur: null };
    queue.forEach((id) => { if (SESS.startM[id] === undefined) SESS.startM[id] = tp(id).m; });
    newStickers = [];
    const target = o.mode === 'practice' || o.mode === 'boss' ? `${o.mode}/${o.topic}` : o.mode;
    if (location.hash === '#/' + target) renderSession(); else go(target);
  }

  function sessionRoute(mode, topic) {
    if (!SESS || SESS.mode !== mode || (topic && SESS.topic !== topic) || SESS.done) {
      if (mode === 'exam' && !topic) return examPick();
      return startSession({ mode, topic, band: SESS && SESS.band });
    }
    renderSession();
  }

  function examPick() {
    app.innerHTML = topbar('🎓 Prüfungs-Training') + `
      <div class="sensei">${window.ART.kiko('think')}<div class="bubble">15 gemischte Aufgaben wie in einer Prüfung. Welcher Stoff soll drankommen?</div></div>
      <div class="actions">
        <button class="btn block" data-act="ex" data-arg="8">📗 Klasse 8</button>
        <button class="btn cyan block" data-act="ex" data-arg="9">📘 Klasse 8 + 9</button>
        <button class="btn pink block" data-act="ex" data-arg="10">📕 Klasse 8 – 10 (Abschluss)</button>
      </div>`;
    ACT = { back, ex: (b) => { SESS = null; const o = { mode: 'exam', band: +b }; o.count = 15; const queue = planQueue(o); SESS = { ...o, queue, i: 0, results: [], combo: 0, maxCombo: 0, xp: 0, startM: {}, gaps: [], cur: null }; queue.forEach((id) => { if (SESS.startM[id] === undefined) SESS.startM[id] = tp(id).m; }); newStickers = []; renderSession(); } };
  }

  function levelFor(id) {
    const st = tp(id);
    if (SESS.mode === 'check') return CHECKUP[SESS.i][1];
    if (SESS.mode === 'exam') return ri(2, 3);
    if (SESS.mode === 'boss') return SESS.i >= SESS.count - 2 ? 3 : Math.max(2, st.lvl);
    return st.lvl;
  }

  function nextTask() {
    const id = SESS.queue[SESS.i];
    const t = byId[id];
    const lvl = levelFor(id);
    const task = t.gen.call(t, lvl);
    const st = tp(id);
    const noHelp = SESS.mode === 'check' || SESS.mode === 'boss' || SESS.mode === 'exam';
    const guided = !noHelp && task.guided && task.guided.length && (S.settings.guided === 'always' || (S.settings.guided === 'auto' && (st.m < 35 || st.wrongRow >= 2)));
    const nIn = task.kind === 'multi' ? task.fields.length : 1;
    SESS.cur = { id, lvl, task, attempts: 0, hint: false, guided: !!guided, gi: 0, gTries: 0, gDone: [], inputs: Array(nIn).fill(''), active: 0, finished: false, closeMsgs: 0 };
  }

  const MODE_TITLE = { practice: '✏️ Üben', mission: '⚔️ Tagesmission', train: '🎯 Schwächen-Training', boss: '👹 Boss-Kampf', check: '🧪 Einstufungstest', exam: '🎓 Prüfung' };

  function inputKind(c) {
    if (c.guided && c.gi < c.task.guided.length) return c.task.guided[c.gi].kind;
    return c.task.kind;
  }

  function renderSession() {
    if (!SESS.cur) nextTask();
    const c = SESS.cur, task = c.task, t = byId[c.id];
    const n = SESS.queue.length;
    const inGuided = c.guided && c.gi < task.guided.length;
    const kind = inputKind(c);
    const right = SESS.mode === 'boss' ? `<span class="hearts">${'❤️'.repeat(SESS.hearts)}${'🖤'.repeat(3 - SESS.hearts)}</span>` : `<span class="combo">${SESS.combo >= 2 ? 'x' + SESS.combo + ' 🔥' : ''}</span>`;
    let html = topbar(MODE_TITLE[SESS.mode], right);
    if (SESS.mode === 'boss') {
      html += `<div class="boss"><div class="face" id="bossFace">${t.boss.emoji}</div><div class="name">${t.boss.name}</div><div class="bar"><i style="width:${SESS.hp / SESS.count * 100}%"></i></div></div>`;
    } else {
      html += `<div class="sessbar"><div class="bar pink"><i style="width:${SESS.i / n * 100}%"></i></div><span class="small" style="color:#fff">${SESS.i + 1}/${n}</span></div>`;
    }
    html += `<div class="qcard"><span class="tag">${t.emoji} ${t.title} ${'★'.repeat(c.lvl)}</span>
      <div class="qtext">${task.q}</div>${task.fig || ''}`;
    if (c.guided) {
      html += `<div class="gstep"><div class="gtitle">🐾 SCHRITT FÜR SCHRITT MIT KIKO</div>
        ${task.guided.map((g, k) => k < c.gi ? `<div class="done">✔ ${g.q.replace('= ?', '= ' + c.gDone[k])}</div>` : k === c.gi ? `<div>👉 ${g.q}</div>` : '').join('')}
        ${!inGuided ? '<div>👉 Jetzt alles zusammen hinschreiben:</div>' : ''}</div>`;
    }
    html += `</div>`;
    if (kind === 'mc' && !inGuided) {
      html += `<div class="choices">${task.choices.map((ch, k) => `<button class="choice" data-act="mc" data-arg="${k}" ${c.finished ? 'disabled' : ''}>${ch}</button>`).join('')}</div>`;
    } else {
      const fields = !inGuided && task.kind === 'multi' ? task.fields : [{ label: '' }];
      html += fields.map((f, k) => `<div class="answer">${f.label ? `<span class="mlabel">${f.label}</span>` : ''}<div class="display ${k === c.active ? 'active' : ''}" data-act="field" data-arg="${k}">${showInput(c.inputs[k], k === c.active && !c.finished)}</div>${!inGuided && task.unit ? `<span class="unit">${task.unit}</span>` : ''}</div>`).join('');
      if (!c.finished) html += keypad(kind === 'term' ? keysFor(task) : null);
    }
    if (!c.finished) {
      const canHint = SESS.mode !== 'check' && SESS.mode !== 'boss';
      html += `<div class="controls">${canHint ? '<button class="btn white" data-act="hint">💡 Tipp</button>' : '<span></span>'}${kind === 'mc' && !inGuided ? '<span></span>' : '<button class="btn green" data-act="check">Prüfen ✔</button>'}</div>`;
    }
    html += `<div id="fb">${c.fb || ''}</div>`;
    if (c.finished) html += `<button class="btn pink block" style="margin-top:12px" data-act="next">Weiter →</button>`;
    app.innerHTML = html;
    ACT = {
      back,
      key: (k) => keyPress(k),
      field: (k) => { if (!c.finished) { c.active = +k; renderSession(); } },
      check: () => doCheck(),
      hint: () => showHint(),
      mc: (k) => doCheck(+k),
      next: () => advance(),
    };
    if (c.finished) setTimeout(() => { const b = app.querySelector('[data-act="next"]'); b && b.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);
  }

  function showInput(s, caret) {
    const pretty = esc(s).replace(/\^(\d*)/g, '<sup>$1</sup>');
    return (s ? pretty : '<span class="ph">Antwort eintippen …</span>') + (caret ? '<span class="caret"></span>' : '');
  }
  function keysFor(task) {
    const a = task.answer || '';
    const ks = ['x'];
    if (/y/.test(a) || /y/.test(task.q.replace(/<[^>]*>/g, '').replace(/[a-zäöüß]{2,}/gi, ''))) ks.push('y');
    ks.push(task.form === 'mono' ? '^' : '²', '(', ')');
    return ks;
  }
  function keypad(vars) {
    const k = (v, cls = '', label = v) => `<button class="key ${cls}" data-act="key" data-arg="${esc(v)}">${label}</button>`;
    if (!vars) {
      return `<div class="keypad num">${['7', '8', '9'].map((v) => k(v)).join('')}${k('del', 'del', '⌫')}${['4', '5', '6'].map((v) => k(v)).join('')}${k('−', 'op')}${['1', '2', '3'].map((v) => k(v)).join('')}${k(',', 'op')}${k('C', 'del', 'C')}${k('0')}${k('/', 'op', '/')}<span></span></div>`;
    }
    return `<div class="keypad" style="grid-template-columns:repeat(${vars.length + 1},1fr)">${vars.map((v) => k(v, v.length === 1 && /[a-z]/.test(v) ? 'var' : 'op')).join('')}${k('del', 'del', '⌫')}</div>
      <div class="keypad">${['7', '8', '9'].map((v) => k(v)).join('')}${k('+', 'op')}${k('−', 'op')}${['4', '5', '6'].map((v) => k(v)).join('')}${k('·', 'op')}${k('C', 'del')}${['1', '2', '3'].map((v) => k(v)).join('')}${k('0')}${k(',', 'op')}</div>`;
  }
  function keyPress(k) {
    const c = SESS && SESS.cur; if (!c || c.finished) return;
    let s = c.inputs[c.active];
    if (k === 'del') s = s.slice(0, -1);
    else if (k === 'C') s = '';
    else if (s.length < 30) s += k;
    c.inputs[c.active] = s;
    const d = app.querySelectorAll('.display')[c.active];
    if (d) { d.innerHTML = showInput(s, true); d.classList.remove('bad'); }
  }
  document.addEventListener('keydown', (e) => {
    if (!SESS || !SESS.cur || !location.hash.match(/practice|mission|train|boss|check|exam/)) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const map = { '-': '−', '*': '·', '.': ',', Backspace: 'del', Escape: 'C' };
    const k = map[e.key] || e.key;
    if (e.key === 'Enter') { e.preventDefault(); if (SESS.cur.finished) advance(); else doCheck(); return; }
    if (/^[0-9xy+−·,/()^²C]$/.test(k) || k === 'del') { e.preventDefault(); keyPress(k); }
  });

  function setFb(html) { SESS.cur.fb = html; const f = $('#fb'); if (f) f.innerHTML = html; }
  const fbBox = (cls, mood, text, extra = '') => `<div class="feedback ${cls}"><div class="row">${window.ART.kiko(mood)}<div class="grow">${text}</div></div>${extra}</div>`;

  function showHint() {
    const c = SESS.cur;
    c.hint = true;
    const h = c.guided && c.gi < c.task.guided.length ? 'Rechne nur diesen einen Schritt. ' + (c.task.hint || '') : c.task.hint || 'Lies die Aufgabe nochmal ganz in Ruhe. 🙂';
    setFb(fbBox('hint', 'think', '💡 ' + h));
  }

  const PRAISE = ['SUGOI!', 'BÄM!', 'ZACK!', 'STARK!', 'WOW!', 'YATTA!', 'PERFEKT!', 'HAMMER!'];
  const RETRY = ['Noch nicht ganz – du schaffst das! 💪', 'Fast! Schau nochmal genau hin. 🔍', 'Kein Problem, Fehler machen schlau! 🧠', 'Versuch es nochmal, ich glaub an dich! 🦊'];
  const stepsHtml = (task) => (task.steps && task.steps.length ? `<b>So geht's:</b><ol class="steps">${task.steps.map((s) => `<li>${s}</li>`).join('')}</ol>` : '');

  function doCheck(mcIdx) {
    const c = SESS.cur; if (c.finished) return;
    const task = c.task;
    // --- Zwischenschritt ---
    if (c.guided && c.gi < task.guided.length) {
      const g = task.guided[c.gi];
      const r = window.CHECK.check(g, c.inputs[0]);
      if (r.empty || r.invalid) { toast(r.msg); return; }
      if (r.ok || c.gTries >= 1) {
        const shown = r.ok ? c.inputs[0] : window.CHECK.answerText(g);
        c.gDone.push(esc(shown));
        if (r.ok) { sound('up'); addXP(2); } else { sound('bad'); }
        c.gi++; c.gTries = 0; c.inputs[0] = '';
        c.fb = r.ok ? fbBox('ok', 'happy', '✔ Genau! ' + (c.gi < task.guided.length ? 'Nächster Schritt …' : 'Jetzt schreib alles zusammen auf.')) : fbBox('bad', 'think', `Das wäre <b>${esc(window.CHECK.answerText(g))}</b>. Ich hab es eingetragen – weiter geht's!`);
        renderSession();
        return;
      }
      c.gTries++;
      sound('bad'); vib(60);
      const d = app.querySelector('.display'); d && d.classList.add('bad');
      setFb(fbBox('bad', 'think', (r.msg || 'Noch nicht ganz.') + ' 💡 ' + (task.hint || '')));
      return;
    }
    // --- Endergebnis ---
    let input;
    if (task.kind === 'mc') input = mcIdx;
    else if (task.kind === 'multi') input = c.inputs;
    else input = c.inputs[0];
    const r = window.CHECK.check(task, input);
    if (r.empty || r.invalid) { toast(r.msg); return; }
    if (r.ok) return success(c.attempts === 0 ? 1 : 0.5);
    if (r.close && c.closeMsgs < 2 && SESS.mode !== 'check') { c.closeMsgs++; setFb(fbBox('hint', 'think', r.msg)); sound('tap'); return; }
    if (r.gap) SESS.gaps.push(r.gap);
    c.attempts++;
    c.lastGap = r.gap || c.lastGap;
    sound('bad'); vib(80);
    if (task.kind === 'mc') { const b = app.querySelectorAll('.choice')[mcIdx]; b && b.classList.add('bad'); }
    else app.querySelectorAll('.display').forEach((d) => d.classList.add('bad'));
    const finalFail = c.attempts >= 2 || SESS.mode === 'check' || (task.kind === 'mc' && task.choices.length <= 2);
    if (!finalFail) {
      setFb(fbBox('bad', 'think', (r.msg ? r.msg + '<br>' : '') + pick(RETRY)));
      if (task.kind === 'mc') { const b = app.querySelectorAll('.choice')[mcIdx]; if (b) b.disabled = true; }
      return;
    }
    fail(r);
  }

  function success(q) {
    const c = SESS.cur, task = c.task;
    c.finished = true;
    SESS.combo++;
    SESS.maxCombo = Math.max(SESS.maxCombo, SESS.combo);
    let xp = q === 1 ? 10 + 5 * (c.lvl - 1) : 5;
    if (SESS.combo >= 3) xp += 2 * Math.min(SESS.combo, 5);
    if (c.hint) xp = Math.max(3, xp - 3);
    if (SESS.mode === 'boss') xp = Math.round(xp * 1.5);
    record(c.id, c.lvl, q, null);
    SESS.results.push({ id: c.id, q });
    SESS.xp += xp;
    addXP(xp);
    sound('ok'); vib(30);
    fx(pick(PRAISE), Math.random() < 0.5 ? 'pink' : '');
    xpFloat(xp);
    if (SESS.combo === 5 || SESS.combo === 10) confetti(30);
    if (SESS.mode === 'boss') {
      SESS.hp--;
      setTimeout(() => { const f = $('#bossFace'); if (f) { f.classList.add('hit'); sound('hit'); } }, 150);
    }
    const praise = SESS.combo >= 3 ? `Combo x${SESS.combo}! Du bist on fire! 🔥` : pick(['Richtig! Super gemacht! 🎉', 'Ja, genau so! ✨', 'Klasse! Kiko ist stolz auf dich! 🦊', 'Treffer! 💥']);
    if (task.kind === 'mc') { const b = app.querySelectorAll('.choice')[task.correct]; b && b.classList.add('ok'); }
    else app.querySelectorAll('.display').forEach((d) => d.classList.add('ok'));
    c.fb = fbBox('ok', 'cheer', '<b>' + praise + '</b>' + (q < 1 ? '<br>Beim zweiten Versuch – stark, nicht aufgegeben!' : ''), c.attempts > 0 || c.lvl >= 2 ? stepsHtml(task) : '');
    renderSession();
    if (SESS.mode === 'boss' && SESS.hp <= 0) setTimeout(() => finish(), 900);
  }

  function fail(r) {
    const c = SESS.cur, task = c.task;
    c.finished = true;
    SESS.combo = 0;
    record(c.id, c.lvl, 0, c.lastGap);
    SESS.results.push({ id: c.id, q: 0 });
    let extra = '';
    if (SESS.mode === 'boss') { SESS.hearts--; extra = SESS.hearts > 0 ? ` Du hast noch ${SESS.hearts} ❤️.` : ''; }
    const gapNote = c.lastGap && byId[c.lastGap] && c.lastGap !== c.id ? `<br>🧩 Das hat mit <b>${byId[c.lastGap].title}</b> zu tun – das üben wir gleich nochmal extra.` : '';
    c.fb = fbBox('bad', 'sad', `Die richtige Antwort ist <b>${window.CHECK.answerText(task)}</b>.${extra}${gapNote}`, stepsHtml(task));
    if (task.kind === 'mc') { const b = app.querySelectorAll('.choice')[task.correct]; b && b.classList.add('ok'); }
    renderSession();
    if (SESS.mode === 'boss' && SESS.hearts <= 0) setTimeout(() => finish(), 1400);
  }

  function record(id, lvl, q, gap) {
    const st = tp(id);
    st.seen++; st.last = Date.now(); S.totalTasks++;
    if (q > 0) {
      st.ok++; S.totalOk++;
      const gain = (q === 1 ? 9 : 4) * (0.6 + 0.2 * lvl) * (1 - st.m / 115);
      st.m = Math.min(100, st.m + gain);
      if (q === 1) st.streak++;
      st.wrongRow = 0;
      if (st.streak >= 4 && st.lvl < 3 && st.m >= st.lvl * 25 && SESS.mode !== 'check') { st.lvl++; st.streak = 0; setTimeout(() => toast(`⬆️ ${byId[id].title}: Stufe ${st.lvl} freigeschaltet! ${lvlStars(st.lvl)}`), 600); }
      if (q === 1 && S.gaps[id]) S.gaps[id] = Math.max(0, S.gaps[id] - 0.5);
    } else {
      st.bad++;
      st.m = Math.max(0, st.m - 7);
      st.streak = 0;
      st.wrongRow++;
      if (st.wrongRow % 2 === 0 && st.lvl > 1) st.lvl--;
      if (gap && byId[gap]) S.gaps[gap] = (S.gaps[gap] || 0) + 1;
    }
    const days = st.m < 40 ? 1 : st.m < 70 ? 2 : st.m < 90 ? 5 : 10;
    st.due = Date.now() + days * 864e5;
    S.history.push([Date.now(), id, q]);
    if (S.history.length > 600) S.history.splice(0, S.history.length - 600);
    save();
  }

  function advance() {
    if (!SESS) return;
    SESS.i++;
    SESS.cur = null;
    if (SESS.mode === 'boss' && (SESS.hp <= 0 || SESS.hearts <= 0)) return finish();
    if (SESS.mode === 'boss' && SESS.i >= SESS.queue.length) SESS.queue.push(SESS.topic);
    if (SESS.i >= SESS.queue.length) return finish();
    renderSession();
    window.scrollTo(0, 0);
  }

  function finish() {
    const s = SESS; if (!s || s.done) return;
    s.done = true;
    const total = s.results.length, okN = s.results.filter((r) => r.q > 0).length, first = s.results.filter((r) => r.q === 1).length;
    const ratio = total ? okN / total : 0;
    let title, mood = 'cheer', bonus = 0, extraHtml = '';
    if (s.mode === 'boss') {
      const t = byId[s.topic];
      if (s.hp <= 0) {
        title = 'SIEG! 🏆'; mood = 'wow'; bonus = 50;
        tp(s.topic).boss = true;
        award('t_' + s.topic); award('s_first');
        extraHtml = `<p><b>${t.boss.name}</b> ist besiegt!</p>`;
        sound('win'); confetti(80);
      } else {
        title = 'Fast geschafft!'; mood = 'sad';
        extraHtml = `<p>${t.boss.name} war diesmal stärker. Übe noch ein bisschen und fordere ihn wieder heraus! 💪</p>`;
      }
    } else if (s.mode === 'check') {
      title = 'Test fertig! 🧪';
      S.checkup = true; award('s_check');
      const strong = [], weak = [];
      CHECKUP.forEach(([id], k) => {
        const r = s.results[k]; if (!r) return;
        const st = tp(id);
        if (r.q > 0) { st.m = Math.max(st.m, 40); if (!strong.includes(id)) strong.push(id); }
        else { S.gaps[id] = (S.gaps[id] || 0) + 1; if (!weak.includes(id)) weak.push(id); }
      });
      save();
      extraHtml = `${strong.length ? `<p>💪 <b>Das kannst du schon:</b><br>${strong.map((id) => byId[id].emoji + ' ' + byId[id].title).join(', ')}</p>` : ''}
        ${weak.length ? `<p>🧩 <b>Da üben wir zusammen:</b><br>${weak.map((id) => byId[id].emoji + ' ' + byId[id].title).join(', ')}</p>` : ''}`;
      bonus = 20;
    } else {
      title = ratio >= 0.9 ? 'SUGOI! 🌟' : ratio >= 0.7 ? 'Stark gemacht! 💪' : ratio >= 0.5 ? 'Gut gekämpft! ⚔️' : 'Nicht aufgeben! 🌱';
      mood = ratio >= 0.7 ? 'wow' : ratio >= 0.5 ? 'happy' : 'think';
      if (s.mode === 'mission' && !S.missions[today()]) { S.missions[today()] = true; bonus = 20; award('s_mission'); }
      if (ratio >= 0.7) { sound('win'); confetti(ratio >= 0.9 ? 70 : 35); }
    }
    if (total >= 8 && first === total) award('s_perfect');
    if (bonus) { addXP(bonus); s.xp += bonus; }
    // Lücken-Hinweis
    const gapCount = {};
    s.gaps.forEach((g) => (gapCount[g] = (gapCount[g] || 0) + 1));
    const gapId = Object.keys(gapCount).sort((a, b) => gapCount[b] - gapCount[a])[0];
    let advice = '';
    if (gapId && byId[gapId] && s.mode !== 'check') advice = `Mir ist aufgefallen: Ein paar Fehler kamen von <b>${byId[gapId].title}</b>. Wenn wir das festigen, klappt der Rest viel leichter! <br><button class="btn small pink" data-act="gap" data-arg="${gapId}">🧩 Lücke schließen</button>`;
    else if (s.mode === 'practice' && ratio < 0.5) advice = 'Das Thema ist noch neu für dich – das ist völlig okay! Schau dir die Erklärung nochmal an, dann klappt es besser. <br><button class="btn small pink" data-act="learnAgain">📖 Erklärung</button>';
    else if (s.mode === 'check') advice = 'Super, jetzt weiß ich, wo wir anfangen! Ab jetzt mische ich dir jeden Tag die passenden Aufgaben in der <b>Tagesmission</b>. ⚔️';
    else advice = pick(['Jeden Tag ein bisschen – so wirst du richtig stark! 💪', 'Du wirst immer besser, ich sehe das genau! 👀✨', 'Mathe-Power wächst mit jedem Training! ⚡']);
    const changes = Object.keys(s.startM).map((id) => `<div class="pi"><span class="n">${byId[id].emoji} ${byId[id].title}</span><span class="bar ${tp(id).m >= 80 ? 'green' : 'pink'}"><i style="width:${tp(id).m}%"></i></span><span class="p">${pct(tp(id).m)}%</span></div>`).join('');
    const stickers = newStickers.splice(0);
    app.innerHTML = topbar(MODE_TITLE[s.mode]) + `
      <div class="panel result tilt">
        <div style="width:120px;margin:0 auto">${window.ART.kiko(mood)}</div>
        <h1>${title}</h1>${extraHtml}
        ${s.mode !== 'check' || true ? `<div class="stats"><div class="stat"><div class="v">${okN}/${total}</div><div class="l">richtig</div></div><div class="stat"><div class="v">+${s.xp}</div><div class="l">XP</div></div><div class="stat"><div class="v">x${s.maxCombo}</div><div class="l">beste Combo</div></div></div>` : ''}
      </div>
      ${stickers.length ? `<div class="panel center"><h3>🎁 Neue Sticker!</h3><div class="album">${stickers.map((st) => `<div class="card new"><div class="shine"></div><div class="e">${st.e}</div><div class="n">${st.n}</div></div>`).join('')}</div></div>` : ''}
      <div class="sensei">${window.ART.kiko('happy')}<div class="bubble">${advice}</div></div>
      <div class="panel plist"><h3>📈 Dein Stand</h3>${changes}</div>
      <div class="row"><button class="btn white grow" data-act="again">🔁 Nochmal</button><button class="btn pink grow" data-act="home">Fertig ✔</button></div>`;
    ACT = {
      back,
      home: () => { SESS = null; location.replace('#/'); },
      again: () => { const o = { mode: s.mode, topic: s.topic, band: s.band }; if (o.mode === 'exam') { SESS = null; examPick(); } else startSession(o); },
      gap: (id) => startSession({ mode: 'practice', topic: id }),
      learnAgain: () => go('learn/' + s.topic),
    };
    window.scrollTo(0, 0);
  }

  // ================= Album, Formeln, Fortschritt, Einstellungen =================
  function album() {
    const have = Object.keys(S.stickers).length;
    app.innerHTML = topbar('🃏 Sammelalbum') + `
      <div class="sensei">${window.ART.kiko('wow')}<div class="bubble">Du hast <b>${have} von ${STICKERS.length}</b> Stickern! Besiege Bosse und sammle Erfolge, um alle zu bekommen. ✨</div></div>
      <div class="panel"><div class="album">${STICKERS.map((s) => S.stickers[s.id]
        ? `<div class="card"><div class="shine"></div><div class="e">${s.e}</div><div class="n">${s.n}</div></div>`
        : `<div class="card locked"><div class="e">${s.e}</div><div class="n">???</div><div class="small muted" style="font-size:10px">${s.how}</div></div>`).join('')}</div></div>`;
    ACT = { back };
  }

  function formeln() {
    app.innerHTML = topbar('📌 Formelsammlung') + [8, 9, 10].map((b) => `<div class="chapno">${BANDS[b]}</div>` + TOP.filter((t) => t.band === b).map((t) => `
      <div class="panel"><h3>${t.emoji} ${t.title}</h3>${t.formulas.map((f) => `<div class="formula">${f}</div>`).join('')}</div>`).join('')).join('');
    ACT = { back };
  }

  function progress() {
    const days = Array.from({ length: 14 }, (_, k) => { const d = new Date(Date.now() - (13 - k) * 864e5); return { k: dayKey(d), l: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][d.getDay()] }; });
    const maxXp = Math.max(DAILY_GOAL, ...days.map((d) => S.days[d.k] || 0));
    const weekAgo = Date.now() - 7 * 864e5;
    const recent = S.history.filter((h) => h[0] > weekAgo);
    const acc = recent.length ? Math.round(recent.filter((h) => h[2] > 0).length / recent.length * 100) : null;
    const activeDays = days.slice(7).filter((d) => S.days[d.k]).length;
    const weak = weakTopics();
    const strong = TOP.filter((t) => tp(t.id).m >= 70);
    app.innerHTML = topbar('📊 Fortschritt') + `
      <div class="panel"><h3>Letzte 14 Tage (XP)</h3>
        <div class="days">${days.map((d) => `<div style="height:${(S.days[d.k] || 0) / maxXp * 100}%" title="${S.days[d.k] || 0} XP"></div>`).join('')}</div>
        <div class="dlabels">${days.map((d) => `<span>${d.l}</span>`).join('')}</div>
        <div class="stats"><div class="stat"><div class="v">${S.totalOk}</div><div class="l">richtig gesamt</div></div><div class="stat"><div class="v">${acc === null ? '–' : acc + '%'}</div><div class="l">Trefferquote (7 T.)</div></div><div class="stat"><div class="v">${activeDays}/7</div><div class="l">Lerntage</div></div></div>
      </div>
      <div class="panel"><h3>👨‍👩‍👧 Für Eltern</h3>
        <p class="small">${S.totalTasks ? `${esc(S.name)} hat insgesamt <b>${S.totalTasks}</b> Aufgaben bearbeitet, davon <b>${S.totalOk}</b> richtig. In den letzten 7 Tagen wurde an <b>${activeDays}</b> Tagen gelernt.` : 'Noch keine Aufgaben bearbeitet.'}</p>
        <p class="small"><b>Hier braucht ${esc(S.name)} noch Übung:</b> ${weak.length ? weak.slice(0, 6).map((t) => `${t.emoji} ${t.title} (${pct(tp(t.id).m)} %)`).join(', ') : 'nichts Auffälliges 👍'}</p>
        <p class="small"><b>Das sitzt schon gut:</b> ${strong.length ? strong.map((t) => `${t.emoji} ${t.title}`).join(', ') : 'noch nichts über 70 % – das kommt!'}</p>
        <p class="small muted">Die App erkennt typische Fehler (z. B. Vorzeichen, nur das erste Glied malgenommen) und übt die zugehörigen Grundlagen automatisch in der Tagesmission und im Schwächen-Training.</p>
      </div>
      ${[8, 9, 10].map((b) => `<div class="panel plist"><h3>${BANDS[b]}</h3>${TOP.filter((t) => t.band === b).map((t) => `<div class="pi"><span class="n">${t.emoji} ${t.title}</span><span class="bar ${tp(t.id).m >= 80 ? 'green' : 'pink'}"><i style="width:${tp(t.id).m}%"></i></span><span class="p">${tp(t.id).seen ? pct(tp(t.id).m) + '%' : '–'}</span></div>`).join('')}</div>`).join('')}`;
    ACT = { back };
  }

  function settings() {
    const tg = (k) => `<button class="toggle ${S.settings[k] ? 'on' : ''}" data-act="tg" data-arg="${k}" aria-label="umschalten"></button>`;
    app.innerHTML = topbar('⚙️ Einstellungen') + `
      <div class="panel">
        <div class="setting"><span>Name</span><input id="nm" value="${esc(S.name)}" maxlength="20" style="font:inherit;border:3px solid var(--ink);border-radius:10px;padding:6px;width:150px"></div>
        <div class="setting"><span>🔊 Töne</span>${tg('sound')}</div>
        <div class="setting"><span>📳 Vibration</span>${tg('vib')}</div>
        <div class="setting"><span>🐾 Schritt-für-Schritt-Hilfe</span><select id="gd"><option value="auto">automatisch</option><option value="always">immer</option><option value="off">aus</option></select></div>
      </div>
      <div class="panel">
        <h3>🔄 Updates</h3>
        <p class="small">Version <b>${VERSION}</b>. Die App sucht beim Start und alle 24 Stunden automatisch nach neuen Versionen.</p>
        <button class="btn cyan block" data-act="upd">Jetzt nach Updates suchen</button>
      </div>
      <div class="panel">
        <h3>💾 Sicherung</h3>
        <p class="small">Fortschritt auf ein anderes Gerät mitnehmen: Code kopieren und dort bei „Einfügen“ eintragen.</p>
        <div class="row"><button class="btn small white grow" data-act="exp">📤 Code kopieren</button><button class="btn small white grow" data-act="imp">📥 Einfügen</button></div>
        <textarea id="bk" class="hidden" placeholder="Sicherungs-Code hier einfügen"></textarea>
        <button class="btn small green block hidden" id="bkgo" data-act="impgo" style="margin-top:8px">Wiederherstellen</button>
      </div>
      <div class="panel">
        <h3>🧪 Einstufungstest</h3>
        <p class="small">Nochmal testen, wo du gerade stehst.</p>
        <button class="btn white block" data-act="check">Test starten</button>
      </div>
      <div class="panel"><button class="btn white block" data-act="reset">🗑️ Fortschritt löschen</button></div>
      <p class="center small" style="color:#fff;opacity:.7">Tias Mathe-Quest · mit 🦊 und ❤️ gemacht</p>`;
    $('#gd').value = S.settings.guided;
    $('#gd').onchange = (e) => { S.settings.guided = e.target.value; save(); };
    $('#nm').onchange = (e) => { S.name = e.target.value.trim() || 'Tia'; save(); };
    ACT = {
      back,
      tg: (k, el) => { S.settings[k] = !S.settings[k]; el.classList.toggle('on', S.settings[k]); save(); },
      upd: () => checkUpdate(true),
      check: () => startSession({ mode: 'check' }),
      exp: async () => {
        const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
        try { await navigator.clipboard.writeText(code); toast('Code kopiert! 📋'); } catch (e) { const b = $('#bk'); b.classList.remove('hidden'); b.value = code; b.select(); toast('Code unten markieren und kopieren'); }
      },
      imp: () => { $('#bk').classList.remove('hidden'); $('#bkgo').classList.remove('hidden'); $('#bk').value = ''; $('#bk').focus(); },
      impgo: () => {
        try {
          const o = JSON.parse(decodeURIComponent(escape(atob($('#bk').value.trim()))));
          if (!o || typeof o.xp !== 'number' || !o.topics) throw new Error();
          S = Object.assign(DEF(), o); save(); toast('Fortschritt wiederhergestellt ✔'); go('');
        } catch (e) { toast('Der Code ist ungültig.'); }
      },
      reset: () => {
        const m = modal(`${window.ART.kiko('sad')}<h2>Wirklich löschen?</h2><p>Alle Punkte, Sticker und der Lernstand gehen verloren.</p><div class="row"><button class="btn white grow" data-close>Abbrechen</button><button class="btn pink grow" id="rs">Löschen</button></div>`);
        $('#rs', m.el).onclick = () => { S = DEF(); save(); m.close(); toast('Neu gestartet 🌱'); go(''); };
      },
    };
  }

  // ================= Updates =================
  const UPD = { pending: null, shown: false, modal: null };
  function newer(a, b) {
    const x = String(a).split('.').map((n) => parseInt(n, 10) || 0), y = String(b).split(/[.-]/).map((n) => parseInt(n, 10) || 0);
    for (let k = 0; k < Math.max(x.length, y.length); k++) if ((x[k] || 0) !== (y[k] || 0)) return (x[k] || 0) > (y[k] || 0);
    return false;
  }
  function inSession() { return /^#\/(practice|mission|train|boss|check|exam)/.test(location.hash) && SESS && !SESS.done; }
  function onUpdate(s) {
    if (s.state === 'available') {
      UPD.pending = s;
      if (!inSession()) { UPD.shown = true; showUpdate(s); }
      return;
    }
    if (s.state === 'uptodate') { closeUpd(); toast(`Du hast schon die neueste Version (${esc(s.version || VERSION)}) ✔`); return; }
    if (s.state === 'checking') { toast('Suche nach Updates …', 1500); return; }
    if (s.state === 'error') { updModal(`${window.ART.kiko('sad')}<h2>Hoppla</h2><p>${esc(s.message)}</p><button class="btn pink block" data-close>OK</button>`); return; }
    if (s.state === 'downloading') { updModal(`${window.ART.kiko('think')}<h2>Lade Update …</h2><div class="bar pink" style="margin:12px 0"><i style="width:${s.progress || 0}%"></i></div><p class="small">${s.progress || 0} %</p>`); return; }
    if (s.state === 'installing') { updModal(`${window.ART.kiko('cheer')}<h2>Fast fertig!</h2><p>Tippe gleich auf <b>„Aktualisieren“</b> bzw. <b>„Installieren“</b>. Dein Fortschritt bleibt erhalten. 💾</p><button class="btn white block" data-close>OK</button>`); return; }
    if (s.state === 'needsPermission') {
      updModal(`${window.ART.kiko('think')}<h2>Einmal erlauben</h2><p>Android fragt zur Sicherheit, ob diese App Updates installieren darf.</p><p class="small">Tippe auf <b>Einstellungen öffnen</b>, schalte <b>„Dieser Quelle vertrauen“</b> bzw. <b>„Apps aus dieser Quelle zulassen“</b> ein und komm zurück.</p><button class="btn pink block" id="perm">Einstellungen öffnen</button><button class="btn white block" style="margin-top:8px" data-close>Später</button>`);
      const b = $('#perm'); if (b) b.onclick = () => NATIVE.openInstallSettings();
    }
  }
  function closeUpd() { if (UPD.modal) { UPD.modal.close(); UPD.modal = null; } }
  function updModal(html) { closeUpd(); UPD.modal = modal(html, () => (UPD.modal = null)); }
  function showUpdate(s) {
    updModal(`${window.ART.kiko('wow')}<h2>✨ Neues Update!</h2><p>Version <b>${esc(s.version)}</b> ist da – mit Verbesserungen und neuen Aufgaben. Dein Fortschritt bleibt erhalten.</p><button class="btn pink block" id="doUpd">🚀 Jetzt aktualisieren</button><button class="btn white block" style="margin-top:8px" data-close>Später</button>`);
    $('#doUpd').onclick = () => { if (NATIVE) NATIVE.installUpdate(); else applyWebUpdate(); };
  }
  function checkUpdate(manual) {
    try { localStorage.setItem('tmqLastCheck', String(Date.now())); } catch (e) { /* egal */ }
    if (NATIVE) { NATIVE.checkUpdate(!!manual); return; }
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then((r) => r.json()).then((j) => {
      if (j.version && !String(j.version).startsWith('__') && newer(j.version, VERSION)) onUpdate({ state: 'available', version: j.version });
      else if (manual) onUpdate({ state: 'uptodate', version: VERSION });
    }).catch(() => { if (manual) toast('Keine Verbindung – bitte später nochmal probieren.'); });
  }
  function applyWebUpdate() {
    updModal(`${window.ART.kiko('cheer')}<h2>Aktualisiere …</h2><p>Einen Moment, die neue Version wird geladen.</p>`);
    let reloaded = false;
    const reload = () => { if (!reloaded) { reloaded = true; location.reload(); } };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', reload);
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return reload();
        const skip = (sw) => sw && sw.postMessage({ type: 'SKIP_WAITING' });
        if (reg.waiting) return skip(reg.waiting);
        reg.update().then(() => {
          const sw = reg.installing || reg.waiting;
          if (!sw) return reload();
          if (sw.state === 'installed') skip(sw);
          sw.addEventListener('statechange', () => { if (sw.state === 'installed') skip(sw); });
        }).catch(reload);
      }).catch(reload);
    }
    setTimeout(reload, 8000);
  }
  function initUpdates() {
    window.onNativeUpdate = (json) => { try { onUpdate(JSON.parse(json)); } catch (e) { /* egal */ } };
    if (!NATIVE && 'serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    const due = () => Date.now() - (+localStorage.getItem('tmqLastCheck') || 0) > 864e5;
    setTimeout(() => checkUpdate(false), 3500);
    setInterval(() => { if (due()) checkUpdate(false); }, 36e5);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && due()) checkUpdate(false); });
  }

  // ================= Router =================
  const ROUTES = {
    '': home, kapitel, topic: topicView, learn, album, formeln, progress, settings,
    practice: (id) => sessionRoute('practice', id), boss: (id) => sessionRoute('boss', id),
    mission: () => sessionRoute('mission'), train: () => sessionRoute('train'), check: () => sessionRoute('check'), exam: () => sessionRoute('exam'),
  };
  function render() {
    const h = location.hash.replace(/^#\/?/, '');
    const [r, ...args] = h.split('/');
    document.querySelectorAll('.modal').forEach((m) => { if (m !== (UPD.modal && UPD.modal.el)) m.remove(); });
    if (SESS && SESS.done && !/^(practice|mission|train|boss|check|exam)$/.test(r)) SESS = null;
    (ROUTES[r] || home)(...args.map(decodeURIComponent));
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', render);

  // ================= Start =================
  $('#splashKiko').outerHTML = window.ART.kiko('cheer');
  if (location.hash && location.hash !== '#/') { history.replaceState(null, '', '#/'); }
  render();
  setTimeout(() => {
    const sp = $('#splash');
    sp.classList.add('out');
    setTimeout(() => sp.remove(), 600);
  }, 3000);
  initUpdates();
  window.__tmq = { get S() { return S; }, get SESS() { return SESS; }, startSession, record };
})();
