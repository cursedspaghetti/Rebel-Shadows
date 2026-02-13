/**
 * CONFIGURATION CONSTANTS
 */
export const CONFIG = {
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight,
    GAME_TIME: 60,             
    SCROLL_SPEED: 2.5,
    PARALLAX_SPEED: 1,      
    
    BOSS: {
        MAX_HP: 100,
        PHASE_2_THRESHOLD: 0.5,
        FLOAT_SPEED: 0.003,
        FLOAT_AMP: 15, // Rinominato da AMPLITUDE per coerenza con la logica
        LERP_SPEED: 0.02,
        LERP_SPEED_P2: 0.04,
        
        // Attacco RADIALE (Sventagliata)
        RADIAL: {
            INTERVAL: 8000,
            COOLDOWN_P2: 0.6,
            WAVES: 4,
            BULLETS_PER_WAVE: 14,
            SPEED_P1: 5,  // Rinominato da BULLET_SPEED
            SPEED_P2: 6,  // Rinominato da BULLET_SPEED_P2
            DELAY_BETWEEN_BULLETS: 30, // Rinominato da BULLET_DELAY
            DELAY_BETWEEN_WAVES: 100,  // Rinominato da WAVE_PAUSE
            ANGLE_START: 40, // Rinominato da ARC_START
            ANGLE_END: 140,   // Rinominato da ARC_END
            COLOR: '#ff00ff',
            SIZE: 20          
        },

        // Attacco MIRATO
        TARGETED: {
            INTERVAL: 5000,
            COUNT_P1: 7,
            COUNT_P2: 14,
            SPEED_P1: 10,
            SPEED_P2: 13,
            DELAY_P1: 180,
            DELAY_P2: 100,
            COLOR: '#00ffff',
            SIZE: 18          
        },

        // DASH
        DASH: {
            INTERVAL_MIN: 10000, // Rinominato da INTERVAL_BASE
            INTERVAL_VAR: 7000,
            SPEED: 15,
            SPEED_P2_MULT: 1.2
        }
    },
    
    PLAYER_MAX_HP: 100,
    COLLISION_DAMAGE: 20,    
    INVULNERABILITY_TIME: 1500, 
    
    SHAKE_DECAY: 0.9,        
    
    FIRE_RATE_LEVELS: {
        1: 200, 
        2: 120, 
        3: 70   
    },
    
    TOUCH: {
        LERP: 0.05,
        OFFSET_Y: 70,
        DOUBLE_TAP_DELAY: 300
    }
};

/**
 * GLOBAL GAME STATE
 */
/**
 * GLOBAL GAME STATE
 */
export let gameState = {
    // --- Nuove variabili per Skill Tree e Progresso ---
    bossDefeatedCount: 0, // Tiene traccia di quanti boss hai ucciso
    playerSkills: {
        offense: 0,
        defense: 0,
        speed: 0,
        magic: 0,
        points: 0 // Punti da spendere
    },

    // --- Stati Schermata e UI ---
    bubbleAlpha1: 0,
    bubbleAlpha2: 0,
    bookAlpha: 0,
    wizIdAlpha: 0,   
    fadeSpeed: 0.016, 
    
    currentScreen: 'start', 
    screenShake: 0,           
    
    // --- Statistiche Giocatore ---
    hp: CONFIG.PLAYER_MAX_HP,
    isInvulnerable: false,
    lastDamageTime: 0,
    playerX: CONFIG.CANVAS_WIDTH / 2,
    playerY: CONFIG.CANVAS_HEIGHT - 300,
    playerSpeed: 3, // Questo verrà modificato dallo skill tree 'speed'
    playerTrail: [],
    
    // --- Input ---
    keys: {},
    touchIdentifier: null,
    touchX: null,
    touchY: null,
    isTouchActive: false,

    // --- Sistema di Fuoco ---
    fireRateLevel: 1,
    bulletLevel: 3,
    fireRate: 200,
    lastShotTime: 0,
    bullets: [], 
    enemyBullets: [], 

    // --- Abilità Speciali 1 ---
    shieldActive: false,
    shieldDuration: 5,
    shieldStartTime: 0,
    shieldCooldown: 15,
    shieldLastUsed: 0,
    shieldOnCooldown: false,
    
    specialCooldown: 10,
    specialLastUsed: 0,
    specialOnCooldown: false,
    specialRay: { 
        active: false,
        x: 0,
        maxWidth: 250,
        currentWidth: 0,
        duration: 0.8,
        startTime: 0
    },
    isCharging: false,
    rayParticles: [],

    // --- Abilità Speciali 2 ---
    specialCooldown2: 10,
    specialLastUsed2: 0,
    specialOnCooldown2: false,
    specialRay2: { 
        active2: false,
        x2: 0,
        maxWidth2: 250,
        currentWidth2: 0,
        duration2: 0.8,
        startTime2: 0
    },
    isCharging2: false,
    rayParticles2: [],
    
    // --- Entità e Mondo ---
    enemies: [],      
    bossBullets: [],  
    explosions: [],
    gameTimer: CONFIG.GAME_TIME,
    timerInterval: null,
    
    // --- Gestione Boss ---
    bossActive: false,
    boss: null, // Inizializzato a null perché lo creiamo con spawnBoss()
    lastEnemySpawn: 0,
    
    backgroundPositionY: 0,
    parallaxPositionY: 0
};
