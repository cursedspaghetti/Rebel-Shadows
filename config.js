/**
 * CONFIGURATION CONSTANTS
 * Static values that define the game rules and dimensions.
 */


export const CONFIG = {

    
    CANVAS_WIDTH: 393,
    CANVAS_HEIGHT: 852,
    GAME_TIME: 60, // seconds until boss
    SCROLL_SPEED: 1,
    PARALLAX_SPEED: 0.5,      // Velocità delle stelle lontane (lento)
    
    FIRE_RATE_LEVELS: {
        1: 200, // Base: 200 ms
        2: 120, // Level 2
        3: 70   // Level 3
    },
    RING_COLORS: {
        'WHITE': '#fff',
        'PURPLE': '#800080'
    },
    TOUCH: {
        LERP: 0.05,
        OFFSET_Y: 70,
        DOUBLE_TAP_DELAY: 300
    }
};

/**
 * GLOBAL GAME STATE
 * Dynamic values that change during gameplay.
 */
export let gameState = {
    // Screen Management
    currentScreen: 'start', // 'start', 'playing', 'powerup', 'boss'
    
    // Player Properties
    selectedRingColor: null,
    playerX: 393 / 2, // Initialized with CANVAS_WIDTH / 2
    playerY: 852 - 300, // Initialized with CANVAS_HEIGHT - 300
    playerSpeed: 3,
    playerTrail: [],
    
    // Input State
    keys: {},
    touchIdentifier: null,
    touchX: null,
    touchY: null,

    // Combat Stats
    fireRateLevel: 1,
    bulletLevel: 3,
    fireRate: 200,
    lastShotTime: 0,
    bullets: [],

    // Special Attack State 1
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

    // Special Attack State 2
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
    gameTimer: 60,
    timerInterval: null,
    bossActive: false,
    lastEnemySpawn: 0,
    
    //backgroudposition
    backgroundPositionY: 0,   // Per il livello principale
    parallaxPositionY: 0      // Per il livello lontano
};

/**
 * HELPER: Reset State
 * Useful if you want to restart the game without refreshing the page.
 */
export function resetGameState() {
    gameState.playerX = CONFIG.CANVAS_WIDTH / 2;
    gameState.playerY = CONFIG.CANVAS_HEIGHT - 300;
    gameState.bullets = [];
    gameState.enemies = [];
    gameState.gameTimer = CONFIG.GAME_TIME;
    gameState.bossActive = false;
    gameState.specialOnCooldown = false;
    gameState.specialOnCooldown2 = false;

}
