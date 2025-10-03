import { 
    SCI_WATCH_LOW, SCI_WATCH_ELEVATED, SCI_WATCH_HIGH, 
    SCI_DURATION_LOW_H, SCI_DURATION_HIGH_H, SCI_DURATION_ELEVATED_H, SCI_DURATION_MEDIUM_H,
    DYNAMIC_PRESSURE_FACTOR, L1_DISTANCE_KM, MS_PER_SEC
} from './app.js';

/**
 * Gibt das qualitative Substurm-Risiko basierend auf dem SCI zurück.
 */
export const getSciRiskLevel = (sci) => {
    if (typeof sci !== 'number' || sci < 0) return 'N/A';
    if (sci >= SCI_WATCH_HIGH) return '🚨 HOCH (> 3500)';
    if (sci >= SCI_WATCH_ELEVATED) return '⚠️ Erhöht (> 2000)';
    if (sci >= SCI_WATCH_LOW) return 'Mittel (> 1000)';
    return 'Gering';
};

/**
 * Liefert die kritische Dauer in Stunden (als Zahl) basierend auf dem SCI-Wert.
 */
const getRequiredBuildupDuration = (sci) => {
    if (typeof sci !== 'number' || sci < SCI_WATCH_LOW) return SCI_DURATION_LOW_H; 
    if (sci >= SCI_WATCH_HIGH) return SCI_DURATION_HIGH_H;
    if (sci >= SCI_WATCH_ELEVATED) return SCI_DURATION_ELEVATED_H;
    return SCI_DURATION_MEDIUM_H; 
};

/**
 * Konvertiert den NOAA-Zeitstempel-String in ein UTC-Date-Objekt
 */
export const parseUtcTimeTag = (timeTag) => {
    return new Date(timeTag.replace(' ', 'T') + 'Z');
};

/**
 * Formatiert Zeitstempel mit Datum und Uhrzeit
 */
export const formatTime = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return 'N/A';
    const options = {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
        timeZone: 'UTC'
    };
    return date.toLocaleString('de-DE', options) + ' UTC';
};

/**
 * Berechnung des Prognostizierten AL-Index (Auroral Lower Index)
 */
const calculateProgALIndex = (sci, totalBt, bz) => {
    if (typeof sci !== 'number' || isNaN(sci) || sci <= 0 || typeof totalBt !== 'number' || isNaN(totalBt) || typeof bz !== 'number' || isNaN(bz)) {
        return 'N/A';
    }

    const conversionFactor = 0.2; 
    let alIndex = -sci * conversionFactor;

    if (bz < -10) {
         alIndex *= 1.2;
    } else if (totalBt > 20) {
         alIndex *= 1.1;
    }
    
    if (alIndex < -3000) alIndex = -3000;
    
    return Math.round(alIndex);
}

/**
 * Führt die Berechnung der geschätzten Ankunftszeit, des Dynamischen Drucks, 
 * des SCI und der geschätzten Sturmbeginn-Zeit durch
 */
export const calculateArrival = (entry) => {
    const speed = parseFloat(entry.speed);
    const density = parseFloat(entry.density);
    const bx = parseFloat(entry.bx_nt);
    const by = parseFloat(entry.by_nt);
    const bz = parseFloat(entry.bz_nt);
    const timeTag = entry.time_tag;

    let totalBt = 'N/A';
    if (!isNaN(bx) && !isNaN(by) && !isNaN(bz)) {
        totalBt = Math.sqrt(bx*bx + by*by + bz*bz);
    } else if (entry.bt_nt && entry.bt_nt !== 'N/A') {
         totalBt = parseFloat(entry.bt_nt);
    }

    let dynamicPressure = 'N/A';
    if (!isNaN(speed) && speed > 0 && !isNaN(density) && density >= 0) {
        dynamicPressure = DYNAMIC_PRESSURE_FACTOR * density * (speed * speed);
    }
    
    let sci = 'N/A';
    if (!isNaN(speed) && speed > 0 && !isNaN(bz)) {
        sci = speed * Math.max(0, -bz);
    }

    const progAlIndex = calculateProgALIndex(sci, totalBt, bz);
    const sciRiskLevel = getSciRiskLevel(sci);
    const criticalBuildupDuration = getRequiredBuildupDuration(sci);
    
    let travelTimeHours = 'N/A';
    let travelTimeMinutes = 'N/A';
    let travelTimeMs = null;
    let arrivalDate = 'Ungültige Geschw.';
    let estimatedOnset = 'N/A';

    if (!isNaN(speed) && speed > 0 && speed <= 10000) {
        const travelTimeSeconds = L1_DISTANCE_KM / speed;
        travelTimeHours = travelTimeSeconds / 3600;
        travelTimeMinutes = travelTimeSeconds / 60;
        travelTimeMs = travelTimeSeconds * MS_PER_SEC;
        const measurementDate = parseUtcTimeTag(timeTag);
        arrivalDate = new Date(measurementDate.getTime() + travelTimeMs);
    }
    
    if (arrivalDate instanceof Date && !isNaN(arrivalDate) && criticalBuildupDuration !== SCI_DURATION_LOW_H) {
        const durationMs = criticalBuildupDuration * 60 * 60 * 1000;
        estimatedOnset = new Date(arrivalDate.getTime() + durationMs);
    }

    return {
        ...entry,
        dynamic_pressure_npa: dynamicPressure,
        substorm_coupling_index: sci, 
        prog_al_index: progAlIndex,
        sci_risk_level: sciRiskLevel, 
        critical_buildup_duration_h: criticalBuildupDuration,
        total_bt: totalBt, 
        travel_time_h: travelTimeHours,
        travel_time_m: travelTimeMinutes, 
        travel_time_ms: travelTimeMs,
        arrival_time: arrivalDate,
        estimated_onset_time: estimatedOnset, 
    };
};