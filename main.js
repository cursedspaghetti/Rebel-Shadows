import { CONFIG, gameState } from './config.js';
import * as Renderer from './renderer.js';
import * as Boss1 from './Boss1.js';
import * as SpecialAttacks from './Special Attacks.js';
import * as collision from './collision.js';
import * as Enemies from './enemies.js';

// --- CONFIGURAZIONE E STATO GLOBALE ---
let debounceTimer; 
// Inizializziamo la camera se non presente nel gameState
gameState.camera = { x: 0, y: 0 };

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
Wiz1.src = 'https://raw.githubusercontent.com/cursedspaghetti/Rebel-Shadows/main/Wiz1.png';
const bookImg = new Image();
bookImg.src = 'https://raw.githubusercontent.com/cursedspaghetti/Rebel-Shadows/main/book1.png';

const bgIntro = new Image();
bgIntro.src = 'https://raw.githubusercontent.com/cursedspaghetti/Rebel-Shadows/main/EmptySpaceVoid.png';
const bgParallax = new Image();
bgParallax.src = 'https://raw.githubusercontent.com/cursedspaghetti/Rebel-Shadows/main/EmptySpace.png'; 
const playerSprite = new Image();
playerSprite.src = 'https://raw.githubusercontent.com/cursedspaghetti/Rebel-Shadows/main/booksprite.png';

export const chargeImg = new Image();
chargeImg.src = "https://raw.githubusercontent.com/cursedspaghetti/Rebel-Shadows/main/bookfull.png";
export const shadowImg = new Image();
shadowImg.src = "https://raw.githubusercontent.com/cursedspaghetti/Rebel-Shadows/main/Shadow.png";

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

