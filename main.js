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

// --- ASSET LOADING ---
const introImage = new Image();
introImage.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/shadow_intro.png';
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
    // Rendiamo il pulsante subito cliccabile
    startButton.disabled = false;
    
    // Avviamo il loop del menu
    requestAnimationFrame(startScreenLoop);
}

function startScreenLoop() {
    if (gameState.currentScreen === 'start') {
        Renderer.drawStartScreen(ctx, bgImage, introImage);
        requestAnimationFrame(startScreenLoop);
    }
}

// --- GAME LOOP ---
function gameLoop() {
    if (gameState.currentScreen === 'playing') {
        const now = Date.now();

        // --- 0. LOGICA PRE-RENDERING ---
        if (gameState.isInvulnerable) {
            if (now - gameState.lastDamageTime > CONFIG.INVULNERABILITY_TIME) {
                gameState.isInvulnerable = false;
            }
        }

        if (gameState.screenShake > 0.1) {
            gameState.screenShake *= CONFIG.SHAKE_DECAY;
        } else {
            gameState.screenShake = 0;
        }

        // --- 1. PULIZIA E CAMERA SHAKE ---
        ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        ctx.save(); 
        if (gameState.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * gameState.screenShake;
            const shakeY = (Math.random() - 0.5) * gameState.screenShake;
            ctx.translate(shakeX, shakeY);
        }

        // --- 2. DISEGNO SFONDI ---
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
        
        // --- 3. MOVIMENTO GIOCATORE ---
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

        // --- 4. AGGIORNAMENTO LOGICA ---
        Renderer.autoFire();
        Renderer.updateBullets();
        Renderer.updateEnemies();
        Renderer.updateExplosions(); 
        SpecialAttacks.updateSpecialRay();
        SpecialAttacks.updateSpecialRay2();

        // Spawn nemici normali solo se il boss non è attivo
        if (!gameState.bossActive) {
            if (now - (gameState.lastEnemySpawn || 0) > 2000) {
                Renderer.spawnEnemies(3);
                gameState.lastEnemySpawn = now;
            }
        }

        // --- 5. LOGICA BOSS ---
        if (gameState.gameTimer <= 40 && !gameState.bossActive) {
            gameState.bossActive = true;
            gameState.enemies = []; // Pulisce lo schermo dai nemici comuni
            // Il boss è già inizializzato nel config.js, lo attiviamo e basta
        }

        if (gameState.bossActive && gameState.boss) {
            // Logica movimento e attacco del Boss
            Boss1.updateBoss(gameState.boss);
            
            // Disegno Boss
            Boss1.drawBossShadow(ctx, gameState.boss, shadowImg);
            
            // Controllo morte Boss
            if (gameState.boss.hp <= 0) {
                Renderer.createExplosion(gameState.boss.x, gameState.boss.y, '#ff0000');
                showPowerUpScreen(); 
                return; 
            }
        }

        // --- GESTIONE COLLISIONI ---
        handleAllCollisions();

        // --- 6. RENDERING ENTITÀ ---
        const isBlinking = gameState.isInvulnerable && Math.floor(now / 100) % 2 === 0;
        if (!isBlinking) {
            Renderer.drawPlayer(ctx, playerSprite);
        }

        Renderer.drawEnemies(ctx);
        SpecialAttacks.drawSpecialRay(ctx);
        SpecialAttacks.drawSpecialRay2(ctx);
        if (gameState.isCharging || gameState.isCharging2) SpecialAttacks.drawChargeEffect(ctx, chargeImg);
        Renderer.drawBullets(ctx);
        Renderer.drawExplosions(ctx);

        ctx.restore(); // Fine vibrazione

        // --- 7. DISEGNO UI (FISSA) ---
        Renderer.drawUI(ctx);
        
        requestAnimationFrame(gameLoop);
    }
}

// --- FUNZIONE COLLISIONI ---
function handleAllCollisions() {
    // 1. Proiettili vs Boss/Nemici
    for (let b = gameState.bullets.length - 1; b >= 0; b--) {
        const bullet = gameState.bullets[b];
        let bulletDestroyed = false;

        if (gameState.bossActive && gameState.boss) {
            const dx = bullet.x - gameState.boss.x;
            const dy = bullet.y - gameState.boss.y;
            const distSq = dx * dx + dy * dy;
            // Usiamo una hitbox approssimativa (120 è metà della dimensione visuale del boss)
            const radSum = 120 + bullet.size;
            if (distSq < radSum * radSum) {
                gameState.boss.hp -= 1; // Danno proiettile
                Renderer.createExplosion(bullet.x, bullet.y, '#ffffff');
                gameState.bullets.splice(b, 1);
                bulletDestroyed = true;
            }
        }

        if (!bulletDestroyed) {
            for (let e = gameState.enemies.length - 1; e >= 0; e--) {
                const enemy = gameState.enemies[e];
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distSq = dx * dx + dy * dy;
                const radSum = (enemy.size / 2) + bullet.size;
                if (distSq < radSum * radSum) {
                    Renderer.createExplosion(enemy.x, enemy.y, enemy.color || '#fff');
                    gameState.enemies.splice(e, 1);
                    gameState.bullets.splice(b, 1);
                    bulletDestroyed = true;
                    break;
                }
            }
        }
    }

    // 2. Raggi Speciali
    const activeRays = [
        { active: gameState.specialRay.active, x: gameState.playerX, width: 40 },
        { active: gameState.specialRay2?.active2, x: gameState.playerX, width: 40 }
    ];
    activeRays.forEach(ray => {
        if (ray.active) {
            gameState.enemies.forEach((enemy, e) => {
                if (Math.abs(enemy.x - ray.x) < (ray.width / 2 + enemy.size / 2)) {
                    Renderer.createExplosion(enemy.x, enemy.y, '#ffffff');
                    gameState.enemies.splice(e, 1);
                }
            });
            if (gameState.bossActive && gameState.boss) {
                if (Math.abs(gameState.boss.x - ray.x) < (100 + ray.width / 2)) {
                    gameState.boss.hp -= 5;
                }
            }
        }
    });

    // 3. Player vs Nemici/Boss
    if (!gameState.isInvulnerable && !gameState.shieldActive) {
        for (let e = gameState.enemies.length - 1; e >= 0; e--) {
            const enemy = gameState.enemies[e];
            const dx = gameState.playerX - enemy.x;
            const dy = gameState.playerY - enemy.y;
            const distSq = dx * dx + dy * dy;
            const radSum = 15 + (enemy.size / 2);
            if (distSq < radSum * radSum) {
                applyDamage(5, 12);
                Renderer.createExplosion(enemy.x, enemy.y, enemy.color);
                gameState.enemies.splice(e, 1);
                break;
            }
        }
        if (gameState.bossActive && gameState.boss) {
            const dx = gameState.playerX - gameState.boss.x;
            const dy = gameState.playerY - gameState.boss.y;
            const distSq = dx * dx + dy * dy;
            const radSum = 60; // Hitbox boss per collisione player
            if (distSq < radSum * radSum) {
                applyDamage(30, 28);
            }
        }
    }
}

// --- ALTRI HANDLERS ---
function applyDamage(amount, shakeIntensity) {
    gameState.hp -= amount;
    gameState.isInvulnerable = true;
    gameState.lastDamageTime = Date.now();
    gameState.screenShake = shakeIntensity;

    if (gameState.hp <= 0) {
        gameState.hp = 0;
        alert("GAME OVER");
        location.reload(); 
    }
}

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
