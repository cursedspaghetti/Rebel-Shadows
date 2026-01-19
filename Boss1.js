import { CONFIG, gameState } from './config.js';

// --- FUNZIONE PRINCIPALE PER DISEGNARE IL BOSS ---
export function drawBossShadow(ctx, boss, img) {
    if (!img.complete) return;

    const totalFrames = 9;
    const frameDuration = 100; 
    const originalSize = 400;  
    
    const frameIndex = Math.floor((Date.now() / frameDuration) % totalFrames);
    const floatOffset = Math.sin(Date.now() * 0.003) * 10;

    // --- 1. DISEGNO IL BOSS (Relativo alla sua posizione nel mondo) ---
    ctx.save();
    
    // Applichiamo le trasformazioni solo al corpo del boss
    ctx.translate(boss.x, boss.y + floatOffset);
    ctx.scale(0.5, 0.5); 

    const sx = Math.floor(frameIndex * originalSize);
    ctx.drawImage(
        img,
        sx, 0,                                
        originalSize, originalSize,           
        -originalSize / 2, -originalSize / 2,  
        originalSize, originalSize            
    );

    ctx.restore(); // Reset delle trasformazioni (niente più coordinate relative al boss)

    // --- 2. DISEGNO LA BARRA HUD (Fissa sullo schermo) ---
    // La chiamiamo fuori dal save/restore del boss così usa le coordinate reali del canvas
    drawBossUI(ctx, boss);
}

// --- FUNZIONE PER L'INTERFACCIA (BARRA FISSA) ---
function drawBossUI(ctx, boss) {
    // Calcolo percentuale vita
    const healthPercent = Math.max(0, (boss.hp || 0) / (boss.maxHp || 100));
    
    // Configurazione dimensioni barra (60% della larghezza totale del gioco)
    const barWidth = ctx.canvas.width * 0.6;
    const barHeight = 16;
    
    // Centratura orizzontale
    const x = (ctx.canvas.width - barWidth) / 2;
    const y = 30; // Distanza dal bordo superiore dello schermo

    ctx.save();

    // 1. Ombra della barra (per farla risaltare)
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'black';

    // 2. Sfondo della barra (Semicoprente)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    ctx.shadowBlur = 0; // Togliamo l'ombra per il contenuto interno

    // 3. Salute (Colore principale: Viola/Fucsia)
    // Usiamo un gradiente per renderla più moderna
    const gradient = ctx.createLinearGradient(x, 0, x + barWidth, 0);
    gradient.addColorStop(0, '#8000ff'); // Viola scuro
    gradient.addColorStop(1, '#ff00ff'); // Fucsia acceso
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    // 4. Bordo della barra
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // 5. Nome del Boss sopra la barra
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Orbitron, Arial'; // Orbitron è ottimo per i giochi, se caricato
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'black';
    ctx.fillText("SHADOW GUARDIAN", ctx.canvas.width / 2, y - 10);

    ctx.restore();
}
