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
