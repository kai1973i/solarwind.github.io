import { parseUtcTimeTag, formatTime } from './calculations.js';
import { 
    THIRTY_MINUTES_MS, AL_INDEX_CRITICAL_NT, AL_INDEX_ELEVATED_NT, 
    SCI_WATCH_HIGH, SCI_WATCH_ELEVATED, SCI_WATCH_LOW, 
    CRITICAL_PRESSURE_NPA, CRITICAL_DENSITY, CRITICAL_BT
} from './app.js';

const tableBody = document.getElementById('table-body');
const plasmaTable = document.getElementById('plasma-table');
const loadingIndicator = document.getElementById('loading-indicator');
const statusMessage = document.getElementById('status-message');
const headers = document.querySelectorAll('.header-cell');

const latestTimeTagEl = document.getElementById('latest-time-tag');
const arrivalTimeStatusEl = document.getElementById('arrival-time-status');
const alIndexStatusEl = document.getElementById('al-index-status');
const sciRiskStatusEl = document.getElementById('sci-risk-status');

let allData = [];
let sortColumn = 'time_tag';
let sortDirection = 'desc';

export const updateStatusCard = (entry) => {
    const nowUtc = new Date();
    
    latestTimeTagEl.textContent = entry.time_tag.substring(11, 16) + ' UTC';

    let arrivalText = 'Wird berechnet...';
    let arrivalColor = 'text-gray-300';
    
    if (entry.arrival_time instanceof Date && !isNaN(entry.arrival_time)) {
        const diffMs = entry.arrival_time.getTime() - nowUtc.getTime();
        const arrivalTimeStr = entry.arrival_time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
        
        if (diffMs <= 0) {
            arrivalText = `ANGEKOMMEN! ${arrivalTimeStr} UTC`;
            arrivalColor = 'text-green-500';
        } else if (diffMs <= THIRTY_MINUTES_MS) {
            arrivalText = `🔜 ${arrivalTimeStr} UTC (Bald!)`;
            arrivalColor = 'text-red-400';
        } else {
            arrivalText = `${arrivalTimeStr} UTC (${entry.travel_time_h.toFixed(1)} h)`;
            arrivalColor = 'text-blue-400';
        }
    }
    arrivalTimeStatusEl.textContent = arrivalText;
    arrivalTimeStatusEl.className = `metric-value ${arrivalColor}`;

    const alIndex = entry.prog_al_index;
    let alText = String(alIndex);
    let alColor = 'text-gray-300';
    
    if (typeof alIndex === 'number') {
        alText = `${alIndex.toFixed(0)} nT`;
        if (alIndex <= AL_INDEX_CRITICAL_NT) {
            alColor = 'text-red-400 font-extrabold';
        } else if (alIndex <= AL_INDEX_ELEVATED_NT) {
            alColor = 'text-orange-300';
        } else {
            alColor = 'text-green-400';
        }
    }
    alIndexStatusEl.textContent = alText;
    alIndexStatusEl.className = `metric-value ${alColor}`;

    const sci = entry.substorm_coupling_index;
    let sciText = entry.sci_risk_level;
    let sciColor = 'text-gray-300';

    if (typeof sci === 'number') {
        if (sci > SCI_WATCH_HIGH) {
            sciColor = 'text-red-400 font-extrabold';
        } else if (sci > SCI_WATCH_ELEVATED) {
            sciColor = 'text-orange-400 font-bold';
        } else if (sci > SCI_WATCH_LOW) {
            sciColor = 'text-yellow-400';
        }
        sciText = sciText.replace('🚨 HOCH', 'HOCH');
        sciText = sciText.replace('⚠️ Erhöht', 'Erhöht');
    }
    sciRiskStatusEl.textContent = sciText;
    sciRiskStatusEl.className = `metric-value ${sciColor}`;
};

