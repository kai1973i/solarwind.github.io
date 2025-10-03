import { calculateArrival } from './calculations.js';
import { updateStatusCard, renderTable, setLoading, showStatusMessage, initUI, sortData } from './ui.js';
import { parseUtcTimeTag } from './calculations.js';

// --- Anwendungskonstanten ---
const PLASMA_API_URL = 'https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json';
const MAG_API_URL = 'https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json';

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

const fetchData = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP-Fehler beim Laden von ${url}: ${response.status}`);
    }
    const rawData = await response.json();
    return rawData.slice(1);
};

const fetchSolarWindData = async () => {
    setLoading(true);

    try {
        const [plasmaDataRaw, magDataRaw] = await Promise.all([
            fetchData(PLASMA_API_URL),
            fetchData(MAG_API_URL)
        ]);

        const MAG_TIME_INDEX = 0;
        const MAG_BX_INDEX = 1;
        const MAG_BY_INDEX = 2;
        const MAG_BZ_INDEX = 3;
        const MAG_BT_INDEX = 4;

        const magMap = new Map();
        magDataRaw.forEach(row => {
            const timeTag = row[MAG_TIME_INDEX];
            if (row[MAG_BX_INDEX] !== 'null' && parseFloat(row[MAG_BX_INDEX]) > -900 &&
                row[MAG_BY_INDEX] !== 'null' && parseFloat(row[MAG_BY_INDEX]) > -900 &&
                row[MAG_BZ_INDEX] !== 'null' && parseFloat(row[MAG_BZ_INDEX]) > -900) {
                
                magMap.set(timeTag, {
                    bx_nt: row[MAG_BX_INDEX],
                    by_nt: row[MAG_BY_INDEX],
                    bz_nt: row[MAG_BZ_INDEX],
                    bt_nt: row[MAG_BT_INDEX] || 'N/A'
                });
            }
        });

        const processedData = plasmaDataRaw.map(row => {
            const timeTag = row[0];
            const magEntry = magMap.get(timeTag) || { bx_nt: 'N/A', by_nt: 'N/A', bz_nt: 'N/A', bt_nt: 'N/A' };
            
            const entry = {
                time_tag: timeTag,
                density: row[1],
                speed: row[2],
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

            showStatusMessage(`Daten (24h Quellen) erfolgreich geladen. Zeige ${allData.length} Einträge der letzten 2 Stunden (bis zum letzten Messwert, UTC). Nächste Aktualisierung in 1 Minute.`, false);

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
