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
