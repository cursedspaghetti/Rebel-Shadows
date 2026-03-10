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

const bgIntro = new Image();
bgIntro.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/EmptySpaceVoid.png';
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
    const clean = (str) => str ? str.replace(/"/g, '').trim() : "";

    // Il nome del tratto è nella colonna 1
    const traitName = clean(cols[1]).toLowerCase(); 
    const rarity = clean(cols[3]);
    const attribute = clean(cols[4]);
    
    // Il valore è nella colonna 5 (che sia "0,20" o 0.20)
    let valStr = clean(cols[5]).replace(',', '.');
    const value = parseFloat(valStr) || 0;

    gameState.traitBonusData[traitName] = {
        rarity: rarity,
        attribute: attribute,
        value: value
    };
}
        });
        console.log("Bonus caricati correttamente:", Object.keys(gameState.traitBonusData).length);
    } catch (e) {
        console.error("Errore CSV:", e);
    }
}

// Funzione helper per formattare la visualizzazione del tratto + bonus
function getTraitDisplay(traitName) {
    if (!traitName || traitName === "-" || traitName === "None") return "-";
    
    // Pulizia: togliamo spazi e portiamo in minuscolo per il confronto
    const cleanName = traitName.trim().toLowerCase();
    const bonus = gameState.traitBonusData[cleanName];

    if (bonus) {
        return `${traitName} <br> 
                <small style="color: #00ff00; font-size: 10px;">
                [${bonus.rarity}] ${bonus.attribute}: +${bonus.value}
                </small>`;
    }
    
    // Se non trova il bonus, stampa un log per aiutarti a capire cosa non combacia
    console.warn(`Nessun bonus trovato per il tratto: "${traitName}"`);
    return traitName;
}

