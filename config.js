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
    BOSS_MAX_HP: 5000, 
    BOSS_PHASE_2_THRESHOLD: 0.5,
    
    // Boss Attacks Settings
    BOSS_ATTACKS: {
        RADIAL_INTERVAL: [5000, 8000], // Range ms per raggera
        DASH_INTERVAL: [9000, 15000],  // Range ms per carica
        DASH_SPEED: 14,                // Velocità della carica
        RADIAL_BULLET_COUNT: 12,       // Quanti proiettili nella raggera
        RADIAL_BULLET_SPEED: 5         // Velocità proiettili raggera
    },
    
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
    bullets: [], // Proiettili Player

    // Shield State
    shieldActive: false,
    shieldDuration: 5,
    shieldStartTime: 0,
    shieldCooldown: 15,
    shieldLastUsed: 0,
    shieldOnCooldown: false,
    
    // Special Attacks
    specialOnCooldown: false,
    specialLastUsed: 0,
    specialRay: { active: false, x: 0, maxWidth: 250, currentWidth: 0, duration: 0.8, startTime: 0 },
    
    specialOnCooldown2: false,
    specialLastUsed2: 0,
    specialRay2: { active2: false, x2: 0, maxWidth2: 250, currentWidth2: 0, duration2: 0.8, startTime2: 0 },

    isCharging: false,
    isCharging2: false,
    rayParticles: [],
    rayParticles2: [],
    
    // World & Entities
    enemies: [],      // Nemici base
    bossBullets: [],  // <--- AGGIUNTO: Proiettili specifici del Boss
    explosions: [],
    gameTimer: CONFIG.GAME_TIME,
    timerInterval: null,
    
    // Boss Management
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
    
    // Reset Array Entità
    gameState.bullets = [];
    gameState.enemies = [];
    gameState.bossBullets = []; // <--- AGGIUNTO: Reset proiettili boss
    gameState.explosions = [];
    
    gameState.gameTimer = CONFIG.GAME_TIME;
    
    // Reset Boss con i nuovi parametri
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
