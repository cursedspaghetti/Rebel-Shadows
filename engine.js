import { CONFIG, gameState } from './config.js';

/**
 * ENGINE MODULE
 * Handles physics, movement, and game logic updates.
 */

// --- MOVEMENT & INPUT ---

export function updatePlayer() {
    // 1. Touch Movement (Mobile)
    if (gameState.touchIdentifier !== null) {
        if (gameState.touchX !== null && gameState.touchY !== null) {
            // Direct follow logic
            gameState.playerX = Math.max(10, Math.min(CONFIG.CANVAS_WIDTH - 10, gameState.touchX));
            gameState.playerY = Math.max(CONFIG.CANVAS_HEIGHT / 2, Math.min(CONFIG.CANVAS_HEIGHT - 10, gameState.touchY));
        }
    } 
    // 2. Keyboard Movement (Desktop Fallback)
    else {
        if (gameState.keys['ArrowLeft'] && gameState.playerX > 10) {
            gameState.playerX -= gameState.playerSpeed;
        }
        if (gameState.keys['ArrowRight'] && gameState.playerX < CONFIG.CANVAS_WIDTH - 10) {
            gameState.playerX += gameState.playerSpeed;
        }
        if (gameState.keys['ArrowUp'] && gameState.playerY > CONFIG.CANVAS_HEIGHT / 2) {
            gameState.playerY -= gameState.playerSpeed;
        }
        if (gameState.keys['ArrowDown'] && gameState.playerY < CONFIG.CANVAS_HEIGHT - 10) {
            gameState.playerY += gameState.playerSpeed;
        }
    }

    // 3. Update Player Trail Logic
    if (!gameState.playerTrail) gameState.playerTrail = [];
    gameState.playerTrail.push({ x: gameState.playerX, y: gameState.playerY });
    if (gameState.playerTrail.length > 25) gameState.playerTrail.shift();
}

// --- COMBAT LOGIC ---

export function autoFire() {
    if (gameState.currentScreen !== 'playing' || gameState.isCharging) return;

    const now = Date.now();
    const currentFireRate = CONFIG.FIRE_RATE_LEVELS[gameState.fireRateLevel] || 200;

    if (now - gameState.lastShotTime >= currentFireRate) {
        const missileCount = gameState.bulletLevel === 1 ? 1 : (gameState.bulletLevel === 2 ? 3 : 5);
        const spacing = 18;
        const verticalStagger = 12;
        const totalWidth = (missileCount - 1) * spacing;
        let startX = gameState.playerX - (totalWidth / 2);
        const centerIndex = Math.floor(missileCount / 2);

        for (let i = 0; i < missileCount; i++) {
            const distFromCenter = Math.abs(i - centerIndex);
            gameState.bullets.push({
                x: startX + i * spacing,
                y: (gameState.playerY - 20) + (distFromCenter * verticalStagger),
                speed: 10,
                size: 12,
                color: gameState.selectedRingColor,
                isSpecial: false
            });
        }
        gameState.lastShotTime = now;
    }
}

export function updateBullets() {
    gameState.bullets = gameState.bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > 0;
    });
}

export function updateSpecialRay() {
    if (!gameState.specialRay.active) return;

    const ray = gameState.specialRay;
    const now = Date.now() / 1000;
    const elapsed = now - ray.startTime;

    if (elapsed < ray.duration) {
        const lifeLeft = 1 - (elapsed / ray.duration);
        ray.currentWidth = ray.maxWidth * lifeLeft;
        ray.x = gameState.playerX; 
    } else {
        ray.active = false;
    }
}

// --- WORLD LOGIC ---

export function spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
        gameState.enemies.push({
            x: Math.random() * (CONFIG.CANVAS_WIDTH - 20) + 10,
            y: 50 + Math.random() * 100,
            size: 20,
            color: '#a00'
        });
    }
}

export function updateRings() {
    gameState.rings.forEach(ring => {
        ring.y -= ring.speed;
        if (ring.y < 0) {
            ring.y = CONFIG.CANVAS_HEIGHT;
            ring.x = Math.random() * CONFIG.CANVAS_WIDTH;
            ring.trail = [];
        }
    });
}
