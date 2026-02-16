import { CONFIG, gameState } from './config.js';
import * as Renderer from './renderer.js';
import * as Boss1 from './Boss1.js';
import * as SpecialAttacks from './Special Attacks.js';
import * as collision from './collision.js';
import * as Enemies from './enemies.js';

// --- DOM ELEMENTS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const powerUpScreen = document.getElementById('powerUpScreen');
const startButton = document.getElementById('startButton');
const wizardIdInput = document.getElementById('wizardIdInput');
const affinityDisplay = document.getElementById('affinityDisplay');

// --- ASSET LOADING ---
const introImage = new Image();
const Wiz1 = new Image();
Wiz1.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/Wiz1.png';
const bookImg = new Image();
bookImg.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/book1.png';

const bgImage = new Image();
bgImage.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/EmptySpaceVoid.png';
const bgParallax = new Image();
bgParallax.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/EmptySpace.png'; 

const playerSprite = new Image();
playerSprite.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/booksprite.png';
export const chargeImg = new Image();
chargeImg.src = "https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/bookfull.png";

export const shadowImg = new Image();
shadowImg.src = "https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/Shadow.png";

// --- CONSTANTS ---
let lastLoadedId = "";

// --- WIZARD LOGIC (NO WALLET) ---

async function getWizardAffinity(wizardId) {
    try {
        if (affinityDisplay) affinityDisplay.innerText = "READING LORE...";
        
        // Carichiamo i metadati direttamente da Forgotten Runes (Nessuna API Key richiesta)
        const url = `https://forgottenrunes.com/api/art/wizards/${wizardId}.json`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Wizards API error");
        const data = await response.json();

        let affinityValue = "Neutral";
        if (data.attributes) {
            const trait = data.attributes.find(t => t.trait_type === 'Affinity');
            if (trait) affinityValue = trait.value;
        }

        if (affinityDisplay) {
            affinityDisplay.innerText = `AFFINITY: ${affinityValue.toUpperCase()}`;
            const colors = {
                'Fire': '#ff4500', 'Water': '#00bfff', 'Earth': '#8b4513',
                'Air': '#f0ffff', 'Shadow': '#9400d3', 'Life': '#32cd32'
            };
            affinityDisplay.style.color = colors[affinityValue] || '#00ffcc';
        }
        return affinityValue;
    } catch (e) {
        console.error("Metadata error:", e);
        if (affinityDisplay) affinityDisplay.innerText = "WIZARD NOT FOUND";
        return "Neutral";
    }
}

async function handleLoadWizard() {
    const wizardId = wizardIdInput.value.trim();
    if (wizardId === lastLoadedId || !wizardId) return;

    lastLoadedId = wizardId;
    
    // 1. Otteniamo l'affinità dai metadati JSON
    const affinity = await getWizardAffinity(wizardId);
    gameState.playerAffinity = affinity;
    applyAffinityBonuses(affinity);

    // 2. Carichiamo l'immagine
    const rawImg = new Image();
    rawImg.crossOrigin = "anonymous"; 
    rawImg.src = `https://www.forgottenrunes.com/api/art/wizards/${wizardId}.png`;

    rawImg.onload = () => {
        const transparentDataUrl = makeTransparent(rawImg);
        introImage.src = transparentDataUrl;
        introImage.dataset.loaded = "true";
        if (startButton) startButton.classList.add('visible');
    };
}

function applyAffinityBonuses(affinity) {
    // Reset bonus precedenti se necessario
    CONFIG.BULLET_DAMAGE_MULTIPLIER = 1; 
    
    switch(affinity) {
        case 'Fire': CONFIG.BULLET_DAMAGE_MULTIPLIER = 1.4; break;
        case 'Water': 
            CONFIG.PLAYER_MAX_HP = 120; // Esempio: +20 HP
            gameState.hp = CONFIG.PLAYER_MAX_HP; 
            break;
        case 'Shadow': CONFIG.INVULNERABILITY_TIME = 1500; break; // Più tempo di invulnerabilità
    }
}

function makeTransparent(img) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    tempCtx.drawImage(img, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    const rT = data[0], gT = data[1], bT = data[2];
    for (let i = 0; i < data.length; i += 4) {
        const d = Math.sqrt(Math.pow(data[i]-rT,2)+Math.pow(data[i+1]-gT,2)+Math.pow(data[i+2]-bT,2));
        if (d < 50) data[i+3] = 0;
    }
    tempCtx.putImageData(imageData, 0, 0);
    return tempCanvas.toDataURL();
}

