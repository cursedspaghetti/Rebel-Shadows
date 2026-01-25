import { CONFIG, gameState } from './config.js';

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
        gameState.rayParticles2 = [];
        return;
    }

    const rayHeight = gameState.playerY;
    const bottomWidth = ray.currentWidth2; 
    // Aumentato il moltiplicatore da 4 a 8 per un cono molto più ampio
    const topWidth = ray.currentWidth2 * 8; 

    // --- LOGICA PARTICELLE (Palette Viola/Nero) ---
    if (ray.currentWidth2 > 10) { 
        for (let i = 0; i < 3; i++) {
            const progress = Math.random(); 
            const currentWidthAtY = topWidth + (bottomWidth - topWidth) * progress;
            
            gameState.rayParticles2.push({
                x2: ray.x2 + (Math.random() - 0.5) * currentWidthAtY,
                y2: progress * rayHeight,
                size2: Math.random() * 4 + 1,
                speedX2: (Math.random() - 0.5) * 2,
                speedY2: -Math.random() * 5 - 2,
                life2: 1.0,
                decay2: Math.random() * 0.05 + 0.02
            });
        }
    }

    // Disegno particelle con ombre nere come richiesto
    ctx.save();
    gameState.rayParticles2.forEach((p, index) => {
        ctx.fillStyle = `rgba(138, 43, 226, ${p.life2})`;
        ctx.shadowBlur = 5;
        ctx.shadowColor = "black";
        ctx.beginPath();
        ctx.arc(p.x2, p.y2, p.size2, 0, Math.PI * 2);
        ctx.fill();

        p.x2 += p.speedX2; 
        p.y2 += p.speedY2; 
        p.life2 -= p.decay2;
        if (p.life2 <= 0) gameState.rayParticles2.splice(index, 1);
    });
    ctx.restore();

    // --- DISEGNO DEL RAGGIO A CONO (Palette Originale) ---
    ctx.save();
    
    // Trapezio per il corpo del raggio
    ctx.beginPath();
    ctx.moveTo(ray.x2 - topWidth / 2, 0);               
    ctx.lineTo(ray.x2 + topWidth / 2, 0);               
    ctx.lineTo(ray.x2 + bottomWidth / 2, rayHeight);    
    ctx.lineTo(ray.x2 - bottomWidth / 2, rayHeight);    
    ctx.closePath();

    // Gradiente con la palette del primo raggio (più scuro e profondo)
    // Usiamo topWidth per assicurarci che il gradiente copra tutta l'apertura
    let gradient = ctx.createLinearGradient(ray.x2 - topWidth/2, 0, ray.x2 + topWidth/2, 0);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.2, 'rgba(48, 0, 65, 0.8)');   // Deep Purple
    gradient.addColorStop(0.5, 'rgba(10, 0, 20, 0.95)');  // Near Black
    gradient.addColorStop(0.8, 'rgba(75, 0, 130, 0.8)');  // Indigo
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.shadowBlur = 30;
    ctx.shadowColor = "#4b0082";
    ctx.fillStyle = gradient;
    ctx.fill(); 

    // Core instabile (più luminoso al centro)
    const jitter = Math.random() * 4;
    const coreTop = (topWidth * 0.15) + jitter;
    const coreBottom = (bottomWidth * 0.15) + jitter;

    ctx.beginPath();
    ctx.moveTo(ray.x2 - coreTop / 2, 0);
    ctx.lineTo(ray.x2 + coreTop / 2, 0);
    ctx.lineTo(ray.x2 + coreBottom / 2, rayHeight);
    ctx.lineTo(ray.x2 - coreBottom / 2, rayHeight);
    ctx.closePath();

    ctx.fillStyle = "#e0b0ff"; // Lavender core
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff00ff";
    ctx.fill();
    
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

export function updateSpecialRay() {
    if (!gameState.specialRay.active) return;

    const ray = gameState.specialRay;
    const now = Date.now() / 1000;
    const elapsed = now - ray.startTime;

    if (elapsed < ray.duration) {
        const lifeLeft = 1 - (elapsed / ray.duration);
        ray.currentWidth = ray.maxWidth * lifeLeft;
        ray.x = gameState.playerX; 
    } else {
        ray.active = false;
    }
}

export function updateSpecialRay2() {
    if (!gameState.specialRay2.active2) return;

    const ray = gameState.specialRay2;
    const now = Date.now() / 1000;
    const elapsed = now - ray.startTime2;

    if (elapsed < ray.duration2) {
        const lifeLeft = 1 - (elapsed / ray.duration2);
        ray.currentWidth2 = ray.maxWidth2 * lifeLeft;
        ray.x2 = gameState.playerX; 
    } else {
        ray.active2 = false;
    }
}
