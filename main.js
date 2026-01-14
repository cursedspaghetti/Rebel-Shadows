import { CONFIG, gameState } from './config.js';
import * as Renderer from './renderer.js';
import * as Engine from './engine.js';

// --- CONFIGURAZIONE AGGIUNTIVA ---
const TOUCH_SETTINGS = {
    LERP: 0.1,             // Fluidità (più alto = più reattivo)
    OFFSET_Y: 75,         // Distanza sopra il dito per visibilità mobile
    DOUBLE_TAP_DELAY: 300  // Tempo massimo per attivare lo speciale (ms)
};

gameState.isTouchActive = false;
gameState.lastTouchTime = 0;

// --- DOM ELEMENTS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const powerUpScreen = document.getElementById('powerUpScreen');
const startButton = document.getElementById('startButton');
const ringChoicesContainer = document.getElementById('ringChoices');
const gameContainer = document.getElementById('game-container');

// --- ASSET LOADING ---
const playerSprite = new Image();
playerSprite.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/booksprite.png';
export const chargeImg = new Image();
chargeImg.src = "https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/bookfull.png";
const shadowImg = new Image();
shadowImg.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/Shadow.png';
const introImage = new Image();
introImage.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/Shadow.png/shadow_intro.jpg';


// --- INITIALIZATION ---
function init() {
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
        Renderer.drawStartScreen(ctx,introImage);
        requestAnimationFrame(startScreenLoop);
    }
}

function gameLoop() {
    if (gameState.currentScreen === 'playing') {
        ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // 1. Background Scrolling
        gameState.backgroundPositionY += CONFIG.SCROLL_SPEED;
        gameContainer.style.backgroundPosition = `0px ${gameState.backgroundPositionY}px`;

        // 2. LOGICA MOVIMENTO (Sostituisce Engine.updatePlayer)
        if (gameState.isTouchActive) {
            const targetX = gameState.touchX;
            const targetY = gameState.touchY - TOUCH_SETTINGS.OFFSET_Y;

            // Inseguimento fluido con Lerp e Offset
            gameState.playerX += (targetX - gameState.playerX) * TOUCH_SETTINGS.LERP;
            gameState.playerY += (targetY - gameState.playerY) * TOUCH_SETTINGS.LERP;
        } else {
            // Supporto tastiera se il touch non è attivo
            if (gameState.keys['ArrowLeft']) gameState.playerX -= gameState.playerSpeed;
            if (gameState.keys['ArrowRight']) gameState.playerX += gameState.playerSpeed;
            if (gameState.keys['ArrowUp']) gameState.playerY -= gameState.playerSpeed;
            if (gameState.keys['ArrowDown']) gameState.playerY += gameState.playerSpeed;
        }

        // 2.1 Limiti bordi obbligatori
        gameState.playerX = Math.max(10, Math.min(CONFIG.CANVAS_WIDTH - 10, gameState.playerX));
        gameState.playerY = Math.max(10, Math.min(CONFIG.CANVAS_HEIGHT - 10, gameState.playerY));

        // 2.2 Reset Inclinazione (Forza il player a stare dritto)
        gameState.playerDx = 0;
        gameState.playerDy = 0;

        // 3. Logic Updates
        Engine.autoFire();
        Engine.updateBullets();
        Engine.updateSpecialRay();

        // 4. Boss Logic
        if (gameState.bossActive && gameState.boss) {
            gameState.bullets.forEach((bullet, bIndex) => {
                const dx = bullet.x - gameState.boss.x;
                const dy = bullet.y - gameState.boss.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < gameState.boss.size) {
                    gameState.boss.hp -= 10;
                    gameState.bullets.splice(bIndex, 1);
                }
            });

            if (gameState.specialRay.active) {
                if (Math.abs(gameState.specialRay.x - gameState.boss.x) < gameState.boss.size) {
                    gameState.boss.hp -= 5;
                }
            }
        }

        if (gameState.gameTimer <= 58 && !gameState.bossActive) {
            gameState.bossActive = true;
            gameState.enemies = [];
            gameState.boss = {
                x: CONFIG.CANVAS_WIDTH / 2,
                y: -150,
                targetY: 300,
                size: 140,
                hp: 5000,
                maxHp: 5000
            };
        }

        // 5. Rendering
        Renderer.drawPlayer(ctx, playerSprite);

        if (gameState.bossActive && gameState.boss) {
            if (gameState.boss.y < gameState.boss.targetY) gameState.boss.y += 2;
            Renderer.drawBossShadow(ctx, gameState.boss, shadowImg);
            if (gameState.boss.hp <= 0) {
                showPowerUpScreen();
                return;
            }
        }

        Renderer.drawSpecialRay(ctx);
        if (gameState.isCharging) Renderer.drawChargeEffect(ctx, chargeImg);
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
        if (gameState.gameTimer > 0) gameState.gameTimer--;
        else clearInterval(gameState.timerInterval);
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

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const currentTime = Date.now();

    // Logica Double Tap
    if (currentTime - gameState.lastTouchTime < TOUCH_SETTINGS.DOUBLE_TAP_DELAY) {
        if (gameState.currentScreen === 'playing') fireSpecialAttackSequence();
    }
    gameState.lastTouchTime = currentTime;

    gameState.touchIdentifier = touch.identifier;
    gameState.isTouchActive = true;
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
    gameState.isTouchActive = false;
});

startButton.addEventListener('click', startGame);

init();
