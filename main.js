import { CONFIG, gameState } from './config.js';
import * as Renderer from './renderer.js';
import * as Boss1 from './Boss1.js';
import * as SpecialAttacks from './Special Attacks.js';
import * as collision from './collision.js';
import * as Enemies from './enemies.js';


// --- CONFIGURAZIONE TOUCH ---
const TOUCH_SETTINGS = {
    LERP: 0.5,
    OFFSET_Y: 80,
    TAP_DELAY: 250
};


let secondFingerTimer = null;
gameState.isTouchActive = false;
gameState.touchIdentifier = null;

// --- DOM ELEMENTS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const powerUpScreen = document.getElementById('powerUpScreen');
const startButton = document.getElementById('startButton');

// Nuovi elementi DOM (Assicurati che esistano nell'HTML!)
const wizardIdInput = document.getElementById('wizardIdInput');

// --- ASSET LOADING ---
//INTRO
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

function resizeCanvas() {
    // 1. Aggiorna le dimensioni reali del canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 2. Aggiorna il CONFIG in memoria così i calcoli di spawn e bordi sono corretti
    CONFIG.CANVAS_WIDTH = canvas.width;
    CONFIG.CANVAS_HEIGHT = canvas.height;

    console.log(`Canvas resized to: ${canvas.width}x${canvas.height}`);
}

