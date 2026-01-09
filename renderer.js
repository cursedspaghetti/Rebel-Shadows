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

    // --- CONFIGURAZIONE FRAME ---
    const totalFrames = 9; 
    const frameDuration = 100; // Velocità aumentata a 100ms
    
    // Calcolo del frame attuale
    const frameIndex = Math.floor(Date.now() / frameDuration) % totalFrames;
    
    // Dimensioni originali del singolo frame nello sprite sheet
    const frameWidth = img.width / totalFrames;
    const frameHeight = img.height;

    // Oscillazione verticale (Floating effect)
    const floatOffset = Math.sin(Date.now() * 0.002) * 15;
    
    ctx.save();
    // Spostiamo l'origine del contesto sulla posizione del boss
    ctx.translate(boss.x, boss.y + floatOffset);

    // 1. Ombra alla base (proporzionale al frame)
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.ellipse(0, frameHeight / 2, frameWidth * 0.4, frameHeight * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Bagliore Aura
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = '#9d00ff';
    ctx.shadowBlur = 30;

    // 3. DISEGNO DEL FRAME (Senza resizing)
    ctx.drawImage(
        img, 
        frameIndex * frameWidth, 0,     // Sorgente (ritaglio X, Y)
        frameWidth, frameHeight,        // Sorgente (larghezza, altezza)
        -frameWidth / 2, -frameHeight / 2, // Destinazione (centratura sul canvas)
        frameWidth, frameHeight         // Destinazione (dimensioni reali)
    );

    // 4. Barra della Vita
    ctx.shadowBlur = 0;
    drawBossHealthBar(ctx, boss, frameWidth, frameHeight);

    ctx.restore();
}

function drawBossHealthBar(ctx, boss, w, h) {
    const barWidth = w * 0.8; 
    const barHeight = 6;
    const healthPercent = Math.max(0, boss.hp / boss.maxHp);

    ctx.fillStyle = '#440000';
    ctx.fillRect(-barWidth / 2, -h / 2 - 20, barWidth, barHeight);
    ctx.fillStyle = '#cc00ff';
    ctx.fillRect(-barWidth / 2, -h / 2 - 20, barWidth * healthPercent, barHeight);
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
