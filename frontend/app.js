// Configuration
const API_URL = 'http://127.0.0.1:5001';

// Colors for Dynamic UI
const COLORS = {
    safe: '#10b981',     // Green
    warning: '#f59e0b',  // Yellow
    critical: '#ef4444', // Red
    bgDark: '#334155'
};

// ==========================================
// FRONTEND 1: SENSORY INPUTS & DATA CAPTURE
// ==========================================

// 1. Webcam Setup
async function initWebcam() {
    const video = document.getElementById('webcam-feed');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (err) {
        console.error("Webcam access denied", err);
        const video = document.getElementById('webcam-feed');
        video.parentElement.innerHTML += `
            <div style="position:absolute; top:0; left:0; width:100%; height:100%; 
                        background:rgba(0,0,0,0.8); color:white; display:flex; 
                        flex-direction:column; align-items:center; justify-content:center; 
                        padding:20px; text-align:center; font-size:14px;">
                <p>❌ Camera Access Failed</p>
                <p style="font-size:11px; margin-top:10px;">
                    Modern browsers block cameras on local files (file://).<br><br>
                    Please run with a local server or use the provide link.
                </p>
            </div>
        `;
    }
}

// 2. Audio Recording Setup
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let recordInterval;
let seconds = 0;

async function setupMic() {
    const btnMic = document.getElementById('btn-mic-start');
    const visualizer = document.getElementById('audio-visualizer');
    const btnAnalyzeVoice = document.getElementById('btn-analyze-voice');
    const timerEl = document.getElementById('recording-time');
    
    btnMic.addEventListener('click', async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                
                // Get most compatible mimeType
                const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                                ? 'audio/webm;codecs=opus' 
                                : 'audio/webm';

                console.log("Using MIME type:", mimeType);
                mediaRecorder = new MediaRecorder(stream, { mimeType });
                audioChunks = [];
                
                mediaRecorder.ondataavailable = e => {
                    if (e.data && e.data.size > 0) {
                        audioChunks.push(e.data);
                        console.log("Chunk received:", e.data.size);
                    }
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: mimeType });
                    window.currentAudioBlob = audioBlob;
                    console.log("Recording complete. Final Blob size:", audioBlob.size);
                    
                    if (audioBlob.size > 0) {
                        btnAnalyzeVoice.classList.remove('disabled');
                        btnAnalyzeVoice.removeAttribute('disabled');
                    } else {
                        alert("Recording failed: No audio data captured. Please try speaking louder or check your mic.");
                    }
                    
                    stream.getTracks().forEach(track => track.stop());
                };

                // Start timer
                seconds = 0;
                timerEl.innerText = "00:00";
                recordInterval = setInterval(() => {
                    seconds++;
                    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
                    const s = String(seconds % 60).padStart(2, '0');
                    timerEl.innerText = `${m}:${s}`;
                }, 1000);

                mediaRecorder.start(1000); // Capture chunks every second to prevent data loss
                isRecording = true;
                btnMic.innerHTML = "🛑 Stop";
                btnMic.style.background = "#ef4444";
                visualizer.classList.add('active');
                
            } catch (err) {
                console.error("Mic Access Error:", err);
                alert("Microphone Error: " + err.name + " - " + err.message);
            }
        } else {
            if (mediaRecorder && mediaRecorder.state !== "inactive") {
                mediaRecorder.stop();
            }
            clearInterval(recordInterval);
            isRecording = false;
            btnMic.innerHTML = "🎤 Record";
            btnMic.style.background = "";
            visualizer.classList.remove('active');
        }
    });
}

// ==========================================
// API COMMUNICATION (Sending to Flask)
// ==========================================

