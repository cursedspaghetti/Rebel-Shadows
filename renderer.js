import { CONFIG, gameState } from './config.js';

// Array per contenere le scintille attive
let sparkles = [];

function createSparkle(bookX, bookY, bookWidth) {
    return {
        // Partenza casuale lungo la larghezza del libro
        x: bookX + Math.random() * bookWidth,
        y: bookY + 20, // Parte leggermente sopra il bordo del libro
        size: Math.floor(Math.random() * 3) + 2, // Pixel art: 2-4px
        speedY: Math.random() * -2 - 1, // Sale verso l'alto
        speedX: (Math.random() - 0.5) * 1, // Leggera oscillazione laterale
        alpha: 1.0, // Opacità iniziale
        life: 1.0   // Vita (da 1.0 a 0 in circa 1 secondo)
    };
}

export function drawStartScreen(ctx, bgImage, introImage) {
    // 1. Pulizia e Sfondo (Tuo codice originale)
    if (bgImage.complete && bgImage.naturalWidth !== 0) {
        ctx.drawImage(bgImage, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    } else {
        ctx.fillStyle = '#000033'; 
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }

    // 2. Disegno dell'immagine Intro (Libro)
    let imgWidth, imgHeight, xPos, yPos;
    
    if (introImage.complete && introImage.naturalWidth !== 0) {
        const aspectRatio = introImage.height / introImage.width;
        imgWidth = CONFIG.CANVAS_WIDTH * 0.8; 
        imgHeight = imgWidth * aspectRatio;
        xPos = (CONFIG.CANVAS_WIDTH - imgWidth) / 2;
        yPos = CONFIG.CANVAS_HEIGHT - imgHeight - 20;

        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.drawImage(introImage, xPos, yPos, imgWidth, imgHeight);

        // --- LOGICA DELLE SCINTILLE ---
        
        // Aggiungiamo una nuova scintilla ogni frame (o ogni tot frame per non esagerare)
        if (Math.random() > 0.8) { 
            sparkles.push(createSparkle(xPos, yPos, imgWidth));
        }

        // Disegniamo e aggiorniamo ogni scintilla
        ctx.fillStyle = "#FFFFAA"; // Giallo magico pixelato
        
        for (let i = sparkles.length - 1; i >= 0; i--) {
            let s = sparkles[i];

            // Applichiamo l'opacità attuale
            ctx.globalAlpha = s.alpha;
            
            // Disegniamo il "pixel" (un piccolo rettangolo)
            ctx.fillRect(s.x, s.y, s.size, s.size);

            // Aggiorniamo posizione e vita
            s.y += s.speedY;
            s.x += s.speedX;
            s.alpha -= 0.015; // Diminuisce per sparire in circa 60 frame (1 sec a 60fps)

            // Rimuoviamo la scintilla se è invisibile
            if (s.alpha <= 0) {
                sparkles.splice(i, 1);
            }
        }
        
        // Reset finale dell'alpha per non influenzare altri disegni
        ctx.globalAlpha = 1.0;
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
// Barra Vita
export function drawHealthBar(ctx, currentHp, maxHp, canvasWidth) {
    const barWidth = 10;
    const barHeight = 150;
    const padding = 20;
    
    // Posizionamento a destra (verticale)
    const x = canvasWidth - barWidth - padding;
    const y = 50; 

    // 1. Sfondo della barra (Bordo stile Pixel Art)
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);

    // 2. Sfondo vuoto della barra
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, barWidth, barHeight);

    // 3. Calcolo dell'altezza della vita
    const healthPercentage = Math.max(0, currentHp / maxHp);
    const currentHealthHeight = barHeight * healthPercentage;

    // 4. Parte piena (Verde Pixel Art)
    ctx.fillStyle = '#49eb34'; 
    ctx.fillRect(x, y + (barHeight - currentHealthHeight), barWidth, currentHealthHeight);

    // --- AGGIUNTA TESTO ---
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    
    // 5. Valore numerico (es. 75/100) posizionato subito sotto la barra
    ctx.font = '12px "Courier New", Courier, monospace'; // Font leggermente più piccolo per i numeri
    const hpStatus = `${Math.ceil(currentHp)}`;
    ctx.fillText(hpStatus, x + (barWidth / 2), y + barHeight + 20);

    // 6. Testo "HP" sotto il valore numerico
    ctx.font = 'bold 16px "Courier New", Courier, monospace';
    ctx.fillText("HP", x + (barWidth / 2), y + barHeight + 40);
}
// BULLETS
export function drawBullets(ctx) {
    gameState.bullets.forEach(bullet => {
        ctx.save();
        
        // Colori pixel art (niente sfumature trasparenti)
        const coreColor = '#ffffff';
        const edgeColor = '#e0e0e0';
        const pixelSize = 2; // La dimensione del "pixel" virtuale
        
        // Ridotto il gap orizzontale per farli sembrare un unico fascio o molto vicini
        const horizontalGap = 2; 
        const bulletWidth = 4;
        const bulletHeight = 12;

        const drawPixelBullet = (offsetX) => {
            const posX = bullet.x + offsetX - (bulletWidth / 2);
            const posY = bullet.y - (bulletHeight / 2);

            // Corpo del proiettile (Rettangolo solido per pixel art)
            ctx.fillStyle = edgeColor;
            ctx.fillRect(posX, posY, bulletWidth, bulletHeight);
            
            // "Highlight" centrale per dare profondità 8-bit
            ctx.fillStyle = coreColor;
            ctx.fillRect(posX + 1, posY + 1, bulletWidth - 2, bulletHeight - 4);
        };

        // Rimuoviamo shadowBlur per un look pulito pixel art
        ctx.shadowBlur = 0; 

        // Disegniamo i due filamenti vicini
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
        
        // --- MODIFICHE QUI ---
        const spacing = 8; // Ridotto da 18 a 8 per averli molto vicini
        const verticalStagger = 6; // Ridotto lo sfasamento verticale per coerenza
        // ---------------------

        const totalWidth = (missileCount - 1) * spacing;
        let startX = gameState.playerX - (totalWidth / 2);
        const centerIndex = Math.floor(missileCount / 2);

        for (let i = 0; i < missileCount; i++) {
            const distFromCenter = Math.abs(i - centerIndex);
            gameState.bullets.push({
                x: startX + i * spacing,
                y: (gameState.playerY - 20) + (distFromCenter * verticalStagger),
                speed: 12, // Leggermente più veloce per un feeling arcade
                size: 8,
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

/**
 * Disegna i nemici come entità spettrali (nucleo d'ombra ed energia oscura)
 */
export function drawEnemies(ctx) {
    gameState.enemies.forEach(enemy => {
        ctx.save();

        // 1. ALONE SPETTRALE ESTERNO (Nebbia oscura)
        const ghostGlow = ctx.createRadialGradient(
            enemy.x, enemy.y, 0,
            enemy.x, enemy.y, enemy.size
        );
        ghostGlow.addColorStop(0, 'rgba(138, 43, 226, 0.6)'); // Viola elettrico al centro
        ghostGlow.addColorStop(0.5, 'rgba(75, 0, 130, 0.3)');  // Indigo sfumato
        ghostGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');         // Dissolvenza nel nero

        ctx.fillStyle = ghostGlow;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();

        // 2. IL NUCLEO D'OMBRA (Il "vuoto")
        // Creiamo un gradiente che va dal nero totale a un bordo luminoso spettrale
        const voidCore = ctx.createRadialGradient(
            enemy.x, enemy.y, enemy.size * 0.1, // Centro del vuoto
            enemy.x, enemy.y, enemy.size * 0.4  // Limite del nucleo
        );
        voidCore.addColorStop(0, '#000000');           // Il centro è puro vuoto (nero)
        voidCore.addColorStop(0.7, '#1a0033');         // Viola scurissimo
        voidCore.addColorStop(1, '#00ffff');           // Bordo ciano "elettrico" (effetto spettrale)

        // Effetto bagliore esterno per il bordo del vuoto
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#8a2be2';
        
        ctx.fillStyle = voidCore;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // 3. PARTICELLE DI ENERGIA (Piccoli punti luminosi attorno al nucleo)
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        for (let i = 0; i < 3; i++) {
            const angle = (Date.now() / 500) + (i * 2);
            const dist = (enemy.size * 0.4) + Math.sin(Date.now() / 200) * 5;
            const px = enemy.x + Math.cos(angle) * dist;
            const py = enemy.y + Math.sin(angle) * dist;
            
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });
}

/**
 * Genera i nemici spettrali
 */
export function spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
        const size = 60 + Math.random() * 40; 
        gameState.enemies.push({
            x: Math.random() * (CONFIG.CANVAS_WIDTH - 60) + 30, 
            y: -100 - (Math.random() * 300), 
            size: size,
            speed: 2 + Math.random() * 2, // I fantasmi solitamente sono più lenti e costanti
            color: '#8a2be2'
        });
    }
}

/**
 * Aggiorna la posizione
 */
export function updateEnemies() {
    gameState.enemies = gameState.enemies.filter(enemy => {
        enemy.y += enemy.speed;
        // Aggiungiamo un leggero movimento oscillatorio orizzontale (floating)
        enemy.x += Math.sin(enemy.y / 30) * 0.5; 
        
        return enemy.y < CONFIG.CANVAS_HEIGHT + 100;
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
