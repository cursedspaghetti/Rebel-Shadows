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
    const playerSize = 12;
    const ringColor = gameState.selectedRingColor || '#fff';
    
    // Calcoliamo l'inclinazione in base alla velocità (supponendo di avere gameState.dx e dy)
    // Se non hai dx/dy, dovrai calcolarli come differenza tra posizione attuale e precedente.
    const tiltX = (gameState.playerDx || 0) * 0.1; 
    const tiltY = (gameState.playerDy || 0) * 0.1;

    ctx.save();
    ctx.translate(gameState.playerX, gameState.playerY);

    // 1. Disegna la scia (opzionale, mantenuta dal tuo codice)
    // ... (puoi inserire qui il tuo codice trail esistente, ma ricordati di usare ctx.restore/save se necessario)

    // --- EFFETTO 3D ---
    
    // 2. Disegna lo "spessore" dell'anello (Lati)
    // Creiamo un leggero offset per simulare la profondità
    ctx.lineWidth = 8;
    ctx.strokeStyle = ringColor;
    ctx.globalAlpha = 0.4; // Più scuro per i lati
    
    ctx.beginPath();
    // Disegniamo l'anello leggermente spostato e inclinato
    ctx.ellipse(0, 4, playerSize, playerSize * 0.8, tiltX, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Disegna la faccia superiore (Top Ring) con Glow
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = ringColor;
    ctx.shadowBlur = 15;
    ctx.lineWidth = 8;
    
    ctx.beginPath();
    // L'ellisse si schiaccia e ruota in base al movimento
    // ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle)
    ctx.ellipse(0, 0, playerSize, playerSize * 0.9, tiltX, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Riflesso di luce superiore (Dà il tocco finale 3D)
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, playerSize - 2, -Math.PI / 4, Math.PI / 4);
    ctx.stroke();

    // 5. Bordo esterno nero per contrasto
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, playerSize + 5, (playerSize + 5) * 0.9, tiltX, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
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