// rimozione sfondo
function makeTransparent(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Il colore da rimuovere è quello del primo pixel (0,0)
    const rTarget = data[0];
    const gTarget = data[1];
    const bTarget = data[2];
    
    // Soglia di tolleranza per i bordi
    const threshold = 50; 

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calcola la distanza tra il colore del pixel e quello del background
        const distance = Math.sqrt(
            Math.pow(r - rTarget, 2) + 
            Math.pow(g - gTarget, 2) + 
            Math.pow(b - bTarget, 2)
        );

        if (distance < threshold) {
            data[i + 3] = 0; // Trasparenza totale
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL(); // Restituisce l'immagine pulita
}

// Modifica questa funzione per richiedere l'immagine trasparente
function getWizardImageUrl(wizardId) {
    // Aggiungendo ?background=false chiediamo all'API di rimuovere lo sfondo
    return `https://forgottenrunes.com/api/art/wizards/${wizardId}.png?background=false`;
}

// Variabile globale per gestire il ritardo del caricamento (debounce)
let debounceTimer;
let lastLoadedId = "";

async function handleLoadWizard() {
    const wizardId = wizardIdInput.value.trim();
    if (wizardId === lastLoadedId || !wizardId) return;

    lastLoadedId = wizardId;
    
    const rawImg = new Image();
    // Importante: permette al JS di leggere i pixel
    rawImg.crossOrigin = "anonymous"; 
    rawImg.src = `https://www.forgottenrunes.com/api/art/wizards/${wizardId}.png`;

    rawImg.onload = () => {
        if (wizardIdInput.value.trim() === wizardId) {
            // Puliamo l'immagine e otteniamo un DataURL trasparente
            const transparentSrc = makeTransparent(rawImg);
            
            introImage.src = transparentSrc;
            introImage.dataset.loaded = "true";
            console.log(`Wizard ${wizardId} pulito con successo!`);
        }
    };
}

// --- INITIALIZATION ---
async function init() {
    resizeCanvas(); // Chiama il resize subito
    window.addEventListener('resize', resizeCanvas);
    Boss1.preloadBossAssets();
    initSkillTree();
    // 1. Setup iniziale: l'immagine parte vuota e il pulsante è nascosto
    introImage.src = "";
    introImage.dataset.loaded = "false";
    startButton.classList.remove('visible');

    // 2. Listener per il CARICAMENTO dell'immagine
    // Questo evento scatta solo quando l'immagine è stata scaricata con successo
    introImage.addEventListener('load', () => {
        // Aggiungiamo la classe .visible. 
        // L'animazione e il delay di 1s sono gestiti dal CSS
        startButton.classList.add('visible');
        introImage.dataset.loaded = "true";
    });

    // Opzionale: gestione errore se l'ID del mago non esiste
    introImage.addEventListener('error', () => {
        console.warn("Immagine non trovata per questo ID.");
        startButton.classList.remove('visible');
        introImage.dataset.loaded = "false";
    });

    // 3. Listener REATTIVO all'input dell'utente (Debounce)
    wizardIdInput.addEventListener('input', () => {
        // Se l'utente scrive, nascondiamo subito il pulsante (se era apparso)
        startButton.classList.remove('visible');
        
        // Resettiamo il timer del debounce
        clearTimeout(debounceTimer);
        
        // Avviamo la chiamata al caricamento dopo 500ms di inattività
        debounceTimer = setTimeout(() => {
            handleLoadWizard(); 
        }, 500);
    });

    // 4. Gestione Click su Start Game
    startButton.addEventListener('click', () => {
        // Passaggio alla modalità gioco
        gameState.currentScreen = 'playing';
        startScreen.style.display = 'none';
        
        // Se hai una musica di sottofondo o logica di avvio, chiamala qui
        // startGame();
    });

    // 5. Avvia il loop grafico della schermata iniziale
    requestAnimationFrame(startScreenLoop);
}

function startScreenLoop() {
    if (gameState.currentScreen === 'start') {
        // Se introImage.dataset.loaded è "false", il Renderer non disegnerà il Wizard
        Renderer.drawStartScreen(ctx, bgParallax, introImage, Wiz1, bookImg);
        requestAnimationFrame(startScreenLoop);
    }
}

// Avvio
init();

// --- GAME LOOP ---
function gameLoop() {
    // 1. USCITA IMMEDIATA
    // Fondamentale: se siamo in 'powerup', il loop si interrompe e non si auto-riproduce
    if (gameState.currentScreen !== 'playing') return;

    const now = Date.now();

    // 2. LOGICA STATO (Invulnerabilità e Shake)
    if (gameState.isInvulnerable && (now - gameState.lastDamageTime > CONFIG.INVULNERABILITY_TIME)) {
        gameState.isInvulnerable = false;
    }

    if (gameState.screenShake > 0.1) gameState.screenShake *= CONFIG.SHAKE_DECAY;
    else gameState.screenShake = 0;

    // 3. PULIZIA E CAMERA SHAKE
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.save(); 
    if (gameState.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * gameState.screenShake, (Math.random() - 0.5) * gameState.screenShake);
    }

    // 4. AGGIORNAMENTO MOVIMENTO E SFONDI
    updateAndDrawBackgrounds();
    updatePlayerMovement();

    // 5. AGGIORNAMENTO LOGICA ENTITÀ
    Renderer.autoFire();
    Renderer.updateBullets();
    Enemies.updateEnemies();
    Enemies.updateEnemyBullets();
    collision.updateExplosions(); 
    SpecialAttacks.updateSpecialRay();
    SpecialAttacks.updateSpecialRay2();

    // 6. LOGICA SPAWN (NEMICI / BOSS)
    if (!gameState.bossActive) {
        // Spawn nemici comuni (solo se il timer è sopra la soglia del boss)
        if (gameState.gameTimer > 55) {
            if (now - (gameState.lastEnemySpawn || 0) > 2000) {
                Enemies.spawnEnemies(3);
                gameState.lastEnemySpawn = now;
            }
        } else {
            // Attivazione Boss
            gameState.bossActive = true;
            gameState.enemies = []; // Pulisce i nemici piccoli
            
            // Inizializza il boss scalando il livello
            // Assicurati che gameState.bossDefeatedCount sia inizializzato a 0 in config.js
            if (!gameState.boss) {
                const bossLevel = (gameState.bossDefeatedCount || 0) + 1;
                gameState.boss = Boss1.spawnBoss(bossLevel);
                console.log(`Spawning Boss Level: ${bossLevel}`);
            }
        }
    }

    // 7. LOGICA E RENDERING BOSS
    if (gameState.bossActive && gameState.boss) {
        Boss1.updateBoss(gameState.boss);
        Boss1.drawBossShadow(ctx, gameState.boss, shadowImg);
        
        if (gameState.boss.hp <= 0) {
            // Vittoria!
            gameState.bossActive = false;
            gameState.boss = null;
            gameState.bossBullets = []; // Pulizia immediata proiettili
            
            ctx.restore(); 
            showPowerUpScreen(); // Questa funzione mette lo stato su 'powerup'
            return; 
        }
    }

    // 8. COLLISIONI
    collision.handleAllCollisions();

    // 9. RENDERING GIOCATORE ED EFFETTI
    const isBlinking = gameState.isInvulnerable && Math.floor(now / 100) % 2 === 0;
    if (!isBlinking) Renderer.drawPlayer(ctx, playerSprite);

    Enemies.drawEnemies(ctx);
    Enemies.drawEnemyBullets(ctx);
    SpecialAttacks.drawSpecialRay(ctx);
    SpecialAttacks.drawSpecialRay2(ctx);
    if (gameState.isCharging || gameState.isCharging2) SpecialAttacks.drawChargeEffect(ctx, chargeImg);
    Renderer.drawBullets(ctx);
    collision.drawExplosions(ctx);

    ctx.restore(); 

    // 10. UI FISSA
    Renderer.drawUI(ctx);
    Renderer.drawHealthBar(ctx, gameState.hp, CONFIG.PLAYER_MAX_HP, CONFIG.CANVAS_WIDTH);

    // 11. PIANIFICAZIONE PROSSIMO FRAME
    requestAnimationFrame(gameLoop);
}
// --- HELPER FUNCTIONS ---