// --- LOGICA CARICAMENTO WIZARD ---
async function handleLoadWizard() {
    const wizardId = wizardIdInput.value.trim();
    if (!wizardId || wizardId === gameState.lastLoadedId) return;
    gameState.lastLoadedId = wizardId;

    // Riferimenti agli elementi UI
    const wizardDisplayName = document.getElementById('wizardDisplayName');
    const traitHead = document.getElementById('trait-head');
    const traitBody = document.getElementById('trait-body');
    const traitProp = document.getElementById('trait-prop');
    const traitRune = document.getElementById('trait-rune');
    const traitFamiliar = document.getElementById('trait-familiar');
    const traitBg = document.getElementById('trait-bg');

    // --- 1. RESET STATISTICHE BASE ---
    gameState.HP = 100;
    gameState.Defense = 10;
    gameState.Elusion = 0.05;
    gameState.Speed = 3;
    gameState.Attack_Power = 10;
    gameState.Attack_Rate = 500;
    gameState.Shield_CD = 15;
    gameState.Shield_Duration = 5;
    gameState.Special_CD = 10;

    if(gameState.specialRay) {
        gameState.specialRay.Special_Duration = 0.8;
        gameState.specialRay.Special_Width = 250;
    }

    // --- 2. RESET BUFFS (IMPORTANTE: Farlo PRIMA del caricamento bonus) ---
    gameState.buffs = {
        HP: 0, Defense: 0, Elusion: 0, Speed: 0, 
        Attack_Power: 0, Attack_Rate: 0, Shield_CD: 0, 
        Shield_Duration: 0, Special_CD: 0, Special_Duration: 0, Special_Width: 0
    };

    // --- 3. CARICAMENTO IMMAGINI (WIZARD & SPRITESHEET) ---
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

    const spriteSheetRaw = new Image();
    spriteSheetRaw.crossOrigin = "anonymous";
    spriteSheetRaw.src = `https://www.forgottenrunes.com/api/art/wizards/${wizardId}/spritesheet.png`;
    spriteSheetRaw.onload = () => {
        const transparentSpriteObj = makeTransparent(spriteSheetRaw);
        transparentSpriteObj.onload = () => { gameState.wizardSpritesheet = transparentSpriteObj; };
    };

    // --- 4. LOGICA DATI E APPLICAZIONE BONUS ---
    try {
        const response = await fetch("https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/wizzies.json");
        if (!response.ok) throw new Error("Database error");
        const wizzies = await response.json();
        const foundWizard = wizzies[wizardId];

        if (foundWizard) {
            gameState.wizardData = { ...foundWizard, id: wizardId };
            const categories = ['head', 'body', 'prop', 'familiar', 'rune', 'background'];

            categories.forEach(cat => {
                const traitFullValue = foundWizard[cat];
                if (traitFullValue && traitFullValue !== "None") {
                    
                    // Normalizzazione nome: proviamo il nome intero o quello dopo i ":"
                    let nameVariants = [traitFullValue.trim().toLowerCase()];
                    if (traitFullValue.includes(':')) {
                        nameVariants.push(traitFullValue.split(':')[1].trim().toLowerCase());
                    }

                    // Cerchiamo se esiste un bonus per una delle varianti
                    let bonus = null;
                    for (let variant of nameVariants) {
                        if (gameState.traitBonusData[variant]) {
                            bonus = gameState.traitBonusData[variant];
                            break;
                        }
                    }

                    if (bonus) {
                        const targetStat = bonus.attribute; // Es: "Shield_Duration"
                        const valueToAdd = parseFloat(bonus.value) || 0;

                        // A. Applica al gameState (Statistica reale)
                        if (gameState.hasOwnProperty(targetStat)) {
                            gameState[targetStat] += valueToAdd;
                        } else if (gameState.specialRay && gameState.specialRay.hasOwnProperty(targetStat)) {
                            gameState.specialRay[targetStat] += valueToAdd;
                        }

                        // B. Aggiorna l'oggetto BUFFS (per la colonna verde della UI)
                        // Usiamo una ricerca case-insensitive per sicurezza
                        const buffKey = Object.keys(gameState.buffs).find(k => k.toLowerCase() === targetStat.toLowerCase());
                        if (buffKey) {
                            gameState.buffs[buffKey] += valueToAdd;
                            console.log(`Bonus Applicato: ${buffKey} +${valueToAdd} (Tratto: ${traitFullValue})`);
                        }
                    }
                }
            });

            // --- 5. AGGIORNAMENTO UI ---
            if (wizardDisplayName) wizardDisplayName.innerText = `${foundWizard.name.toUpperCase()} (#${wizardId})`;
            if (traitHead) traitHead.innerHTML = getTraitDisplay(foundWizard.head);
            if (traitBody) traitBody.innerHTML = getTraitDisplay(foundWizard.body);
            if (traitProp) traitProp.innerHTML = getTraitDisplay(foundWizard.prop);
            if (traitFamiliar) traitFamiliar.innerHTML = getTraitDisplay(foundWizard.familiar);
            if (traitRune) traitRune.innerHTML = getTraitDisplay(foundWizard.rune);
            if (traitBg) traitBg.innerHTML = getTraitDisplay(foundWizard.background);

            console.log("DEBUG FINALE BUFFS:", gameState.buffs);
            renderStatTable();
            
        } else {
            handleError(wizardId, "UNKNOWN WIZARD");
        }
    } catch (e) {
        console.error("Errore in handleLoadWizard:", e);
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

function renderStatTable() {
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    // 1. SFONDO
    if (bgIntro.complete && bgIntro.naturalWidth !== 0) {
        ctx.drawImage(bgIntro, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    } else {
        ctx.fillStyle = '#000033'; 
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }
    
    const tbody = document.getElementById('statsBody');
    if (!tbody) return;

    const statsToRender = [
        'HP', 'Defense', 'Elusion', 'Speed', 
        'Attack_Power', 'Attack_Rate', 
        'Shield_CD', 'Shield_Duration', 
        'Special_CD', 'Special_Duration', 'Special_Width'
    ];

    tbody.innerHTML = statsToRender.map(stat => {
        let currentVal;

        // Recupero il valore ATTUALE (già incrementato dai bonus in handleLoadWizard)
        if (stat === 'Special_Duration' || stat === 'Special_Width') {
            currentVal = gameState.specialRay ? gameState.specialRay[stat] : 0;
        } else {
            currentVal = gameState[stat];
        }

        const buffVal = (gameState.buffs && gameState.buffs[stat]) ? gameState.buffs[stat] : 0;
        const buffDisplay = buffVal > 0 ? `+${buffVal}` : (buffVal < 0 ? `${buffVal}` : '--');
        const buffColor = buffVal > 0 ? '#00ff00' : (buffVal < 0 ? '#ff0044' : '#666666');
        const displayName = stat.replace(/_/g, ' ').toUpperCase();
        
        return `
            <tr style="image-rendering: pixelated; border-bottom: 2px solid #003366;">
                <td style="padding: 8px 4px; text-align: left; font-family: 'Courier New', monospace; font-weight: bold; color: #ffffff; font-size: 12px; text-shadow: 2px 2px #000000; letter-spacing: 1px;">
                    > ${displayName}
                </td>
                <td style="padding: 8px 4px; text-align: right; color: #ffff00; font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold; text-shadow: 2px 2px #554400;">
                    ${currentVal.toFixed(1).replace('.0', '')}
                </td>
                <td style="padding: 8px 4px; text-align: center; color: ${buffColor}; font-family: 'Courier New', monospace; font-size: 12px; font-weight: bold; text-shadow: 1px 1px #000;">
                    ${buffDisplay}
                </td>
            </tr>
        `;
    }).join('');
}

// --- INITIALIZATION ---
async function init() {
    await loadTraitBonuses(); // Carica prima i bonus
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
        gameState.currentScreen = 'setup'; // Cambiamo lo stato per fermare il loop precedente
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
        Renderer.drawStartScreen(ctx, bgIntro, introImage, Wiz1, bookImg);
        requestAnimationFrame(startScreenLoop);
    }
}

function startGame() {
    setupScreen.style.display = 'none';
    gameState.currentScreen = 'playing';

     // --- 2. POSIZIONAMENTO INIZIALE (CAMERA E PLAYER) ---
    // Posizioniamo il mago in basso sul canvas (es. all'80% dell'altezza)
    gameState.playerX = CONFIG.CANVAS_WIDTH / 2;
    gameState.playerY = CONFIG.CANVAS_HEIGHT * 0.65;

    // Calcoliamo l'altezza totale del mondo (15 volte lo sfondo)
    // Usiamo bgParallax che è l'immagine caricata in main.js
    const totalWorldHeight = bgParallax.naturalHeight * 15;
    
    // Impostiamo la camera per partire esattamente dal fondo
    // Il limite massimo di scorrimento verso l'alto è -(AltezzaTotale - AltezzaSchermo)
    gameState.cameraY = -(totalWorldHeight - CONFIG.CANVAS_HEIGHT);
   
    // --- 3. GESTIONE TIMER E INTERVALLI ---
    gameState.gameTimer = CONFIG.GAME_TIME;
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        if (gameState.gameTimer > 0) {
            gameState.gameTimer--;
        } else {
            gameState.bossActive = true;
            // Se vuoi fermare il timer quando arriva il boss
            clearInterval(gameState.timerInterval);
        }
    }, 1000);

    // Reset stati di gioco necessari per un nuovo inizio
    gameState.bossActive = false;
    gameState.enemies = [];

    gameLoop();
}

