import { CONFIG, gameState } from './config.js';

// --- SISTEMA DI CACHING OTTIMIZZATO ---
const bulletCache = {};

/**
 * Genera proiettili tondi in stile pixel art
 */
export function getPixelBullet(color, size) {
    const key = `${color}-${size}`;
    if (bulletCache[key]) return bulletCache[key];

    const canvas = document.createElement('canvas');
    const pixelSize = Math.max(1, size / 4); 
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const center = size / 2;
    const radiusSq = (size / 2) * (size / 2);

    for (let y = 0; y < size; y += pixelSize) {
        for (let x = 0; x < size; x += pixelSize) {
            const dx = x + pixelSize / 2 - center;
            const dy = y + pixelSize / 2 - center;
            const distSq = dx * dx + dy * dy;

            if (distSq <= radiusSq) {
                ctx.fillStyle = distSq <= radiusSq * 0.2 ? '#ffffff' : color;
                ctx.fillRect(
                    Math.floor(x), 
                    Math.floor(y), 
                    Math.ceil(pixelSize), 
                    Math.ceil(pixelSize)
                );
            }
        }
    }
    bulletCache[key] = canvas;
    return canvas;
}

/**
 * Precarica gli asset del boss
 */
export function preloadBossAssets() {
    getPixelBullet(CONFIG.BOSS.RADIAL.COLOR, CONFIG.BOSS.RADIAL.SIZE);
    getPixelBullet(CONFIG.BOSS.TARGETED.COLOR, CONFIG.BOSS.TARGETED.SIZE);
}

/**
 * CREA UNA NUOVA ISTANZA DEL BOSS
 */
export function spawnBoss(level = 1) {
    const c = CONFIG.BOSS;
    const scaledMaxHp = c.MAX_HP * Math.pow(1.4, level - 1);
    const now = Date.now();

    return {
        x: CONFIG.CANVAS_WIDTH / 2,
        y: -150, 
        targetX: CONFIG.CANVAS_WIDTH / 2,
        targetY: 150, 
        hp: scaledMaxHp,
        maxHp: scaledMaxHp,
        phase: 1,
        isDashing: false,
        lastRadialBurst: now + 2000, 
        lastTargetBurst: now + 1000, 
        lastDash: now + 3000,
        radialWavesRemaining: 0,
        radialBulletsRemaining: 0,
        targetedCount: 0,
        level: level,
        dashVX: 0,
        dashVY: 0
    };
}

/**
 * LOGICA DI AGGIORNAMENTO
 */
export function updateBoss(boss) {
    if (!boss || boss.hp <= 0) return;

    const now = Date.now();
    const c = CONFIG.BOSS;

    // 1. GESTIONE CAMBIO FASE
    if (boss.phase === 1 && boss.hp <= boss.maxHp * c.PHASE_2_THRESHOLD) {
        boss.phase = 2;
        gameState.screenShake = 15;
        gameState.bossPhaseTransition = true;
        gameState.flashActive = true;        
        gameState.flashStartTime = Date.now(); 
        gameState.flashDuration = 1000;
    }

    const isP2 = boss.phase === 2;
    const cooldownMult = isP2 ? c.RADIAL.COOLDOWN_P2 : 1.0;

    // 2. LOGICA MOVIMENTO
    if (boss.isDashing) {
        const dashMult = isP2 ? c.DASH.SPEED_P2_MULT : 1;
        boss.x += boss.dashVX * dashMult;
        boss.y += boss.dashVY * dashMult;

        if (boss.y > CONFIG.CANVAS_HEIGHT + 150 || boss.y < -200 || boss.x < -200 || boss.x > CONFIG.CANVAS_WIDTH + 200) {
            boss.isDashing = false;
            boss.y = -150; 
            boss.targetX = CONFIG.CANVAS_WIDTH / 2;
            boss.targetY = 150;
        }
    } else {
        // MOVIMENTO DINAMICO SENZA VINCOLO DEL CENTRO
        if (boss.y < 50) {
            boss.y += 3; // Entrata fluida
        } else {
            const marginX = 80;
            const minY = 100;
            const maxY = CONFIG.CANVAS_HEIGHT * 0.3;

            // Cambia target se raggiunto o se non esiste
            if (!boss.targetX || Math.abs(boss.x - boss.targetX) < 10) {
                boss.targetX = Math.random() * (CONFIG.CANVAS_WIDTH - marginX * 2) + marginX;
            }
            if (!boss.targetY || Math.abs(boss.y - boss.targetY) < 10) {
                boss.targetY = Math.random() * (maxY - minY) + minY;
            }

            const lerpSpeed = isP2 ? c.LERP_SPEED_P2 : c.LERP_SPEED;
            boss.x += (boss.targetX - boss.x) * lerpSpeed;
            boss.y += (boss.targetY - boss.y) * (lerpSpeed * 0.8);
        }

        // 3. GESTIONE ATTACCHI (Se a schermo)
        if (boss.y >= 50) {
            // --- Attacco Radiale ---
            const radialInt = c.RADIAL.INTERVAL * cooldownMult;
            if (now - (boss.lastRadialBurst || 0) > radialInt && (boss.radialWavesRemaining || 0) <= 0) {
                startRadialBurst(boss);
                boss.lastRadialBurst = now;
            }
            updateRadialBurst(boss, now);

            // --- Attacco Mirato ---
            const targetedInt = c.TARGETED.INTERVAL * cooldownMult;
            if (now - (boss.lastTargetBurst || 0) > targetedInt) {
                startTargetedBurst(boss, isP2);
                boss.lastTargetBurst = now;
            }
            updateTargetedBurst(boss, now, isP2);

            // --- Dash ---
            const dashInt = (c.DASH.INTERVAL_MIN + Math.random() * c.DASH.INTERVAL_VAR) * cooldownMult;
            if (now - (boss.lastDash || 0) > dashInt) {
                startDash(boss);
                boss.lastDash = now;
            }
        }
    } 
    
    updateBossBullets();
}

function startRadialBurst(boss) {
    const cfg = CONFIG.BOSS.RADIAL;
    boss.radialWavesRemaining = cfg.WAVES;
    boss.radialBulletsRemaining = cfg.BULLETS_PER_WAVE; 
    boss.nextRadialBulletTime = 0;
    boss.radialDirection = 1; 
}

function updateRadialBurst(boss, now) {
    // Rimosso il controllo boss.isAtCenter
    if (boss.radialWavesRemaining <= 0) return;

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
            x: boss.x, 
            y: boss.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: cfg.SIZE, 
            color: cfg.COLOR
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

    ctx.scale(0.55, 0.55); 
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
    const healthPercent = Math.max(0, (boss.hp || 0) / (boss.maxHp || 1));
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