function updateAndDrawBackgrounds() {
    // Parallax
    gameState.parallaxPositionY = (gameState.parallaxPositionY + CONFIG.PARALLAX_SPEED) % CONFIG.CANVAS_HEIGHT;
    ctx.drawImage(bgParallax, 0, gameState.parallaxPositionY, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.drawImage(bgParallax, 0, gameState.parallaxPositionY - CONFIG.CANVAS_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // Background principale
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


function startGame() {
    startScreen.style.display = 'none';
    gameState.currentScreen = 'playing';
    gameState.timerInterval = setInterval(() => {
        if (gameState.gameTimer > 0) gameState.gameTimer--;
    }, 1000);
    gameLoop();
}


// --- INPUT LISTENERS ---
// --- LOGICA INPUT TOUCH AGGIORNATA ---
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const now = Date.now();

    // Gestione del primo dito (Movimento e Tap)
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        gameState.touchIdentifier = touch.identifier;
        gameState.isTouchActive = true;
        updateCoords(touch, rect);

        // --- LOGICA SINGLE vs DOUBLE TAP ---
        const lastTap = canvas.dataset.lastTap || 0;
        const timesince = now - lastTap;

        if (timesince < TOUCH_SETTINGS.TAP_DELAY && timesince > 0) {
            // DOPPIO TAP RILEVATO -> Special Attack 1
            console.log("Double Tap: Special Attack 1");
            SpecialAttacks.fireSpecialAttackSequence(); 
            canvas.dataset.lastTap = 0; // Reset per evitare tripli tap
        } else {
            // SINGOLO TAP (o primo del doppio) -> Shield
            // Usiamo un piccolo timeout per non attivare lo scudo se è l'inizio di un doppio tap? 
            // In un action game è meglio attivarlo subito per reattività:
            SpecialAttacks.activateShield(); 
            canvas.dataset.lastTap = now;
        }
    }

    // Gestione secondo dito (Multi-touch) - Lasciato invariato o per Special 2
    if (e.touches.length >= 2 && gameState.currentScreen === 'playing') {
        // Puoi decidere di mappare lo Special 2 qui in futuro
        // SpecialAttacks.fireSpecialAttackSequence2();
    }
}, { passive: false });


canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = Array.from(e.touches).find(t => t.identifier === gameState.touchIdentifier);
    if (touch) updateCoords(touch, rect);
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    const stillDragging = Array.from(e.touches).find(t => t.identifier === gameState.touchIdentifier);
    if (!stillDragging) {
        gameState.isTouchActive = false;
        gameState.touchIdentifier = null;
    }
});

function updateCoords(touch, rect) {
    // Se il canvas è full screen, il rapporto è 1:1
    gameState.touchX = touch.clientX - rect.left;
    gameState.touchY = touch.clientY - rect.top;
}

window.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;
    if (e.key === ' ' && gameState.currentScreen === 'playing') {
        SpecialAttacks.fireSpecialAttackSequence();
        SpecialAttacks.fireSpecialAttackSequence2();
    }
});
window.addEventListener('keyup', (e) => gameState.keys[e.key] = false);

startButton.addEventListener('click', startGame);



// --- LOGICA SKILL TREE ---

// Stato iniziale (puoi metterlo anche in config.js se preferisci)
const playerSkills = {
    offense: 0,
    defense: 0,
    speed: 0,
    magic: 0,
    points: 1 // Guadagni un punto ogni boss
};

function initSkillTree() {
    const skillButtons = document.querySelectorAll('.skill-node');
    const skillPointsDisplay = document.getElementById('skill-points');

    skillButtons.forEach(button => {
        button.addEventListener('click', () => {
            const path = button.parentElement.dataset.path;
            const level = parseInt(button.dataset.level);

            // Verifica: Hai punti? È il livello successivo?
            if (playerSkills.points > 0 && level === playerSkills[path] + 1) {
                
                // Applica il potenziamento
                playerSkills[path] = level;
                playerSkills.points--;
                
                // Aggiorna UI
                button.classList.remove('locked');
                button.classList.add('unlocked');
                skillPointsDisplay.innerText = playerSkills.points;

                // Applica benefici reali alle statistiche
                applySkillBonus(path, level);
                
                console.log(`Sbloccato ${path} Lv. ${level}`);
            } else if (playerSkills.points <= 0) {
                alert("Non hai abbastanza punti abilità!");
            } else {
                alert("Devi sbloccare il livello precedente!");
            }
        });
    });

    // Bottone per tornare al gioco
    document.getElementById('closeSkills').addEventListener('click', () => {
        resumeGame();
    });
}

function applySkillBonus(path, level) {
    switch(path) {
        case 'offense':
            // Esempio: CONFIG.PLAYER_DAMAGE += 2;
            break;
        case 'defense':
            gameState.hp = Math.min(gameState.hp + 20, CONFIG.PLAYER_MAX_HP);
            break;
        case 'speed':
            gameState.playerSpeed += 0.5;
            break;
    }
}

function showPowerUpScreen() {
    gameState.currentScreen = 'powerup';
    powerUpScreen.style.display = 'flex'; // Usiamo flex per il layout a colonne
    
    // Reset timer e interrompi spawn
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    
    // Aggiungiamo un punto abilità per la vittoria
    playerSkills.points++;
    document.getElementById('skill-points').innerText = playerSkills.points;
}

function resumeGame() {
    powerUpScreen.style.display = 'none';
    gameState.currentScreen = 'playing';
    
    // Ripristina il timer o aumenta la difficoltà
    gameState.gameTimer = 60; // Esempio: reset timer per il prossimo boss
    gameState.timerInterval = setInterval(() => {
        if (gameState.gameTimer > 0) gameState.gameTimer--;
    }, 1000);
    
    requestAnimationFrame(gameLoop); // Riavvia il loop
}