// --- INITIALIZATION ---

async function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    Boss1.preloadBossAssets();
    initSkillTree();

    if (wizardIdInput) {
        wizardIdInput.addEventListener('input', () => {
            clearTimeout(window.loadTimeout);
            window.loadTimeout = setTimeout(handleLoadWizard, 500);
        });
    }

    if (startButton) {
        startButton.addEventListener('click', startGame);
    }

    startScreenLoop();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    CONFIG.CANVAS_WIDTH = canvas.width;
    CONFIG.CANVAS_HEIGHT = canvas.height;
}

function startScreenLoop() {
    if (gameState.currentScreen === 'start') {
        Renderer.drawStartScreen(ctx, bgParallax, introImage, Wiz1, bookImg);
        requestAnimationFrame(startScreenLoop);
    }
}

function startGame() {
    if (startScreen) startScreen.style.display = 'none';
    gameState.currentScreen = 'playing';
    gameState.timerInterval = setInterval(() => {
        if (gameState.gameTimer > 0) gameState.gameTimer--;
    }, 1000);
    gameLoop();
}

// --- GAME LOOP ---

function gameLoop() {
    if (gameState.currentScreen !== 'playing') return;
    const now = Date.now();

    if (gameState.isInvulnerable && (now - gameState.lastDamageTime > CONFIG.INVULNERABILITY_TIME)) {
        gameState.isInvulnerable = false;
    }
    gameState.screenShake = gameState.screenShake > 0.1 ? gameState.screenShake * CONFIG.SHAKE_DECAY : 0;

    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.save(); 
    if (gameState.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * gameState.screenShake, (Math.random() - 0.5) * gameState.screenShake);
    }

    updateAndDrawBackgrounds();
    updatePlayerMovement();

    Renderer.autoFire();
    Renderer.updateBullets();
    Enemies.updateEnemies();
    Enemies.updateEnemyBullets();
    collision.updateExplosions(); 
    SpecialAttacks.updateSpecialRay();
    SpecialAttacks.updateSpecialRay2();

    if (!gameState.bossActive) {
        if (gameState.gameTimer > 0) {
            if (now - (gameState.lastEnemySpawn || 0) > 2000) {
                Enemies.spawnEnemies(3);
                gameState.lastEnemySpawn = now;
            }
        } else {
            gameState.bossActive = true;
            gameState.enemies = [];
            const bLvl = (gameState.bossDefeatedCount || 0) + 1;
            gameState.boss = Boss1.spawnBoss(bLvl);
        }
    }

    if (gameState.bossActive && gameState.boss) {
        Boss1.updateBoss(gameState.boss);
        Boss1.drawBossShadow(ctx, gameState.boss, shadowImg);
        if (gameState.boss.hp <= 0) {
            gameState.bossActive = false;
            gameState.boss = null;
            gameState.bossDefeatedCount = (gameState.bossDefeatedCount || 0) + 1;
            ctx.restore(); 
            showPowerUpScreen();
            return; 
        }
    }

    collision.handleAllCollisions();

    if (!(gameState.isInvulnerable && Math.floor(now / 100) % 2 === 0)) {
        Renderer.drawPlayer(ctx, playerSprite);
    }

    Enemies.drawEnemies(ctx);
    Enemies.drawEnemyBullets(ctx);
    SpecialAttacks.drawSpecialRay(ctx);
    SpecialAttacks.drawSpecialRay2(ctx);
    if (gameState.isCharging || gameState.isCharging2) SpecialAttacks.drawChargeEffect(ctx, chargeImg);
    Renderer.drawBullets(ctx);
    collision.drawExplosions(ctx);
    SpecialAttacks.updateShield();
    if (gameState.shieldActive) SpecialAttacks.drawShield(ctx);

    ctx.restore(); 

    Renderer.drawUI(ctx);
    Renderer.drawHealthBar(ctx, gameState.hp, CONFIG.PLAYER_MAX_HP, CONFIG.CANVAS_WIDTH);

    requestAnimationFrame(gameLoop);
}

// --- HELPERS & BACKGROUNDS ---

