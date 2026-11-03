/* Manga-Figuren als SVG: Kiko (Fuchs-Sensei) und Tia. */
(function (root) {
  'use strict';
  const INK = '#1a1a2e';

  function eyes(mood) {
    const big = (cx) => `
      <ellipse cx="${cx}" cy="118" rx="15" ry="19" fill="url(#kIris)" stroke="${INK}" stroke-width="3.5"/>
      <ellipse cx="${cx}" cy="124" rx="8" ry="10" fill="#14062e"/>
      <circle cx="${cx - 5}" cy="108" r="5.5" fill="#fff"/>
      <circle cx="${cx + 6}" cy="127" r="2.6" fill="#fff"/>`;
    const star = (cx) => `
      <ellipse cx="${cx}" cy="118" rx="16" ry="20" fill="url(#kIris)" stroke="${INK}" stroke-width="3.5"/>
      <path d="M ${cx} 104 L ${cx + 4} 114 L ${cx + 14} 116 L ${cx + 6} 122 L ${cx + 9} 132 L ${cx} 126 L ${cx - 9} 132 L ${cx - 6} 122 L ${cx - 14} 116 L ${cx - 4} 114 Z" fill="#FFD23F"/>
      <circle cx="${cx - 7}" cy="108" r="3" fill="#fff"/>`;
    const happy = (cx) => `<path d="M ${cx - 14} 122 Q ${cx} 102 ${cx + 14} 122" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    const up = (cx) => `
      <ellipse cx="${cx}" cy="118" rx="15" ry="19" fill="url(#kIris)" stroke="${INK}" stroke-width="3.5"/>
      <ellipse cx="${cx + 2}" cy="111" rx="8" ry="9" fill="#14062e"/>
      <circle cx="${cx - 3}" cy="106" r="4.5" fill="#fff"/>`;
    if (mood === 'happy' || mood === 'cheer') return happy(72) + happy(128);
    if (mood === 'wow') return star(72) + star(128);
    if (mood === 'think') return up(72) + up(128);
    return big(72) + big(128);
  }

  function mouth(mood) {
    if (mood === 'cheer' || mood === 'wow') return `<path d="M 88 146 Q 100 168 112 146 Z" fill="#c2185b" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M 93 154 Q 100 160 107 154" fill="#ff8fb1"/>`;
    if (mood === 'think') return `<ellipse cx="102" cy="152" rx="5" ry="4" fill="#c2185b" stroke="${INK}" stroke-width="2.5"/>`;
    if (mood === 'sad') return `<path d="M 90 154 Q 100 146 110 154" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
    return `<path d="M 88 147 Q 94 154 100 147 Q 106 154 112 147" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
  }

  function extras(mood) {
    if (mood === 'think') return `<path d="M 160 70 Q 168 84 160 90 Q 152 84 160 70 Z" fill="#7fd8ff" stroke="${INK}" stroke-width="2.5"/>`;
    if (mood === 'sad') return `<path d="M 62 138 Q 66 150 62 156 Q 58 150 62 138 Z" fill="#7fd8ff" stroke="${INK}" stroke-width="2"/>`;
    if (mood === 'cheer' || mood === 'wow') return `<g fill="#FFD23F" stroke="${INK}" stroke-width="2"><path d="M 22 60 l 4 10 l 10 4 l -10 4 l -4 10 l -4 -10 l -10 -4 l 10 -4 z"/><path d="M 178 150 l 3 7 l 7 3 l -7 3 l -3 7 l -3 -7 l -7 -3 l 7 -3 z"/></g>`;
    return '';
  }

  /** Kiko, der Fuchs-Sensei. mood: normal | happy | cheer | wow | think | sad */
  function kiko(mood = 'normal', cls = '') {
    return `<svg class="kiko ${cls}" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <linearGradient id="kFur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffa24c"/><stop offset="1" stop-color="#ff6b2c"/></linearGradient>
        <radialGradient id="kIris" cx="0.45" cy="0.35" r="0.8"><stop offset="0" stop-color="#b56bff"/><stop offset="0.6" stop-color="#5a1fbf"/><stop offset="1" stop-color="#2b1055"/></radialGradient>
      </defs>
      <!-- Ohren -->
      <path d="M 38 100 L 50 18 L 100 62 Z" fill="url(#kFur)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M 52 84 L 58 38 L 86 64 Z" fill="#ffd9c2"/>
      <path d="M 162 100 L 150 18 L 100 62 Z" fill="url(#kFur)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M 148 84 L 142 38 L 114 64 Z" fill="#ffd9c2"/>
      <!-- Kopf -->
      <path d="M 100 52 C 150 52 178 80 176 118 C 174 150 146 182 100 184 C 54 182 26 150 24 118 C 22 80 50 52 100 52 Z" fill="url(#kFur)" stroke="${INK}" stroke-width="4"/>
      <!-- Wangenfell -->
      <path d="M 28 124 Q 46 160 100 182 Q 154 160 172 124 Q 140 142 120 132 Q 100 128 80 132 Q 60 142 28 124 Z" fill="#fff6ea"/>
      <path d="M 28 124 Q 46 160 100 182 Q 154 160 172 124" fill="none" stroke="${INK}" stroke-width="4"/>
      <!-- Stirnband -->
      <path d="M 30 90 Q 100 66 170 90 L 168 106 Q 100 82 32 106 Z" fill="#e63946" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M 166 92 Q 190 84 196 98 Q 184 100 176 104 Z" fill="#e63946" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M 166 100 Q 186 112 190 126 Q 178 120 168 110 Z" fill="#e63946" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M 100 72 L 105 82 L 116 83 L 108 90 L 110 101 L 100 95 L 90 101 L 92 90 L 84 83 L 95 82 Z" fill="#FFD23F" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      ${eyes(mood)}
      <!-- Rouge -->
      <ellipse cx="48" cy="142" rx="11" ry="6" fill="#ff5fa2" opacity="0.55"/>
      <ellipse cx="152" cy="142" rx="11" ry="6" fill="#ff5fa2" opacity="0.55"/>
      <!-- Nase -->
      <ellipse cx="100" cy="138" rx="7" ry="5" fill="${INK}"/>
      <ellipse cx="98" cy="136" rx="2.5" ry="1.5" fill="#fff" opacity="0.8"/>
      ${mouth(mood)}
      ${extras(mood)}
    </svg>`;
  }

  /** Tia als kleine Manga-Figur (Kopf). */
  function tia(mood = 'normal', cls = '') {
    const e = mood === 'happy'
      ? `<path d="M 60 112 Q 72 100 84 112" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/><path d="M 116 112 Q 128 100 140 112" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`
      : `<ellipse cx="72" cy="112" rx="11" ry="15" fill="#4b2a1a" stroke="${INK}" stroke-width="3"/><circle cx="68" cy="105" r="4" fill="#fff"/><ellipse cx="128" cy="112" rx="11" ry="15" fill="#4b2a1a" stroke="${INK}" stroke-width="3"/><circle cx="124" cy="105" r="4" fill="#fff"/>`;
    return `<svg class="tia ${cls}" viewBox="0 0 200 200" aria-hidden="true">
      <path d="M 30 120 C 20 40 180 40 170 120 L 176 176 Q 150 186 140 160 L 60 160 Q 50 186 24 176 Z" fill="#3b2418" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <ellipse cx="100" cy="116" rx="58" ry="58" fill="#ffe0cc" stroke="${INK}" stroke-width="4"/>
      <path d="M 42 104 C 44 52 156 52 158 104 Q 140 80 122 92 Q 110 70 96 90 Q 80 72 70 94 Q 56 82 42 104 Z" fill="#3b2418" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M 140 52 Q 156 34 170 48 Q 160 58 148 60 Z M 140 52 Q 136 30 120 34 Q 124 50 134 58 Z" fill="#ff5fa2" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="140" cy="54" r="6" fill="#ff8fc0" stroke="${INK}" stroke-width="3"/>
      ${e}
      <ellipse cx="56" cy="134" rx="10" ry="5" fill="#ff8fb1" opacity="0.6"/><ellipse cx="144" cy="134" rx="10" ry="5" fill="#ff8fb1" opacity="0.6"/>
      <path d="M 90 140 Q 100 150 110 140" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`;
  }

  const api = { kiko, tia };
  root.ART = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
