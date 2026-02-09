import { CONFIG, gameState } from './config.js';

export function handleAllCollisions() {
    const BOSS_HITBOX_RAD = 80; 
    const PLAYER_HITBOX_RAD = 15;
    const BULLET_DAMAGE = 10; // Con 100 HP, servono 4 colpi per ogni nemico

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
    
// 4. RAGGI SPECIALI vs Nemici/Boss/Proiettili
    const activeRays = [
        { active: gameState.specialRay?.active, x: gameState.playerX, width: 40 },
        { active: gameState.specialRay2?.active2, x: gameState.playerX, width: 40 }
    ];

    activeRays.forEach(ray => {
        if (ray.active) {
            // --- 4a. Rimozione PROIETTILI NEMICI COMUNI ---
            if (gameState.enemyBullets) {
                for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
                    const eb = gameState.enemyBullets[i];
                    // Se il proiettile è dentro la larghezza del raggio e sopra il player
                    if (Math.abs(eb.x - ray.x) < (ray.width / 2 + eb.size / 2) && eb.y < gameState.playerY) {
                        createExplosion(eb.x, eb.y, '#ffffff'); // Feedback visivo della distruzione
                        gameState.enemyBullets.splice(i, 1);
                    }
                }
            }

            // --- 4b. Rimozione PROIETTILI BOSS ---
            if (gameState.bossBullets) {
                for (let i = gameState.bossBullets.length - 1; i >= 0; i--) {
                    const bb = gameState.bossBullets[i];
                    if (Math.abs(bb.x - ray.x) < (ray.width / 2 + bb.size / 2) && bb.y < gameState.playerY) {
                        createExplosion(bb.x, bb.y, '#ffffff');
                        gameState.bossBullets.splice(i, 1);
                    }
                }
            }

            // --- 4c. Nemici normali ---
            for (let e = gameState.enemies.length - 1; e >= 0; e--) {
                const enemy = gameState.enemies[e];
                if (Math.abs(enemy.x - ray.x) < (ray.width / 2 + enemy.size / 2) && enemy.y < gameState.playerY) {
                    enemy.hp -= 5; 
                    if (enemy.hp <= 0) {
                        createExplosion(enemy.x, enemy.y, '#ffffff');
                        gameState.enemies.splice(e, 1);
                    } else if (Math.random() > 0.9) {
                       createExplosion(enemy.x, enemy.y, '#00ffff');
                    }
                }
            }

            // --- 4d. Boss ---
            if (gameState.bossActive && gameState.boss) {
                const hitBoxWidth = BOSS_HITBOX_RAD + ray.width / 2;
                if (Math.abs(gameState.boss.x - ray.x) < hitBoxWidth && gameState.boss.y < gameState.playerY) {
                    gameState.boss.hp -= 5; 
                    if (Math.random() > 0.8) {
                        createExplosion(
                            gameState.boss.x + (Math.random() - 0.5) * 40, 
                            gameState.boss.y + (Math.random() - 0.5) * 40, 
                            '#00ffff'
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
// --- ESPLOSIONI PIXEL ART ---

/**
 * Crea un'esplosione composta da singoli pixel/frammenti
 * @param {number} x - Coordinata X dell'impatto
 * @param {number} y - Coordinata Y dell'impatto
 * @param {string} color - Colore primario dei frammenti
 */
function createExplosion(x, y, color = '#FFC300') {
    const particleCount = 10; // Numero di pixel/frammenti
    
    for (let i = 0; i < particleCount; i++) {
        gameState.explosions.push({
            x: x,
            y: y,
            // Dimensioni variabili per un look meno uniforme
            size: Math.floor(Math.random() * 3) + 2, 
            // Velocità casuale: espansione radiale
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            // Durata della particella
            life: 1.0,
            decay: 0.02 + Math.random() * 0.04,
            color: color
        });
    }
}

/**
 * Aggiorna la posizione e la vita di ogni frammento
 */
export function updateExplosions() {
    gameState.explosions = gameState.explosions.filter(p => {
        // Movimento
        p.x += p.vx;
        p.y += p.vy;
        
        // Attrito (rallenta i frammenti col tempo)
        p.vx *= 0.95;
        p.vy *= 0.95;
        
        // Riduzione vita
        p.life -= p.decay;
        
        return p.life > 0;
    });
}

/**
 * Disegna i frammenti sulla griglia di gioco
 */
export function drawExplosions(ctx) {
    gameState.explosions.forEach(p => {
        // Calcoliamo la dimensione attuale basata sulla vita residua
        const currentSize = Math.max(1, Math.floor(p.size * p.life));
        
        ctx.fillStyle = p.color;
        
        // Usiamo Math.floor per "agganciare" i frammenti alla griglia di pixel
        ctx.fillRect(
            Math.floor(p.x), 
            Math.floor(p.y), 
            currentSize, 
            currentSize
        );
    });
}