function updateAndDrawBackgrounds() {
    gameState.parallaxPositionY = (gameState.parallaxPositionY + CONFIG.PARALLAX_SPEED) % CONFIG.CANVAS_HEIGHT;
    ctx.drawImage(bgParallax, 0, gameState.parallaxPositionY, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.drawImage(bgParallax, 0, gameState.parallaxPositionY - CONFIG.CANVAS_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    gameState.backgroundPositionY = (gameState.backgroundPositionY + CONFIG.SCROLL_SPEED) % CONFIG.CANVAS_HEIGHT;
    ctx.drawImage(bgImage, 0, gameState.backgroundPositionY, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.drawImage(bgImage, 0, gameState.backgroundPositionY - CONFIG.CANVAS_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
}

function updatePlayerMovement() {
    const LERP = 0.5;
    const OFFSET_Y = 80;
    if (gameState.isTouchActive) {
        gameState.playerX += (gameState.touchX - gameState.playerX) * LERP;
        gameState.playerY += (gameState.touchY - OFFSET_Y - gameState.playerY) * LERP;
    } else {
        if (gameState.keys['ArrowLeft']) gameState.playerX -= gameState.playerSpeed;
        if (gameState.keys['ArrowRight']) gameState.playerX += gameState.playerSpeed;
        if (gameState.keys['ArrowUp']) gameState.playerY -= gameState.playerSpeed;
        if (gameState.keys['ArrowDown']) gameState.playerY += gameState.playerSpeed;
    }
    gameState.playerX = Math.max(20, Math.min(CONFIG.CANVAS_WIDTH - 20, gameState.playerX));
    gameState.playerY = Math.max(20, Math.min(CONFIG.CANVAS_HEIGHT - 20, gameState.playerY));
}

// --- TOUCH INPUTS ---
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    if (e.touches.length === 1) {
        const t = e.touches[0];
        gameState.touchIdentifier = t.identifier;
        gameState.isTouchActive = true;
        gameState.touchX = t.clientX - rect.left;
        gameState.touchY = t.clientY - rect.top;
    }
    if (e.touches.length === 2) {
        const now = Date.now();
        const last = canvas.dataset.lastTap || 0;
        if (now - last < 250) {
            SpecialAttacks.fireSpecialAttackSequence();
            SpecialAttacks.fireSpecialAttackSequence2();
        } else {
            SpecialAttacks.activateShield();
        }
        canvas.dataset.lastTap = now;
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = Array.from(e.touches).find(t => t.identifier === gameState.touchIdentifier);
    if (t) {
        gameState.touchX = t.clientX - rect.left;
        gameState.touchY = t.clientY - rect.top;
    }
}, { passive: false });

canvas.addEventListener('touchend', () => { gameState.isTouchActive = false; });

window.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;
    if (e.key === ' ' && gameState.currentScreen === 'playing') {
        SpecialAttacks.fireSpecialAttackSequence();
        SpecialAttacks.fireSpecialAttackSequence2();
    }
});
window.addEventListener('keyup', (e) => gameState.keys[e.key] = false);

// --- SKILL TREE & POWERUP ---
const playerSkills = { offense: 0, defense: 0, speed: 0, magic: 0, points: 1 };

function initSkillTree() {
    document.querySelectorAll('.skill-node').forEach(button => {
        button.addEventListener('click', () => {
            const path = button.parentElement.dataset.path;
            const level = parseInt(button.dataset.level);
            if (playerSkills.points > 0 && level === playerSkills[path] + 1) {
                playerSkills[path] = level;
                playerSkills.points--;
                button.classList.replace('locked', 'unlocked');
                document.getElementById('skill-points').innerText = playerSkills.points;
            }
        });
    });
    document.getElementById('closeSkills').addEventListener('click', resumeGame);
}

function showPowerUpScreen() {
    gameState.currentScreen = 'powerup';
    powerUpScreen.style.display = 'flex';
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    playerSkills.points++;
    document.getElementById('skill-points').innerText = playerSkills.points;
}

function resumeGame() {
    powerUpScreen.style.display = 'none';
    gameState.currentScreen = 'playing';
    gameState.gameTimer = 60;
    gameState.timerInterval = setInterval(() => {
        if (gameState.gameTimer > 0) gameState.gameTimer--;
    }, 1000);
    requestAnimationFrame(gameLoop);
}

init();
