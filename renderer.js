import { CONFIG, gameState } from './config.js';

/**
 * UNIFIED RENDER & ENGINE MODULE
 * Gestisce sia la logica di gioco (movimento, collisioni) che il rendering (disegno).
 */

// ==========================================
// --- SEZIONE ENGINE (Logica di Gioco) ---
// ==========================================

export function autoFire() {
    if (gameState.currentScreen !== 'playing' || gameState.isCharging || gameState.isCharging2) return;

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
    if (!gameState.specialRay2.active2) return;

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

export function spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
        gameState.enemies.push({
            x: Math.random() * (CONFIG.CANVAS_WIDTH - 20) + 10, 
            y: -(Math.random() * 100 + 20), 
            size: 20,
            speed: 2 + Math.random() * 2,
            color: '#a00'
        });
    }
}

// ==========================================
// --- SEZIONE RENDER (Grafica e UI) ---
// ==========================================

export function drawStartScreen(ctx, introImage) {
    if (introImage.complete) {
        ctx.drawImage(introImage, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    } else {
        ctx.fillStyle = '#000033';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }
}

export function drawPlayer(ctx, img) {
    if (!img.complete) return; 

    const frameWidth = 512;  
    const frameHeight = 349; 
    
    const scaleX = 0.09;      
    const scaleY = 0.13;        
    
    const totalFrames = 13; 
    const animationSpeed = 150;
    const frameIndex = Math.floor(Date.now() / animationSpeed) % totalFrames;

    ctx.save();
    ctx.translate(gameState.playerX, gameState.playerY);

    ctx.drawImage(
        img,
        frameIndex * frameWidth, 0, 
        frameWidth, frameHeight,    
        - (frameWidth * scaleX) / 2, 
        - (frameHeight * scaleY) / 2, 
        frameWidth * scaleX,         
        frameHeight * scaleY         
    );

    ctx.restore();
}

export function drawBullets(ctx) {
    gameState.bullets.forEach(bullet => {
        ctx.save();
        
        const filamentWidth = bullet.size * 0.2;
        const height = bullet.size * 8;         
        const horizontalGap = 3;                

        const drawFilament = (offsetX) => {
            const posX = bullet.x + offsetX;
            let gradient = ctx.createLinearGradient(
                posX, bullet.y - height / 2, 
                posX, bullet.y + height / 2
            );
            
            gradient.addColorStop(0, '#ffffff');      
            gradient.addColorStop(0.2, '#e0e0e0');    
            gradient.addColorStop(0.7, 'rgba(100, 100, 100, 0.3)'); 
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(posX, bullet.y, filamentWidth / 2, height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        };

        ctx.shadowBlur = 3;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';

        drawFilament(-horizontalGap / 2); 
        drawFilament(horizontalGap / 2);  

        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.arc(bullet.x, bullet.y - height / 2.2, filamentWidth, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });
}

export function drawUI(ctx) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`TIME: ${gameState.gameTimer}`, 10, 30);
    ctx.restore();

    const now = Date.now() / 1000;
    
    const elapsed1 = now - (gameState.specialLastUsed || 0);
    const perc1 = Math.min(1, elapsed1 / gameState.specialCooldown);

    const elapsed2 = now - (gameState.specialLastUsed2 || 0);
    const perc2 = Math.min(1, elapsed2 / (gameState.specialCooldown2 || 1));

    const barWidth = 40;
    const barHeight = 4;
    const x = gameState.playerX - barWidth / 2;
    const y = gameState.playerY + 28;

    ctx.save();

    // Barra 1 (Viola)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, barWidth, barHeight);

    if (perc1 < 1) {
        const grad1 = ctx.createLinearGradient(x, y, x + barWidth, y);
        grad1.addColorStop(0, '#4b0082');
        grad1.addColorStop(1, '#8a2be2');
        ctx.fillStyle = grad1;
        ctx.fillRect(x, y, barWidth * perc1, barHeight);
    } else {
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#bf00ff';
        ctx.fillStyle = '#bf00ff'; 
        ctx.fillRect(x, y, barWidth, barHeight);
    }

    // Barra 2 (Verdino/Turchese)
    const y2 = y + barHeight + 3;
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y2, barWidth, barHeight);

    if (perc2 < 1) {
        const grad2 = ctx.createLinearGradient(x, y2, x + barWidth, y2);
        grad2.addColorStop(0, '#008b8b');
        grad2.addColorStop(1, '#00ffcc');
        ctx.fillStyle = grad2;
        ctx.fillRect(x, y2, barWidth * perc2, barHeight);
    } else {
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#33ff33';
        ctx.fillStyle = '#33ff33'; 
        ctx.fillRect(x, y2, barWidth, barHeight);
    }

    ctx.restore();
}
