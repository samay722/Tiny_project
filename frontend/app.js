// Configuration
const API_URL = 'http://localhost:5001';

const COLORS = {
    safe: '#10b981',
    warning: '#f59e0b',
    critical: '#ef4444',
    bgDark: '#0f172a'
};

// Global State
var isCalibrated = false;
var isSoundPlaying = false;
var isRecording = false;
var isFlowing = false;
var challengeActive = false;

var mediaRecorder;
var audioChunks = [];
var recordInterval;
var seconds = 0;
var visualizerTimer;
var historyChart;
var radarChart;
var taskList, btnAddTask, taskInput;

// --- LIVE NEURAL BACKGROUND ENGINE ---
class NeuralBackground {
    constructor() {
        this.canvas = document.getElementById('neural-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.connectionDist = 200; // Increased reach
        this.particleCount = 150; // High density
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.init();
    }
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    init() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 1.5, // Faster base speed
                vy: (Math.random() - 0.5) * 1.5,
                size: Math.random() * 4 + 2 // Bigger neurons
            });
        }
        this.animate();
    }
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const score = parseInt(document.getElementById('stress-score').innerText) || 20;
        const speedMult = 1 + (score / 50); // Speed up based on stress
        const color = score > 75 ? '#ef4444' : (score > 40 ? '#f59e0b' : '#818cf8');

        this.particles.forEach((p, i) => {
            p.x += p.vx * speedMult;
            p.y += p.vy * speedMult;
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = color + 'cc'; // More opaque
            this.ctx.shadowBlur = 15; // Add glow
            this.ctx.shadowColor = color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0; // Reset for performance

            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                if (dist < this.connectionDist) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    const alpha = Math.floor((1 - dist/this.connectionDist) * 180).toString(16).padStart(2, '0');
                    this.ctx.strokeStyle = color + alpha; 
                    this.ctx.lineWidth = 1.2; // Thicker lines
                    this.ctx.stroke();
                }
            }
        });
        requestAnimationFrame(() => this.animate());
    }
}

var tasks = [
    { text: "Reply to critical emails", done: false },
    { text: "Architect database schema", done: false }
];

const SOUNDS = {
    safe: 'https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg',
    warning: 'https://actions.google.com/sounds/v1/ambient/park_ambience.ogg',
    critical: 'https://actions.google.com/sounds/v1/ambient/soft_wind_and_rain.ogg'
};

const FALLBACK_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTv9Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pw==";

// --- CORE FUNCTIONS ---

async function initWebcam() {
    const video = document.getElementById('webcam-feed');
    if (!video) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        video.srcObject = stream;
        console.log("Webcam Online");
    } catch (err) {
        console.error("Webcam Error", err);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); color:white; display:flex; align-items:center; justify-content:center; padding:20px; text-align:center; z-index:100;";
        errorDiv.innerHTML = `<p>âŒ Camera Failed: ${err.name}</p>`;
        video.parentElement.appendChild(errorDiv);
    }
}

async function setupMic() {
    const btnMic = document.getElementById('btn-mic-start');
    const visualizer = document.getElementById('audio-visualizer');
    const btnAnalyzeVoice = document.getElementById('btn-analyze-voice');
    const timerEl = document.getElementById('recording-time');

    if (!btnMic) return;

    btnMic.addEventListener('click', async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
                mediaRecorder.onstop = () => {
                    window.currentAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    btnAnalyzeVoice.removeAttribute('disabled');
                    stream.getTracks().forEach(t => t.stop());
                };
                mediaRecorder.start();
                isRecording = true;
                btnMic.innerHTML = "ðŸ›‘ Stop";
                btnMic.style.background = "#ef4444";
                seconds = 0;
                recordInterval = setInterval(() => {
                    seconds++;
                    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
                    const s = String(seconds % 60).padStart(2, '0');
                    timerEl.innerText = `${m}:${s}`;
                }, 1000);
            } catch (err) { alert("Mic Error: " + err.message); }
        } else {
            mediaRecorder.stop();
            clearInterval(recordInterval);
            isRecording = false;
            btnMic.innerHTML = "ðŸŽ¤ Record";
            btnMic.style.background = "";
        }
    });
}

