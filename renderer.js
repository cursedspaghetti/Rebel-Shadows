import { CONFIG, gameState } from './config.js';

/**
 * Main Renderer Module
 */

export function drawStartScreen(ctx) {
    // Clear background
    ctx.fillStyle = '#000033';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    gameState.rings.forEach(ring => {
        // 1. Update/Draw Trail
        const maxTrailLength = 25;
        ring.trail.push({ x: ring.x, y: ring.y });
        if (ring.trail.length > maxTrailLength) ring.trail.shift();

        ring.trail.forEach((pos, index) => {
            const alpha = index / maxTrailLength;
            ctx.strokeStyle = ring.color;
            ctx.globalAlpha = alpha * 0.5;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, (ring.size * (1 + alpha)) / 2, 0, Math.PI * 2);
            ctx.stroke();
        });

        // 2. Glow Effect
        ctx.globalAlpha = 1.0;
        ctx.shadowColor = ring.color;
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 10;

        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.size, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Reset Shadows and Draw Black Border
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.size + 4, 0, Math.PI * 2);
        ctx.stroke();
    });
}

export function drawPlayer(ctx) {
    const playerSize = 18; 
    const ringColor = gameState.selectedRingColor || '#fff';
    
    // 1. CALCOLO ROTAZIONE RUNE
    const rotationZ = (Date.now() * 0.002); 
    
    // Rapporto ellisse per 30 gradi di inclinazione (circa 0.85)
    // Più il valore è vicino a 1, più l'anello sembra visto dall'alto (90°)
    const perspectiveY = 0.85;

    ctx.save();
    ctx.translate(gameState.playerX, gameState.playerY);

    // --- 2. STRUTTURA ANELLO 3D ---
    // Spessore (Base dell'anello)
    // Con 30° di inclinazione, lo spessore visibile diminuisce
    ctx.lineWidth = 10;
    ctx.strokeStyle = ringColor;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.ellipse(0, 4, playerSize, playerSize * perspectiveY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Anello Principale (Faccia superiore)
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = ringColor;
    ctx.shadowBlur = 15; 
    ctx.lineWidth = 8;
    ctx.strokeStyle = ringColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, playerSize, playerSize * perspectiveY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // --- 3. RUNE MAGICHE (SCURE) ---
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply'; 
    
    ctx.fillStyle = ringColor; 
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const runes = ['ᚩ', 'ᚱ', 'ᚻ', 'ᛃ', 'ᛊ', 'ᛏ']; 
    const numRunes = runes.length;

    for (let i = 0; i < numRunes; i++) {
        const angle = (i / numRunes) * Math.PI * 2 + rotationZ;
        
        // Posizionamento delle rune sulla nuova ellisse più circolare
        const rx = Math.cos(angle) * playerSize;
        const ry = Math.sin(angle) * (playerSize * perspectiveY);

        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(angle + Math.PI / 2); 
        
        // Disegno runa (colore base scurito)
        ctx.fillText(runes[i], 0, 0);
        
        // Rinforzo tono scuro
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = 'black';
        ctx.fillText(runes[i], 0, 0);
        
        ctx.restore();
    }
    ctx.restore();

    // --- 4. RIFLESSO SUPERIORE ---
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Riflesso più ampio dato che l'anello è più "aperto"
    ctx.ellipse(0, -1, playerSize - 4, (playerSize - 4) * perspectiveY, 0, -Math.PI * 0.7, -Math.PI * 0.3);
    ctx.stroke();

    ctx.restore();
}


export function drawBossShadow(ctx, boss, img) {
    if (!img.complete) return;

    // --- CONFIGURAZIONE ---
    const totalFrames = 9;
    const frameDuration = 100; // 100ms per frame
    const originalSize = 400;  // Dimensione originale del frame (400x400)
    
    // Calcolo del frame con protezione per gli scatti
    // Usiamo il resto della divisione intera per assicurarci che l'indice sia fluido
    const frameIndex = Math.floor((Date.now() / frameDuration) % totalFrames);
    
    // Oscillazione (Float effect)
    const floatOffset = Math.sin(Date.now() * 0.003) * 10;

    ctx.save();
    
    // 1. POSIZIONAMENTO E SCALA
    ctx.translate(boss.x, boss.y + floatOffset);
    ctx.scale(0.5, 0.5); // Dimezza le dimensioni totali (il boss diventa 200x200)

    // 2. OMBRA ALLA BASE
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.ellipse(0, originalSize / 2.5, 120, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. BAGLIORE AURA
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = '#9d00ff';
    ctx.shadowBlur = 40; // Aumentato perché la scala lo ridurrà visivamente

    // 4. DISEGNO DEL FRAME (Rapporto 1:1)
    // Usiamo Math.floor per le coordinate di ritaglio per evitare flickering
    const sx = Math.floor(frameIndex * originalSize);
    
    ctx.drawImage(
        img,
        sx, 0,                      // Sorgente (X, Y)
        originalSize, originalSize,  // Dimensioni sorgente (400x400)
        -originalSize / 2, -originalSize / 2, // Posizione centrata
        originalSize, originalSize   // Dimensioni destinazione (disegna 400x400, scalato dal ctx)
    );

    // 5. BARRA DELLA VITA
    ctx.shadowBlur = 0;
    drawBossHealthBar(ctx, boss, originalSize);

    ctx.restore();
}

function drawBossHealthBar(ctx, boss, size) {
    const barWidth = 250; // Leggermente più larga perché siamo in scala 0.5
    const barHeight = 12;
    const healthPercent = Math.max(0, boss.hp / boss.maxHp);

    // Posizionata sopra la testa (size / 2 + margine)
    const yPos = -size / 2 - 40;

    ctx.fillStyle = '#440000';
    ctx.fillRect(-barWidth / 2, yPos, barWidth, barHeight);
    ctx.fillStyle = '#cc00ff';
    ctx.fillRect(-barWidth / 2, yPos, barWidth * healthPercent, barHeight);
}

export function drawBullets(ctx) {
    gameState.bullets.forEach(bullet => {
        ctx.save();
        const width = bullet.size;
        const height = bullet.size * 4;

        let gradient = ctx.createRadialGradient(
            bullet.x, bullet.y, 0,
            bullet.x, bullet.y, height / 2
        );
        
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.2, '#ff0');
        gradient.addColorStop(0.5, 'red');
        gradient.addColorStop(1, 'transparent');

        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f40';
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.ellipse(bullet.x, bullet.y, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

export function drawSpecialRay(ctx) {
    const ray = gameState.specialRay;
    if (!ray || !ray.active) return;

    const drawX = ray.x - (ray.currentWidth / 2);
    const rayHeight = gameState.playerY;

    // 1. Beam Gradient
    let gradient = ctx.createLinearGradient(drawX, 0, drawX + ray.currentWidth, 0);
    gradient.addColorStop(0, 'rgba(139, 0, 0, 0)');
    gradient.addColorStop(0.2, 'rgba(255, 0, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.9)');
    gradient.addColorStop(0.8, 'rgba(255, 0, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');

    ctx.shadowBlur = 20;
    ctx.shadowColor = "red";
    ctx.fillStyle = gradient;
    ctx.fillRect(drawX, 0, ray.currentWidth, rayHeight);

    // 2. Hot Core
    const coreWidth = ray.currentWidth * 0.2;
    ctx.fillStyle = "white";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "yellow";
    ctx.fillRect(ray.x - (coreWidth / 2), 0, coreWidth, rayHeight);
    ctx.restore();
    ctx.shadowBlur = 0;
}

export function drawChargeEffect(ctx) {
    ctx.beginPath();
    ctx.arc(gameState.playerX, gameState.playerY, 30, 0, Math.PI * 2);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.stroke();
}

export function drawUI(ctx) {
    ctx.fillStyle = '#fff';
    ctx.font = '20px Courier New, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`TIME: ${gameState.gameTimer}`, 10, 30);

    const now = Date.now() / 1000;
    let remainingCooldown = Math.max(0, (gameState.specialLastUsed + gameState.specialCooldown) - now);
    ctx.textAlign = 'right';
    ctx.fillText(`SPECIAL: ${remainingCooldown > 0 ? remainingCooldown.toFixed(1) + 's' : 'READY'}`,
        CONFIG.CANVAS_WIDTH - 10, 30);
}
