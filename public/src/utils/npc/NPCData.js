// Top Level NPC Type Defaults
export const NPC_DATA = {
  guard: {
    id: "guard",
    name: "Guard",
    icon: "/assets/util/ui/icons/fireball.png",
    description: "A vigilant guard patrolling the area.",
    baseXP: 10,
    baseHealth: 30,
    combatLines: ["Stop right there!", "You've committed crimes against the realm!", "Time to face justice!"],
    greetingLines: ["Greetings citizen.", "Keep moving along.", "Everything in order?"],
    followerLines: ["I'll watch your back.", "Lead the way.", "Keeping an eye out."],
  },
  wolf: {
    id: "wolf",
    name: "Wolf",
    icon: "/assets/util/ui/icons/wolf.png",
    description: "A fierce wolf that hunts in packs. Watch out for its powerful bite attacks.",
  },
};
