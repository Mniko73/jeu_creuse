game.jsimport { CONFIG } from './config.js';
import { BiomeWorld } from './world.js';
import { AdvancedPlayer } from './player.js';
import { InventorySystem, CraftingSystem } from './inventory.js';
import { QuestSystem } from './quest.js';
import { NPCSystem } from './npc.js';
import { CombatSystem, Monster } from './combat.js';
import { ParticleSystem } from './particles.js';
import { generateRandomColor } from './utils.js';

export class MultiplayerDiggingGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.running = false;
    this.gameSpeed = 1.0;
    this.particleSystem = new ParticleSystem();
    
    this.initCanvas();
    this.initGame();
    this.initUI();
    this.initWebSocket();
    this.initEventListeners();
    this.initStorage();
    
    this.start();
  }

  initCanvas() {
    this.canvas.width = CONFIG.TILE_SIZE * CONFIG.GRID_WIDTH;
    this.canvas.height = CONFIG.TILE_SIZE * CONFIG.GRID_HEIGHT;
  }

  initGame() {
    this.player = new AdvancedPlayer('player1', generateRandomColor());
    this.world = new BiomeWorld();
    this.inventory = new InventorySystem();
    this.craftingSystem = new CraftingSystem(this.inventory, this.player);
    this.questSystem = new QuestSystem(this.inventory);
    this.npcSystem = new NPCSystem();
    this.combatSystem = new CombatSystem(this);
    
    this.otherPlayers = new Map();
    this.monsters = [];
    this.notifications = [];
    this.frameCount = 0;
    
    this.loadGameState();
  }

  initStorage() {
    this.saveKey = 'undergroundRPG_save';
    this.autoSaveInterval = setInterval(() => this.saveGameState(), CONFIG.AUTOSAVE_INTERVAL);
  }

  saveGameState() {
    const gameState = {
      player: {
        x: this.player.x, y: this.player.y, score: this.player.score,
        level: this.player.level, experience: this.player.experience,
        health: this.player.health, oxygen: this.player.oxygen, depth: this.player.depth
      },
      inventory: this.inventory.slots,
      quests: {
        active: Array.from(this.questSystem.activeQuests.entries()),
        completed: Array.from(this.questSystem.completedQuests),
        progress: Array.from(this.questSystem.progress.entries())
      },
      world: { seed: this.world.seed, exploredDepth: this.world.exploredDepth },
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(this.saveKey, JSON.stringify(gameState));
    } catch (e) {
      console.warn('Sauvegarde échouée', e);
    }
  }

  loadGameState() {
    try {
      const saved = localStorage.getItem(this.saveKey);
      if (saved) {
        const gameState = JSON.parse(saved);
        // Restaurer joueur
        Object.assign(this.player, gameState.player);
        // Restaurer inventaire
        this.inventory.slots = gameState.inventory;
        // Restaurer quêtes
        this.questSystem.activeQuests = new Map(gameState.quests.active);
        this.questSystem.completedQuests = new Set(gameState.quests.completed);
        this.questSystem.progress = new Map(gameState.quests.progress);
        // Restaurer monde
        this.world.seed = gameState.world.seed;
        this.world.exploredDepth = gameState.world.exploredDepth;
        this.world.generate();
      }
    } catch (e) {
      console.log('Chargement échoué, nouvelle partie', e);
    }
  }

  initUI() {
    this.updateAllDisplays();
  }

  initWebSocket() {
    this.wsConnected = false;
    this.connectionStatus = document.getElementById('connectionStatus');
    setTimeout(() => this.simulateConnection(), 2000);
  }

  simulateConnection() {
    this.connectionStatus.className = 'connection-status connecting';
    this.connectionStatus.textContent = 'Connexion au serveur...';
    
    setTimeout(() => {
      this.wsConnected = true;
      this.connectionStatus.className = 'connection-status connected';
      this.connectionStatus.textContent = 'Connecté - 4 joueurs en ligne';
      this.addSimulatedPlayers();
      this.showNotification('Connecté au serveur multijoueur !', 'success');
    }, 1500);
  }

  addSimulatedPlayers() {
    const simulatedPlayers = [
      { id: 'player2', name: 'Alice la Courageuse', color: '#e74c3c', x: 3, y: 15 },
      { id: 'player3', name: "Charlie l'Explorateur", color: '#2ecc71', x: 8, y: 32 },
      { id: 'player4', name: 'Diana la Sage', color: '#9b59b6', x: 2, y: 67 }
    ];

    simulatedPlayers.forEach(playerData => {
      const player = new AdvancedPlayer(playerData.id, playerData.color);
      player.name = playerData.name;
      player.x = playerData.x;
      player.y = playerData.y;
      player.depth = playerData.y;
      player.level = Math.floor(Math.random() * 8) + 1;
      this.otherPlayers.set(playerData.id, player);
    });
    this.updatePlayerList();
  }

  updatePlayerList() {
    const playerList = document.getElementById('playerListContent');
    playerList.innerHTML = '';
    
    this.otherPlayers.forEach(player => {
      const div = document.createElement('div');
      div.className = 'other-player';
      const biome = this.world.getCurrentBiome(player.depth);
      div.innerHTML = `
        <div class="player-color" style="background: ${player.color}"></div>
        <div>
          <div style="font-weight: bold;">${player.name}</div>
          <div style="font-size: 0.9em; color: #bdc3c7;">Niv.${player.level} • Prof: ${player.depth}m</div>
          <div style="font-size: 0.8em; color: #95a5a6;">${biome.emoji} ${biome.name}</div>
        </div>
      `;
      playerList.appendChild(div);
    });
  }

  initEventListeners() {
    window.addEventListener('keydown', (e) => this.handleInput(e));
    window.addEventListener('keyup', (e) => this.handleInputRelease(e.key));

    // Contrôles tactiles
    document.getElementById('leftBtn')?.addEventListener('click', () => 
      this.handleInput({ key: 'ArrowLeft', ctrlKey: false }));
    document.getElementById('digBtn')?.addEventListener('click', () => 
      this.handleInput({ key: 'ArrowDown', ctrlKey: false }));
    document.getElementById('rightBtn')?.addEventListener('click', () => 
      this.handleInput({ key: 'ArrowRight', ctrlKey: false }));
    document.getElementById('craftBtn')?.addEventListener('click', () => this.toggleCrafting());
    document.getElementById('inventoryBtn')?.addEventListener('click', () => this.toggleInventory());
    document.getElementById('shopBtn')?.addEventListener('click', () => this.openShop());

    // Sauvegarde avant fermeture
    window.addEventListener('beforeunload', () => this.saveGameState());
  }

  handleInput(e) {
    if (!this.running) return;

    const key = e.key;
    e.preventDefault(); // Empêcher scroll page

    const actions = {
      'ArrowLeft': () => this.movePlayer(-1),
      'ArrowRight': () => this.movePlayer(1),
      'ArrowDown': () => this.dig(),
      'ArrowUp': () => this.ascend(),
      'q': () => this.movePlayer(-1),
      'd': () => this.movePlayer(1),
      's': () => this.dig(),
      'z': () => this.ascend(),
      'e': () => this.interact(),
      'i': () => this.toggleInventory(),
      'c': () => this.toggleCrafting(),
      'h': () => this.useHealthPotion(),
      'o': () => this.useOxygen(),
      'Escape': () => this.showPauseMenu(),
      ' ': () => this.dig()
    };

    // Creusement latéral avec Ctrl (corrigé)
    if (key === 'ArrowLeft' && e.ctrlKey) {
      this.movePlayer(-1);
    } else if (key === 'ArrowRight' && e.ctrlKey) {
      this.movePlayer(1);
    } else if (actions[key]) {
      actions[key]();
    }
  }

  handleInputRelease(key) {
    // Gestion relâchement touches si besoin (mouvement continu)
  }

  movePlayer(dx) {
    const result = this.player.move(dx, this.world, this.inventory);
    if (result.success) {
      this.checkNPCInteractions();
      this.checkForSecrets();
      this.particleSystem.addMovementParticles(
        this.player.x * CONFIG.TILE_SIZE, 
        this.player.y * CONFIG.TILE_SIZE
      );

      if (result.blockType) {
        this.particleSystem.addDigParticles(
          this.player.x * CONFIG.TILE_SIZE + (dx > 0 ? CONFIG.TILE_SIZE : 0),
          this.player.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2,
          result.blockType
        );
        this.questSystem.updateProgress('dig', 1);
        if (result.rareItem) {
          this.questSystem.updateProgress('collect', 1, 'rare');
          this.showNotification(`Objet rare trouvé : ${result.rareItem}!`, 'rare');
        }
      }

      this.draw();
      this.broadcastPlayerMove();
      this.updateAllDisplays();
      this.combatSystem.checkCombat();
    } else if (result.reason) {
      this.showNotification(result.reason, 'warning');
    }
  }

  dig() {
    const result = this.player.dig(this.world, this.inventory);
    if (result.success) {
      this.particleSystem.addDigParticles(
        this.player.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2,
        (this.player.y + 1) * CONFIG.TILE_SIZE,
        result.blockType
      );

      this.questSystem.updateProgress('dig', 1);
      this.questSystem.updateProgress('depth', this.player.depth);
      
      if (result.rareItem) {
        this.questSystem.updateProgress('collect', 1, 'rare');
        this.showNotification(`Objet rare trouvé : ${result.rareItem}!`, 'rare');
      }

      const newBiome = this.world.getCurrentBiome(this.player.depth);
      if (newBiome.id !== this.player.currentBiome) {
        this.player.currentBiome = newBiome.id;
        this.questSystem.updateProgress('biome', 1);
        this.updateBiomeDisplay();
        this.showNotification(`Nouveau biome : ${newBiome.name} !`, 'discovery');
      }

      if (this.player.y >= this.world.grid.length - 20) {
        this.world.expandWorld();
      }

      // Spawn monstre occasionnel
      if (Math.random() < 0.1 && newBiome.monsters.length > 0) {
        this.spawnMonster(newBiome);
      }

      this.updateAllDisplays();
      this.draw();
      this.combatSystem.checkCombat();
    } else if (result.reason) {
      this.showNotification(result.reason, 'warning');
    }
  }

  ascend() {
    if (this.player.y > 0) {
      this.player.y--;
      this.player.depth = Math.max(0, this.player.depth - 1);
      this.updateAllDisplays();
      this.draw();
    }
  }

  interact() {
    const npc = this.npcSystem.getNPCAt(this.player.x, this.player.y);
    if (npc) {
      this.showNPCDialog(npc);
    } else {
      this.combatSystem.resolveCombat(); // Combat si monstre
      this.checkForInteractables();
    }
  }

  checkForInteractables() {
    const currentBlock = this.world.getBlockAt(this.player.x, this.player.y);
    if (currentBlock && currentBlock.type === 'treasure') {
      this.openTreasureChest();
    }
  }

  openTreasureChest() {
    const rewards = this.generateTreasureRewards();
    rewards.forEach(reward => {
      this.inventory.addItem(reward.type, reward.quantity);
    });
    this.showNotification('Coffre au trésor ouvert !', 'treasure');
    // Marquer le bloc comme creusé
    this.world.getBlockAt(this.player.x, this.player.y).type = 'dug';
  }

  generateTreasureRewards() {
    const biome = this.world.getCurrentBiome(this.player.depth);
    const rewards = [];
    const possibleRewards = ['crystal', 'diamond', 'rare_gem', 'magic_crystal'];
    const numRewards = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numRewards; i++) {
      const rewardType = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
      rewards.push({
        type: rewardType,
        quantity: Math.floor(Math.random() * 3) + 1
      });
    }
    return rewards;
  }

  spawnMonster(biome) {
    const monsterTypes = biome.monsters;
    if (monsterTypes.length === 0) return;

    const monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
    const monster = new Monster(monsterType, 
      this.player.x + Math.floor(Math.random() * 3) - 1, 
      this.player.y + Math.floor(Math.random() * 3) + 1
    );
    this.monsters.push(monster);
  }

  checkNPCInteractions() {
    const nearbyNPC = this.npcSystem.getNPCNearby(this.player.x, this.player.y, 2);
    if (nearbyNPC) {
      this.particleSystem.addNPCHighlight(
        nearbyNPC.x * CONFIG.TILE_SIZE, 
        nearbyNPC.y * CONFIG.TILE_SIZE
      );
    }
  }

  checkForSecrets() {
    if (Math.random() < 0.001) {
      this.showNotification('Vous sentez une présence mystérieuse...', 'mystery');
    }
  }

  showNPCDialog(npc) {
    this.npcSystem.showDialog(npc, this);
  }

  useHealthPotion() {
    if (this.inventory.hasItem('health_potion', 1)) {
      this.inventory.removeItem('health_potion', 1);
      this.player.heal(50);
      this.showNotification('Potion de soin utilisée !', 'heal');
      this.updateAllDisplays();
    } else {
      this.showNotification('Pas de potion de soin !', 'warning');
    }
  }

  useOxygen() {
    if (this.inventory.hasItem('oxygen_tank_small', 1)) {
      this.inventory.removeItem('oxygen_tank_small', 1);
      this.player.restoreOxygen(30);
      this.showNotification('Oxygène restauré !', 'oxygen');
    } else if (this.inventory.hasItem('oxygen_tank_large', 1)) {
      this.inventory.removeItem('oxygen_tank_large', 1);
      this.player.restoreOxygen(75);
      this.showNotification('Oxygène complètement restauré !', 'oxygen');
    } else {
      this.showNotification("Pas de réservoir d'oxygène !", 'warning');
    }
    this.updateAllDisplays();
  }

  toggleInventory() {
    const panel = document.getElementById('inventoryPanel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
      this.inventory.updateDisplay('inventorySlots');
    }
  }

  toggleCrafting() {
    const panel = document.getElementById('craftingPanel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
      this.craftingSystem.updateDisplay('craftingRecipes', this.player.level);
    }
  }

  openShop() {
    const nearbyNPC = this.npcSystem.getNPCNearby(this.player.x, this.player.y, 3);
    if (nearbyNPC && nearbyNPC.shop) {
      this.showNotification(`Magasin de ${nearbyNPC.name} ouvert !`, 'shop');
      // TODO: Interface magasin
    } else {
      this.showNotification('Aucun marchand à proximité !', 'info');
    }
  }

  showPauseMenu() {
    this.running = !this.running;
    this.showNotification(this.running ? 'Jeu repris' : 'Jeu en pause', 'info');
  }

  broadcastPlayerMove() {
    if (this.wsConnected) {
      // Simulation WebSocket
    }
  }

  updateAllDisplays() {
    this.updatePlayerStats();
    this.updateInventoryDisplay();
    this.updateCraftingDisplay();
    this.updateQuestDisplay();
    this.updatePlayerList();
  }

  updatePlayerStats() {
    document.getElementById('scoreDisplay').textContent = this.player.score.toLocaleString();
    document.getElementById('depthDisplay').textContent = `${this.player.depth}m`;
    document.getElementById('levelDisplay').textContent = this.player.level;
    
    const biome = this.world.getCurrentBiome(this.player.depth);
    document.getElementById('biomeDisplay').textContent = biome.name;

    // Barres de vie/oxygène
    const healthPercent = (this.player.health / CONFIG.MAX_HEALTH) * 100;
    document.getElementById('healthBar').style.width = `${healthPercent}%`;
    document.getElementById('healthText').textContent = `${this.player.health}/${CONFIG.MAX_HEALTH}`;
    
    const oxygenPercent = (this.player.oxygen / CONFIG.MAX_OXYGEN) * 100;
    document.getElementById('oxygenBar').style.width = `${oxygenPercent}%`;
    document.getElementById('oxygenText').textContent = `${this.player.oxygen}/${CONFIG.MAX_OXYGEN}`;
  }

  updateInventoryDisplay() {
    this.inventory.updateDisplay('inventorySlots');
  }

  updateCraftingDisplay() {
    this.craftingSystem.updateDisplay('craftingRecipes', this.player.level);
  }

  updateQuestDisplay() {
    this.questSystem.updateDisplay('questContainer'); // Ajoute <div id="questContainer"> dans HTML si besoin
  }

  updateBiomeDisplay() {
    // Met à jour l'affichage biome si séparé
  }

  getElement(id) {
    return document.getElementById(id);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.getElementById('notificationArea').appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  draw() {
    // Fond
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Monde
    this.world.draw(this.ctx, this.player);

    // Particules
    this.particleSystem.draw(this.ctx, this.player);

    // Joueur principal
    this.player.draw(this.ctx, this.player);

    // Autres joueurs
    this.otherPlayers.forEach(player => player.draw(this.ctx, this.player));

    // Monstres
    this.monsters.forEach(monster => monster.draw(this.ctx, this.player));
  }

  update() {
    if (!this.running) return;

    this.frameCount++;
    
    // Mise à jour oxygène
    if (this.frameCount % (CONFIG.OXYGEN_DECREASE_RATE / 16) === 0) {
      const biome = this.world.getCurrentBiome(this.player.depth);
      const drain = 1 * biome.oxygenModifier;
      this.player.oxygen = Math.max(0, this.player.oxygen - drain);
      if (this.player.oxygen === 0) {
        this.player.takeDamage(5);
        this.showNotification('Manque d\'oxygène !', 'danger');
      }
    }

    // Régénération santé
    if (this.frameCount % (CONFIG.HEALTH_REGEN_INTERVAL / 16) === 0 && 
        this.player.health < CONFIG.MAX_HEALTH) {
      this.player.heal(1);
    }

    // Mouvement monstres
    if (this.frameCount % (CONFIG.MONSTER_MOVE_INTERVAL / 16) === 0) {
      this.monsters.forEach(monster => {
        monster.moveTowards(this.player.x, this.player.y);
      });
    }

    // Mise à jour particules
    this.particleSystem.update();

    // Vérifier fin de partie
    if (this.player.health <= 0) {
      this.showNotification('Game Over !', 'danger');
      this.running = false;
    }

    this.draw();
    this.updateAllDisplays();
  }

  start() {
    this.running = true;
    const loop = () => {
      this.update();
      if (this.running) {
        requestAnimationFrame(loop);
      }
    };
    loop();
  }

  // Méthodes utilitaires
  toggleInventory() {
    const panel = this.getElement('inventoryPanel');
    if (panel) {
      panel.classList.toggle('hidden');
      if (!panel.classList.contains('hidden')) {
        this.updateInventoryDisplay();
      }
    }
  }

  toggleCrafting() {
    const panel = this.getElement('craftingPanel');
    if (panel) {
      panel.classList.toggle('hidden');
      if (!panel.classList.contains('hidden')) {
        this.updateCraftingDisplay();
      }
    }
  }
}
