import { CONFIG, gameState } from './config.js';

let hoverCounter = 0;

export function drawStartScreen(ctx, bgParallax, introImage, wiz1, bookImg) {
    // 1. SFONDO
    if (bgParallax.complete && bgParallax.naturalWidth !== 0) {
        ctx.drawImage(bgParallax, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    } else {
        ctx.fillStyle = '#000033'; 
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }

    const margin = 10; 
    const sideImageSize = CONFIG.CANVAS_WIDTH * 0.5; 
    const bookSize = CONFIG.CANVAS_WIDTH * 0.2;    
    const isWizardSelected = (introImage.complete && introImage.naturalWidth !== 0);
    const fadeSpeed = 0.02; // Velocità del fade (circa 1 secondo a 60fps)

    // --- LOGICA FADE SEQUENZIALE ---
    if (!isWizardSelected) {
        // Fase iniziale: Primo fumetto appare, secondo sparisce/resta a 0
        if (gameState.bubbleAlpha1 < 1) gameState.bubbleAlpha1 += fadeSpeed;
        gameState.bubbleAlpha2 = 0;
    } else {
        // Fase selezione: Primo fumetto sparisce
        if (gameState.bubbleAlpha1 > 0) {
            gameState.bubbleAlpha1 -= fadeSpeed;
        } 
        // Il secondo inizia il fade in solo quando il primo è quasi sparito
        else if (gameState.bubbleAlpha2 < 1) {
            gameState.bubbleAlpha2 += fadeSpeed;
        }
    }

    // Aggiornamento animazione libro
    hoverCounter = (hoverCounter + 0.04) % (Math.PI * 2);

    // 2. WIZ1 (BASSO A SINISTRA)
    if (wiz1.complete) {
        const wizX = margin;
        const wizY = CONFIG.CANVAS_HEIGHT - sideImageSize - margin;
        ctx.drawImage(wiz1, wizX, wizY, sideImageSize, sideImageSize);

        if (gameState.bubbleAlpha1 > 0) {
            const speechText = "Rebel Shadows slipped through the cracks of reality...\n\nHurry up, I need a wizard who can handle the Book of Shadows!";
            // Posizionato più in alto e a sinistra rispetto a prima
            drawPixelBubble(ctx, wizX + sideImageSize * 0.3, wizY - 40, speechText, gameState.bubbleAlpha1, "left");
        }
    }

    // 3. BOOK1 (BASSO AL CENTRO)
    if (bookImg.complete) {
        const hoverOffset = Math.sin(hoverCounter) * 15;
        ctx.drawImage(
            bookImg, 
            (CONFIG.CANVAS_WIDTH - bookSize) / 2, 
            CONFIG.CANVAS_HEIGHT - bookSize - margin - 150 + hoverOffset, 
            bookSize, 
            bookSize
        );
    }

    // 4. WIZARD ID NFT (BASSO A DESTRA)
    if (isWizardSelected) {
        const nftX = CONFIG.CANVAS_WIDTH - sideImageSize - margin;
        const nftY = CONFIG.CANVAS_HEIGHT - sideImageSize - margin;

        ctx.drawImage(introImage, nftX, nftY, sideImageSize, sideImageSize);

        if (gameState.bubbleAlpha2 > 0) {
            const nftSpeech = "A wizard is never late, nor is he early, he arrives precisely when he means to.";
            // Posizionato per puntare al wizard di DESTRA (spostato a sinistra del wizard)
            drawPixelBubble(ctx, nftX - 160, nftY - 20, nftSpeech, gameState.bubbleAlpha2, "right");
        }
    }
}
/**
 * Funzione di supporto per disegnare una vignetta stile Pixel Art
 */
/**
 * Funzione di supporto per disegnare una vignetta stile Pixel Art Smussata
 */
function drawPixelBubble(ctx, x, y, text, alpha = 1, tailSide = "left") {
    const maxWidth = 250;
    const lineHeight = 18;
    ctx.save();
    ctx.globalAlpha = alpha; // Applica il fade
    
    ctx.font = "14px 'Press Start 2P', monospace";
    
    const manualLines = text.split('\n');
    let lines = [];
    manualLines.forEach(line => {
        if (line.trim() === "") { lines.push(""); return; }
        const words = line.split(' ');
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            let testLine = currentLine + " " + words[i];
            if (ctx.measureText(testLine).width > maxWidth) {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
    });

    const bubbleHeight = lines.length * lineHeight + 20;
    const bubbleWidth = maxWidth + 20;
    const finalY = y - bubbleHeight - 10;

    // Colori con alpha dinamico
    ctx.strokeStyle = `rgba(211, 211, 211, ${alpha})`;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * alpha})`;
    ctx.lineWidth = 3;

    // Box smussato
    const radius = 10;
    ctx.beginPath();
    ctx.roundRect(x, finalY, bubbleWidth, bubbleHeight, radius); // Metodo moderno più pulito
    ctx.fill();
    ctx.stroke();

    // Testo
    ctx.fillStyle = `rgba(211, 211, 211, ${alpha})`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    lines.forEach((line, index) => {
        if (line !== "") ctx.fillText(line, x + 10, finalY + 10 + (index * lineHeight));
    });

    // Punta Dinamica
    ctx.beginPath();
    if (tailSide === "left") {
        ctx.moveTo(x + 20, finalY + bubbleHeight);
        ctx.lineTo(x + 10, finalY + bubbleHeight + 15);
        ctx.lineTo(x + 35, finalY + bubbleHeight);
    } else {
        // Punta che guarda a destra verso l'NFT
        ctx.moveTo(x + bubbleWidth - 40, finalY + bubbleHeight);
        ctx.lineTo(x + bubbleWidth - 10, finalY + bubbleHeight + 15);
        ctx.lineTo(x + bubbleWidth - 20, finalY + bubbleHeight);
    }
    ctx.stroke();
    ctx.restore();
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
