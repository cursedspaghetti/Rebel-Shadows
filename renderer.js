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
                size: 14,      // Diametro della sfera
                rotation: 0,   // Angolo iniziale
                isSpecial: false
            });
        }
        gameState.lastShotTime = now;
    }
}

export function updateBullets() {
    gameState.bullets = gameState.bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        // Facciamo ruotare la sfera; più è veloce il valore, più il vortice è rapido
        bullet.rotation += 0.25; 
        return bullet.y > -50; // Rimuove il proiettile quando esce dallo schermo
    });
}

export function drawBullets(ctx) {
    gameState.bullets.forEach(bullet => {
        ctx.save();
        ctx.translate(bullet.x, bullet.y);
        
        const pSize = 2; // Dimensione del "pixel" (più piccolo = più dettaglio)
        const radius = bullet.size / 2;
        const glowSize = 4; // Spessore del bordo luminoso in pixel

        // 1. DISEGNO DEL GLOW (Bordo luminoso pixelato)
        ctx.fillStyle = 'rgba(100, 200, 255, 0.3)'; // Colore del bagliore (celeste/ombra)
        for (let y = -radius - glowSize; y < radius + glowSize; y += pSize) {
            for (let x = -radius - glowSize; x < radius + glowSize; x += pSize) {
                if (x * x + y * y <= (radius + glowSize) * (radius + glowSize)) {
                    ctx.fillRect(x, y, pSize, pSize);
                }
            }
        }

        // 2. DISEGNO DELLA SFERA RUOTANTE
        ctx.rotate(bullet.rotation);
        for (let y = -radius; y < radius; y += pSize) {
            for (let x = -radius; x < radius; x += pSize) {
                if (x * x + y * y <= radius * radius) {
                    
                    // Logica dei colori per l'effetto "Vortice d'Ombra"
                    let color = '#111111'; // Nero profondo di base
                    
                    // Creiamo delle striature che si muovono con la rotazione
                    const pattern = Math.sin((x + bullet.rotation * 5) * 0.5);
                    
                    if (pattern > 0.4) color = '#222222'; // Grigio scuro
                    if (pattern > 0.8) color = '#444444'; // Grigio medio (riflesso)
                    
                    // Nucleo centrale fisso
                    if (x * x + y * y < (radius/4) * (radius/4)) color = '#000000';

                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, pSize, pSize);
                }
            }
        }

        ctx.restore();
    });
}

// ENEMIES

export function spawnEnemies() {
    const now = Date.now();
    // Intervallo di spawn (es. ogni 1000ms), può diminuire per aumentare la difficoltà
    const spawnRate = 1000; 

    if (now - gameState.lastEnemySpawn > spawnRate) {
        const size = 30 + Math.random() * 20; // Dimensioni variabili
        gameState.enemies.push({
            id: Date.now(),
            x: Math.random() * (canvas.width - size), // Posizione X casuale
            y: -size, // Parte appena fuori dallo schermo in alto
            width: size,
            height: size,
            speed: 2 + Math.random() * 2, // Velocità casuale
            hp: Math.ceil(size / 10), // Più sono grandi, più vita hanno
            color: `hsl(${Math.random() * 360}, 70%, 50%)` // Colore casuale
        });
        gameState.lastEnemySpawn = now;
    }
}

export function updateEnemies() {
    gameState.enemies = gameState.enemies.filter(enemy => {
        // Movimento verso il basso
        enemy.y += enemy.speed;

        // Rimuovi se esce dal fondo dello schermo
        if (enemy.y > canvas.height) {
            // Qui potresti togliere una vita al giocatore
            return false;
        }

        // Rimuovi se morto (gestito solitamente dalla logica delle collisioni)
        if (enemy.hp <= 0) {
            gameState.score += 10; // Aggiungi punti
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
