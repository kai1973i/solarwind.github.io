# Solarwind-Plasma-Daten-Visualisierer

Diese Anwendung visualisiert Echtzeit-Solarwind- und Magnetfelddaten des NOAA Space Weather Prediction Center (SWPC) in einer eigenständigen HTML-Seite. Neben den Rohdaten berechnet sie zusätzliche Kennzahlen wie Ankunftszeit, dynamischen Druck, Substorm Coupling Index (SCI), prognostizierten AL-Index und einen geschätzten Sturmbeginn.

## Funktionen

- Abruf aktueller NOAA-Solarwind- und Magnetfelddaten im 60-Sekunden-Takt
- Farblich hervorgehobene, sortierbare Tabelle für die letzten zwei Stunden
- Status-Dashboard mit den wichtigsten Kennzahlen des neuesten Messpunkts
- Berechnung von:
  - geschätzter Ankunftszeit des Solarwinds an der Erde
  - dynamischem Druck
  - Substorm Coupling Index (SCI)
  - prognostiziertem AL-Index
  - geschätztem geomagnetischem Sturmbeginn
- Hervorhebung kritischer Bedingungen wie hohem Druck, stark südlichem Bz und erhöhtem Substurm-Potenzial

## Technologien

- HTML5
- CSS3
- Tailwind CSS (via CDN)
- JavaScript (ES Modules)

## Projektstruktur

- `index.html` – HTML-Grundstruktur
- `style.css` – Anwendungsstile
- `app.js` – App-Initialisierung, Datenabruf und Verarbeitung
- `ui.js` – DOM-Rendering, Statuskarten und Sortierung
- `calculations.js` – wissenschaftliche Berechnungen und Zeitlogik

## Datenquellen

Die Anwendung verwendet die NOAA-SWPC-Echtzeitfeeds mit minütlichen RTSW-Messungen:

- Plasma-/Geschwindigkeitsdaten: `https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json`
- Magnetfelddaten: `https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json`

Die Quellen liefern Objektzeilen für mehrere Satellitenquellen. Die Anwendung verarbeitet ausschließlich die jeweils aktive Quelle (`active: true`) und verknüpft Plasma- und Magnetfeldwerte über den gemeinsamen Zeitstempel und die Quelle. Sie verwendet `proton_speed` und `proton_density` für die Plasmamessung sowie die GSM-Komponenten `bx_gsm`, `by_gsm` und `bz_gsm` für die Magnetfeldberechnungen. Die Ankunftszeit wird aus dem L1-Abstand und der Protonengeschwindigkeit geschätzt.

## Lokale Nutzung

Da es sich um eine statische Frontend-Anwendung handelt, kann `index.html` direkt im Browser geöffnet oder über einen einfachen lokalen Webserver bereitgestellt werden.

Beispiel:

```bash
python3 -m http.server 8000
```

Danach ist die Anwendung unter `http://localhost:8000` erreichbar.

## Hinweis

Für den Datenabruf ist eine funktionierende Internetverbindung zu den NOAA-SWPC-Diensten erforderlich.
