/**
 * CONFIGURATION CONSTANTS
 */
export const CONFIG = {
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight,
    GAME_TIME: 60,              
    SCROLL_SPEED: 2.5,
    PARALLAX_SPEED: 1,      

   // --- CONFIGURAZIONE TOUCH ---
    TOUCH : {
    LERP: 0.2,
    OFFSET_Y: 80,
    TAP_DELAY: 250
     },
    
    // --- Sistema Mago & Sprite ---
    WIZARD_SPRITE: {
        FRAME_SIZE: 50,      // Dimensione nativa del frame FRWC (50x50)
        RENDER_SCALE: 1.5,   // Scala di visualizzazione in gioco
        ANIM_SPEED: 100,     // Velocità animazione camminata (ms)
        TOTAL_FRAMES: 14     // Frame per ogni riga dello spritesheet
    },

    // --- Sistema Statistiche ---
    

    BOSS: {
        MAX_HP: 2000,
        PHASE_2_THRESHOLD: 0.5,
        FLOAT_SPEED: 0.003,
        FLOAT_AMP: 15,
        LERP_SPEED: 0.02,
        LERP_SPEED_P2: 0.04,
        
        RADIAL: {
            INTERVAL: 8000,
            COOLDOWN_P2: 0.6,
            WAVES: 4,
            BULLETS_PER_WAVE: 8,
            SPEED_P1: 5,
            SPEED_P2: 6,
            DELAY_BETWEEN_BULLETS: 30,
            DELAY_BETWEEN_WAVES: 100,
            ANGLE_START: 40,
            ANGLE_END: 140,
            COLOR: '#ff00ff',
            SIZE: 16          
        },

        TARGETED: {
            INTERVAL: 6000,
            COUNT_P1: 7,
            COUNT_P2: 14,
            SPEED_P1: 7,
            SPEED_P2: 9,
            DELAY_P1: 180,
            DELAY_P2: 100,
            COLOR: '##8b008b',
            SIZE: 40          
        },

        DASH: {
            INTERVAL_MIN: 10000,
            INTERVAL_VAR: 7000,
            SPEED: 15,
            SPEED_P2_MULT: 1.2
        }
    },
    
    PLAYER_MAX_HP: 100,  // HP - STAT
    Constitution: 5, // Defense - STAT 
    COLLISION_DAMAGE: 20,    
    INVULNERABILITY_TIME: 1500, 
    
    SHAKE_DECAY: 0.9,        
    
    FIRE_RATE_LEVELS: {
        1: 200, 
        2: 120, 
        3: 70   
    },
};

/**
 * GLOBAL GAME STATE
 */
export let gameState = {

playerSpeed: 3, // Speed - STAT
    
padOpacity : 0, // Per l'effetto fade-in/out
cameraY : 0, // La posizione della nostra visuale
worldY : 0,  // La posizione assoluta del giocatore nel mondo
    
    // --- Caratteristiche del Mago ---
    wizardData: {
        name: "",
        head: "",
        body: "",
        prop: "",
        familiar: "",
        rune: "",
        background: "",
        id: null
    },
    
    // Asset Caricati Dinamicamente
    wizardSpritesheet: null, // Memorizza l'immagine trasparente dello sprite
    lastLoadedId: null,      // Evita caricamenti doppi
    
     
    // --- Skill Tree e Progresso ---
    bossDefeatedCount: 0,
    playerSkills: {
        offense: 0,
        defense: 0,
        speed: 0,
        magic: 0,
        points: 0 
    },

    // --- Stati Schermata e UI ---
    currentScreen: 'start', 
    bubbleAlpha1: 0,
    bubbleAlpha2: 0,
    bookAlpha: 0,
    wizIdAlpha: 0,   
    fadeSpeed: 0.016, 
    screenShake: 0,            
    
    // --- Statistiche Effettive in Gioco ---
    hp: CONFIG.HP,
    isInvulnerable: false,
    lastDamageTime: 0,
    playerX: CONFIG.CANVAS_WIDTH / 2,
    playerY: CONFIG.CANVAS_HEIGHT - 300,
    
    playerDirection: 0, // 0: Giù, 1: Sinistra, 2: Destra, 3: Su
    isMoving: false,    // Per fermare l'animazione se il player è fermo
    playerTrail: [],

    
    // --- Input ---
    keys: {},
    touchIdentifier: null,
    touchX: CONFIG.CANVAS_WIDTH / 2, // Invece di null
    touchY: CONFIG.CANVAS_HEIGHT - 300, // Invece di null
    isTouchActive: false,

    // --- Sistema di Fuoco ---
    fireRateLevel: 1,
    bulletLevel: 3,
    fireRate: 200, // Attack_Rate - STAT
    lastShotTime: 0,
    bullets: [], 
    enemyBullets: [], 

    // --- Abilità Speciali 1 ---
    shieldActive: false,
    shieldDuration: 5, // Shield_Duration
    shieldStartTime: 0,
    shieldCooldown: 15, //Shield_CD
    shieldLastUsed: 0,
    shieldOnCooldown: false,
    
    specialCooldown: 10, // Special_CD
    specialLastUsed: 0,
    specialOnCooldown: false,
    specialRay: { 
        active: false,
        x: 0,
        maxWidth: 250, //
        currentWidth: 0, // Special_Width
        duration: 0.8, // Special_Duration
        startTime: 0
    },
    isCharging: false,
    rayParticles: [],

   
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
    bossPhaseTransition : false, // Un flag che il main leggerà una sola volta
    flashActive: false,         // Per l'effetto lampo/schermo
    flashStartTime: null,
    flashDuration: null, // Il flickering dura 2 secondi
    
    backgroundPositionY: 0,
    parallaxPositionY: 0
};
