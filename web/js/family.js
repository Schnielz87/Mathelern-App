/* Familien-Kopplung: Die App des Kindes schickt den Lernstand Ende-zu-Ende-verschlüsselt an die Eltern-App.
   Kopplung per QR-Code (enthält Kanal + Schlüssel). Der Weiterleitungsdienst sieht nur Chiffretext. */
(function (root) {
  'use strict';
  const RELAY = 'https://ntfy.sh/';
  const PWA_URL = (root.EDITION && root.EDITION.pwa) || 'https://schnielz87.github.io/Mathelern-App/';
  const PUB_GAP = 3 * 60 * 1000;
  const A = () => root.APP;
  const $ = (s, r = document) => r.querySelector(s);

  // ---------------- Krypto (AES-GCM 256) ----------------
  const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
  const rand = (n) => crypto.getRandomValues(new Uint8Array(n));
  const ALPH = 'abcdefghijkmnpqrstuvwxyz23456789';
  const newTopic = () => 'tmq-' + Array.from(rand(20), (b) => ALPH[b % ALPH.length]).join('');
  const keyOf = (k) => crypto.subtle.importKey('raw', unb64u(k), 'AES-GCM', false, ['encrypt', 'decrypt']);
  async function seal(k, obj) {
    const iv = rand(12);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyOf(k), new TextEncoder().encode(JSON.stringify(obj)));
    const out = new Uint8Array(12 + ct.byteLength); out.set(iv); out.set(new Uint8Array(ct), 12);
    return 'tmq1:' + b64u(out);
  }
  async function open(k, text) {
    if (!String(text).startsWith('tmq1:')) return null;
    try {
      const d = unb64u(text.slice(5));
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: d.slice(0, 12) }, await keyOf(k), d.slice(12));
      return JSON.parse(new TextDecoder().decode(pt));
    } catch (e) { return null; }
  }
  const cryptoOk = () => !!(root.crypto && crypto.subtle);

  // ---------------- Weiterleitung ----------------
  async function post(p, obj) {
    const body = await seal(p.key, obj);
    const r = await fetch(RELAY + p.topic, { method: 'POST', body, headers: { 'Cache': 'yes' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
  }
  async function poll(p) {
    const r = await fetch(RELAY + p.topic + '/json?poll=1&since=all', { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const out = [];
    for (const line of (await r.text()).split('\n')) {
      if (!line.trim()) continue;
      try { const m = JSON.parse(line); if (m.event === 'message' && m.message) { const o = await open(p.key, m.message); if (o) out.push(o); } } catch (e) { /* weiter */ }
    }
    return out;
  }

  // ---------------- Lernstand (Kind) ----------------
  function snapshot() {
    const { S, TOP, tp, rankIdx, rankName, dayKey } = A();
    const days = {};
    for (let k = 0; k < 14; k++) { const d = dayKey(new Date(Date.now() - k * 864e5)); if (S.days[d]) days[d] = S.days[d]; }
    const weekAgo = Date.now() - 7 * 864e5;
    const recent = S.history.filter((h) => h[0] > weekAgo);
    const topics = {};
    TOP.forEach((t) => { const st = tp(t.id); if (st.seen || st.learned) topics[t.id] = [Math.round(st.m), st.seen, st.ok, st.bad, Math.round(st.last / 1000), st.boss ? 1 : 0, st.lvl]; });
    const errs = {};
    S.history.slice(-60).forEach((h) => { if (h[2] === 0) errs[h[1]] = (errs[h[1]] || 0) + 1; });
    const gaps = {};
    Object.entries(S.gaps).forEach(([k, v]) => { if (v >= 1) gaps[k] = Math.round(v); });
    return {
      type: 'snap', v: 1, at: Date.now(), name: S.name, xp: S.xp, rank: rankName(rankIdx(S.xp)), gender: S.gender || '', streak: S.streak.n, sLast: S.streak.last,
      days, ok: S.totalOk, tasks: S.totalTasks, acc7: recent.length ? Math.round(recent.filter((h) => h[2] > 0).length / recent.length * 100) : null,
      n7: recent.length, topics, gaps, errs, stickers: Object.keys(S.stickers).length, missions: Object.keys(S.missions).filter((d) => d >= dayKey(new Date(weekAgo))).length,
      checkup: S.checkup,
    };
  }

  async function publish(force) {
    const { S, save } = A();
    const p = S.pair;
    if (!p || !cryptoOk()) return;
    if (!force && Date.now() - (p.lastPub || 0) < PUB_GAP) return;
    try { await post(p, snapshot()); p.lastPub = Date.now(); p.err = ''; save(); }
    catch (e) { p.err = 'Senden gerade nicht möglich (kein Internet?)'; save(); }
  }

  /** Kind: neue Mut-Nachrichten der Eltern holen. */
  async function checkCheers() {
    const { S, save, modal, esc } = A();
    const p = S.pair;
    if (!p || !cryptoOk() || Date.now() - (p.lastPoll || 0) < 60 * 1000) return;
    p.lastPoll = Date.now();
    try {
      const msgs = (await poll(p)).filter((m) => m.type === 'cheer' && m.at > (p.lastCheer || 0)).sort((a, b) => a.at - b.at);
      if (!msgs.length) return;
      p.lastCheer = msgs[msgs.length - 1].at; save();
      const m = msgs[msgs.length - 1];
      if (/^#\/(practice|mission|train|boss|check|exam)/.test(location.hash)) return;
      modal(`${root.ART.kiko('wow')}<h2>💌 Nachricht von ${esc(m.from || 'Mama')}</h2><p style="font-size:22px;font-weight:900">${esc(m.text)}</p><button class="btn pink block" data-close>Danke! ❤️</button>`);
      A().sound('win');
    } catch (e) { /* später */ }
  }

  // ---------------- Tipps für Eltern ----------------
  const TIPS = {
    neg: 'Zeig {N} das Thermometer oder den Kontostand: „Du hast 5 €, gibst 8 € aus – wie viel fehlt?“ So werden Minuszahlen greifbar.',
    brueche: 'Pizza oder Schokolade teilen hilft: „Wie viel ist ¾ von 12 Stückchen?“ – erst durch 4, dann mal 3.',
    terme: 'Lass {N} Alltagssätze übersetzen: „3 Mangas zu je x € und 2 € Versand“ → 3x + 2. Wie ein Geheimcode.',
    zusammen: 'Äpfel & Bonbons: Nur Gleiches darf zusammen. Lass sie die x-Glieder farbig unterstreichen.',
    ausmult: 'Frag {N}: „Wer schüttelt wem die Hand?“ Bei 3(x + 4) muss die 3 BEIDEN die Hand geben: 3x + 12. Der häufigste Fehler ist, die zweite Zahl zu vergessen. Lass sie Pfeile malen!',
    ausklammern: 'Ausklammern ist rückwärts ausmultiplizieren. Zur Probe immer wieder ausmultiplizieren lassen – dann merkt sie Fehler selbst.',
    gleich: 'Die Waage-Idee: „Was du links machst, musst du auch rechts machen.“ Eine Küchenwaage macht es anschaulich.',
    prozent: 'Beim Einkaufen üben: „20 % Rabatt auf 40 € – wie viel sparst du?“ Trick: erst 10 % (Komma verschieben), dann verdoppeln.',
    zins: 'Zinsen sind Prozentrechnung mit Geld auf der Bank. Ein Sparbuch-Beispiel mit ihrem Taschengeld motiviert.',
    dreisatz: 'Kochen nach Rezept ist Dreisatz pur: „Für 4 Personen 200 g – wie viel für 6?“ Erst auf 1 rechnen.',
    flaechen: 'Fliesen oder ein Zimmer ausmessen lassen. Dreieck = halbes Rechteck – mit Papier falten zeigen.',
    kreis: 'Mit einem Teller und einer Schnur ausprobieren: Der Umfang ist gut 3-mal so lang wie der Durchmesser (π).',
    potenzen: 'Häufiger Fehler: 2⁵ ist NICHT 2·5. Lass {N} es ausschreiben: 2·2·2·2·2.',
    wurzel: 'Die Quadratzahlen bis 15² wie ein Lied auswendig lernen – dann sind Wurzeln ein Kinderspiel.',
    pythagoras: 'Tipp: Erst die längste Seite (gegenüber vom rechten Winkel) markieren. Beispiel: Leiter an der Wand.',
    linfkt: 'Handytarif-Beispiel: Grundgebühr = b, Preis pro GB = m. So werden Funktionen alltagsnah.',
    ausmult2: '„Jeder mit jedem“: Bei zwei Klammern gibt es immer 4 Ergebnisse. Nachzählen lassen!',
    gleich2: 'Bei Textaufgaben zuerst fragen: „Was suchen wir? Das ist x.“ Erst dann rechnen.',
    koerper: 'Mit echten Verpackungen (Milchtüte, Dose) Volumen ausrechnen und mit der Angabe vergleichen.',
    statistik: 'Eigene Daten nutzen: Noten, Bildschirmzeit der Woche – Mittelwert und Median ausrechnen.',
    wkeit: 'Würfeln und mitzählen: Nach 60 Würfen kommt die 6 ungefähr 10-mal. Das macht Spaß und überzeugt.',
    binom: 'Der Klassiker-Fehler: (x + 3)² ist nicht x² + 9. Der Mittelteil 2·x·3 fehlt oft.',
    lgs: 'Zwei-Rätsel-Spiel: „2 Mangas und 1 Poster kosten 19 €, 1 Manga und 1 Poster 12 €.“ Zusammen knobeln.',
    quadrat: 'x² = 25 hat ZWEI Lösungen (5 und −5) – daran gern erinnern.',
    koerper2: 'Eine Eistüte (Kegel) passt dreimal in einen gleich großen Becher – daher das ⅓ in der Formel.',
    massstab: 'Mit einer echten Wanderkarte Strecken messen und umrechnen – macht Lust auf den nächsten Ausflug.',
    trigo: 'Merksatz zusammen sprechen: „Gute Hunde (sin = G/H) · Auf Höfen (cos = A/H) · Gehen Aus (tan = G/A)“.',
    wachstum: 'Zinseszins wie ein Schneeball: Lass {N} ausrechnen, wie das Ersparte in 5 Jahren wächst.',
  };

  function tipsFor(sn) {
    const { byId } = A();
    const nm = (t) => String(t || '').replace(/\{N\}/g, sn.name || 'dein Kind');
    const out = [];
    const lastDay = sn.sLast ? Math.round((Date.now() - new Date(sn.sLast + 'T12:00').getTime()) / 864e5) : null;
    if (lastDay !== null && lastDay >= 2) out.push(['⏰', `${sn.name} hat seit ${lastDay} Tagen nicht geübt. Erinnere freundlich – 10 Minuten am Tag reichen. Am besten zusammen die <b>Tagesmission</b> starten.`]);
    if (sn.streak >= 3 && lastDay !== null && lastDay <= 1) out.push(['🔥', `${sn.n7 ? '' : ''}${sn.name} hat eine Serie von <b>${sn.streak} Tagen</b>! Ein ehrliches Lob wirkt jetzt Wunder.`]);
    if (sn.acc7 !== null && sn.acc7 < 50 && sn.n7 >= 10) out.push(['🤗', `Gerade ist vieles schwer (Trefferquote ${sn.acc7} %). Bitte ermutigen statt Druck machen – die App schaltet automatisch die Schritt-für-Schritt-Hilfe ein.`]);
    if (sn.acc7 !== null && sn.acc7 >= 80 && sn.n7 >= 10) out.push(['🌟', `Super Trefferquote von ${sn.acc7} % diese Woche! Lass dir von ${sn.name} eine Aufgabe erklären – wer erklärt, lernt doppelt.`]);
    const gaps = Object.entries(sn.gaps || {}).filter(([id]) => byId[id]).sort((a, b) => b[1] - a[1]);
    if (gaps.length) {
      const [g] = gaps[0];
      out.push(['🧩', `Die App hat eine <b>Lücke bei den Grundlagen</b> erkannt: <b>${byId[g].title}</b>. Viele Fehler in anderen Themen kommen daher. ${nm(TIPS[g])}`]);
    }
    const weak = Object.entries(sn.topics || {}).filter(([id, a]) => byId[id] && a[1] >= 5 && a[0] < 50).sort((a, b) => a[1][0] - b[1][0]);
    weak.slice(0, 2).forEach(([id, a]) => { if (!gaps.length || gaps[0][0] !== id) out.push([byId[id].emoji, `<b>${byId[id].title}</b> (${a[0]} %): ${nm(TIPS[id])}`]); });
    if (!sn.checkup) out.push(['🧪', `Der <b>Einstufungstest</b> wurde noch nicht gemacht. Er dauert 5 Minuten und hilft der App, die richtigen Aufgaben zu wählen.`]);
    if (sn.stickers >= 3) out.push(['🃏', `${sn.name} hat schon ${sn.stickers} Sticker gesammelt – frag nach den Lieblings-Stickern 😉`]);
    if (!out.length) out.push(['👍', `Alles läuft gut! Weiter so – regelmäßiges kurzes Üben ist am wirksamsten.`]);
    return out;
  }

  // ---------------- Oberflächen ----------------
  function qrSvg(text) {
    const q = root.qrcode(0, 'M'); q.addData(text); q.make();
    return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  }
  const linkOf = (p) => `${PWA_URL}#/pair/${p.topic}.${p.key}`;

  function viewFamily() {
    const { S, topbar, setAct, back, go, app } = A();
    app.innerHTML = topbar('👨‍👩‍👧 Familie') + `
      <div class="sensei">${root.ART.kiko('happy')}<div class="bubble">Hier koppelst du die App mit Mama oder Papa. Dann sehen sie deinen Fortschritt und können dir Mut-Nachrichten schicken. 💌</div></div>
      <button class="tcard" data-act="kid"><span class="e">🦊</span><span class="grow"><span class="t">Ich bin ${A().esc(S.name || 'das Kind')}</span><br><span class="s">${S.pair ? '✔ gekoppelt – QR-Code zeigen' : 'QR-Code für Mama/Papa anzeigen'}</span></span></button>
      <button class="tcard" data-act="parent"><span class="e">👀</span><span class="grow"><span class="t">Ich bin Mama / Papa</span><br><span class="s">${S.parent ? '✔ gekoppelt – Fortschritt ansehen' : 'QR-Code beim Kind scannen'}</span></span></button>`;
    setAct({ back, kid: () => go('koppeln'), parent: () => go('eltern') });
  }

  function viewPair() {
    const { S, save, topbar, setAct, back, app, toast, esc, modal } = A();
    if (!cryptoOk()) { app.innerHTML = topbar('Koppeln') + '<div class="panel">Dieses Gerät unterstützt keine Verschlüsselung.</div>'; setAct({ back }); return; }
    if (!S.pair) { S.pair = { topic: newTopic(), key: b64u(rand(32)), at: Date.now() }; save(); }
    const p = S.pair, link = linkOf(p);
    app.innerHTML = topbar('📲 Mit Mama koppeln') + `
      <div class="panel center">
        <p><b>Mama/Papa:</b> Diesen Code mit der iPhone-Kamera scannen – oder in der App unter <b>Familie → „Ich bin Mama / Papa“ → QR scannen</b>.</p>
        <div class="qr">${qrSvg(link)}</div>
        <div class="row" style="margin-top:10px"><button class="btn small white grow" data-act="share">🔗 Link teilen</button><button class="btn small white grow" data-act="copy">📋 Kopieren</button></div>
        <p class="small muted" style="margin-top:10px">${p.lastPub ? 'Zuletzt gesendet: ' + new Date(p.lastPub).toLocaleString('de-DE') : 'Noch nichts gesendet.'}${p.err ? '<br>' + esc(p.err) : ''}</p>
      </div>
      <div class="panel small">🔒 <b>Datenschutz:</b> Gesendet wird nur der Lernstand (Punkte, Themen in %, Lerntage) – <b>Ende-zu-Ende-verschlüsselt</b>. Der Schlüssel steckt nur in diesem QR-Code. Der Weiterleitungsdienst (ntfy.sh) sieht nur unlesbaren Zeichensalat.</div>
      <div class="row"><button class="btn white grow" data-act="send">📤 Jetzt senden</button><button class="btn white grow" data-act="renew">♻️ Neu koppeln</button></div>`;
    setAct({
      back,
      share: async () => { try { await navigator.share({ title: `${root.EDITION.app} koppeln`, text: `Damit siehst du den Lernfortschritt von ${S.name}:`, url: link }); } catch (e) { copy(link); } },
      copy: () => copy(link),
      send: async () => { await publish(true); toast(S.pair.err ? S.pair.err : 'Lernstand gesendet ✔'); viewPair(); },
      renew: () => {
        const m = modal(`${root.ART.kiko('think')}<h2>Neu koppeln?</h2><p>Der alte Code funktioniert dann nicht mehr. Mama/Papa müssen den neuen Code scannen.</p><div class="row"><button class="btn white grow" data-close>Abbrechen</button><button class="btn pink grow" id="rn">Neu</button></div>`);
        $('#rn', m.el).onclick = () => { S.pair = null; save(); m.close(); viewPair(); };
      },
    });
    publish(true);
    async function copy(t) { try { await navigator.clipboard.writeText(t); toast('Link kopiert 📋'); } catch (e) { toast(t, 6000); } }
  }

  /** Link aus QR-Code oder eingefügt: ...#/pair/<topic>.<key> */
  function parsePair(s) {
    const m = String(s).match(/(tmq-[a-z0-9]{10,40})\.([A-Za-z0-9_-]{40,50})/);
    return m ? { topic: m[1], key: m[2] } : null;
  }
  function acceptPair(arg) {
    const { S, save, go, toast } = A();
    const p = parsePair(arg);
    if (!p) { toast('Der Code ist ungültig.'); go('eltern'); return; }
    S.parent = { ...p, at: Date.now(), snap: null };
    save();
    toast('Gekoppelt! 🎉');
    history.replaceState(null, '', '#/eltern');
    viewParent();
    refreshParent(true);
  }

  async function refreshParent(show) {
    const { S, save, toast } = A();
    const p = S.parent; if (!p) return;
    try {
      const msgs = await poll(p);
      const snaps = msgs.filter((m) => m.type === 'snap').sort((a, b) => b.at - a.at);
      if (snaps[0] && (!p.snap || snaps[0].at > p.snap.at)) p.snap = snaps[0];
      p.lastFetch = Date.now(); p.err = '';
      save();
    } catch (e) { p.err = 'Gerade keine Verbindung.'; }
    if (show && /^#\/eltern/.test(location.hash)) viewParent();
    else if (show) toast(p.err || 'Aktualisiert');
  }

  function viewParent() {
    const { S, save, topbar, setAct, back, app, esc, byId, TOP, BANDS, modal, toast } = A();
    if (!S.parent) {
      app.innerHTML = topbar('👀 Eltern-Ansicht') + `
        <div class="sensei">${root.ART.kiko('happy')}<div class="bubble">Hallo! Scanne den QR-Code, den dein Kind in seiner App unter <b>Familie → „Ich bin …“</b> zeigt. Danach siehst du hier ihren Fortschritt und bekommst Tipps. 🦊</div></div>
        <button class="btn pink block" data-act="scan">📷 QR-Code scannen</button>
        <div class="panel"><p class="small">Oder den Kopplungs-Link einfügen:</p><textarea id="pl" placeholder="https://…#/pair/…"></textarea><button class="btn white block" style="margin-top:8px" data-act="paste">Koppeln</button></div>`;
      setAct({ back, scan: () => scan((t) => acceptPair(t)), paste: () => acceptPair($('#pl').value) });
      return;
    }
    const p = S.parent, sn = p.snap;
    if (!sn) {
      app.innerHTML = topbar('👀 Eltern-Ansicht') + `<div class="sensei">${root.ART.kiko('think')}<div class="bubble">Gekoppelt ✔ – aber es ist noch kein Lernstand angekommen. Die App des Kindes muss einmal geöffnet werden (mit Internet). ${p.err ? '<br><b>' + esc(p.err) + '</b>' : ''}</div></div>
        <button class="btn cyan block" data-act="ref">🔄 Aktualisieren</button>${standaloneHint()}<button class="btn white block" style="margin-top:12px" data-act="unpair">Entkoppeln</button>`;
      setAct({ back, ref: () => refreshParent(true), unpair });
      if (!p.lastFetch || Date.now() - p.lastFetch > 15000) refreshParent(true);
      return;
    }
    const days = Array.from({ length: 14 }, (_, k) => { const d = new Date(Date.now() - (13 - k) * 864e5); return { k: A().dayKey(d), l: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][d.getDay()] }; });
    const maxXp = Math.max(60, ...days.map((d) => sn.days[d.k] || 0));
    const ago = (ts) => { const m = Math.round((Date.now() - ts) / 60000); return m < 2 ? 'gerade eben' : m < 60 ? `vor ${m} Min.` : m < 1440 ? `vor ${Math.round(m / 60)} Std.` : `vor ${Math.round(m / 1440)} Tagen`; };
    const tips = tipsFor(sn);
    app.innerHTML = topbar(`👀 ${esc(sn.name)}s Fortschritt`) + `
      <div class="panel">
        <div class="row"><span class="grow"><b>${esc(sn.rank)}</b> · ${sn.xp} XP</span><button class="btn small cyan" data-act="ref">🔄</button></div>
        <div class="small muted">Stand: ${ago(sn.at)}${p.err ? ' · ' + esc(p.err) : ''}</div>
        <div class="stats"><div class="stat"><div class="v">🔥 ${sn.streak}</div><div class="l">Tage-Serie</div></div><div class="stat"><div class="v">${sn.acc7 === null ? '–' : sn.acc7 + '%'}</div><div class="l">richtig (7 T.)</div></div><div class="stat"><div class="v">${sn.ok}</div><div class="l">richtig gesamt</div></div></div>
        <div class="days">${days.map((d) => `<div style="height:${(sn.days[d.k] || 0) / maxXp * 100}%"></div>`).join('')}</div>
        <div class="dlabels">${days.map((d) => `<span>${d.l}</span>`).join('')}</div>
      </div>
      <div class="panel tilt2"><h3>💡 Worauf du achten kannst</h3>${tips.map(([e, t]) => `<div class="ptip"><span>${e}</span><div>${t}</div></div>`).join('')}</div>
      <div class="panel"><h3>💌 Mut-Nachricht an ${esc(sn.name)}</h3>
        <div class="chips cheer">${['Super gemacht! 👍', 'Ich bin stolz auf dich! ❤️', 'Weiter so, du schaffst das! 💪', 'Heute Abend gibt\'s eine Belohnung! 🍕'].map((t) => `<button class="btn small white" data-act="cheer" data-arg="${esc(t)}">${esc(t)}</button>`).join('')}</div>
        <div class="row" style="margin-top:8px"><input id="ct" maxlength="120" placeholder="Eigene Nachricht …" style="flex:1;font:inherit;border:3px solid var(--ink);border-radius:10px;padding:8px"><button class="btn small pink" data-act="cheerOwn">Senden</button></div>
      </div>
      ${[8, 9, 10].map((b) => { const list = TOP.filter((t) => t.band === b && sn.topics[t.id]); return list.length ? `<div class="panel plist"><h3>${BANDS[b]}</h3>${list.map((t) => { const a = sn.topics[t.id]; return `<div class="pi"><span class="n">${t.emoji} ${t.title}${a[5] ? ' 👑' : ''}</span><span class="bar ${a[0] >= 80 ? 'green' : 'pink'}"><i style="width:${a[0]}%"></i></span><span class="p">${a[0]}%</span></div>`; }).join('')}</div>` : ''; }).join('')}
      ${standaloneHint()}
      <button class="btn white block" style="margin-top:12px" data-act="unpair">Entkoppeln</button>`;
    setAct({
      back, ref: () => refreshParent(true), unpair,
      cheer: (t) => sendCheer(t),
      cheerOwn: () => { const t = $('#ct').value.trim(); if (t) sendCheer(t); },
    });
    if (!p.lastFetch || Date.now() - p.lastFetch > 60000) refreshParent(true);

    async function sendCheer(text) {
      try { await post(p, { type: 'cheer', text, from: 'Mama', at: Date.now() }); toast(`💌 Gesendet! ${sn.name} sieht sie beim nächsten Öffnen.`); }
      catch (e) { toast('Senden nicht möglich – Internet prüfen.'); }
    }
    function unpair() {
      const m = modal(`<h2>Entkoppeln?</h2><p>Du siehst dann den Fortschritt nicht mehr.</p><div class="row"><button class="btn white grow" data-close>Abbrechen</button><button class="btn pink grow" id="up">Entkoppeln</button></div>`);
      $('#up', m.el).onclick = () => { S.parent = null; save(); m.close(); viewParent(); };
    }
  }
  function standaloneHint() {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = root.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    return ios && !standalone && !root.TiaNative ? `<div class="banner ios">📲 <span class="small">Tipp: Über <b>Teilen → „Zum Home-Bildschirm“</b> wird daraus eine App. Dort dann einmal unter <b>Familie → Mama/Papa → QR scannen</b> erneut koppeln (iPhone trennt Safari und Home-Bildschirm-Apps).</span></div>` : '';
  }

  // ---------------- QR scannen (Kamera) ----------------
  function loadJsQR() {
    if (root.jsQR) return Promise.resolve();
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'js/lib/jsQR.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  async function scan(onText) {
    const { modal, toast } = A();
    let stream = null, stop = false;
    const m = modal(`<h2>📷 QR-Code scannen</h2><video id="qv" playsinline muted style="width:100%;border:3px solid var(--ink);border-radius:12px;background:#000"></video><p class="small">Halte die Kamera auf den Code in der App deines Kindes.</p><button class="btn white block" data-close>Abbrechen</button>`, () => { stop = true; if (stream) stream.getTracks().forEach((t) => t.stop()); });
    try {
      await loadJsQR();
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      const v = $('#qv', m.el); v.srcObject = stream; await v.play();
      const c = document.createElement('canvas'), ctx = c.getContext('2d', { willReadFrequently: true });
      const tick = () => {
        if (stop) return;
        if (v.videoWidth) {
          c.width = v.videoWidth; c.height = v.videoHeight;
          ctx.drawImage(v, 0, 0);
          const code = root.jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
          if (code && parsePair(code.data)) { m.close(); onText(code.data); return; }
        }
        requestAnimationFrame(tick);
      };
      tick();
    } catch (e) { m.close(); toast('Kamera nicht verfügbar. Bitte den Link einfügen oder mit der iPhone-Kamera scannen.', 5000); }
  }

  root.FAMILY = { viewFamily, viewPair, viewParent, acceptPair, publish, checkCheers, refreshParent, snapshot, seal, open, tipsFor, sayTips: TIPS };
})(typeof window !== 'undefined' ? window : globalThis);
