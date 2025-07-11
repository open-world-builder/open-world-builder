// ===== quests.js =====
// Manages quest definitions, states, and player progress
export class Quest {
    constructor(id, title, desc, objectives = [], rewards = {}) {
      this.id = id;
      this.title = title;
      this.desc = desc;
      this.objectives = objectives;       // [{ text, done }]
      this.rewards = rewards;             // { xp, items }
      this.status = 'hidden';             // hidden, available, active, completed
    }
  }
  
  export class QuestManager {
    static quests = new Map(); // id => Quest
  
    static addQuest(quest) {
      this.quests.set(quest.id, quest);
    }
  
    static getAvailableQuests(npcId) {
      return [...this.quests.values()]
        .filter(q => q.status === 'available' && q.giverId === npcId);
    }
  
    static updateQuestStatus(id, status) {
      const q = this.quests.get(id);
      if (q) q.status = status;
    }
  
    static getQuest(id) {
      return this.quests.get(id);
    }
  
    static acceptQuest(id) {
      this.updateQuestStatus(id, 'active');
    }
  
    static completeObjective(id, index) {
      const q = this.quests.get(id);
      if (q && q.objectives[index]) q.objectives[index].done = true;
      if (q.objectives.every(o => o.done)) this.updateQuestStatus(id, 'completed');
    }
  }