// Generic Fetch Function
async function sendToBackend(endpoint, payload, isFormData = false) {
    showLoader();
    try {
        const options = { method: 'POST' };
        if (isFormData) {
            options.body = payload;
        } else {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(payload);
        }

        const res = await fetch(`${API_URL}${endpoint}`, options);
        const data = await res.json();
        console.log("AI Backend Response:", data);
        
        // Update Results UI
        if (data.source === 'face') {
            document.getElementById('val-bpm').innerText = data.heart_rate || '--';
            document.getElementById('val-gaze').innerText = data.details?.gaze_stability || '--';
        }
        
        updateDashboard(data.global_score, data.stress_score, data.source, data.smart_tip, data.is_anomaly, data.forecast);
        fetchHistory(); // Refresh chart
        
    } catch (err) {
        console.error("Backend Error. Make sure Flask is running on port 5001.", err);
        alert("Could not reach the NeuroSense backend. Is app.py running?");
    } finally {
        hideLoader();
    }
}

// Attach Event Listeners
document.getElementById('btn-analyze-face').addEventListener('click', (e) => {
    // Show scanning animation
    e.target.parentElement.classList.add('scanning');
    
    const video = document.getElementById('webcam-feed');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas image to blob and send to backend
    canvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append('image', blob, 'webcam_capture.jpg'); 
        
        sendToBackend('/analyze/face', formData, true).finally(() => {
            e.target.parentElement.classList.remove('scanning');
        });
    }, 'image/jpeg');
});

document.getElementById('btn-analyze-voice').addEventListener('click', () => {
    const formData = new FormData();
    formData.append('audio', window.currentAudioBlob);
    sendToBackend('/analyze/voice', formData, true);
});

document.getElementById('btn-analyze-text').addEventListener('click', () => {
    const text = document.getElementById('nlp-text').value;
    if (!text) return alert("Please enter some text!");
    sendToBackend('/analyze/text', { text: text });
});

// ==========================================
// FRONTEND 2: RESULTS UI, GAUGE & CHARTS
// ==========================================

function updateDashboard(globalScore, localScore, source, smartTip = "", isAnomaly = false, forecast = null) {
    // 1. Update Number (Master Global Stress)
    const scoreEl = document.getElementById('stress-score');
    scoreEl.innerText = globalScore;

    // 2. Determine Color & Label based on Global Stress
    let color, label;
    if (globalScore < 40) {
        color = COLORS.safe; label = "Calm Base-state";
    } else if (globalScore < 75) {
        color = COLORS.warning; label = "Elevated/Active";
    } else {
        color = COLORS.critical; label = "High Stress Anomaly";
    }

    // 3. Animate Gauge
    const gauge = document.getElementById('stress-gauge');
    gauge.style.background = `conic-gradient(${color} ${globalScore}%, ${COLORS.bgDark} 0%)`;
    gauge.style.boxShadow = `0 0 30px ${color}80, inset 0 0 20px rgba(0,0,0,0.5)`;

    // 4. Update Status and Detailed Suggestion
    const statusEl = document.getElementById('stress-status');
    statusEl.innerText = isAnomaly ? "⚠️ ACUTE SPIKE DETECTED" : label;
    statusEl.style.color = isAnomaly ? COLORS.critical : color;
    statusEl.style.border = `1px solid ${isAnomaly ? COLORS.critical : color}`;
    
    // 5. Update Breakdown Bars
    document.getElementById(`bar-${source.toLowerCase()}`).style.width = `${localScore}%`;

    // 6. Background Alerts
    if (globalScore > 80 || isAnomaly) {
        document.body.classList.add('high-stress-mode');
    } else {
        document.body.classList.remove('high-stress-mode');
    }

    // 7. Update Soundscape
    updateSoundscape(globalScore);

    // 8. Trigger Wellness Coach on spikes
    if (globalScore > 75 || isAnomaly) {
        triggerCoach(isAnomaly ? 'Global' : source);
    }

    // Breakdown info and Smart Tip
    let forecastHTML = forecast !== null ? 
        `<div style="color: var(--primary); font-size: 0.85em; margin-top: 5px;">🔮 AI 20-min Forecast: ${forecast}% Stress</div>` : "";

    document.getElementById('stress-tip').innerHTML = `
        <div style="margin-bottom: 10px;">
            <strong>AI Smart Advice [${source.toUpperCase()}]:</strong><br>
            <span style="color: #fff; font-style: normal;">${smartTip}</span>
            ${forecastHTML}
        </div>
        <div style="font-size: 0.85em; opacity: 0.7;">
            Master Index: ${globalScore}% | Modality Contribution: ${localScore}%
        </div>
    `;
}

