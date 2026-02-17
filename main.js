import { CONFIG, gameState } from './config.js';
import * as Renderer from './renderer.js';
import * as Boss1 from './Boss1.js';
import * as SpecialAttacks from './Special Attacks.js';
import * as collision from './collision.js';
import * as Enemies from './enemies.js';

// --- CONFIGURAZIONE E STATO GLOBALE ---
const TOUCH_SETTINGS = { LERP: 0.5, OFFSET_Y: 80, TAP_DELAY: 250 };
let lastLoadedId = ""; // Dichiarata globalmente per handleLoadWizard
let debounceTimer;    // Dichiarata globalmente per il listener input

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

// --- LOGICA CARICAMENTO WIZARD ---
// --- LOGICA CARICAMENTO WIZARD AGGIORNATA ---
async function handleLoadWizard() {
    const wizardId = wizardIdInput.value.trim();
    
    // Evita ricaricamenti inutili se l'ID è vuoto o identico all'ultimo caricato
    if (!wizardId || wizardId === lastLoadedId) return;
    lastLoadedId = wizardId;

    // 1. Caricamento Immagine (Sempre dall'API ufficiale per coerenza visiva)
    const rawImg = new Image();
    rawImg.crossOrigin = "anonymous"; 
    rawImg.src = `https://www.forgottenrunes.com/api/art/wizards/${wizardId}.png`;
    
    rawImg.onload = () => {
        // Applica la trasparenza (togliendo il background originale)
        introImage.src = makeTransparent(rawImg);
        introImage.dataset.loaded = "true";
        
        // Mostra il pulsante Start solo quando l'immagine è pronta
        startButton.classList.add('visible');
    };

    // 2. Recupero Dati dal file wizzies.json su GitHub
    const jsonUrl = "https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/wizzies.json";

    try {
        const response = await fetch(jsonUrl);
        if (!response.ok) throw new Error("Errore nel recupero del database Wizard");
        
        const wizzies = await response.json();
        
        // Il file wizzies.json è un array. Cerchiamo l'oggetto che ha l'ID corrispondente.
        // Nota: uso == invece di === nel caso in cui wizardId sia una stringa e l'ID nel JSON un numero.
        const foundWizard = wizzies.find(w => w.id == wizardId);

        if (foundWizard) {
            console.log(`Mago trovato: ${foundWizard.name}`);

            // Popoliamo il gameState con i dati del file JSON
            gameState.wizardData = {
                name: foundWizard.name,
                head: foundWizard.head,
                body: foundWizard.body,
                prop: foundWizard.prop,
                familiar: foundWizard.familiar,
                rune: foundWizard.rune,
                background: foundWizard.background,
                id: wizardId
            };

            // Esempio: Mostra il nome nell'interfaccia se hai un elemento dedicato
            // const nameDisplay = document.getElementById('wizard-name-display');
            // if (nameDisplay) nameDisplay.innerText = foundWizard.name;

        } else {
            console.warn(`Wizard #${wizardId} non trovato nel database locale.`);
            resetWizardData(wizardId);
        }
    } catch (e) {
        console.error("Errore critico durante il fetch dei dati:", e);
        resetWizardData(wizardId);
    }
}

// Funzione di fallback per resettare i dati se il wizard non esiste
function resetWizardData(id) {
    gameState.wizardData = {
        name: `Wizard #${id}`,
        head: "Unknown",
        body: "Unknown",
        prop: "None",
        familiar: "None",
        rune: "None",
        background: "None",
        id: id
    };
}

// --- STATS TABLE ---
function renderStatTable() {
    const tbody = document.getElementById('statsBody');
    if (!tbody) return;

    document.getElementById('availableEssence').innerText = gameState.essences;
    confirmStatsBtn.disabled = gameState.essences > 0;

    tbody.innerHTML = Object.keys(gameState.baseStats).map(stat => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #333;">${stat}</td>
            <td style="text-align: center;">${gameState.baseStats[stat]}</td>
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

    wizardIdInput.addEventListener('input', () => {
        startButton.classList.remove('visible');
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(handleLoadWizard, 500);
    });

    startButton.addEventListener('click', () => {
        startScreen.style.display = 'none';
        setupScreen.style.display = 'flex';
        // Passiamo l'immagine trasparente alla schermata di setup
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
    
    // Calcolo HP e Speed basato sulle statistiche
    gameState.hp = 100 + (gameState.addedStats["HP"] * 10);
    gameState.playerSpeed = 5 + (gameState.addedStats["Dexterity"] * 0.3);

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
