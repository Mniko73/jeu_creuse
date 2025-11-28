import { CONFIG, BIOMES } from './config.js';

export class Monster {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.health = this.getMaxHealth();
    this.maxHealth = this.getMaxHealth();
    this.damage = this.getDamage();
    this.color = this.getColor();
    this.emoji = this.getEmoji();
  }

  getMaxHealth() {
    const monsterStats = {
      goblin: 30, scorpion: 25, sand_worm: 50,
      fish: 15, shark: 60, kraken: 120,
      fire_elemental: 80, lava_golem: 150,
      crystal_guardian: 100, void_wraith: 90
    };
    return monsterStats[this.type] || 20;
  }

  getDamage() {
    const damages = {
      goblin: 10, scorpion: 15, sand_worm: 25,
      fish: 5, shark: 30, kraken: 50,
      fire_elemental: 20, lava_golem: 40,
      crystal_guardian: 35, void_wraith: 25
    };
    return damages[this.type] || 10;
  }

  getColor() {
    const colors = {
      goblin: '#228B22', scorpion: '#FF4500', sand_worm: '#8B4513',
      fish: '#006994', shark: '#696969', kraken: '#4B0082',
      fire_elemental: '#FF6347', lava_golem: '#DC143C',
      crystal_guardian: '#9370DB', void_wraith: '#2F4F4F'
    };
    return colors[this.type] || '#666';
  }

  getEmoji() {
    const emojis = {
      goblin: '👹', scorpion: '🦂', sand_worm: '🐛',
      fish: '🐟', shark: '🦈', kraken: '🐙',
      fire_elemental: '🔥', lava_golem: '🌋',
      crystal_guardian: '💎', void_wraith: '👻'
    };
    return emojis[this.type] || '👺';
  }

  moveTowards(playerX, playerY) {
    if (Math.random() < 0.7) { // 70% de chance de bouger
      if (Math.abs(this.x - playerX) > Math.abs(this.y - playerY)) {
        this.x += this.x < playerX ? 1 : -1;
      } else {
        this.y += this.y < playerY ? 1 : -1;
      }
    }
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    return this.health <= 0;
  }

  draw(ctx, viewPlayer) {
    const screenY = this.y - Math.max(0, viewPlayer.y - Math.floor(CONFIG.GRID_HEIGHT / 2) + 1);
    if (screenY >= 0 && screenY < CONFIG.GRID_HEIGHT) {
      ctx.fillStyle = this.color;
      ctx.fillRect(
        this.x * CONFIG.TILE_SIZE,
        screenY * CONFIG.TILE_SIZE,
        CONFIG.TILE_SIZE,
        CONFIG.TILE_SIZE
      );

      // Emoji
      ctx.font = `${CONFIG.TILE_SIZE - 8}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText(
        this.emoji,
        this.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
        screenY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE - 6
      );
      ctx.textAlign = 'left';
    }
  }
}

export class CombatSystem {
  constructor(game) {
    this.game = game;
    this.inCombat = false;
    this.combatTarget = null;
  }

  checkCombat() {
    // Vérifier collision avec monstre
    const monster = this.game.monsters.find(m => 
      m.x === this.game.player.x && m.y === this.game.player.y
    );

    if (monster) {
      this.startCombat(monster);
      return true;
    }
    return false;
  }

  startCombat(monster) {
    this.inCombat = true;
    this.combatTarget = monster;
    this.game.showNotification(`Combat contre ${monster.type} !`, 'danger');
  }

  attack() {
    if (!this.inCombat || !this.combatTarget) return;

    // Dégâts joueur au monstre
    const playerDamage = 10 + (this.game.player.level * 2); // Base + niveau
    const monsterDied = this.combatTarget.takeDamage(playerDamage);

    if (monsterDied) {
      this.game.player.addExperience(50); // XP pour le monstre
      this.game.player.score += 100;
      this.game.monsters = this.game.monsters.filter(m => m !== this.combatTarget);
      this.endCombat(`Monstre vaincu ! +50 XP`);
      this.game.questSystem.updateProgress('kill', 1);
    } else {
      // Contre-attaque du monstre
      this.game.player.takeDamage(this.combatTarget.damage);
      this.game.showNotification(`Le ${this.combatTarget.type} vous attaque !`, 'danger');
    }

    this.game.updateAllDisplays();
  }

  endCombat(message) {
    this.inCombat = false;
    this.combatTarget = null;
    this.game.showNotification(message, 'success');
  }

  // Auto-résolution simple (touche E près d'un monstre)
  resolveCombat() {
    if (this.inCombat) {
      this.attack();
    }
  }
}
