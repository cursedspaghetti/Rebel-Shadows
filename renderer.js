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
    const fadeSpeed = 0.02;
    
    // Centro orizzontale del Canvas per posizionare le vignette
    const canvasCenterX = CONFIG.CANVAS_WIDTH / 2;

    // --- LOGICA FADE SEQUENZIALE ---
    if (!isWizardSelected) {
        if (gameState.bubbleAlpha1 < 1) gameState.bubbleAlpha1 += fadeSpeed;
        gameState.bubbleAlpha2 = 0;
        gameState.wizIdAlpha = 0;
    } else {
        if (gameState.bubbleAlpha1 > 0) gameState.bubbleAlpha1 -= fadeSpeed;
        if (gameState.wizIdAlpha < 1) gameState.wizIdAlpha += fadeSpeed;
        if (gameState.wizIdAlpha > 0.5 && gameState.bubbleAlpha2 < 1) {
            gameState.bubbleAlpha2 += fadeSpeed;
        }
    }

    if (gameState.bookAlpha < 1) gameState.bookAlpha += 0.015;
    hoverCounter = (hoverCounter + 0.04) % (Math.PI * 2);

    // 2. WIZ1 (BASSO A SINISTRA)
    if (wiz1.complete) {
        const wizX = margin;
        const wizY = CONFIG.CANVAS_HEIGHT - sideImageSize - margin;
        const wizCenterX = wizX + (sideImageSize / 2); // Punto target per la punta
        
        ctx.drawImage(wiz1, wizX, wizY, sideImageSize, sideImageSize);

        if (gameState.bubbleAlpha1 > 0) {
            const speechText = "Rebel Shadows slipped through the cracks of reality...\n\nHurry up, I need a wizard who can handle the Book of Shadows!";
            // x = centro canvas, y = bordo superiore wizard, targetX = centro wizard
            drawPixelBubble(ctx, canvasCenterX, wizY, speechText, gameState.bubbleAlpha1, wizCenterX);
        }
    }

    // 3. BOOK1 (FADE IN + HOVER)
    if (bookImg.complete && gameState.bookAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = gameState.bookAlpha;
        const hoverOffset = Math.sin(hoverCounter) * 15;
        ctx.drawImage(
            bookImg, 
            (CONFIG.CANVAS_WIDTH - bookSize) / 2, 
            CONFIG.CANVAS_HEIGHT - bookSize - margin - 150 + hoverOffset, 
            bookSize, 
            bookSize
        );
        ctx.restore();
    }

    // 4. WIZARD ID NFT (BASSO A DESTRA)
    if (isWizardSelected && gameState.wizIdAlpha > 0) {
        const nftX = CONFIG.CANVAS_WIDTH - sideImageSize - margin;
        const nftY = CONFIG.CANVAS_HEIGHT - sideImageSize - margin;
        const nftCenterX = nftX + (sideImageSize / 2); // Punto target per la punta

        ctx.save();
        ctx.globalAlpha = gameState.wizIdAlpha;
        ctx.drawImage(introImage, nftX, nftY, sideImageSize, sideImageSize);
        ctx.restore();

        if (gameState.bubbleAlpha2 > 0) {
            const nftSpeech = "A wizard is never late, nor is he early, he arrives precisely when he means to";
            // x = centro canvas, y = bordo superiore NFT, targetX = centro NFT
            drawPixelBubble(ctx, canvasCenterX, nftY, nftSpeech, gameState.bubbleAlpha2, nftCenterX);
        }
    }
}

/**
 * Funzione per disegnare una vignetta centrata con punta dinamica
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x - Centro orizzontale del box (Canvas Center)
 * @param {number} y - Coordinata Y di riferimento (es. testa del personaggio)
 * @param {string} text - Testo da mostrare
 * @param {number} alpha - Opacità
 * @param {number} targetX - Punto X dove deve puntare la coda
 */
