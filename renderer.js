import { CONFIG, gameState } from './config.js';

/**
 * Main Renderer Module
 */

export function drawStartScreen(ctx,introImage) {
    // 1. Disegna l'immagine di sfondo invece del rettangolo blu
    // Usiamo le costanti CONFIG per adattarla alle dimensioni del canvas
    if (introImage.complete) {
        ctx.drawImage(introImage, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    } else {
        // Fallback nel caso l'immagine non sia ancora pronta
        ctx.fillStyle = '#000033';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }
}

export function drawPlayer(ctx, img) {
    if (!img.complete) return; 

    // --- CONFIGURAZIONE SPRITE ---
    const frameWidth = 512;  
    const frameHeight = 349; 
    
    // --- NUOVA SCALA SEPARATA ---
    const scaleX = 0.09;      // Ridotto (era 0.1) per l'effetto schiacciato
    const scaleY = 0.13;       // Mantenuto originale
    
    const totalFrames = 13; 
    const animationSpeed = 150;
    const frameIndex = Math.floor(Date.now() / animationSpeed) % totalFrames;

    ctx.save();
    
    ctx.translate(gameState.playerX, gameState.playerY);

    // --- DISEGNO DELLO SPRITE ---
    ctx.drawImage(
        img,
        frameIndex * frameWidth, 0, 
        frameWidth, frameHeight,    
        - (frameWidth * scaleX) / 2, // Centratura con scaleX
        - (frameHeight * scaleY) / 2, // Centratura con scaleY
        frameWidth * scaleX,         // Larghezza schiacciata
        frameHeight * scaleY         // Altezza normale
    );

    ctx.restore();
}

export function drawBullets(ctx) {
    gameState.bullets.forEach(bullet => {
        ctx.save();
        
        // Parametri per l'effetto "Double Needle"
        const filamentWidth = bullet.size * 0.2; // Molto sottili
        const height = bullet.size * 8;         // Slanciati
        const horizontalGap = 3;                // Distanza tra i due filamenti

        // Funzione interna per disegnare un singolo filamento
        const drawFilament = (offsetX) => {
            const posX = bullet.x + offsetX;
            
            let gradient = ctx.createLinearGradient(
                posX, bullet.y - height / 2, 
                posX, bullet.y + height / 2
            );
            
            // Colore metallico/elettrico
            gradient.addColorStop(0, '#ffffff');      // Punta
            gradient.addColorStop(0.2, '#e0e0e0');    // Nucleo argento
            gradient.addColorStop(0.7, 'rgba(100, 100, 100, 0.3)'); // Scia
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            
            ctx.beginPath();
            ctx.ellipse(posX, bullet.y, filamentWidth / 2, height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        };

        // Riduciamo l'ombra globale per non farli "fondere" troppo
        ctx.shadowBlur = 3;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';

        // Disegniamo i due filamenti vicini
        drawFilament(-horizontalGap / 2); // Sinistro
        drawFilament(horizontalGap / 2);  // Destro

        // Opzionale: un piccolo bagliore di connessione tra i due in punta
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.arc(bullet.x, bullet.y - height / 2.2, filamentWidth, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });
}

export function drawUI(ctx) {
    // 1. Timer originale (rimane invariato)
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`TIME: ${gameState.gameTimer}`, 10, 30);
    ctx.restore();

    const now = Date.now() / 1000;
    
    // --- CALCOLO PERCENTUALI (Separate e indipendenti) ---
    // Barra 1
    const elapsed1 = now - (gameState.specialLastUsed || 0);
    const perc1 = Math.min(1, elapsed1 / gameState.specialCooldown);

    // Barra 2 - Rimosso il fallback a specialLastUsed
    const elapsed2 = now - (gameState.specialLastUsed2 || 0);
    const perc2 = Math.min(1, elapsed2 / (gameState.specialCooldown2 || 1));

    // Configurazione barre
    const barWidth = 40;
    const barHeight = 4;
    const x = gameState.playerX - barWidth / 2;
    const y = gameState.playerY + 28;

    ctx.save();

    // --- DISEGNO BARRA 1 (Viola) ---
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

    // --- DISEGNO BARRA 2 (Verdino/Turchese) ---
    const y2 = y + barHeight + 3;
    ctx.shadowBlur = 0; // Reset ombre per lo sfondo
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
