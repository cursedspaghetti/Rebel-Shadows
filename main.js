import { CONFIG, gameState } from './config.js';
import * as Renderer from './renderer.js';
import * as Boss1 from './Boss1.js';
import * as SpcialAttacks from './SpecialAttacks.js';

// --- CONFIGURAZIONE TOUCH ---
const TOUCH_SETTINGS = {
    LERP: 0.1,             // Fluidità inseguimento
    OFFSET_Y: 75,          // Distanza sopra il dito
    TAP_DELAY: 250         // Tempo di attesa per distinguere Single/Double Tap (ms)
};

// Variabili di stato locali per l'input
let secondFingerTimer = null;
gameState.isTouchActive = false;
gameState.touchIdentifier = null;

// --- DOM ELEMENTS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const powerUpScreen = document.getElementById('powerUpScreen');
const startButton = document.getElementById('startButton');
const ringChoicesContainer = document.getElementById('ringChoices');
const gameContainer = document.getElementById('game-container');

// --- background images LOADING ---
const introImage = new Image();
introImage.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/shadow_intro.jpg';
const bgImage = new Image();
bgImage.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/EmptySpaceVoid.png';
const bgParallax = new Image();
bgParallax.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/EmptySpace.png'; 
// Nota: idealmente qui useresti un'immagine diversa con solo puntini bianchi
// asset loading 
const playerSprite = new Image();
playerSprite.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/booksprite.png';
export const chargeImg = new Image();
chargeImg.src = "https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/bookfull.png";
const shadowImg = new Image();
shadowImg.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/Shadow.png';


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
    requestAnimationFrame(startScreenLoop);
}

// --- GAME LOOPS ---
function startScreenLoop() {
    if (gameState.currentScreen === 'start') {
        Renderer.drawStartScreen(ctx, introImage);
        requestAnimationFrame(startScreenLoop);
    }
}

