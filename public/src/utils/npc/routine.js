// specifiy paths to travel, and time for da
// [time, position]

// specify what to do when the enemy sees the player
// voice line, talk(conversation), or attack
export const onPlayerSpotted = {
  hostile: { action: "attack", voiceLine: "Found you!" },
  neutral: { action: "talk", conversation: "greeting" },
  friendly: { action: "talk", conversation: "friendly" },
};


