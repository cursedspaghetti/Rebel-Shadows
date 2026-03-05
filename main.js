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

// --- CARICAMENTO DATI ---
async function loadTraitBonuses() {
    try {
        const response = await fetch("https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/Game%20Attributes%20-%20Wiz%20Bonus.csv");
        if (!response.ok) throw new Error("CSV non trovato");
        
        const csvText = await response.text();
        const lines = csvText.split(/\r?\n/);
        gameState.traitBonusData = {};

        lines.slice(1).forEach(line => {
            if (!line.trim()) return;
            const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
            let cols = line.split(regex);

            if (cols.length >= 5) {
                const clean = (str) => str ? str.replace(/^"|"$/g, '').trim() : "";
                const traitName = clean(cols[1]).toLowerCase();
                gameState.traitBonusData[traitName] = {
                    rarity: clean(cols[3]),
                    attribute: clean(cols[4]),
                    value: parseFloat(clean(cols[5]).replace(',', '.')) || 0
                };
            }
        });
    } catch (e) { console.error("Errore CSV:", e); }
}

function getTraitDisplay(traitName) {
    if (!traitName || traitName === "-" || traitName === "None") return "-";
    const cleanName = traitName.trim().toLowerCase();
    const bonus = gameState.traitBonusData[cleanName];
    if (bonus) {
        return `${traitName} <br> <small style="color: #00ff00; font-size: 10px;">[${bonus.rarity}] ${bonus.attribute}: +${bonus.value}</small>`;
    }
    return traitName;
}

// --- LOGICA WIZARD ---
async function handleLoadWizard() {
    const wizardId = wizardIdInput.value.trim();
    if (!wizardId || wizardId === gameState.lastLoadedId) return;
    gameState.lastLoadedId = wizardId;

    // Reset Statistiche Base
    gameState.HP = 100;
    gameState.Defense = 10;
    gameState.Elusion = 0.05;
    gameState.Speed = 3;
    gameState.Attack_Power = 10;
    gameState.Attack_Rate = 500;
    gameState.Shield_CD = 15;
    gameState.Shield_Duration = 5;
    gameState.Special_CD = 10;
    
    gameState.buffs = { HP: 0, Defense: 0, Elusion: 0, Speed: 0, Attack_Power: 0, Attack_Rate: 0, Shield_CD: 0, Shield_Duration: 0, Special_CD: 0, Special_Duration: 0, Special_Width: 0 };

    // Caricamento Immagine
    const rawImg = new Image();
    rawImg.crossOrigin = "anonymous"; 
    rawImg.src = `https://www.forgottenrunes.com/api/art/wizards/${wizardId}.png`;
    rawImg.onload = () => {
        const transparentImgObj = makeTransparent(rawImg);
        transparentImgObj.onload = () => {
            introImage.src = transparentImgObj.src;
            if (setupWizImage) setupWizImage.src = transparentImgObj.src;
            if (startButton) startButton.style.display = 'block'; // Sincronizzato con CSS
        };
    };

    // Logica Bonus
    try {
        const response = await fetch("https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/wizzies.json");
        const wizzies = await response.json();
        const foundWizard = wizzies[wizardId];

        if (foundWizard) {
            gameState.wizardData = { ...foundWizard, id: wizardId };
            const categories = ['head', 'body', 'prop', 'familiar', 'rune', 'background'];

            categories.forEach(cat => {
                const traitFullValue = foundWizard[cat];
                if (traitFullValue && traitFullValue !== "None") {
                    let nameOnly = traitFullValue.includes(':') ? traitFullValue.split(':')[1].trim() : traitFullValue.trim();
                    const bonus = gameState.traitBonusData[nameOnly.toLowerCase()];
                    if (bonus) {
                        const target = bonus.attribute;
                        if (gameState.hasOwnProperty(target)) gameState[target] += bonus.value;
                        if (gameState.buffs.hasOwnProperty(target)) gameState.buffs[target] += bonus.value;
                    }
                }
            });

            document.getElementById('wizardDisplayName').innerText = `${foundWizard.name.toUpperCase()} (#${wizardId})`;
            document.getElementById('trait-head').innerHTML = getTraitDisplay(foundWizard.head);
            document.getElementById('trait-body').innerHTML = getTraitDisplay(foundWizard.body);
            document.getElementById('trait-prop').innerHTML = getTraitDisplay(foundWizard.prop);
            document.getElementById('trait-familiar').innerHTML = getTraitDisplay(foundWizard.familiar);
            document.getElementById('trait-rune').innerHTML = getTraitDisplay(foundWizard.rune);
            renderStatTable();
        }
    } catch (e) { console.error("Errore Database:", e); }
}

