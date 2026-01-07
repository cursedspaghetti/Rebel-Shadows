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

    // 1. Draw Player Trail
    gameState.playerTrail.forEach((pos, index) => {
        const alpha = index / 25;
        ctx.strokeStyle = ringColor;
        ctx.globalAlpha = alpha * 0.2;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, playerSize * (1 + alpha * 0.5), 0, Math.PI * 2);
        ctx.stroke();
    });

    ctx.globalAlpha = 1.0;

    // 2. Draw Main Player Ring with Glow
    ctx.shadowColor = ringColor;
    ctx.shadowBlur = 22;
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(gameState.playerX, gameState.playerY, playerSize, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Reset and Draw Outer Border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(gameState.playerX, gameState.playerY, playerSize + 8, 0, Math.PI * 2);
    ctx.stroke();
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
