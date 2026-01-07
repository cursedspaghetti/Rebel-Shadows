import { CONFIG, gameState } from './config.js';
import * as Renderer from './renderer.js';
import * as Engine from './engine.js';

// --- DOM ELEMENTS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const powerUpScreen = document.getElementById('powerUpScreen');
const startButton = document.getElementById('startButton');
const ringChoicesContainer = document.getElementById('ringChoices');
const gameContainer = document.getElementById('game-container');

// --- INITIALIZATION ---

function init() {
    // 1. Setup Ring Selection UI
    Object.keys(CONFIG.RING_COLORS).forEach(colorName => {
        const button = document.createElement('div');
        button.className = 'ring-choice';
        button.textContent = colorName;
        button.style.color = CONFIG.RING_COLORS[colorName];
        button.dataset.color = CONFIG.RING_COLORS[colorName];
        
        button.onclick = () => {
            document.querySelectorAll('.ring-choice').forEach(btn => btn.style.border = '4px solid transparent');
            button.style.border = '4px solid ' + button.dataset.color;
            gameState.selectedRingColor = button.dataset.color;
            startButton.disabled = false;
        };
        ringChoicesContainer.appendChild(button);
    });

    // 2. Setup Background Rings for Start Screen
    for (let i = 0; i < 14; i++) {
        gameState.rings.push({
            x: Math.random() * CONFIG.CANVAS_WIDTH,
            y: Math.random() * CONFIG.CANVAS_HEIGHT,
            size: Math.random() * 25 + 8,
            speed: Math.random() * 1.5 + 2.5,
            color: Object.values(CONFIG.RING_COLORS)[Math.floor(Math.random() * 7)],
            trail: []
        });
    }

    requestAnimationFrame(startScreenLoop);
}

// --- GAME LOOPS ---

function startScreenLoop() {
    if (gameState.currentScreen === 'start') {
        Engine.updateRings();
        Renderer.drawStartScreen(ctx);
        requestAnimationFrame(startScreenLoop);
    }
}

function gameLoop() {
    if (gameState.currentScreen === 'playing') {
        ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // 1. Background Scrolling
        gameState.backgroundPositionY += CONFIG.SCROLL_SPEED;
        gameContainer.style.backgroundPosition = `0px ${gameState.backgroundPositionY}px`;

        // 2. Logic Updates
        Engine.updatePlayer();
        Engine.autoFire();
        Engine.updateBullets();
        Engine.updateSpecialRay();

        // 3. Rendering
        Renderer.drawSpecialRay(ctx);
        if (gameState.isCharging) Renderer.drawChargeEffect(ctx);
        Renderer.drawPlayer(ctx);
        Renderer.drawBullets(ctx);
        Renderer.drawUI(ctx);

        // 4. Timer/Boss Logic
        if (gameState.bossActive && gameState.enemies.length === 0) {
            showPowerUpScreen();
            return; // Pause loop
        }

        requestAnimationFrame(gameLoop);
    }
}

// --- HANDLERS ---

function startGame() {
    startScreen.style.display = 'none';
    gameState.currentScreen = 'playing';
    
    // Timer Logic
    gameState.timerInterval = setInterval(() => {
        gameState.gameTimer--;
        if (gameState.gameTimer <= 0) {
            clearInterval(gameState.timerInterval);
            gameState.bossActive = true;
        }
    }, 1000);

    Engine.spawnEnemies(5);
    gameLoop();
}

function showPowerUpScreen() {
    gameState.currentScreen = 'powerup';
    powerUpScreen.style.display = 'flex';
}

// --- INPUT LISTENERS ---

window.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;
    if (e.key === ' ' && gameState.currentScreen === 'playing') {
        e.preventDefault();
        fireSpecialAttackSequence();
    }
});

window.addEventListener('keyup', (e) => gameState.keys[e.key] = false);

// Special Attack Sequence
function fireSpecialAttackSequence() {
    if (gameState.specialOnCooldown || gameState.isCharging) return;

    gameState.isCharging = true;
    setTimeout(() => {
        gameState.isCharging = false;
        gameState.specialRay.active = true;
        gameState.specialRay.startTime = Date.now() / 1000;
        gameState.specialRay.x = gameState.playerX;
        
        gameState.specialOnCooldown = true;
        gameState.specialLastUsed = Date.now() / 1000;
        setTimeout(() => gameState.specialOnCooldown = false, gameState.specialCooldown * 1000);
    }, 1000);
}

// Touch Support
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    gameState.touchIdentifier = touch.identifier;
    gameState.touchX = (touch.clientX - rect.left) * (CONFIG.CANVAS_WIDTH / rect.width);
    gameState.touchY = (touch.clientY - rect.top) * (CONFIG.CANVAS_HEIGHT / rect.height);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = Array.from(e.changedTouches).find(t => t.identifier === gameState.touchIdentifier);
    if (touch) {
        gameState.touchX = (touch.clientX - rect.left) * (CONFIG.CANVAS_WIDTH / rect.width);
        gameState.touchY = (touch.clientY - rect.top) * (CONFIG.CANVAS_HEIGHT / rect.height);
    }
}, { passive: false });

canvas.addEventListener('touchend', () => {
    gameState.touchIdentifier = null;
});

startButton.addEventListener('click', startGame);

// Start everything
init();