// 6. Download Report Logic
document.getElementById('btn-download-report').addEventListener('click', async () => {
    try {
        const res = await fetch(`${API_URL}/history`);
        const data = await res.json();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NeuroSense_Report_${new Date().getTime()}.json`;
        a.click();
    } catch (err) {
        alert("Could not generate report.");
    }
});

// 7. AI Ambient Soundscape Engine
const SOUNDS = {
    // These are High-Stability Direct Links
    safe: 'https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg',
    warning: 'https://actions.google.com/sounds/v1/ambient/park_ambience.ogg',
    critical: 'https://actions.google.com/sounds/v1/ambient/soft_wind_and_rain.ogg'
};

// Built-in Fallback Sound (Synthesized Beep)
const FALLBACK_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTv9Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pw==";

let isSoundPlaying = false;
const player = document.getElementById('ambient-player');
const soundBtn = document.getElementById('btn-toggle-sound');
const soundStatus = document.getElementById('sound-status');

soundBtn.addEventListener('click', () => {
    if (!isSoundPlaying) {
        const score = parseInt(document.getElementById('stress-score').innerText) || 0;
        let targetSrc;
        if (score < 40) targetSrc = SOUNDS.safe;
        else if (score < 75) targetSrc = SOUNDS.warning;
        else targetSrc = SOUNDS.critical;
        
        console.log("AI Audio Engine: Loading track ->", targetSrc);
        player.src = targetSrc;
        player.volume = 1.0; // Force 100% volume
        player.load();       // Force browser to buffer
        
        player.play()
            .then(() => {
                isSoundPlaying = true;
                soundBtn.innerText = "🛑 Stop Engine";
                soundBtn.style.background = "#ef4444";
                soundStatus.innerText = "Active";
            })
            .catch(e => {
                console.warn("Main audio blocked, trying fallback...");
                player.src = FALLBACK_SOUND;
                player.play();
                isSoundPlaying = true;
                soundBtn.innerText = "🛑 Stop Engine (Fallback)";
                soundStatus.innerText = "Active (Safe Mode)";
            });
    } else {
        player.pause();
        isSoundPlaying = false;
        soundBtn.innerText = "Play AI Soundscape";
        soundBtn.style.background = "";
        soundStatus.innerText = "Paused";
    }
});

function updateSoundscape(score) {
    if (!isSoundPlaying) return;
    
    let targetSrc;
    if (score < 40) targetSrc = SOUNDS.safe;
    else if (score < 75) targetSrc = SOUNDS.warning;
    else targetSrc = SOUNDS.critical;
    
    if (!player.src.includes(targetSrc)) {
        player.src = targetSrc;
        player.play();
    }
}

// 8. AI Wellness Coach
let challengeActive = false;
function triggerCoach(source) {
    if (challengeActive) return;
    
    const coachCard = document.getElementById('wellness-coach');
    const challengeText = document.getElementById('challenge-text');
    const timerEl = document.getElementById('challenge-timer');
    
    const challenges = {
        Face: "Your jaw is clenched. Perform 5 slow side-to-side jaw rotations now.",
        Voice: "Vocal tension detected. Hum 'mmm' for 10 seconds to relax vocal cords.",
        Text: "Cognitive load high. Close your eyes and name 3 things you can hear.",
        Global: "Overall stress spike! Stand up and reach for the ceiling for 10 seconds."
    };
    
    challengeText.innerText = challenges[source] || challenges.Global;
    coachCard.style.display = "block";
    challengeActive = true;
    
    let time = 30;
    const interval = setInterval(() => {
        time--;
        timerEl.innerText = `00:${String(time).padStart(2, '0')}`;
        if (time <= 0) {
            clearInterval(interval);
            coachCard.style.display = "none";
            challengeActive = false;
            // Reward: Slight decrease in visual stress for motivation
            const scoreEl = document.getElementById('stress-score');
            const current = parseInt(scoreEl.innerText);
            scoreEl.innerText = Math.max(0, current - 5);
        }
    }, 1000);
}

// 9. Privacy Shield Toggle
const privacyToggle = document.getElementById('privacy-toggle');
privacyToggle.addEventListener('change', (e) => {
    const feed = document.getElementById('webcam-feed');
    if (e.target.checked) {
        feed.classList.add('privacy-active');
    } else {
        feed.classList.remove('privacy-active');
    }
});

// 10. AI Stress Signature Profiler
function updateProfile(history) {
    if (history.length < 5) return;
    
    // Count high stress (>60) counts per modality
    const counts = { Face: 0, Voice: 0, Text: 0 };
    history.forEach(r => {
        if (r.score > 60) counts[r.type]++;
    });
    
    const types = Object.keys(counts);
    const primaryType = types.reduce((a, b) => counts[a] > counts[b] ? a : b);
    
    const profileEl = document.getElementById('profile-details');
    let description, recommendation;
    
    if (counts[primaryType] === 0) {
        description = "Balanced biological state.";
        recommendation = "No predominant stress pathway detected yet.";
    } else if (primaryType === 'Face') {
        description = "<strong>Visual Responder</strong>";
        recommendation = "Stress shows up first in your micro-expressions. Recommended: Eye-palming or face massage.";
    } else if (primaryType === 'Voice') {
        description = "<strong>Vocal Responder</strong>";
        recommendation = "Stress affects your throat and pitch first. Recommended: Humming or warm hydration.";
    } else {
        description = "<strong>Cognitive Responder</strong>";
        recommendation = "Stress manifests in your syntax and wording. Recommended: Mind-mapping or logic puzzles.";
    }

    profileEl.innerHTML = `
        <div style="font-size: 1.1rem; color: var(--secondary); margin-bottom: 0.5rem;">${description}</div>
        <p style="font-size: 0.85rem; opacity: 0.7;">${recommendation}</p>
    `;
}

// Chart.js Setup
let historyChart;
function initChart() {
    const ctx = document.getElementById('historyChart').getContext('2d');
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Timestamps
            datasets: [{
                label: 'Stress Score Over Time',
                data: [],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 2,
                tension: 0.4, // smooth curves
                fill: true,
                pointBackgroundColor: '#ec4899'
            }]
        },
        options: {
            responsive: true,
            color: '#94a3b8',
            scales: {
                y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// Fetch History from Flask backend
async function fetchHistory() {
    try {
        const res = await fetch(`${API_URL}/history`);
        const data = await res.json();
        
        // 1. Update Chart
        const records = data.history.reverse(); // Earliest to latest for graph
        const labels = records.map(r => r.timestamp.split(' ')[1]);
        const points = records.map(r => r.score);
        historyChart.data.labels = labels;
        historyChart.data.datasets[0].data = points;
        historyChart.update();

        // 2. Update Gauge and Intro Text with Latest Global Index
        if (data.current_fusion) {
            const global = data.current_fusion;
            document.getElementById('stress-score').innerText = global;
            
            let color = global < 40 ? COLORS.safe : (global < 75 ? COLORS.warning : COLORS.critical);
            const gauge = document.getElementById('stress-gauge');
            gauge.style.background = `conic-gradient(${color} ${global}%, ${COLORS.bgDark} 0%)`;
            
            // Toggle background alert
            if (global > 80) document.body.classList.add('high-stress-mode');
            else document.body.classList.remove('high-stress-mode');
        }

        // 3. Update Breakdown Bars with the most recent entry for each type
        const types = ['Face', 'Voice', 'Text'];
        types.forEach(type => {
            const lastOfThisType = data.history.find(r => r.type === type);
            if (lastOfThisType) {
                document.getElementById(`bar-${type.toLowerCase()}`).style.width = `${lastOfThisType.score}%`;
            }
        });

        // 4. Update AI Profile Section
        updateProfile([...data.history]); // Use spread to avoid side-effects from chart reversal

    } catch (err) {
        console.log("Could not load history yet.");
    }
}

// Global UI FX
function showLoader() { document.getElementById('global-loader').classList.add('active'); }
function hideLoader() { document.getElementById('global-loader').classList.remove('active'); }

// Init routines
window.onload = () => {
    initWebcam();
    setupMic();
    initChart();
    // Try fetch history on load
    fetchHistory();
};
