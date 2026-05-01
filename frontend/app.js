const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001' 
    : 'https://neurosense-api.onrender.com'; // Replace with your Render URL after deployment
const COLORS = { safe:'#10b981', warning:'#f59e0b', critical:'#ef4444' };

var isSoundPlaying=false, isRecording=false;
var mediaRecorder, audioChunks=[], recordInterval, seconds=0;
var historyChart, radarChart;
var tasks = [{ text:"Reply to critical emails", done:false }, { text:"Architect database schema", done:false }];
var currentGoal = 50;
var hydrationLevel = 100;
var flowStreakMinutes = 0;
var slouchCount = 0;
const SOUNDS = {
    safe:'https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg',
    warning:'https://actions.google.com/sounds/v1/ambient/park_ambience.ogg',
    critical:'https://actions.google.com/sounds/v1/ambient/soft_wind_and_rain.ogg'
};

// ============================================================
// NEURAL BACKGROUND
// ============================================================
class NeuralBackground {
    constructor() {
        this.canvas = document.getElementById('neural-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.connectionDist = 200;
        this.particleCount = 150;
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.init();
    }
    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
    init() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random()*this.canvas.width, y: Math.random()*this.canvas.height,
                vx: (Math.random()-0.5)*1.5, vy: (Math.random()-0.5)*1.5,
                size: Math.random()*4+2
            });
        }
        this.animate();
    }
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const score = parseInt(document.getElementById('stress-score')?.innerText) || 20;
        const speedMult = 1 + (score/50);
        const color = score > 75 ? COLORS.critical : (score > 40 ? COLORS.warning : '#818cf8');
        this.particles.forEach((p, i) => {
            p.x += p.vx*speedMult; p.y += p.vy*speedMult;
            if (p.x<0||p.x>this.canvas.width) p.vx*=-1;
            if (p.y<0||p.y>this.canvas.height) p.vy*=-1;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            this.ctx.fillStyle = color + 'cc';
            this.ctx.shadowBlur = 15; this.ctx.shadowColor = color;
            this.ctx.fill(); this.ctx.shadowBlur = 0;
            for (let j=i+1; j<this.particles.length; j++) {
                const p2=this.particles[j];
                const dist=Math.hypot(p.x-p2.x, p.y-p2.y);
                if (dist<this.connectionDist) {
                    const alpha=Math.floor((1-dist/this.connectionDist)*160).toString(16).padStart(2,'0');
                    this.ctx.beginPath(); this.ctx.moveTo(p.x,p.y); this.ctx.lineTo(p2.x,p2.y);
                    this.ctx.strokeStyle=color+alpha; this.ctx.lineWidth=1.2; this.ctx.stroke();
                }
            }
        });
        requestAnimationFrame(() => this.animate());
    }
}

// ============================================================
// TOAST SYSTEM
// ============================================================
function showToast(message, type='info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('toast-visible'), 10);
    setTimeout(() => { toast.classList.remove('toast-visible'); setTimeout(() => toast.remove(), 400); }, 4000);
}

// ============================================================
// API STATUS DOT
// ============================================================
async function checkApiStatus() {
    const dot = document.getElementById('api-status-dot');
    if (!dot) return;
    try {
        const res = await fetch(`${API_URL}/`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
            dot.style.background = '#10b981';
            dot.style.boxShadow = '0 0 8px #10b981';
            dot.title = 'Backend: Online';
        } else throw new Error();
    } catch {
        dot.style.background = '#ef4444';
        dot.style.boxShadow = '0 0 8px #ef4444';
        dot.title = 'Backend: Offline';
    }
}

// ============================================================
// WEBCAM & MIC
// ============================================================
async function initWebcam() {
    const video = document.getElementById('webcam-feed');
    if (!video) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video:{width:{ideal:640},height:{ideal:480}} });
        video.srcObject = stream;
    } catch (err) { console.error("Webcam Error", err); }
}

