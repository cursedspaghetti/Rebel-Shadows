import { CONFIG, gameState } from './config.js';

/**
 * ENGINE MODULE
 * Handles physics, movement, and game logic updates.
 */

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

export function updateSpecialRay2() {
    if (!gameState.specialRay2.active) return;

    const ray = gameState.specialRay2;
    const now = Date.now() / 1000;
    const elapsed = now - ray.startTime2;

    if (elapsed < ray.duration2) {
        const lifeLeft = 1 - (elapsed / ray.duration2);
        ray.currentWidth2 = ray.maxWidth2 * lifeLeft;
        ray.x2 = gameState.playerX; 
    } else {
        ray.active2 = false;
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

/*
export function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
} 

*/
