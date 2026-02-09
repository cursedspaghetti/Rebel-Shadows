import { CONFIG, gameState } from './config.js';

// --- SISTEMA DI CACHING OTTIMIZZATO ---
const bulletCache = {};

function getPixelBullet(color, size) {
    const key = `${color}-${size}`;
    if (bulletCache[key]) return bulletCache[key];

    const canvas = document.createElement('canvas');
    const padding = 10; 
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2;
    const ctx = canvas.getContext('2d');
    
    const center = canvas.width / 2;
    const pSize = 4; 
    const r = size / 2;

    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.fillStyle = color;

    for (let py = 0; py < size; py += pSize) {
        for (let px = 0; px < size; px += pSize) {
            const dx = px - r;
            const dy = py - r;
            if (dx * dx + dy * dy <= r * r) {
                ctx.fillRect(px + padding, py + padding, pSize, pSize);
            }
        }
    }
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.fillRect(Math.floor(center - pSize / 2), Math.floor(center - pSize / 2), pSize, pSize);

    bulletCache[key] = canvas;
    return canvas;
}

export function preloadBossAssets() {
    getPixelBullet(CONFIG.BOSS.RADIAL.COLOR, CONFIG.BOSS.RADIAL.SIZE);
    getPixelBullet(CONFIG.BOSS.TARGETED.COLOR, CONFIG.BOSS.TARGETED.SIZE);
}

/**
 * LOGICA DI AGGIORNAMENTO
 */
export function updateBoss(boss) {
    if (!boss || boss.hp <= 0) return;

    const now = Date.now();
    const c = CONFIG.BOSS;

    // Gestione Cambiamento Fase
    if (boss.phase === 1 && boss.hp <= boss.maxHp * c.PHASE_2_THRESHOLD) {
        boss.phase = 2;
        gameState.screenShake = 15;
    }

    const isP2 = boss.phase === 2;
    const cooldownMult = isP2 ? c.RADIAL.COOLDOWN_P2 : 1.0;

    if (boss.isDashing) {
        // --- LOGICA DASH ---
        const dashMult = isP2 ? c.DASH.SPEED_P2_MULT : 1;
        boss.x += boss.dashVX * dashMult;
        boss.y += boss.dashVY * dashMult;

        // Reset quando esce dai bordi (area estesa)
        if (boss.y > CONFIG.CANVAS_HEIGHT + 150 || boss.y < -200 || boss.x < -200 || boss.x > CONFIG.CANVAS_WIDTH + 200) {
            boss.isDashing = false;
            boss.y = -150; 
            boss.targetX = CONFIG.CANVAS_WIDTH / 2;
            boss.targetY = 150; // Punto di rientro
        }
    } else {
        // --- MOVIMENTO DINAMICO (NON DASH) ---

        // Parametri area di movimento
        const marginX = 80;
        const minY = 100;
        const maxY = CONFIG.CANVAS_HEIGHT * 0.5; // Scende fino a metà schermo

        if (boss.radialWavesRemaining > 0) {
            // Durante l'attacco radiale: torna al centro-alto per bilanciamento
            const centerX = CONFIG.CANVAS_WIDTH / 2;
            const centerY = 150;
            boss.x += (centerX - boss.x) * 0.08;
            boss.y += (centerY - boss.y) * 0.08;
            boss.isAtCenter = Math.abs(boss.x - centerX) < 10 && Math.abs(boss.y - centerY) < 10;
        } else {
            // Movimento libero in un'area più ampia
            boss.isAtCenter = false;

            // Cambio target X casuale
            if (!boss.targetX || Math.abs(boss.x - boss.targetX) < 10) {
                boss.targetX = Math.random() * (CONFIG.CANVAS_WIDTH - marginX * 2) + marginX;
            }
            // Cambio target Y casuale
            if (!boss.targetY || Math.abs(boss.y - boss.targetY) < 10) {
                boss.targetY = Math.random() * (maxY - minY) + minY;
            }

            const lerpSpeed = isP2 ? c.LERP_SPEED_P2 : c.LERP_SPEED;
            boss.x += (boss.targetX - boss.x) * lerpSpeed;
            boss.y += (boss.targetY - boss.y) * (lerpSpeed * 0.8); // Y leggermente più lenta per fluidità
        }

        // --- GESTIONE ATTACCHI ---
        const radialInt = c.RADIAL.INTERVAL * cooldownMult;
        if (now - (boss.lastRadialBurst || 0) > radialInt && (boss.radialWavesRemaining || 0) <= 0) {
            startRadialBurst(boss);
            boss.lastRadialBurst = now;
        }
        updateRadialBurst(boss, now);

        const targetedInt = c.TARGETED.INTERVAL * cooldownMult;
        if (now - (boss.lastTargetBurst || 0) > targetedInt) {
            startTargetedBurst(boss, isP2);
            boss.lastTargetBurst = now;
        }
        updateTargetedBurst(boss, now, isP2);

        const dashInt = (c.DASH.INTERVAL_MIN + Math.random() * c.DASH.INTERVAL_VAR) * cooldownMult;
        if (now - (boss.lastDash || 0) > dashInt) {
            startDash(boss);
            boss.lastDash = now;
        }
    } 
   
    updateBossBullets();
}

