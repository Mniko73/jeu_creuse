import { CONFIG } from './config.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 100;
  }

  addDigParticles(x, y, blockType) {
    const colors = {
      stone: '#696969', wood: '#8B4513', coal: '#333333',
      metal: '#B0C4DE', crystal: '#9370DB', lava: '#FF4500'
    };
    
    const color = colors[blockType] || '#8B4513';
    const count = blockType === 'bonus' ? 8 : 4;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + CONFIG.TILE_SIZE / 2,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2,
        life: 30,
        maxLife: 30,
        color: color,
        size: Math.random() * 4 + 2
      });
    }
  }

  addMovementParticles(x, y) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + CONFIG.TILE_SIZE / 2,
        y: y + CONFIG.TILE_SIZE / 2,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 15,
        maxLife: 15,
        color: '#FFD700',
        size: Math.random() * 3 + 1
      });
    }
  }

  addNPCHighlight(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      this.particles.push({
        x: x + CONFIG.TILE_SIZE / 2,
        y: y + CONFIG.TILE_SIZE / 2,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        life: 40,
        maxLife: 40,
        color: '#FFD700',
        size: 3
      });
    }
  }

  update() {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.vy += 0.2; // Gravité
      return p.life > 0;
    });

    // Limiter le nombre
    if (this.particles.length > this.maxParticles) {
      this.particles = this.particles.slice(-this.maxParticles);
    }
  }

  draw(ctx, player) {
    const viewStartY = player.y - Math.floor(CONFIG.GRID_HEIGHT / 2) + 1;
    
    this.particles.forEach(particle => {
      const screenY = particle.y - viewStartY * CONFIG.TILE_SIZE;
      if (screenY > 0 && screenY < CONFIG.GRID_HEIGHT * CONFIG.TILE_SIZE) {
        ctx.save();
        ctx.globalAlpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, screenY, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }
}
