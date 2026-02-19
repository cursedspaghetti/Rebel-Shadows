import { CONFIG, gameState } from './config.js';
import * as Renderer from './renderer.js';
import * as Boss1 from './Boss1.js';
import * as SpecialAttacks from './Special Attacks.js';
import * as collision from './collision.js';
import * as Enemies from './enemies.js';

// --- CONFIGURAZIONE E STATO GLOBALE ---
let debounceTimer; 

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
    tmpCanvas.width = img.width;
    tmpCanvas.height = img.height;
    tmpCtx.drawImage(img, 0, 0);
    
    const imageData = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);
    const data = imageData.data;
    const rT = data[0], gT = data[1], bT = data[2];
    const tolerance = 50; 

    for (let i = 0; i < data.length; i += 4) {
        const distance = Math.sqrt(
            Math.pow(data[i] - rT, 2) + 
            Math.pow(data[i+1] - gT, 2) + 
            Math.pow(data[i+2] - bT, 2)
        );
        if (distance < tolerance) data[i + 3] = 0;
    }
    tmpCtx.putImageData(imageData, 0, 0);
    const transparentImage = new Image();
    transparentImage.src = tmpCanvas.toDataURL();
    return transparentImage;
}

// --- LOGICA CARICAMENTO WIZARD ---
async function handleLoadWizard() {
    const wizardId = wizardIdInput.value.trim();
    if (!wizardId || wizardId === gameState.lastLoadedId) return;
    gameState.lastLoadedId = wizardId;

    const wizardDisplayName = document.getElementById('wizardDisplayName');
    const traitHead = document.getElementById('trait-head');
    const traitBody = document.getElementById('trait-body');
    const traitProp = document.getElementById('trait-prop');
    const traitRune = document.getElementById('trait-rune');
    const traitFamiliar = document.getElementById('trait-familiar');
    const traitBg = document.getElementById('trait-bg');

    const rawImg = new Image();
    rawImg.crossOrigin = "anonymous"; 
    rawImg.src = `https://www.forgottenrunes.com/api/art/wizards/${wizardId}.png`;
    
    rawImg.onload = () => {
        const transparentImgObj = makeTransparent(rawImg);
        transparentImgObj.onload = () => {
            introImage.src = transparentImgObj.src;
            setupWizImage.src = transparentImgObj.src;
            if (startButton) startButton.classList.add('visible');
        };
    };

    const spriteSheetRaw = new Image();
    spriteSheetRaw.crossOrigin = "anonymous";
    spriteSheetRaw.src = `https://www.forgottenrunes.com/api/art/wizards/${wizardId}/spritesheet.png`;

    spriteSheetRaw.onload = () => {
        const transparentSpriteObj = makeTransparent(spriteSheetRaw);
        transparentSpriteObj.onload = () => {
            gameState.wizardSpritesheet = transparentSpriteObj;
        };
    };

    try {
        const response = await fetch("https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/wizzies.json");
        if (!response.ok) throw new Error("Database error");
        const wizzies = await response.json();
        const foundWizard = wizzies[wizardId];

        if (foundWizard) {
            gameState.wizardData = { ...foundWizard, id: wizardId };
            wizardDisplayName.innerText = `${foundWizard.name.toUpperCase()} (#${wizardId})`;
            traitHead.innerText = foundWizard.head;
            traitBody.innerText = foundWizard.body;
            traitProp.innerText = foundWizard.prop;
            traitFamiliar.innerText = foundWizard.familiar || "None";
            traitRune.innerText = foundWizard.rune || "None";
            traitBg.innerText = foundWizard.background;
        } else {
            handleError(wizardId, "UNKNOWN WIZARD");
        }
    } catch (e) {
        handleError(wizardId, "CONNECTION ERROR");
    }
}

function handleError(id, name) {
    const wizardDisplayName = document.getElementById('wizardDisplayName');
    if (wizardDisplayName) wizardDisplayName.innerText = name;
    ['trait-head', 'trait-body', 'trait-prop', 'trait-familiar', 'trait-rune', 'trait-bg'].forEach(t => {
        const el = document.getElementById(t);
        if (el) el.innerText = "-";
    });
    gameState.wizardData = { name: `Wizard #${id}`, id: id, prop: "" };
}

