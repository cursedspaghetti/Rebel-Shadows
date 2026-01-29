/**
 * CONFIGURATION CONSTANTS
 */
export const CONFIG = {
    // Dimensioni Canvas
    CANVAS_WIDTH: 393,
    CANVAS_HEIGHT: 852,
    
    // Regole di Gioco
    GAME_TIME: 60,           
    SCROLL_SPEED: 2.5,
    PARALLAX_SPEED: 1,      
    
    // Boss Stats
    BOSS_MAX_HP: 500,        // Vita totale del boss
    BOSS_PHASE_2_THRESHOLD: 0.5, // Entra in fase 2 al 50% HP
    
    // Player Stats & Health
    PLAYER_MAX_HP: 100,
    COLLISION_DAMAGE: 20,    
    INVULNERABILITY_TIME: 1500, 
    
    // Camera Shake
    SHAKE_DECAY: 0.9,       
    
    // Meccaniche di Fuoco
    FIRE_RATE_LEVELS: {
        1: 200, 
        2: 120, 
        3: 70   
    },
    
    // Estetica
    RING_COLORS: {
        'WHITE': '#fff',
        'PURPLE': '#800080'
    },
    
    // Input & Touch
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
    // Screen Management
    currentScreen: 'start', 
    screenShake: 0,        
    
    // Player Properties & Health
    selectedRingColor: null,
    hp: CONFIG.PLAYER_MAX_HP,
    isInvulnerable: false,
    lastDamageTime: 0,
    playerX: CONFIG.CANVAS_WIDTH / 2,
    playerY: CONFIG.CANVAS_HEIGHT - 300,
    playerSpeed: 3,
    playerTrail: [],
    
    // Input State
    keys: {},
    touchIdentifier: null,
    touchX: null,
    touchY: null,
    isTouchActive: false,

    // Combat Stats
    fireRateLevel: 1,
    bulletLevel: 3,
    fireRate: 200,
    lastShotTime: 0,
    bullets: [],

    // Shield State
    shieldActive: false,
    shieldDuration: 5,
    shieldStartTime: 0,
    shieldCooldown: 15,
    shieldLastUsed: 0,
    shieldOnCooldown: false,
    
    // Special Attack 1 (Ray)
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

    // Special Attack 2 (Ray alternative)
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
    
    // World & Entities
    enemies: [],
    explosions: [],
    gameTimer: CONFIG.GAME_TIME,
    timerInterval: null,
    
    // Boss Management
    bossActive: false,
    boss: {
        x: CONFIG.CANVAS_WIDTH / 2,
        y: -200,             // Parte fuori schermo
        hp: CONFIG.BOSS_MAX_HP,
        maxHp: CONFIG.BOSS_MAX_HP,
        targetX: CONFIG.CANVAS_WIDTH / 2,
        lastShot: 0,
        phase: 1
    },
    lastEnemySpawn: 0,
    
    // Background Position
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
    gameState.gameTimer = CONFIG.GAME_TIME;
    
    // Reset Boss
    gameState.bossActive = false;
    gameState.boss = {
        x: CONFIG.CANVAS
