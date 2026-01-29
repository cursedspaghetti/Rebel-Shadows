import { CONFIG, gameState } from './config.js';

export function updateBoss(boss, player) {
    if (!boss || boss.hp <= 0) return;

    const now = Date.now();

    // 1. INIZIALIZZAZIONE
    if (boss.targetX === undefined) boss.targetX = boss.x;
    if (boss.lastShot === undefined) boss.lastShot = now;
    if (boss.lastRadialShot === undefined) boss.lastRadialShot = now;
    if (boss.lastDash === undefined) boss.lastDash = now;
    if (boss.isDashing === undefined) boss.isDashing = false;

    // 2. LOGICA DI MOVIMENTO E ATTACCO CARICA
    if (boss.isDashing) {
        // Applichiamo il movimento calcolato al momento del lancio
        boss.x += boss.dashVX;
        boss.y += boss.dashVY;

        // Se esce dai bordi del canvas, finisce la carica
        if (boss.y > CONFIG.CANVAS_HEIGHT + 100 || boss.x < -100 || boss.x > CONFIG.CANVAS_WIDTH + 100) {
            boss.isDashing = false;
            // Lo facciamo rientrare dall'alto sopra il centro
            boss.y = -150; 
            boss.targetX = CONFIG.CANVAS_WIDTH / 2;
        }
    } else {
        // MOVIMENTO NORMALE (Floating)
        if (boss.y < 150) boss.y += 4; // Rientro fluido dopo il dash
        else boss.y = 150;

        if (Math.abs(boss.x - boss.targetX) < 10) {
            boss.targetX = Math.random() * (CONFIG.CANVAS_WIDTH - 200) + 100;
        }
        boss.x += (boss.targetX - boss.x) * 0.02;

        // 3. TRIGGER ATTACCHI

        // A. Proiettile standard
        if (now - boss.lastShot > 2000) {
            spawnBossBullet(boss.x, boss.y + 20);
            boss.lastShot = now;
        }

        // B. Raggera (5-8 secondi)
        const radialInterval = 5000 + Math.random() * 3000;
        if (now - boss.lastRadialShot > radialInterval) {
            spawnRadialAttack(boss.x, boss.y);
            boss.lastRadialShot = now;
        }

        // C. CARICA MIRATA (9-15 secondi)
        const dashInterval = 9000 + Math.random() * 6000;
        if (now - boss.lastDash > dashInterval) {
            startDash(boss, player);
            boss.lastDash = now;
        }
    }
}

/**
 * Calcola la traiettoria verso il player per la carica
 */
function startDash(boss, player) {
    boss.isDashing = true;

    // Calcoliamo la distanza tra boss e player
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    
    // Calcoliamo l'angolo
    const angle = Math.atan2(dy, dx);
    
    // Definiamo la velocità della carica
    const speed = 12;
    
    // Salviamo le componenti della velocità nel boss
    boss.dashVX = Math.cos(angle) * speed;
    boss.dashVY = Math.sin(angle) * speed;
}

// --- Funzioni di supporto per i proiettili ---

function spawnRadialAttack(startX, startY) {
    const numBullets = 12;
    for (let i = 0; i < numBullets; i++) {
        const angle = (Math.PI * 2 / numBullets) * i;
        const speed = 5;
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
