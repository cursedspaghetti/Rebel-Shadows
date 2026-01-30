import { CONFIG, gameState } from './config.js';
import * as Renderer from './renderer.js';
import * as Boss1 from './Boss1.js';
import * as SpecialAttacks from './Special Attacks.js';
import * as collision from './collision.js';

// --- CONFIGURAZIONE TOUCH ---
const TOUCH_SETTINGS = {
    LERP: 0.5,             // Fluidità inseguimento
    OFFSET_Y: 80,          // Distanza sopra il dito
    TAP_DELAY: 250         // Tempo per distinguere Single/Double Tap
};

let secondFingerTimer = null;
gameState.isTouchActive = false;
gameState.touchIdentifier = null;

// --- DOM ELEMENTS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const powerUpScreen = document.getElementById('powerUpScreen');
const startButton = document.getElementById('startButton');

// --- ASSET LOADING ---
const introImage = new Image();
introImage.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/book1.png';
const bgImage = new Image();
bgImage.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/EmptySpaceVoid.png';
const bgParallax = new Image();
bgParallax.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/EmptySpace.png'; 

const playerSprite = new Image();
playerSprite.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/booksprite.png';
export const chargeImg = new Image();
chargeImg.src = "https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/bookfull.png";

const shadowImg = new Image();
shadowImg.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/Shadow.png';

// --- INITIALIZATION ---
function init() {
    startButton.disabled = false;
    requestAnimationFrame(startScreenLoop);
}

function startScreenLoop() {
    if (gameState.currentScreen === 'start') {
        Renderer.drawStartScreen(ctx, bgParallax, introImage);
        requestAnimationFrame(startScreenLoop);
    }
}

// --- GAME LOOP ---
function gameLoop() {
    if (gameState.currentScreen !== 'playing') return;

    const now = Date.now();

    // 1. LOGICA PRE-RENDERING (Invulnerabilità e Shake)
    if (gameState.isInvulnerable && (now - gameState.lastDamageTime > CONFIG.INVULNERABILITY_TIME)) {
        gameState.isInvulnerable = false;
    }

    if (gameState.screenShake > 0.1) gameState.screenShake *= CONFIG.SHAKE_DECAY;
    else gameState.screenShake = 0;

    // 2. PULIZIA E CAMERA SHAKE
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.save(); 
    if (gameState.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * gameState.screenShake, (Math.random() - 0.5) * gameState.screenShake);
    }

    // 3. DISEGNO SFONDI
    updateAndDrawBackgrounds();
    
    // 4. MOVIMENTO GIOCATORE
    updatePlayerMovement();

    // 5. AGGIORNAMENTO LOGICA ENTITÀ
    Renderer.autoFire();
    Renderer.updateBullets();
    Renderer.updateEnemies();
    Renderer.updateEnemyBullets() 
    collision.updateExplosions(); 
    SpecialAttacks.updateSpecialRay();
    SpecialAttacks.updateSpecialRay2();

    // Spawn nemici comuni (solo se il boss non c'è)
    if (!gameState.bossActive) {
        if (now - (gameState.lastEnemySpawn || 0) > 2000) {
            Renderer.spawnEnemies(3);
            gameState.lastEnemySpawn = now;
        }
        if (gameState.gameTimer <= 40) {
            gameState.bossActive = true;
            gameState.enemies = []; 
        }
    }

    // 6. LOGICA E RENDERING BOSS
    if (gameState.bossActive && gameState.boss) {
        Boss1.updateBoss(gameState.boss); // Aggiorna Boss E i suoi proiettili
        Boss1.drawBossShadow(ctx, gameState.boss, shadowImg); // Disegna Boss, UI e Proiettili
        
        if (gameState.boss.hp <= 0) {
            Renderer.createExplosion(gameState.boss.x, gameState.boss.y, '#ff0000');
            gameState.bossActive = false;
            showPowerUpScreen(); 
            return; 
        }
    }

    // 7. COLLISIONI
    collision.handleAllCollisions();

    // 8. RENDERING GIOCATORE ED EFFETTI
    const isBlinking = gameState.isInvulnerable && Math.floor(now / 100) % 2 === 0;
    if (!isBlinking) Renderer.drawPlayer(ctx, playerSprite);

    Renderer.drawEnemies(ctx);
    Renderer.drawEnemyBullets(ctx);
    SpecialAttacks.drawSpecialRay(ctx);
    SpecialAttacks.drawSpecialRay2(ctx);
    if (gameState.isCharging || gameState.isCharging2) SpecialAttacks.drawChargeEffect(ctx, chargeImg);
    Renderer.drawBullets(ctx);
    Renderer.drawExplosions(ctx);

    ctx.restore(); 

    // 9. UI FISSA
    Renderer.drawUI(ctx);
    Renderer.drawHealthBar(ctx, gameState.hp, CONFIG.PLAYER_MAX_HP, CONFIG.CANVAS_WIDTH);
    requestAnimationFrame(gameLoop);
}

