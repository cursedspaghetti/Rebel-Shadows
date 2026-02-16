import { CONFIG, gameState } from './config.js';
import * as Renderer from './renderer.js';
import * as Boss1 from './Boss1.js';
import * as SpecialAttacks from './Special Attacks.js';
import * as collision from './collision.js';
import * as Enemies from './enemies.js';

// --- CONFIGURAZIONE TOUCH ---
const TOUCH_SETTINGS = { LERP: 0.5, OFFSET_Y: 80, TAP_DELAY: 250 };

// --- DOM ELEMENTS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const setupScreen = document.getElementById('characterSetup');
const powerUpScreen = document.getElementById('powerUpScreen');
const startButton = document.getElementById('startButton');
const wizardIdInput = document.getElementById('wizardIdInput');
const setupWizImage = document.getElementById('setupWizImage');
const confirmStatsBtn = document.getElementById('confirmStats');

// --- ASSET LOADING ---
const introImage = new Image();
const Wiz1 = new Image();
Wiz1.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/Wiz1.png';
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

// --- UTILS ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    CONFIG.CANVAS_WIDTH = canvas.width;
    CONFIG.CANVAS_HEIGHT = canvas.height;
}

function makeTransparent(img) {
    const tmpCanvas = document.createElement('canvas');
    const tmpCtx = tmpCanvas.getContext('2d');
    tmpCanvas.width = img.width; tmpCanvas.height = img.height;
    tmpCtx.drawImage(img, 0, 0);
    const imageData = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);
    const data = imageData.data;
    const rT = data[0], gT = data[1], bT = data[2];
    for (let i = 0; i < data.length; i += 4) {
        const distance = Math.sqrt(Math.pow(data[i]-rT,2) + Math.pow(data[i+1]-gT,2) + Math.pow(data[i+2]-bT,2));
        if (distance < 50) data[i+3] = 0;
    }
    tmpCtx.putImageData(imageData, 0, 0);
    return tmpCanvas.toDataURL();
}

// --- LOGICA STATISTICHE (Usando gameState) ---
async function handleLoadWizard() {
    const wizardId = wizardIdInput.value.trim();
    if (!wizardId) return;
    try {
        const response = await fetch(`https://forgottenrunes.com/api/art/wizards/${wizardId}.json`);
        const data = await response.json();
        gameState.affinityName = data.attributes.find(a => a.trait_type === "Affinity")?.value || "Neutral";
        
        applyAffinityBonus(gameState.affinityName);
        document.getElementById('wizardDisplayName').innerText = `WIZARD #${wizardId} - ${gameState.affinityName.toUpperCase()}`;

        const rawImg = new Image();
        rawImg.crossOrigin = "anonymous";
        rawImg.src = `https://www.forgottenrunes.com/api/art/wizards/${wizardId}.png`;
        rawImg.onload = () => {
            introImage.src = makeTransparent(rawImg);
            startButton.classList.add('visible');
        };
    } catch (e) { console.warn("Wizard data error"); }
}

function applyAffinityBonus(affinity) {
    Object.keys(gameState.affinityBonuses).forEach(k => gameState.affinityBonuses[k] = 0);
    const bonuses = { "Fire": "Attack Power", "Wind": "Dexterity", "Earth": "Constitution", "Water": "HP" };
    if (bonuses[affinity]) gameState.affinityBonuses[bonuses[affinity]] = 15;
}

