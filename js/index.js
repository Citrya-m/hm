// /js/index.js - Improved connection detection with lag tolerance
document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase config loaded properly
    if (typeof LATEST_DATA_REF === 'undefined') {
        document.getElementById('connection-status').textContent = "ERROR: Firebase Not Configured!";
        document.getElementById('connection-status').className = "status-warn";
        return;
    }

    // Get DOM elements
    const bpmValueEl = document.getElementById('bpm-value');
    const spo2ValueEl = document.getElementById('spo2-value');
    const connectionStatusEl = document.getElementById('connection-status');
    const alertIndicatorEl = document.getElementById('alert-indicator');
    const lastUpdatedEl = document.getElementById('last-updated');

    // Connection tracking - balanced approach
    let lastDataTimestamp = 0;
    let connectionCheckInterval = null;
    let isConnected = false; // Track connection state to avoid flickering
    let missedUpdateCount = 0; // Count consecutive missed updates
    const DISCONNECT_TIMEOUT = 8000; // 8 seconds - balanced timeout
    const CHECK_INTERVAL = 1000; // Check every second

    // Initial state
    connectionStatusEl.textContent = "Waiting for device...";
    connectionStatusEl.className = "status-loading";

    // Check if data is stale - uses grace period approach
    function checkConnection() {
        const now = Date.now();
        const timeSinceUpdate = now - lastDataTimestamp;
        
        // Increment missed update counter if no data received
        if (timeSinceUpdate > CHECK_INTERVAL && lastDataTimestamp > 0) {
            missedUpdateCount++;
        }
        
        // Only mark as disconnected after sustained silence (8 consecutive seconds)
        if (timeSinceUpdate > DISCONNECT_TIMEOUT && lastDataTimestamp > 0 && isConnected) {
            // Device appears offline
            isConnected = false;
            connectionStatusEl.textContent = "DISCONNECTED: No Recent Data";
            connectionStatusEl.className = "status-warn";
            bpmValueEl.textContent = '--';
            spo2ValueEl.textContent = '--';
            alertIndicatorEl.textContent = "Device Offline - Check ESP32";
            alertIndicatorEl.className = "status-warn";
            
            document.getElementById('bpm-status').textContent = "Device disconnected";
            document.getElementById('bpm-status').style.color = 'var(--color-warning)';
            document.getElementById('spo2-status').textContent = "Device disconnected";
            document.getElementById('spo2-status').style.color = 'var(--color-warning)';
        }
    }

    // Start checking connection every second
    connectionCheckInterval = setInterval(checkConnection, CHECK_INTERVAL);

    // ========== REAL-TIME DATA LISTENER ==========
    LATEST_DATA_REF.on('value', (snapshot) => {
        const data = snapshot.val();
        
        // Check if we have valid data structure from ESP32
        if (data && data.bpm !== undefined && data.spo2 !== undefined) {
            const now = Date.now();
            
            // Update timestamp - receiving Firebase event means ESP32 is connected
            lastDataTimestamp = now;
            missedUpdateCount = 0; // Reset counter - we got data!
            
            // Mark as connected (prevents flickering during brief lag)
            if (!isConnected) {
                isConnected = true;
            }
            
            // ESP32 is connected and sending data (even if sensor has no finger)
            connectionStatusEl.textContent = "Connected & Receiving Data";
            connectionStatusEl.className = "status-ok";
            lastUpdatedEl.textContent = new Date().toLocaleTimeString();
            
            const bpm = parseFloat(data.bpm);
            const spo2 = parseFloat(data.spo2);
            
            // Only update display if values are valid (not zero)
            if (bpm > 0 && spo2 > 0) {
                bpmValueEl.textContent = `${bpm.toFixed(0)}`;
                spo2ValueEl.textContent = `${spo2.toFixed(1)}%`;
                
                // ========== HEALTH ALERT LOGIC ==========
                let alertMessage = "All Readings Normal";
                let alertClass = "status-ok";
                let warningSPO2 = false;
                let warningBPM = false;
                
                // Check SpO2 levels
                if (spo2 < 95.0) {
                    warningSPO2 = true;
                    alertMessage = "LOW SpO₂ ALERT! Check Oxygen Saturation.";
                    alertClass = "status-warn";
                }
                
                // Check heart rate (normal resting: 60-100 BPM)
                if (bpm > 100 || bpm < 60) {
                    warningBPM = true;
                    if (!warningSPO2) {
                        alertMessage = "Irregular Heart Rate Detected.";
                        alertClass = "status-warn";
                    }
                }
                
                // Critical condition: both abnormal
                if (spo2 < 90.0 && (bpm > 100 || bpm < 60)) {
                    alertMessage = "CRITICAL: Low SpO₂ & Irregular HR!";
                    alertClass = "status-alert";
                }
                
                // Update main alert indicator
                alertIndicatorEl.textContent = alertMessage;
                alertIndicatorEl.className = alertClass;
                
                // Update individual status messages
                document.getElementById('bpm-status').textContent = 
                    warningBPM ? "Irregular Reading (Check Ref. Page)" : "Normal Resting Rate";
                document.getElementById('bpm-status').style.color = 
                    warningBPM ? 'var(--color-warning)' : 'var(--color-normal)';
                
                document.getElementById('spo2-status').textContent = 
                    warningSPO2 ? `Low (${spo2.toFixed(1)}%)` : "Normal Saturation";
                document.getElementById('spo2-status').style.color = 
                    warningSPO2 ? 'var(--color-warning)' : 'var(--color-normal)';
            } else {
                // ESP32 connected but no valid readings yet (finger not placed)
                bpmValueEl.textContent = '--';
                spo2ValueEl.textContent = '--';
                alertIndicatorEl.textContent = "Place Finger on Sensor";
                alertIndicatorEl.className = "status-loading";
                
                document.getElementById('bpm-status').textContent = "Waiting for measurement";
                document.getElementById('bpm-status').style.color = 'var(--color-text)';
                document.getElementById('spo2-status').textContent = "Waiting for measurement";
                document.getElementById('spo2-status').style.color = 'var(--color-text)';
            }
        } else {
            // No data in database yet - ESP32 hasn't connected
            connectionStatusEl.textContent = "Waiting for device...";
            connectionStatusEl.className = "status-loading";
            alertIndicatorEl.textContent = "Waiting for ESP32 to send data...";
            alertIndicatorEl.className = "status-loading";
        }
    }, (error) => {
        // Error handler - usually permission issues
        console.error("Firebase Read Failed:", error.code, error.message);
        connectionStatusEl.textContent = `ERROR: ${error.code} (Check Console)`;
        connectionStatusEl.className = "status-warn";
        alertIndicatorEl.textContent = "Database Error - Check Firebase Rules";
        alertIndicatorEl.className = "status-warn";
        
        if (connectionCheckInterval) {
            clearInterval(connectionCheckInterval);
        }
    });

    console.log('✓ Dashboard initialized');
    console.log('✓ Listening for real-time updates...');
    console.log(`✓ Disconnect timeout set to ${DISCONNECT_TIMEOUT/1000} seconds`);
});