// --- LOGICA ATTACCHI DETTAGLIATA ---

function startRadialBurst(boss) {
    const cfg = CONFIG.BOSS.RADIAL;
    boss.radialWavesRemaining = cfg.WAVES;
    boss.radialBulletsRemaining = cfg.BULLETS_PER_WAVE; 
    boss.nextRadialBulletTime = 0;
    boss.radialDirection = 1; 
}

function updateRadialBurst(boss, now) {
    if (boss.radialWavesRemaining <= 0 || !boss.isAtCenter) return;

    if (now > (boss.nextRadialBulletTime || 0)) {
        const cfg = CONFIG.BOSS.RADIAL;
        const currentIdx = cfg.BULLETS_PER_WAVE - boss.radialBulletsRemaining;
        
        const startRad = (cfg.ANGLE_START * Math.PI) / 180;
        const endRad = (cfg.ANGLE_END * Math.PI) / 180;
        const arc = endRad - startRad;

        const angle = boss.radialDirection === 1 
            ? startRad + (arc / (cfg.BULLETS_PER_WAVE - 1)) * currentIdx
            : endRad - (arc / (cfg.BULLETS_PER_WAVE - 1)) * currentIdx;
        
        const speed = boss.phase === 2 ? cfg.SPEED_P2 : cfg.SPEED_P1;

        gameState.bossBullets.push({
            x: boss.x, y: boss.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: cfg.SIZE, color: cfg.COLOR
        });

        boss.radialBulletsRemaining--;
        boss.nextRadialBulletTime = now + cfg.DELAY_BETWEEN_BULLETS; 

        if (boss.radialBulletsRemaining <= 0) {
            boss.radialWavesRemaining--;
            if (boss.radialWavesRemaining > 0) {
                boss.radialBulletsRemaining = cfg.BULLETS_PER_WAVE;
                boss.radialDirection *= -1;
                boss.nextRadialBulletTime = now + cfg.DELAY_BETWEEN_WAVES; 
            }
        }
    }
}

function startTargetedBurst(boss, isP2) {
    const cfg = CONFIG.BOSS.TARGETED;
    boss.targetedCount = isP2 ? cfg.COUNT_P2 : cfg.COUNT_P1;
    boss.nextTargetedTime = 0;
}

function updateTargetedBurst(boss, now, isP2) {
    if (boss.targetedCount > 0 && now > (boss.nextTargetedTime || 0)) {
        const cfg = CONFIG.BOSS.TARGETED;
        const dx = gameState.playerX - boss.x;
        const dy = gameState.playerY - boss.y;
        const angle = Math.atan2(dy, dx);
        const speed = isP2 ? cfg.SPEED_P2 : cfg.SPEED_P1;
        
        gameState.bossBullets.push({
            x: boss.x, y: boss.y + 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: cfg.SIZE, color: cfg.COLOR
        });

        boss.targetedCount--;
        boss.nextTargetedTime = now + (isP2 ? cfg.DELAY_P2 : cfg.DELAY_P1);
    }
}

function startDash(boss) {
    boss.isDashing = true;
    const dx = gameState.playerX - boss.x;
    const dy = gameState.playerY - boss.y;
    const angle = Math.atan2(dy, dx);
    const speed = CONFIG.BOSS.DASH.SPEED;
    boss.dashVX = Math.cos(angle) * speed;
    boss.dashVY = Math.sin(angle) * speed;
}

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
 * RENDERING
 */
export function drawBossShadow(ctx, boss, img) {
    if (!img.complete || boss.hp <= 0) return;

    drawBossBullets(ctx);

    const c = CONFIG.BOSS;
    const totalFrames = 9;
    const frameDuration = 100; 
    const originalSize = 400;  
    
    const frameIndex = Math.floor((Date.now() / frameDuration) % totalFrames);
    const floatOffset = boss.isDashing ? 0 : Math.sin(Date.now() * c.FLOAT_SPEED) * c.FLOAT_AMP;

    ctx.save();
    ctx.translate(boss.x, boss.y + floatOffset);
    
    if (boss.isDashing) {
        const angle = Math.atan2(boss.dashVY, boss.dashVX);
        ctx.rotate(angle + Math.PI / 2);
    }

    ctx.scale(0.6, 0.6); 
    const sx = Math.floor(frameIndex * originalSize);
    ctx.drawImage(img, sx, 0, originalSize, originalSize, -originalSize / 2, -originalSize / 2, originalSize, originalSize);
    ctx.restore();

    drawBossUI(ctx, boss);
}

function drawBossBullets(ctx) {
    if (!gameState.bossBullets) return;
    for (let i = 0; i < gameState.bossBullets.length; i++) {
        const b = gameState.bossBullets[i];
        const bulletImg = getPixelBullet(b.color, b.size);
        ctx.drawImage(
            bulletImg, 
            Math.floor(b.x - bulletImg.width / 2), 
            Math.floor(b.y - bulletImg.height / 2)
        );
    }
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
    
    ctx.fillStyle = boss.phase === 2 ? '#ff0000' : '#ff00ff';
    ctx.fillRect(x, y, Math.floor(barWidth * healthPercent), barHeight);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 1, y - 1, barWidth + 2, barHeight + 2);
    ctx.restore();
}
