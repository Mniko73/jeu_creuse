// Configuration du jeu
export const CONFIG = {
  TILE_SIZE: 32,
  GRID_WIDTH: 12,
  GRID_HEIGHT: 18,
  OXYGEN_DECREASE_RATE: 800,
  MONSTER_MOVE_INTERVAL: 3000,
  HEALTH_REGEN_INTERVAL: 5000,
  AUTOSAVE_INTERVAL: 10000,
  BIOME_TRANSITION_DEPTH: 20,
  WS_URL: 'ws://localhost:8080',
  MAX_HEALTH: 100,
  MAX_OXYGEN: 100,
  LEVEL_XP_BASE: 100,
  LEVEL_XP_MULTIPLIER: 1.5
};

// Biomes du jeu
export const BIOMES = {
  SURFACE: { 
    id: 'surface', 
    name: 'Surface', 
    emoji: '🌱',
    depthRange: [0, 15],
    blocks: { normal: 0.4, stone: 0.25, wood: 0.2, bonus: 0.1, oxygen: 0.05 },
    bgColor: ['#87CEEB', '#98FB98'],
    monsters: [],
    oxygenModifier: 1.0,
    difficulty: 1
  },
  UNDERGROUND: { 
    id: 'underground', 
    name: 'Souterrain', 
    emoji: '⛏️',
    depthRange: [16, 40],
    blocks: { normal: 0.35, stone: 0.3, coal: 0.15, bonus: 0.15, trap: 0.05 },
    bgColor: ['#8B4513', '#A0522D'],
    monsters: ['goblin'],
    oxygenModifier: 1.2,
    difficulty: 2
  },
  DESERT: { 
    id: 'desert', 
    name: 'Désert Souterrain', 
    emoji: '🏜️',
    depthRange: [41, 80],
    blocks: { sand: 0.3, sandstone: 0.25, cactus: 0.1, glass: 0.1, bonus: 0.2, trap: 0.05 },
    bgColor: ['#F4A460', '#DEB887'],
    monsters: ['scorpion', 'sand_worm'],
    oxygenModifier: 1.5,
    difficulty: 3,
    special: 'heat_damage'
  },
  OCEAN: { 
    id: 'ocean', 
    name: 'Profondeurs Océaniques', 
    emoji: '🌊',
    depthRange: [81, 120],
    blocks: { water: 0.2, coral: 0.2, pearl: 0.15, kelp: 0.15, stone: 0.2, treasure: 0.1 },
    bgColor: ['#006994', '#0077BE'],
    monsters: ['fish', 'shark', 'kraken'],
    oxygenModifier: 0.8,
    difficulty: 4,
    special: 'water_breathing'
  },
  LAVA: { 
    id: 'lava', 
    name: 'Grottes de Lave', 
    emoji: '🌋',
    depthRange: [121, 180],
    blocks: { obsidian: 0.3, lava: 0.15, fire_crystal: 0.2, metal: 0.15, bonus: 0.15, trap: 0.05 },
    bgColor: ['#FF4500', '#DC143C'],
    monsters: ['fire_elemental', 'lava_golem'],
    oxygenModifier: 2.0,
    difficulty: 5,
    special: 'heat_damage'
  },
  CRYSTAL: { 
    id: 'crystal', 
    name: 'Cavernes Cristallines', 
    emoji: '💎',
    depthRange: [181, 999],
    blocks: { crystal: 0.25, diamond: 0.15, magic_crystal: 0.2, stone: 0.2, rare_gem: 0.1, bonus: 0.1 },
    bgColor: ['#9370DB', '#DDA0DD'],
    monsters: ['crystal_guardian', 'void_wraith'],
    oxygenModifier: 1.8,
    difficulty: 6,
    special: 'magic_enhancement'
  }
};

