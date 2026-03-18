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


export function drawChargeEffect(ctx, chargeImg) {
    if (chargeImg.complete && chargeImg.naturalWidth !== 0) {
        
        const scaleX = 0.09; 
        const scaleY = 0.11; 
        
        const width = chargeImg.width * scaleX;
        const height = chargeImg.height * scaleY;

        ctx.save();

        // 1. Spostiamo l'origine sul giocatore per facilitare rotazioni o effetti
        ctx.translate(gameState.playerX, gameState.playerY - 20);

        // 2. SETTAGGI PER IL GLOW INTENSO
        // Usiamo 'lighter' per far sì che i colori si sommino (effetto energia pura)
        ctx.globalCompositeOperation = 'lighter';
        
        // Configurazione ombra per il bagliore esterno (modifica il colore in base alla carica)
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(0, 150, 255, 1)'; // Un blu elettrico, ad esempio
        
        // 3. PULSAZIONE (Opzionale ma consigliata)
        // Crea un leggero effetto "respiro" usando il tempo
        const pulse = 1 + Math.sin(Date.now() / 100) * 0.1;
        
        // 4. DISEGNO DELLO SPRITE
        // Disegniamo lo sprite leggermente più grande e trasparente per il glow
        ctx.globalAlpha = 0.8;
        ctx.drawImage(
            chargeImg, 
            - (width * pulse) / 2, 
            - (height * pulse) / 2, 
            width * pulse, 
            height * pulse
        );

        // Disegniamo un secondo strato più piccolo e opaco per il nucleo
        ctx.globalAlpha = 1.0;
        ctx.drawImage(
            chargeImg, 
            -width / 2, 
            -height / 2, 
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

    if (elapsed < ray.Special_Duration) {
        const lifeLeft = 1 - (elapsed / ray.Special_Duration);
        ray.currentWidth = ray.Special_Width * lifeLeft;
        ray.x = gameState.playerX; 
    } else {
        ray.active = false;
    }
}


// --- SPECIAL ATTACK SEQUENCES ---
export function fireSpecialAttackSequence() {
    if (gameState.specialOnCooldown || gameState.isCharging) return;
    gameState.isCharging = true;
    setTimeout(() => {
        gameState.specialRay.active = true;
        gameState.specialRay.startTime = Date.now() / 1000;
        gameState.specialRay.x = gameState.playerX;
        gameState.specialOnCooldown = true;
        gameState.specialLastUsed = Date.now() / 1000;
        setTimeout(() => gameState.specialOnCooldown = false, gameState.Special_CD * 1000);
        setTimeout(() => gameState.isCharging = false, gameState.specialRay.Special_Duration * 1000);
    }, 1000);
}


export function activateShield() {
    const now = Date.now() / 1000;
    if (gameState.shieldOnCooldown) return;

    gameState.shieldActive = true;
    gameState.shieldStartTime = now;
    gameState.shieldLastUsed = now;
    gameState.shieldOnCooldown = true;
}

export function updateShield() {
    if (!gameState.shieldActive) {
        // Gestione Cooldown
        const now = Date.now() / 1000;
        if (gameState.shieldOnCooldown && now - gameState.shieldLastUsed > gameState.Shield_CD) {
            gameState.shieldOnCooldown = false;
        }
        return;
    }

    const now = Date.now() / 1000;
    const elapsed = now - gameState.shieldStartTime;

    if (elapsed >= gameState.Shield_Duration) {
        gameState.shieldActive = false;
    }
}

export function drawShield(ctx) {
    if (!gameState.shieldActive) return;

    // 1. Pixel Art Settings
    const pixelSize = 4;        // Dimensione del "pixel"
    const radius = 12;          // Raggio fisso

    ctx.save();
    
    // 2. Colore del Bordo (Grigio scuro, coerente con lo stile precedente)
    // Se lo vuoi ancora più scuro, quasi nero, usa #1a1a1a
    ctx.fillStyle = "#333333"; 

    // Iterazione sulla griglia per disegnare SOLO l'anello
    for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
            const distanceSquared = x * x + y * y;
            const radiusSquared = radius * radius;
            const innerRadiusSquared = (radius - 1) * (radius - 1);
            
            // CONDIZIONE CAMBIATA:
            // Disegniamo il pixel SOLO se è dentro il raggio esterno
            // MA fuori dal raggio interno (creando un anello spesso 1 pixelSize)
            if (distanceSquared <= radiusSquared && distanceSquared > innerRadiusSquared) {
                
                ctx.fillRect(
                    gameState.playerX + x * pixelSize, 
                    gameState.playerY + y * pixelSize, 
                    pixelSize, pixelSize
                );
            }
            // Altrimenti non disegniamo nulla, lasciando l'interno trasparente.
        }
    }

    ctx.restore();
}
