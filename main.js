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
const connectWalletBtn = document.getElementById('connectWalletBtn');
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
let debounceTimer;
let lastLoadedId = "";


// --- WEB3 & NFT LOGIC ---

// --- CONSTANTS ---
const FR_CONTRACT = "0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42";
const OPENSEA_CHAIN = "ethereum";

// --- WEB3 & NFT LOGIC (OPENSEA METHOD) ---

async function fetchUserWizards(address) {
    const affinityDisplay = document.getElementById('affinityDisplay');
    try {
        if (affinityDisplay) affinityDisplay.innerText = "LOOKING ON OPENSEA...";

        // URL per ottenere gli NFT di un account filtrati per collezione su OpenSea
        const url = `https://api.opensea.io/api/v2/chain/${OPENSEA_CHAIN}/account/${address}/nfts?collection=forgottenruneswizardscult&limit=1`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'accept': 'application/json'
                // Nota: OpenSea potrebbe richiedere una API Key per volumi alti. 
                // Se hai una key, aggiungi qui: 'x-api-key': 'TUA_KEY'
            }
        });

        if (!response.ok) throw new Error("OpenSea blocked or limited");

        const data = await response.json();

        if (data.nfts && data.nfts.length > 0) {
            const nft = data.nfts[0];
            wizardIdInput.value = nft.identifier; // identifier su OpenSea è il tokenId
            console.log(`Wizard trovato su OS: ${nft.identifier}`);
            
            // OpenSea v2 non sempre manda tutti i tratti nella lista account.
            // Chiamiamo getWizardAffinity per essere sicuri dei metadati.
            handleLoadWizard(); 
        } else {
            if (affinityDisplay) affinityDisplay.innerText = "NO WIZARDS ON OPENSEA";
        }
    } catch (e) {
        console.error("OpenSea Fetch Error:", e);
        if (affinityDisplay) affinityDisplay.innerText = "OPENSEA BUSY - TRY MANUAL ID";
    }
}

async function getWizardAffinity(wizardId) {
    const affinityDisplay = document.getElementById('affinityDisplay');
    try {
        if (affinityDisplay) affinityDisplay.innerText = "READING METADATA...";

        const url = `https://api.opensea.io/api/v2/chain/${OPENSEA_CHAIN}/contract/${FR_CONTRACT}/nfts/${wizardId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'accept': 'application/json' }
        });
        
        const data = await response.json();
        const nft = data.nft;

        // Estrazione tratti da OpenSea
        let affinityValue = "Neutral";
        if (nft.traits) {
            const trait = nft.traits.find(t => t.trait_type === 'Affinity');
            if (trait) affinityValue = trait.value;
        }

        if (affinityDisplay) {
            affinityDisplay.innerText = `AFFINITY: ${affinityValue.toUpperCase()}`;
            // Applichiamo i colori
            const colors = {
                'Fire': '#ff4500', 'Water': '#00bfff', 'Earth': '#8b4513',
                'Air': '#f0ffff', 'Shadow': '#9400d3', 'Life': '#32cd32'
            };
            affinityDisplay.style.color = colors[affinityValue] || '#00ffcc';
        }

        return affinityValue;
    } catch (e) {
        console.error("OpenSea Metadata Error:", e);
        return "Neutral";
    }
}
// --- CORE FUNCTIONS ---

async function handleLoadWizard() {
    const wizardId = wizardIdInput.value.trim();
    if (wizardId === lastLoadedId || !wizardId) return;

    lastLoadedId = wizardId;
    
    // 1. Get Affinity & Stats
    const affinity = await getWizardAffinity(wizardId);
    gameState.playerAffinity = affinity;
    applyAffinityBonuses(affinity);

    // 2. Load Image with CORS safe handling
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
    // Implementazione bonus logica di gioco
    switch(affinity) {
        case 'Fire': CONFIG.BULLET_DAMAGE_MULTIPLIER = 1.4; break;
        case 'Water': gameState.hp = CONFIG.PLAYER_MAX_HP += 20; break;
        case 'Shadow': CONFIG.INVULNERABILITY_TIME += 500; break;
    }
}

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

    introImage.src = "";
    introImage.dataset.loaded = "false";

    // Listener MetaMask (Click + Touch)
    const handleConnect = async (e) => {
        if (e.type === 'touchstart') e.preventDefault();
        await connectWallet();
    };
    
   if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', async (e) => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile && !window.ethereum) {
            e.preventDefault();
            const currentUrl = window.location.href.replace(/^https?:\/\//, '');
            // Proviamo lo schema diretto "metamask://dapp/"
            window.location.href = `metamask://dapp/${currentUrl}`;
            return;
        }
        
        // Se siamo su PC o già in MetaMask Browser
        await connectWallet();
    });
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
