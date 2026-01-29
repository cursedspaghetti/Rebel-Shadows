import { CONFIG, gameState } from './config.js';

/**
 * LOGICA PRINCIPALE: Aggiorna movimento, attacchi e proiettili del boss
 */
export function updateBoss(boss) {
    if (!boss || boss.hp <= 0) return;

    const now = Date.now();

    // 1. GESTIONE MOVIMENTO (DASH vs FLOATING)
    if (boss.isDashing) {
        boss.x += boss.dashVX;
        boss.y += boss.dashVY;

        if (boss.y > CONFIG.CANVAS_HEIGHT + 150 || boss.x < -150 || boss.x > CONFIG.CANVAS_WIDTH + 150) {
            boss.isDashing = false;
            boss.y = -150; 
            boss.targetX = CONFIG.CANVAS_WIDTH / 2;
        }
    } else {
        if (boss.y < 150) boss.y += 4;
        else boss.y = 150;

        if (Math.abs(boss.x - boss.targetX) < 10) {
            boss.targetX = Math.random() * (CONFIG.CANVAS_WIDTH - 200) + 100;
        }
        boss.x += (boss.targetX - boss.x) * 0.02;

        // 2. LOGICA ATTACCHI
        if (now - boss.lastShot > 2000) {
            spawnBossBullet(boss.x, boss.y + 20);
            boss.lastShot = now;
        }

        const radialInterval = CONFIG.BOSS_ATTACKS.RADIAL_INTERVAL[0] + Math.random() * 3000;
        if (now - boss.lastRadialShot > radialInterval) {
            spawnRadialAttack(boss.x, boss.y);
            boss.lastRadialShot = now;
        }

        const dashInterval = CONFIG.BOSS_ATTACKS.DASH_INTERVAL[0] + Math.random() * 6000;
        if (now - boss.lastDash > dashInterval) {
            startDash(boss);
            boss.lastDash = now;
        }
    }

    // 3. AGGIORNAMENTO POSIZIONE PROIETTILI BOSS
    updateBossBullets();
}

/**
 * AGGIORNAMENTO FISICA PROIETTILI
 */
function updateBossBullets() {
    if (!gameState.bossBullets) return;

    for (let i = gameState.bossBullets.length - 1; i >= 0; i--) {
        const b = gameState.bossBullets[i];
        b.x += b.vx;
        b.y += b.vy;

        // Rimuovi se fuori dallo schermo
        if (b.y > CONFIG.CANVAS_HEIGHT + 100 || b.y < -100 || b.x < -100 || b.x > CONFIG.CANVAS_WIDTH + 100) {
            gameState.bossBullets.splice(i, 1);
        }
    }
}

/**
 * RENDERING: Disegna il boss, la UI e i suoi proiettili
 */
export function drawBossShadow(ctx, boss, img) {
    if (!img.complete || boss.hp <= 0) return;

    // 1. DISEGNA I PROIETTILI DEL BOSS
    drawBossBullets(ctx);

    const totalFrames = 9;
    const frameDuration = 100; 
    const originalSize = 400;  
    
    const frameIndex = Math.floor((Date.now() / frameDuration) % totalFrames);
    const floatOffset = boss.isDashing ? 0 : Math.sin(Date.now() * 0.003) * 15;

    ctx.save();
    ctx.translate(boss.x, boss.y + floatOffset);
    
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

    drawBossUI(ctx, boss);
}

/**
 * DISEGNO PROIETTILI BOSS
 */
function drawBossBullets(ctx) {
    if (!gameState.bossBullets) return;

    gameState.bossBullets.forEach(b => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2);
        
        // Effetto grafico proiettile
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = b.color;
        
        ctx.fill();
        // Un piccolo bordo bianco per renderli più visibili
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.closePath();
        ctx.restore();
    });
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
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(128, 0, 255, 0.5)';
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    const gradient = ctx.createLinearGradient(x, 0, x + barWidth, 0);
    gradient.addColorStop(0, '#4b0082');
    gradient.addColorStop(0.5, '#8a2be2');
    gradient.addColorStop(1, '#ff00ff');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("SHADOW GUARDIAN", ctx.canvas.width / 2, y - 12);
    ctx.restore();
}

// --- FUNZIONI DI SUPPORTO ---

function startDash(boss) {
    boss.isDashing = true;
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
