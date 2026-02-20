import { CONFIG, gameState } from './config.js';

// --- NEMICI ---

const batSprite = new Image();
batSprite.src = 'https://raw.githubusercontent.com/cursedspaghetti73/Forgotten-Wiz/main/bat_sprite.png';

// Definiamo le costanti per il ritaglio dello sprite
const SPRITE_W = 160; // Larghezza di un singolo frame
const SPRITE_H = 160; // Altezza (lo sprite è verticale o orizzontale? Dalle dimensioni 40x160 sembra verticale, ma se sono 4 immagini orizzontali dovrebbe essere 160x40. Assumiamo 40x40 per frame)
const FRAME_COUNT = 4;

export function spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
        const size = 60 + Math.random() * 20; 
        gameState.enemies.push({
            x: Math.random() * (CONFIG.CANVAS_WIDTH - 60) + 30, 
            y: -100 - (Math.random() * 300), 
            size: size,
            speed: 2 + Math.random() * 2,
            hp: 100,
            lastShot: Date.now(),
            shootDelay: 1500 + Math.random() * 2000,
            // Proprietà per l'animazione
            frame: 0,
            frameTimer: 0,
            frameSpeed: 0.15 // Velocità del battito d'ali
        });
    }
}

export function updateEnemies() {
    gameState.enemies = gameState.enemies.filter(enemy => {
        enemy.y += enemy.speed;
        
        // Aggiorna l'animazione
        enemy.frame += enemy.frameSpeed;

        const now = Date.now();
        if (now - enemy.lastShot > enemy.shootDelay) {
            // --- MODIFICA QUI: Chiamiamo la funzione a raggera ---
            spawnEnemySpread(enemy); 
            // ----------------------------------------------------
            enemy.lastShot = now;
        }
        
        // Mantieni il nemico se è entro i limiti del canvas
        return enemy.y < CONFIG.CANVAS_HEIGHT + 150;
    });
}

export function drawEnemies(ctx) {
    gameState.enemies.forEach(enemy => {
        ctx.save();
        
        // Calcolo del frame
        const currentFrame = Math.floor(enemy.frame) % FRAME_COUNT;
        const sourceX = currentFrame * 160; 

        // Opzionale: Bagliore viola
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(138, 43, 226, 0.5)';

        // AGGIORNAMENTO: Calcoliamo la Y a schermo sommando la posizione del nemico 
        // alla posizione attuale della camera.
        const screenY = (enemy.y + (gameState.cameraY || 0)) - enemy.size / 2;
        const screenX = enemy.x - enemy.size / 2;

        // Ottimizzazione: Disegna il nemico solo se è visibile nel canvas
        if (screenY + enemy.size > 0 && screenY < CONFIG.CANVAS_HEIGHT) {
            ctx.drawImage(
                batSprite, 
                sourceX, 0, 160, 160,          // Taglio sorgente
                screenX,                       // Posizione X a schermo
                screenY,                       // Posizione Y a schermo (relativa alla camera)
                enemy.size,                    // Larghezza
                enemy.size                     // Altezza
            );
        }

        ctx.restore();
    });
}


// --- PROIETTILI NEMICI ---
// --- SISTEMA DI CACHING PIXEL ART ---
const enemyBulletCache = {};

/**
 * Crea e memorizza uno sprite in pixel art per i proiettili
 */
function getPixelEnemyBullet(color, size) {
    const key = `${color}-${size}`;
    if (enemyBulletCache[key]) return enemyBulletCache[key];

    const canvas = document.createElement('canvas');
    const pixelSize = size / 4; // Dimensione del "pixel" della pixel art
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const center = size / 2;
    const radiusSq = (size / 2) * (size / 2);

    for (let y = 0; y < size; y += pixelSize) {
        for (let x = 0; x < size; x += pixelSize) {
            const dx = x + pixelSize / 2 - center;
            const dy = y + pixelSize / 2 - center;
            const distSq = dx * dx + dy * dy;

            if (distSq <= radiusSq) {
                // Core bianco, bordo colorato
                ctx.fillStyle = distSq <= radiusSq * 0.2 ? '#ffffff' : color;
                
                ctx.fillRect(
                    Math.floor(x), 
                    Math.floor(y), 
                    Math.ceil(pixelSize), 
                    Math.ceil(pixelSize)
                );
            }
        }
    }

    enemyBulletCache[key] = canvas;
    return canvas;
}

// --- LOGICA DI GIOCO ---

/**
 * Fa sparare il nemico con una raggera di 3 proiettili
 */
 export function spawnEnemySpread(enemy) {
    if (!gameState.enemyBullets) gameState.enemyBullets = [];

    const bulletCount = 3;
    const speed = 5; // Un po' più veloce per i nemici
    const angles = [-0.4, 0, 0.4]; 

    angles.forEach(angle => {
        gameState.enemyBullets.push({
            x: enemy.x, // Già centrato
            y: enemy.y + (enemy.size / 4), // Parte leggermente sotto il centro del corpo
            size: 14, // Dimensione pixel art
            color: '#ff00ff',
            vx: Math.sin(angle) * speed,
            vy: Math.cos(angle) * speed
        });
    });
}

/**
 * Aggiorna la posizione dei proiettili nemici
 */
export function updateEnemyBullets() {
    if (!gameState.enemyBullets) return;

    gameState.enemyBullets = gameState.enemyBullets.filter(eb => {
        // Applica movimento vettoriale
        eb.x += eb.vx;
        eb.y += eb.vy;

        // Rimuove se esce dai bordi (con margine di 50px)
        const isOut = eb.y > CONFIG.CANVAS_HEIGHT + 50 || 
                      eb.x < -50 || 
                      eb.x > CONFIG.CANVAS_WIDTH + 50;
        
        return !isOut;
    });
}

/**
 * Disegna i proiettili usando la cache ottimizzata
 */
export function drawEnemyBullets(ctx) {
    if (!gameState.enemyBullets) return;

    gameState.enemyBullets.forEach(eb => {
        const sprite = getPixelEnemyBullet(eb.color, eb.size);
        // Disegno centrato sulla coordinata x, y
        ctx.drawImage(
            sprite, 
            Math.floor(eb.x - eb.size / 2), 
            Math.floor(eb.y - eb.size / 2)
        );
    });
}