export const renderTable = (data) => {
    allData = data;
    tableBody.innerHTML = '';
    if (data.length === 0) {
        statusMessage.textContent = 'Keine Daten in den letzten 2 Stunden zum Anzeigen vorhanden.';
        statusMessage.classList.remove('hidden', 'bg-red-900', 'bg-green-900/50');
        statusMessage.classList.add('bg-yellow-900', 'text-yellow-400');
        plasmaTable.classList.add('hidden');
        return;
    }
    
    const nowUtc = new Date();

    data.forEach((entry, index) => {
        
        let isArrived = false;
        if (entry.arrival_time instanceof Date && !isNaN(entry.arrival_time)) {
            if (entry.arrival_time.getTime() <= nowUtc.getTime()) {
                isArrived = true;
            }
        }

        let rowClass = index % 2 !== 0 ? 'bg-gray-700/50' : '';
        rowClass += isArrived ? ' highlight-row' : '';

        const row = document.createElement('tr');
        row.className = `border-b border-gray-700 hover:bg-gray-700 transition duration-150 ${rowClass}`;

        let bzColor = 'text-gray-300';
        let bzIcon = '';
        const bz = parseFloat(entry.bz_nt);
        if (!isNaN(bz)) {
            if (bz < -5) { 
                bzColor = 'text-red-400 font-bold';
                bzIcon = '⬇️'; 
            } else if (bz < 0) {
                bzColor = 'text-orange-300';
                bzIcon = '↓'; 
            } else if (bz > 5) {
                bzColor = 'text-blue-300';
                bzIcon = '⬆️'; 
            } else if (bz > 0) {
                bzColor = 'text-green-400';
                bzIcon = '↑'; 
            }
        }

        let speedColor = 'text-green-400';
        const speed = parseFloat(entry.speed);
        if (speed > 550) {
            speedColor = 'text-red-400 font-bold';
        } else if (speed > 450) {
            speedColor = 'text-yellow-400';
        }

        let pressureColor = 'text-gray-300';
        let compressionIcon = '';
        const pressure = entry.dynamic_pressure_npa;
        const density = parseFloat(entry.density);

        if (typeof pressure === 'number') {
            if (pressure > CRITICAL_PRESSURE_NPA) {
                pressureColor = 'text-red-400 font-bold'; 
            } else if (pressure > 5.0) {
                pressureColor = 'text-orange-400'; 
            } else if (pressure < 0.5) {
                pressureColor = 'text-gray-500'; 
            }
        }

        if (!isNaN(density) && density >= CRITICAL_DENSITY && typeof pressure === 'number' && pressure > 5.0) {
            pressureColor = 'text-yellow-300 font-extrabold'; 
            compressionIcon = '💥 STAU!'; 
        }

        let btColor = 'text-gray-300';
        const totalBt = entry.total_bt;
        if (typeof totalBt === 'number' && totalBt > CRITICAL_BT) {
            btColor = 'text-yellow-300 font-bold';
        } else if (typeof totalBt === 'number' && totalBt < 5.0) {
            btColor = 'text-gray-500';
        }

        const sci = entry.substorm_coupling_index;
        let sciColor = 'text-gray-300';
        
        if (typeof sci === 'number') {
            if (sci > SCI_WATCH_HIGH) {
                sciColor = 'text-red-400 font-extrabold';
                row.classList.add('substorm-watch-high'); 
            } else if (sci > SCI_WATCH_ELEVATED) {
                sciColor = 'text-orange-400 font-bold';
                row.classList.add('substorm-watch-elevated');
            } else if (sci > SCI_WATCH_LOW) {
                sciColor = 'text-yellow-400';
            }
        }
        
        const sciValue = typeof sci === 'number' ? sci.toFixed(0) : String(sci);
        
        const alIndex = entry.prog_al_index;
        let alIndexColor = 'text-gray-400';
        const alIndexValue = typeof alIndex === 'number' ? alIndex.toFixed(0) : String(alIndex);

        if (typeof alIndex === 'number') {
            if (alIndex <= AL_INDEX_CRITICAL_NT) {
                alIndexColor = 'text-red-400 font-extrabold';
            } else if (alIndex <= AL_INDEX_ELEVATED_NT) {
                alIndexColor = 'text-orange-400 font-bold';
            } else if (alIndex < 0) {
                 alIndexColor = 'text-yellow-400';
            } else {
                alIndexColor = 'text-green-400';
            }
        }

        row.innerHTML += `<td class="py-3 px-6 text-left">${formatTime(parseUtcTimeTag(entry.time_tag))}</td>`;
        row.innerHTML += `<td class="py-3 px-6 text-left ${speedColor}">${parseFloat(entry.speed).toFixed(1)}</td>`;
        row.innerHTML += `<td class="py-3 px-6 text-left">${parseFloat(entry.density).toFixed(2)}</td>`;
        
        const pressureValue = typeof pressure === 'number' ? pressure.toFixed(2) : String(pressure);
        row.innerHTML += `<td class="py-3 px-6 text-left ${pressureColor}">
            ${compressionIcon ? `<span class="mr-1">${compressionIcon}</span>` : ''}${pressureValue}
        </td>`;
        
        const totalBtValue = typeof totalBt === 'number' ? totalBt.toFixed(1) : String(totalBt);
        row.innerHTML += `<td class="py-3 px-6 text-left ${btColor}">${totalBtValue}</td>`;
        
        row.innerHTML += `<td class="py-3 px-6 text-left ${bzColor}">
            ${bzIcon ? `<span class="mr-1">${bzIcon}</span>` : ''}${parseFloat(entry.bz_nt).toFixed(1)}
        </td>`;

         row.innerHTML += `<td class="py-3 px-6 text-left ${alIndexColor}">
            ${alIndexValue}
        </td>`;

         row.innerHTML += `<td class="py-3 px-6 text-left ${sciColor}">
            ${sciValue}
        </td>`;
        
        let onsetTimeText = 'N/A';
        let onsetTimeColor = 'text-gray-400';
        
        if (entry.estimated_onset_time instanceof Date && !isNaN(entry.estimated_onset_time)) {
            onsetTimeText = formatTime(entry.estimated_onset_time).substring(11, 20); 
            const diffMs = entry.estimated_onset_time.getTime() - nowUtc.getTime();

            if (diffMs > 0 && diffMs <= THIRTY_MINUTES_MS) {
                onsetTimeColor = 'text-red-300 font-bold';
                onsetTimeText = `⚠️ SOON! ${onsetTimeText}`;
            } else if (diffMs <= 0) {
                onsetTimeColor = 'text-red-400 font-extrabold';
                onsetTimeText = `⚠️ JETZT! ${onsetTimeText}`;
            } else {
                onsetTimeColor = 'text-blue-300';
            }
        }
        
        row.innerHTML += `<td class="py-3 px-6 text-left ${onsetTimeColor}">${onsetTimeText}</td>`;

        let riskColor = '';
        if (entry.sci_risk_level.startsWith('🚨 HOCH')) {
            riskColor = 'text-red-400 font-bold';
        } else if (entry.sci_risk_level.startsWith('⚠️ Erhöht')) {
            riskColor = 'text-orange-400';
        } else if (entry.sci_risk_level.startsWith('Mittel')) {
            riskColor = 'text-yellow-400';
        } else {
            riskColor = 'text-gray-400';
        }

        row.innerHTML += `<td class="py-3 px-6 text-left ${riskColor}">
            ${entry.sci_risk_level}
        </td>`;

        let isOvertaking = false;
        if (index < data.length - 1) {
            const nextEntry = data[index + 1]; 
            const currentArrival = entry.arrival_time instanceof Date ? entry.arrival_time.getTime() : Infinity;
            const nextArrival = nextEntry.arrival_time instanceof Date ? nextEntry.arrival_time.getTime() : Infinity;

            if (currentArrival < nextArrival) {
                isOvertaking = true;
            }
        }
        
        let arrivalTimeCell = `<td class="py-3 px-6 text-left">`;
        
        if (entry.arrival_time instanceof Date && !isNaN(entry.arrival_time)) {
            const diffMs = entry.arrival_time.getTime() - nowUtc.getTime();
            
            let timeText = entry.arrival_time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' }) + ' UTC';
            let cellClass = '';

            if (isOvertaking) {
                cellClass += ' bg-pink-900/40 border-l border-pink-600';
                timeText = `<span class="text-pink-400 font-extrabold">🏎️ ÜBERHOLT! ${timeText}</span>`;
            }
            
            else if (diffMs > 0 && diffMs <= THIRTY_MINUTES_MS) {
                cellClass = 'bg-blue-900/40 border-r border-blue-600';
                timeText = `<span class="text-blue-300 font-extrabold">🔜 ${timeText}</span>`;
            } 
            
            else if (isArrived) {
                timeText = `<span class="font-bold text-gray-200">${timeText}</span>`;
            } 
            
            else {
                timeText = `<span class="font-medium">${timeText}</span>`;
            }

            arrivalTimeCell = `<td class="py-3 px-6 text-left ${cellClass}">`;
            arrivalTimeCell += timeText;
            
        } else {
            arrivalTimeCell += `<span class="text-red-500">${entry.arrival_time}</span>`;
        }
        arrivalTimeCell += `</td>`;
        row.innerHTML += arrivalTimeCell;
        
        tableBody.appendChild(row);
    });
    plasmaTable.classList.remove('hidden');
};

