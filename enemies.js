import { CONFIG, gameState } from './config.js';

// --- CONFIGURAZIONE SPRITE ---
const batSprite = new Image();
batSprite.src = 'https://raw.githubusercontent.com/cursedspaghetti/Rebel-Shadows/main/bat_sprite.png';

const SPRITE_W = 160; 
const SPRITE_H = 160; 
const FRAME_COUNT = 4;

// --- CACHE PROIETTILI ---
const enemyBulletCache = {};

/**
 * Crea e memorizza uno sprite in pixel art per i proiettili
 */
function getPixelEnemyBullet(color, size) {
    const key = `${color}-${size}`;
    if (enemyBulletCache[key]) return enemyBulletCache[key];

    const canvas = document.createElement('canvas');
    const pixelSize = size / 4; 
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
                ctx.fillStyle = distSq <= radiusSq * 0.2 ? '#ffffff' : color;
                ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(pixelSize), Math.ceil(pixelSize));
            }
        }
    }
    enemyBulletCache[key] = canvas;
    return canvas;
}

// --- LOGICA NEMICI ---

/**
 * Spawna i nemici appena sopra il bordo visibile
 */
export function spawnEnemies(count) {
    if (!gameState.enemies) gameState.enemies = [];
    
    for (let i = 0; i < count; i++) {
        const size = 60 + Math.random() * 20;
        const spawnYWorld = (-gameState.cameraY) - 50 - (Math.random() * 100);

        gameState.enemies.push({
            id: Date.now() + Math.random(),
            x: Math.random() * (CONFIG.CANVAS_WIDTH - 60) + 30,
            y: spawnYWorld,
            size: size,
            hp: 100,
            speed: 2 + Math.random() * 2,
            // --- NUOVE PROPRIETÀ ---
            entryTime: null,   // Verrà settato quando screenY > 0
            lastShot: 0,       // Inizializzato a 0
            shootInterval: 2000, 
            // -----------------------
            frame: 0,
            frameSpeed: 0.15
        });
    }
}

/**
 * Aggiorna posizione, animazione e logica di sparo
 */
export function updateEnemies() {
    if (!gameState.enemies) return;
    const now = Date.now();

    gameState.enemies = gameState.enemies.filter(enemy => {
        enemy.y += enemy.speed;
        enemy.frame += enemy.frameSpeed;

        const screenY = enemy.y + (gameState.cameraY || 0);

        // 1. Rileva l'ingresso in scena
        if (screenY > 0 && enemy.entryTime === null) {
            enemy.entryTime = now;
            // Impostiamo lastShot in modo che il primo colpo avvenga 
            // dopo (entryTime + 1000ms)
            enemy.lastShot = now + 1000 - enemy.shootInterval;
        }

        // 2. Logica Sparo: Solo se è passato 1 secondo dall'ingresso
        if (enemy.entryTime !== null && (now - enemy.entryTime > 1000)) {
            if (now - enemy.lastShot > enemy.shootInterval) {
                spawnEnemySpread(enemy);
                enemy.lastShot = now;
            }
        }

        const isDead = enemy.hp <= 0;
        const isPastBottom = screenY > CONFIG.CANVAS_HEIGHT + 200;
        return !isDead && !isPastBottom;
    });
}

/**
 * Disegna i nemici con animazione sprite
 */
export function drawEnemies(ctx) {
    if (!gameState.enemies) return;

    gameState.enemies.forEach(enemy => {
        const screenY = enemy.y + (gameState.cameraY || 0);
        const screenX = enemy.x;

        // Culling: Disegna solo se visibile
        if (screenY + enemy.size > -50 && screenY < CONFIG.CANVAS_HEIGHT + 50) {
            ctx.save();
            
            // Calcolo frame animazione
            const currentFrame = Math.floor(enemy.frame) % FRAME_COUNT;
            const sourceX = currentFrame * SPRITE_W; 

            // Effetto bagliore
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(138, 43, 226, 0.5)';

            ctx.drawImage(
                batSprite, 
                sourceX, 0, SPRITE_W, SPRITE_H,
                Math.floor(screenX - enemy.size / 2), 
                Math.floor(screenY - enemy.size / 2), 
                enemy.size, 
                enemy.size
            );
            ctx.restore();
        }
    });
}

// --- LOGICA PROIETTILI ---

export function spawnEnemySpread(enemy) {
    if (!gameState.enemyBullets) gameState.enemyBullets = [];
    
    const speed = 7; // Velocità aumentata per reattività arcade
    const angles = [-0.4, 0, 0.4]; 

    angles.forEach(angle => {
        gameState.enemyBullets.push({
            x: enemy.x,
            y: enemy.y,
            size: 14,
            color: '#ff00ff',
            vx: Math.sin(angle) * speed,
            vy: Math.cos(angle) * speed
        });
    });
}

export function updateEnemyBullets() {
    if (!gameState.enemyBullets) return;

    gameState.enemyBullets = gameState.enemyBullets.filter(eb => {
        eb.x += eb.vx;
        eb.y += eb.vy;

        const screenY = eb.y + (gameState.cameraY || 0);
        
        // Pulizia proiettili fuori dai bordi (margine di sicurezza)
        return !(screenY > CONFIG.CANVAS_HEIGHT + 100 || 
                 screenY < -100 || 
                 eb.x < -100 || 
                 eb.x > CONFIG.CANVAS_WIDTH + 100);
    });
}

export function drawEnemyBullets(ctx) {
    if (!gameState.enemyBullets) return;

    gameState.enemyBullets.forEach(eb => {
        const screenY = eb.y + (gameState.cameraY || 0);
        const screenX = eb.x;

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
