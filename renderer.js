import { CONFIG, gameState } from './config.js';

// START SCREEN
export function drawStartScreen(ctx, introImage) {
    if (introImage.complete) {
        ctx.drawImage(introImage, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    } else {
        ctx.fillStyle = '#000033';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }
}

// PLAYERS

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


// BULLETS
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

// ENEMIES

export function spawnEnemies() {
    const now = Date.now();
    const spawnRate = 1000; 

    if (now - gameState.lastEnemySpawn > spawnRate) {
        const size = 30 + Math.random() * 20; 
        gameState.enemies.push({
            id: Date.now(),
            // USA CONFIG.CANVAS_WIDTH QUI
            x: Math.random() * (CONFIG.CANVAS_WIDTH - size), 
            y: -size, 
            width: size,
            height: size,
            speed: 2 + Math.random() * 2, 
            hp: Math.ceil(size / 10), 
            color: `hsl(${Math.random() * 360}, 70%, 50%)` 
        });
        gameState.lastEnemySpawn = now;
    }
}

export function updateEnemies() {
    gameState.enemies = gameState.enemies.filter(enemy => {
        enemy.y += enemy.speed;

        // USA CONFIG.CANVAS_HEIGHT QUI
        if (enemy.y > CONFIG.CANVAS_HEIGHT) {
            return false;
        }

        if (enemy.hp <= 0) {
            gameState.score += 10; 
            return false;
        }

        return true;
    });
}

export function drawEnemies(ctx) {
    gameState.enemies.forEach(enemy => {
        ctx.save();
        
        // Corpo del nemico (Stile Pixel Art semplice)
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Dettaglio "pixel" interno per dare profondità
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 10);

        // Barra della vita sopra il nemico (opzionale)
        const healthBarWidth = (enemy.hp / Math.ceil(enemy.width / 10)) * enemy.width;
        ctx.fillStyle = 'red';
        ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(enemy.x, enemy.y - 10, healthBarWidth, 4);

        ctx.restore();
    });
}

export function createExplosion(x, y, color = '#FFC300') { // Giallo/Arancione come default
    gameState.explosions.push({
        x: x,
        y: y,
        radius: 5,         // Raggio iniziale
        maxRadius: 30,     // Raggio massimo
        alpha: 1,          // Opacità iniziale
        speed: 0.8,        // Velocità di espansione
        fadeSpeed: 0.05,   // Velocità di dissolvenza
        color: color
    });
}

export function updateExplosions() {
    gameState.explosions = gameState.explosions.filter(explosion => {
        explosion.radius += explosion.speed;
        explosion.alpha -= explosion.fadeSpeed;
        return explosion.alpha > 0 && explosion.radius < explosion.maxRadius;
    });
}

export function drawExplosions(ctx) {
    gameState.explosions.forEach(explosion => {
        ctx.save();
        ctx.globalAlpha = explosion.alpha;
        ctx.fillStyle = explosion.color;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
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
