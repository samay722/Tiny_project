// --- TOAST SYSTEM ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">${message}</div>
        <button class="toast-close">✕</button>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('toast-visible'), 10);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.onclick = () => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 400);
    };

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('toast-visible');
            setTimeout(() => toast.remove(), 400);
        }
    }, 5000);
}

// --- PRIVACY TOGGLE ---
function setupPrivacyToggle() {
    const toggle = document.getElementById('privacy-toggle');
    const video = document.getElementById('webcam-feed');
    if (!toggle || !video) return;

    toggle.addEventListener('change', (e) => {
        window.privacyMode = e.target.checked;
        if (window.privacyMode) {
            video.style.filter = 'blur(20px) grayscale(1)';
            showToast('🔒 Privacy Mode Active: Camera feed blurred & monitoring paused.', 'info');
        } else {
            video.style.filter = 'none';
            showToast('🔓 Privacy Mode Disabled: Resuming monitoring.', 'info');
        }
    });
}

// --- BREATHING EXERCISE ---
let breathInterval;
function triggerBreathingExercise() {
    const modal = document.getElementById('breathing-modal');
    const circle = document.getElementById('breath-circle');
    const label = document.getElementById('breath-label');
    const counter = document.getElementById('breath-counter');
    const skipBtn = document.getElementById('btn-skip-breath');

    if (!modal || !circle) return;

    modal.classList.add('active');
    let cycle = 1;
    const maxCycles = 4;

    const runCycle = () => {
        counter.innerText = `Cycle ${cycle} / ${maxCycles}`;
        
        // Inhale (4s)
        label.innerText = 'Inhale...';
        circle.style.transform = 'scale(1.5)';
        circle.style.borderColor = 'var(--accent-primary)';
        
        setTimeout(() => {
            // Hold (4s)
            label.innerText = 'Hold...';
            circle.style.borderColor = 'var(--accent-secondary)';
            
            setTimeout(() => {
                // Exhale (4s)
                label.innerText = 'Exhale...';
                circle.style.transform = 'scale(1)';
                circle.style.borderColor = 'var(--safe)';
                
                setTimeout(() => {
                    cycle++;
                    if (cycle <= maxCycles) {
                        runCycle();
                    } else {
                        finishBreathing();
                    }
                }, 4000);
            }, 4000);
        }, 4000);
    };

    const finishBreathing = () => {
        modal.classList.remove('active');
        circle.style.transform = 'scale(1)';
        showToast('🧘 Breathing complete. Vitality levels stabilized.', 'success');
    };

    skipBtn.onclick = finishBreathing;
    runCycle();
}

// --- BEHAVIORAL TRACKER (KEYBOARD) ---
function setupKeyboardTracker() {
    let keyCount = 0;
    let lastTime = Date.now();
    let errorCount = 0;

    document.addEventListener('keydown', (e) => {
        keyCount++;
        if (e.key === 'Backspace') errorCount++;

        // Every 30 seconds, calculate metrics and send to backend
        const now = Date.now();
        if (now - lastTime > 30000) {
            const wpm = Math.round((keyCount / 5) / (30 / 60));
            const errorRate = Math.round((errorCount / keyCount) * 100) || 0;
            
            // Send to behavior endpoint
            // Stress signal: High error rate or extremely high/low speed
            let behaviorScore = 20; // base
            if (wpm > 80) behaviorScore += 15;
            if (errorRate > 10) behaviorScore += 20;

            fetch(`${API_URL}/analyze/behavior`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score: behaviorScore })
            }).catch(() => {});

            // Reset
            keyCount = 0;
            errorCount = 0;
            lastTime = now;
        }
    });
}

// --- DAILY GOAL SYSTEM ---
function setupDailyGoal() {
    const btn = document.getElementById('btn-set-goal');
    const input = document.getElementById('goal-input');
    if (!btn || !input) return;

    // Load saved goal
    const savedGoal = localStorage.getItem('neuro_goal');
    if (savedGoal) input.value = savedGoal;

    btn.onclick = () => {
        localStorage.setItem('neuro_goal', input.value);
        showToast(`🎯 Daily Stress Goal set to ${input.value}`, 'success');
        updateGoalBar(parseInt(document.getElementById('stress-score').innerText) || 0);
    };
}

function updateGoalBar(currentScore) {
    const goal = parseInt(localStorage.getItem('neuro_goal')) || 50;
    const bar = document.getElementById('goal-progress-bar');
    const label = document.getElementById('goal-progress-label');
    if (!bar || !label) return;

    const percentage = Math.min(Math.round((currentScore / goal) * 100), 100);
    bar.style.width = `${percentage}%`;
    label.innerText = `${currentScore} / ${goal} (${percentage}%)`;

    if (currentScore > goal) {
        bar.style.background = 'var(--critical)';
        showToast('🚩 Stress Limit Exceeded! Protocol Activation Recommended.', 'warning');
    } else {
        bar.style.background = 'var(--safe)';
    }
}

// --- AI FOCUS TIMER ---
let focusTimer;
function setupFocusTimer() {
    const btn = document.getElementById('btn-focus-timer');
    const display = document.getElementById('focus-timer-display');
    const label = document.getElementById('focus-mode-label');
    const status = document.getElementById('focus-status');
    if (!btn || !display) return;

    let timeLeft = 0;
    let isRunning = false;

    btn.onclick = () => {
        if (!isRunning) {
            // Calculate duration based on stress
            const score = parseInt(document.getElementById('stress-score').innerText) || 50;
            // High stress (80+) -> 15 min, Low stress (<30) -> 45 min
            let minutes = 25; // Default Pomodoro
            if (score > 75) minutes = 15;
            else if (score < 30) minutes = 45;

            timeLeft = minutes * 60;
            isRunning = true;
            btn.innerText = '⏹ Stop Focus';
            status.innerText = 'ACTIVE';
            label.innerText = score > 75 ? 'Short Sprint Mode' : 'Deep Work Mode';
            
            showToast(`⏱️ Focus session started: ${minutes} minutes.`, 'info');

            focusTimer = setInterval(() => {
                timeLeft--;
                const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
                const s = String(timeLeft % 60).padStart(2, '0');
                display.innerText = `${m}:${s}`;

                if (timeLeft <= 0) {
                    clearInterval(focusTimer);
                    isRunning = false;
                    btn.innerText = '▶ Start Focus';
                    status.innerText = 'IDLE';
                    showToast('🎉 Focus session complete! Take a break.', 'success');
                }
            }, 1000);
        } else {
            clearInterval(focusTimer);
            isRunning = false;
            btn.innerText = '▶ Start Focus';
            status.innerText = 'IDLE';
            display.innerText = '--:--';
            label.innerText = 'Start to calibrate';
        }
    };
}

// --- AUDIO VISUALIZER ---
let audioCtx, analyser, dataArray, animationId;
function startVisualizer(stream) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 32;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    const bars = document.querySelectorAll('#audio-visualizer .bar');
    
    function draw() {
        animationId = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        bars.forEach((bar, i) => {
            const val = dataArray[i] || 0;
            const height = Math.max(10, (val / 255) * 60);
            bar.style.height = `${height}px`;
        });
    }
    draw();
}

function stopVisualizer() {
    cancelAnimationFrame(animationId);
    const bars = document.querySelectorAll('#audio-visualizer .bar');
    bars.forEach(bar => bar.style.height = '10px');
}
