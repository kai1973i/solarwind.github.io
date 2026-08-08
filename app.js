import { calculateArrival } from './calculations.js';
import { updateStatusCard, renderTable, setLoading, showStatusMessage, initUI, sortData } from './ui.js';
import { parseUtcTimeTag } from './calculations.js';

// --- Anwendungskonstanten ---
const PLASMA_API_URL = 'https://services.swpc.noaa.gov/json/solar-wind/plasma-7-day.json';
const MAG_API_URL = 'https://services.swpc.noaa.gov/json/solar-wind/mag-7-day.json';

export const L1_DISTANCE_KM = 1500000;
export const MS_PER_SEC = 1000;
export const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
export const THIRTY_MINUTES_MS = 30 * 60 * 1000;
export const REFRESH_INTERVAL_MS = 60 * 1000;

export const DYNAMIC_PRESSURE_FACTOR = 0.001672;
export const CRITICAL_PRESSURE_NPA = 10.0;
export const CRITICAL_DENSITY = 15.0;

export const SCI_WATCH_LOW = 1000;
export const SCI_WATCH_ELEVATED = 2000;
export const SCI_WATCH_HIGH = 3500;

export const SCI_DURATION_HIGH_H = 1.75;
export const SCI_DURATION_ELEVATED_H = 2.5;
export const SCI_DURATION_MEDIUM_H = 3.0;
export const SCI_DURATION_LOW_H = 100.0;
export const CRITICAL_BT = 15.0;

export const AL_INDEX_CRITICAL_NT = -500;
export const AL_INDEX_ELEVATED_NT = -200;

let allData = [];

const getFirstValidValue = (...values) => (
    values.find(value => value != null && value !== '' && value !== 'null' && value !== 'undefined') ?? null
);

const fetchData = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP-Fehler beim Laden von ${url}: ${response.status}`);
    }
    const rawData = await response.json();

    if (!Array.isArray(rawData)) {
        throw new Error(`Unerwartetes Datenformat von ${url}`);
    }

    if (rawData.length === 0) {
        return [];
    }

    if (rawData.every(row => row && typeof row === 'object' && !Array.isArray(row))) {
        return rawData;
    }

    const [header, ...rows] = rawData;
    if (!Array.isArray(header)) {
        throw new Error(`Unerwartetes Datenformat von ${url}`);
    }

    return rows
        .filter(Array.isArray)
        .map(row => (
            Object.fromEntries(header.map((key, index) => [key, row[index]]))
        ));
};

const fetchSolarWindData = async () => {
    setLoading(true);

    try {
        const [plasmaDataRaw, magDataRaw] = await Promise.all([
            fetchData(PLASMA_API_URL),
            fetchData(MAG_API_URL)
        ]);

        const magMap = new Map();
        magDataRaw.forEach(row => {
            const timeTag = row.time_tag;
            const bx = getFirstValidValue(row.bx_gsm, row.bx, row.b1);
            const by = getFirstValidValue(row.by_gsm, row.by, row.b2);
            const bz = getFirstValidValue(row.bz_gsm, row.bz, row.b3);
            const bt = getFirstValidValue(row.bt, row.total_bt);

            if (timeTag &&
                bx != null && parseFloat(bx) > -900 &&
                by != null && parseFloat(by) > -900 &&
                bz != null && parseFloat(bz) > -900) {
                magMap.set(timeTag, {
                    bx_nt: bx,
                    by_nt: by,
                    bz_nt: bz,
                    bt_nt: bt ?? 'N/A'
                });
            }
        });

        const processedData = plasmaDataRaw
            .filter(row => row.time_tag)
            .map(row => {
                const timeTag = row.time_tag;
                const magEntry = magMap.get(timeTag) || { bx_nt: 'N/A', by_nt: 'N/A', bz_nt: 'N/A', bt_nt: 'N/A' };
                
                const entry = {
                    time_tag: timeTag,
                    density: row.density,
                    speed: row.speed,
                    propagated_time_tag: row.propagated_time_tag ?? null,
                    bx_nt: magEntry.bx_nt, 
                    by_nt: magEntry.by_nt,
                    bz_nt: magEntry.bz_nt,
                    bt_nt: magEntry.bt_nt,
                };
                return calculateArrival(entry);
            });

        if (processedData.length > 0) {
            const sortedByTime = [...processedData].sort((a, b) => 
                parseUtcTimeTag(b.time_tag).getTime() - parseUtcTimeTag(a.time_tag).getTime()
            );
            const latestEntry = sortedByTime.find(e => 
                parseFloat(e.speed) > 0 && 
                typeof e.substorm_coupling_index === 'number'
            );

            if (latestEntry) {
                updateStatusCard(latestEntry);
            }

            const latestTimeMs = parseUtcTimeTag(sortedByTime[0].time_tag).getTime();
            const cutoffTimeMs = latestTimeMs - TWO_HOURS_MS;

            allData = processedData.filter(entry => {
                const entryTimeMs = parseUtcTimeTag(entry.time_tag).getTime();
                return entryTimeMs >= cutoffTimeMs;
            });

            showStatusMessage(`Daten erfolgreich geladen. Zeige ${allData.length} Einträge der letzten 2 Stunden (bis zum letzten Messwert, UTC). Nächste Aktualisierung in 1 Minute.`, false);

        } else {
            allData = [];
            showStatusMessage('Daten erfolgreich geladen, aber keine Einträge in den letzten 2 Stunden gefunden.', true);
        }

        sortData(allData);
        renderTable(allData);

    } catch (error) {
        console.error("Fehler beim Abrufen der Daten:", error);
        showStatusMessage(`Fehler beim Laden der Daten: ${error.message}. Nächste Aktualisierung in 1 Minute.`, true);
    } finally {
        setLoading(false);
    }
};

const startApp = () => {
    initUI(fetchSolarWindData);
};

window.onload = startApp;
