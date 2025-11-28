import { NPCS } from './config.js';

export class NPCSystem {
  constructor() {
    this.npcs = new Map();
    this.initializeNPCs();
  }

  initializeNPCs() {
    for (let [id, npcData] of Object.entries(NPCS)) {
      const npc = { id, ...npcData, currentDialog: npcData.currentDialog };
      this.npcs.set(id, npc);
    }
  }

  getNPCAt(x, y) {
    for (let npc of this.npcs.values()) {
      if (npc.x === x && npc.y === y) {
        return npc;
      }
    }
    return null;
  }

  getNPCNearby(playerX, playerY, range = 1) {
    for (let npc of this.npcs.values()) {
      const dist = Math.max(Math.abs(npc.x - playerX), Math.abs(npc.y - playerY));
      if (dist <= range) {
        return npc;
      }
    }
    return null;
  }

  getDialog(npcId, dialogKey) {
    const npc = this.npcs.get(npcId);
    return npc ? npc.dialogs[dialogKey] : null;
  }

  // Pour l'affichage depuis game.js
  showDialog(npc, game) {
    const dialog = game.getElement('npcDialog');
    const nameEl = game.getElement('npcName');
    const textEl = game.getElement('npcText');
    const optionsEl = game.getElement('dialogOptions');

    const currentDialog = npc.dialogs[npc.currentDialog];
    nameEl.textContent = `${npc.emoji} ${npc.name}`;
    textEl.textContent = currentDialog.text;

    optionsEl.innerHTML = '';
    currentDialog.options.forEach(option => {
      const button = document.createElement('button');
      button.className = 'dialog-option';
      button.textContent = option.text;
      button.addEventListener('click', () => {
        if (option.response) {
          npc.currentDialog = option.response;
          if (option.response === 'goodbye') {
            dialog.style.display = 'none';
          } else {
            game.showNPCDialog(npc);
          }
        } else {
          dialog.style.display = 'none';
        }
      });
      optionsEl.appendChild(button);
    });

    dialog.style.display = 'block';
  }
}
