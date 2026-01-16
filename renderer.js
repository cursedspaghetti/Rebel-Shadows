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

// --- FUNZIONE PRINCIPALE ---
export function drawBossShadow(ctx, boss, img) {
    if (!img.complete) return;

    const totalFrames = 9;
    const frameDuration = 100; 
    const originalSize = 400;  
    
    const frameIndex = Math.floor((Date.now() / frameDuration) % totalFrames);
    const floatOffset = Math.sin(Date.now() * 0.003) * 10;

    ctx.save();
    
    ctx.translate(boss.x, boss.y + floatOffset);
    ctx.scale(0.5, 0.5); 

    // Disegno Boss
    const sx = Math.floor(frameIndex * originalSize);
    ctx.drawImage(
        img,
        sx, 0,                                
        originalSize, originalSize,           
        -originalSize / 2, -originalSize / 2,  
        originalSize, originalSize            
    );

    // --- DISEGNO BARRA (Passiamo originalSize) ---
    ctx.shadowBlur = 0;
    drawBossHealthBar(ctx, boss, originalSize);

    ctx.restore();
}

// --- FUNZIONE BARRA AGGIORNATA ---
function drawBossHealthBar(ctx, boss, size) {
    // 1. Verifica che i valori esistano per evitare NaN
    const healthPercent = Math.max(0, (boss.hp || 0) / (boss.maxHp || 100));
    
    const barWidth = 200; // Larghezza barra
    const barHeight = 12;
    
    // Posizionamento:
    // -size/2 è la cima della testa del boss (-200)
    // Sottraiamo altri 30 per distanziarla
    const x = -barWidth / 2;
    const y = -size / 2 - 5; 

    // Sfondo (Rosso scuro/Nero)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Salute (Viola/Fucsia come il tuo boss)
    ctx.fillStyle = '#cc00ff';
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    // Bordo (Bianco per visibilità)
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
}

