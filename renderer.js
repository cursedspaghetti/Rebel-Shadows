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
export function drawSpecialRay(ctx) {
    const ray = gameState.specialRay;
    if (!ray || !ray.active) {
        gameState.rayParticles = []; // Pulisce le particelle quando il raggio finisce
        return;
    }

    const drawX = ray.x - (ray.currentWidth / 2);
    const rayHeight = gameState.playerY;

    // --- LOGICA PARTICELLE ---
    // Generiamo 2-3 nuove particelle ogni frame mentre il raggio è attivo
    if (ray.currentWidth > 10) { 
        for (let i = 0; i < 3; i++) {
            gameState.rayParticles.push({
                // Partono dai bordi del raggio o casualmente dentro la sua ampiezza
                x: (ray.x - ray.currentWidth / 2) + Math.random() * ray.currentWidth,
                y: Math.random() * rayHeight,
                size: Math.random() * 4 + 1,
                speedX: (Math.random() - 0.5) * 4, // Si muovono un po' a destra/sinistra
                speedY: -Math.random() * 5 - 2,    // Vanno verso l'alto veloci
                life: 1.0,                         // Opacità iniziale
                decay: Math.random() * 0.05 + 0.02 // Velocità di sparizione
            });
        }
    }

    // Disegno e aggiornamento particelle
    ctx.save();
    gameState.rayParticles.forEach((p, index) => {
        ctx.fillStyle = `rgba(138, 43, 226, ${p.life})`; // Viola semitrasparente
        ctx.shadowBlur = 5;
        ctx.shadowColor = "black";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Update posizione per il prossimo frame
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= p.decay;

        // Rimuovi particelle "morte"
        if (p.life <= 0) gameState.rayParticles.splice(index, 1);
    });
    ctx.restore();

    // --- DISEGNO DEL RAGGIO (Quello creato prima) ---
    let gradient = ctx.createLinearGradient(drawX, 0, drawX + ray.currentWidth, 0);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.2, 'rgba(48, 0, 65, 0.8)');
    gradient.addColorStop(0.5, 'rgba(10, 0, 20, 0.95)');
    gradient.addColorStop(0.8, 'rgba(75, 0, 130, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = "#4b0082";
    ctx.fillStyle = gradient;
    ctx.fillRect(drawX, 0, ray.currentWidth, rayHeight);

    // Hot Core instabile
    const jitter = Math.random() * 4; // Effetto vibrazione
    const coreWidth = (ray.currentWidth * 0.15) + jitter;
    ctx.fillStyle = "#e0b0ff";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff00ff";
    ctx.fillRect(ray.x - (coreWidth / 2), 0, coreWidth, rayHeight);
    
    ctx.restore();
}

export function drawSpecialRay2(ctx) {
    const ray = gameState.specialRay2;
    
    // Se il raggio non è attivo, continuiamo comunque a disegnare le particelle residue
    // ma smettiamo di generarne di nuove.
    if (!ray || !ray.active2) {
        if (gameState.rayParticles2.length === 0) return;
    }

    // --- LOGICA GENERAZIONE (Solo se il raggio è attivo) ---
    if (ray && ray.active2 && ray.currentWidth2 > 5) { 
        // Generiamo più particelle per dare l'idea di un flusso consistente
        for (let i = 0; i < 5; i++) {
            gameState.rayParticles2.push({
                // Partono dalla posizione X del giocatore (o del raggio)
                x: ray.x2 + (Math.random() - 0.5) * ray.currentWidth2,
                // Partono dal basso (posizione del giocatore)
                y: gameState.playerY, 
                size: Math.random() * 5 + 2,
                // Velocità leggermente divergente
                speedX: (Math.random() - 0.5) * 6, 
                // Velocità verso l'alto (negativa)
                speedY: -Math.random() * 10 - 5,    
                life: 1.0,
                decay: Math.random() * 0.02 + 0.01, // Durano più a lungo per attraversare lo schermo
                color: Math.random() > 0.5 ? "#00ffcc" : "#8A2BE2" // Mix tra turchese e viola
            });
        }
    }

    // --- DISEGNO E AGGIORNAMENTO PARTICELLE ---
    ctx.save();
    for (let i = gameState.rayParticles2.length - 1; i >= 0; i--) {
        const p = gameState.rayParticles2[i];

        // Effetto grafico particella
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        
        ctx.beginPath();
        // Disegniamo piccole "fiammelle" o cerchi
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Update posizione
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= p.decay;

        // Rilevamento Collisione (Esempio logico)
        // Se hai una lista di nemici, potresti controllare qui se p.x/p.y tocca un nemico
        // if (checkCollision(p, enemies)) { p.life = 0; spawnExplosion(p.x, p.y); }

        // Rimuovi particelle morte o fuori schermo
        if (p.life <= 0 || p.y < -50) {
            gameState.rayParticles2.splice(i, 1);
        }
    }
    ctx.restore();
}


export function drawChargeEffect(ctx, chargeImg) {
    if (chargeImg.complete && chargeImg.naturalWidth !== 0) {
        
        // --- SCALE FINALI FISSE ---
        const scaleX = 0.09; 
        const scaleY = 0.13; 
        
        const width = chargeImg.width * scaleX;
        const height = chargeImg.height * scaleY;

        ctx.save();

        // Disegno semplice senza bagliori o trasparenze particolari
        ctx.drawImage(
            chargeImg, 
            gameState.playerX - width / 2, 
            gameState.playerY - height / 2, 
            width, 
            height
        );

        ctx.restore();
    }
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