// --- GAME LOOP ---
function gameLoop() {
    if (gameState.currentScreen !== 'playing') return;
    const now = Date.now();
    
    // --- Logica Invulnerabilità e Screen Shake ---
    if (gameState.isInvulnerable && (now - gameState.lastDamageTime > CONFIG.INVULNERABILITY_TIME)) {
        gameState.isInvulnerable = false;
    }
    gameState.screenShake = gameState.screenShake > 0.1 ? gameState.screenShake * CONFIG.SHAKE_DECAY : 0;

    // --- Preparazione Canvas ---
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.save(); 
    if (gameState.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * gameState.screenShake, (Math.random() - 0.5) * gameState.screenShake);
    }
    
    // --- 2. Logica spawn Nemici / Boss ---
    if (!gameState.bossActive) {
        // UNICA CONDIZIONE DI ATTIVAZIONE: Arrivo in cima alla mappa
        if (gameState.cameraY >= 0) {
            gameState.bossActive = true;
            gameState.enemies = []; // Rimuove i nemici piccoli
            // Opzionale: fermiamo il timer se vuoi che il tempo si congeli durante il boss
            if (gameState.timerInterval) clearInterval(gameState.timerInterval);
        } else {
            // Spawn nemici normale finché non si arriva in cima
            if (now - (gameState.lastEnemySpawn || 0) > 2000) {
                Enemies.spawnEnemies(3);
                gameState.lastEnemySpawn = now;
            }
        }
    }
    Renderer.updatePlayerMovement(bgParallax);
    updateAndDrawBackgrounds();
    

    // --- 3. Update Entità ---
    Renderer.autoFire();
    Renderer.updateBullets();
    Enemies.updateEnemies();
    Enemies.updateEnemyBullets();
    collision.updateExplosions(); 
    SpecialAttacks.updateSpecialRay();
    SpecialAttacks.updateShield();
    
    // --- 4. Logica Boss ---
    if (gameState.bossActive) {
        if (!gameState.boss) {
            // Se il boss è attivo ma non ancora creato, lo spawnamo
            gameState.boss = Boss1.spawnBoss((gameState.bossDefeatedCount || 0) + 1);
        } else {
            Boss1.updateBoss(gameState.boss);
            Boss1.drawBossShadow(ctx, gameState.boss, shadowImg);
            
            if (gameState.boss.hp <= 0) {
                gameState.bossActive = false;
                gameState.boss = null;
                 gameState.flashActive = false,         // Per l'effetto lampo/schermo
                 gameState.flashStartTime = null,
                 gameState.flashDuration = null, // Il flickering dura 2 secondi
                ctx.restore(); 
                showPowerUpScreen();
                return; 
            }
        }
    }

    // --- 5. Collisioni ---
    collision.handleAllCollisions();

    // --- 6. Rendering Giocatore e Feedback ---
    if (!(gameState.isInvulnerable && Math.floor(now / 100) % 2 === 0)) {
        if (!gameState.isCharging && !gameState.isCharging2) {
            Renderer.drawPlayer(ctx, playerSprite);
        }
        Renderer.drawPlayerWiz(ctx);
    }
    
    Renderer.drawTouchPad(ctx); // Disegna il pad virtuale
    
    // --- 7. Rendering Elementi di Gioco ---
    Enemies.drawEnemies(ctx);
    Enemies.drawEnemyBullets(ctx);
    SpecialAttacks.drawSpecialRay(ctx);
    SpecialAttacks.drawShield(ctx);
    
    if (gameState.isCharging || gameState.isCharging2) {
        SpecialAttacks.drawChargeEffect(ctx, chargeImg);
    }
    
    Renderer.drawBullets(ctx);
    collision.drawExplosions(ctx);
    SpecialAttacks.updateShield();
    if (gameState.shieldActive) SpecialAttacks.drawShield(ctx);

    ctx.restore(); 

    // --- 8. UI ---
    Renderer.drawUI(ctx);
    Renderer.drawHealthBar(ctx, gameState.HP, 100, CONFIG.CANVAS_WIDTH);

    requestAnimationFrame(gameLoop);
}