function gameLoop() {
   if (gameState.currentScreen === 'playing') {
        ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // --- LIVELLO 1: PARALLASSE (LONTANO - PIÙ LENTO) ---
        gameState.parallaxPositionY += CONFIG.PARALLAX_SPEED;
        if (gameState.parallaxPositionY >= CONFIG.CANVAS_HEIGHT) gameState.parallaxPositionY = 0;

        ctx.globalAlpha = 0.5; // Rendiamo lo sfondo lontano più soffuso
        if (bgParallax.complete) {
            ctx.drawImage(bgParallax, 0, gameState.parallaxPositionY, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
            ctx.drawImage(bgParallax, 0, gameState.parallaxPositionY - CONFIG.CANVAS_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        }
        ctx.globalAlpha = 1.0; // Resettiamo l'opacità

        // --- LIVELLO 2: SFONDO PRINCIPALE (PIÙ VELOCE) ---
        gameState.backgroundPositionY += CONFIG.SCROLL_SPEED;
        if (gameState.backgroundPositionY >= CONFIG.CANVAS_HEIGHT) gameState.backgroundPositionY = 0;

        if (bgImage.complete) {
            ctx.drawImage(bgImage, 0, gameState.backgroundPositionY, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
            ctx.drawImage(bgImage, 0, gameState.backgroundPositionY - CONFIG.CANVAS_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        }
       
        // 2. Logica Movimento (rimane invariata)
        if (gameState.isTouchActive) {
            const targetX = gameState.touchX;
            const targetY = gameState.touchY - TOUCH_SETTINGS.OFFSET_Y;
            gameState.playerX += (targetX - gameState.playerX) * TOUCH_SETTINGS.LERP;
            gameState.playerY += (targetY - gameState.playerY) * TOUCH_SETTINGS.LERP;
        } else {
            if (gameState.keys['ArrowLeft']) gameState.playerX -= gameState.playerSpeed;
            if (gameState.keys['ArrowRight']) gameState.playerX += gameState.playerSpeed;
            if (gameState.keys['ArrowUp']) gameState.playerY -= gameState.playerSpeed;
            if (gameState.keys['ArrowDown']) gameState.playerY += gameState.playerSpeed;
        }

        // Limiti bordi
        gameState.playerX = Math.max(10, Math.min(CONFIG.CANVAS_WIDTH - 10, gameState.playerX));
        gameState.playerY = Math.max(10, Math.min(CONFIG.CANVAS_HEIGHT - 10, gameState.playerY));

        // 3. Logic Updates
        Renderer.autoFire();
        Renderer.updateBullets();
        Renderer.updateSpecialRay();
        Renderer.updateSpecialRay2();
        Renderer.spawnEnemies()
       
        // 4. Boss Logic & Collisions
        if (gameState.bossActive && gameState.boss) {
            gameState.bullets.forEach((bullet, bIndex) => {
                const dx = bullet.x - gameState.boss.x;
                const dy = bullet.y - gameState.boss.y;
                if (Math.sqrt(dx * dx + dy * dy) < gameState.boss.size) {
                    gameState.boss.hp -= 10;
                    gameState.bullets.splice(bIndex, 1);
                }
            });

            if (gameState.specialRay.active && Math.abs(gameState.specialRay.x - gameState.boss.x) < gameState.boss.size) {
                gameState.boss.hp -= 5;
            }
            if (gameState.specialRay2.active2 && Math.abs(gameState.specialRay2.x2 - gameState.boss.x) < gameState.boss.size) {
                gameState.boss.hp -= 5;
            }
        }

        if (gameState.gameTimer <= 58 && !gameState.bossActive) {
            gameState.bossActive = true;
            gameState.enemies = [];
            gameState.boss = {
                x: CONFIG.CANVAS_WIDTH / 2, y: -150, targetY: 300,
                size: 140, hp: 5000, maxHp: 5000
            };
        }

        // 5. Rendering
        Renderer.drawPlayer(ctx, playerSprite);
        if (gameState.bossActive && gameState.boss) {
            if (gameState.boss.y < gameState.boss.targetY) gameState.boss.y += 2;
            Boss1.drawBossShadow(ctx, gameState.boss, shadowImg);
            if (gameState.boss.hp <= 0) { showPowerUpScreen(); return; }
        }
        Special Attacks.drawSpecialRay(ctx);
        Special Attacks.drawSpecialRay2(ctx);
        if (gameState.isCharging) Special Attacks.drawChargeEffect(ctx, chargeImg);
        if (gameState.isCharging2) Special Attacks.drawChargeEffect(ctx, chargeImg);

        Renderer.drawBullets(ctx);
        Renderer.drawUI(ctx);
        
        requestAnimationFrame(gameLoop);
    }
}

// --- HANDLERS ---
function startGame() {
    if (!shadowImg.complete) { setTimeout(startGame, 100); return; }
    startScreen.style.display = 'none';
    gameState.currentScreen = 'playing';
    gameState.timerInterval = setInterval(() => {
        if (gameState.gameTimer > 0) gameState.gameTimer--;
        else clearInterval(gameState.timerInterval);
    }, 1000);
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
        gameState.specialRay.active = true;
        gameState.specialRay.startTime = Date.now() / 1000;
        gameState.specialRay.x = gameState.playerX;
        gameState.specialOnCooldown = true;
        gameState.specialLastUsed = Date.now() / 1000;
        setTimeout(() => gameState.specialOnCooldown = false, gameState.specialCooldown * 1000);
        setTimeout(() => gameState.isCharging = false, gameState.specialRay.duration * 1000);
    }, 1000);
}

function fireSpecialAttackSequence2() {
    if (gameState.specialOnCooldown2 || gameState.isCharging2) return;
    gameState.isCharging2 = true;
    setTimeout(() => {
        gameState.specialRay2.active2 = true;
        gameState.specialRay2.startTime2 = Date.now() / 1000;
        gameState.specialRay2.x = gameState.playerX;
        gameState.specialOnCooldown2 = true;
        gameState.specialLastUsed2 = Date.now() / 1000;
        setTimeout(() => gameState.specialOnCooldown2 = false, gameState.specialCooldown2 * 1000);
        setTimeout(() => gameState.isCharging2 = false, gameState.specialRay2.duration2 * 1000);

    }, 1000);
}

// --- INPUT LISTENERS (MULTITOUCH) ---
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    
    // Gestione Dito 1: Movimento
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        gameState.touchIdentifier = touch.identifier;
        gameState.isTouchActive = true;
        updateCoords(touch, rect);
    }

    // Gestione Dito 2+: Speciali
    if (e.touches.length >= 2 && gameState.currentScreen === 'playing') {
        if (secondFingerTimer) {
            // Se tocchi di nuovo prima del timeout -> Double Tap
            clearTimeout(secondFingerTimer);
            secondFingerTimer = null;
            fireSpecialAttackSequence2();
        } else {
            // Primo tocco del secondo dito -> Aspetta per vedere se è Single o Double
            secondFingerTimer = setTimeout(() => {
                fireSpecialAttackSequence();
                secondFingerTimer = null;
            }, TOUCH_SETTINGS.TAP_DELAY);
        }
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = Array.from(e.touches).find(t => t.identifier === gameState.touchIdentifier);
    if (touch) updateCoords(touch, rect);
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
        gameState.isTouchActive = false;
        gameState.touchIdentifier = null;
    } else {
        const stillDragging = Array.from(e.touches).find(t => t.identifier === gameState.touchIdentifier);
        if (!stillDragging) gameState.isTouchActive = false;
    }
});

function updateCoords(touch, rect) {
    gameState.touchX = (touch.clientX - rect.left) * (CONFIG.CANVAS_WIDTH / rect.width);
    gameState.touchY = (touch.clientY - rect.top) * (CONFIG.CANVAS_HEIGHT / rect.height);
}

// Tastiera
window.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;
    if (e.key === ' ' && gameState.currentScreen === 'playing') {
        fireSpecialAttackSequence();
        fireSpecialAttackSequence2();
    }
});
window.addEventListener('keyup', (e) => gameState.keys[e.key] = false);

startButton.addEventListener('click', startGame);
init();
