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

// Nuovo elemento per MetaMask (Assicurati di aggiungerlo nell'HTML!)
const connectWalletBtn = document.getElementById('connectWalletBtn');

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

// --- WEB3 & NFT LOGIC ---

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Richiesta account a MetaMask
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const address = accounts[0];
            console.log("Wallet Connesso:", address);
            
            // Recupera i Wizard posseduti dall'indirizzo
            await fetchUserWizards(address);
        } catch (error) {
            console.error("Errore connessione wallet:", error);
        }
    } else {
        alert("MetaMask non rilevato. Installa l'estensione!");
    }
}

async function fetchUserWizards(address) {
    try {
        // API di Forgotten Runes per ottenere i Wizard di un proprietario
        const response = await fetch(`https://forgottenrunes.com/api/art/wizards/owner/${address}`);
        const wizardIds = await response.json();

        if (wizardIds && wizardIds.length > 0) {
            // Inserisce automaticamente il primo Wizard trovato nell'input
            wizardIdInput.value = wizardIds[0];
            handleLoadWizard(); 
            console.log(`Trovati ${wizardIds.length} Wizard. Caricato ID: ${wizardIds[0]}`);
        } else {
            alert("Nessun Wizard trovato in questo wallet.");
        }
    } catch (e) {
        console.error("Errore nel recupero NFT:", e);
    }
}

async function getWizardAffinity(wizardId) {
    try {
        const response = await fetch(`https://forgottenrunes.com/api/art/wizards/${wizardId}.json`);
        const metadata = await response.json();
        
        // Cerca il tratto "Affinity" tra gli attributi
        const affinityAttr = metadata.attributes.find(attr => attr.trait_type === 'Affinity');
        return affinityAttr ? affinityAttr.value : "Neutral";
    } catch (e) {
        console.error("Errore recupero metadati:", e);
        return "Neutral";
    }
}

// --- CORE FUNCTIONS ---

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    CONFIG.CANVAS_WIDTH = canvas.width;
    CONFIG.CANVAS_HEIGHT = canvas.height;
}

function makeTransparent(img) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    tempCtx.drawImage(img, 0, 0);
    
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    const rTarget = data[0], gTarget = data[1], bTarget = data[2];
    const threshold = 50; 

    for (let i = 0; i < data.length; i += 4) {
        const distance = Math.sqrt(
            Math.pow(data[i] - rTarget, 2) + 
            Math.pow(data[i+1] - gTarget, 2) + 
            Math.pow(data[i+2] - bTarget, 2)
        );
        if (distance < threshold) data[i + 3] = 0;
    }
    tempCtx.putImageData(imageData, 0, 0);
    return tempCanvas.toDataURL();
}

let debounceTimer;
let lastLoadedId = "";

async function handleLoadWizard() {
    const wizardId = wizardIdInput.value.trim();
    if (wizardId === lastLoadedId || !wizardId) return;

    lastLoadedId = wizardId;
    
    // Recupero Affinity e applicazione bonus
    const affinity = await getWizardAffinity(wizardId);
    gameState.playerAffinity = affinity;
    console.log(`Wizard Affinity: ${affinity}`);
    
    // Logica Bonus (Esempio: Fire aumenta danno, Water HP)
    applyAffinityBonuses(affinity);

    const rawImg = new Image();
    rawImg.crossOrigin = "anonymous"; 
    rawImg.src = `https://www.forgottenrunes.com/api/art/wizards/${wizardId}.png`;

    rawImg.onload = () => {
        if (wizardIdInput.value.trim() === wizardId) {
            introImage.src = makeTransparent(rawImg);
            introImage.dataset.loaded = "true";
            startButton.classList.add('visible');
        }
    };
}

function applyAffinityBonuses(affinity) {
    // Resetta bonus base prima di applicare i nuovi
    // Esempio di implementazione:
    if (affinity === "Fire") CONFIG.BULLET_DAMAGE_MULTIPLIER = 1.5;
    if (affinity === "Water") gameState.hp = CONFIG.PLAYER_MAX_HP += 20;
}

