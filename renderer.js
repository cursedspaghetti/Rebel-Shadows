import { CONFIG, gameState } from './config.js';

// --- SCHERMATA INIZIALE ---
export function drawStartScreen(ctx, bgParallax, introImage) {
    if (bgParallax.complete && bgParallax.naturalWidth !== 0) {
        ctx.drawImage(bgParallax, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    } else {
        ctx.fillStyle = '#000033'; 
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }

    if (introImage.complete && introImage.naturalWidth !== 0) {
        const originalWidth = introImage.naturalWidth;
        const originalHeight = introImage.naturalHeight;
        const aspectRatio = originalHeight / originalWidth;
        const imgWidth = CONFIG.CANVAS_WIDTH * 0.2; 
        const imgHeight = imgWidth * aspectRatio;
        const xPos = (CONFIG.CANVAS_WIDTH - imgWidth) / 2;
        const yPos = CONFIG.CANVAS_HEIGHT - imgHeight - 50; 

        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.drawImage(introImage, xPos, yPos, imgWidth, imgHeight);
    }
}

// --- GIOCATORE ---
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

// --- UI E BARRA VITA ---
export function drawHealthBar(ctx, currentHp, maxHp, canvasWidth) {
    const barWidth = 12;
    const barHeight = 150;
    const padding = 20;
    const x = canvasWidth - barWidth - padding;
    const y = 50; 

    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, barWidth, barHeight);

    const healthPercentage = Math.max(0, currentHp / maxHp);
    const currentHealthHeight = barHeight * healthPercentage;

    let healthColor = '#49eb34';
    if (healthPercentage < 0.25) healthColor = '#eb3434';
    else if (healthPercentage < 0.5) healthColor = '#ebca34';

    const healthY = y + (barHeight - currentHealthHeight);
    ctx.fillStyle = healthColor;
    ctx.fillRect(x, healthY, barWidth, currentHealthHeight);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x, healthY, 3, currentHealthHeight);

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = '12px "Courier New"';
    ctx.fillText(`${Math.ceil(currentHp)}`, x + (barWidth / 2), y + barHeight + 20);
    ctx.font = 'bold 14px "Courier New"';
    ctx.fillText("HP", x + (barWidth / 2), y + barHeight + 38);
}

// --- PROIETTILI PLAYER ---
export function drawBullets(ctx) {
    gameState.bullets.forEach(bullet => {
        ctx.save();
        const coreColor = '#ffffff';
        const edgeColor = '#e0e0e0';
        const horizontalGap = 2; 
        const bulletWidth = 4;
        const bulletHeight = 12;

        const drawPixelBullet = (offsetX) => {
            const posX = bullet.x + offsetX - (bulletWidth / 2);
            const posY = bullet.y - (bulletHeight / 2);
            ctx.fillStyle = edgeColor;
            ctx.fillRect(posX, posY, bulletWidth, bulletHeight);
            ctx.fillStyle = coreColor;
            ctx.fillRect(posX + 1, posY + 1, bulletWidth - 2, bulletHeight - 4);
        };

        ctx.shadowBlur = 0; 
        drawPixelBullet(-horizontalGap / 2);
        drawPixelBullet(horizontalGap / 2);
        ctx.restore();
    });
}

export function autoFire() {
    if (gameState.currentScreen !== 'playing' || gameState.isCharging || gameState.isCharging2) return;

    const now = Date.now();
    const currentFireRate = CONFIG.FIRE_RATE_LEVELS[gameState.fireRateLevel] || 200;

    if (now - gameState.lastShotTime >= currentFireRate) {
        const missileCount = gameState.bulletLevel === 1 ? 1 : (gameState.bulletLevel === 2 ? 3 : 5);
        const spacing = 8;
        const verticalStagger = 6;
        const totalWidth = (missileCount - 1) * spacing;
        let startX = gameState.playerX - (totalWidth / 2);
        const centerIndex = Math.floor(missileCount / 2);

        for (let i = 0; i < missileCount; i++) {
            const distFromCenter = Math.abs(i - centerIndex);
            gameState.bullets.push({
                x: startX + i * spacing,
                y: (gameState.playerY - 20) + (distFromCenter * verticalStagger),
                speed: 12,
                size: 8
            });
        }
        gameState.lastShotTime = now;
    }
}

