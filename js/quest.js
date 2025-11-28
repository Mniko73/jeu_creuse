import { QUESTS, CONFIG } from './config.js';
import { InventorySystem } from './inventory.js';

export class QuestSystem {
  constructor(inventory) {
    this.inventory = inventory; // Pour distribuer récompenses
    this.activeQuests = new Map();
    this.completedQuests = new Set();
    this.progress = new Map();
    this.initializeQuests();
  }

  initializeQuests() {
    // Démarrer quêtes de base
    if (!this.completedQuests.has('first_dig')) {
      this.startQuest('first_dig');
    }
  }

  startQuest(questId) {
    if (this.activeQuests.has(questId) || this.completedQuests.has(questId)) return;
    
    const quest = QUESTS[questId];
    if (!quest) return;

    this.activeQuests.set(questId, { ...quest, currentProgress: 0 });
    this.progress.set(questId, 0);
    console.log(`Quête démarrée: ${quest.title}`);
  }

  updateProgress(type, amount = 1, subtype = null) {
    this.activeQuests.forEach((quest, questId) => {
      if (quest.type === type && 
          (!subtype || quest.subtype === subtype) && 
          this.progress.get(questId) < quest.target) {
        
        const current = this.progress.get(questId) || 0;
        this.progress.set(questId, Math.min(current + amount, quest.target));
        
        if (this.progress.get(questId) >= quest.target) {
          this.completeQuest(questId);
        }
      }
    });
  }

  completeQuest(questId) {
    const quest = this.activeQuests.get(questId);
    if (!quest) return;

    // Distribuer récompenses (amélioration)
    if (quest.reward.experience) {
      this.inventory.player.addExperience(quest.reward.experience);
    }
    if (quest.reward.items) {
      for (let [itemType, quantity] of Object.entries(quest.reward.items)) {
        this.inventory.addItem(itemType, quantity);
      }
    }

    this.activeQuests.delete(questId);
    this.completedQuests.add(questId);
    console.log(`Quête complétée: ${quest.title} ! Récompenses distribuées.`);
  }

  getActiveQuests() {
    return Array.from(this.activeQuests.entries()).map(([id, quest]) => ({
      id,
      ...quest,
      progress: this.progress.get(id) || 0
    }));
  }

  // Affichage
  updateDisplay(elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;

    const active = this.getActiveQuests();
    container.innerHTML = '<h3>Quêtes actives</h3>';

    active.forEach(quest => {
      const progress = quest.progress;
      const percent = (progress / quest.target) * 100;
      const div = document.createElement('div');
      div.className = 'quest-item';
      div.innerHTML = `
        <h4>${quest.title}</h4>
        <p>${quest.description}</p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percent}%"></div>
        </div>
        <span>${progress}/${quest.target}</span>
      `;
      container.appendChild(div);
    });
  }
}
