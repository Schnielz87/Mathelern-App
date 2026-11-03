<p align="center"><img src="docs/icon-1024.png" width="160" alt="Tias Mathe-Quest"></p>

# Tias Mathe-Quest 🦊

Mathe lernen im Manga-Stil – für die Klassen 8 bis 10 (Hauptschul-Niveau).
Kiko, der Fuchs-Sensei, erklärt jedes Thema kinderleicht in Manga-Panels, stellt passende Übungsaufgaben,
erkennt Schwachstellen und schließt Wissenslücken gezielt.

- **Android-App (APK):** https://github.com/Schnielz87/Mathelern-App/releases/latest/download/Tias-Mathe-Quest.apk
- **iPhone/Web-App (PWA):** https://schnielz87.github.io/Mathelern-App/
- **Installation:** siehe [ANLEITUNG.md](ANLEITUNG.md)

**Zweite, namensneutrale Variante „Mathe-Manga-Quest“** (Name & Figur werden beim ersten Start gewählt):
- APK: https://github.com/Schnielz87/Mathelern-App/releases/latest/download/Mathe-Manga-Quest.apk
- Web-App: https://schnielz87.github.io/Mathelern-App/quest/

Beide Varianten nutzen denselben Code (`web/js/edition.js` legt die Variante fest; Android: `-Pedition=quest`)
und werden bei jedem Push gemeinsam gebaut und veröffentlicht.

## Inhalte (28 Kapitel)

| Band | Themen |
|---|---|
| Klasse 8 | Plus & Minus (negative Zahlen), Brüche & Kommazahlen, Terme & Variablen, Terme zusammenfassen, **Ausmultiplizieren** ⭐, Ausklammern, Gleichungen, Prozent, Zinsen, Dreisatz, Flächen, Kreis |
| Klasse 9 | Potenzen, Quadratwurzeln, Pythagoras, Lineare Funktionen, Klammer mal Klammer, Gleichungen & Textaufgaben, Körper, Statistik, Wahrscheinlichkeit |
| Klasse 10 | Binomische Formeln, Gleichungssysteme, Quadratische Funktionen, Pyramide/Kegel/Kugel, Maßstab & Strahlensatz, Trigonometrie, Wachstum & Zinseszins |

Jedes Kapitel: Erklärung mit Kiko & Tia (mit Mini-Quiz), Übungen in 3 Stufen (zufällig erzeugt, unendlich viele),
Schritt-für-Schritt-Hilfe, Lösungswege, Spickzettel und ein **Boss-Kampf**.

## So lernt die App mit

- **Einstufungstest** am Anfang zeigt, wo Tia steht.
- **Fehler-Erkennung:** typische Fehler (Vorzeichen, „nur das erste Glied malgenommen“, Mittelteil bei binomischen
  Formeln vergessen …) werden erkannt, erklärt und dem passenden Grundlagen-Thema zugeordnet.
- **Tagesmission & Schwächen-Training** mischen gezielt schwache und fällige Themen (Wiederholung mit Abständen).
- Stufen passen sich an: läuft es gut, wird es schwerer; hakt es, kommt die Schritt-für-Schritt-Hilfe.
- **Motivation:** XP, Ränge (Mathe-Neuling bis Mathe-Göttin), Tages-Serie, Combos, 37 Sammel-Sticker, Effekte & Töne.
- **Für Eltern:** Übersicht unter „Fortschritt“ – und **Familien-Kopplung per QR-Code**: Mamas App (z. B. iPhone)
  zeigt Tias Lernstand mit konkreten Tipps zum Unterstützen; Mama kann Mut-Nachrichten schicken.
  Übertragung Ende-zu-Ende-verschlüsselt (AES-GCM, Schlüssel nur im QR-Code) über ntfy.sh.
- **Kikos Tafel:** Aufgaben und ganze Themen werden animiert wie von Hand auf kariertes Papier geschrieben und
  gleichzeitig vorgelesen (Web Speech bzw. Android-Sprachausgabe) – ohne KI, offline.
- **Frag Kiko (optional, KI):** „Mit ChatGPT anmelden“ (Android, wie in der Englisch-App inkl. Netzwerk-Wiederholung
  beim Token-Austausch) oder API-Schlüssel (Gemini/OpenAI/Claude). Chat, Hausaufgaben an der Tafel, „Warum?“ nach Fehlern.

## Technik

- `web/` – die eigentliche App (HTML/CSS/JavaScript, ohne Abhängigkeiten, offline-fähig). Wird 1:1 als PWA
  veröffentlicht **und** in die Android-App gepackt.
- `app/` – Android-Hülle (Kotlin, WebView): Update-Prüfung über GitHub-Releases, Installation per PackageInstaller,
  Hintergrund-Prüfung alle 24 h mit Benachrichtigung.
- `tests/content.test.js` – erzeugt zehntausende Aufgaben und prüft, dass jede Musterlösung erkannt wird.
- `.github/workflows/build.yml` – Version `1.0.<Laufnummer>`, baut die APK, erstellt das Release und
  veröffentlicht die Web-App auf dem Zweig `gh-pages` (Settings → Pages → Branch `gh-pages`).
- `tools/make-icons.js` – erzeugt App-Icons aus der Kiko-Grafik.
- **Signatur:** `signing/tia-release.jks` liegt bewusst im Repo, damit jede Version als Update zur installierten App
  passt. Optional ersetzbar über die GitHub-Secrets `SIGNING_KEYSTORE_BASE64` und `SIGNING_PASSWORD`
  (dann muss die App einmal neu installiert werden).

**GitHub Pages einmalig einschalten:** Repo → Settings → Pages → „Deploy from a branch“ → Branch `gh-pages`, Ordner `/ (root)` → Save.

Lokal testen: `cd web && python3 -m http.server` → http://localhost:8000 · Tests: `node tests/content.test.js`
