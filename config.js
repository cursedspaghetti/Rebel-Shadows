/**
 * CONFIGURATION CONSTANTS
 * Static values that define the game rules and dimensions.
 */
export const CONFIG = {
    CANVAS_WIDTH: 393,
    CANVAS_HEIGHT: 852,
    GAME_TIME: 60, // seconds until boss
    SCROLL_SPEED: 1,
    FIRE_RATE_LEVELS: {
        1: 200, // Base: 200 ms
        2: 120, // Level 2
        3: 70   // Level 3
    },
    RING_COLORS: {
        'WHITE': '#fff',
        'BROWN': '#5d4037',
        'RED': '#af0000',
        'BLUE': '#0000ff',
        'GREEN': '#388e3c',
        'YELLOW': '#ffeb3b',
        'PURPLE': '#800080'
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

    // Special Attack State
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

    // World & Entities
    enemies: [],
    gameTimer: 60,
    timerInterval: null,
    bossActive: false,
    
    // Background Rings (Start Screen)
    rings: [],
    backgroundPositionY: 0
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
    gameState.playerTrail = [];
}
