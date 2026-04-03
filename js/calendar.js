// /js/calendar.js
document.addEventListener('DOMContentLoaded', () => {
    if (typeof LOGS_REF === 'undefined') {
        console.error('Firebase LOGS_REF not defined');
        return;
    }

    const calendarTitleEl = document.getElementById('calendar-title');
    const daysContainerEl = document.getElementById('calendar-days-container'); 
    
    const urlParams = new URLSearchParams(window.location.search);
    const monthYearKey = urlParams.get('month');

    if (!monthYearKey) {
        calendarTitleEl.textContent = "Error: No Month Selected";
        return;
    }
    
    const [year, monthNum] = monthYearKey.split('-');
    const monthIndex = parseInt(monthNum) - 1; 

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    calendarTitleEl.textContent = `${monthNames[monthIndex]} ${year} Daily Averages (Loading...)`;

    const firstDayOfMonth = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate(); 
    const startingDayOfWeek = firstDayOfMonth.getDay(); 

    let dailyAggregates = {}; 

    LOGS_REF.once('value', (snapshot) => {
        const allLogs = snapshot.val() || {}; 
        
        console.log('=== CALENDAR DEBUG INFO ===');
        console.log('Selected Month:', monthYearKey);
        console.log('Total logs in Firebase:', Object.keys(allLogs).length);
        
        processLogsForMonth(allLogs);
        renderCalendar();
        calendarTitleEl.textContent = `${monthNames[monthIndex]} ${year} Daily Averages`;
    }, (error) => {
        console.error("Firebase Read Failed: ", error.code);
        calendarTitleEl.textContent = `Error Loading ${monthNames[monthIndex]} ${year}`;
        renderCalendar(); 
    });
    
    function processLogsForMonth(logs) {
        // Initialize all days in the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayKey = String(day).padStart(2, '0');
            dailyAggregates[dayKey] = { 
                totalBPM: 0, 
                totalSPO2: 0, 
                count: 0,
                sessions: [] // Track individual sessions for debugging
            };
        }

        let processedCount = 0;
        let matchedCount = 0;

        Object.entries(logs).forEach(([key, log]) => {
            processedCount++;

            // Use Unix timestamp field 't' (in seconds)
            if (!log.t) {
                console.warn(`Log ${key} missing timestamp 't'`);
                return;
            }

            // Convert Unix timestamp to Date object
            const logDate = new Date(log.t * 1000); // Convert seconds to milliseconds
            
            const logYear = logDate.getFullYear();
            const logMonth = logDate.getMonth();
            const logDay = logDate.getDate();

            // Check if this log belongs to the selected month
            if (logYear == year && logMonth == monthIndex) {
                matchedCount++;
                
                const dayKey = String(logDay).padStart(2, '0');
                
                const hr = parseFloat(log.hr);
                const o2 = parseFloat(log.o2);

                if (!isNaN(hr) && hr > 0 && !isNaN(o2) && o2 > 0) {
                    dailyAggregates[dayKey].totalBPM += hr;
                    dailyAggregates[dayKey].totalSPO2 += o2;
                    dailyAggregates[dayKey].count += 1;
                    dailyAggregates[dayKey].sessions.push({
                        time: log.time,
                        hr: hr,
                        o2: o2
                    });
                    
                    console.log(`✓ Added to Day ${logDay}: HR=${hr}, SpO2=${o2}, Time=${log.time}`);
                } else {
                    console.warn(`Invalid data for ${key}: hr=${hr}, o2=${o2}`);
                }
            }
        });

        console.log('=== PROCESSING SUMMARY ===');
        console.log('Total logs processed:', processedCount);
        console.log('Logs matching this month:', matchedCount);
        console.log('Daily aggregates:', dailyAggregates);
        
        // Log days with data
        Object.entries(dailyAggregates).forEach(([day, data]) => {
            if (data.count > 0) {
                console.log(`Day ${day}: ${data.count} sessions, Avg BPM=${(data.totalBPM/data.count).toFixed(1)}, Avg SpO2=${(data.totalSPO2/data.count).toFixed(1)}%`);
            }
        });
    }

    function renderCalendar() {
        daysContainerEl.innerHTML = ''; 
        
        // Add blank cells for days before the 1st
        for (let i = 0; i < startingDayOfWeek; i++) {
            const blankCell = document.createElement('div');
            blankCell.className = 'day-cell inactive';
            daysContainerEl.appendChild(blankCell); 
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayKey = String(day).padStart(2, '0');
            const aggregate = dailyAggregates[dayKey];
            
            const cell = document.createElement('div');
            let colorClass = 'no-data';
            let readingsText = 'No Data';
            let sessionCount = '';

            if (aggregate && aggregate.count > 0) {
                const avgBPM = (aggregate.totalBPM / aggregate.count);
                const avgSPO2 = (aggregate.totalSPO2 / aggregate.count);

                sessionCount = aggregate.count > 1 ? `<br><small>(${aggregate.count} sessions)</small>` : '';
                readingsText = `BPM: ${avgBPM.toFixed(0)}<br>SpO₂: ${avgSPO2.toFixed(1)}%${sessionCount}`;
                
                // Determine color based on health ranges
                const bpmNormal = avgBPM >= 60 && avgBPM <= 100;
                const spo2Normal = avgSPO2 >= 95;
                
                if (bpmNormal && spo2Normal) {
                    colorClass = 'normal'; // Green
                } else {
                    colorClass = 'warning'; // Rose red
                }
            }
            
            cell.classList.add('day-cell', colorClass);
            cell.innerHTML = `
                <span class="day-number">${day}</span>
                <span class="avg-text">${readingsText}</span>
            `;

            daysContainerEl.appendChild(cell);
        }
        
        console.log('✓ Calendar rendered with', daysInMonth, 'days');
    }
});