function renderStatTable() {
    const tbody = document.getElementById('statsBody');
    if (!tbody) return;
    const statsToRender = ['HP', 'Defense', 'Elusion', 'Speed', 'Attack_Power', 'Attack_Rate', 'Shield_CD', 'Special_CD'];

    tbody.innerHTML = statsToRender.map(stat => {
        const currentVal = gameState[stat] || 0;
        const buffVal = gameState.buffs[stat] || 0;
        const buffColor = buffVal > 0 ? '#00ff00' : (buffVal < 0 ? '#ff0044' : '#666666');
        return `
            <tr>
                <td>> ${stat.replace(/_/g, ' ')}</td>
                <td style="text-align: center; color: #ffff00;">${currentVal.toFixed(1).replace('.0', '')}</td>
                <td style="text-align: center; color: ${buffColor};">${buffVal > 0 ? '+'+buffVal : (buffVal < 0 ? buffVal : '--')}</td>
            </tr>`;
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
        startButton.style.display = 'none';
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(handleLoadWizard, 500);
    });

    startButton.addEventListener('click', () => {
        startScreen.style.display = 'none';
        setupScreen.style.display = 'flex'; // Cambiato da block a flex per il nuovo CSS
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
    gameState.playerX = CONFIG.CANVAS_WIDTH / 2;
    gameState.playerY = CONFIG.CANVAS_HEIGHT * 0.65;
    const totalWorldHeight = bgParallax.naturalHeight * 15;
    gameState.cameraY = -(totalWorldHeight - CONFIG.CANVAS_HEIGHT);
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
    
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // Backgrounds
    updateAndDrawBackgrounds();

    // Spawn Logica
    if (!gameState.bossActive) {
        if (gameState.cameraY >= 0) {
            gameState.bossActive = true;
            gameState.enemies = [];
        } else if (now - (gameState.lastEnemySpawn || 0) > 2000) {
            Enemies.spawnEnemies(3);
            gameState.lastEnemySpawn = now;
        }
    }

    // Update & Draw
    Renderer.updatePlayerMovement(bgParallax);
    Renderer.autoFire();
    Renderer.updateBullets();
    Enemies.updateEnemies();
    Enemies.updateEnemyBullets();
    SpecialAttacks.updateSpecialRay();
    SpecialAttacks.updateShield();
    collision.handleAllCollisions();

    // Boss logic
    if (gameState.bossActive) {
        if (!gameState.boss) gameState.boss = Boss1.spawnBoss((gameState.bossDefeatedCount || 0) + 1);
        else {
            Boss1.updateBoss(gameState.boss);
            Boss1.drawBossShadow(ctx, gameState.boss, shadowImg);
            if (gameState.boss.hp <= 0) {
                gameState.bossActive = false;
                gameState.boss = null;
                showPowerUpScreen();
                return;
            }
        }
    }

    // Render Player
    if (!(gameState.isInvulnerable && Math.floor(now / 100) % 2 === 0)) {
        Renderer.drawPlayer(ctx, playerSprite);
        Renderer.drawPlayerWiz(ctx);
    }

    // Render Entities
    Enemies.drawEnemies(ctx);
    Enemies.drawEnemyBullets(ctx);
    SpecialAttacks.drawSpecialRay(ctx);
    if (gameState.shieldActive) SpecialAttacks.drawShield(ctx);
    if (gameState.isCharging || gameState.isCharging2) SpecialAttacks.drawChargeEffect(ctx, chargeImg);
    
    Renderer.drawBullets(ctx);
    collision.drawExplosions(ctx);
    Renderer.drawUI(ctx);
    Renderer.drawHealthBar(ctx, gameState.HP, 100, CONFIG.CANVAS_WIDTH);

    requestAnimationFrame(gameLoop);
}

function updateAndDrawBackgrounds() {
    ctx.drawImage(bgImage, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    const drawX = (CONFIG.CANVAS_WIDTH / 2) - (bgParallax.naturalWidth / 2);
    const imgHeight = bgParallax.naturalHeight;

    for (let i = 0; i < 15; i++) {
        const currentSegmentY = gameState.cameraY + (i * imgHeight);
        if (currentSegmentY + imgHeight > 0 && currentSegmentY < CONFIG.CANVAS_HEIGHT) {
            ctx.drawImage(bgParallax, drawX, currentSegmentY, bgParallax.naturalWidth, imgHeight);
        }
    }
}

// --- INPUTS ---
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        gameState.touchIdentifier = e.touches[0].identifier;
        gameState.isTouchActive = true;
    }
    if (e.touches.length >= 2 && gameState.currentScreen === 'playing') {
        SpecialAttacks.activateShield(); // Semplificato per test
    }
}, { passive: false });

// SKILL TREE
const playerSkills = { points: 1, offense: 0, defense: 0, speed: 0, magic: 0 };
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
    gameLoop();
}

init();
