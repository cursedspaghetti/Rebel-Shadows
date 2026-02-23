import { CONFIG, gameState } from './config.js';

export function handleAllCollisions() {
    const BOSS_HITBOX_RAD = 80; 
    const PLAYER_HITBOX_RAD = 15;
    const SHIELD_RADIUS = CONFIG.SHIELD?.RADIUS || 45; 
    const BULLET_DAMAGE = 10;

    // --- 1. PROIETTILI PLAYER vs BOSS/NEMICI ---
    for (let b = gameState.bullets.length - 1; b >= 0; b--) {
        const bullet = gameState.bullets[b];

        // vs Boss (Il boss è già in coordinate schermo, quindi va bene così)
        if (gameState.bossActive && gameState.boss) {
            const dist = Math.hypot(bullet.x - gameState.boss.x, bullet.y - gameState.boss.y);
            if (dist < BOSS_HITBOX_RAD + bullet.size) {
                gameState.boss.hp -= 1;
                createExplosion(bullet.x, bullet.y, '#ffffff');
                gameState.bullets.splice(b, 1);
                continue; 
            }
        }

        // vs Nemici Normali (TRASFORMAZIONE COORDINATE)
        for (let e = gameState.enemies.length - 1; e >= 0; e--) {
            const enemy = gameState.enemies[e];
            
            // Portiamo il nemico dal "mondo" allo "schermo" per il calcolo
            const enemyScreenY = enemy.y + (gameState.cameraY || 0);
            
            // Calcoliamo la distanza tra proiettile (schermo) e nemico (schermo)
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemyScreenY);
            
            if (dist < (enemy.size / 2) + bullet.size) {
                enemy.hp -= BULLET_DAMAGE;
                createExplosion(bullet.x, bullet.y, '#00ffff');
                
                if (enemy.hp <= 0) {
                    createExplosion(enemy.x, enemyScreenY, enemy.color || '#fff');
                    gameState.enemies.splice(e, 1);
                }

                gameState.bullets.splice(b, 1);
                break; 
            }
        }
    }

    // --- 2. PROIETTILI BOSS vs PLAYER / SCUDO ---
    // (Il boss spara già in coordinate schermo, logica invariata)
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
                if (!gameState.isInvulnerable) applyDamage(10, 15);
                createExplosion(b.x, b.y, b.color);
                gameState.bossBullets.splice(i, 1);
            }
        }
    }

    // --- 3. PROIETTILI NEMICI COMUNI vs PLAYER / SCUDO ---
    if (gameState.enemyBullets) {
        for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
            const eb = gameState.enemyBullets[i];
            
            // TRASFORMAZIONE: Proiettile nemico (mondo) -> schermo
            const ebScreenY = eb.y + (gameState.cameraY || 0);
            const dist = Math.hypot(gameState.playerX - eb.x, gameState.playerY - ebScreenY);
            
            if (gameState.shieldActive && dist < SHIELD_RADIUS + (eb.size / 2)) {
                createExplosion(eb.x, ebScreenY, '#00bfff');
                gameState.enemyBullets.splice(i, 1);
                continue;
            }

            if (dist < PLAYER_HITBOX_RAD + (eb.size / 2)) {
                if (!gameState.isInvulnerable) applyDamage(5, 10);
                createExplosion(eb.x, ebScreenY, eb.color || '#ff00ff');
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
            // Pulizia proiettili nel raggio (con trasformazione Y)
            [gameState.enemyBullets, gameState.bossBullets].forEach(bulletArray => {
                if (bulletArray) {
                    for (let i = bulletArray.length - 1; i >= 0; i--) {
                        const b = bulletArray[i];
                        const bScreenY = bulletArray === gameState.enemyBullets ? b.y + (gameState.cameraY || 0) : b.y;
                        
                        if (Math.abs(b.x - ray.x) < (ray.width / 2 + b.size / 2) && bScreenY < gameState.playerY) {
                            createExplosion(b.x, bScreenY, '#ffffff');
                            bulletArray.splice(i, 1);
                        }
                    }
                }
            });

            // Danno ai nemici (con trasformazione Y)
            for (let e = gameState.enemies.length - 1; e >= 0; e--) {
                const enemy = gameState.enemies[e];
                const enemyScreenY = enemy.y + (gameState.cameraY || 0);
                
                if (Math.abs(enemy.x - ray.x) < (ray.width / 2 + enemy.size / 2) && enemyScreenY < gameState.playerY) {
                    enemy.hp -= 10; 
                    if (enemy.hp <= 0) {
                        createExplosion(enemy.x, enemyScreenY, '#ffffff');
                        gameState.enemies.splice(e, 1);
                    }
                }
            }
       // Danno al Boss dal Laser (dentro activeRays.forEach)
        if (gameState.bossActive && gameState.boss) {
           if (Math.abs(gameState.boss.x - ray.x) < (ray.width / 2 + BOSS_HITBOX_RAD)) {
            gameState.boss.hp -= 5; // Danno continuo del laser
            if (Math.random() > 0.8) createExplosion(gameState.boss.x, gameState.boss.y, '#ffffff');
            }
        }        
     }
    });

    // --- 5. PLAYER vs CORPO NEMICO ---
    for (let e = gameState.enemies.length - 1; e >= 0; e--) {
        const enemy = gameState.enemies[e];
        const enemyScreenY = enemy.y + (gameState.cameraY || 0);
        const dist = Math.hypot(gameState.playerX - enemy.x, gameState.playerY - enemyScreenY);
        
        if (gameState.shieldActive && dist < SHIELD_RADIUS + enemy.size/2) {
            createExplosion(enemy.x, enemyScreenY, enemy.color);
            gameState.enemies.splice(e, 1);
        } 
        else if (!gameState.isInvulnerable && dist < PLAYER_HITBOX_RAD + enemy.size/2) {
            applyDamage(15, 15);
            createExplosion(enemy.x, enemyScreenY, enemy.color);
            gameState.enemies.splice(e, 1);
        }
    }

// --- 6. PLAYER vs CORPO BOSS ---
if (gameState.bossActive && gameState.boss) {
    const dist = Math.hypot(gameState.playerX - gameState.boss.x, gameState.playerY - gameState.boss.y);
    
    // Se il player tocca il boss
    if (dist < BOSS_HITBOX_RAD + PLAYER_HITBOX_RAD) {
        if (!gameState.isInvulnerable) {
            // Danno maggiore perché è un boss!
            applyDamage(20, 25); 
            createExplosion(gameState.playerX, gameState.playerY, '#ff0000');
        }
    }
 }
}

// ... restanti funzioni applyDamage, createExplosion, etc. rimangono uguali ...

 

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