export const sortData = () => {
    const keyMap = {
        'time_tag': d => parseUtcTimeTag(d.time_tag).getTime(),
        'speed': d => parseFloat(d.speed) || -Infinity,
        'density': d => parseFloat(d.density) || -Infinity,
        'dynamic_pressure_npa': d => typeof d.dynamic_pressure_npa === 'number' ? d.dynamic_pressure_npa : -Infinity,
        'total_bt': d => typeof d.total_bt === 'number' ? d.total_bt : -Infinity,
        'bz_nt': d => parseFloat(d.bz_nt) || -Infinity,
        'prog_al_index': d => typeof d.prog_al_index === 'number' ? d.prog_al_index : -Infinity,
        'substorm_coupling_index': d => typeof d.substorm_coupling_index === 'number' ? d.substorm_coupling_index : -Infinity,
        'estimated_onset_time': d => d.estimated_onset_time instanceof Date ? d.estimated_onset_time.getTime() : Infinity,
        'sci_risk_level': d => typeof d.substorm_coupling_index === 'number' ? d.substorm_coupling_index : -Infinity, 
        'arrival_time': d => d.travel_time_ms !== null ? parseUtcTimeTag(d.time_tag).getTime() + d.travel_time_ms : -Infinity,
    };

    allData.sort((a, b) => {
        const valA = keyMap[sortColumn](a);
        const valB = keyMap[sortColumn](b);

        let comparison = 0;
        if (valA > valB) {
            comparison = 1;
        } else if (valA < valB) {
            comparison = -1;
        }

        let finalComparison = comparison * -1; 
        
        if (sortColumn === 'time_tag' || sortColumn === 'arrival_time') {
            finalComparison = sortDirection === 'asc' ? comparison : comparison * -1;
        }

        if (sortColumn === 'estimated_onset_time') {
            finalComparison = comparison;
        }

        if (sortColumn === 'bz_nt' || sortColumn === 'prog_al_index') {
            finalComparison = comparison;
        }
        
        return finalComparison;
    });

    document.querySelectorAll('[data-sort-icon]').forEach(icon => icon.textContent = '');
    const currentIcon = document.querySelector(`[data-sort-icon="${sortColumn}"]`);
    if (currentIcon) {
        let displayDirection = '';
        if (sortColumn === 'bz_nt' || sortColumn === 'prog_al_index' || sortColumn === 'estimated_onset_time') {
            displayDirection = '↓';
        } else {
            displayDirection = sortDirection === 'asc' ? '↑' : '↓';
        }
        currentIcon.textContent = displayDirection;
    }
    if (sortColumn === 'time_tag') {
        const defaultIcon = document.querySelector(`[data-sort-icon="time_tag"]`);
        defaultIcon.textContent = '↓';
    }

    renderTable(allData);
};

export const setLoading = (isLoading) => {
    if (isLoading) {
        loadingIndicator.classList.remove('hidden');
        statusMessage.classList.add('hidden');
        plasmaTable.classList.add('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
    }
};

export const showStatusMessage = (message, isError) => {
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden', 'bg-red-900', 'bg-green-900/50', 'bg-yellow-900');
    const colorClass = isError ? 'bg-red-900' : 'bg-green-900/50';
    const textClass = isError ? 'text-red-400' : 'text-green-400';
    statusMessage.classList.add(colorClass, textClass, 'font-semibold');
};

export const initUI = (fetchFunction) => {
    headers.forEach(header => {
        header.addEventListener('click', (e) => {
            const key = e.currentTarget.dataset.sortKey;
            if (sortColumn === key) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = key;
                sortDirection = 'desc'; 
                if (key === 'bz_nt' || key === 'prog_al_index' || key === 'estimated_onset_time') {
                    sortDirection = 'asc'; 
                }
            }
            sortData();
        });
    });

    fetchFunction();
    setInterval(fetchFunction, 60000);
};