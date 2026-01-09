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

// --- ASSET LOADING ---
const shadowImg = new Image();
shadowImg.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/Shadow.gif';

// Variabile per il doppio tocco
let lastTap = 0;

// --- INITIALIZATION ---

function init() {
    // 1. Setup UI Selezione Anello
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

    // 2. Setup Anelli di sfondo
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
        
        // --- NUOVA LOGICA MOVIMENTO TOUCH ---
        if (gameState.touchActive) {
            const dx = gameState.touchX - gameState.playerX;
            const dy = gameState.touchY - gameState.playerY;
            // Inseguimento fluido: il player si sposta verso il dito
            gameState.playerX += dx * 0.2; 
            gameState.playerY += dy * 0.2;
        }

        Engine.updatePlayer(); // Mantiene compatibilità tastiera
        Engine.autoFire();
        Engine.updateBullets();
        Engine.updateSpecialRay();

        // --- LOGICA BOSS SHADOW ---
        if (gameState.gameTimer <= 30 && !gameState.bossActive) {
            gameState.bossActive = true;
            gameState.enemies = [];
            gameState.boss = {
                x: CONFIG.CANVAS_WIDTH / 2,
                y: -150,
                targetY: 150,
                size: 160,
                hp: 1000,
                maxHp: 1000
            };
        }

        // 3. Rendering
        Renderer.drawSpecialRay(ctx);
        if (gameState.isCharging) Renderer.drawChargeEffect(ctx);

        Renderer.drawPlayer(ctx);

        if (gameState.bossActive && gameState.boss) {
            if (gameState.boss.y < gameState.boss.targetY) {
                gameState.boss.y += 2; 
            }
            Renderer.drawBossShadow(ctx, gameState.boss, shadowImg);
            
            if (gameState.boss.hp <= 0) {
                showPowerUpScreen();
                return;
            }
        } else {
            gameState.enemies.forEach(enemy => {
                // Disegno nemici se implementato in Renderer
            });
        }

        Renderer.drawBullets(ctx);
        Renderer.drawUI(ctx);
        
        requestAnimationFrame(gameLoop);
    }
}

// --- HANDLERS ---

function startGame() {
    if (!shadowImg.complete) {
        setTimeout(startGame, 100);
        return;
    }

    startScreen.style.display = 'none';
    gameState.currentScreen = 'playing';
    
    gameState.timerInterval = setInterval(() => {
        if (gameState.gameTimer > 0) {
            gameState.gameTimer--;
        } else {
            clearInterval(gameState.timerInterval);
        }
    }, 1000);

    Engine.spawnEnemies(5);
    gameLoop();
}

function showPowerUpScreen() {
    gameState.currentScreen = 'powerup';
    powerUpScreen.style.display = 'flex';
}

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

// --- INPUT LISTENERS (KEYBOARD & TOUCH) ---

window.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;
    if (e.key === ' ' && gameState.currentScreen === 'playing') {
        e.preventDefault();
        fireSpecialAttackSequence();
    }
});

window.addEventListener('keyup', (e) => gameState.keys[e.key] = false);

// --- TOUCH SUPPORT AGGIORNATO ---

function handleTouchUpdate(e) {
    if (gameState.currentScreen !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    gameState.touchX = (touch.clientX - rect.left) * (CONFIG.CANVAS_WIDTH / rect.width);
    gameState.touchY = (touch.clientY - rect.top) * (CONFIG.CANVAS_HEIGHT / rect.height);
    gameState.touchActive = true;
}

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    // Logica Doppio Tocco
    const now = Date.now();
    if (now - lastTap < 300) {
        fireSpecialAttackSequence();
    }
    lastTap = now;

    handleTouchUpdate(e);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleTouchUpdate(e);
}, { passive: false });

canvas.addEventListener('touchend', () => {
    gameState.touchActive = false;
});