// Recettes de craft
export const CRAFTING_RECIPES = {
  'wooden_pickaxe': {
    name: 'Pioche en Bois',
    materials: { wood: 3, stone: 2 },
    result: { type: 'tool', subtype: 'pickaxe', power: 2, durability: 25 },
    category: 'tools',
    unlockLevel: 1
  },
  'stone_pickaxe': {
    name: 'Pioche en Pierre',
    materials: { stone: 5, wood: 2 },
    result: { type: 'tool', subtype: 'pickaxe', power: 3, durability: 50 },
    category: 'tools',
    unlockLevel: 3
  },
  // ... (ajoute les autres recettes ici)
  'oxygen_tank_small': {
    name: 'Petit Réservoir O₂',
    materials: { metal: 2, glass: 1 },
    result: { type: 'consumable', subtype: 'oxygen', value: 30 },
    category: 'consumables',
    unlockLevel: 2
  }
  // Ajoute le reste des recettes...
};

// Quêtes
export const QUESTS = {
  first_dig: {
    id: 'first_dig',
    title: 'Premier Creusage',
    description: 'Creusez votre premier bloc',
    type: 'dig',
    target: 1,
    reward: { experience: 25, items: { wood: 5 } },
    unlockLevel: 1
  },
  // ... (autres quêtes)
};

// NPCs
export const NPCS = {
  miner_bob: {
    id: 'miner_bob',
    name: 'Bob le Mineur',
    emoji: '👷',
    x: 5, y: 25,
    dialogs: {
      first_meet: {
        text: "Salut, nouveau mineur ! Les profondeurs regorgent de trésors mais attention aux dangers... Tu veux des conseils ?",
        options: [
          { text: "Quels dangers ?", response: "danger_info" },
          { text: "Des conseils pour débuter ?", response: "beginner_tips" },
          { text: "Parle-moi des biomes", response: "biome_info" },
          { text: "Au revoir", response: "goodbye" }
        ]
      },
      // ... (autres dialogues)
    },
    currentDialog: 'first_meet',
    quests: ['first_dig', 'depth_explorer'],
    shop: {
      wooden_pickaxe: { price: { wood: 2 } },
      oxygen_tank_small: { price: { stone: 5 } }
    }
  }
  // ... (autres NPCs)
};

// Styles des blocs (centralisé pour éviter doublons)
export const BLOCK_STYLES = {
  normal: { color: '#8B4513', emoji: '🟫' },
  stone: { color: '#696969', emoji: '🪨' },
  wood: { color: '#964B00', emoji: '🪵' },
  bonus: { color: '#FFD700', emoji: '⭐' },
  oxygen: { color: '#00FFFF', emoji: '🫧' },
  coal: { color: '#333333', emoji: '⚫' },
  trap: { color: '#FF0000', emoji: '💥' },
  sand: { color: '#F4A460', emoji: '🏖️' },
  sandstone: { color: '#DEB887', emoji: '🪨' },
  cactus: { color: '#2ECC71', emoji: '🌵' },
  glass: { color: '#87CEEB', emoji: '🔲' },
  water: { color: '#0077BE', emoji: '💧' },
  coral: { color: '#FF4040', emoji: '🪸' },
  pearl: { color: '#E6E6FA', emoji: '🦪' },
  kelp: { color: '#228B22', emoji: '🌿' },
  treasure: { color: '#FFD700', emoji: '💰' },
  obsidian: { color: '#2F2F2F', emoji: '⬛' },
  lava: { color: '#FF4500', emoji: '🌋' },
  fire_crystal: { color: '#FF6347', emoji: '🔥' },
  metal: { color: '#B0C4DE', emoji: '⚙️' },
  crystal: { color: '#9370DB', emoji: '💎' },
  diamond: { color: '#B9F2FF', emoji: '💎' },
  magic_crystal: { color: '#DA70D6', emoji: '🔮' },
  rare_gem: { color: '#FF1493', emoji: '💍' },
  dug: { color: 'rgba(0,0,0,0.3)', emoji: '' }
};