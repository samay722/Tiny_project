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