async function sendToBackend(endpoint, payload, isFormData = false) {
    showLoader();
    try {
        const options = { method: 'POST' };
        if (isFormData) options.body = payload;
        else {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(payload);
        }

        const res = await fetch(`${API_URL}${endpoint}`, options);
        const data = await res.json();
        
        // Update UI
        if (data.source === 'face') {
            const bpmEl = document.getElementById('val-bpm');
            const gazeHUD = document.getElementById('val-gaze');
            const postureEl = document.getElementById('val-posture');
            const fatigueEl = document.getElementById('val-fatigue');
            if (bpmEl) bpmEl.innerText = data.heart_rate || '--';
            if (gazeHUD) gazeHUD.innerText = data.details?.gaze_stability || '--';
            if (postureEl) {
                postureEl.innerText = data.details?.posture || 'Detecting...';
                postureEl.style.color = (data.details?.posture === 'Slouching') ? COLORS.critical : '#6366f1';
            }
            if (fatigueEl) {
                fatigueEl.innerText = data.details?.fatigue || 'Alert';
                fatigueEl.style.color = (data.details?.fatigue === 'Drowsy') ? COLORS.secondary : '#f472b6';
            }
            
            const halo = document.getElementById('focus-halo');
            if (halo) {
                if (data.dominant_emotion.startsWith('EXCEPTIONAL')) halo.classList.add('active');
                else halo.classList.remove('active');
            }
            
            const gazeDot = document.getElementById('gaze-dot');
            const gazeStatus = data.details?.gaze_stability;
            if (gazeDot && gazeStatus) {
                gazeDot.style.opacity = "1";
                if (gazeStatus === "Looking Left") { gazeDot.style.left = "20%"; gazeDot.style.top = "50%"; }
                else if (gazeStatus === "Looking Right") { gazeDot.style.left = "80%"; gazeDot.style.top = "50%"; }
                else if (gazeStatus === "Centered") { gazeDot.style.left = "50%"; gazeDot.style.top = "50%"; }
            }
        }
        
        updateDashboard(data.global_score, data.stress_score, data.source, data.smart_tip, data.is_anomaly);
        fetchHistory();
        fetchNeuralTwin(); // Update ghost on every analysis
    } catch (err) {
        console.error("Backend Error", err);
    } finally { hideLoader(); }
}

function updateDashboard(globalScore, localScore, source, tip, isAnomaly) {
    const scoreEl = document.getElementById('stress-score');
    if (scoreEl) scoreEl.innerText = globalScore;

    let color = globalScore < 40 ? COLORS.safe : (globalScore < 75 ? COLORS.warning : COLORS.critical);
    const gauge = document.getElementById('stress-gauge');
    if (gauge) {
        gauge.style.background = `conic-gradient(${color} ${globalScore}%, rgba(15, 23, 42, 0.5) 0%)`;
        gauge.style.boxShadow = `0 0 30px ${color}80`;
    }

    const statusEl = document.getElementById('stress-status');
    if (statusEl) {
        statusEl.innerText = isAnomaly ? "âš ï¸ ACUTE SPIKE" : (globalScore < 40 ? "Calm" : "Elevated");
        statusEl.style.color = color;
    }

    const bar = document.getElementById(`bar-${source.toLowerCase()}`);
    if (bar) bar.style.width = `${localScore}%`;
}

async function fetchHistory() {
    try {
        const res = await fetch(`${API_URL}/history`);
        const data = await res.json();
        
        // Update Burnout Risk
        const burnoutEl = document.getElementById('val-burnout');
        if (burnoutEl && data.burnout_risk) {
            burnoutEl.innerText = data.burnout_risk;
            burnoutEl.style.color = data.burnout_risk.includes('CRITICAL') ? COLORS.critical : 
                                   (data.burnout_risk.includes('High') ? COLORS.warning : '#10b981');
        }

        if (historyChart && data.history) {
            const records = data.history.reverse().slice(-10);
            historyChart.data.labels = records.map(r => r.timestamp.split(' ')[1]);
            historyChart.data.datasets[0].data = records.map(r => r.score);
            historyChart.update();
        }
        updateProfile(data.history || []);
    } catch (e) {}
}

