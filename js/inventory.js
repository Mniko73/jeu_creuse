import { CRAFTING_RECIPES, CONFIG } from './config.js';

export class InventorySystem {
  constructor() {
    this.slots = new Array(16).fill(null);
    this.maxStack = 99;
  }

  addItem(type, quantity = 1) {
    let remaining = quantity;

    // Stacks existants
    for (let i = 0; i < this.slots.length && remaining > 0; i++) {
      if (this.slots[i] && this.slots[i].type === type) {
        const canAdd = Math.min(remaining, this.maxStack - this.slots[i].quantity);
        this.slots[i].quantity += canAdd;
        remaining -= canAdd;
      }
    }

    // Nouveaux slots
    for (let i = 0; i < this.slots.length && remaining > 0; i++) {
      if (!this.slots[i]) {
        const stackSize = Math.min(remaining, this.maxStack);
        this.slots[i] = {
          type: type,
          quantity: stackSize,
          name: this.getItemName(type),
          rarity: this.getItemRarity(type)
        };
        remaining -= stackSize;
      }
    }

    return remaining === 0;
  }

  removeItem(type, quantity = 1) {
    let remaining = quantity;
    for (let i = 0; i < this.slots.length && remaining > 0; i++) {
      if (this.slots[i] && this.slots[i].type === type && this.slots[i].quantity > 0) {
        const toRemove = Math.min(remaining, this.slots[i].quantity);
        this.slots[i].quantity -= toRemove;
        remaining -= toRemove;
        if (this.slots[i].quantity === 0) {
          this.slots[i] = null;
        }
      }
    }
    return remaining === 0;
  }

  hasItem(type, quantity = 1) {
    let total = 0;
    for (let slot of this.slots) {
      if (slot && slot.type === type) {
        total += slot.quantity;
        if (total >= quantity) return true;
      }
    }
    return false;
  }

  getItemName(type) {
    const names = {
      wood: 'Bois', stone: 'Pierre', coal: 'Charbon', metal: 'Métal',
      crystal: 'Cristal', diamond: 'Diamant', sand: 'Sable',
      water: 'Eau', oxygen: 'Oxygène', bonus: 'Bonus'
    };
    return names[type] || type;
  }

  getItemRarity(type) {
    const rarities = { normal: 'commun', bonus: 'rare', crystal: 'épique', diamond: 'légendaire' };
    return rarities[type] || 'commun';
  }

  // Affichage (à appeler depuis game.js)
  updateDisplay(elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;

    container.innerHTML = '';
    this.slots.forEach((slot, index) => {
      if (slot) {
        const div = document.createElement('div');
        div.className = `inventory-slot rarity-${slot.rarity}`;
        div.innerHTML = `
          <span class="item-name">${slot.name}</span>
          <span class="item-quantity">x${slot.quantity}</span>
        `;
        container.appendChild(div);
      } else {
        const empty = document.createElement('div');
        empty.className = 'inventory-slot empty';
        empty.innerHTML = '&nbsp;';
        container.appendChild(empty);
      }
    });
  }
}

export class CraftingSystem {
  constructor(inventory, recipes = CRAFTING_RECIPES) {
    this.inventory = inventory;
    this.recipes = recipes;
  }

  canCraft(recipeId) {
    const recipe = this.recipes[recipeId];
    if (!recipe || this.inventory.player.level < recipe.unlockLevel) return false;

    for (let [material, required] of Object.entries(recipe.materials)) {
      if (!this.inventory.hasItem(material, required)) {
        return false;
      }
    }
    return true;
  }

  craft(recipeId) {
    const recipe = this.recipes[recipeId];
    if (!this.canCraft(recipeId)) return false;

    // Retirer matériaux
    for (let [material, required] of Object.entries(recipe.materials)) {
      this.inventory.removeItem(material, required);
    }

    // Ajouter résultat
    const result = recipe.result;
    if (result.type === 'consumable') {
      this.inventory.addItem(result.subtype, result.value);
    } else {
      // Équipement/outil
      this.inventory.player.equipment.set(result.subtype, result);
    }

    return true;
  }

  getAvailableRecipes(playerLevel) {
    return Object.entries(this.recipes)
      .filter(([id, recipe]) => playerLevel >= recipe.unlockLevel)
      .map(([id, recipe]) => ({ id, ...recipe }));
  }

  // Affichage
  updateDisplay(elementId, playerLevel) {
    const container = document.getElementById(elementId);
    if (!container) return;

    const available = this.getAvailableRecipes(playerLevel);
    container.innerHTML = '';

    available.forEach(recipe => {
      const canDo = this.canCraft(recipe.id);
      const div = document.createElement('div');
      div.className = `craft-recipe ${canDo ? 'available' : 'locked'}`;
      div.innerHTML = `
        <h4>${recipe.name} ${canDo ? '✅' : '🔒'}</h4>
        <p>${recipe.category} - Niv. ${recipe.unlockLevel}</p>
        <div class="materials">
          ${Object.entries(recipe.materials).map(([mat, qty]) => 
            `<span>${mat}: ${qty}</span>`).join('')}
        </div>
        ${canDo ? `<button onclick="game.craftingSystem.craft('${recipe.id}')">Crafter</button>` : ''}
      `;
      container.appendChild(div);
    });
  }
}
