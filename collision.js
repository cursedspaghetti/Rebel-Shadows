import { CONFIG, gameState } from './config.js';

export function handleAllCollisions() {
    const BOSS_HITBOX_RAD = 80; 
    const PLAYER_HITBOX_RAD = 15;
    const BULLET_DAMAGE = 25; // Con 100 HP, servono 4 colpi per ogni nemico

    // 1. PROIETTILI PLAYER vs Boss/Nemici
    for (let b = gameState.bullets.length - 1; b >= 0; b--) {
        const bullet = gameState.bullets[b];
        let bulletDestroyed = false;

        // --- vs Boss ---
        if (gameState.bossActive && gameState.boss) {
            const dist = Math.hypot(bullet.x - gameState.boss.x, bullet.y - gameState.boss.y);
            if (dist < BOSS_HITBOX_RAD + bullet.size) {
                gameState.boss.hp -= 1;
                createExplosion(bullet.x, bullet.y, '#ffffff');
                gameState.bullets.splice(b, 1);
                continue; // Passa al prossimo proiettile
            }
        }

        // --- vs Nemici Normali ---
        for (let e = gameState.enemies.length - 1; e >= 0; e--) {
            const enemy = gameState.enemies[e];
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            
            if (dist < (enemy.size / 2) + bullet.size) {
                // Sottrae vita invece di eliminarlo subito
                enemy.hp -= BULLET_DAMAGE;
                
                // Crea una piccola scintilla per il feedback del colpo
                createExplosion(bullet.x, bullet.y, '#00ffff');
                
                // Se la vita scende a zero o meno, esplode e viene rimosso
                if (enemy.hp <= 0) {
                    createExplosion(enemy.x, enemy.y, enemy.color || '#fff');
                    gameState.enemies.splice(e, 1);
                }

                gameState.bullets.splice(b, 1);
                bulletDestroyed = true;
                break; // Esci dal ciclo nemici per questo proiettile
            }
        }
    }

    // 2. PROIETTILI BOSS vs PLAYER
    if (gameState.bossBullets) {
        for (let i = gameState.bossBullets.length - 1; i >= 0; i--) {
            const b = gameState.bossBullets[i];
            const dist = Math.hypot(gameState.playerX - b.x, gameState.playerY - b.y);
            if (dist < PLAYER_HITBOX_RAD + (b.size / 2)) {
                if (!gameState.isInvulnerable && !gameState.shieldActive) {
                    applyDamage(10, 15);
                }
                createExplosion(b.x, b.y, b.color);
                gameState.bossBullets.splice(i, 1);
            }
        }
    }

    // 3. PROIETTILI NEMICI COMUNI vs PLAYER
    if (gameState.enemyBullets) {
        for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
            const eb = gameState.enemyBullets[i];
            const dist = Math.hypot(gameState.playerX - eb.x, gameState.playerY - eb.y);
            
            if (dist < PLAYER_HITBOX_RAD + (eb.size / 2)) {
                if (!gameState.isInvulnerable && !gameState.shieldActive) {
                    applyDamage(5, 10); // Danno dei nemici base
                }
                createExplosion(eb.x, eb.y, eb.color || '#ff00ff');
                gameState.enemyBullets.splice(i, 1);
            }
        }
    }
    
    // 4. RAGGI SPECIALI vs Nemici/Boss
    const activeRays = [
        { active: gameState.specialRay?.active, x: gameState.playerX, width: 40 },
        { active: gameState.specialRay2?.active2, x: gameState.playerX, width: 40 }
    ];

    activeRays.forEach(ray => {
        if (ray.active) {
            // --- Nemici normali (Il raggio infligge danno continuo) ---
            for (let e = gameState.enemies.length - 1; e >= 0; e--) {
                const enemy = gameState.enemies[e];
                if (Math.abs(enemy.x - ray.x) < (ray.width / 2 + enemy.size / 2) && enemy.y < gameState.playerY) {
                    enemy.hp -= 2; // Danno rapido nel tempo
                    
                    if (enemy.hp <= 0) {
                        createExplosion(enemy.x, enemy.y, '#ffffff');
                        gameState.enemies.splice(e, 1);
                    } else if (Math.random() > 0.9) {
                        // Effetto visivo di bruciatura
                       createExplosion(enemy.x, enemy.y, '#cyan');
                    }
                }
            }

            // --- Boss ---
            if (gameState.bossActive && gameState.boss) {
                const hitBoxWidth = BOSS_HITBOX_RAD + ray.width / 2;
                if (Math.abs(gameState.boss.x - ray.x) < hitBoxWidth && gameState.boss.y < gameState.playerY) {
                    gameState.boss.hp -= 5; 
                    if (Math.random() > 0.8) {
                        createExplosion(
                            gameState.boss.x + (Math.random() - 0.5) * 40, 
                            gameState.boss.y + (Math.random() - 0.5) * 40, 
                            '#cyan'
                        );
                    }
                }
            }
        }
    });
    
    // 5. PLAYER vs CORPO NEMICI/BOSS (Collisione Fisica)
    if (!gameState.isInvulnerable && !gameState.shieldActive) {
        // vs Nemici
        for (let e = gameState.enemies.length - 1; e >= 0; e--) {
            const enemy = gameState.enemies[e];
            if (Math.hypot(gameState.playerX - enemy.x, gameState.playerY - enemy.y) < PLAYER_HITBOX_RAD + enemy.size/2) {
                applyDamage(5, 12);
                // Il nemico esplode comunque se tocca il player
                createExplosion(enemy.x, enemy.y, enemy.color);
                gameState.enemies.splice(e, 1);
            }
        }

        // vs Boss
        if (gameState.bossActive && gameState.boss) {
            if (Math.hypot(gameState.playerX - gameState.boss.x, gameState.playerY - gameState.boss.y) < 60 + PLAYER_HITBOX_RAD) {
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
        alert("GAME OVER");
        location.reload(); 
    }
}

// --- ESPLOSIONI ---
function createExplosion(x, y, color = '#FFC300') {
    gameState.explosions.push({
        x: x, y: y, radius: 5, maxRadius: 30,
        alpha: 1, speed: 0.8, fadeSpeed: 0.05, color: color
    });
}

export function updateExplosions() {
    gameState.explosions = gameState.explosions.filter(exp => {
        exp.radius += exp.speed;
        exp.alpha -= exp.fadeSpeed;
        return exp.alpha > 0;
    });
}

export function drawExplosions(ctx) {
    gameState.explosions.forEach(exp => {
        ctx.save();
        ctx.globalAlpha = exp.alpha;
        ctx.fillStyle = exp.color;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}


