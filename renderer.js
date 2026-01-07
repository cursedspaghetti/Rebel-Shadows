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
    const playerSize = 18; // Aumentato a 18 come richiesto
    const ringColor = gameState.selectedRingColor || '#fff';
    
    // Calcolo dinamico dell'inclinazione e della rotazione
    const tiltX = (gameState.playerDx || 0) * 0.1; 
    const rotationZ = (Date.now() * 0.003); 

    ctx.save();
    ctx.translate(gameState.playerX, gameState.playerY);
    
    // Inclinazione basata sul movimento
    ctx.rotate(tiltX);

    // --- 1. CORPO ANELLO 3D ---
    // Spessore (prospettiva laterale)
    ctx.lineWidth = 10; // Leggermente più spesso per adattarsi alla nuova taglia
    ctx.strokeStyle = ringColor;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.ellipse(0, 5, playerSize, playerSize * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Anello Principale (Faccia superiore)
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = ringColor;
    ctx.shadowBlur = 18; // Bagliore aumentato per le dimensioni maggiori
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.ellipse(0, 0, playerSize, playerSize * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();

    // --- 2. LETTERE "RUNICHE" (V, X, I, Z) ---
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'white';
    ctx.fillStyle = 'white'; 
    ctx.font = 'bold 11px "Courier New", monospace'; // Font ingrandito per playerSize 18
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const symbols = ['V', 'X', 'I', 'Z', 'X', 'V'];
    const numSymbols = symbols.length;

    for (let i = 0; i < numSymbols; i++) {
        const angle = (i / numSymbols) * Math.PI * 2 + rotationZ;
        
        // Posizionamento sull'ellisse
        const rx = Math.cos(angle) * playerSize;
        const ry = Math.sin(angle) * (playerSize * 0.7);

        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(angle + Math.PI / 2); 
        
        // Pulsazione luminosa
        ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.005 + i) * 0.4;
        ctx.fillText(symbols[i], 0, 0);
        ctx.restore();
    }

    // --- 3. BORDI E RIFLESSI ---
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;

    // Riflesso superiore
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, playerSize - 3, (playerSize - 3) * 0.7, 0, -Math.PI/3, 0);
    ctx.stroke();

    // Bordo esterno di contrasto nero
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, playerSize + 7, (playerSize + 7) * 0.7, 0, 0, Math.PI * 2);
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
