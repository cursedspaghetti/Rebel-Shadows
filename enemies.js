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
        
        // Calcoliamo la Y del "mondo": 
        // Deve essere sopra il bordo superiore visualizzato (che è -cameraY)
        const spawnYWorld = (-gameState.cameraY) - 100 - (Math.random() * 300);

        gameState.enemies.push({
            x: Math.random() * (CONFIG.CANVAS_WIDTH - 60) + 30, 
            y: spawnYWorld, // Posizione assoluta nel mondo
            size: size,
            speed: 2 + Math.random() * 2,
            hp: 100,
            lastShot: Date.now(),
            shootDelay: 1500 + Math.random() * 2000,
            frame: 0,
            frameSpeed: 0.15 
        });
    }
}

export function updateEnemies() {
    gameState.enemies = gameState.enemies.filter(enemy => {
        enemy.y += enemy.speed; // Il nemico scende nel mondo
        enemy.frame += enemy.frameSpeed;

        const now = Date.now();
        if (now - enemy.lastShot > enemy.shootDelay) {
            spawnEnemySpread(enemy); 
            enemy.lastShot = now;
        }
        
        // Rimuovi se il nemico è "scivolato" troppo sotto il bordo inferiore visualizzato
        // Il bordo inferiore è (-gameState.cameraY + CANVAS_HEIGHT)
        const bottomEdge = (-gameState.cameraY) + CONFIG.CANVAS_HEIGHT + 200;
        return enemy.y < bottomEdge;
    });
}

export function drawEnemies(ctx) {
    gameState.enemies.forEach(enemy => {
        // Calcoliamo la posizione a schermo
        const screenY = enemy.y + (gameState.cameraY || 0);
        const screenX = enemy.x;

        // Disegna solo se visibile
        if (screenY + enemy.size > 0 && screenY < CONFIG.CANVAS_HEIGHT + 100) {
            ctx.save();
            const currentFrame = Math.floor(enemy.frame) % FRAME_COUNT;
            const sourceX = currentFrame * 160; 

            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(138, 43, 226, 0.5)';

            ctx.drawImage(
                batSprite, 
                sourceX, 0, 160, 160,
                Math.floor(screenX - enemy.size / 2), 
                Math.floor(screenY - enemy.size / 2), 
                enemy.size, 
                enemy.size
            );
            ctx.restore();
        }
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
    const speed = 5; 
    const angles = [-0.4, 0, 0.4]; 

    angles.forEach(angle => {
        gameState.enemyBullets.push({
            x: enemy.x,
            y: enemy.y, // Questa deve essere la Y del mondo del nemico
            size: 14,
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
        // 1. Applica movimento
        eb.x += eb.vx;
        eb.y += eb.vy;

        // 2. Calcola la posizione relativa allo schermo per decidere se eliminarlo
        const screenY = eb.y + (gameState.cameraY || 0);
        
        // Rimuovi se il proiettile è troppo lontano dallo schermo (sopra o sotto)
        // Usiamo un margine di 200px per sicurezza
        const isOut = screenY > CONFIG.CANVAS_HEIGHT + 200 || 
                      screenY < -200 || 
                      eb.x < -100 || 
                      eb.x > CONFIG.CANVAS_WIDTH + 100;
        
        return !isOut;
    });
}

/**
 * Disegna i proiettili usando la cache ottimizzata
 */
export function drawEnemyBullets(ctx) {
    if (!gameState.enemyBullets) return;

    gameState.enemyBullets.forEach(eb => {
        // TRASFORMAZIONE: Da coordinata mondo a coordinata schermo
        const screenY = eb.y + (gameState.cameraY || 0);
        const screenX = eb.x;

        // Disegna solo se è nel rettangolo visibile
        if (screenY > -50 && screenY < CONFIG.CANVAS_HEIGHT + 50) {
            const sprite = getPixelEnemyBullet(eb.color, eb.size);
            ctx.drawImage(
                sprite, 
                Math.floor(screenX - eb.size / 2), 
                Math.floor(screenY - eb.size / 2)
            );
        }
    });
}