// --- STATS TABLE ---
function renderStatTable() {
    const tbody = document.getElementById('statsBody');
    if (!tbody) return;

    document.getElementById('availableEssence').innerText = gameState.essences;
    confirmStatsBtn.disabled = gameState.essences > 0;

    tbody.innerHTML = Object.keys(gameState.baseStats).map(stat => `
        <tr>
            <td>${stat}</td>
            <td>${gameState.baseStats[stat]}</td>
            <td>
                <button onclick="changeStat('${stat}', -1)" class="stat-btn">-</button>
                <span>${gameState.addedStats[stat]}</span>
                <button onclick="changeStat('${stat}', 1)" class="stat-btn">+</button>
            </td>
        </tr>
    `).join('');
}

window.changeStat = (stat, amount) => {
    if (amount > 0 && gameState.essences > 0) { 
        gameState.addedStats[stat]++; gameState.essences--; 
    } else if (amount < 0 && gameState.addedStats[stat] > 0) { 
        gameState.addedStats[stat]--; gameState.essences++; 
    }
    renderStatTable();
};

// --- INITIALIZATION ---
async function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    Boss1.preloadBossAssets();
    initSkillTree();

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
    
    let traitSpeedBonus = 0;
    let traitHPBonus = 0;

    if (gameState.wizardData.familiar && gameState.wizardData.familiar !== "None") traitHPBonus += 20;
    const fastProps = ["Staff", "Wand", "Athame"];
    if (gameState.wizardData.prop && fastProps.some(p => gameState.wizardData.prop.includes(p))) traitSpeedBonus += 1.5;

    gameState.hp = 100 + (gameState.addedStats["HP"] * 10) + traitHPBonus;
    gameState.playerSpeed = 5 + (gameState.addedStats["Dexterity"] * 0.3) + traitSpeedBonus;
    gameState.fireRate = Math.max(100, 400 - (gameState.addedStats["Attack Rate"] * 20));

    gameState.gameTimer = CONFIG.GAME_TIME;
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        if (gameState.gameTimer > 0) gameState.gameTimer--;
        else gameState.bossActive = true;
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
        if (gameState.gameTimer > 5) {
            if (now - (gameState.lastEnemySpawn || 0) > 2000) {
                Enemies.spawnEnemies(3);
                gameState.lastEnemySpawn = now;
            }
        } else {
            gameState.bossActive = true;
            gameState.enemies = [];
            if (!gameState.boss) gameState.boss = Boss1.spawnBoss((gameState.bossDefeatedCount || 0) + 1);
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

    // Draw Player logic
    if (!(gameState.isInvulnerable && Math.floor(now / 100) % 2 === 0)) {
        Renderer.drawPlayer(ctx,playerSprite);
        Renderer.drawPlayerWiz(ctx)
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

function updateAndDrawBackgrounds() {
    gameState.parallaxPositionY = (gameState.parallaxPositionY + CONFIG.PARALLAX_SPEED) % CONFIG.CANVAS_HEIGHT;
    ctx.drawImage(bgParallax, 0, gameState.parallaxPositionY, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.drawImage(bgParallax, 0, gameState.parallaxPositionY - CONFIG.CANVAS_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    gameState.backgroundPositionY = (gameState.backgroundPositionY + CONFIG.SCROLL_SPEED) % CONFIG.CANVAS_HEIGHT;
    ctx.drawImage(bgImage, 0, gameState.backgroundPositionY, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.drawImage(bgImage, 0, gameState.backgroundPositionY - CONFIG.CANVAS_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
}

// --- INPUT LISTENERS ---
// --- CONFIGURAZIONE TOUCH ---
const TOUCH = {
    LERP: 0.1,
    OFFSET_Y: 80,
    TAP_DELAY: 250
};

gameState.isTouchActive = false;
gameState.touchIdentifier = null;

/**
 * --- SISTEMA DI MOVIMENTO 
 */
    // --- AGGIORNAMENTO STATO PER L'ANIMAZIONE ---
    gameState.isMoving = moving;

    if (moving) {
        // Determina la direzione visiva in base al movimento prevalente
        if (Math.abs(dx) > Math.abs(dy)) {
            gameState.playerDirection = (dx > 0) ? 2 : 1; // 2: Destra, 1: Sinistra
        } else {
            gameState.playerDirection = (dy > 0) ? 0 : 3; // 0: Giù, 3: Su
        }
    }

    // Vincoli bordi schermo
    gameState.playerX = Math.max(20, Math.min(CONFIG.CANVAS_WIDTH - 20, gameState.playerX));
    gameState.playerY = Math.max(20, Math.min(CONFIG.CANVAS_HEIGHT - 20, gameState.playerY));
}

// 3. INPUT LISTENERS (Mobile & Key)

function updateCoords(touch, rect) {
    gameState.touchX = (touch.clientX - rect.left) * (CONFIG.CANVAS_WIDTH / rect.width);
    gameState.touchY = (touch.clientY - rect.top) * (CONFIG.CANVAS_HEIGHT / rect.height);
}

// Touch Start
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    if (e.touches.length === 1) {
        gameState.touchIdentifier = e.touches[0].identifier;
        gameState.isTouchActive = true;
        updateCoords(e.touches[0], rect);
    }
    
    // Speciali: Double Tap o secondo dito
    if (e.touches.length >= 2 && gameState.currentScreen === 'playing') {
        if (secondFingerTimer) {
            clearTimeout(secondFingerTimer);
            secondFingerTimer = null;
            SpecialAttacks.fireSpecialAttackSequence2();
        } else {
            secondFingerTimer = setTimeout(() => {
                SpecialAttacks.fireSpecialAttackSequence();
                secondFingerTimer = null;
            }, CONFIG.TOUCH.DOUBLE_TAP_DELAY);
        }
    }
}, { passive: false });

// Touch Move
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = Array.from(e.touches).find(t => t.identifier === gameState.touchIdentifier);
    if (touch) updateCoords(touch, rect);
}, { passive: false });

// Touch End
canvas.addEventListener('touchend', (e) => {
    const stillDragging = Array.from(e.touches).find(t => t.identifier === gameState.touchIdentifier);
    if (!stillDragging) {
        gameState.isTouchActive = false;
        gameState.isMoving = false;
        gameState.touchIdentifier = null;
    }
});

// Keyboard Listeners
window.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;
    if (e.key === ' ' && gameState.currentScreen === 'playing') {
        SpecialAttacks.fireSpecialAttackSequence();
        SpecialAttacks.fireSpecialAttackSequence2();
    }
});