function renderStatTable() {
    const tbody = document.getElementById('statsBody');
    document.getElementById('availableEssence').innerText = gameState.essences;
    confirmStatsBtn.disabled = gameState.essences > 0;

    tbody.innerHTML = Object.keys(gameState.baseStats).map(stat => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #333;">${stat}</td>
            <td style="text-align: center;">${gameState.baseStats[stat]}</td>
            <td style="text-align: center; color: #00ff00;">+${gameState.affinityBonuses[stat]}</td>
            <td style="text-align: center;">
                <button onclick="changeStat('${stat}', -1)" class="stat-btn">-</button>
                <span style="display:inline-block; width: 30px;">${gameState.addedStats[stat]}</span>
                <button onclick="changeStat('${stat}', 1)" class="stat-btn">+</button>
            </td>
        </tr>
    `).join('');
}

window.changeStat = (stat, amount) => {
    if (amount > 0 && gameState.essences > 0) { 
        gameState.addedStats[stat]++; 
        gameState.essences--; 
    }
    else if (amount < 0 && gameState.addedStats[stat] > 0) { 
        gameState.addedStats[stat]--; 
        gameState.essences++; 
    }
    renderStatTable();
};

// --- INITIALIZATION ---
async function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    Boss1.preloadBossAssets();
    initSkillTree();

    let debounceTimer;
    wizardIdInput.addEventListener('input', () => {
        startButton.classList.remove('visible');
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(handleLoadWizard, 500);
    });

    startButton.addEventListener('click', () => {
        startScreen.style.display = 'none';
        setupScreen.style.display = 'flex';
        setupWizImage.src = introImage.src;
        renderStatTable();
    });

    confirmStatsBtn.addEventListener('click', startGame);
    requestAnimationFrame(startScreenLoop);
}

function startScreenLoop() {
    if (gameState.currentScreen === 'start') {
        Renderer.drawStartScreen(ctx, bgParallax, introImage, Wiz1, bookImg);
        requestAnimationFrame(startScreenLoop);
    }
}

function startGame() {
    setupScreen.style.display = 'none';
    gameState.currentScreen = 'playing';
    
    // Iniezione statistiche nel gameplay
    gameState.hp = 100 + (gameState.addedStats["HP"] * 10) + (gameState.affinityBonuses["HP"] * 2);
    gameState.playerSpeed = 5 + (gameState.addedStats["Dexterity"] * 0.3);
    // Esempio: CONFIG.PLAYER_DAMAGE = 10 + gameState.addedStats["Attack Power"];

    gameState.timerInterval = setInterval(() => {
        if (gameState.gameTimer > 0) gameState.gameTimer--;
    }, 1000);
    gameLoop();
}

// --- GAME LOOP ---
function gameLoop() {
    if (gameState.currentScreen !== 'playing') return;
    const now = Date.now();
    
    // Logica Invulnerabilità & Shake
    if (gameState.isInvulnerable && (now - gameState.lastDamageTime > CONFIG.INVULNERABILITY_TIME)) {
        gameState.isInvulnerable = false;
    }
    if (gameState.screenShake > 0.1) gameState.screenShake *= CONFIG.SHAKE_DECAY;
    else gameState.screenShake = 0;

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

    // Spawn Logic
    if (!gameState.bossActive) {
        if (gameState.gameTimer > 5) {
            if (now - (gameState.lastEnemySpawn || 0) > 2000) {
                Enemies.spawnEnemies(3);
                gameState.lastEnemySpawn = now;
            }
        } else {
            gameState.bossActive = true;
            gameState.enemies = [];
            if (!gameState.boss) {
                gameState.boss = Boss1.spawnBoss((gameState.bossDefeatedCount || 0) + 1);
            }
        }
    }

    if (gameState.bossActive && gameState.boss) {
        Boss1.updateBoss(gameState.boss);
        Boss1.drawBossShadow(ctx, gameState.boss, shadowImg);
        if (gameState.boss.hp <= 0) {
            gameState.bossActive = false;
            gameState.boss = null;
            ctx.restore(); 
            showPowerUpScreen();
            return; 
        }
    }

    collision.handleAllCollisions();

    // Blink & Draw Player
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
    Renderer.drawHealthBar(ctx, gameState.hp, 100 + (gameState.addedStats["HP"] * 10), CONFIG.CANVAS_WIDTH);

    requestAnimationFrame(gameLoop);
}

// --- HELPERS ---
function updateAndDrawBackgrounds() {
    gameState.parallaxPositionY = (gameState.parallaxPositionY + CONFIG.PARALLAX_SPEED) % CONFIG.CANVAS_HEIGHT;
    ctx.drawImage(bgParallax, 0, gameState.parallaxPositionY, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.drawImage(bgParallax, 0, gameState.parallaxPositionY - CONFIG.CANVAS_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
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

// --- INPUTS & SKILLS ---
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    gameState.touchIdentifier = touch.identifier;
    gameState.isTouchActive = true;
    gameState.touchX = touch.clientX - rect.left;
    gameState.touchY = touch.clientY - rect.top;
    
    const now = Date.now();
    const lastTap = canvas.dataset.lastTap || 0;
    if (now - lastTap < 250) SpecialAttacks.fireSpecialAttackSequence();
    else { SpecialAttacks.activateShield(); canvas.dataset.lastTap = now; }
}, { passive: false });

window.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;
    if (e.key === ' ' && gameState.currentScreen === 'playing') {
        SpecialAttacks.fireSpecialAttackSequence();
        SpecialAttacks.fireSpecialAttackSequence2();
    }
});
window.addEventListener('keyup', (e) => gameState.keys[e.key] = false);

const playerSkills = { points: 1, offense: 0, defense: 0, speed: 0, magic: 0 };
function initSkillTree() {
    document.querySelectorAll('.skill-node').forEach(button => {
        button.addEventListener('click', () => {
            const path = button.parentElement.dataset.path;
            const level = parseInt(button.dataset.level);
            if (playerSkills.points > 0 && level === playerSkills[path] + 1) {
                playerSkills[path] = level; playerSkills.points--;
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
    gameState.timerInterval = setInterval(() => { if (gameState.gameTimer > 0) gameState.gameTimer--; }, 1000);
    requestAnimationFrame(gameLoop);
}

init();