async function fetchNeuralTwin() {
    try {
        const res = await fetch(`${API_URL}/api/neural-twin`);
        const data = await res.json();
        const twinEl = document.getElementById('val-twin');
        if (twinEl && data.status === "success") {
            twinEl.innerText = `${data.twin_score}% (${data.type})`;
        }
    } catch (e) {}
}

async function fetchIntelligenceReport() {
    try {
        const res = await fetch(`${API_URL}/api/intelligence-report`);
        const data = await res.json();
        document.getElementById('val-hrv').innerText = data.hrv_index;
        document.getElementById('val-reserve').innerText = data.cognitive_reserve + '%';
        document.getElementById('val-baseline').innerText = data.personal_baseline + '%';
        const riskEl = document.getElementById('val-fatigue-risk');
        riskEl.innerText = data.fatigue_risk;
        riskEl.style.color = data.fatigue_risk === 'High' ? COLORS.critical : COLORS.safe;
    } catch (e) {}
}

function initChart() {
    const ctx = document.getElementById('historyChart').getContext('2d');
    historyChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Stress Index', data: [], borderColor: '#818cf8', tension: 0.4 }] },
        options: { scales: { y: { beginAtZero: true, max: 100 } } }
    });

    const radarCtx = document.getElementById('radarChart').getContext('2d');
    radarChart = new Chart(radarCtx, {
        type: 'radar',
        data: { labels: ['Visual', 'Vocal', 'Cognitive'], datasets: [{ data: [0,0,0], borderColor: '#f472b6' }] },
        options: { plugins: { legend: { display: false } } }
    });
}

function updateProfile(history) {
    if (!radarChart) return;
    const counts = { Face: 0, Voice: 0, Text: 0 };
    history.forEach(r => { if (r.score > 60) counts[r.type]++; });
    radarChart.data.datasets[0].data = [counts.Face, counts.Voice, counts.Text];
    radarChart.update();
}

function setupTaskManager() {
    taskList = document.getElementById('task-list');
    btnAddTask = document.getElementById('btn-add-task');
    taskInput = document.getElementById('new-task-input');
    if (btnAddTask) {
        btnAddTask.addEventListener('click', () => {
            const val = taskInput.value.trim();
            if (val) { tasks.push({ text: val, done: false }); taskInput.value = ''; renderTasks(); }
        });
    }
}

function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = '';
    tasks.forEach((t, i) => {
        const li = document.createElement('li');
        li.style.cssText = "display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;";
        li.innerHTML = `<span>${t.text}</span> <button onclick="tasks.splice(${i},1);renderTasks()" style="background:none; border:none; color:red; cursor:pointer;">âœ•</button>`;
        taskList.appendChild(li);
    });
}

function showLoader() { document.getElementById('global-loader')?.classList.add('active'); }
function hideLoader() { document.getElementById('global-loader')?.classList.remove('active'); }

