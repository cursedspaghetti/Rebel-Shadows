import { CONFIG, gameState } from './config.js';

/**
 * Aggiorna la logica del Boss: movimento e attacco
 */
export function updateBoss(boss) {
    if (!boss || boss.hp <= 0) return;

    // 1. INIZIALIZZAZIONE (se mancano le proprietà)
    if (boss.targetX === undefined) boss.targetX = boss.x;
    if (boss.lastShot === undefined) boss.lastShot = Date.now();

    // 2. MOVIMENTO CASUALE (Solo orizzontale, parte alta)
    // Se il boss è vicino alla destinazione, ne sceglie una nuova
    if (Math.abs(boss.x - boss.targetX) < 10) {
        // Resta entro i margini del canvas
        boss.targetX = Math.random() * (CONFIG.CANVAS_WIDTH - 200) + 100;
    }

    // Movimento fluido verso il target (Interpolazione lineare)
    boss.x += (boss.targetX - boss.x) * 0.02;

    // Mantiene un'altezza fissa nella parte alta
    boss.y = 150; 

    // 3. LOGICA DI ATTACCO (Lancio nemici)
    const now = Date.now();
    const shootInterval = 2000; // Un proiettile ogni 2 secondi

    if (now - boss.lastShot > shootInterval) {
        spawnBossBullet(boss.x, boss.y + 20);
        boss.lastShot = now;
    }
}

/**
 * Crea un nemico che funge da proiettile partendo dal boss
 */
function spawnBossBullet(x, y) {
    const size = 35 + Math.random() * 15; // Leggermente più piccoli dei nemici normali
    gameState.enemies.push({
        x: x,
        y: y,
        size: size,
        speed: 3 + Math.random() * 2, // Velocità di discesa
        color: '#8a2be2',
        isBossBullet: true // Flag opzionale se vuoi distinguerli
    });
}

/**
 * Disegna il Boss e la sua interfaccia
 */
export function drawBossShadow(ctx, boss, img) {
    if (!img.complete || boss.hp <= 0) return;

    const totalFrames = 9;
    const frameDuration = 100; 
    const originalSize = 400;  
    
    const frameIndex = Math.floor((Date.now() / frameDuration) % totalFrames);
    const floatOffset = Math.sin(Date.now() * 0.003) * 15; // Oscillazione verticale

    // --- 1. DISEGNO IL CORPO DEL BOSS ---
    ctx.save();
    
    // Posizionamento e scaling
    ctx.translate(boss.x, boss.y + floatOffset);
    ctx.scale(0.6, 0.6); 

    const sx = Math.floor(frameIndex * originalSize);
    ctx.drawImage(
        img,
        sx, 0,                                
        originalSize, originalSize,           
        -originalSize / 2, -originalSize / 2,  
        originalSize, originalSize            
    );

    ctx.restore();

    // --- 2. DISEGNO L'INTERFACCIA (BARRA HP) ---
    drawBossUI(ctx, boss);
}

/**
 * Disegna la barra della salute fissa in alto
 */
function drawBossUI(ctx, boss) {
    const healthPercent = Math.max(0, (boss.hp || 0) / (boss.maxHp || 100));
    const barWidth = ctx.canvas.width * 0.6;
    const barHeight = 16;
    const x = (ctx.canvas.width - barWidth) / 2;
    const y = 40; 

    ctx.save();

    // Sfondo barra (ombra)
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(128, 0, 255, 0.5)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.shadowBlur = 0;

    // Gradiente salute
    const gradient = ctx.createLinearGradient(x, 0, x + barWidth, 0);
    gradient.addColorStop(0, '#4b0082'); // Indigo
    gradient.addColorStop(0.5, '#8a2be2'); // BlueViolet
    gradient.addColorStop(1, '#ff00ff'); // Fuchsia
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    // Bordo
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Testo Nome Boss
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'black';
    ctx.fillText("SHADOW GUARDIAN", ctx.canvas.width / 2, y - 12);

    ctx.restore();
}