export function drawBullets(ctx) {
    gameState.bullets.forEach(bullet => {
        ctx.save();
        
        // Dimensioni: molto stretto e molto lungo per l'effetto "scia fantasma"
        const width = bullet.size * 0.8;
        const height = bullet.size * 10; 

        // Gradiente lineare per l'effetto metallo liquido/ombra
        let gradient = ctx.createLinearGradient(
            bullet.x, bullet.y - height / 2, 
            bullet.x, bullet.y + height / 2
        );
        
        // Palette Argento e Ombra
        gradient.addColorStop(0, '#ffffff');       // Punta: Bianco brillante (bagliore cinetico)
        gradient.addColorStop(0.1, '#c0c0c0');     // Argento vivo
        gradient.addColorStop(0.4, 'rgba(105, 105, 105, 0.4)'); // Grigio fumo semitrasparente
        gradient.addColorStop(1, 'transparent');   // Coda che svanisce nel nulla

        // Bagliore (Glow) spettrale grigio
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#888'; // Ombra grigia media
        
        // Rendering
        ctx.beginPath();
        ctx.fillStyle = gradient;
        
        // Disegniamo l'ellisse allungata
        ctx.ellipse(bullet.x, bullet.y, width / 2, height / 2, 0, 0, Math.PI * 2);
        
        ctx.fill();
        
        // Opzionale: un piccolo nucleo centrale più scuro per dare profondità
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.ellipse(bullet.x, bullet.y - height / 4, width / 4, height / 8, 0, 0, Math.PI * 2);
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
    if (!ray || !ray.active2) {
        gameState.rayParticles2 = []; // Pulisce le particelle quando il raggio finisce
        return;
    }

    const drawX = ray.x2 - (ray.currentWidth2 / 2);
    const rayHeight = gameState.playerY;

    // --- LOGICA PARTICELLE ---
    // Generiamo 2-3 nuove particelle ogni frame mentre il raggio è attivo
    if (ray.currentWidth2 > 10) { 
        for (let i = 0; i < 3; i++) {
            gameState.rayParticles2.push({
                // Partono dai bordi del raggio o casualmente dentro la sua ampiezza
                x: (ray.x2 - ray.currentWidth2 / 2) + Math.random() * ray.currentWidth2,
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
    gameState.rayParticles2.forEach((p, index) => {
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
        if (p.life <= 0) gameState.rayParticles2.splice(index, 1);
    });
    ctx.restore();

    // --- DISEGNO DEL RAGGIO (Quello creato prima) ---
    // Colori spettrali: Verde pallido, Turchese e Bianco ghiaccio
let gradient = ctx.createLinearGradient(drawX, 0, drawX + ray.currentWidth2, 0);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.2, 'rgba(0, 128, 128, 0.3)');  // Teal profondo ma trasparente
    gradient.addColorStop(0.5, 'rgba(150, 255, 200, 0.6)'); // Cuore verde acido spettrale
    gradient.addColorStop(0.8, 'rgba(0, 100, 80, 0.3)');   // Ritorno al verde scuro
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.save();
    
    // Bagliore esterno più soffuso (Glow spettrale)
    ctx.shadowBlur = 40;
    ctx.shadowColor = "rgba(0, 255, 150, 0.5)";
    
    ctx.fillStyle = gradient;
    ctx.fillRect(drawX, 0, ray.currentWidth, rayHeight);

    // Hot Core "Anomalia"
    // Usiamo il bianco puro con un tocco di azzurro per l'effetto "anima"
    const jitter = Math.random() * 6; // Aumentato il jitter per instabilità psichica
    const coreWidth = (ray.currentWidth2 * 0.1) + jitter;
    
    ctx.fillStyle = "rgba(230, 255, 255, 0.9)"; // Bianco freddo quasi solido
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#00ffcc"; // Neon turchese
    
    // Disegniamo il core leggermente sfalsato per un effetto glitch
    ctx.fillRect(ray.x2 - (coreWidth / 2), 0, coreWidth, rayHeight);
    
    // Opzionale: Aggiungi un secondo strato sottilissimo per il "filo" dell'anima
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(ray.x2 - 1, 0, 2, rayHeight);
    
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
    // 1. DISEGNO DEL TIMER (Alto a sinistra)
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`TIME: ${gameState.gameTimer}`, 10, 30);
    ctx.restore();

    // 2. LOGICA DI CALCOLO COOLDOWN (In millisecondi)
    const now = Date.now();
    
    // Parametri Special 1
    const cd1Ms = gameState.specialCooldown * 1000;
    const elapsed1 = now - gameState.specialLastUsed;
    const perc1 = Math.min(1, elapsed1 / cd1Ms);

    // Parametri Special 2
    const lastUsed2 = gameState.specialLastUsed2 || gameState.specialLastUsed;
    const cd2Ms = (gameState.specialCooldown2 || gameState.specialCooldown) * 1000;
    const elapsed2 = now - lastUsed2;
    const perc2 = Math.min(1, elapsed2 / cd2Ms);

    // 3. DISEGNO DELLE BARRETTE SOTTO IL PLAYER
    const barWidth = 40;
    const barHeight = 4;
    const x = gameState.playerX - barWidth / 2;
    const y = gameState.playerY + 28; // Posizionamento verticale sotto lo sprite

    ctx.save();

    // --- BARRA 1 (Raggio Viola) ---
    // Sfondo barra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    if (perc1 < 1) {
        ctx.fillStyle = '#8a2be2'; // Colore viola mentre carica
        ctx.fillRect(x, y, barWidth * perc1, barHeight);
    } else {
        ctx.fillStyle = '#ffffff'; // Bianco quando è pronta
        ctx.fillRect(x, y, barWidth, barHeight);
    }

    // --- BARRA 2 (Raggio Verde/Azzurro) ---
    const y2 = y + barHeight + 3; // 3 pixel di spazio tra le due barre
    
    // Sfondo barra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y2, barWidth, barHeight);
    
    if (perc2 < 1) {
        ctx.fillStyle = '#00ffcc'; // Colore turchese mentre carica
        ctx.fillRect(x, y2, barWidth * perc2, barHeight);
    } else {
        ctx.fillStyle = '#ffffff'; // Bianco quando è pronta
        ctx.fillRect(x, y2, barWidth, barHeight);
    }

    ctx.restore();
}
