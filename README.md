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

Die Anwendung verwendet aktuelle NOAA-SWPC-JSON-Feeds mit rollierendem Zeitfenster:

- Plasma-/Geschwindigkeitsdaten: `https://services.swpc.noaa.gov/json/solar-wind/plasma-7-day.json`
- Magnetfelddaten: `https://services.swpc.noaa.gov/json/solar-wind/mag-7-day.json`

Die Antwortdaten werden sowohl im neueren Objektformat als auch im älteren headerbasierten Array-Format verarbeitet. Für Magnetfeldwerte bevorzugt die Anwendung qualifizierte NOAA-Feldnamen wie `*_gsm` und `*_gse`, unterstützt aber auch `bx`/`by`/`bz` sowie `b1`/`b2`/`b3`. Falls vorhanden, wird `propagated_time_tag` direkt als Ankunftszeit an der Erde verwendet.

## Lokale Nutzung

Da es sich um eine statische Frontend-Anwendung handelt, kann `index.html` direkt im Browser geöffnet oder über einen einfachen lokalen Webserver bereitgestellt werden.

Beispiel:

```bash
python3 -m http.server 8000
```

Danach ist die Anwendung unter `http://localhost:8000` erreichbar.

## Hinweis

Für den Datenabruf ist eine funktionierende Internetverbindung zu den NOAA-SWPC-Diensten erforderlich.