window.onload = () => {
    new NeuralBackground();
    initWebcam();
    setupMic();
    initChart();
    setupTaskManager();
    renderTasks();
    fetchHistory();
    fetchNeuralTwin();
    fetchIntelligenceReport();
    
    // --- Continuous Bio-Monitoring Loop ---
    // This ensures HR and Gaze update automatically every 3 seconds
    setInterval(() => {
        const video = document.getElementById('webcam-feed');
        if (!video || video.paused || video.ended) return;

        const canvas = document.createElement('canvas');
        canvas.width = 160; // Lower resolution for background vitals to save bandwidth
        canvas.height = 120;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(blob => {
            const fd = new FormData();
            fd.append('image', blob, 'vitals_frame.jpg');
            // Use a specialized 'silent' flag or just regular send
            // We use a simplified version of sendToBackend to avoid showing the loader for every background check
            fetch(`${API_URL}/analyze/face`, { method: 'POST', body: fd })
                .then(res => res.json())
                .then(data => {
                    const bpmEl = document.getElementById('val-bpm');
                    const gazeHUD = document.getElementById('val-gaze');
                    const postureEl = document.getElementById('val-posture');
                    if (bpmEl) bpmEl.innerText = data.heart_rate || '--';
                    if (gazeHUD) gazeHUD.innerText = data.details?.gaze_stability || '--';
                    if (postureEl) {
                        postureEl.innerText = data.details?.posture || 'Detecting...';
                        postureEl.style.color = (data.details?.posture === 'Slouching') ? COLORS.critical : '#6366f1';
                    }
                    const fatigueEl = document.getElementById('val-fatigue');
                    if (fatigueEl) {
                        fatigueEl.innerText = data.details?.fatigue || 'Alert';
                        fatigueEl.style.color = (data.details?.fatigue === 'Drowsy') ? COLORS.secondary : '#f472b6';
                    }

                    const halo = document.getElementById('focus-halo');
                    if (halo) {
                        if (data.dominant_emotion.startsWith('EXCEPTIONAL')) halo.classList.add('active');
                        else halo.classList.remove('active');
                    }

                    // --- NEW: Sync Global Dashboard ---
                    // This ensures the Gauge and Charts update automatically
                    if (data.global_score !== undefined) {
                        updateDashboard(data.global_score, data.stress_score, 'Face', data.smart_tip, data.is_anomaly);
                    }

                    // Refresh history less frequently to save bandwidth (every 3rd scan ~9s)
                    if (window.scanCount === undefined) window.scanCount = 0;
                    window.scanCount++;
                    if (window.scanCount % 3 === 0) {
                        fetchHistory();
                        fetchNeuralTwin();
                        fetchIntelligenceReport();
                    }
                    
                    const gazeDot = document.getElementById('gaze-dot');
                    const gazeStatus = data.details?.gaze_stability;
                    if (gazeDot && gazeStatus) {
                        gazeDot.style.opacity = "1";
                        // Smooth transition added in CSS below
                        if (gazeStatus === "Looking Left") { gazeDot.style.left = "25%"; gazeDot.style.top = "50%"; }
                        else if (gazeStatus === "Looking Right") { gazeDot.style.left = "75%"; gazeDot.style.top = "50%"; }
                        else if (gazeStatus === "Centered") { gazeDot.style.left = "50%"; gazeDot.style.top = "50%"; }
                    }
                }).catch(e => console.log("Bio-monitor skip..."));
        }, 'image/jpeg', 0.5);
    }, 3000);

    // Event Listeners for Analysis
    document.getElementById('btn-analyze-face')?.addEventListener('click', async (e) => {
        if (!isCalibrated) {
            const overlay = document.getElementById('calibration-overlay');
            const timerEl = document.getElementById('calib-timer');
            if (overlay) {
                overlay.style.display = 'flex';
                for (let i = 5; i > 0; i--) { timerEl.innerText = i; await new Promise(r => setTimeout(r, 1000)); }
                overlay.style.display = 'none';
                isCalibrated = true;
            }
        }
        const video = document.getElementById('webcam-feed');
        const canvas = document.createElement('canvas');
        canvas.width = 640; canvas.height = 480;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(blob => {
            const fd = new FormData(); fd.append('image', blob, 'f.jpg');
            sendToBackend('/analyze/face', fd, true);
        }, 'image/jpeg');
    });

    document.getElementById('btn-analyze-voice')?.addEventListener('click', () => {
        const fd = new FormData(); fd.append('audio', window.currentAudioBlob);
        sendToBackend('/analyze/voice', fd, true);
    });

    document.getElementById('btn-analyze-text')?.addEventListener('click', () => {
        const text = document.getElementById('nlp-text').value;
        if (text) sendToBackend('/analyze/text', { text });
    });

    document.getElementById('btn-download-report')?.addEventListener('click', () => {
        window.location.href = `${API_URL}/download-report`;
    });
};
