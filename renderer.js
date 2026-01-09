import { CONFIG, gameState } from './config.js';

// --- FUNZIONE RENDERING BOSS ---
export function drawBossShadow(ctx, boss, img) {
    if (!img || !img.complete) return;

    // Oscillazione verticale fluida (float)
    const floatOffset = Math.sin(Date.now() * 0.002) * 15; 
    
    ctx.save();
    ctx.translate(boss.x, boss.y + floatOffset);

    // 1. Ombra proiettata a terra (ellisse sfocata)
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.ellipse(0, boss.size / 1.5, boss.size * 0.8, boss.size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Bagliore Aura Boss (Viola Neon)
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = '#9d00ff';
    ctx.shadowBlur = 40; 

    // 3. Disegno Sprite Boss
    ctx.drawImage(img, -boss.size / 2, -boss.size / 2, boss.size, boss.size);

    // 4. Barra della Vita (HP Bar)
    ctx.shadowBlur = 0;
    const barWidth = 120;
    const barHeight = 8;
    const healthPercent = Math.max(0, boss.hp / boss.maxHp);

    // Sfondo barra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(-barWidth / 2, -boss.size / 2 - 30, barWidth, barHeight);
    
    // Vita attuale (Gradiante o colore pieno)
    ctx.fillStyle = healthPercent > 0.3 ? '#cc00ff' : '#ff0055'; // Diventa rossa se bassa
    ctx.fillRect(-barWidth / 2, -boss.size / 2 - 30, barWidth * healthPercent, barHeight);

    ctx.restore();
}

// --- FUNZIONE RENDERING GIOCATORE (ANELLO 30°) ---
export function drawPlayer(ctx) {
    const playerSize = 18; 
    const ringColor = gameState.selectedRingColor || '#fff';
    const rotationZ = (Date.now() * 0.002); 
    const perspectiveY = 0.85; // Angolazione 30 gradi

    ctx.save();
    ctx.translate(gameState.playerX, gameState.playerY);

    // 1. Spessore 3D (Base)
    ctx.lineWidth = 10;
    ctx.strokeStyle = ringColor;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.ellipse(0, 4, playerSize, playerSize * perspectiveY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Anello Principale
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = ringColor;
    ctx.shadowBlur = 15; 
    ctx.lineWidth = 8;
    ctx.strokeStyle = ringColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, playerSize, playerSize * perspectiveY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Rune Scure (Incise)
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply'; 
    ctx.fillStyle = ringColor; 
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const runes = ['ᚩ', 'ᚱ', 'ᚻ', 'ᛃ', 'ᛊ', 'ᛏ']; 
    for (let i = 0; i < runes.length; i++) {
        const angle = (i / runes.length) * Math.PI * 2 + rotationZ;
        const rx = Math.cos(angle) * playerSize;
        const ry = Math.sin(angle) * (playerSize * perspectiveY);

        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(angle + Math.PI / 2); 
        ctx.fillText(runes[i], 0, 0);
        
        // Scurimento extra
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = 'black';
        ctx.fillText(runes[i], 0, 0);
        ctx.restore();
    }
    ctx.restore();

    // 4. Riflesso superiore
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -1, playerSize - 4, (playerSize - 4) * perspectiveY, 0, -Math.PI * 0.7, -Math.PI * 0.3);
    ctx.stroke();

    ctx.restore();
}

// --- ALTRE FUNZIONI DI SUPPORTO ---
export function drawBullets(ctx) {
    gameState.bullets.forEach(bullet => {
        ctx.fillStyle = gameState.selectedRingColor || '#fff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

export function drawUI(ctx) {
    ctx.fillStyle = "white";
    ctx.font = "20px 'Courier New'";
    ctx.shadowBlur = 0;
    ctx.fillText(`Time: ${gameState.gameTimer}s`, 20, 40);
}

export function drawStartScreen(ctx) {
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    // Logica per i cerchi di sfondo della start screen (opzionale)
}