async function loadTraitBonuses() {
    try {
        const response = await fetch("https://raw.githubusercontent.com/cursedspaghetti/Rebel-Shadows/main/Game%20Attributes%20-%20Wiz%20Bonus.csv");
        if (!response.ok) throw new Error("CSV non trovato");
        const csvText = await response.text();
        const lines = csvText.split(/\r?\n/);
        gameState.traitBonusData = {};
        lines.slice(1).forEach(line => {
            if (!line.trim()) return;
            const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
            let cols = line.split(regex);
            if (cols.length >= 5) {
                const clean = (str) => str ? str.replace(/"/g, '').trim() : "";
                const traitName = clean(cols[1]).toLowerCase(); 
                const rarity = clean(cols[3]);
                const attribute = clean(cols[4]);
                let valStr = clean(cols[5]).replace(',', '.');
                const value = parseFloat(valStr) || 0;
                gameState.traitBonusData[traitName] = { rarity, attribute, value };
            }
        });
    } catch (e) { console.error("Errore CSV:", e); }
}

function getTraitDisplay(traitName) {
    if (!traitName || traitName === "-" || traitName === "None") return "-";
    const cleanName = traitName.trim().toLowerCase();
    const bonus = gameState.traitBonusData[cleanName];
    if (bonus) {
        const rarityColors = { "common": "#d3d3d3", "rare": "#1e90ff", "legendary": "#ff8c00" };
        const color = rarityColors[bonus.rarity.toLowerCase()] || "#d3d3d3"; 
        return `${traitName} <br> <span style="color: ${color}; font-size: 13px; font-weight: 500; display: block; margin-top: 2px;">[${bonus.rarity}] ${bonus.attribute}: +${bonus.value}</span>`;
    }
    return traitName;
}

// --- LOGICA CARICAMENTO WIZARD ---
async function handleLoadWizard() {
    const wizardId = wizardIdInput.value.trim();
    if (!wizardId || wizardId === gameState.lastLoadedId) return;
    gameState.lastLoadedId = wizardId;

    const wizardDisplayName = document.getElementById('wizardDisplayName');
    const traitElements = {
        head: document.getElementById('trait-head'),
        body: document.getElementById('trait-body'),
        prop: document.getElementById('trait-prop'),
        rune: document.getElementById('trait-rune'),
        familiar: document.getElementById('trait-familiar'),
        bg: document.getElementById('trait-bg')
    };

    // Reset Statistiche
    gameState.HP = 100; gameState.Defense = 10; gameState.Elusion = 0.05; gameState.Speed = 3;
    gameState.Attack_Power = 10; gameState.Attack_Rate = 200; gameState.Shield_CD = 20;
    gameState.Shield_Duration = 1; gameState.Special_CD = 20;

    gameState.buffs = { 
        HP: 0, Defense: 0, Elusion: 0, Speed: 0, Attack_Power: 0, Attack_Rate: 0, 
        Shield_CD: 0, Shield_Duration: 0, Special_CD: 0, Special_Duration: 0, Special_Width: 0 
    };

    const rawImg = new Image();
    rawImg.crossOrigin = "anonymous"; 
    rawImg.src = `https://www.forgottenrunes.com/api/art/wizards/${wizardId}.png`;
    rawImg.onload = () => {
        const transparentImgObj = makeTransparent(rawImg);
        transparentImgObj.onload = () => {
            introImage.src = transparentImgObj.src;
            if (setupWizImage) setupWizImage.src = transparentImgObj.src;
            if (startButton) startButton.classList.add('visible');
        };
    };

    try {
        const response = await fetch("https://raw.githubusercontent.com/cursedspaghetti/Rebel-Shadows/main/wizzies.json");
        const wizzies = await response.json();
        const foundWizard = wizzies[wizardId];
        if (foundWizard) {
            gameState.wizardData = { ...foundWizard, id: wizardId };
            const categories = ['head', 'body', 'prop', 'familiar', 'rune', 'background'];
            categories.forEach(cat => {
                const traitFullValue = foundWizard[cat];
                if (traitFullValue && traitFullValue !== "None") {
                    let nameVariants = [traitFullValue.trim().toLowerCase()];
                    if (traitFullValue.includes(':')) nameVariants.push(traitFullValue.split(':')[1].trim().toLowerCase());
                    let bonus = null;
                    for (let variant of nameVariants) {
                        if (gameState.traitBonusData[variant]) { bonus = gameState.traitBonusData[variant]; break; }
                    }
                    if (bonus) {
                        const targetStat = bonus.attribute;
                        const valueToAdd = parseFloat(bonus.value) || 0;
                        if (gameState.hasOwnProperty(targetStat)) gameState[targetStat] += valueToAdd;
                        const buffKey = Object.keys(gameState.buffs).find(k => k.toLowerCase() === targetStat.toLowerCase());
                        if (buffKey) gameState.buffs[buffKey] += valueToAdd;
                    }
                }
            });
            if (wizardDisplayName) wizardDisplayName.innerText = `${foundWizard.name.toUpperCase()} (#${wizardId})`;
            Object.keys(traitElements).forEach(key => {
                if (traitElements[key]) traitElements[key].innerHTML = getTraitDisplay(foundWizard[key === 'bg' ? 'background' : key]);
            });
            renderStatTable();
        }
    } catch (e) { console.error(e); }
}

function renderStatTable() {
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    if (bgIntro.complete) ctx.drawImage(bgIntro, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    const tbody = document.getElementById('statsBody');
    if (!tbody) return;
    const statsToRender = ['HP', 'Defense', 'Elusion', 'Speed', 'Attack_Power', 'Attack_Rate', 'Shield_CD', 'Shield_Duration', 'Special_CD', 'Special_Duration', 'Special_Width'];
    tbody.innerHTML = statsToRender.map(stat => {
        let currentVal = (stat === 'Special_Duration' || stat === 'Special_Width') ? (gameState.specialRay ? gameState.specialRay[stat] : 0) : gameState[stat];
        let header = stat === 'HP' ? `<tr class="section-header first-header"><td colspan="3"><strong>WIZARD</strong></td></tr>` : (stat === 'Attack_Power' ? `<tr class="section-header"><td colspan="3"><strong>BOOK OF SHADOWS</strong></td></tr>` : '');
        const buffVal = gameState.buffs[stat] || 0;
        const buffDisplay = buffVal > 0 ? `+${buffVal}` : (buffVal < 0 ? `${buffVal}` : '--');
        return header + `<tr class="stat-row"><td>> ${stat.replace(/_/g, ' ').toUpperCase()}</td><td>${currentVal.toFixed(1).replace('.0', '')}</td><td style="text-align: right;">${buffDisplay}</td></tr>`;
    }).join('');
}

// --- INITIALIZATION ---
async function init() {
    await loadTraitBonuses();
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
        gameState.currentScreen = 'setup';
        startScreen.style.display = 'none';
        setupScreen.style.display = 'flex';
        renderStatTable();
    });
    confirmStatsBtn.addEventListener('click', startGame);
    requestAnimationFrame(startScreenLoop);
}

function startScreenLoop() {
    if (gameState.currentScreen === 'start') {
        Renderer.drawStartScreen(ctx, bgIntro, introImage, Wiz1, bookImg);
        requestAnimationFrame(startScreenLoop);
    }
}

function startGame() {
    setupScreen.style.display = 'none';
    gameState.currentScreen = 'playing';
    
    // Posizionamento al centro della mappa reale
    gameState.playerX = bgParallax.naturalWidth / 2;
    gameState.playerY = bgParallax.naturalHeight / 2;

    gameState.gameTimer = CONFIG.GAME_TIME;
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        if (gameState.gameTimer > 0) gameState.gameTimer--;
        else { gameState.bossActive = true; clearInterval(gameState.timerInterval); }
    }, 1000);

    gameState.bossActive = false;
    gameState.enemies = [];
    gameLoop();
}

