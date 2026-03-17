import { CONFIG, gameState } from './config.js';

let hoverCounter = 0;

export function drawStartScreen(ctx, bgIntro, introImage, wiz1, bookImg) {
    // 1. SFONDO
    if (bgIntro.complete && bgIntro.naturalWidth !== 0) {
        ctx.drawImage(bgIntro, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
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
    const animFrames = 4; 
    
    if (!wizardImg || !wizardImg.complete) return;

    let wizFrameIdx = 0;
    
    // Logica animazione basata sulla direzione impostata in updatePlayerMovement
    if (gameState.isMoving) {
        const frameCycle = Math.floor(Date.now() / wizSpeed) % animFrames;

        if (gameState.playerDirection === 3) { 
            // MOVIMENTO SU
            wizFrameIdx = frameCycle;
        } else {
            // MOVIMENTO GIÙ
            wizFrameIdx = (animFrames - 1) - frameCycle;
        }
    }

    // Riga fissa della spritesheet (indice 2 = terza riga)
    const wizRow = 2; 

    ctx.save();
    
    /* IMPORTANTE: gameState.playerX e Y sono coordinate "mondo". 
       Dato che nel main.js abbiamo già traslato il contesto per la camera,
       qui basta posizionarsi su playerX e playerY.
    */
    ctx.translate(gameState.playerX, gameState.playerY);

    ctx.drawImage(
        wizardImg,
        wizFrameIdx * wizSize,   // Ritaglio X (Colonna)
        wizRow * wizSize,        // Ritaglio Y (Riga)
        wizSize, wizSize,        // Dimensioni ritaglio
        -(wizSize * wizScale) / 2, // Posizione disegno (centrata)
        -(wizSize * wizScale) / 2,
        wizSize * wizScale,      // Dimensione disegno scalata
        wizSize * wizScale
    );

    ctx.restore();
}

/**
 * Gestisce il movimento del giocatore (asse X) e della camera (asse Y).
 * @param {HTMLImageElement} bgImage - L'immagine di sfondo per calcolare i limiti reali.
 */
/**
 * Gestisce il movimento del giocatore (X) e lo scorrimento del mondo (Y).
 * @param {HTMLImageElement} bgImage - L'immagine di sfondo (EmptySpace.png).
 */
export function updatePlayerMovement(bgImage) {
    let dx = 0;
    let dy = 0; 
    const speed = gameState.Speed || 4; 

    // --- GESTIONE OPACITÀ PAD ---
    if (gameState.isTouchActive) {
        gameState.padOpacity = Math.min(1, (gameState.padOpacity || 0) + 0.1);
    } else {
        gameState.padOpacity = Math.max(0, (gameState.padOpacity || 0) - 0.1);
    }

    // --- INPUT (Tastiera) ---
    if (gameState.keys['ArrowUp'] || gameState.keys['w'] || gameState.keys['W']) dy -= speed;
    if (gameState.keys['ArrowDown'] || gameState.keys['s'] || gameState.keys['S']) dy += speed;
    if (gameState.keys['ArrowLeft'] || gameState.keys['a'] || gameState.keys['A']) dx -= speed;
    if (gameState.keys['ArrowRight'] || gameState.keys['d'] || gameState.keys['D']) dx += speed;

    // --- INPUT (Touch) ---
    if (gameState.isTouchActive) {
        // Calcoliamo la differenza tra il tocco e la posizione del player sullo SCHERMO
        // Per farlo dobbiamo sottrarre la camera dalla posizione reale del player
        const playerScreenX = gameState.playerX - (gameState.camera?.x || 0);
        const playerScreenY = gameState.playerY - (gameState.camera?.y || 0);

        const targetDx = gameState.touchX - playerScreenX;
        const targetDy = gameState.touchY - playerScreenY;

        // Muoviamo solo se la distanza è significativa (deadzone)
        if (Math.abs(targetDx) > 10) dx = targetDx * (CONFIG.TOUCH.LERP || 0.15);
        if (Math.abs(targetDy) > 10) dy = targetDy * (CONFIG.TOUCH.LERP || 0.15);
        
        // Limitiamo la velocità massima nel touch
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag > speed) {
            dx = (dx / mag) * speed;
            dy = (dy / mag) * speed;
        }
    }

    // --- APPLICAZIONE MOVIMENTO CON LIMITI MAPPA ---
    if (bgImage && bgImage.naturalWidth > 0) {
        const mapW = bgImage.naturalWidth;
        const mapH = bgImage.naturalHeight;
        const margin = 30; // Margine dai bordi della nebulosa

        // Aggiorna X
        gameState.playerX += dx;
        gameState.playerX = Math.max(margin, Math.min(mapW - margin, gameState.playerX));

        // Aggiorna Y
        gameState.playerY += dy;
        gameState.playerY = Math.max(margin, Math.min(mapH - margin, gameState.playerY));
    } else {
        // Fallback se l'immagine non è caricata (usa il canvas)
        gameState.playerX += dx;
        gameState.playerY += dy;
    }

    // --- DIREZIONE E ANIMAZIONE ---
    gameState.isMoving = Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1;
    
    // Cambia direzione dello sprite in base al movimento prevalente
    if (gameState.isMoving) {
        if (Math.abs(dx) > Math.abs(dy)) {
            gameState.playerDirection = dx > 0 ? 2 : 1; // 2: Destra, 1: Sinistra
        } else {
            gameState.playerDirection = dy > 0 ? 0 : 3; // 0: Giù, 3: Su
        }
    }
}


/**
 * Disegna il joystick virtuale per il feedback del movimento touch.
 * @param {CanvasRenderingContext2D} ctx - Il contesto del canvas.
 */
export function drawTouchPad(ctx) {
    // Se l'opacità è 0, non disegnare nulla
    if (!gameState.padOpacity || gameState.padOpacity <= 0) return;

    ctx.save();
    
    // IMPORTANTE: Poiché questa funzione è chiamata DOPO ctx.restore() nel main.js,
    // siamo in "Screen Space" (coordinate pixel del display).
    
    ctx.globalAlpha = gameState.padOpacity;

    // Centro del pad relativo alla posizione del giocatore SULLO SCHERMO
    // Calcoliamo dove si trova il player rispetto alla visuale attuale
    const screenPosX = gameState.playerX - (gameState.camera?.x || 0);
    const screenPosY = gameState.playerY - (gameState.camera?.y || 0);

    const centerX = screenPosX;
    const centerY = screenPosY + 140; // Rimane 140px sotto il mago a schermo
    
    const outerRadius = 50;
    const innerRadius = 15;

    // 1. DISEGNO CERCHIO ESTERNO
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.stroke();
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fill();

    // 2. DISEGNO CERCHIO INTERNO (Pomello)
    if (gameState.isTouchActive) {
        // Usiamo gameState.touchX/Y che sono già coordinate schermo
        const dx = gameState.touchX - centerX;
        const dy = gameState.touchY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        const limitedDist = Math.min(distance, outerRadius);
        const knobX = centerX + Math.cos(angle) * limitedDist;
        const knobY = centerY + Math.sin(angle) * limitedDist;

        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(138, 43, 226, 0.8)"; // Aumentato contrasto

        ctx.beginPath();
        ctx.arc(knobX, knobY, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(138, 43, 226, 0.6)"; 
        ctx.fill();
        
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.stroke();
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

// --- PROIETTILI PLAYER (HEAVY MACHINE GUN MODE - GRIGIO SPETTRALE) ---

// --- PROIETTILI PLAYER (SPECTRAL FLAME MODE) ---

export function drawBullets(ctx) {
    gameState.bullets.forEach(bullet => {
        ctx.save();

        // Palette Cromatica Richiesta
        const flameOuter = '#2C3E50';    // Grigio scuro/Bluastro
        const flameInner = '#ECF0F1';    // Quasi bianco
        const flameCore = '#FFFFFF';     // Bianco puro
        const tealGlow = '#1ABC9C';      // Verde acqua (Bagliore)

        // Dimensioni aumentate per l'effetto "Heavy"
        const bW = 16;  // Larghezza base fiamma
        const bH = 32;  // Lunghezza fiamma

        ctx.translate(bullet.x, bullet.y);
        
        // Se il proiettile ha una velocità orizzontale, lo incliniamo leggermente
        const angle = bullet.vx ? bullet.vx * 0.05 : 0;
        ctx.rotate(angle);

        // 1. EFFETTO BAGLIORE (Verde Acqua)
        ctx.shadowColor = tealGlow;
        ctx.shadowBlur = 20;

        // 2. FORMA DELLA FIAMMA (Corpo Esterno Grigio Scuro)
        ctx.fillStyle = flameOuter;
        ctx.beginPath();
        ctx.moveTo(0, -bH / 2); // Punta superiore
        ctx.bezierCurveTo(bW / 2, -bH / 4, bW / 2, bH / 2, 0, bH / 2); // Lato destro
        ctx.bezierCurveTo(-bW / 2, bH / 2, -bW / 2, -bH / 4, 0, -bH / 2); // Lato sinistro
        ctx.fill();

        // 3. ANIMA INTERNA (Grigio Chiaro/Bianco)
        ctx.shadowBlur = 0; // Rimuoviamo shadow per i layer interni per pulizia pixel
        ctx.fillStyle = flameInner;
        ctx.beginPath();
        ctx.ellipse(0, 2, bW / 4, bH / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4. NUCLEO BIANCO (Flicker casuale per dinamismo)
        if (Math.random() > 0.2) {
            ctx.fillStyle = flameCore;
            ctx.beginPath();
            ctx.arc(0, 4, bW / 6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });
}

export function autoFire() {
    if (gameState.currentScreen !== 'playing' || gameState.isCharging || gameState.isCharging2) return;

    const now = Date.now();
    // Fire rate più frenetico per l'effetto mitragliatrice
    const currentFireRate = gameState.Attack_Rate; 

    if (now - gameState.lastShotTime >= currentFireRate) {
        // Numero di proiettili per raffica basato sul livello
    const burstCount = gameState.bulletLevel;
        for (let i = 0; i < burstCount; i++) {
            // VARIANZA ESTREMA:
            // 1. Jitter sulla X (partenza non perfettamente centrale)
            const muzzleJitterX = (Math.random() - 0.5) * 12; 
            // 2. Drift Orizzontale (il proiettile si sposta lateralmente mentre sale)
            const horizontalDrift = (Math.random() - 0.5) * 2; 
            // 3. Varianza sulla velocità (alcuni proiettili sono più veloci di altri)
            const speedVar = 14 + (Math.random() * 4);

            gameState.bullets.push({
                x: gameState.playerX + muzzleJitterX,
                y: gameState.playerY - 30,
                vx: horizontalDrift, // Nuova proprietà per il movimento laterale
                speed: speedVar,
                size: 12
            });
        }
        gameState.lastShotTime = now;
    }
}

export function updateBullets() {
    gameState.bullets = gameState.bullets.filter(bullet => {
        // Il proiettile ora usa anche la sua velocità orizzontale (vx)
        bullet.y -= bullet.speed;
        bullet.x += bullet.vx || 0; 
        
        return bullet.y > -50 && bullet.x > -50 && bullet.x < 1000; // Sicurezza bordi
    });
}
    
//UI

export function drawUI(ctx) {
    // Il blocco relativo alla visualizzazione del tempo (gameState.gameTimer) è stato rimosso

    const now = Date.now() / 1000;
    
    const elapsed1 = now - (gameState.specialLastUsed || 0);
    const perc1 = Math.min(1, elapsed1 / gameState.Special_CD);

    const elapsed2 = now - (gameState.shieldLastUsed || 0);
    const perc2 = Math.min(1, elapsed2 / (gameState.Shield_CD || 1));

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
