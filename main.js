import { CONFIG, gameState } from './config.js';
import * as Renderer from './renderer.js';
import * as Boss1 from './Boss1.js';
import * as SpecialAttacks from './Special Attacks.js';

// --- CONFIGURAZIONE TOUCH ---
const TOUCH_SETTINGS = {
    LERP: 0.5,             // Fluidità inseguimento
    OFFSET_Y: 80,          // Distanza sopra il dito
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

// --- ASSET LOADING ---
const introImage = new Image();
introImage.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/shadow_intro.jpg';
const bgImage = new Image();
bgImage.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/EmptySpaceVoid.png';
const bgParallax = new Image();
bgParallax.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/EmptySpace.png'; 

const playerSprite = new Image();
playerSprite.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/booksprite.png';
export const chargeImg = new Image();
chargeImg.src = "https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/bookfull.png";

// ENEMIES
const shadowImg = new Image();
shadowImg.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/Shadow.png';
const asteroid = new Image();
asteroid.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/asteroid.png';

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

function startScreenLoop() {
    if (gameState.currentScreen === 'start') {
        Renderer.drawStartScreen(ctx, introImage);
        requestAnimationFrame(startScreenLoop);
    }
}

// --- GAME LOOP ---
function gameLoop() {
    if (gameState.currentScreen === 'playing') {
        const now = Date.now();
        ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // 1. SFONDI
        if (bgParallax.complete) {
            gameState.parallaxPositionY += CONFIG.PARALLAX_SPEED;
            if (gameState.parallaxPositionY >= CONFIG.CANVAS_HEIGHT) gameState.parallaxPositionY = 0;
            ctx.drawImage(bgParallax, 0, gameState.parallaxPositionY, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
            ctx.drawImage(bgParallax, 0, gameState.parallaxPositionY - CONFIG.CANVAS_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        }
        if (bgImage.complete) {
            gameState.backgroundPositionY += CONFIG.SCROLL_SPEED;
            if (gameState.backgroundPositionY >= CONFIG.CANVAS_HEIGHT) gameState.backgroundPositionY = 0;
            ctx.drawImage(bgImage, 0, gameState.backgroundPositionY, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
            ctx.drawImage(bgImage, 0, gameState.backgroundPositionY - CONFIG.CANVAS_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        }
        
        // 2. MOVIMENTO GIOCATORE
        if (gameState.isTouchActive) {
            gameState.playerX += (gameState.touchX - gameState.playerX) * TOUCH_SETTINGS.LERP;
            gameState.playerY += (gameState.touchY - TOUCH_SETTINGS.OFFSET_Y - gameState.playerY) * TOUCH_SETTINGS.LERP;
        } else {
            if (gameState.keys['ArrowLeft']) gameState.playerX -= gameState.playerSpeed;
            if (gameState.keys['ArrowRight']) gameState.playerX += gameState.playerSpeed;
            if (gameState.keys['ArrowUp']) gameState.playerY -= gameState.playerSpeed;
            if (gameState.keys['ArrowDown']) gameState.playerY += gameState.playerSpeed;
        }
        gameState.playerX = Math.max(10, Math.min(CONFIG.CANVAS_WIDTH - 10, gameState.playerX));
        gameState.playerY = Math.max(10, Math.min(CONFIG.CANVAS_HEIGHT - 10, gameState.playerY));

        // 3. AGGIORNAMENTO LOGICA (da Renderer e SpecialAttacks)
        Renderer.autoFire();
        Renderer.updateBullets();
        Renderer.updateEnemies();
        Renderer.updateExplosions(); // Chiamata alla funzione in renderer.js
        SpecialAttacks.updateSpecialRay();
        SpecialAttacks.updateSpecialRay2();

        if (!gameState.bossActive) {
            if (now - (gameState.lastEnemySpawn || 0) > 2000) {
                Renderer.spawnEnemies(3);
                gameState.lastEnemySpawn = now;
            }
        }

        // --- GESTIONE COLLISIONI ---
        
        // Collisioni Proiettili -> Nemici (Ciclo inverso per sicurezza rimozione)
        for (let b = gameState.bullets.length - 1; b >= 0; b--) {
            let bullet = gameState.bullets[b];
            for (let e = gameState.enemies.length - 1; e >= 0; e--) {
                let enemy = gameState.enemies[e];
                let dx = bullet.x - enemy.x;
                let dy = bullet.y - enemy.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < (enemy.size / 2 + bullet.size)) {
                    Renderer.createExplosion(enemy.x, enemy.y, enemy.color);
                    gameState.enemies.splice(e, 1);
                    gameState.bullets.splice(b, 1);
                    break; // Esci dal ciclo proiettili perché il proiettile è distrutto
                }
            }
        }

        // Collisioni Raggi Speciali -> Nemici
        if (gameState.specialRay.active || gameState.specialRay2.active2) {
            let rayX = gameState.specialRay.active ? gameState.specialRay.x : gameState.specialRay2.x2;
            for (let e = gameState.enemies.length - 1; e >= 0; e--) {
                if (Math.abs(gameState.enemies[e].x - rayX) < 40) {
                    Renderer.createExplosion(gameState.enemies[e].x, gameState.enemies[e].y, '#ffffff');
                    gameState.enemies.splice(e, 1);
                }
            }
        }

        // 4. BOSS LOGIC
        if (gameState.bossActive && gameState.boss) {
            gameState.bullets.forEach((bullet, bIndex) => {
                const dx = bullet.x - gameState.boss.x;
                const dy = bullet.y - gameState.boss.y;
                if (Math.sqrt(dx * dx + dy * dy) < gameState.boss.size) {
                    gameState.boss.hp -= 10;
                    Renderer.createExplosion(bullet.x, bullet.y, '#fff');
                    gameState.bullets.splice(bIndex, 1);
                }
            });

            if (gameState.boss.y < gameState.boss.targetY) gameState.boss.y += 2;
            Boss1.drawBossShadow(ctx, gameState.boss, shadowImg);
            
            if (gameState.boss.hp <= 0) {
                Renderer.createExplosion(gameState.boss.x, gameState.boss.y, '#ff0000');
                showPowerUpScreen(); 
                return; 
            }
        }

        if (gameState.gameTimer <= 40 && !gameState.bossActive) {
            gameState.bossActive = true;
            gameState.enemies = [];
            gameState.boss = { x: CONFIG.CANVAS_WIDTH / 2, y: -150, targetY: 300, size: 140, hp: 5000, maxHp: 5000 };
        }

        // 5. RENDERING
        Renderer.drawPlayer(ctx, playerSprite);
        Renderer.drawEnemies(ctx,asteroid);
        SpecialAttacks.drawSpecialRay(ctx);
        SpecialAttacks.drawSpecialRay2(ctx);
        
        if (gameState.isCharging || gameState.isCharging2) SpecialAttacks.drawChargeEffect(ctx, chargeImg);
        
        Renderer.drawBullets(ctx);
        Renderer.drawExplosions(ctx); // Chiamata alla funzione in renderer.js
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
        gameState.specialRay2.x2 = gameState.playerX;
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