window.addEventListener('keyup', (e) => {
    gameState.keys[e.key] = false;
});


// SKILL TREE
const playerSkills = { points: 1, offense: 0, defense: 0, speed: 0, magic: 0 };
function initSkillTree() {
    document.querySelectorAll('.skill-node').forEach(button => {
        button.addEventListener('click', () => {
            const path = button.parentElement.dataset.path;
            const level = parseInt(button.dataset.level);
            if (playerSkills.points > 0 && level === playerSkills[path] + 1) {
                playerSkills[path] = level; playerSkills.points--;
                button.classList.replace('locked', 'unlocked');
                const spEl = document.getElementById('skill-points');
                if (spEl) spEl.innerText = playerSkills.points;
            }
        });
    });
    const closeBtn = document.getElementById('closeSkills');
    if (closeBtn) closeBtn.addEventListener('click', resumeGame);
}

function showPowerUpScreen() {
    gameState.currentScreen = 'powerup';
    powerUpScreen.style.display = 'flex';
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    playerSkills.points++;
    const spEl = document.getElementById('skill-points');
    if (spEl) spEl.innerText = playerSkills.points;
}

function resumeGame() {
    powerUpScreen.style.display = 'none';
    gameState.currentScreen = 'playing';
    gameState.gameTimer = 60;
    gameState.timerInterval = setInterval(() => { if (gameState.gameTimer > 0) gameState.gameTimer--; }, 1000);
    requestAnimationFrame(gameLoop);
}

init();
