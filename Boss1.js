import { CONFIG, gameState } from './config.js';

/**
 * Aggiorna la logica del Boss: movimento fluido, raggera e carica mirata
 */
export function updateBoss(boss, player) {
    if (!boss || boss.hp <= 0) return;

    const now = Date.now();

    // 1. GESTIONE MOVIMENTO (DASH vs FLOATING)
    if (boss.isDashing) {
        // Applica la velocità vettoriale calcolata al momento del via
        boss.x += boss.dashVX;
        boss.y += boss.dashVY;

        // Se esce dai bordi (più un margine), resetta lo stato
        if (boss.y > CONFIG.CANVAS_HEIGHT + 150 || boss.x < -150 || boss.x > CONFIG.CANVAS_WIDTH + 150) {
            boss.isDashing = false;
            boss.y = -150; // Ricompare dall'alto
            boss.targetX = CONFIG.CANVAS_WIDTH / 2;
        }
    } else {
        // MOVIMENTO NORMALE (Floating)
        if (boss.y < 150) boss.y += 4; // Rientro in posizione dopo il dash
        else boss.y = 150;

        // Movimento orizzontale verso il target casuale
        if (Math.abs(boss.x - boss.targetX) < 10) {
            boss.targetX = Math.random() * (CONFIG.CANVAS_WIDTH - 200) + 100;
        }
        boss.x += (boss.targetX - boss.x) * 0.02;

        // 2. LOGICA ATTACCHI (Solo se non sta caricando)
        
        // A. Fuoco Standard (ogni 2 secondi)
        if (now - boss.lastShot > 2000) {
            spawnBossBullet(boss.x, boss.y + 20);
            boss.lastShot = now;
        }

        // B. Attacco a Raggera (intervallo configurato)
        const radialInterval = CONFIG.BOSS_ATTACKS.RADIAL_INTERVAL[0] + Math.random() * 3000;
        if (now - boss.lastRadialShot > radialInterval) {
            spawnRadialAttack(boss.x, boss.y);
            boss.lastRadialShot = now;
        }

        // C. Carica Mirata verso il Player (intervallo configurato)
        const dashInterval = CONFIG.BOSS_ATTACKS.DASH_INTERVAL[0] + Math.random() * 6000;
        if (now - boss.lastDash > dashInterval) {
            startDash(boss, player);
            boss.lastDash = now;
        }
    }
}

/**
 * Inizia la carica: calcola il vettore verso la posizione attuale del player
 */
function startDash(boss, player) {
    boss.isDashing = true;

    // Calcolo distanza tra boss e giocatore
    const dx = (player.x || gameState.playerX) - boss.x;
    const dy = (player.y || gameState.playerY) - boss.y;
    
    // Angolo verso il player
    const angle = Math.atan2(dy, dx);
    
    // Velocità definita nel config
    const speed = CONFIG.BOSS_ATTACKS.DASH_SPEED;
    
    // Scomposizione in componenti X e Y
    boss.dashVX = Math.cos(angle) * speed;
    boss.dashVY = Math.sin(angle) * speed;
}

/**
 * Crea proiettili che si espandono in tutte le direzioni
 */
function spawnRadialAttack(startX, startY) {
    const numBullets = CONFIG.BOSS_ATTACKS.RADIAL_BULLET_COUNT;
    const speed = CONFIG.BOSS_ATTACKS.RADIAL_BULLET_SPEED;

    for (let i = 0; i < numBullets; i++) {
        const angle = (Math.PI * 2 / numBullets) * i;
        gameState.enemies.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 25,
            color: '#ff00ff',
            isBossBullet: true
        });
    }
}

/**
 * Proiettile base che scende verticalmente
 */
function spawnBossBullet(x, y) {
    gameState.enemies.push({
        x: x,
        y: y,
        vx: 0,
        vy: 5,
        size: 30,
        color: '#8a2be2',
        isBossBullet: true
    });
}