// --- INITIALIZATION ---
async function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    Boss1.preloadBossAssets();
    initSkillTree();

    introImage.src = "";
    introImage.dataset.loaded = "false";

    // MetaMask Listener
    if (connectWalletBtn) connectWalletBtn.addEventListener('click', connectWallet);

    wizardIdInput.addEventListener('input', () => {
        startButton.classList.remove('visible');
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(handleLoadWizard, 500);
    });

    startButton.addEventListener('click', startGame);

    requestAnimationFrame(startScreenLoop);
}

function startScreenLoop() {
    if (gameState.currentScreen === 'start') {
        Renderer.drawStartScreen(ctx, bgParallax, introImage, Wiz1, bookImg);
        requestAnimationFrame(startScreenLoop);
    }
}

function startGame() {
    startScreen.style.display = 'none';
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

    // Logica invulnerabilità e shake
    if (gameState.isInvulnerable && (now - gameState.lastDamageTime > CONFIG.INVULNERABILITY_TIME)) {
        gameState.isInvulnerable = false;
    }
    gameState.screenShake = gameState.screenShake > 0.1 ? gameState.screenShake * CONFIG.SHAKE_DECAY : 0;

    // Rendering
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

    // Logic Spawn
    if (!gameState.bossActive) {
        if (gameState.gameTimer > 0) {
            if (now - (gameState.lastEnemySpawn || 0) > 2000) {
                Enemies.spawnEnemies(3);
                gameState.lastEnemySpawn = now;
            }
        } else {
            gameState.bossActive = true;
            gameState.enemies = [];
            const bossLevel = (gameState.bossDefeatedCount || 0) + 1;
            gameState.boss = Boss1.spawnBoss(bossLevel);
        }
    }

    // Boss Logic
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

    // Player Draw
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
        gameState.playerX += (gameState.touchX - gameState.playerX) * 0.5;
        gameState.playerY += (gameState.touchY - 80 - gameState.playerY) * 0.5;
    } else {
        if (gameState.keys['ArrowLeft']) gameState.playerX -= gameState.playerSpeed;
        if (gameState.keys['ArrowRight']) gameState.playerX += gameState.playerSpeed;
        if (gameState.keys['ArrowUp']) gameState.playerY -= gameState.playerSpeed;
        if (gameState.keys['ArrowDown']) gameState.playerY += gameState.playerSpeed;
    }
    gameState.playerX = Math.max(20, Math.min(CONFIG.CANVAS_WIDTH - 20, gameState.playerX));
    gameState.playerY = Math.max(20, Math.min(CONFIG.CANVAS_HEIGHT - 20, gameState.playerY));
}

// --- TOUCH & INPUT ---

let secondFingerTimer = null;
gameState.isTouchActive = false;
gameState.touchIdentifier = null;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        gameState.touchIdentifier = touch.identifier;
        gameState.isTouchActive = true;
        gameState.touchX = touch.clientX - rect.left;
        gameState.touchY = touch.clientY - rect.top;
    }
    if (e.touches.length === 2) {
        const now = Date.now();
        const lastTap = canvas.dataset.lastTap || 0;
        if (now - lastTap < 250) {
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
    const touch = Array.from(e.touches).find(t => t.identifier === gameState.touchIdentifier);
    if (touch) {
        gameState.touchX = touch.clientX - rect.left;
        gameState.touchY = touch.clientY - rect.top;
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
                applySkillBonus(path, level);
            }
        });
    });
    document.getElementById('closeSkills').addEventListener('click', resumeGame);
}

function applySkillBonus(path, level) {
    if (path === 'speed') gameState.playerSpeed += 0.5;
    if (path === 'defense') gameState.hp = Math.min(gameState.hp + 20, CONFIG.PLAYER_MAX_HP);
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