async function setupMic() {
    const btnMic = document.getElementById('btn-mic-start');
    const btnAnalyzeVoice = document.getElementById('btn-analyze-voice');
    const timerEl = document.getElementById('recording-time');
    if (!btnMic) return;
    btnMic.addEventListener('click', async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
                mediaRecorder.onstop = () => {
                    window.currentAudioBlob = new Blob(audioChunks, { type:'audio/webm' });
                    btnAnalyzeVoice.removeAttribute('disabled');
                    stream.getTracks().forEach(t => t.stop());
                };
                mediaRecorder.start();
                isRecording=true; btnMic.innerHTML='🛑 Stop'; btnMic.style.background='#ef4444';
                seconds=0;
                recordInterval = setInterval(() => {
                    seconds++;
                    if (timerEl) timerEl.innerText = `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
                }, 1000);
            } catch (err) { alert('Mic Error: '+err.message); }
        } else {
            mediaRecorder.stop(); clearInterval(recordInterval);
            isRecording=false; btnMic.innerHTML='🎤 Record'; btnMic.style.background='';
        }
    });
}

// ============================================================
// BACKEND COMMUNICATION
// ============================================================
async function sendToBackend(endpoint, payload, isFormData=false) {
    showLoader();
    try {
        const options = { method:'POST' };
        if (isFormData) options.body=payload;
        else { options.headers={'Content-Type':'application/json'}; options.body=JSON.stringify(payload); }
        const res = await fetch(`${API_URL}${endpoint}`, options);
        const data = await res.json();
        if (data.source==='face') updateFaceHUD(data);
        updateDashboard(data.global_score, data.stress_score, data.source, data.smart_tip, data.is_anomaly, data.forecast);
        fetchHistory(); fetchNeuralTwin(); fetchIntelligenceReport();
    } catch (err) {
        console.error("Backend Error", err);
        showToast('Backend connection error. Is the server running?', 'warning');
    } finally { hideLoader(); }
}

// ============================================================
// DASHBOARD UPDATES
// ============================================================
function updateFaceHUD(data) {
    const bpmEl=document.getElementById('val-bpm');
    const gazeEl=document.getElementById('val-gaze');
    const postureEl=document.getElementById('val-posture');
    const fatigueEl=document.getElementById('val-fatigue');
    if (bpmEl) bpmEl.innerText=data.heart_rate||'--';
    if (gazeEl) gazeEl.innerText=data.details?.gaze_stability||'--';
    if (postureEl) {
        postureEl.innerText=data.details?.posture||'Detecting...';
        postureEl.style.color=(data.details?.posture==='Slouching')?COLORS.critical:'#6366f1';
    }
    if (fatigueEl) {
        fatigueEl.innerText=data.details?.fatigue||'Alert';
        fatigueEl.style.color=(data.details?.fatigue==='Drowsy')?COLORS.warning:'#f472b6';
    }
    
    // Ergonomic Slouch Snapshot Logic
    if (data.details?.posture === 'Slouching') {
        slouchCount++;
        if (slouchCount >= 5) {
            document.body.classList.add('slouch-blur');
        }
    } else {
        slouchCount = 0;
        document.body.classList.remove('slouch-blur');
    }
    
    const halo=document.getElementById('focus-halo');
    if (halo) { data.dominant_emotion?.startsWith('EXCEPTIONAL') ? halo.classList.add('active') : halo.classList.remove('active'); }
}

function updateDashboard(globalScore, localScore, source, tip, isAnomaly, forecast) {
    const scoreEl=document.getElementById('stress-score');
    if (scoreEl) scoreEl.innerText=globalScore;
    const color=globalScore<40?COLORS.safe:(globalScore<75?COLORS.warning:COLORS.critical);
    const gauge=document.getElementById('stress-gauge');
    if (gauge) {
        gauge.style.background=`conic-gradient(${color} ${globalScore}%, rgba(15,23,42,0.5) 0%)`;
        gauge.style.boxShadow=`0 0 30px ${color}80`;
    }
    const statusEl=document.getElementById('stress-status');
    if (statusEl) {
        statusEl.innerText=isAnomaly?'⚠️ ACUTE SPIKE':(globalScore<40?'Calm':'Elevated');
        statusEl.style.color=color;
    }
    const bar=document.getElementById(`bar-${source?.toLowerCase()}`);
    if (bar) bar.style.width=`${localScore}%`;
    const forecastEl=document.getElementById('val-forecast');
    if (forecastEl && forecast !== undefined) {
        forecastEl.innerText=forecast;
        const trendEl=document.getElementById('forecast-trend');
        if (trendEl) {
            if (forecast > globalScore) trendEl.innerText='📈 Increasing stress predicted';
            else if (forecast < globalScore) trendEl.innerText='📉 Recovery predicted';
            else trendEl.innerText='➡️ Stable trend';
        }
    }
    const tipPanel=document.getElementById('smart-tip-panel');
    const tipText=document.getElementById('smart-tip-text');
    if (tipPanel && tipText && tip) { tipText.innerText=tip; tipPanel.style.display='block'; }
    updateGoalProgress(globalScore);
    
    // Circadian Rhythm / Zen Theme Trigger
    const hour = new Date().getHours();
    if (hour >= 18 && globalScore > 50) {
        document.body.classList.add('theme-zen');
    } else if (globalScore < 40) {
        document.body.classList.remove('theme-zen');
    }
}

async function fetchHistory() {
    try {
        const res=await fetch(`${API_URL}/history`);
        const data=await res.json();
        if (historyChart&&data.history) {
            const records=data.history.reverse().slice(-10);
            historyChart.data.labels=records.map(r=>r.timestamp.split(' ')[1]);
            historyChart.data.datasets[0].data=records.map(r=>r.score);
            historyChart.update();
        }
        if (data.burnout_risk) {
            const el=document.getElementById('val-burnout');
            if (el) {
                el.innerText=data.burnout_risk;
                el.style.color=data.burnout_risk.includes('CRITICAL')?COLORS.critical:(data.burnout_risk.includes('High')?COLORS.warning:COLORS.safe);
            }
        }
        updateProfile(data.history||[]);
    } catch(e){}
}

async function fetchIntelligenceReport() {
    try {
        const res=await fetch(`${API_URL}/api/intelligence-report`);
        const data=await res.json();
        const set=(id,val)=>{ const el=document.getElementById(id); if(el) el.innerText=val; };
        set('val-hrv', data.hrv_index);
        set('val-reserve', data.cognitive_reserve+'%');
        set('val-baseline', data.personal_baseline);
        const fr=document.getElementById('val-fatigue-risk');
        if (fr) { fr.innerText=data.fatigue_risk; fr.style.color=data.fatigue_risk==='High'?COLORS.critical:COLORS.safe; }
    } catch(e){}
}

async function fetchNeuralTwin() {
    try {
        const res=await fetch(`${API_URL}/api/neural-twin`);
        const data=await res.json();
        const el=document.getElementById('val-twin');
        if (el&&data.status==='success') el.innerText=`${data.twin_score}% (${data.type})`;
    } catch(e){}
}

function initChart() {
    const ctx=document.getElementById('historyChart').getContext('2d');
    historyChart=new Chart(ctx,{
        type:'line',
        data:{ labels:[], datasets:[{ label:'Stress Index', data:[], borderColor:'#818cf8', backgroundColor:'rgba(129,140,248,0.08)', fill:true, tension:0.4 }]},
        options:{ scales:{ y:{ beginAtZero:true, max:100, grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'#94a3b8'} }, x:{ grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'#94a3b8'} } }, plugins:{legend:{labels:{color:'#e2e8f0'}}} }
    });
    const radarCtx=document.getElementById('radarChart').getContext('2d');
    radarChart=new Chart(radarCtx,{
        type:'radar',
        data:{ labels:['Visual','Vocal','Cognitive'], datasets:[{ data:[0,0,0], borderColor:'#f472b6', backgroundColor:'rgba(244,114,182,0.1)' }]},
        options:{ plugins:{legend:{display:false}}, scales:{r:{grid:{color:'rgba(255,255,255,0.1)'}, ticks:{color:'#94a3b8',backdropColor:'transparent'}, pointLabels:{color:'#e2e8f0'}}} }
    });
}

function updateProfile(history) {
    if (!radarChart) return;
    const counts={Face:0,Voice:0,Text:0};
    history.forEach(r => { if(r.score>60 && counts[r.type] !== undefined) counts[r.type]++; });
    radarChart.data.datasets[0].data=[counts.Face,counts.Voice,counts.Text];
    radarChart.update();
    
    const profileText = document.getElementById('profile-text');
    if (profileText) {
        const maxSource = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        if (counts[maxSource] === 0) {
            profileText.innerText = 'Profile: Balanced / No dominant stressor';
            profileText.style.color = 'var(--text-muted)';
        } else {
            profileText.innerText = `Dominant Stressor: ${maxSource} signals`;
            profileText.style.color = 'var(--accent-secondary)';
        }
    }
}

function showLoader() { document.getElementById('global-loader')?.classList.add('active'); }
function hideLoader() { document.getElementById('global-loader')?.classList.remove('active'); }

// ============================================================
// GOAL TRACKER
// ============================================================
function updateGoalProgress(score) {
    const bar=document.getElementById('goal-progress-bar');
    const label=document.getElementById('goal-progress-label');
    if (!bar||!label) return;
    const pct=Math.min(100, Math.round((score/currentGoal)*100));
    bar.style.width=`${Math.min(100,score)}%`;
    bar.style.background=score<=currentGoal?COLORS.safe:COLORS.critical;
    label.innerText=`${score} / ${currentGoal} (${pct>=100?'✅ Limit Reached':pct+'% of limit'})`;
}

// ============================================================
// TASK MANAGER
// ============================================================
function renderTasks() {
    const list=document.getElementById('task-list');
    if (!list) return;
    list.innerHTML='';
    tasks.forEach((task, i) => {
        const li=document.createElement('li');
        li.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid rgba(255,255,255,0.08);font-size:0.9rem;gap:10px;';
        li.innerHTML=`<span style="flex:1;${task.done?'text-decoration:line-through;opacity:0.5;':''}">${task.text}</span><button onclick="toggleTask(${i})" style="background:none;border:none;cursor:pointer;font-size:1.1rem;">${task.done?'↩️':'✅'}</button><button onclick="deleteTask(${i})" style="background:none;border:none;cursor:pointer;font-size:1.1rem;">🗑️</button>`;
        list.appendChild(li);
    });
}
function toggleTask(i) { tasks[i].done=!tasks[i].done; renderTasks(); }
function deleteTask(i) { tasks.splice(i,1); renderTasks(); }

// ============================================================
// BREATHING MODAL
// ============================================================
let breathTimeout=null;
function startBreathing() {
    const modal=document.getElementById('breathing-modal');
    const label=document.getElementById('breath-label');
    const counter=document.getElementById('breath-counter');
    const circle=document.getElementById('breath-circle');
    if (!modal) return;
    modal.classList.add('active');
    let cycle=0, maxCycles=4, phaseIdx=0;
    const phases=[
        {text:'Inhale...',dur:4000,scale:'1.4'},
        {text:'Hold...',dur:4000,scale:'1.4'},
        {text:'Exhale...',dur:6000,scale:'1.0'},
        {text:'Hold...',dur:2000,scale:'1.0'}
    ];
    function runPhase() {
        if (cycle>=maxCycles) { stopBreathing(); showToast('🧘 Breathing session complete!','success'); return; }
        const p=phases[phaseIdx];
        if (label) label.innerText=p.text;
        if (counter) counter.innerText=`Cycle ${cycle+1} / ${maxCycles}`;
        if (circle) circle.style.transform=`scale(${p.scale})`;
        breathTimeout=setTimeout(()=>{ phaseIdx++; if(phaseIdx>=phases.length){phaseIdx=0;cycle++;} runPhase(); }, p.dur);
    }
    runPhase();
}
function stopBreathing() {
    clearTimeout(breathTimeout);
    const modal=document.getElementById('breathing-modal');
    if (modal) modal.classList.remove('active');
    const circle=document.getElementById('breath-circle');
    if (circle) circle.style.transform='scale(1)';
}

// ============================================================
// AI FOCUS TIMER
// ============================================================
let focusInterval=null, focusRunning=false;
function startFocusTimer() {
    const btn=document.getElementById('btn-focus-timer');
    const display=document.getElementById('focus-timer-display');
    const status=document.getElementById('focus-status');
    const modeLabel=document.getElementById('focus-mode-label');
    if (focusRunning) {
        clearInterval(focusInterval); focusRunning=false;
        if(btn) btn.innerText='▶ Start Focus';
        if(status) status.innerText='IDLE';
        if(display) display.innerText='--:--';
        return;
    }
    const score=parseInt(document.getElementById('stress-score')?.innerText)||40;
    let duration, label;
    if (score<40){duration=50*60;label='🟢 Deep Work — 50 min';}
    else if (score<70){duration=25*60;label='🟡 Pomodoro — 25 min';}
    else {duration=10*60;label='🔴 Recovery — 10 min';}
    if(modeLabel) modeLabel.innerText=label;
    if(status) status.innerText='RUNNING';
    if(btn) btn.innerText='⏹ Stop Timer';
    focusRunning=true;
    showToast(`Focus Timer started: ${label}`,'info');
    let remaining=duration;
    function tick() {
        const m=String(Math.floor(remaining/60)).padStart(2,'0');
        const s=String(remaining%60).padStart(2,'0');
        if(display) display.innerText=`${m}:${s}`;
        if (remaining<=0) {
            clearInterval(focusInterval); focusRunning=false;
            if(status) status.innerText='COMPLETE';
            if(btn) btn.innerText='▶ Start Focus';
            showToast('⏱️ Focus session complete! Take a break.','success');
            startBreathing(); return;
        }
        remaining--;
    }
    tick();
    focusInterval=setInterval(tick,1000);
}

// ============================================================
// AMBIENT ENGINE
// ============================================================
let audioCtx;
let ambientOsc;
let ambientGain;

function toggleAmbientSound() {
    const btn=document.getElementById('btn-toggle-sound');
    const status=document.getElementById('sound-status');
    
    if (isSoundPlaying) {
        if (ambientGain) ambientGain.gain.setTargetAtTime(0, audioCtx?.currentTime || 0, 0.5);
        setTimeout(() => {
            if (ambientOsc) { try { ambientOsc.stop(); ambientOsc.disconnect(); } catch(e){} }
            if (audioCtx) { audioCtx.suspend(); }
        }, 500);
        isSoundPlaying=false;
        if(btn) btn.innerText='Initialize Audio Stream';
        if(status) status.innerText='IDLE';
        showToast('Ambient audio stopped.','info');
    } else {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            
            ambientOsc = audioCtx.createOscillator();
            ambientGain = audioCtx.createGain();
            
            const score=parseInt(document.getElementById('stress-score')?.innerText)||40;
            
            // Generate synthetic frequencies instead of external files
            if (score < 40) {
                ambientOsc.type = 'sine';
                ambientOsc.frequency.value = 174; // Safe: 174Hz Healing frequency
            } else if (score < 75) {
                ambientOsc.type = 'triangle';
                ambientOsc.frequency.value = 432; // Warning: 432Hz Grounding frequency
            } else {
                ambientOsc.type = 'sine';
                ambientOsc.frequency.value = 85.2; // Critical: Low frequency drone
            }
            
            ambientOsc.connect(ambientGain);
            ambientGain.connect(audioCtx.destination);
            
            ambientGain.gain.setValueAtTime(0, audioCtx.currentTime);
            ambientGain.gain.setTargetAtTime(0.1, audioCtx.currentTime, 2); // Gentle fade-in
            
            ambientOsc.start();
            isSoundPlaying=true;
            if(btn) btn.innerText='⏹ Stop Audio';
            if(status) status.innerText='ACTIVE';
            showToast(`🎧 Neural frequency stream (${ambientOsc.frequency.value}Hz) active.`,'success');
        } catch(e) {
            showToast('Audio engine error. Please interact with the page first.','warning');
            console.error(e);
        }
    }
}

// ============================================================
// PRIVACY TOGGLE
// ============================================================
function setupPrivacyToggle() {
    const toggle=document.getElementById('privacy-toggle');
    const video=document.getElementById('webcam-feed');
    if (!toggle||!video) return;
    toggle.addEventListener('change',()=>{
        video.style.filter=toggle.checked?'blur(20px) brightness(0.2)':'none';
        showToast(toggle.checked?'🔒 Neural Privacy Mode ON':'🔓 Neural Privacy Mode OFF','info');
    });
}

// ============================================================
// MAIN INIT
// ============================================================
window.onload = () => {
    new NeuralBackground();
    initWebcam();
    setupMic();
    initChart();
    setupPrivacyToggle();
    renderTasks();
    fetchHistory(); fetchNeuralTwin(); fetchIntelligenceReport();
    checkApiStatus();
    setInterval(checkApiStatus, 15000);

    // Auto bio-monitor loop every 3s
    setInterval(()=>{
        const video=document.getElementById('webcam-feed');
        if(!video||video.paused||video.ended||!video.srcObject) return;
        const c=document.createElement('canvas'); c.width=160; c.height=120;
        c.getContext('2d').drawImage(video,0,0,c.width,c.height);
        c.toBlob(blob=>{
            const fd=new FormData(); fd.append('image',blob,'vitals_frame.jpg');
            fetch(`${API_URL}/analyze/face`,{method:'POST',body:fd})
                .then(r=>r.json()).then(data=>{
                    updateFaceHUD(data);
                    if(data.global_score!==undefined) {
                        updateDashboard(data.global_score,data.stress_score,'Face',data.smart_tip,data.is_anomaly,data.forecast);
                        fetchHistory(); // 🔄 Refresh chart automatically
                    }
                }).catch(()=>{});
        },'image/jpeg',0.5);
    },3000);

    // Face Analyze
    document.getElementById('btn-analyze-face')?.addEventListener('click',()=>{
        const video=document.getElementById('webcam-feed');
        const c=document.createElement('canvas'); c.width=640; c.height=480;
        c.getContext('2d').drawImage(video,0,0);
        c.toBlob(blob=>{ const fd=new FormData(); fd.append('image',blob,'f.jpg'); sendToBackend('/analyze/face',fd,true); },'image/jpeg');
    });

    // Voice Analyze
    document.getElementById('btn-analyze-voice')?.addEventListener('click',()=>{
        const fd=new FormData(); fd.append('audio',window.currentAudioBlob);
        sendToBackend('/analyze/voice',fd,true);
    });

    // Text Analyze
    document.getElementById('btn-analyze-text')?.addEventListener('click',()=>{
        const text=document.getElementById('nlp-text').value;
        if(text) sendToBackend('/analyze/text',{text});
    });

    // Export PDF
    document.getElementById('btn-download-report')?.addEventListener('click',()=>{
        showToast('📥 Generating PDF report...','info');
        window.open(`${API_URL}/download-report`,'_blank');
    });

    // Export CSV
    document.getElementById('btn-export-csv')?.addEventListener('click',()=>{
        showToast('📊 Exporting CSV data...','info');
        window.open(`${API_URL}/export-csv`,'_blank');
    });

    // Focus Timer
    document.getElementById('btn-focus-timer')?.addEventListener('click', startFocusTimer);

    // Breathing Modal
    document.getElementById('btn-trigger-breath')?.addEventListener('click', startBreathing);
    document.getElementById('btn-skip-breath')?.addEventListener('click', stopBreathing);

    // Ambient Engine
    document.getElementById('btn-toggle-sound')?.addEventListener('click', toggleAmbientSound);

    // Task Manager
    document.getElementById('btn-add-task')?.addEventListener('click',()=>{
        const input=document.getElementById('new-task-input');
        if(input&&input.value.trim()){
            tasks.push({text:input.value.trim(),done:false});
            input.value='';
            renderTasks();
            showToast('✅ Neural task added.','success');
        }
    });
    document.getElementById('new-task-input')?.addEventListener('keydown',e=>{
        if(e.key==='Enter') document.getElementById('btn-add-task')?.click();
    });

    // Goal Tracker
    document.getElementById('btn-set-goal')?.addEventListener('click',()=>{
        const input=document.getElementById('goal-input');
        if(input){ currentGoal=parseInt(input.value)||50; showToast(`🎯 Daily goal set to ${currentGoal}/100`,'success'); }
        const score=parseInt(document.getElementById('stress-score')?.innerText)||0;
        updateGoalProgress(score);
    });

    // Bio-Sustenance AI Tracker
    document.getElementById('btn-log-water')?.addEventListener('click', () => {
        hydrationLevel = 100;
        updateHydrationUI();
        showToast('💧 Hydration optimized. Cognitive function restoring.', 'success');
    });

    setInterval(() => {
        // Drain hydration slightly faster if stress is high
        const score = parseInt(document.getElementById('stress-score')?.innerText) || 40;
        const drainRate = score > 60 ? 2 : 1; 
        
        hydrationLevel = Math.max(0, hydrationLevel - drainRate);
        updateHydrationUI();
        
        if (hydrationLevel === 20) {
            showToast('⚠️ Hydration low. Postural and cognitive fatigue imminent.', 'warning');
        }
    }, 15000); // Check every 15 seconds

    // Flow State Streak Tracker
    setInterval(() => {
        const score = parseInt(document.getElementById('stress-score')?.innerText) || 50;
        const badge = document.getElementById('flow-state-badge');
        const streakVal = document.getElementById('flow-streak-val');
        
        if (score < 45) {
            flowStreakMinutes++;
            if(badge) badge.style.display = 'flex';
            if(streakVal) streakVal.innerText = flowStreakMinutes;
            
            if (flowStreakMinutes === 25) showToast('🌊 Deep Flow State maintained for 25 mins. Pomodoro break recommended.', 'success');
        } else if (score > 60) {
            if (flowStreakMinutes > 10) showToast(`Flow State broken after ${flowStreakMinutes} minutes. Take a breath.`, 'warning');
            flowStreakMinutes = 0;
            if(badge) badge.style.display = 'none';
            if(streakVal) streakVal.innerText = '0';
        }
    }, 60000); // Check every minute
};

function updateHydrationUI() {
    const bar = document.getElementById('hydration-bar');
    const val = document.getElementById('hydration-val');
    if (bar && val) {
        bar.style.width = `${hydrationLevel}%`;
        val.innerText = `${hydrationLevel}%`;
        if (hydrationLevel > 60) {
            bar.style.background = '#3b82f6';
            val.style.color = '#3b82f6';
        } else if (hydrationLevel > 20) {
            bar.style.background = COLORS.warning;
            val.style.color = COLORS.warning;
        } else {
            bar.style.background = COLORS.critical;
            val.style.color = COLORS.critical;
        }
    }
}
