# Solarwind-Plasma-Daten-Visualisierer

Dieses Projekt ist eine eigenständige HTML-Anwendung, die Echtzeit-Solarwind- und Magnetfelddaten vom NOAA Space Weather Prediction Center (SWPC) visualisiert. Es berechnet und zeigt wichtige Metriken wie die geschätzte Ankunftszeit des Solarwinds auf der Erde, den dynamischen Druck, den Substurm-Kopplungsindex (SCI) und einen prognostizierten Auroral Lower (AL) Index an.

Die Anwendung ist in reinem JavaScript, HTML und Tailwind CSS geschrieben und wurde zur besseren Wartbarkeit in Module aufgeteilt.

## Hauptmerkmale

- **Echtzeit-Daten:** Ruft automatisch alle 60 Sekunden die neuesten Plasma- und Magnetfelddaten von den NOAA SWPC-APIs ab.
- **Datenvisualisierung:** Stellt die Daten in einer sortierbaren und farblich gekennzeichneten Tabelle dar, um kritische Werte hervorzuheben.
- **Berechnete Metriken:**
    - **Geschätzte Ankunftszeit:** Berechnet, wann das an der L1-Sonde gemessene Plasma die Erde erreichen wird.
    - **Dynamischer Druck:** Zeigt die Kraft des Solarwinds an.
    - **Substorm Coupling Index (SCI):** Ein Indikator für das Potenzial von geomagnetischen Substürmen.
    - **Prognostizierter AL-Index:** Eine Schätzung der Stärke des auroralen Elektrojets, ein Schlüsselindikator für Polarlichtaktivität.
    - **Geschätzter Sturmbeginn:** Eine Prognose für den frühesten Zeitpunkt eines geomagnetischen Sturms.
- **Status-Dashboard:** Eine Übersichtskarte zeigt die wichtigsten Werte des zuletzt gemessenen Datenpakets.
- **Hervorhebungen:** Wichtige Bedingungen wie hohe Geschwindigkeit, starker dynamischer Druck, südlich ausgerichtetes Magnetfeld (Bz) und hohes Substurm-Potenzial werden farblich und mit Symbolen markiert.
- **Responsive Design:** Die Benutzeroberfläche ist mit Tailwind CSS für verschiedene Bildschirmgrößen optimiert.

## Technologien

- **HTML5**
- **CSS3** (mit Tailwind CSS)
- **JavaScript (ES6 Module)**

## Dateistruktur

Das Projekt ist in mehrere Dateien aufgeteilt, um die Lesbarkeit und Wartbarkeit zu verbessern:

- `index.html`: Enthält die grundlegende HTML-Struktur der Seite.
- `style.css`: Beinhaltet alle CSS-Stile für die Anwendung.
- `app.js`: Der Haupteinstiegspunkt der Anwendung. Er initialisiert die UI, startet den Datenabruf und enthält die Hauptkonstanten.
- `ui.js`: Verantwortlich für die gesamte DOM-Manipulation, das Rendern der Tabelle, die Aktualisierung der Statuskarten und die Behandlung von Benutzerinteraktionen (z. B. Sortierung).
- `calculations.js`: Enthält alle wissenschaftlichen Berechnungsfunktionen, wie die Berechnung des SCI, des AL-Index und der Ankunftszeiten.

## Datenquellen

- **Plasma-Daten:** [NOAA SWPC - Real-Time Solar Wind Plasma](https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json)
- **Magnetfeld-Daten:** [NOAA SWPC - Real-Time Solar Wind Magnetic Field](https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json)

## Ausführung

Da es sich um eine reine Frontend-Anwendung handelt, können Sie die `index.html`-Datei einfach in einem modernen Webbrowser öffnen. Eine Internetverbindung ist erforderlich, um die Live-Daten von den NOAA-Servern abzurufen.