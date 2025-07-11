// ===== dialog.js =====
// Manages NPC-specific menu dialogs and routing input via <dialog> or CSS fallback

import { npcRegistry } from '../npc/npc.js';
import { QuestManager } from '../npc/quests.js';

export class Dialog {
    constructor(id) {
        this.el = document.getElementById(id);
    }

    show() {
        if (typeof this.el.showModal === 'function') this.el.showModal();
        else this.el.style.display = 'block';
    }

    hide() {
        if (typeof this.el.close === 'function') this.el.close();
        else this.el.style.display = 'none';
    }
}

// Core dialog controller, adapts menus per NPC context
export const MainDialog = {
    main: new Dialog('mainMenu'),
    talk: new Dialog('talkMenu'),
    quests: new Dialog('questMenu'),
    currentNPC: null,

    start() {
        this.showMain();
    },

    showMain() {
        this._populate(this.main.el, ['TALK', 'QUESTS', 'EXPLORE'], idx => {
            this.main.hide();
            if (idx === 0) this.onTalk();
            else if (idx === 1) this.onQuests();
            else this.onExplore();
        });
        this.main.show();
    },

    onTalk() {
        const nearby = [...npcRegistry.values()].slice(0, 3);
        this._populate(this.talk.el, nearby.map(n => n.name), i => {
            this.currentNPC = nearby[i];
            this.talk.hide();
            this.showNPCMenu();
        });
        this.talk.show();
    },

    // NPC-specific menu
    showNPCMenu() {
        const opts = ['Offer Quest', 'Ask Rumors', 'Back'];
        this._populate(this.talk.el, opts, i => {
            if (i === 0) this.showOffer();
            else if (i === 1) this.handleRumors();
            else this.showMain();
        });
        this.talk.show();
    },

    showOffer() {
        const qs = this.currentNPC.offerQuests().slice(0, 3);
        const titles = qs.length ? qs.map(q => q.title) : ['No quests available'];
        this._populate(this.talk.el, titles, i => {
            if (!qs.length) return this.showNPCMenu();
            const q = qs[i];
            this._populate(this.talk.el, ['Details', 'Accept', 'Back'], opt => {
                if (opt === 0) console.log(`${q.title}: ${q.desc}`);
                else if (opt === 1) this.currentNPC.acceptQuest(q.id);
                else this.showNPCMenu();
            });
        });
        this.talk.show();
    },

    handleRumors() {
        console.log(`${this.currentNPC.name} says: "The night is dark and full of terrors."`);
        this.showNPCMenu();
    },

    onQuests() {
        const active = [...QuestManager.quests.values()]
            .filter(q => q.status === 'active' && q.giverId === this.currentNPC?.id)
            .slice(0, 3);
        const titles = active.map(q => q.title) || ['No active quests'];
        this._populate(this.quests.el, titles, i => {
            if (!active.length) return this.showMain();
            const q = active[i];
            this._populate(this.quests.el, ['Details', 'Abandon', 'Back'], opt => {
                if (opt === 0) console.log(q.desc);
                else if (opt === 1) QuestManager.updateQuestStatus(q.id, 'available');
                else this.showMain();
            });
        });
        this.quests.show();
    },

    onExplore() {
        npcRegistry.forEach(n => n.tick());
        console.log('You explore… new quests may appear.');
        this.showMain();
    },

    // Helper: fill container with up to 3 buttons
    _populate(container, labels, cb) {
        container.innerHTML = '';
        labels.slice(0, 3).forEach((lbl, i) => {
            const btn = document.createElement('button');
            btn.textContent = lbl;
            btn.onclick = () => { container.innerHTML = ''; cb(i); };
            container.appendChild(btn);
        });
    }
};

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => MainDialog.start());
