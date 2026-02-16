import { CONFIG, gameState } from './config.js';

/**
 * Gestisce tutte le interazioni fisiche tra proiettili, scudo, player e nemici.
 */
export function handleAllCollisions() {
    const BOSS_HITBOX_RAD = 80; 
    const PLAYER_HITBOX_RAD = 15;
    const SHIELD_RADIUS = CONFIG.SHIELD?.RADIUS || 45; 
    const BULLET_DAMAGE = 10;

    // --- 1. PROIETTILI PLAYER vs BOSS/NEMICI ---
    for (let b = gameState.bullets.length - 1; b >= 0; b--) {
        const bullet = gameState.bullets[b];

        // vs Boss
        if (gameState.bossActive && gameState.boss) {
            const dist = Math.hypot(bullet.x - gameState.boss.x, bullet.y - gameState.boss.y);
            if (dist < BOSS_HITBOX_RAD + bullet.size) {
                gameState.boss.hp -= 1;
                createExplosion(bullet.x, bullet.y, '#ffffff');
                gameState.bullets.splice(b, 1);
                continue; 
            }
        }

        // vs Nemici Normali
        for (let e = gameState.enemies.length - 1; e >= 0; e--) {
            const enemy = gameState.enemies[e];
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            
            if (dist < (enemy.size / 2) + bullet.size) {
                enemy.hp -= BULLET_DAMAGE;
                createExplosion(bullet.x, bullet.y, '#00ffff');
                
                if (enemy.hp <= 0) {
                    createExplosion(enemy.x, enemy.y, enemy.color || '#fff');
                    gameState.enemies.splice(e, 1);
                }

                gameState.bullets.splice(b, 1);
                break; 
            }
        }
    }

    // --- 2. PROIETTILI BOSS vs PLAYER / SCUDO ---
    if (gameState.bossBullets) {
        for (let i = gameState.bossBullets.length - 1; i >= 0; i--) {
            const b = gameState.bossBullets[i];
            const dist = Math.hypot(gameState.playerX - b.x, gameState.playerY - b.y);
            
            if (gameState.shieldActive && dist < SHIELD_RADIUS + (b.size / 2)) {
                createExplosion(b.x, b.y, '#00bfff'); 
                gameState.bossBullets.splice(i, 1);
                continue;
            }

            if (dist < PLAYER_HITBOX_RAD + (b.size / 2)) {
                if (!gameState.isInvulnerable) {
                    applyDamage(10, 15);
                }
                createExplosion(b.x, b.y, b.color);
                gameState.bossBullets.splice(i, 1);
            }
        }
    }

    // --- 3. PROIETTILI NEMICI COMUNI vs PLAYER / SCUDO ---
    if (gameState.enemyBullets) {
        for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
            const eb = gameState.enemyBullets[i];
            const dist = Math.hypot(gameState.playerX - eb.x, gameState.playerY - eb.y);
            
            if (gameState.shieldActive && dist < SHIELD_RADIUS + (eb.size / 2)) {
                createExplosion(eb.x, eb.y, '#00bfff');
                gameState.enemyBullets.splice(i, 1);
                continue;
            }

            if (dist < PLAYER_HITBOX_RAD + (eb.size / 2)) {
                if (!gameState.isInvulnerable) {
                    applyDamage(5, 10);
                }
                createExplosion(eb.x, eb.y, eb.color || '#ff00ff');
                gameState.enemyBullets.splice(i, 1);
            }
        }
    }

    // --- 4. RAGGI SPECIALI (LASER) ---
    const activeRays = [
        { active: gameState.specialRay?.active, x: gameState.playerX, width: gameState.specialRay?.currentWidth || 40 },
        { active: gameState.specialRay2?.active2, x: gameState.playerX, width: gameState.specialRay2?.currentWidth2 || 40 }
    ];

    activeRays.forEach(ray => {
        if (ray.active) {
            // Pulizia proiettili nel raggio
            [gameState.enemyBullets, gameState.bossBullets].forEach(bulletArray => {
                if (bulletArray) {
                    for (let i = bulletArray.length - 1; i >= 0; i--) {
                        const b = bulletArray[i];
                        if (Math.abs(b.x - ray.x) < (ray.width / 2 + b.size / 2) && b.y < gameState.playerY) {
                            createExplosion(b.x, b.y, '#ffffff');
                            bulletArray.splice(i, 1);
                        }
                    }
                }
            });

            // Danno ai nemici comuni
            for (let e = gameState.enemies.length - 1; e >= 0; e--) {
                const enemy = gameState.enemies[e];
                if (Math.abs(enemy.x - ray.x) < (ray.width / 2 + enemy.size / 2) && enemy.y < gameState.playerY) {
                    enemy.hp -= 10; 
                    if (enemy.hp <= 0) {
                        createExplosion(enemy.x, enemy.y, '#ffffff');
                        gameState.enemies.splice(e, 1);
                    }
                }
            }

            // DANNO AL BOSS (IMPOSTATO A 10 PER FRAME)
            if (gameState.bossActive && gameState.boss) {
                const hitBoxWidth = BOSS_HITBOX_RAD + (ray.width / 2);
                if (Math.abs(gameState.boss.x - ray.x) < hitBoxWidth && gameState.boss.y < gameState.playerY) {
                    gameState.boss.hp -= 10; 
                    if (Math.random() > 0.8) {
                        createExplosion(
                            gameState.boss.x + (Math.random() - 0.5) * 60, 
                            gameState.boss.y + (Math.random() - 0.5) * 60, 
                            '#00ffff'
                        );
                    }
                }
            }
        }
    });

    // --- 5. PLAYER vs CORPO NEMICO/BOSS ---
    for (let e = gameState.enemies.length - 1; e >= 0; e--) {
        const enemy = gameState.enemies[e];
        const dist = Math.hypot(gameState.playerX - enemy.x, gameState.playerY - enemy.y);
        
        if (gameState.shieldActive && dist < SHIELD_RADIUS + enemy.size/2) {
            createExplosion(enemy.x, enemy.y, enemy.color);
            gameState.enemies.splice(e, 1);
        } 
        else if (!gameState.isInvulnerable && dist < PLAYER_HITBOX_RAD + enemy.size/2) {
            applyDamage(15, 15);
            createExplosion(enemy.x, enemy.y, enemy.color);
            gameState.enemies.splice(e, 1);
        }
    }

    if (gameState.bossActive && gameState.boss) {
        const distBoss = Math.hypot(gameState.playerX - gameState.boss.x, gameState.playerY - gameState.boss.y);
        const collisionThreshold = 60 + (gameState.shieldActive ? SHIELD_RADIUS : PLAYER_HITBOX_RAD);
        
        if (distBoss < collisionThreshold) {
            if (!gameState.shieldActive && !gameState.isInvulnerable) {
                applyDamage(30, 25);
            }
        }
    }
}

function applyDamage(amount, shakeIntensity) {
    gameState.hp -= amount;
    gameState.isInvulnerable = true;
    gameState.lastDamageTime = Date.now();
    gameState.screenShake = shakeIntensity;

    if (gameState.hp <= 0) {
        gameState.hp = 0;
        alert("GAME OVER");
        location.reload(); 
    }
}

export function createExplosion(x, y, color = '#FFC300') {
    const particleCount = 2 + Math.floor(Math.random() * 3); 
    for (let i = 0; i < particleCount; i++) {
        gameState.explosions.push({
            x: x, y: y, size: 2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1.0, decay: 0.04, color: color
        });
    }
}

export function updateExplosions() {
    gameState.explosions = gameState.explosions.filter(p => {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.92; p.vy *= 0.92;
        p.life -= p.decay;
        return p.life > 0;
    });
}

export function drawExplosions(ctx) {
    gameState.explosions.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
        ctx.restore();
    });
}
