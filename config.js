/**
 * CONFIGURATION CONSTANTS
 */
export const CONFIG = {
    CANVAS_WIDTH: 393,
    CANVAS_HEIGHT: 852,
    GAME_TIME: 60,            
    SCROLL_SPEED: 2.5,
    PARALLAX_SPEED: 1,      
    
    BOSS: {
        MAX_HP: 5000,
        PHASE_2_THRESHOLD: 0.5,
        FLOAT_SPEED: 0.003,
        FLOAT_AMPLITUDE: 15,
        LERP_SPEED: 0.02,
        
        // Attacco RADIALE (Sventagliata)
        RADIAL: {
            INTERVAL: 5000,
            COOLDOWN_P2: 0.6,
            WAVES: 4,
            BULLETS_PER_WAVE: 20,
            BULLET_SPEED: 4,
            BULLET_SPEED_P2: 5,
            BULLET_DELAY: 20,
            WAVE_PAUSE: 300,
            ARC_START: 40,
            ARC_END: 140,
            COLOR: '#ff00ff', // <--- MANCAVA: Aggiunto
            SIZE: 20          // <--- MANCAVA: Aggiunto
        },

        // Attacco MIRATO
        TARGETED: {
            INTERVAL: 4000,
            COUNT_P1: 5,
            COUNT_P2: 8,
            SPEED_P1: 7,
            SPEED_P2: 9,
            DELAY_P1: 180,
            DELAY_P2: 100,
            COLOR: '#00ffff', // <--- MANCAVA: Aggiunto
            SIZE: 18          // <--- MANCAVA: Aggiunto
        },

        // DASH
        DASH: {
            INTERVAL_BASE: 9000,
            INTERVAL_VAR: 6000,
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
    
 bubbleAlpha1: 0,
 bubbleAlpha2: 0,
 bookAlpha: 0,
 wizIdAlpha: 0,   
 fadeSpeed: 0.016, // Circa 1 secondo a 60fps (1 / 60)
    
    currentScreen: 'start', 
    screenShake: 0,         
    
    hp: CONFIG.PLAYER_MAX_HP,
    isInvulnerable: false,
    lastDamageTime: 0,
    playerX: CONFIG.CANVAS_WIDTH / 2,
    playerY: CONFIG.CANVAS_HEIGHT - 300,
    playerSpeed: 3,
    playerTrail: [],
    
    keys: {},
    touchIdentifier: null,
    touchX: null,
    touchY: null,
    isTouchActive: false,

    fireRateLevel: 1,
    bulletLevel: 3,
    fireRate: 200,
    lastShotTime: 0,
    bullets: [], 
    enemyBullets: [], // <--- Gestione proiettili nemici base

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
    
    enemies: [],      
    bossBullets: [],  
    explosions: [],
    gameTimer: CONFIG.GAME_TIME,
    timerInterval: null,
    
    bossActive: false,
    boss: {
        x: CONFIG.CANVAS_WIDTH / 2,
        y: -200,
        hp: CONFIG.BOSS_MAX_HP,
        maxHp: CONFIG.BOSS_MAX_HP,
        targetX: CONFIG.CANVAS_WIDTH / 2,
        lastShot: 0,
        lastRadialShot: 0,    
        lastDash: 0,          
        isDashing: false,     
        dashVX: 0,            
        dashVY: 0,            
        phase: 1
    },
    lastEnemySpawn: 0,
    
    backgroundPositionY: 0,
    parallaxPositionY: 0
};

/**
 * HELPER: Reset State
 */
export function resetGameState() {
    gameState.hp = CONFIG.PLAYER_MAX_HP;
    gameState.isInvulnerable = false;
    gameState.lastDamageTime = 0;
    gameState.screenShake = 0;
    gameState.playerX = CONFIG.CANVAS_WIDTH / 2;
    gameState.playerY = CONFIG.CANVAS_HEIGHT - 300;
    
    gameState.bullets = [];
    gameState.enemies = [];
    gameState.bossBullets = [];
    gameState.enemyBullets = []; // <--- Reset aggiunto
    gameState.explosions = [];
    
    gameState.gameTimer = CONFIG.GAME_TIME;
    
    gameState.bossActive = false;
    gameState.boss = {
        x: CONFIG.CANVAS_WIDTH / 2,
        y: -200,
        hp: CONFIG.BOSS_MAX_HP,
        maxHp: CONFIG.BOSS_MAX_HP,
        targetX: CONFIG.CANVAS_WIDTH / 2,
        lastShot: 0,
        lastRadialShot: Date.now(),
        lastDash: Date.now(),
        isDashing: false,
        dashVX: 0,
        dashVY: 0,
        phase: 1
    };

    gameState.specialOnCooldown = false;
    gameState.specialOnCooldown2 = false;
    gameState.shieldActive = false;
    gameState.shieldOnCooldown = false;
    gameState.currentScreen = 'playing';
}