export function updateBullets() {
    // Rimuove proiettili che escono sopra lo schermo
    gameState.bullets = gameState.bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > -20;
    });
}

// --- NEMICI ---
export function drawEnemies(ctx) {
    gameState.enemies.forEach(enemy => {
        ctx.save();
        const ghostGlow = ctx.createRadialGradient(enemy.x, enemy.y, 0, enemy.x, enemy.y, enemy.size);
        ghostGlow.addColorStop(0, 'rgba(138, 43, 226, 0.6)');
        ghostGlow.addColorStop(0.5, 'rgba(75, 0, 130, 0.3)');
        ghostGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = ghostGlow;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();

        const voidCore = ctx.createRadialGradient(enemy.x, enemy.y, enemy.size * 0.1, enemy.x, enemy.y, enemy.size * 0.4);
        voidCore.addColorStop(0, '#000000');
        voidCore.addColorStop(0.7, '#1a0033');
        voidCore.addColorStop(1, '#00ffff');

        ctx.shadowBlur = 15;
        ctx.shadowColor = '#8a2be2';
        ctx.fillStyle = voidCore;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });
}

export function spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
        const size = 60 + Math.random() * 40; 
        gameState.enemies.push({
            x: Math.random() * (CONFIG.CANVAS_WIDTH - 60) + 30, 
            y: -100 - (Math.random() * 300), 
            size: size,
            speed: 2 + Math.random() * 2,
            hp: 100,
            lastShot: Date.now(),
            shootDelay: 1500 + Math.random() * 2000
        });
    }
}

export function updateEnemies() {
    // Rimuove nemici che escono dal fondo dello schermo
    gameState.enemies = gameState.enemies.filter(enemy => {
        enemy.y += enemy.speed;

        const now = Date.now();
        if (now - enemy.lastShot > enemy.shootDelay) {
            gameState.enemyBullets.push({
                x: enemy.x,
                y: enemy.y + enemy.size / 2,
                size: 8,
                speed: 5,
                color: '#ff00ff'
            });
            enemy.lastShot = now;
        }
        return enemy.y < CONFIG.CANVAS_HEIGHT + 100;
    });
}
// --- PROIETTILI NEMICI ---
export function drawEnemyBullets(ctx) {
    if (!gameState.enemyBullets) return;

    gameState.enemyBullets.forEach(eb => {
        ctx.save();
        
        // Effetto bagliore (Glow)
        ctx.shadowBlur = 10;
        ctx.shadowColor = eb.color || '#ff00ff';
        
        // Disegno del proiettile (Nucleo)
        ctx.fillStyle = '#ffffff'; // Centro bianco per farlo sembrare energetico
        ctx.beginPath();
        ctx.arc(eb.x, eb.y, eb.size / 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Anello esterno colorato
        ctx.strokeStyle = eb.color || '#ff00ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(eb.x, eb.y, eb.size / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    });
}
export function updateEnemyBullets() {
    if (!gameState.enemyBullets) return;
    // Rimuove proiettili nemici che escono dal fondo
    gameState.enemyBullets = gameState.enemyBullets.filter(eb => {
        eb.y += eb.speed;
        return eb.y < CONFIG.CANVAS_HEIGHT + 50;
    });
}

// --- ESPLOSIONI ---
export function createExplosion(x, y, color = '#FFC300') {
    gameState.explosions.push({
        x: x, y: y, radius: 5, maxRadius: 30,
        alpha: 1, speed: 0.8, fadeSpeed: 0.05, color: color
    });
}

export function updateExplosions() {
    gameState.explosions = gameState.explosions.filter(exp => {
        exp.radius += exp.speed;
        exp.alpha -= exp.fadeSpeed;
        return exp.alpha > 0;
    });
}

export function drawExplosions(ctx) {
    gameState.explosions.forEach(exp => {
        ctx.save();
        ctx.globalAlpha = exp.alpha;
        ctx.fillStyle = exp.color;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

//UI

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
