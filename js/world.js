import { CONFIG, BIOMES, BLOCK_STYLES } from './config.js';
import { PerlinNoise } from './utils.js';

export class BiomeWorld {
  constructor() {
    this.seed = Math.random();
    this.perlin = new PerlinNoise(this.seed);
    this.grid = [];
    this.exploredDepth = 0;
    this.generate();
  }

  generate() {
    const targetDepth = Math.max(this.exploredDepth, 50);
    while (this.grid.length < targetDepth) {
      this.expandWorld();
    }
  }

  expandWorld() {
    const newDepth = this.grid.length + 20;
    for (let y = this.grid.length; y < newDepth; y++) {
      const row = [];
      const biome = this.getCurrentBiome(y);
      for (let x = 0; x < CONFIG.GRID_WIDTH; x++) {
        row.push(this.generateBlock(x, y, biome));
      }
      this.grid.push(row);
    }
    this.exploredDepth = Math.max(this.exploredDepth, newDepth);
  }

  generateBlock(x, y, biome) {
    const noiseValue = this.perlin.getNoise(x, y);
    let blockType = 'normal';
    let cumulative = 0;
    const blockChances = { ...biome.blocks };

    // Grappes dynamiques par biome
    if (biome.id === 'ocean' && this.perlin.getNoise(x / 3, y / 3) > 0.7) {
      blockChances.water = (blockChances.water || 0) + 0.3;
      blockChances.coral = (blockChances.coral || 0) + 0.1;
    } else if (biome.id === 'underground' && this.perlin.getNoise(x / 4, y / 4) > 0.8) {
      blockChances.coal = (blockChances.coal || 0) + 0.2;
    }

    const totalChance = Object.values(blockChances).reduce((sum, chance) => sum + chance, 0);
    for (let [type, chance] of Object.entries(blockChances)) {
      cumulative += chance / totalChance;
      if (noiseValue < cumulative) {
        blockType = type;
        break;
      }
    }

    return { type: blockType, biome: biome.id };
  }

  getCurrentBiome(depth) {
    for (let biome of Object.values(BIOMES)) {
      const [minDepth, maxDepth] = biome.depthRange;
      if (depth >= minDepth && depth <= maxDepth) {
        return biome;
      }
    }
    return BIOMES.SURFACE;
  }

  getBlockAt(x, y) {
    if (y < 0 || y >= this.grid.length || x < 0 || x >= CONFIG.GRID_WIDTH) {
      return null;
    }
    return this.grid[y][x];
  }

  draw(ctx, player) {
    const viewStartRow = Math.max(0, player.y - Math.floor(CONFIG.GRID_HEIGHT / 2) + 1);
    const viewEndRow = Math.min(this.grid.length, viewStartRow + CONFIG.GRID_HEIGHT);

    for (let y = viewStartRow; y < viewEndRow; y++) {
      const screenY = y - viewStartRow;
      for (let x = 0; x < CONFIG.GRID_WIDTH; x++) {
        const block = this.grid[y][x];
        this.drawBlock(ctx, x, screenY, block);
      }
    }
  }

  drawBlock(ctx, x, screenY, block) {
    const style = BLOCK_STYLES[block.type] || BLOCK_STYLES.normal;

    // Ombre
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(
      x * CONFIG.TILE_SIZE + 2,
      screenY * CONFIG.TILE_SIZE + 2,
      CONFIG.TILE_SIZE - 4,
      CONFIG.TILE_SIZE - 4
    );

    // Bloc principal
    ctx.fillStyle = style.color;
    ctx.fillRect(
      x * CONFIG.TILE_SIZE,
      screenY * CONFIG.TILE_SIZE,
      CONFIG.TILE_SIZE,
      CONFIG.TILE_SIZE
    );

    // Emoji
    if (style.emoji && block.type !== 'dug') {
      ctx.font = `${CONFIG.TILE_SIZE - 8}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText(
        style.emoji,
        x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
        screenY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE - 6
      );
      ctx.textAlign = 'left';
    }
  }
}
