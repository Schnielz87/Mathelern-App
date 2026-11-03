/* Welche App-Variante läuft? "tia" = Tias Mathe-Quest, "quest" = Mathe-Manga-Quest (namensneutral).
   Android: kommt aus der App (TiaNative.edition), Web: wird beim Bauen eingesetzt. Gleicher Code für beide. */
(function (root) {
  'use strict';
  const EDITIONS = {
    tia: {
      id: 'tia', app: 'Tias Mathe-Quest', logo: ['Tias', 'Mathe-Quest'], short: 'Mathe-Quest', name: 'Tia', gender: 'f', askName: false,
      key: 'tiaMatheQuest.v1', prefix: 'tmq', apk: 'Tias-Mathe-Quest.apk', pwa: 'https://schnielz87.github.io/Mathelern-App/',
      about: '8. Klasse, Hauptschule, tut sich in Mathe schwer, liebt Mangas',
    },
    quest: {
      id: 'quest', app: 'Mathe-Manga-Quest', logo: ['Mathe-Manga', 'Quest'], short: 'Manga-Quest', name: '', gender: '', askName: true,
      key: 'matheMangaQuest.v1', prefix: 'mmq', apk: 'Mathe-Manga-Quest.apk', pwa: 'https://schnielz87.github.io/Mathelern-App/quest/',
      about: 'Klasse 8 bis 10, Hauptschul-Niveau, lernt gern mit Mangas',
    },
  };
  let id = '__EDITION__';
  try { if (root.TiaNative && root.TiaNative.edition) id = root.TiaNative.edition(); } catch (e) { /* Web */ }
  const E = EDITIONS[id] || EDITIONS.tia;
  E.ls = (k) => E.prefix + k;

  const state = () => (root.APP && root.APP.S) || null;
  /** Name der lernenden Person */
  const WHO = () => { const s = state(); return (s && s.name) || E.name || 'du'; };
  /** "f" | "m" | "n" */
  const GENDER = () => { const s = state(); return (s && s.gender) || E.gender || 'n'; };
  /** Text mit Platzhaltern: {N} = Name, {g:weiblich|männlich|neutral} */
  function GX(text) {
    const g = GENDER(), i = g === 'f' ? 0 : g === 'm' ? 1 : 2;
    return String(text == null ? '' : text)
      .replace(/\{N\}/g, WHO())
      .replace(/\{g:([^|}]*)\|([^|}]*)\|([^}]*)\}/g, (_, f, m, n) => [f, m, n][i]);
  }

  root.EDITION = E;
  root.WHO = WHO;
  root.GENDER = GENDER;
  root.GX = GX;
  if (typeof module !== 'undefined' && module.exports) module.exports = { E, WHO, GENDER, GX };
})(typeof window !== 'undefined' ? window : globalThis);
