import { CONFIG, BIOMES } from './config.js';
import { darkenColor } from './utils.js';

export class AdvancedPlayer {
  constructor(id, color) {
    this.id = id;
    this.color = color || '#4CAF50';
    this.name = `Joueur ${id}`;
    this.x = 5;
    this.y = 0;
    this.depth = 0;
    this.level = 1;
    this.experience = 0;
    this.score = 0;
    this.health = CONFIG.MAX_HEALTH;
    this.maxHealth = CONFIG.MAX_HEALTH;
    this.oxygen = CONFIG.MAX_OXYGEN;
    this.maxOxygen = CONFIG.MAX_OXYGEN;
    this.equipment = new Map();
    this.currentBiome = 'surface';
    this.justLeveledUp = false;
  }

  move(dx, world, inventory) {
    const newX = this.x + dx;
    if (newX < 0 || newX >= CONFIG.GRID_WIDTH) return { success: false, reason: 'Hors limites' };

    const block = world.getBlockAt(newX, this.y);
    if (!block) return { success: false, reason: 'Mur invisible' };

    // Si c'est un bloc, le creuser
    if (block.type !== 'dug') {
      const result = this.applyBlockEffects(block, inventory);
      world.grid[this.y][newX] = { type: 'dug', biome: block.biome };
      return { success: true, blockType: block.type, rareItem: result.rareItem };
    }

    this.x = newX;
    this.depth = this.y;
    return { success: true };
  }

  dig(world, inventory) {
    if (this.y + 1 >= world.grid.length) {
      world.expandWorld();
    }

    const block = world.getBlockAt(this.x, this.y + 1);
    if (!block || block.type === 'dug') {
      return { success: false, reason: 'Rien à creuser' };
    }

    const result = this.applyBlockEffects(block, inventory);
    world.grid[this.y + 1][this.x] = { type: 'dug', biome: block.biome };
    this.y++;
    this.depth = this.y;

    // Vérifier changement de biome
    const newBiome = world.getCurrentBiome(this.depth);
    if (newBiome.id !== this.currentBiome) {
      this.currentBiome = newBiome.id;
    }

    return { success: true, blockType: block.type, rareItem: result.rareItem };
  }

  applyBlockEffects(block, inventory) {
    const biome = BIOMES[block.biome.toUpperCase()] || BIOMES.SURFACE;
    let scoreGain = biome.difficulty;
    let rareItem = null;

    switch (block.type) {
      case 'stone':
      case 'sandstone':
        scoreGain = 5 * biome.difficulty;
        inventory.addItem('stone', Math.floor(Math.random() * 2) + 1);
        break;
      case 'coal':
        scoreGain = 8 * biome.difficulty;
        inventory.addItem('coal', 1);
        break;
      case 'metal':
        scoreGain = 15 * biome.difficulty;
        inventory.addItem('metal', 1);
        break;
      case 'bonus':
      case 'pearl':
      case 'fire_crystal':
        scoreGain = 25 * biome.difficulty;
        inventory.addItem(block.type, 1);
        rareItem = block.type;
        break;
      case 'crystal':
      case 'diamond':
      case 'magic_crystal':
      case 'rare_gem':
        scoreGain = 100 * biome.difficulty;
        inventory.addItem(block.type, 1);
        rareItem = block.type;
        break;
      case 'treasure':
        scoreGain = 200 * biome.difficulty;
        this.openTreasure(inventory);
        rareItem = 'treasure';
        break;
      case 'wood':
        inventory.addItem('wood', Math.floor(Math.random() * 3) + 1);
        break;
      case 'sand':
        inventory.addItem('sand', Math.floor(Math.random() * 2) + 1);
        break;
      case 'water':
        this.restoreOxygen(15);
        break;
      case 'oxygen':
        this.restoreOxygen(50);
        break;
      case 'trap':
        this.takeDamage(20);
        scoreGain = 0;
        break;
      default:
        inventory.addItem('dirt', 1);
    }

    this.score += scoreGain;
    this.addExperience(scoreGain);
    return { rareItem };
  }

