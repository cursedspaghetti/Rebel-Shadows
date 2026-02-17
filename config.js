/**
 * CONFIGURATION CONSTANTS
 */
export const CONFIG = {
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight,
    GAME_TIME: 60,              
    SCROLL_SPEED: 2.5,
    PARALLAX_SPEED: 1,      
    
    // --- Sistema Statistiche ---
    BASE_STATS_VALUE: 10,
    MAX_STATS_VALUE: 100,
    INITIAL_ESSENCES: 10,

    BOSS: {
        MAX_HP: 100,
        PHASE_2_THRESHOLD: 0.5,
        FLOAT_SPEED: 0.003,
        FLOAT_AMP: 15,
        LERP_SPEED: 0.02,
        LERP_SPEED_P2: 0.04,
        
        RADIAL: {
            INTERVAL: 4000,
            COOLDOWN_P2: 0.6,
            WAVES: 4,
            BULLETS_PER_WAVE: 14,
            SPEED_P1: 5,
            SPEED_P2: 6,
            DELAY_BETWEEN_BULLETS: 30,
            DELAY_BETWEEN_WAVES: 100,
            ANGLE_START: 40,
            ANGLE_END: 140,
            COLOR: '#ff00ff',
            SIZE: 20          
        },

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

        DASH: {
            INTERVAL_MIN: 10000,
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
export let gameState = {
    // --- Caratteristiche del Mago (Character Setup) ---
    "name",
    "head",
    "body",
    "prop",
    "familiar",
    "rune",
    "background",
    
    essences: CONFIG.INITIAL_ESSENCES, // Punti da allocare all'inizio
    
    // Statistiche Base (10/100)
    baseStats: {
        "Attack Power": 10,
        "Attack Rate": 10,
        "Dexterity": 10,
        "HP": 100,
        "Constitution": 10,
        "Elusion": 10
    },
    
    // Punti aggiunti manualmente dal player
    addedStats: {
        "Attack Power": 0, "Attack Rate": 0, "Dexterity": 0, 
        "HP": 0, "Constitution": 0, "Elusion": 0
    },
    
    // Bonus derivanti dal tratto "Affinity" del Wizard
    affinityBonuses: {
        "Attack Power": 0, "Attack Rate": 0, "Dexterity": 0, 
        "HP": 0, "Constitution": 0, "Elusion": 0
    },

    // --- Skill Tree e Progresso ---
    bossDefeatedCount: 0,
    playerSkills: {
        offense: 0,
        defense: 0,
        speed: 0,
        magic: 0,
        points: 0 // Punti guadagnati uccidendo i boss
    },

    // --- Stati Schermata e UI ---
    currentScreen: 'start', // 'start', 'setup', 'playing', 'powerup'
    bubbleAlpha1: 0,
    bubbleAlpha2: 0,
    bookAlpha: 0,
    wizIdAlpha: 0,   
    fadeSpeed: 0.016, 
    screenShake: 0,            
    
    // --- Statistiche Effettive in Gioco ---
    hp: CONFIG.PLAYER_MAX_HP,
    isInvulnerable: false,
    lastDamageTime: 0,
    playerX: CONFIG.CANVAS_WIDTH / 2,
    playerY: CONFIG.CANVAS_HEIGHT - 300,
    playerSpeed: 3, 
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

    // --- Abilità Speciali 1 (Shield / Ray) ---
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

    // --- Abilità Speciali 2 (Ray 2) ---
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
    boss: null, 
    lastEnemySpawn: 0,
    
    backgroundPositionY: 0,
    parallaxPositionY: 0
};
