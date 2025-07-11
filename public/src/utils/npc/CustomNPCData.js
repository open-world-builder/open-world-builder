// Move this to a new file
// Custom NPCS that override default npc settings
export const CUSTOM_NPC_CONFIGS = {
  elite_guard_captain: {
    baseType: "guard",
    name: "Captain Johnson",
    baseXP: 50,
    baseHealth: 200,
    combatLines: ["You dare challenge the captain?!", "Guards, to arms!"],
    // Only need to specify what's different from base type
  },
};
