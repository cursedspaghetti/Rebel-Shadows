import { CONFIG, gameState } from './config.js';

/**
 * LOGICA PRINCIPALE: Aggiorna movimento e attacchi
 */
export function updateBoss(boss) {
    if (!boss || boss.hp <= 0) return;

    const now = Date.now();

    // 1. GESTIONE MOVIMENTO (DASH vs FLOATING)
    if (boss.isDashing) {
        boss.x += boss.dashVX;
        boss.y += boss.dashVY;

        // Reset posizione se esce dai bordi
        if (boss.y > CONFIG.CANVAS_HEIGHT + 150 || boss.x < -150 || boss.x > CONFIG.CANVAS_WIDTH + 150) {
            boss.isDashing = false;
            boss.y = -150; 
            boss.targetX = CONFIG.CANVAS_WIDTH / 2;
        }
    } else {
        // Entrata in scena (scende dall'alto)
        if (boss.y < 150) boss.y += 4;
        else boss.y = 150;

        // Movimento orizzontale "fluuttuante"
        if (Math.abs(boss.x - boss.targetX) < 10) {
            boss.targetX = Math.random() * (CONFIG.CANVAS_WIDTH - 200) + 100;
        }
        boss.x += (boss.targetX - boss.x) * 0.02;

        // 2. LOGICA ATTACCHI
        // Attacco base: Proiettile singolo mirato o dritto
        if (now - boss.lastShot > 2000) {
            spawnBossBullet(boss.x, boss.y + 20);
            boss.lastShot = now;
        }

        // Attacco Radiale: Cerchio di proiettili
        const radialInterval = CONFIG.BOSS_ATTACKS.RADIAL_INTERVAL[0] + Math.random() * 3000;
        if (now - boss.lastRadialShot > radialInterval) {
            spawnRadialAttack(boss.x, boss.y);
            boss.lastRadialShot = now;
        }

        // Dash: Carica verso il giocatore
        const dashInterval = CONFIG.BOSS_ATTACKS.DASH_INTERVAL[0] + Math.random() * 6000;
        if (now - boss.lastDash > dashInterval) {
            startDash(boss);
            boss.lastDash = now;
        }
    }
}

/**
 * RENDERING: Disegna il boss, animazioni e UI
 */
export function drawBossShadow(ctx, boss, img) {
    if (!img.complete || boss.hp <= 0) return;

    const totalFrames = 9;
    const frameDuration = 100; 
    const originalSize = 400;  
    
    const frameIndex = Math.floor((Date.now() / frameDuration) % totalFrames);
    const floatOffset = boss.isDashing ? 0 : Math.sin(Date.now() * 0.003) * 15;

    ctx.save();
    
    // Posizionamento e scaling
    ctx.translate(boss.x, boss.y + floatOffset);
    
    // Rotazione se in fase di Dash
    if (boss.isDashing) {
        const angle = Math.atan2(boss.dashVY, boss.dashVX);
        ctx.rotate(angle + Math.PI / 2);
    }

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

    // Disegna la barra HP fissa in alto
    drawBossUI(ctx, boss);
}

/**
 * UI: Barra della salute fissa
 */
function drawBossUI(ctx, boss) {
    const healthPercent = Math.max(0, (boss.hp || 0) / (boss.maxHp || 100));
    const barWidth = ctx.canvas.width * 0.6;
    const barHeight = 16;
    const x = (ctx.canvas.width - barWidth) / 2;
    const y = 40; 

    ctx.save();
    // Effetto bagliore
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(128, 0, 255, 0.5)';
    
    // Sfondo barra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Gradiente HP
    const gradient = ctx.createLinearGradient(x, 0, x + barWidth, 0);
    gradient.addColorStop(0, '#4b0082');
    gradient.addColorStop(0.5, '#8a2be2');
    gradient.addColorStop(1, '#ff00ff');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
    
    // Bordo
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Titolo Boss
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("SHADOW GUARDIAN", ctx.canvas.width / 2, y - 12);
    ctx.restore();
}

// --- FUNZIONI DI SUPPORTO (DASH & BULLETS) ---

function startDash(boss) {
    boss.isDashing = true;
    // Punta verso la posizione attuale del player
    const dx = gameState.playerX - boss.x;
    const dy = gameState.playerY - boss.y;
    const angle = Math.atan2(dy, dx);
    const speed = CONFIG.BOSS_ATTACKS.DASH_SPEED || 12;
    
    boss.dashVX = Math.cos(angle) * speed;
    boss.dashVY = Math.sin(angle) * speed;
}

function spawnRadialAttack(startX, startY) {
    const numBullets = CONFIG.BOSS_ATTACKS.RADIAL_BULLET_COUNT || 12;
    const speed = CONFIG.BOSS_ATTACKS.RADIAL_BULLET_SPEED || 4;
    
    for (let i = 0; i < numBullets; i++) {
        const angle = (Math.PI * 2 / numBullets) * i;
        gameState.bossBullets.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 20,
            color: '#ff00ff',
            type: 'radial'
        });
    }
}

function spawnBossBullet(x, y) {
    gameState.bossBullets.push({
        x: x,
        y: y,
        vx: 0,
        vy: 6,
        size: 25,
        color: '#8a2be2',
        type: 'standard'
    });
}
