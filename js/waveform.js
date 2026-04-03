let dailyTrendChart;
let waveformChart;

// --- Helper function to determine max data points based on screen size ---
function getMaxDataPoints() {
    const width = window.innerWidth;
    if (width < 480) return 8;      // Very small phones
    if (width < 768) return 12;     // Small phones/portrait tablets
    if (width < 1024) return 18;    // Larger phones/small tablets
    return 24;                       // Desktop and large screens
}

// --- 1. Tab Switching Logic ---
function switchTab(tabName) {
    const dailyView = document.getElementById('daily-view');
    const realtimeView = document.getElementById('realtime-view');
    const btnDaily = document.getElementById('btn-daily');
    const btnRealtime = document.getElementById('btn-realtime');

    if (tabName === 'daily') {
        // Show Today's Trend
        dailyView.style.display = 'block';
        realtimeView.style.display = 'none';
        btnDaily.classList.add('active');
        btnRealtime.classList.remove('active');
        // Load data when switching to this tab
        initTrendChart();
    } else {
        // Show Real-time PPG
        realtimeView.style.display = 'block';
        dailyView.style.display = 'none';
        btnRealtime.classList.add('active');
        btnDaily.classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Safety check for Firebase config
    if (typeof LATEST_DATA_REF === 'undefined') {
        console.error('Firebase not configured!');
        return;
    }

    // --- 2. Initialize Today's Trend Chart ---
    const ctxTrend = document.getElementById('dailyTrendChart').getContext('2d');
    dailyTrendChart = new Chart(ctxTrend, {
        type: 'line',
        data: { 
            labels: [], 
            datasets: [
                { 
                    label: 'Heart Rate (BPM)', 
                    borderColor: '#C25959', 
                    backgroundColor: 'rgba(194, 89, 89, 0.1)',
                    data: [], 
                    yAxisID: 'y',
                    tension: 0.3,
                    borderWidth: 2,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#C25959',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                { 
                    label: 'SpO₂ (%)', 
                    borderColor: '#4A90E2', 
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    data: [], 
                    yAxisID: 'y1',
                    tension: 0.3,
                    borderWidth: 2,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#4A90E2',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 13
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: function(context) {
                            return 'Time: ' + context[0].label;
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            let value = context.parsed.y.toFixed(1);
                            let status = '';
                            
                            if (context.datasetIndex === 0) {
                                // Heart Rate
                                if (value >= 60 && value <= 100) {
                                    status = ' ✓ Normal';
                                } else if (value < 60) {
                                    status = ' ⚠️ Low';
                                } else {
                                    status = ' ⚠️ High';
                                }
                                return label + ': ' + value + ' BPM' + status;
                            } else {
                                // SpO2
                                if (value >= 95) {
                                    status = ' ✓ Normal';
                                } else if (value >= 90) {
                                    status = ' ⚠️ Low';
                                } else {
                                    status = ' ⚠️ Critical';
                                }
                                return label + ': ' + value + '%' + status;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        font: {
                            size: 11
                        }
                    }
                },
                y: { 
                    type: 'linear', 
                    position: 'left', 
                    title: { 
                        display: true, 
                        text: 'Heart Rate (BPM)', 
                        color: '#C25959',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    min: 40,
                    max: 120,
                    ticks: { 
                        color: '#C25959',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(194, 89, 89, 0.1)'
                    }
                },
                y1: { 
                    type: 'linear', 
                    position: 'right', 
                    min: 85, 
                    max: 100, 
                    title: { 
                        display: true, 
                        text: 'Oxygen Saturation (%)', 
                        color: '#4A90E2',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    grid: { 
                        drawOnChartArea: false 
                    },
                    ticks: { 
                        color: '#4A90E2',
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });

    // --- 3. Initialize Real-time PPG Chart ---
    const ctxWave = document.getElementById('waveformChart').getContext('2d');
    waveformChart = new Chart(ctxWave, {
        type: 'line',
        data: {
            labels: Array(100).fill(''),
            datasets: [{
                label: 'IR Pulse (Live)',
                borderColor: '#829A72',
                backgroundColor: 'rgba(130, 154, 114, 0.1)',
                data: [],
                tension: 0.4,
                pointRadius: 0,
                fill: true,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                x: { display: false }, 
                y: { 
                    display: true,
                    grace: '10%',
                    title: {
                        display: true,
                        text: 'IR Signal Intensity'
                    }
                } 
            },
            animation: { duration: 0 },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });

    // Listen to Firebase for real-time IR values
    LATEST_DATA_REF.on('value', (snapshot) => {
        const val = snapshot.val();
        if (val && val.irValue !== undefined && val.irValue > 0) {
            waveformChart.data.datasets[0].data.push(val.irValue);
            
            if (waveformChart.data.datasets[0].data.length > 100) {
                waveformChart.data.datasets[0].data.shift();
            }
            
            waveformChart.update('none');
        }
    });

    // Store full dataset globally for resize handling
    window.fullDataset = { labels: [], bpms: [], spo2s: [] };

    // Handle window resize to update chart with appropriate data points
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (document.getElementById('daily-view').style.display !== 'none') {
                updateChartDisplay();
            }
        }, 250);
    });

    console.log('✓ Charts initialized');
});

// --- Helper function to update chart display based on current screen size ---
function updateChartDisplay() {
    const maxPoints = getMaxDataPoints();
    const { labels, bpms, spo2s } = window.fullDataset;
    
    if (!labels || labels.length === 0) return;
    
    // Always take from the END of the array (most recent data)
    const startIndex = Math.max(0, labels.length - maxPoints);
    const limitedLabels = labels.slice(startIndex);
    const limitedBpms = bpms.slice(startIndex);
    const limitedSpo2s = spo2s.slice(startIndex);
    
    const statusEl = document.getElementById('trend-status');
    const numSessions = limitedLabels.length;
    const totalSessions = labels.length;
    
    if (totalSessions > maxPoints) {
        statusEl.textContent = `Showing ${numSessions} most recent sessions (${totalSessions} total)`;
    } else {
        statusEl.textContent = `Displaying ${numSessions} recorded session${numSessions > 1 ? 's' : ''}`;
    }
    statusEl.style.color = '#829A72';
    
    // Update chart
    dailyTrendChart.data.labels = limitedLabels;
    dailyTrendChart.data.datasets[0].data = limitedBpms;
    dailyTrendChart.data.datasets[1].data = limitedSpo2s;
    dailyTrendChart.update();
    
    console.log(`✓ Displaying ${limitedLabels.length} most recent sessions (from ${totalSessions} total)`);
}

// --- 4. Daily Trend Logic (History Fetch) ---
function initTrendChart() {
    const statusEl = document.getElementById('trend-status');
    
    statusEl.textContent = "Loading historical data...";
    statusEl.style.color = '#829A72';
    
    // Pull the last 50 recorded sessions from the /History node
    LOGS_REF.limitToLast(50).once('value', (snapshot) => {
        const logs = snapshot.val();
        
        console.log('=== RAW FIREBASE DATA ===');
        console.log(logs);
        
        if (!logs || Object.keys(logs).length === 0) {
            statusEl.textContent = "No session history found. Start measuring to create history!";
            statusEl.style.color = '#829A72';
            
            // Show empty state on chart
            dailyTrendChart.data.labels = ['No Data'];
            dailyTrendChart.data.datasets[0].data = [0];
            dailyTrendChart.data.datasets[1].data = [0];
            dailyTrendChart.update();
            return;
        }

        const labels = [];
        const bpms = [];
        const spo2s = [];

        // Sort by Unix timestamp 't'
        const sortedEntries = Object.entries(logs).sort((a, b) => {
            const timeA = a[1].t || 0;
            const timeB = b[1].t || 0;
            return timeA - timeB;
        });

        sortedEntries.forEach(([key, entry]) => {
            // Use 'hr' and 'o2' fields from Firebase
            const hr = parseFloat(entry.hr) || 0;
            const o2 = parseFloat(entry.o2) || 0;
            
            console.log(`Session ${key}: hr=${hr}, o2=${o2}, time=${entry.time}`);
            
            // Use the 'time' field for label (HH:MM:SS format)
            const timeLabel = entry.time || key.substring(0, 8);
            
            // Only add if we have valid data
            if (hr > 0 || o2 > 0) {
                labels.push(timeLabel);
                bpms.push(hr);
                spo2s.push(o2);
            }
        });

        console.log('=== PROCESSED DATA ===');
        console.log('Labels:', labels);
        console.log('Heart Rates:', bpms);
        console.log('SpO2 Values:', spo2s);

        if (labels.length === 0) {
            statusEl.textContent = "No valid data in history. Check your sensor readings.";
            statusEl.style.color = '#C25959';
            return;
        }

        // Store full dataset globally for resize handling
        window.fullDataset = {
            labels: labels,
            bpms: bpms,
            spo2s: spo2s
        };

        // Display the data with current screen size limits
        updateChartDisplay();
        
        console.log(`✓ Loaded ${labels.length} total sessions from Firebase`);
    }, (error) => {
        console.error("Error loading history:", error);
        statusEl.textContent = "Error loading history. Check console for details.";
        statusEl.style.color = '#C25959';
    });
}

// Make switchTab globally accessible
window.switchTab = switchTab;