function drawPixelBubble(ctx, x, y, text, alpha = 1, targetX) {
    const maxWidth = 300; 
    const lineHeight = 18;
    const padding = 20; // Spazio interno per il testo
    const verticalOffset = 65; // <--- AUMENTA QUESTO per alzare ulteriormente la vignetta
    
    ctx.save();
    ctx.globalAlpha = alpha; 
    
    ctx.font = "14px 'Press Start 2P', monospace";
    
    // 1. Wrapping del testo
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

    // 2. Calcolo dimensioni e posizione
    const bubbleHeight = lines.length * lineHeight + (padding * 2);
    const bubbleWidth = maxWidth + (padding * 2);
    const rectX = x - (bubbleWidth / 2); 
    
    // Alziamo la vignetta aumentando la sottrazione da y
    const finalY = y - bubbleHeight - verticalOffset; 

    // 3. Disegno Box
    ctx.strokeStyle = `rgba(211, 211, 211, ${alpha})`;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * alpha})`;
    ctx.lineWidth = 3;

    const radius = 10;
    ctx.beginPath();
    ctx.roundRect(rectX, finalY, bubbleWidth, bubbleHeight, radius); 
    ctx.fill();
    ctx.stroke();

    // 4. Disegno Testo Centrato
    ctx.fillStyle = `rgba(211, 211, 211, ${alpha})`;
    ctx.textAlign = "center"; // Centra orizzontalmente rispetto al punto di fill
    ctx.textBaseline = "middle"; // Aiuta per il centraggio verticale
    
    lines.forEach((line, index) => {
        if (line !== "") {
            // Il punto X è il centro della vignetta (x)
            // Il punto Y è finalY + padding + offset riga
            const textY = finalY + padding + (index * lineHeight) + (lineHeight / 2);
            ctx.fillText(line, x, textY);
        }
    });

    // 5. Disegno Punta (Coda)
    const baseWidth = 12;
    // Vincola la base della coda ai limiti del rettangolo
    const tailBaseX = Math.max(rectX + baseWidth * 2, Math.min(rectX + bubbleWidth - baseWidth * 2, targetX));
    
    ctx.beginPath();
    ctx.moveTo(tailBaseX - baseWidth, finalY + bubbleHeight); 
    ctx.lineTo(targetX, finalY + bubbleHeight + 15);   
    ctx.lineTo(tailBaseX + baseWidth, finalY + bubbleHeight); 
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
}

export function drawPlayer(ctx, img) {
    if (!img.complete) return; 

    const frameWidth = 512;  
    const frameHeight = 349; 
    
    const scaleX = 0.09;      
    const scaleY = 0.11;        
    
    const totalFrames = 13; 
    const animationSpeed = 150;
    const frameIndex = Math.floor(Date.now() / animationSpeed) % totalFrames;

    // --- EFFETTO FLUTTUANTE ---
    // Usiamo il seno del tempo corrente per creare un movimento su e giù fluido
    // 0.005 controlla la velocità, 5 controlla l'ampiezza (pixel)
    const floatingOffset = Math.sin(Date.now() * 0.005) * 5;

    ctx.save();
    
    // Applichiamo la traslazione includendo l'offset fluttuante sulla Y
    ctx.translate(gameState.playerX, gameState.playerY + floatingOffset);

    // --- ALONE DI LUCE ---
    // Impostiamo il bagliore. Puoi cambiare il colore in base al tuo personaggio.
    ctx.shadowBlur = 15 + Math.sin(Date.now() * 0.005) * 5; // intensità che cambia al movimento
    ctx.shadowColor = "rgba(0, 255, 255, 0.8)"; // Colore (es. azzurro neon)
    // Disegniamo l'immagine
    ctx.drawImage(
        img,
        frameIndex * frameWidth, 0, 
        frameWidth, frameHeight,    
        - (frameWidth * scaleX) / 2, 
        - (frameHeight * scaleY) / 2 - 20, 
        frameWidth * scaleX,         
        frameHeight * scaleY          
    );

    ctx.restore();
}
export function drawPlayerWiz(ctx) {
    const wizardImg = gameState.wizardSpritesheet; 
    
    const wizSize = CONFIG.WIZARD_SPRITE.FRAME_SIZE;     // 50
    const wizScale = CONFIG.WIZARD_SPRITE.RENDER_SCALE;  // 1.2
    const wizSpeed = CONFIG.WIZARD_SPRITE.ANIM_SPEED;    // 100ms
    const animFrames = 4; // Usiamo solo le 4 colonne specificate
    
    if (!wizardImg || !wizardImg.complete) return;

    let wizFrameIdx = 0;
    
    if (gameState.isMoving) {
        // Calcolo base del frame (0, 1, 2, 3)
        const frameCycle = Math.floor(Date.now() / wizSpeed) % animFrames;

        if (gameState.playerDirection === 3) { 
            // MOVIMENTO SU: frame da 0 a 3 (0, 1, 2, 3)
            wizFrameIdx = frameCycle;
        } else {
            // MOVIMENTO GIÙ (o dominante giù): frame da 3 a 0 (3, 2, 1, 0)
            wizFrameIdx = (animFrames - 1) - frameCycle;
        }
    }

    // Usiamo sempre la RIGA 3 (indice 2 se conti 0,1,2... o indice 3 se è la quarta)
    // Se intendevi la QUARTA riga fisica, metti 3. Se intendevi la TERZA, metti 2.
    const wizRow = 2; 

    ctx.save();
    ctx.translate(gameState.playerX, gameState.playerY);

    ctx.drawImage(
        wizardImg,
        wizFrameIdx * wizSize, // Colonna (0-3)
        wizRow * wizSize,      // Riga fissa
        wizSize, wizSize,
        -(wizSize * wizScale) / 2,
        -(wizSize * wizScale) / 2,
        wizSize * wizScale,
        wizSize * wizScale
    );

    ctx.restore();
}

/**
 * Gestisce il movimento del giocatore (asse X) e della camera (asse Y).
 * @param {HTMLImageElement} bgImage - L'immagine di sfondo per calcolare i limiti reali.
 */
export function updatePlayerMovement(bgImage) {
    let dx = 0;
    let dy = 0; 
    const speed = gameState.playerSpeed || 4; 
    
    // CAP della velocità: impostato a 0.4 della velocità base come richiesto
    const MAX_DY = speed * 0.4; 

    // --- 1. GESTIONE OPACITÀ PAD (Feedback Visivo) ---
    if (gameState.isTouchActive) {
        // Appare gradualmente quando si tocca
        gameState.padOpacity = Math.min(1, (gameState.padOpacity || 0) + 0.1);
    } else {
        // Scompare gradualmente quando si rilascia
        gameState.padOpacity = Math.max(0, (gameState.padOpacity || 0) - 0.1);
    }

    // --- 2. INPUT TASTIERA ---
    if (gameState.keys['ArrowUp'] || gameState.keys['w'] || gameState.keys['W']) dy = speed;
    if (gameState.keys['ArrowDown'] || gameState.keys['s'] || gameState.keys['S']) dy = -speed;
    if (gameState.keys['ArrowLeft'] || gameState.keys['a'] || gameState.keys['A']) dx -= speed;
    if (gameState.keys['ArrowRight'] || gameState.keys['d'] || gameState.keys['D']) dx += speed;

    // --- 3. INPUT TOUCH ---
    if (gameState.isTouchActive) {
        // Movimento Orizzontale (Player X)
        const targetDx = gameState.touchX - gameState.playerX;
        if (Math.abs(targetDx) > 5) {
            dx = targetDx * (CONFIG.TOUCH.LERP || 0.1);
        }

        // Movimento Verticale (Camera Y)
        // Punto neutro (Pad Center) spostato 120px sotto il giocatore
        const thresholdY = gameState.playerY + 120; 
        const distY = gameState.touchY - thresholdY;

        // Se tocco sotto il threshold, distY è positivo -> dy diventa negativo (avanzo)
        // Nota: la logica dy = -distY serve per far scorrere la camera correttamente
        let targetDy = -distY * (CONFIG.TOUCH.LERP || 0.1);

        // Applichiamo il CAP alla velocità verticale
        dy = Math.max(-MAX_DY, Math.min(MAX_DY, targetDy));
        
        // Deadzone: evita tremolii se il dito è quasi al centro del pad
        if (Math.abs(distY) < 15) dy = 0;
    }

    // --- 4. APPLICAZIONE MOVIMENTO X (Giocatore sul Canvas) ---
    gameState.playerX += dx;
    
    // Limiti laterali dello schermo
    const padding = 20;
    gameState.playerX = Math.max(padding, Math.min(CONFIG.CANVAS_WIDTH - padding, gameState.playerX));

    // --- 5. APPLICAZIONE CAMERA Y (Mappa verticale) ---
    const moving = Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1;
    gameState.isMoving = moving;

    if (moving) {
        // Aggiorniamo la coordinata della camera
        gameState.cameraY = (gameState.cameraY || 0) + dy;

        // Limiti basati sulle 15 ripetizioni dello sfondo
        if (bgImage && bgImage.naturalHeight > 0) {
            const totalWorldHeight = bgImage.naturalHeight * 15;
            const maxScroll = Math.max(0, totalWorldHeight - CONFIG.CANVAS_HEIGHT);
            
            // Clamp: Impedisce di andare oltre la cima (0) o il fondo (-maxScroll)
            if (gameState.cameraY > 0) gameState.cameraY = 0;
            if (gameState.cameraY < -maxScroll) gameState.cameraY = -maxScroll;
        }

        // Direzione Sprite: dy > 0 (mappa scende) = Mago guarda SU (3)
        if (Math.abs(dy) > 0.1) {
            gameState.playerDirection = dy > 0 ? 3 : 0;
        }
    }
}

export function drawTouchPad(ctx) {
    if (gameState.padOpacity <= 0) return;

    const centerX = gameState.playerX;
    const centerY = gameState.playerY + 120; // Stesso valore usato nel movimento
    
    ctx.save();
    ctx.globalAlpha = gameState.padOpacity * 0.4;
    
    // Cerchio esterno (Base)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cerchio interno (Se il touch è attivo, mostriamo dove preme)
    if (gameState.isTouchActive) {
        ctx.beginPath();
        ctx.arc(gameState.touchX, gameState.touchY, 20, 0, Math.PI * 2);
        ctx.fillStyle = "purple";
        ctx.fill();
    }
    
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


    
//UI

export function drawUI(ctx) {
    // Il blocco relativo alla visualizzazione del tempo (gameState.gameTimer) è stato rimosso

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
