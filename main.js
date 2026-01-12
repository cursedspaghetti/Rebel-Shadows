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
const playerSprite = new Image();
playerSprite.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/booksprite.png';
export const chargeImg = new Image();
chargeImg.src = "https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/bookfull.png";
const shadowImg = new Image();
shadowImg.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/Shadow.png';

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

    // 2. Setup Anelli di sfondo per Start Screen
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

      // 2.1 Gestione Collisioni Boss-Proiettili
      if (gameState.bossActive && gameState.boss) {
         gameState.bullets.forEach((bullet, bIndex) => {
        // Calcolo distanza tra proiettile e centro del boss
        const dx = bullet.x - gameState.boss.x;
        const dy = bullet.y - gameState.boss.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Se la distanza è minore della dimensione del boss, c'è un colpo
        if (distance < gameState.boss.size) {
            gameState.boss.hp -= 10; // Danno per proiettile
            gameState.bullets.splice(bIndex, 1); // Rimuovi il proiettile
            
            // Opzionale: aggiungi un feedback visivo (es. flash bianco) qui
        }
    });

    // 2.2 Gestione Collisione con Special Ray (Raggio Speciale)
    if (gameState.specialRay.active) {
        // Se il raggio x è vicino alla x del boss (considerando la larghezza del raggio)
        if (Math.abs(gameState.specialRay.x - gameState.boss.x) < gameState.boss.size) {
            gameState.boss.hp -= 5; // Danno continuo del raggio
        }
    }
}

        // --- LOGICA BOSS SHADOW (Trigger 30s) ---
        if (gameState.gameTimer <= 58 && !gameState.bossActive) {
            gameState.bossActive = true;
            gameState.enemies = []; // Pulizia nemici minori
            gameState.boss = {
                x: CONFIG.CANVAS_WIDTH / 2,
                y: -150,           // Inizia fuori dallo schermo in alto
                targetY: 300,      // Posizione d'arresto al centro-alto
                size: 140,         // Dimensione Boss
                hp: 5000,          // Salute Boss
                maxHp: 5000
            };
        }

        // 3. Rendering

        // Disegno Player
        Renderer.drawPlayer(ctx, playerSprite);

        // Gestione Boss o Nemici comuni
        if (gameState.bossActive && gameState.boss) {
            // Entrata fluida del boss
            if (gameState.boss.y < gameState.boss.targetY) {
                gameState.boss.y += 2; 
            }
            Renderer.drawBossShadow(ctx, gameState.boss, shadowImg);
            
            // Logica Vittoria Boss
            if (gameState.boss.hp <= 0) {
                showPowerUpScreen();
                return;
            }
        } else {
            // Disegno nemici normali solo se il boss non è attivo
            gameState.enemies.forEach(enemy => {
                // Se hai ancora una funzione per nemici piccoli, usala qui
            });
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
    
    // Timer Decrescente
    gameState.timerInterval = setInterval(() => {
        if (gameState.gameTimer > 0) {
            gameState.gameTimer--;
        } else {
            clearInterval(gameState.timerInterval);
        }
    }, 1000);

    // Spawn iniziale nemici minori
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

init();