function updateAndDrawBackgrounds() {
    // 1. Sfondo base nero fisso
   //ctx.drawImage(bgImage, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    const drawX = (CONFIG.CANVAS_WIDTH / 2) - (bgParallax.naturalWidth / 2);
    const imgHeight = bgParallax.naturalHeight;

    // 2. Disegno ciclico del parallasse
    for (let i = 0; i < 15; i++) {
        const currentSegmentY = gameState.cameraY + (i * imgHeight);
        if (currentSegmentY + imgHeight > 0 && currentSegmentY < CONFIG.CANVAS_HEIGHT) {
            ctx.drawImage(
                bgParallax, 
                drawX, 
                currentSegmentY, 
                bgParallax.naturalWidth, 
                imgHeight
            );
        }
    }
// --- LOGICA TRANSIZIONE FASE 2 ---
    if (gameState.flashActive) {
        const currentTime = Date.now();
        const elapsed = currentTime - gameState.flashStartTime;

        if (elapsed < gameState.flashDuration) {
            // FASE A: Il flickering dei fulmini
            const isLightning = Math.random() > 0.8;
            ctx.fillStyle = isLightning ? 'rgba(255, 255, 255, 0.8)' : 'black';
        } else {
            // FASE B: I fulmini sono finiti, resta solo il nero
            ctx.fillStyle = 'black';
        }

        // Copriamo tutto
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }
}
// --- INPUT LISTENERS ---

let secondFingerTimer = null
let secondFingerTapCount = 0;
gameState.isTouchActive = false;
gameState.touchIdentifier = null;

// 3. INPUT LISTENERS (Mobile & Key)

function updateCoords(touch, rect) {
    gameState.touchX = (touch.clientX - rect.left) * (CONFIG.CANVAS_WIDTH / rect.width);
    gameState.touchY = (touch.clientY - rect.top) * (CONFIG.CANVAS_HEIGHT / rect.height);
}

// Touch Start
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();

    // GESTIONE PRIMO DITO (Movimento/Puntatore)
    if (e.touches.length === 1) {
        gameState.touchIdentifier = e.touches[0].identifier;
        gameState.isTouchActive = true;
        updateCoords(e.touches[0], rect);
    }

    // GESTIONE SECONDO DITO (Azioni Speciali)
    // Entriamo qui ogni volta che viene rilevato un tocco aggiuntivo (2, 3, ecc.)
    if (e.touches.length >= 2 && gameState.currentScreen === 'playing') {
        
        secondFingerTapCount++;

        // Se è il primo tocco del secondo dito, facciamo partire il timer
        if (secondFingerTapCount === 1) {
            secondFingerTimer = setTimeout(() => {
                
                if (secondFingerTapCount === 1) {
                    // È rimasto un tocco singolo -> ATTIVA SCUDO
                    SpecialAttacks.activateShield();
                } else if (secondFingerTapCount >= 2) {
                    // Sono avvenuti due o più tocchi -> ATTACCO SPECIALE
                    SpecialAttacks.fireSpecialAttackSequence();
                }

                // Reset per la prossima sequenza
                secondFingerTapCount = 0;
                secondFingerTimer = null;
                
            }, CONFIG.TOUCH.DOUBLE_TAP_DELAY || 300);
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
        //SpecialAttacks.fireSpecialAttackSequence2();
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