  openTreasure(inventory) {
    const treasures = ['diamond', 'magic_crystal', 'rare_gem', 'crystal'];
    const numItems = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < numItems; i++) {
      const treasure = treasures[Math.floor(Math.random() * treasures.length)];
      inventory.addItem(treasure, Math.floor(Math.random() * 2) + 1);
    }
  }

  addExperience(exp) {
    this.experience += exp;
    const expNeeded = this.getExpNeeded();
    if (this.experience >= expNeeded) {
      this.levelUp();
    }
  }

  getExpNeeded() {
    return Math.floor(CONFIG.LEVEL_XP_BASE * Math.pow(CONFIG.LEVEL_XP_MULTIPLIER, this.level - 1));
  }

  levelUp() {
    this.level++;
    this.experience = 0;
    this.justLeveledUp = true;
    this.health = CONFIG.MAX_HEALTH;
    this.oxygen = CONFIG.MAX_OXYGEN;
    console.log(`Level up! Niveau ${this.level}`);
  }

  takeDamage(amount) {
    const protection = this.getProtectionValue();
    const actualDamage = Math.max(1, amount - protection);
    this.health = Math.max(0, this.health - actualDamage);
  }

  heal(amount) {
    this.health = Math.min(CONFIG.MAX_HEALTH, this.health + amount);
  }

  restoreOxygen(amount) {
    this.oxygen = Math.min(CONFIG.MAX_OXYGEN, this.oxygen + amount);
  }

  getProtectionValue() {
    let protection = 0;
    this.equipment.forEach(item => {
      if (item.protection) protection += item.protection;
    });
    return protection;
  }

  hasProtection(type) {
    for (let item of this.equipment.values()) {
      if (item.protection === type) return true;
    }
    return false;
  }

  draw(ctx, viewPlayer = this) {
    const screenY = this.y - Math.max(0, viewPlayer.y - Math.floor(CONFIG.GRID_HEIGHT / 2) + 1);
    if (screenY >= 0 && screenY < CONFIG.GRID_HEIGHT) {
      // Ombre
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(
        this.x * CONFIG.TILE_SIZE + 3,
        screenY * CONFIG.TILE_SIZE + 3,
        CONFIG.TILE_SIZE - 6,
        CONFIG.TILE_SIZE - 6
      );

      // Effet de brillance pour joueur principal
      if (viewPlayer === this) {
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
      }

      // Joueur avec dégradé (sécurisé)
      try {
        const gradient = ctx.createRadialGradient(
          this.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2,
          screenY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2,
          0,
          this.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2,
          screenY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2,
          CONFIG.TILE_SIZE/2
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, darkenColor(this.color));
        
        ctx.fillStyle = gradient;
      } catch (e) {
        // Fallback si erreur gradient
        ctx.fillStyle = this.color;
      }

      ctx.fillRect(
        this.x * CONFIG.TILE_SIZE + 1,
        screenY * CONFIG.TILE_SIZE + 1,
        CONFIG.TILE_SIZE - 2,
        CONFIG.TILE_SIZE - 2
      );

      ctx.shadowBlur = 0;

      // Indicateur de niveau pour autres joueurs
      if (viewPlayer !== this) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          `Niv.${this.level}`,
          this.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2,
          screenY * CONFIG.TILE_SIZE - 5
        );
        ctx.fillText(
          this.name,
          this.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2,
          screenY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE + 10
        );
        ctx.textAlign = 'left';
      }

      // Santé faible
      if (this.health < 30) {
        ctx.fillStyle = 'rgba(231, 76, 60, 0.7)';
        ctx.fillRect(
          this.x * CONFIG.TILE_SIZE,
          screenY * CONFIG.TILE_SIZE - 3,
          CONFIG.TILE_SIZE,
          2
        );
      }
    }
  }
}
