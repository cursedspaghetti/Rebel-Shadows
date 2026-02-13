import { CONFIG, gameState } from './config.js';

export function handleAllCollisions() {
    const BOSS_HITBOX_RAD = 80; 
    const PLAYER_HITBOX_RAD = 15;
    const SHIELD_RADIUS = 45; // Raggio dello scudo (leggermente superiore al playerSize)
    const BULLET_DAMAGE = 10;

    // 1. PROIETTILI PLAYER vs Boss/Nemici (Invariato)
    for (let b = gameState.bullets.length - 1; b >= 0; b--) {
        const bullet = gameState.bullets[b];
        if (gameState.bossActive && gameState.boss) {
            const dist = Math.hypot(bullet.x - gameState.boss.x, bullet.y - gameState.boss.y);
            if (dist < BOSS_HITBOX_RAD + bullet.size) {
                gameState.boss.hp -= 1;
                createExplosion(bullet.x, bullet.y, '#ffffff');
                gameState.bullets.splice(b, 1);
                continue;
            }
        }

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

    // 2. PROIETTILI BOSS vs PLAYER / SHIELD
    if (gameState.bossBullets) {
        for (let i = gameState.bossBullets.length - 1; i >= 0; i--) {
            const b = gameState.bossBullets[i];
            const dist = Math.hypot(gameState.playerX - b.x, gameState.playerY - b.y);
            
            // CONTROLLO SCUDO
            if (gameState.shieldActive && dist < SHIELD_RADIUS + (b.size / 2)) {
                createExplosion(b.x, b.y, '#00bfff'); // Esplosione blu scudo
                gameState.bossBullets.splice(i, 1);
                continue; 
            }

            // CONTROLLO DANNO PLAYER
            if (dist < PLAYER_HITBOX_RAD + (b.size / 2)) {
                if (!gameState.isInvulnerable) {
                    applyDamage(10, 15);
                }
                createExplosion(b.x, b.y, b.color);
                gameState.bossBullets.splice(i, 1);
            }
        }
    }

    // 3. PROIETTILI NEMICI COMUNI vs PLAYER / SHIELD
    if (gameState.enemyBullets) {
        for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
            const eb = gameState.enemyBullets[i];
            const dist = Math.hypot(gameState.playerX - eb.x, gameState.playerY - eb.y);
            
            // CONTROLLO SCUDO
            if (gameState.shieldActive && dist < SHIELD_RADIUS + (eb.size / 2)) {
                createExplosion(eb.x, eb.y, '#00bfff');
                gameState.enemyBullets.splice(i, 1);
                continue;
            }

            // CONTROLLO DANNO PLAYER
            if (dist < PLAYER_HITBOX_RAD + (eb.size / 2)) {
                if (!gameState.isInvulnerable) {
                    applyDamage(5, 10);
                }
                createExplosion(eb.x, eb.y, eb.color || '#ff00ff');
                gameState.enemyBullets.splice(i, 1);
            }
        }
    }
    
    // 4. RAGGI SPECIALI (Invariato)
    const activeRays = [
        { active: gameState.specialRay?.active, x: gameState.playerX, width: 40 },
        { active: gameState.specialRay2?.active2, x: gameState.playerX, width: 40 }
    ];

    activeRays.forEach(ray => {
        if (ray.active) {
            if (gameState.enemyBullets) {
                for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
                    const eb = gameState.enemyBullets[i];
                    if (Math.abs(eb.x - ray.x) < (ray.width / 2 + eb.size / 2) && eb.y < gameState.playerY) {
                        createExplosion(eb.x, eb.y, '#ffffff');
                        gameState.enemyBullets.splice(i, 1);
                    }
                }
            }
            if (gameState.bossBullets) {
                for (let i = gameState.bossBullets.length - 1; i >= 0; i--) {
                    const bb = gameState.bossBullets[i];
                    if (Math.abs(bb.x - ray.x) < (ray.width / 2 + bb.size / 2) && bb.y < gameState.playerY) {
                        createExplosion(bb.x, bb.y, '#ffffff');
                        gameState.bossBullets.splice(i, 1);
                    }
                }
            }
            for (let e = gameState.enemies.length - 1; e >= 0; e--) {
                const enemy = gameState.enemies[e];
                if (Math.abs(enemy.x - ray.x) < (ray.width / 2 + enemy.size / 2) && enemy.y < gameState.playerY) {
                    enemy.hp -= 15; 
                    if (enemy.hp <= 0) {
                        createExplosion(enemy.x, enemy.y, '#ffffff');
                        gameState.enemies.splice(e, 1);
                    }
                }
            }
        }
    });
    
    // 5. PLAYER vs CORPO NEMICI (Collisione Fisica + Protezione Scudo)
    // Se lo scudo è attivo, distruggiamo il nemico che ci tocca senza subire danni
    for (let e = gameState.enemies.length - 1; e >= 0; e--) {
        const enemy = gameState.enemies[e];
        const dist = Math.hypot(gameState.playerX - enemy.x, gameState.playerY - enemy.y);
        
        if (gameState.shieldActive && dist < SHIELD_RADIUS + enemy.size/2) {
            createExplosion(enemy.x, enemy.y, enemy.color);
            gameState.enemies.splice(e, 1); // Lo scudo "schiaccia" il nemico
        } 
        else if (!gameState.isInvulnerable && dist < PLAYER_HITBOX_RAD + enemy.size/2) {
            applyDamage(5, 12);
            createExplosion(enemy.x, enemy.y, enemy.color);
            gameState.enemies.splice(e, 1);
        }
    }

    // vs Boss
    if (gameState.bossActive && gameState.boss) {
        const distBoss = Math.hypot(gameState.playerX - gameState.boss.x, gameState.playerY - gameState.boss.y);
        if (distBoss < 60 + (gameState.shieldActive ? SHIELD_RADIUS : PLAYER_HITBOX_RAD)) {
            if (!gameState.shieldActive && !gameState.isInvulnerable) {
                applyDamage(30, 25);
            }
            // Nota: Se lo scudo è attivo, il boss non subisce/fa danni da contatto in questo esempio
        }
    }
}