// --- HELPER FUNCTIONS ---

function updateAndDrawBackgrounds() {
    // Parallax
    gameState.parallaxPositionY = (gameState.parallaxPositionY + CONFIG.PARALLAX_SPEED) % CONFIG.CANVAS_HEIGHT;
    ctx.drawImage(bgParallax, 0, gameState.parallaxPositionY, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.drawImage(bgParallax, 0, gameState.parallaxPositionY - CONFIG.CANVAS_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // Background principale
    gameState.backgroundPositionY = (gameState.backgroundPositionY + CONFIG.SCROLL_SPEED) % CONFIG.CANVAS_HEIGHT;
    ctx.drawImage(bgImage, 0, gameState.backgroundPositionY, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.drawImage(bgImage, 0, gameState.backgroundPositionY - CONFIG.CANVAS_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
}

function updatePlayerMovement() {
    if (gameState.isTouchActive) {
        gameState.playerX += (gameState.touchX - gameState.playerX) * TOUCH_SETTINGS.LERP;
        gameState.playerY += (gameState.touchY - TOUCH_SETTINGS.OFFSET_Y - gameState.playerY) * TOUCH_SETTINGS.LERP;
    } else {
        if (gameState.keys['ArrowLeft']) gameState.playerX -= gameState.playerSpeed;
        if (gameState.keys['ArrowRight']) gameState.playerX += gameState.playerSpeed;
        if (gameState.keys['ArrowUp']) gameState.playerY -= gameState.playerSpeed;
        if (gameState.keys['ArrowDown']) gameState.playerY += gameState.playerSpeed;
    }
    gameState.playerX = Math.max(20, Math.min(CONFIG.CANVAS_WIDTH - 20, gameState.playerX));
    gameState.playerY = Math.max(20, Math.min(CONFIG.CANVAS_HEIGHT - 20, gameState.playerY));
}


function startGame() {
    startScreen.style.display = 'none';
    gameState.currentScreen = 'playing';
    gameState.timerInterval = setInterval(() => {
        if (gameState.gameTimer > 0) gameState.gameTimer--;
    }, 1000);
    gameLoop();
}

function showPowerUpScreen() {
    gameState.currentScreen = 'powerup';
    powerUpScreen.style.display = 'flex';
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
}

// --- SPECIAL ATTACK SEQUENCES ---
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
        gameState.specialRay2.x2 = gameState.playerX;
        gameState.specialOnCooldown2 = true;
        gameState.specialLastUsed2 = Date.now() / 1000;
        setTimeout(() => gameState.specialOnCooldown2 = false, gameState.specialCooldown2 * 1000);
        setTimeout(() => gameState.isCharging2 = false, gameState.specialRay2.duration2 * 1000);
    }, 1000);
}

// --- INPUT LISTENERS ---
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        gameState.touchIdentifier = touch.identifier;
        gameState.isTouchActive = true;
        updateCoords(touch, rect);
    }
    if (e.touches.length >= 2 && gameState.currentScreen === 'playing') {
        if (secondFingerTimer) {
            clearTimeout(secondFingerTimer);
            secondFingerTimer = null;
            fireSpecialAttackSequence2();
        } else {
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
    const stillDragging = Array.from(e.touches).find(t => t.identifier === gameState.touchIdentifier);
    if (!stillDragging) {
        gameState.isTouchActive = false;
        gameState.touchIdentifier = null;
    }
});

function updateCoords(touch, rect) {
    gameState.touchX = (touch.clientX - rect.left) * (CONFIG.CANVAS_WIDTH / rect.width);
    gameState.touchY = (touch.clientY - rect.top) * (CONFIG.CANVAS_HEIGHT / rect.height);
}

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
