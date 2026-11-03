/* KI-Tutor Kiko (optional). Android-App: "Mit ChatGPT anmelden" oder API-Schlüssel (sicher im Android Keystore).
   Web-App/iPhone: API-Schlüssel (Gemini, OpenAI, Claude) – bleibt nur auf diesem Gerät. Ohne KI funktioniert alles. */
(function (root) {
  'use strict';
  const NATIVE = root.TiaNative || null;
  const hasNativeAi = () => { try { return !!(NATIVE && NATIVE.aiState); } catch (e) { return false; } };
  const A = () => root.APP;
  const $ = (s, r = document) => r.querySelector(s);

  const PROVIDERS = {
    CHATGPT: { label: 'Mit ChatGPT anmelden', desc: 'Nutzt dein ChatGPT-Abo (Plus/Pro). Kein Schlüssel nötig.', nativeOnly: true },
    GEMINI: { label: 'Google Gemini', desc: 'Kostenloser API-Schlüssel von aistudio.google.com', key: 'Gemini-API-Schlüssel' },
    OPENAI: { label: 'OpenAI API', desc: 'API-Schlüssel von platform.openai.com (kostet pro Nutzung)', key: 'OpenAI-Schlüssel (sk-…)' },
    ANTHROPIC: { label: 'Anthropic Claude', desc: 'API-Schlüssel von console.anthropic.com (kostet pro Nutzung)', key: 'Claude-Schlüssel (sk-ant-…)' },
  };

  // ---------------- Speicher (Web) ----------------
  const LS = 'tmqAi';
  const webCfg = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } };
  const setWebCfg = (c) => { try { localStorage.setItem(LS, JSON.stringify(c)); } catch (e) { /* egal */ } };

  // ---------------- Native Brücke ----------------
  let reqN = 0;
  const reqs = {};
  root.onNativeAi = (id, json) => {
    const r = reqs[id]; if (!r) return;
    let o; try { o = JSON.parse(json); } catch (e) { return; }
    if (o.delta !== undefined) { r.onDelta && r.onDelta(o.delta); return; }
    delete reqs[id];
    if (o.error) r.rej(new Error(o.error)); else r.res(o);
  };
  root.onNativeAiState = () => { if (/^#\/ki/.test(location.hash)) viewSettings(); };
  const nativeCall = (fn, onDelta) => new Promise((res, rej) => { const id = String(++reqN); reqs[id] = { res, rej, onDelta }; fn(id); });

  function status() {
    if (hasNativeAi()) { try { return { native: true, ...JSON.parse(NATIVE.aiState()) }; } catch (e) { /* weiter */ } }
    const c = webCfg();
    const p = c.provider || 'NONE';
    return { native: false, provider: p, model: c.models && c.models[p], ready: p !== 'NONE' && !!(c.keys && c.keys[p]) && !!(c.models && c.models[p]) };
  }

  // ---------------- Web-Anbieter ----------------
  async function webModels(p, key) {
    if (p === 'GEMINI') {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100', { headers: { 'x-goog-api-key': key } });
      if (!r.ok) throw new Error(errText(r.status));
      return (await r.json()).models.filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => ({ id: m.name.replace('models/', ''), name: m.displayName || m.name }))
        .filter((m) => /^gemini/.test(m.id) && !/embedding|image|tts|audio/.test(m.id))
        .sort((a, b) => (/flash/.test(b.id) - /flash/.test(a.id)) || (b.id > a.id ? 1 : -1));
    }
    if (p === 'OPENAI') {
      const r = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: 'Bearer ' + key } });
      if (!r.ok) throw new Error(errText(r.status));
      const skip = /audio|realtime|tts|transcribe|image|search|embedding|moderation|instruct|codex|dall|whisper/;
      return (await r.json()).data.map((m) => m.id).filter((id) => /^gpt-/.test(id) && !skip.test(id)).sort().reverse().map((id) => ({ id, name: id }));
    }
    if (p === 'ANTHROPIC') {
      const r = await fetch('https://api.anthropic.com/v1/models?limit=50', { headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' } });
      if (!r.ok) throw new Error(errText(r.status));
      return (await r.json()).data.map((m) => ({ id: m.id, name: m.display_name || m.id }));
    }
    return [];
  }
  function errText(code) {
    return code === 401 || code === 403 ? 'Zugang abgelehnt – bitte Schlüssel prüfen.' : code === 404 ? 'Modell nicht gefunden.' : code === 429 ? 'Zu viele Anfragen oder Kontingent erschöpft. Bitte später erneut versuchen.' : code >= 500 ? 'Der KI-Dienst ist gerade nicht erreichbar.' : 'KI-Anfrage fehlgeschlagen (' + code + ').';
  }
  function normalized(hist) {
    const out = [];
    hist.forEach((m) => {
      if (!out.length && !m.u) out.push({ u: true, t: '(Start)' });
      if (out.length && out[out.length - 1].u === m.u) out[out.length - 1] = { u: m.u, t: out[out.length - 1].t + '\n\n' + m.t };
      else out.push(m);
    });
    return out;
  }
  async function webAsk(instructions, hist) {
    const c = webCfg(), p = c.provider, key = c.keys && c.keys[p], model = c.models && c.models[p];
    if (!key || !model) throw new Error('Bitte zuerst die KI einrichten (⚙️ → KI-Tutor).');
    if (p === 'GEMINI') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: instructions }] }, contents: normalized(hist).map((m) => ({ role: m.u ? 'user' : 'model', parts: [{ text: m.t }] })) }),
      });
      if (!r.ok) throw new Error(errText(r.status));
      const o = await r.json();
      return ((o.candidates || [])[0]?.content?.parts || []).map((x) => x.text || '').join('') || (() => { throw new Error('Keine Antwort erhalten.'); })();
    }
    if (p === 'OPENAI') {
      const r = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, instructions, input: hist.map((m) => ({ role: m.u ? 'user' : 'assistant', content: m.t })), store: false }),
      });
      if (!r.ok) throw new Error(errText(r.status));
      const o = await r.json();
      if (o.output_text) return o.output_text;
      return (o.output || []).flatMap((x) => x.content || []).map((x) => x.text || '').join('');
    }
    if (p === 'ANTHROPIC') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true', 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 1500, system: instructions, messages: normalized(hist).map((m) => ({ role: m.u ? 'user' : 'assistant', content: m.t })) }),
      });
      if (!r.ok) throw new Error(errText(r.status));
      return (await r.json()).content.map((x) => x.text || '').join('');
    }
    throw new Error('Keine KI eingerichtet.');
  }

  /** hist: [{u: true|false, t: text}] */
  function ask(instructions, hist, onDelta) {
    if (hasNativeAi()) return nativeCall((id) => NATIVE.aiAsk(id, instructions, JSON.stringify(hist.map((m) => ({ user: m.u, text: m.t })))), onDelta).then((o) => o.text);
    return webAsk(instructions, hist).then((t) => { onDelta && onDelta(t); return t; });
  }

  // ---------------- Anweisungen ----------------
  function persona() {
    const { S, TOP, tp } = A();
    const weak = TOP.filter((t) => tp(t.id).seen >= 3 && tp(t.id).m < 50).map((t) => t.title).slice(0, 5);
    return `Du bist Kiko, ein fröhlicher Fuchs-Sensei im Manga-Stil in der Mathe-Lern-App „Tias Mathe-Quest“. Du sprichst mit ${S.name} (8. Klasse, Hauptschule, tut sich in Mathe schwer, liebt Mangas).
Regeln:
- Antworte auf Deutsch, in kurzen, einfachen Sätzen, freundlich und ermutigend. Nutze Alltags- oder Manga-Beispiele.
- Erkläre Schritt für Schritt. Gib bei Hausaufgaben nicht nur das Ergebnis, sondern den Weg – und stelle am Ende eine kleine ähnliche Übungsfrage.
- Nur Mathe-Themen der Klassen 8–10. Bei anderen Themen freundlich zurück zur Mathe lenken. Keine persönlichen Daten erfragen.
- Schreibe Mathe als normalen Text (kein LaTeX): · für mal, − für minus, ² für hoch 2, Brüche als 3/4.
- Höchstens etwa 150 Wörter. Emojis sparsam.
${weak.length ? `Aktuell schwer für ${S.name}: ${weak.join(', ')}.` : ''}`;
  }
  const BOARD_RULES = `\nAntworte jetzt NUR mit JSON (ohne Erklärtext, ohne Markdown) in genau diesem Format:
{"title":"kurzer Titel","steps":[{"write":"was an die Tafel geschrieben wird (kurze Mathe-Zeile, max. 40 Zeichen)","say":"was Kiko dazu laut sagt (1–2 kurze Sätze)"}]}
Verwende 4 bis 10 Schritte. Der erste Schritt schreibt die Aufgabe auf, der letzte das Ergebnis.`;

  function parseBoard(text) {
    const m = String(text).match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { const o = JSON.parse(m[0]); if (Array.isArray(o.steps) && o.steps.length) return o; } catch (e) { /* nein */ }
    return null;
  }

  // ---------------- Oberflächen ----------------
  let chat = [];
  function md(t) {
    return A().esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  }

  function viewChat() {
    const { topbar, setAct, back, app, go } = A();
    const st = status();
    if (!st.ready) {
      app.innerHTML = topbar('🦊 Frag Kiko') + `<div class="sensei">${root.ART.kiko('think')}<div class="bubble">Ich kann dir jede Mathe-Frage beantworten und Hausaufgaben an der Tafel erklären – dafür brauche ich einmal eine KI-Verbindung. 🤖<br><button class="btn small pink" data-act="setup">Einrichten</button></div></div>
        <div class="panel small">Tipp: Auch ohne KI erklärt dir Kiko an der Tafel: In jeder Aufgabe gibt es den Knopf <b>🎬 Tafel</b>.</div>`;
      setAct({ back, setup: () => go('ki') });
      return;
    }
    const draw = () => {
      const box = $('#chatbox');
      if (!box) return;
      box.innerHTML = (chat.length ? chat : [{ u: false, t: 'Hey! 🦊 Was möchtest du wissen? Schreib mir eine Frage oder deine Hausaufgabe.' }]).map((m, i) => m.u
        ? `<div class="say tia-say">${root.ART.tia()}<div class="bubble right">${md(m.t)}</div></div>`
        : `<div class="say">${root.ART.kiko(m.wait ? 'think' : 'happy')}<div class="bubble">${m.wait ? '<i>Kiko denkt nach …</i>' : md(m.t)}${m.board ? `<br><button class="btn small cyan" data-act="replay" data-arg="${i}">🎬 Nochmal an der Tafel</button>` : ''}</div></div>`).join('');
      box.lastElementChild && box.lastElementChild.scrollIntoView({ block: 'end' });
    };
    app.innerHTML = topbar('🦊 Frag Kiko', '<button class="btn small white" data-act="clear">Neu</button>') + `
      <div id="chatbox"></div>
      <div class="chips">${['Erklär mir Ausmultiplizieren ganz einfach', 'Wie rechne ich Prozent?', 'Gib mir eine Übungsaufgabe', 'Warum ist Minus mal Minus Plus?'].map((q) => `<button class="btn small white" data-act="quick" data-arg="${q}">${q}</button>`).join('')}</div>
      <div class="panel" style="padding:10px">
        <textarea id="q" placeholder="Deine Frage oder Hausaufgabe, z. B. 4(2x − 3)" style="min-height:70px;font:18px Nunito,sans-serif"></textarea>
        <div class="row" style="margin-top:8px"><button class="btn cyan grow" data-act="board">🎬 An der Tafel</button><button class="btn pink grow" data-act="send">Fragen ➤</button></div>
      </div>
      <p class="small center" style="color:#fff;opacity:.7">KI kann sich irren – bei Unsicherheit Lehrerin fragen. 😉</p>`;
    draw();
    const send = async (text, asBoard) => {
      text = String(text || '').trim(); if (!text) return;
      $('#q').value = '';
      chat.push({ u: true, t: text });
      chat.push({ u: false, t: '', wait: true });
      draw();
      const hist = chat.filter((m) => !m.wait).map((m) => ({ u: m.u, t: m.t }));
      try {
        if (asBoard) {
          const ans = await ask(persona() + BOARD_RULES, hist);
          const b = parseBoard(ans);
          chat.pop();
          if (!b) { chat.push({ u: false, t: ans }); draw(); return; }
          chat.push({ u: false, t: b.steps.map((s) => '✏️ ' + s.write).join('\n'), board: b });
          draw();
          playAi(b);
        } else {
          const ans = await ask(persona(), hist, (d) => { const last = chat[chat.length - 1]; last.wait = false; last.t = d; draw(); });
          chat[chat.length - 1] = { u: false, t: ans };
          draw();
        }
      } catch (e) { chat[chat.length - 1] = { u: false, t: '😕 ' + e.message }; draw(); }
    };
    setAct({
      back,
      send: () => send($('#q').value, false),
      board: () => send($('#q').value || 'Erklär mir die Aufgabe von eben an der Tafel', true),
      quick: (q) => send(q, false),
      clear: () => { chat = []; viewChat(); },
      replay: (i) => playAi(chat[+i].board),
    });
  }
  function playAi(b) {
    const { BOARD } = root;
    BOARD.open(BOARD.fromAi(b.steps.map((s) => ({ write: s.write, say: BOARD.sayMath(s.say) })), b.title), '🦊 ' + (b.title || 'Kikos Tafel'));
  }

  /** Nach einem Fehler: "Warum?" */
  async function explainMistake(task, topic, given) {
    const { modal, esc } = A();
    const CHECK = root.CHECK;
    if (!status().ready) {
      const m = modal(`${root.ART.kiko('think')}<h2>KI noch nicht eingerichtet</h2><p>Für Kikos persönliche Erklärung brauche ich eine KI-Verbindung. Die <b>🎬 Tafel</b> funktioniert aber immer – auch ohne KI!</p><div class="row"><button class="btn white grow" data-close>OK</button><button class="btn pink grow" id="kiset">Einrichten</button></div>`);
      $('#kiset', m.el).onclick = () => { m.close(); A().go('ki'); };
      return;
    }
    const m = modal(`${root.ART.kiko('think')}<h2>🤔 Warum?</h2><div id="why" class="left" style="text-align:left">Kiko denkt nach …</div><button class="btn pink block" style="margin-top:10px" data-close>Verstanden!</button>`);
    const q = root.BOARD.textOf(task.q);
    const prompt = `Aufgabe (Thema ${topic.title}): ${q}\nMeine Antwort: ${given || '(keine)'}\nRichtige Antwort: ${CHECK.answerText(task)}\nErkläre mir kurz und freundlich, was ich falsch gemacht habe und wie es richtig geht (max. 90 Wörter).`;
    try { await ask(persona(), [{ u: true, t: prompt }], (d) => { const w = $('#why', m.el); if (w) w.innerHTML = md(d); }).then((t) => { const w = $('#why', m.el); if (w) w.innerHTML = md(t); }); }
    catch (e) { const w = $('#why', m.el); if (w) w.textContent = '😕 ' + e.message; }
  }

  function viewSettings() {
    const { topbar, setAct, back, app, esc, toast } = A();
    const st = status();
    const native = hasNativeAi();
    const list = Object.entries(PROVIDERS).filter(([, p]) => native || !p.nativeOnly);
    const cur = st.provider || 'NONE';
    const c = webCfg();
    app.innerHTML = topbar('🤖 KI-Tutor') + `
      <div class="sensei">${root.ART.kiko('happy')}<div class="bubble">Mit einer KI kann ich jede Frage beantworten und Hausaufgaben an der Tafel erklären. Die App funktioniert aber auch komplett ohne! 🦊</div></div>
      <div class="panel">
        <h3>Anbieter</h3>
        ${list.map(([id, p]) => `<button class="tcard" data-act="prov" data-arg="${id}" style="margin:8px 0;${cur === id ? 'background:#fff3c4' : ''}"><span class="e">${cur === id ? '✔' : '○'}</span><span class="grow"><span class="t" style="font-size:18px">${p.label}</span><br><span class="s">${p.desc}</span></span></button>`).join('')}
        <button class="tcard" data-act="prov" data-arg="NONE" style="margin:8px 0;${cur === 'NONE' ? 'background:#fff3c4' : ''}"><span class="e">${cur === 'NONE' ? '✔' : '○'}</span><span class="grow"><span class="t" style="font-size:18px">Keine KI</span></span></button>
        ${!native ? '<p class="small muted">„Mit ChatGPT anmelden“ gibt es in der Android-App.</p>' : ''}
      </div>
      ${cur === 'CHATGPT' ? `<div class="panel"><h3>ChatGPT</h3>
        ${st.chatgpt === 'signedIn' ? `<p>✔ Angemeldet als <b>${esc(st.email || '')}</b></p><button class="btn white block" data-act="signout">Abmelden</button>`
        : st.chatgpt === 'inProgress' ? `<p>Anmeldung läuft im Browser … Danach zurück zur App.</p><button class="btn white block" data-act="cancel">Abbrechen</button>`
        : `${st.error ? `<p class="small" style="color:#c0264b">${esc(st.error)}</p>` : ''}<button class="btn pink block" data-act="signin">Mit ChatGPT anmelden</button><p class="small muted">Du meldest dich direkt bei OpenAI an. Benötigt ChatGPT Plus oder Pro.</p>`}</div>` : ''}
      ${PROVIDERS[cur] && PROVIDERS[cur].key ? `<div class="panel"><h3>Schlüssel</h3>
        <input id="key" type="password" placeholder="${PROVIDERS[cur].key}" value="" style="width:100%;font:inherit;border:3px solid var(--ink);border-radius:10px;padding:8px">
        <p class="small muted">${st.hasKey || (c.keys && c.keys[cur]) ? '✔ Ein Schlüssel ist gespeichert.' : 'Noch kein Schlüssel.'} ${native ? 'Er wird verschlüsselt im Android Keystore gespeichert.' : 'Er bleibt nur auf diesem Gerät.'}</p>
        <button class="btn white block" data-act="savekey">Speichern</button></div>` : ''}
      ${cur !== 'NONE' ? `<div class="panel"><h3>Modell</h3><p class="small">${st.model ? 'Aktuell: <b>' + esc(st.model) + '</b>' : 'Noch kein Modell gewählt.'}</p><select id="mdl" class="hidden" style="width:100%"></select><button class="btn cyan block" data-act="models" style="margin-top:8px">Modelle laden</button></div>` : ''}
      ${st.ready ? '<button class="btn green block" data-act="test">✔ Testfrage stellen</button>' : ''}`;
    setAct({
      back,
      prov: (p) => { if (native) NATIVE.aiSetProvider(p); else setWebCfg({ ...webCfg(), provider: p }); viewSettings(); },
      signin: () => { NATIVE.aiSignIn(); setTimeout(viewSettings, 300); },
      cancel: () => { NATIVE.aiCancel(); viewSettings(); },
      signout: () => { NATIVE.aiSignOut(); setTimeout(viewSettings, 500); },
      savekey: () => {
        const k = $('#key').value.trim(); if (!k) return toast('Bitte Schlüssel eingeben.');
        if (native) NATIVE.aiSetKey(cur, k); else { const cc = webCfg(); cc.keys = { ...(cc.keys || {}), [cur]: k }; setWebCfg(cc); }
        toast('Gespeichert ✔'); viewSettings();
      },
      models: async () => {
        toast('Lade Modelle …', 1500);
        try {
          const ms = native ? (await nativeCall((id) => NATIVE.aiModels(id, cur))).models : await webModels(cur, (webCfg().keys || {})[cur]);
          if (!ms.length) return toast('Keine Modelle gefunden.');
          const sel = $('#mdl'); sel.classList.remove('hidden');
          sel.innerHTML = '<option value="">– Modell wählen –</option>' + ms.map((m) => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('');
          sel.onchange = () => { if (!sel.value) return; if (native) NATIVE.aiSetModel(cur, sel.value); else { const cc = webCfg(); cc.models = { ...(cc.models || {}), [cur]: sel.value }; setWebCfg(cc); } toast('Modell gewählt ✔'); viewSettings(); };
        } catch (e) { toast('😕 ' + e.message, 4000); }
      },
      test: async () => { toast('Kiko denkt …', 1500); try { const t = await ask(persona(), [{ u: true, t: 'Sag in einem Satz Hallo und nenne einen Mathe-Tipp.' }]); toast('🦊 ' + esc(t).slice(0, 200), 6000); } catch (e) { toast('😕 ' + e.message, 5000); } },
    });
  }

  /** In einer Aufgabe: "Kiko, wie geht das?" – KI erklärt den Lösungsweg per Sprache im Bild-in-Bild-Fenster.
      Das Endergebnis wird nicht verraten. */
  async function explainTask(task, topic) {
    const { BOARD, CHECK } = root;
    const title = `🦊 Kiko erklärt: ${topic.title}`;
    BOARD.open([{ say: 'Moment, ich schau mir deine Aufgabe an!', lines: [{ t: 'Kiko denkt nach …', k: 'n' }] }], title, { mini: true });
    const q = BOARD.textOf(task.q) + (task.kind === 'mc' ? ' Auswahl: ' + task.choices.map(BOARD.textOf).join(' | ') : '');
    const prompt = `Erkläre mir Schritt für Schritt, WIE man diese Aufgabe löst (Thema: ${topic.title}):\n${q}${task.unit ? ' (Einheit: ' + task.unit + ')' : ''}
Zur Kontrolle für dich (NICHT verraten!): Lösung ${CHECK.answerText(task)}. Musterweg: ${(task.steps || []).map(BOARD.textOf).join(' | ')}
Wichtig: Zeige den Weg so, dass ich ihn verstehe. Rechne NICHT bis zum Endergebnis – der letzte Schritt sagt mir, was ich jetzt selbst ausrechnen soll.`;
    const rules = BOARD_RULES.replace('der letzte das Ergebnis.', 'der letzte Schritt fordert Tia auf, das Ergebnis selbst auszurechnen (ohne es zu nennen).');
    try {
      const ans = await ask(persona() + rules, [{ u: true, t: prompt }]);
      if (!BOARD.isOpen()) return;
      const b = parseBoard(ans);
      if (!b) throw new Error('Unerwartete Antwort');
      BOARD.open(BOARD.fromAi(b.steps.map((x) => ({ write: x.write, say: BOARD.sayMath(x.say) })), b.title || topic.title), title, { mini: true });
    } catch (e) {
      if (!BOARD.isOpen()) return;
      // Ohne Verbindung: Kiko rechnet offline eine ähnliche Aufgabe vor
      const steps = BOARD.fromTask(topic.gen.call(topic, 2), topic);
      steps.unshift({ say: 'Die KI ist gerade nicht erreichbar. Ich zeige dir stattdessen eine ähnliche Aufgabe.', lines: [{ t: '😕 ' + e.message, k: 'n', c: 'p' }] });
      BOARD.open(steps, '🎬 ' + topic.title, { mini: true });
    }
  }

  root.AI = { explainTask, status, ask, viewChat, viewSettings, explainMistake, parseBoard, persona };
})(typeof window !== 'undefined' ? window : globalThis);
