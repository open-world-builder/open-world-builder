// Skill Ideas
// Ice skill that slows, then a combo that stuns
// Skills can only be used in combo
// Skills that keep a combo avaible to be clicked for next ecounter, like storing up a charge.
// Imporve minuet to miniete gameplay - intersting choices between movement and skills to use

import { Effect } from "../effect.js";
export const SKILLS = {
  fireball: {
    id: "fireball",
    name: "Fireball",
    icon: "/assets/util/ui/icons/fireball.png",
    description: "Launches a ball of fire at your target. Burns the target for 5 damage over 3 seconds.",
    animation: {
      name: "SelfCast",
      speed: 1.2,
    },
    vfx: {
      playerVFX: {
        type: "projectile",
        shape: "ball", //dart
        trail: "wavy",
        duration: 300,
        colors: {
          primary: new BABYLON.Color4(1.0, 0.5, 0.0, 1.0),
          secondary: new BABYLON.Color4(0.8, 0.2, 0.0, 1.0),
        },
      },
      hitVFX: {
        type: "particle",
        duration: 500,
        colors: {
          primary: new BABYLON.Color4(1.0, 0.3, 0.0, 1.0),
          secondary: new BABYLON.Color4(1.0, 0.1, 0.0, 1.0),
        },
      },
    },
    combos: [
      {
        skillId: "instantBurn",
        condition: "onCooldown", // Only available when fireball is on cooldown
        window: 7000, // 2 second window to use the combo
      },
    ],
    castTime: 1.15,
    castSound: "Fireplace",
    castSoundEnd: "Explosion",
    cooldown: 1150,
    range: 200,
    cost: [{ type: "mana", value: 25 }],
    effects: [new Effect("damage", 20, { delay: 1.4, sound: "Subduct Up", soundDelay: 1.38, hitVFX: "explosionMinimalDebris", screenShakeIntensity: 0.5, screenShakeDuration: 400 }), new Effect("burn", 5, { delay: 1.4, sound: "Fireplace", hitTime: 0.5, duration: 3, hitVFX: "explosionMinimal" })],
  },
  doubleSlash: {
    id: "doubleSlash",
    name: "Double Slash",
    icon: "/assets/util/ui/icons/skill_icons/Ice_Shard_Skill.png",
    description: "A quick 2-hit sword attack at your target.",
    animation: {
      name: "Combo",
      speed: 2.0,
    },
    vfx: "slashVFX",
    cooldown: 900,
    range: 50,
    cost: [{ type: "stamina", value: 10 }],
    effects: [new Effect("damage", 4, { delay: 0.3, sound: "Sword SFX", soundDelay: 0.28, hitVFX: "explosionMinimalSword" }), new Effect("damage", 8, { delay: 0.85, sound: "Sword SFX", soundDelay: 0.848, hitVFX: "explosionMinimalSword" })],
  },
  heavySwing: {
    id: "heavySwing",
    name: "Heavy Swing",
    icon: "/assets/util/ui/icons/skill_icons/Fire_Core_Energy.png",
    description: "A heavy sword attack at your target.",
    animation: {
      name: "Attack",
      speed: 1.5,
    },
    vfx: "slashVFX",

    cooldown: 500,
    range: 50,
    cost: [{ type: "stamina", value: 10 }],
    effects: [new Effect("damage", 10, { delay: 0.3, sound: "Sword SFX", soundDelay: 0.28, hitVFX: "explosionMinimalSword", screenShakeIntensity: 0.1, screenShakeDuration: 300 })],
  },
  dodge: {
    id: "dodge",
    name: "Dodge",
    icon: "/assets/util/ui/icons/skill_icons/Phoenix_Flame_Wheel.png",
    description: "A quick dodge roll.",
    animation: {
      name: "Roll",
      speed: 2.0,
    },
    vfx: "slashVFX",
    cooldown: 500,
    range: 50,
    cost: [{ type: "stamina", value: 10 }],
    target: "self", // or single target. maybe ground
    type: "Single Target",
    effects: [new Effect("dodge", 1.5)],
  },
  instantBurn: {
    id: "instantBurn",
    name: "Instant Burn",
    icon: "/assets/util/ui/icons/skill_icons/Flame_Essence.png",
    description: "Instantly applies a burn to your target.",
    animation: {
      name: "SelfCast",
      speed: 2.4,
    },

    cooldown: 5000,
    range: 200,
    cost: [{ type: "stamina", value: 10 }],
    target: "enemy",
    type: "Single Target",
    effects: [new Effect("burn", 5, { delay: 0.01, sound: "Fireplace", hitTime: 0.5, duration: 3, hitVFX: "explosionMinimal" })],
  },
  guardPunch: {
    id: "guardPunch",
    name: "Guard Punch",
    icon: "/assets/util/ui/icons/skill_icons/Fire_Core_Energy.png",
    description: "A blunt attack at your target.",
    animation: {
      name: "Attack",
      speed: 1.5,
    },
    vfx: "slashVFX",

    cooldown: 500,
    range: 50,
    cost: [{ type: "stamina", value: 10 }],
    effects: [new Effect("damage", 10, { delay: 0.3, sound: "Sword SFX", soundDelay: 0.03, hitVFX: "explosionMinimalSword" })],
  },
  splash: {
    id: "splash",
    name: "Splash",
    icon: "/assets/util/ui/icons/skill_icons/Water_Ring_Force.png",
    description: "A splash effect at your target.",
    animation: {
      name: "Attack",
      speed: 1.5,
    },
    vfx: "slashVFX",
    minLevel: 2,
    cooldown: 500,
    range: 50,
    cost: [{ type: "stamina", value: 10 }],
    effects: [new Effect("damage", 20, { delay: 1.4, sound: "Subduct Up", soundDelay: 1.38, hitVFX: "splash" })],
  },
  customSkill: {
    id: "customSkill",
    name: "Custom Spell",
    icon: "/assets/util/ui/icons/skill_icons/Fiery_Explosion_Core.png",
    description: "Edit this skill in the skill maker, then click the 'add skill' button to add it to your spellbook.",
    animation: {
      name: "SelfCast",
      speed: 2.4,
    },
    castTime: 1.15,
    cooldown: 5000,
    range: 200,
    cost: [{ type: "stamina", value: 10 }],
    target: "enemy",
    type: "Single Target",
    effects: [new Effect("burn", 5, { delay: 0.01, sound: "Fireplace", hitTime: 0.5, duration: 3, hitVFX: "explosionMinimal" })],
  },
  customMeele: {
    id: "customMeele",
    name: "Custom Meele",
    icon: "/assets/util/ui/icons/skill_icons/Fire_Core_Energy.png",
    description: "Edit this skill in the skill maker, then click the 'add skill' button to add it to your spellbook.",
    animation: {
      name: "Attack",
      speed: 1.5,
    },
    vfx: "slashVFX",

    cooldown: 500,
    range: 50,
    cost: [{ type: "stamina", value: 10 }],
    effects: [new Effect("damage", 10, { delay: 0.3, sound: "Sword SFX", soundDelay: 0.28, hitVFX: "explosionMinimalSword", screenShakeIntensity: 0.1, screenShakeDuration: 300 })],
  },
};
