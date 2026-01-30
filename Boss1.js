import { CONFIG, gameState } from './config.js';

/**
 * LOGICA PRINCIPALE: Aggiorna movimento, attacchi e proiettili del boss
 */
export function updateBoss(boss) {
    if (!boss || boss.hp <= 0) return;

    const now = Date.now();

    // 0. CONTROLLO CAMBIO FASE (Soglia 50% da CONFIG)
    if (boss.phase === 1 && boss.hp <= boss.maxHp * CONFIG.BOSS_PHASE_2_THRESHOLD) {
        boss.phase = 2;
        gameState.screenShake = 15; // Feedback impatto visivo
    }

    // Modificatori dinamici basati sulla fase
    const phaseSpeedMult = boss.phase === 2 ? 1.5 : 1.0;
    const cooldownMult = boss.phase === 2 ? 0.6 : 1.0;

    // 1. GESTIONE MOVIMENTO (DASH vs FLOATING)
    if (boss.isDashing) {
        boss.x += boss.dashVX * (boss.phase === 2 ? 1.2 : 1);
        boss.y += boss.dashVY * (boss.phase === 2 ? 1.2 : 1);

        if (boss.y > CONFIG.CANVAS_HEIGHT + 150 || boss.x < -150 || boss.x > CONFIG.CANVAS_WIDTH + 150) {
            boss.isDashing = false;
            boss.y = -150; 
            boss.targetX = CONFIG.CANVAS_WIDTH / 2;
        }
    } else {
        // Entrata in scena e movimento fluttuante
        if (boss.y < 150) boss.y += 4;
        else boss.y = 150;

        if (Math.abs(boss.x - boss.targetX) < 10) {
            boss.targetX = Math.random() * (CONFIG.CANVAS_WIDTH - 200) + 100;
        }
        boss.x += (boss.targetX - boss.x) * (0.02 * phaseSpeedMult);

        // 2. LOGICA ATTACCHI (Burst e Standard)

        // Raffica 3 Raggiere (Fase 2: Intervalli ridotti)
        const radialInterval = (CONFIG.BOSS_ATTACKS.RADIAL_INTERVAL[0]) * cooldownMult;
        if (now - (boss.lastRadialBurst || 0) > radialInterval) {
            startRadialBurst(boss);
            boss.lastRadialBurst = now;
        }
        updateRadialBurst(boss, now);

        // Raffica 5 Proiettili Mirati (Burst veloce al player)
        const targetedInterval = 4000 * cooldownMult;
        if (now - (boss.lastTargetBurst || 0) > targetedInterval) {
            startTargetedBurst(boss);
            boss.lastTargetBurst = now;
        }
        updateTargetedBurst(boss, now);

        // Carica (Dash)
        const dashInterval = (CONFIG.BOSS_ATTACKS.DASH_INTERVAL[0] + Math.random() * 6000) * cooldownMult;
        if (now - boss.lastDash > dashInterval) {
            startDash(boss);
            boss.lastDash = now;
        }

        //DA VALUTARE IN FUTURO per creare una nuva sequanze se il livello è superiore  
        /*
        // Colpo standard frontale
        if (now - boss.lastShot > (2000 * cooldownMult)) {
            spawnBossBullet(boss.x, boss.y + 20);
            boss.lastShot = now;
        }
      } 
    */

    // 3. AGGIORNAMENTO FISICA PROIETTILI
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

function drawBossBullets(ctx) {
    if (!gameState.bossBullets) return;

    gameState.bossBullets.forEach(b => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2);
        
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = b.color;
        
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.closePath();
        ctx.restore();
    });
}

function drawBossUI(ctx, boss) {
    const healthPercent = Math.max(0, (boss.hp || 0) / (boss.maxHp || 100));
    const barWidth = 200; 
    const barHeight = 10;
    const x = Math.floor((ctx.canvas.width - barWidth) / 2);
    const y = 30; 

    ctx.save();
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Feedback visivo Fase 2: la barra diventa rossa pulsante
    if (boss.phase === 2) {
        const pulse = Math.abs(Math.sin(Date.now() * 0.01));
        ctx.fillStyle = `rgb(${150 + pulse * 105}, 0, ${pulse * 50})`;
    } else {
        ctx.fillStyle = '#ff00ff'; 
    }

    ctx.fillRect(x, y, Math.floor(barWidth * healthPercent), barHeight);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 1, y - 1, barWidth + 2, barHeight + 2);

    ctx.fillStyle = 'white';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'left';
    const bossName = boss.phase === 2 ? "SHADOW #647 [OVERDRIVE]" : "SHADOW #647";
    ctx.fillText(bossName, x, y - 8);
    ctx.restore();
}

// --- FUNZIONI DI SUPPORTO ATTACCHI ---

function startDash(boss) {
    boss.isDashing = true;
    const dx = gameState.playerX - boss.x;
    const dy = gameState.playerY - boss.y;
    const angle = Math.atan2(dy, dx);
    const speed = CONFIG.BOSS_ATTACKS.DASH_SPEED || 14;
    
    boss.dashVX = Math.cos(angle) * speed;
    boss.dashVY = Math.sin(angle) * speed;
}

// Gestione Burst Raggera
function startRadialBurst(boss) {
    boss.radialCount = boss.phase === 2 ? 4 : 3;
    boss.nextRadialTime = 0;
}

function updateRadialBurst(boss, now) {
    if (boss.radialCount > 0 && now > (boss.nextRadialTime || 0)) {
        spawnRadialAttack(boss.x, boss.y, boss.phase === 2 ? 2 : 0);
        boss.radialCount--;
        boss.nextRadialTime = now + (boss.phase === 2 ? 350 : 500);
    }
}

// Gestione Burst Mirato al Player
function startTargetedBurst(boss) {
    boss.targetedCount = boss.phase === 2 ? 8 : 5;
    boss.nextTargetedTime = 0;
}

function updateTargetedBurst(boss, now) {
    if (boss.targetedCount > 0 && now > (boss.nextTargetedTime || 0)) {
        spawnTargetedBullet(boss);
        boss.targetedCount--;
        boss.nextTargetedTime = now + (boss.phase === 2 ? 100 : 180);
    }
}

function spawnRadialAttack(startX, startY, extraSpeed = 0) {
    const numBullets = CONFIG.BOSS_ATTACKS.RADIAL_BULLET_COUNT || 12;
    const speed = (CONFIG.BOSS_ATTACKS.RADIAL_BULLET_SPEED || 4) + extraSpeed;
    
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

function spawnTargetedBullet(boss) {
    const dx = gameState.playerX - boss.x;
    const dy = gameState.playerY - boss.y;
    const angle = Math.atan2(dy, dx);
    const speed = boss.phase === 2 ? 9 : 7;

    gameState.bossBullets.push({
        x: boss.x,
        y: boss.y + 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 18,
        color: '#00ffff',
        type: 'targeted'
    });
}

    /*    
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
 */