// --- LOGICA TELECAMERA E MAPPA ---
function updateCameraAndMap() {
    // 1. Centra la camera sul player
    gameState.camera.x = gameState.playerX - CONFIG.CANVAS_WIDTH / 2;
    gameState.camera.y = gameState.playerY - CONFIG.CANVAS_HEIGHT / 2;

    // 2. Limiti della camera (non mostrare fuori dalla mappa)
    const mapW = bgParallax.naturalWidth;
    const mapH = bgParallax.naturalHeight;
    gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, mapW - CONFIG.CANVAS_WIDTH));
    gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, mapH - CONFIG.CANVAS_HEIGHT));

    // 3. Disegna la mappa traslata
    ctx.drawImage(bgParallax, -gameState.camera.x, -gameState.camera.y, mapW, mapH);

    // Effetto Flash
    if (gameState.flashActive) {
        const elapsed = Date.now() - gameState.flashStartTime;
        if (elapsed < gameState.flashDuration) {
            ctx.fillStyle = Math.random() > 0.8 ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)';
            ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        }
    }
}

function gameLoop() {
    if (gameState.currentScreen !== 'playing') return;
    const now = Date.now();
    
    if (gameState.isInvulnerable && (now - gameState.lastDamageTime > CONFIG.INVULNERABILITY_TIME)) gameState.isInvulnerable = false;
    gameState.screenShake = gameState.screenShake > 0.1 ? gameState.screenShake * CONFIG.SHAKE_DECAY : 0;

    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // --- RENDERING MONDO (TRALATO) ---
    updateCameraAndMap(); 

    ctx.save();
    if (gameState.screenShake > 0) ctx.translate((Math.random() - 0.5) * gameState.screenShake, (Math.random() - 0.5) * gameState.screenShake);
    
    // Trasliamo tutto il disegno in base alla camera
    ctx.translate(-gameState.camera.x, -gameState.camera.y);

    // Update logica
    Renderer.updatePlayerMovement(bgParallax); // Passiamo la mappa per i limiti
    Renderer.autoFire();
    Renderer.updateBullets();
    Enemies.updateEnemies();
    Enemies.updateEnemyBullets();
    collision.updateExplosions(); 
    SpecialAttacks.updateSpecialRay();
    SpecialAttacks.updateShield();
    
    if (!gameState.bossActive) {
        if (now - (gameState.lastEnemySpawn || 0) > 2000) {
            Enemies.spawnEnemies(3);
            gameState.lastEnemySpawn = now;
        }
    } else {
        if (!gameState.boss) gameState.boss = Boss1.spawnBoss(1);
        else {
            Boss1.updateBoss(gameState.boss);
            Boss1.drawBossShadow(ctx, gameState.boss, shadowImg);
            if (gameState.boss.hp <= 0) {
                gameState.bossActive = false; gameState.boss = null;
                ctx.restore(); showPowerUpScreen(); return;
            }
        }
    }

    collision.handleAllCollisions();

    // Disegno entità nel mondo
    if (!(gameState.isInvulnerable && Math.floor(now / 100) % 2 === 0)) {
        if (!gameState.isCharging && !gameState.isCharging2) Renderer.drawPlayer(ctx, playerSprite);
        Renderer.drawPlayerWiz(ctx);
    }
    Enemies.drawEnemies(ctx);
    Enemies.drawEnemyBullets(ctx);
    SpecialAttacks.drawSpecialRay(ctx);
    if (gameState.isCharging || gameState.isCharging2) SpecialAttacks.drawChargeEffect(ctx, chargeImg);
    Renderer.drawBullets(ctx);
    collision.drawExplosions(ctx);
    if (gameState.shieldActive) SpecialAttacks.drawShield(ctx);

    ctx.restore(); 

    // --- RENDERING UI (FISSA) ---
    Renderer.drawTouchPad(ctx);
    Renderer.drawUI(ctx);
    Renderer.drawHealthBar(ctx, gameState.HP, 100, CONFIG.CANVAS_WIDTH);

    requestAnimationFrame(gameLoop);
}

// --- INPUT LISTENERS ---
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    if (e.touches.length === 1) {
        gameState.touchIdentifier = e.touches[0].identifier;
        gameState.isTouchActive = true;
        gameState.touchX = (e.touches[0].clientX - rect.left) * (CONFIG.CANVAS_WIDTH / rect.width);
        gameState.touchY = (e.touches[0].clientY - rect.top) * (CONFIG.CANVAS_HEIGHT / rect.height);
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = Array.from(e.touches).find(t => t.identifier === gameState.touchIdentifier);
    if (touch) {
        gameState.touchX = (touch.clientX - rect.left) * (CONFIG.CANVAS_WIDTH / rect.width);
        gameState.touchY = (touch.clientY - rect.top) * (CONFIG.CANVAS_HEIGHT / rect.height);
    }
}, { passive: false });

// Skill Tree & Screens
function showPowerUpScreen() {
    gameState.currentScreen = 'powerup';
    powerUpScreen.style.display = 'flex';
}

function initSkillTree() {
    const closeBtn = document.getElementById('closeSkills');
    if (closeBtn) closeBtn.addEventListener('click', () => {
        powerUpScreen.style.display = 'none';
        gameState.currentScreen = 'playing';
        startGame(); // Ricomincia o riprendi
    });
}

init();
