import { SKILLS } from "./SkillData.js";
import { SPELLS } from "../SPELLS.js";
import { Spell } from "../spell.js";
import { VFX } from "../visual/VFX.js";

import { createXPPopup } from "../../character/damagePopup.js";

export class SkillBar {
  constructor() {
    this.slots = new Map();
    this.hasInitialized = false;
    this.skillBar = document.querySelector("#skillBar");
  }

  setupSkillBar() {
    document.querySelector("#skillBar").style.display = "flex";
    this.createSkillBarUI();
    this.initializeSkillBar();
    this.setupDragAndDrop();
    this.bindKeyboardEvents();
    this.createComboUI();
    // this.addHitStop();
    this.addScreenShake();
    this.listenForSkillEditorMessages();
  }

  showSkillBar() {
    if (!this.hasInitialized) {
      this.setupSkillBar();

      this.hasInitialized = true;
      this.skillBar.style.opacity = "0";
    }

    this.showHealthBar();
    this.skillBar.style.display = "flex";
    setTimeout(() => {
      this.skillBar.style.opacity = "1";
    }, 500);
  }

  hideSkillBar() {
    this.skillBar.style.opacity = "0";
    this.hideHealthBar();
    setTimeout(() => {
      this.skillBar.style.display = "none";
    }, 1000);
  }

  createSkillBarUI() {
    const style = document.createElement("style");
    style.textContent = `
            #skillBar {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                display: none;
                // display: flex;
                gap: 10px;
                background: rgba(0, 0, 0, 0.5);
                padding: 10px;
                border-radius: 5px;
                z-index: 1000;
                pointer-events: auto;
                opacity: 0;
                font-family: Verdana, "Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif;
                transition: all 0.65s ease;
            }

            body[data-mobile="true"] #skillBar {
                left: auto;
                right: 20px;
                bottom: 20px;
                transform: none;
                background: none;
                padding: 0;
                display: grid;
                grid-template-areas: 
                    ". . skill1"
                    ". skill2 ."
                    "skill4 . skill3";
                gap: 10px;
                width: 180px;
                height: 180px;
            }

            body[data-mobile="true"] .skill-slot[data-slot="1"] { grid-area: skill1; }
            body[data-mobile="true"] .skill-slot[data-slot="2"] { grid-area: skill2; }
            body[data-mobile="true"] .skill-slot[data-slot="3"] { grid-area: skill3; }
            body[data-mobile="true"] .skill-slot[data-slot="4"] { grid-area: skill4; }

            body[data-mobile="true"] .skill-slot {
                width: 60px;
                height: 60px;
            }

            body[data-mobile="true"] .skill-tooltip {
                transform: translate(-50%, -120%);
                right: 0;
                left: 50%;
            }

            @media screen and (max-width: 768px) {
              #healthBar{
              margin-left: -24px !important;
              }

                /* Hide slots 4-9 on mobile */
                .skill-slot:nth-child(n+4) {
                    display: none;
                }

  }

            .skill-slot {
                width: 50px;
                height: 50px;
                border: 2px solid #666;
                border: 1px solid #000;
                border-radius: 5px;
                background: rgba(0, 0, 0, 0.3);
                position: relative;
                cursor: pointer;
                transition: all 0.2s ease;
                  filter: brightness(1);
            transition: filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .skill-slot:hover {
                // border-color: #999;
                // background: rgba(0, 0, 0, 0.4);
                filter: brightness(1.5);
            }

            .skill-slot.active {
            filter: brightness(1.9);
        }

            .skill-slot img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                pointer-events: none;
            }

            .skill-slot .cooldown {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 0%;
                background: rgba(0, 0, 0, 0.85);
                // background: rgba(0, 0, 0, 0.0);
                transition: height 0.1s linear;
                pointer-events: none;
            }

            .skill-slot .key-bind {
                position: absolute;
                top: 2px;
                right: 2px;
                color: white;
                font-size: 12px;
                background: rgba(0, 0, 0, 0.5);
                padding: 2px;
                border-radius: 3px;
                pointer-events: none;
            }

            .skill-tooltip {
                display: none;
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                width: 250px;
                padding: 10px;
                background: rgba(0, 0, 0, 0.9);
                /* border: 1px solid #d4b063; */
                border: 2px solid #666;
                border-radius: 4px;
                color: #fff;
                font-family: Arial, sans-serif;
                z-index: 1000;
                pointer-events: none;
                /* box-shadow: 0 0 10px rgba(212, 176, 99, 0.5); */
                box-shadow: 0px 0px 50px 20px rgba(0, 0, 0, 0.25);
                margin-bottom: 15px;
                font-family: Verdana, "Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif;
            }

            .skill-slot:hover .skill-tooltip {
                display: block;
            }

            .tooltip-header {
                /* color: #ffd100; */
                letter-spacing: 0.04em;
                color: #fff;
                font-size: 16px;
                /* font-weight: bold; */
                margin-bottom: 4px;
            }

            .tooltip-cost {
                color: #2196f3;
                font-size: 12px;
                margin-bottom: 4px;
            }

            .tooltip-cost .stamina-cost {
                color: #ffd700;
            }

            .tooltip-cast-time, 
            .tooltip-cooldown {
                color: #888;
                font-size: 12px;
                margin-bottom: 4px;
            }

            .tooltip-description {
                color: #ffd;
                font-size: 12px;
                line-height: 1.4;
            }

                      #castBar {
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                width: 375px;
                height: 30px;
                background: #000;
                display: none;
                border-radius: 50px;
                overflow: hidden;
                box-shadow: rgba(0, 0, 0, 0.8) 0px 0px 10px;
  transition: box-shadow 0.3s ease, opacity 0.3s ease;  /* Add smooth transitions */
                    //  border: 2px solid #666;
                background: rgba(0, 0, 0, 0.73);
  //                   background: linear-gradient(
  //   120deg,
  //   rgba(0, 0, 0, 0.7) 0%,
  //   transparent 40%,
  //   rgba(6, 6, 6, 0.6) 70%,
  //   transparent 100%
  // );
  //   background-size: 200% 200%;
  //   animation: moveGradient 4s linear infinite;
}

// @keyframes moveGradient {
//   0% {
//     background-position: 0% 0%;
//   }
//       50% {
//     background-position: 100% 100%;
//   }
//   100% {
//     background-position: 0% 0%;
//   }
// }

            #castBarFill {
                width: 0%;
                height: 100%;
                background:rgba(255, 128, 0, 0.93);
  //                 background: radial-gradient(circle at center, #fff8dc, #ffd700 30%, #b8860b 60%, #8b7500 100%);
  // background-attachment: fixed;
  // background-size: cover;
  //   background: linear-gradient(
  //   135deg,
  //   #fff8dc 0%,
  //   #ffe066 20%,
  //   #ffd700 40%,
  //   #e6be8a 60%,
  //   #b8860b 80%,
  //   #8b7500 100%
  // );
  background: linear-gradient(
    270deg,
    #fff6cc 0%,
    #ffd700 25%,
    #d4af37 50%,
    #b8860b 75%,
    #7c5a1a 100%
  );

 
  }


   #castBarFillMotion {
  // content: '';
  // position: absolute;
  // top: 0;
  // left: 0;
  width: 100%;
  height: 100%;
  // background: linear-gradient(
  //   120deg,
  //   rgba(0, 0, 0, 0.7) 0%,
  //   transparent 40%,
  //   rgba(6, 6, 6, 0.6) 70%,
  //   transparent 100%
  // );
      background: linear-gradient(160deg, rgb(0 0 0 / 70%) 0%, transparent 40%, rgb(255 28 0 / 21%) 70%, transparent 100%);
    background-size: 200% 200%;
    animation: moveGradientMotion 4s linear infinite;
}

@keyframes moveGradientMotion {
  0% {
    background-position: 0% 0%;
  }
      50% {
    background-position: 100% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
}

    color: #fffbe6;
  text-shadow: 1px 1px 2px #5a4500;
  // box-shadow:
  //   inset 0 2px 4px rgba(255, 255, 255, 0.4),
  //   inset 0 -3px 6px rgba(0, 0, 0, 0.4),
  //   0 8px 16px rgba(0, 0, 0, 0.6);
  }
  #castBarFill::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    width: 4px;
    height: 100%;
    background: rgba(255, 255, 255, 0.8);
}

#castBarText {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 16px;
    z-index: 1;
    // text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
      text-shadow: rgba(0, 0, 0, 0.97) 1px 0px 5px;
    
}

.castBarFillMotion::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 35px;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
   background: linear-gradient(to left, rgba(255, 255, 255, 0.8), transparent);
  filter: blur(4px);
  transform: translateX(5px);
}


 #xpBar {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 6px;
            background: rgba(0, 0, 0, 0.73);
            display: none;
            overflow: hidden;
            box-shadow: rgba(0, 0, 0, 0.8) 0px 0px 10px;
            transition: opacity 0.3s ease, box-shadow 0.3s ease, filter 0.3s ease;
            z-index: 999;
        }

        #xpBarFill {
            width: 0%;
            height: 100%;
            background: linear-gradient(
                270deg,
                #fff6cc 0%,
                #ffd700 25%,
                #d4af37 50%,
                #b8860b 75%,
                #7c5a1a 100%
            );
        }

        #xpBarFillMotion {
            width: 100%;
            height: 100%;
            background: linear-gradient(160deg, rgb(0 0 0 / 70%) 0%, transparent 40%, rgb(255 28 0 / 21%) 70%, transparent 100%);
            background-size: 200% 200%;
            animation: moveGradientMotion 4s linear infinite;
        }
            .xpBarFill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 35px;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
   background: linear-gradient(to left, rgba(255, 255, 255, 0.8), transparent);
  filter: blur(4px);
  transform: translateX(5px);
  display: none;
}

        #xpBarText {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 10px;
            z-index: 1;
            text-shadow: rgba(0, 0, 0, 0.97) 1px 0px 5px;
        }
                    #healthBar {
            position: fixed;
            bottom: 90px;
            left: 50%;
            transform: translateX(-50%);
            width: 200px;
            height: 20px;
               bottom:78px;
            width: 79px;
    height: 11px;
                margin-left: -233px;
            background: rgba(0, 0, 0, 0.73);
            // border-radius: 10px;
            overflow: hidden;
            box-shadow: rgba(0, 0, 0, 0.8) 0px 0px 10px;
            transition: opacity 0.3s ease, box-shadow 0.3s ease, filter 0.3s ease;
            z-index: 0;
            display: none;
        }

        #healthBarFill {
            width: 100%;
            height: 100%;
            background: linear-gradient(
                270deg,
                #ff6b6b 0%,
                #ff4757 25%,
                #ff0000 50%,
                #dc0000 75%,
                #b00000 100%
            );
            transition: width 0.3s ease-out;
        }

        #healthBarFillMotion {
            width: 100%;
            height: 100%;
            background: linear-gradient(160deg, rgb(0 0 0 / 70%) 0%, transparent 40%, rgb(255 28 0 / 21%) 70%, transparent 100%);
            background-size: 200% 200%;
            animation: moveGradientMotion 4s linear infinite;
        }

        #healthBarText {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 10px;
            font-family:  sans-serif;
            z-index: 1;
            text-shadow: rgba(0, 0, 0, 0.97) 1px 0px 5px;
            white-space: nowrap;
        }
        
        

            }



        `;
    document.head.appendChild(style);
    document.body.insertAdjacentHTML("beforeend", '<div id="castBar"><div id="castBarFill" ><div id="castBarFillMotion" class="castBarFillMotion"></div></div><div id="castBarText"></div></div>');
    document.body.insertAdjacentHTML("beforeend", '<div id="xpBar"><div id="xpBarFill" class="xpBarFill" ><div id="xpBarFillMotion" ></div></div><div id="xpBarText"></div></div>');
    // document.body.insertAdjacentHTML("beforeend", '<div id="healthBar"><div id="healthBarFill"><div id="healthBarFillMotion"></div></div><div id="healthBarText"></div></div>');
    // Get the skill bar element
    const skillBar = document.querySelector("#skillBar");

    // Add the health bar as the first child of the skill bar
    skillBar.insertAdjacentHTML(
      "afterbegin",
      `
            <div id="healthBar">
                <div id="healthBarFill">
                    <div id="healthBarFillMotion"></div>
                </div>
                <div id="healthBarText"></div>
            </div>
        `
    );

    // Set mobile attribute on body
    // function isMobile() {
    //     return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    // }
    // ON_MOBILE = isMobile();
    // Todo: fix mobile longtap ability tooltips
    // document.body.setAttribute('data-mobile', ON_MOBILE);
    this.castBar = document.getElementById("castBar");
    this.castBarFill = document.getElementById("castBarFill");
    this.castBarText = document.getElementById("castBarText");

    this.xpBar = document.getElementById("xpBar");
    this.xpBarFill = document.getElementById("xpBarFill");
    this.xpBarText = document.getElementById("xpBarText");

    this.healthBar = document.getElementById("healthBar");
    this.healthBarFill = document.getElementById("healthBarFill");
    this.healthBarText = document.getElementById("healthBarText");

    this.activeComboSkills = new Set();
    this.comboContainer = null;
  }

  createComboUI() {
    const style = document.createElement("style");
    style.textContent = `
        #comboContainer {
            position: fixed;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 1000;
            bottom: 150px;
  left: 50%;
  transform: translateX(-50%);
  margin-left: 378px;
        }
        .combo-skill {
            width: 50px;
            height: 50px;
            border: 2px solid #ffd700;
            border-radius: 5px;
            background: rgba(0, 0, 0, 0.7);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .combo-skill.active {
            opacity: 1;
        }
        .combo-skill img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .combo-key-bind {
            position: relative;
            top: -50px;
            left: 31px;
            width: 12px;
            color: white;
            font-size: 12px;
            background: rgba(0, 0, 0, 0.5);
            padding: 2px;
            border-radius: 3px;
            pointer-events: none;
        }
                    .combo-skill .cooldown {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 0%;
            background: rgba(0, 0, 0, 0.8);
            transition: height 0.1s linear;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);

    this.comboContainer = document.createElement("div");
    this.comboContainer.id = "comboContainer";
    document.body.appendChild(this.comboContainer);
  }

  // Add to castSkill method, after skillSlot.lastCast = Date.now();
  checkCombos(slot) {
    const skill = this.slots.get(slot).skill;
    if (skill.combos) {
      skill.combos.forEach((combo) => {
        if (combo.condition === "onCooldown") {
          this.showComboSkill(combo.skillId, combo.window);
        }
      });
    }
  }

  findSlotBySkillId(skillId) {
    for (const [slot, data] of this.slots) {
      if (data.skill.id === skillId) {
        return slot;
      }
    }
    return null;
  }

  showComboSkill(skillId, duration) {
    const skill = SKILLS[skillId];
    const slotNumber = this.findSlotBySkillId(skillId);
    const comboElement = document.createElement("div");
    comboElement.className = "combo-skill";
    // comboElement.innerHTML = `<img src="${skill.icon}" alt="${skill.name}">`;
    comboElement.innerHTML = `
    <img src="${skill.icon}" alt="${skill.name}">
      <div class="cooldown"></div>
    ${slotNumber ? `<div class="combo-key-bind">${slotNumber}</div>` : ""}
`;
    // Add click handler for the combo skill
    comboElement.style.cursor = "pointer";
    comboElement.onclick = () => {
      // Show cooldown effect
      // const cooldownElement = comboElement.querySelector(".cooldown");
      // cooldownElement.style.height = "100%";

      // Trigger the actual skill
      if (slotNumber) {
        this.castSkill(slotNumber, PLAYER.health, PLAYER.target.health);
      }

      window.TERRAIN_EDITOR.canvas.focus();

      // Remove the combo element after animation
      comboElement.classList.remove("active");
      setTimeout(() => comboElement.remove(), 300);
    };

    this.comboContainer.appendChild(comboElement);
    requestAnimationFrame(() => comboElement.classList.add("active"));

    setTimeout(() => {
      comboElement.classList.remove("active");
      setTimeout(() => comboElement.remove(), 300);
    }, duration);
  }

  initializeSkillBar() {
    // get class

    // Set default skills
    this.setSkill(1, "heavySwing");
    this.setSkill(2, "dodge");
    this.setSkill(3, "doubleSlash");
    this.setSkill(4, "fireball");

    this.setSkill(6, "instantBurn");
    this.updateUI();
  }

  switchToFireSkills() {
    this.setSkill(1, "fireball");
    this.setSkill(2, "instantBurn");
  }

  setSkill(slot, skillId) {
    if (SKILLS[skillId]) {
      this.slots.set(slot, {
        skill: SKILLS[skillId],
        lastCast: 0,
      });
    }
  }
  showCastBar(duration, skillName) {
    const bar = this.castBar;
    const fill = this.castBarFill;
    const text = this.castBarText;

    // Remove transition temporarily for instant opacity change
    bar.style.transition = "none";
    bar.style.display = "block";
    bar.style.boxShadow = "rgba(0, 0, 0, 0.8) 0px 0px 10px";
    bar.style.opacity = "1";

    fill.style.transition = "none";
    fill.style.width = "0";
    fill.style.filter = "brightness(1.1)";
    fill.offsetWidth;

    // Force browser reflow to ensure transition removal takes effect
    bar.offsetHeight;

    // Restore transition for later fade-out
    bar.style.transition = "box-shadow 0.2s ease, opacity 0.3s ease";

    text.textContent = skillName; // Set the skill name

    bar.style.boxShadow = "rgb(0 0 0 / 80%) 0px 0px 10px";
    fill.style.transition = `width ${duration}s linear, filter 0.2s cubic-bezier(0.19, 1, 0.22, 1)`;

    requestAnimationFrame(() => {
      fill.style.width = "100%";
    });

    setTimeout(() => {
      bar.style.boxShadow = "rgb(255 179 0 / 90%) 0px 0px 20px";
      fill.style.filter = "brightness(1.9)";
      // bar.style.opacity = "0";

      setTimeout(() => {
        bar.style.opacity = "0";

        // bar.style.display = "none";

        setTimeout(() => {
          fill.style.width = "0";
        }, 300);
      }, 300);
    }, duration * 1000);
  }

  canCastSkill(slot) {
    const skillSlot = this.slots.get(slot);
    if (!skillSlot) return false;

    const now = Date.now();
    return now - skillSlot.lastCast >= skillSlot.skill.cooldown;
  }

  async castSkill(slot, caster, target) {
    if (!this.canCastSkill(slot)) return;

    // console.log("in can cast skill");

    const skillSlot = this.slots.get(slot);
    const skill = skillSlot.skill;

    // Check resources
    if (skill.manaCost && caster.mana < skill.manaCost) return;
    if (skill.staminaCost && caster.stamina < skill.staminaCost) return;

    const slotElement = document.querySelector(`.skill-slot[data-slot="${slot}"]`);
    if (slotElement) {
      slotElement.classList.add("active");
      setTimeout(() => {
        slotElement.classList.remove("active");
      }, 300); // Remove class after 300ms to allow for fade out
    }

    // Show cast bar if skill has cast time
    if (skill.castTime) {
      this.showCastBar(skill.castTime, skill.name);
    }

    // Cast the skill
    skillSlot.lastCast = Date.now();
    //  timeout for highlight, then cooldown shows
    setTimeout(() => {
      this.updateCooldown(slot);
    }, 300);

    // check for combos ui after casting
    this.checkCombos(slot);

    // if (skill.vfx) {
    //   VFX.cast(skill.vfx, caster, target);
    // }
    // SPELLS.fireball.cast(PLAYER.health, PLAYER.target.health);
    // SPELLS.heavySwing.cast(PLAYER.health, PLAYER.target.health);
    // skill.cast(caster, target);
    // Create a spell instance for this skill

    // eventually rename spell to skill
    const spell = new Spell(
      skill.name,
      skill.effects,
      skill.animation,
      skill.vfx,
      skill.range || 10, // Default range if not specified
      skill.castTime,
      skill.castSound,
      skill.castSoundEnd
    );

    // Cast using spell mechanics
    if (spell.canCast(caster, target)) {
      spell.cast(caster, target);
    }

    // Apply effects
    // skill.effects.forEach(effect => {
    //     switch(effect.type) {
    //         case 'damage':
    //             target.health.takeDamage(effect.value);
    //             break;
    //         case 'burn':
    //             this.applyBurn(target, effect);
    //             break;
    //         // Add more effect types as needed
    //     }
    // });

    // console.log(skill);
    // console.log(skill.animation);
    // Play VFX/animation
    // if (skill.vfx) this.playVFX(skill.vfx, caster, target);
    if (skill.animation) this.playAnimation(skill.animation, caster);
    if (window.TERRAIN_EDITOR) {
      window.TERRAIN_EDITOR.canvas.focus();
    }
  }

  updateUI() {
    for (let slot = 1; slot <= 9; slot++) {
      const skillSlot = this.slots.get(slot);
      const element = document.querySelector(`.skill-slot[data-slot="${slot}"]`);

      if (skillSlot) {
        element.innerHTML = `
                    <img src="${skillSlot.skill.icon}" alt="${skillSlot.skill.name}">
                    <div class="cooldown"></div>
                    <div class="key-bind">${slot}</div>
                    <div class="skill-tooltip">
                        <div class="tooltip-header">${skillSlot.skill.name}</div>
                        <div class="tooltip-cost">
                            ${skillSlot.skill.manaCost ? `<span class="mana-cost">${skillSlot.skill.manaCost} Mana</span>` : ""}
                            ${skillSlot.skill.staminaCost ? `<span class="stamina-cost">${skillSlot.skill.staminaCost} Energy</span>` : ""}
                        </div>
                        <div class="tooltip-cast-time">Cast Time: Instant</div>
                        <div class="tooltip-cooldown">Cooldown: ${skillSlot.skill.cooldown / 1000} sec</div>
                        <div class="tooltip-description">${skillSlot.skill.description}</div>
                    </div>
                `;
      } else {
        element.innerHTML = `
                    <div class="key-bind">${slot}</div>
                `;
      }
    }
  }

  updateCooldown(slot) {
    const skillSlot = this.slots.get(slot);
    const element = document.querySelector(`.skill-slot[data-slot="${slot}"] .cooldown`);

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - skillSlot.lastCast;
      const progress = (elapsed / skillSlot.skill.cooldown) * 100;

      if (progress >= 100) {
        element.style.height = "0%";
        return;
      }

      element.style.height = 100 - progress + "%";
      requestAnimationFrame(updateProgress);
    };

    requestAnimationFrame(updateProgress);
  }

  setupDragAndDrop() {
    const slots = document.querySelectorAll(".skill-slot");

    slots.forEach((slot) => {
      // Add click/touch handler
      slot.addEventListener("click", (e) => {
        const slotNumber = Number(slot.dataset.slot);
        this.castSkill(slotNumber, PLAYER.health, PLAYER.target.health);
      });

      // Existing drag and drop code
      slot.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", slot.dataset.slot);
        const tooltip = slot.querySelector(".skill-tooltip");
        if (tooltip) {
          tooltip.style.opacity = "0";
        }
      });

      slot.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      slot.addEventListener("drop", (e) => {
        e.preventDefault();
        const draggedData = e.dataTransfer.getData("text/plain");
        const toSlot = slot.dataset.slot;

        // Check if this is a spell from spellbook (spellId format) or a skill slot number
        if (SKILLS[draggedData]) {
          // This is a spell from spellbook
          this.setSkill(Number(toSlot), draggedData);
        } else {
          // This is a skill slot swap
          const fromSlot = Number(draggedData);
          const fromSkill = this.slots.get(fromSlot);
          const toSkill = this.slots.get(Number(toSlot));

          // Set the skills in their new positions
          if (fromSkill) {
            this.slots.set(Number(toSlot), fromSkill);
          }
          if (toSkill) {
            this.slots.set(fromSlot, toSkill);
          }
          if (!toSkill && fromSkill) {
            this.slots.set(fromSlot, undefined);
          }
          if (toSkill && !fromSkill) {
            this.slots.set(Number(toSlot), undefined);
          }
        }
        // const fromSlot = e.dataTransfer.getData("text/plain");
        // const toSlot = slot.dataset.slot;

        // // // Swap skills
        // // const temp = this.slots.get(Number(fromSlot));
        // // this.slots.set(Number(fromSlot), this.slots.get(Number(toSlot)));
        // // this.slots.set(Number(toSlot), temp);

        // // Get the skills from both slots
        // const fromSkill = this.slots.get(Number(fromSlot));
        // const toSkill = this.slots.get(Number(toSlot));

        // // Set the skills in their new positions
        // if (fromSkill) {
        //   this.slots.set(Number(toSlot), fromSkill);
        // }
        // if (toSkill) {
        //   this.slots.set(Number(fromSlot), toSkill);
        // }

        this.updateUI();
      });
    });

    document.addEventListener("dragend", (e) => {
      console.log("dragendbefore", e.target);
      const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
      if (!dropTarget?.closest(".skill-slot")) {
        console.log("dragend", e.target);
        this.slots.set(Number(e.target.dataset.slot), undefined);
        this.updateUI();
      }
    });
  }

  addHitStop() {
    window.hitStopTimer = 0;
    window.timeScale = 1.0;
    window.SCENE_MANAGER.activeScene.onBeforeRenderObservable.add(() => {
      if (window.hitStopTimer > 0) {
        window.timeScale = 0.0; // Slow down to 10%
        window.hitStopTimer -= window.SCENE_MANAGER.activeScene.getEngine().getDeltaTime();
        if (window.hitStopTimer <= 0) window.timeScale = 1.0;
      }

      // Use timeScale in your custom movement/logic updates
    });
  }

  addScreenShake() {
    if (window.location.href.includes("skill_editor.html")) return;

    const camera = window.SCENE_MANAGER.activeScene.activeCamera;
    window.screenShake = function (intensity = 0.2, duration = 40) {
      const startTime = performance.now();
      const originalTarget = { x: camera.target.x, y: camera.target.y, z: camera.target.z };
      const originalAlpha = camera.alpha;
      camera.isShaking = true;

      function shake() {
        const elapsed = performance.now() - startTime;
        const progress = elapsed / duration;

        if (elapsed < duration) {
          // Create a decay factor that goes from 1 to 0 smoothly
          const decay = Math.cos(progress * Math.PI) * 0.5 + 0.5;

          // Use sine waves with different frequencies for smooth random-looking motion
          // Using different frequencies for each axis creates more dynamic motion
          // const xOffset = Math.sin(elapsed * 0.05) * intensity * decay;
          // const yOffset = Math.sin(elapsed * 0.04 + 2) * intensity * decay;
          // const zOffset = Math.sin(elapsed * 0.03 + 4) * intensity * decay;

          // Reduced frequencies by half (0.05 → 0.025, 0.04 → 0.02, 0.03 → 0.015)
          const xOffset = Math.sin(elapsed * 0.025) * intensity * decay;
          const yOffset = Math.sin(elapsed * 0.02 + 2) * intensity * decay;
          const zOffset = Math.sin(elapsed * 0.015 + 4) * intensity * decay;

          // Apply the shake to the target position
          camera.target.x = originalTarget.x + xOffset;
          camera.target.y = originalTarget.y + yOffset;
          camera.shakeXOffset = xOffset;
          camera.shakeYOffset = yOffset;

          // console.log("shakeXOffset", camera.shakeXOffset);
          // console.log("shakeYOffset", camera.shakeYOffset);
          // camera.target.z = originalTarget.z + zOffset;

          // You can keep the rotation shake too for more intense effect
          // camera.alpha = originalAlpha + xOffset * 0.5; // reduced intensity for rotation

          requestAnimationFrame(shake);
        } else {
          // Reset to original positions
          camera.target.x = originalTarget.x;
          camera.target.y = originalTarget.y;
          // camera.target.z = originalTarget.z;

          camera.shakeXOffset = 0;
          camera.shakeYOffset = 0;
          // camera.alpha = originalAlpha;
          camera.isShaking = false;
        }
      }

      shake();
    };
  }

  listenForSkillEditorMessages() {
    window.addEventListener("message", (event) => {
      if (event.data.type === "UPDATE_ALL_SKILLS") {
        console.log("UPDATE_ALL_SKILLS", event.data.skills);

        // Replace the entire SKILLS object with the new one
        Object.assign(SKILLS, event.data.skills);
        // SKILLS = event.data.skills;

        // If you have any UI or other components that need to be updated
        SPELLBOOK.updateSpellItems();
        // SPELLBOOK.jumpToSkill(event.data.skills[0].id);
        SPELLBOOK.jumpToBottom();
        this.updateUI();
      }
    });
  }
  bindKeyboardEvents() {
    window.addEventListener("keydown", (e) => {
      const slot = Number(e.key);
      if (slot >= 1 && slot <= 9) {
        if (MODE !== null && MODE !== 1) return;
        // console.log("casting skill", slot);
        // console.log(PLAYER.health);
        // console.log(PLAYER.target.health);
        this.castSkill(slot, PLAYER.health, PLAYER.target.health);

        // Add visual feedback for the pressed key
        const slotElement = document.querySelector(`.skill-slot[data-slot="${slot}"]`);
        if (slotElement) {
          slotElement.classList.add("active");
          setTimeout(() => {
            slotElement.classList.remove("active");
          }, 300);
        }
      }

      // XP Bar Debug
      // switch (e.key) {
      //   case "n":
      //     // Add 10 XP when 'n' is pressed
      //     this.addXP(10);
      //     break;
      //   case "m":
      //     // Show XP bar when 'm' is pressed
      //     this.showXPBar();
      //     break;
      //   case ",":
      //     // Hide XP bar when ',' is pressed
      //     this.hideXPBar();
      //     break;
      // }
    });
  }

  playAnimation(animationData, caster) {
    // Get the animation from the scene's animation groups
    const anim = caster.anim;

    // console.log(caster);
    if (!anim) return;

    // Stop other animations except the skill animations
    for (let key in anim) {
      if (anim.hasOwnProperty(key) && anim[key].isPlaying) {
        if (key !== animationData.name) anim[key].stop();
      }
    }

    // Play the skill animation
    if (anim[animationData.name]) {
      anim[animationData.name].start(false, animationData.speed || 1.0, animationData.from || anim[animationData.name].from, animationData.to || anim[animationData.name].to, true);
    }
  }

  // Add these new methods to the SkillBar class
  showXPBar() {
    const bar = this.xpBar;

    if (bar.style.display === "block") return;
    // Remove transition temporarily for instant display
    bar.style.transition = "none";
    bar.style.display = "block";
    bar.style.opacity = "0";

    // Force browser reflow
    bar.offsetHeight;

    // Restore transition and fade in
    bar.style.transition = "opacity 0.3s ease";
    requestAnimationFrame(() => {
      bar.style.opacity = "1";
    });
  }

  hideXPBar() {
    const bar = this.xpBar;

    bar.style.opacity = "0";
    setTimeout(() => {
      bar.style.display = "none";
    }, 300);
  }

  updateXPBar(currentXP, maxXP) {
    if (!this.xpBar) return;

    const percentage = (currentXP / maxXP) * 100;

    // Remove transition temporarily if the bar is being reset
    if (percentage === 0) {
      this.xpBarFill.style.transition = "none";
      this.xpBarFill.style.width = "0%";
      // Force reflow
      this.xpBarFill.offsetHeight;
      this.xpBarFill.style.transition = "width 0.5s ease-out";
    } else {
      // Ensure transition is enabled and update width
      this.xpBarFill.style.transition = "width 0.5s ease-out";
      this.xpBarFill.style.width = `${percentage}%`;
    }

    this.xpBarText.textContent = `${Math.floor(currentXP)} / ${Math.floor(maxXP)} XP`;

    // const percentage = (currentXP / maxXP) * 100;
    // this.xpBarFill.style.width = `${percentage}%`;
    // this.xpBarText.textContent = `${Math.floor(currentXP)} / ${Math.floor(maxXP)} XP`;
  }

  calcMultipliedXp(xp) {
    const multipliers = [
      { value: 1, probability: 0.6, sound: "Quickness" }, // 50% chance
      { value: 2, probability: 0.15, sound: "Cleanse" }, // 15% chance
      { value: 5, probability: 0.01, sound: "Cleanse" }, // 8% chance
      { value: 10, probability: 0.001, sound: "Cleanse" }, // 2% chance
    ];

    // Select a random multiplier based on probabilities
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedMultiplier = multipliers[0];

    for (const multiplier of multipliers) {
      cumulativeProbability += multiplier.probability;
      if (random <= cumulativeProbability) {
        selectedMultiplier = multiplier;
        break;
      }
    }

    window.SCENE_MANAGER.activeScene.activeCamera.sound.play(selectedMultiplier.sound, "sfx");

    const multipliedXP = Math.floor(xp * selectedMultiplier.value);
    return multipliedXP;
  }

  calcMaxXP() {
    return Math.floor(30 * Math.pow(PLAYER_DATA.nextLevelExponent, PLAYER_DATA.level - 1));
  }

  addXP(xp) {
    this.showXPBar();

    const multipliedXP = this.calcMultipliedXp(xp);
    console.log("multipliedXP", multipliedXP);
    xp = multipliedXP;

    PLAYER_DATA.experience += xp;
    const maxXP = this.calcMaxXP();

    if (PLAYER_DATA.experience >= maxXP) {
      this.updateXPBar(PLAYER_DATA.experience, this.calcMaxXP());

      PLAYER_DATA.level++;
      // SKILL_TREE.updateAvailableSkills();

      // visual level up sequence
      window.SCENE_MANAGER.activeScene.activeCamera.sound.play("Protective Spirit", "sfx");
      this.xpBar.style.boxShadow = "rgb(255 179 0 / 90%) 0px 0px 20px";
      this.xpBar.style.filter = "brightness(1.9)";
      createXPPopup(" New Level: " + PLAYER_DATA.level + "!", PLAYER.position);

      // update spellbook
      SPELLBOOK.updateSpellItems();
      //show spell in cast bar
      //maybe show new spells available at a trainer, show spell picture

      setTimeout(() => {
        PLAYER_DATA.experience -= maxXP;
        this.updateXPBar(PLAYER_DATA.experience, this.calcMaxXP());
        this.xpBar.style.boxShadow = "rgba(0, 0, 0, 0.8) 0px 0px 10px";
        this.xpBar.style.filter = "brightness(1)";
      }, 1200);
    } else {
      createXPPopup(xp, PLAYER.position);
      // window.SCENE_MANAGER.activeScene.activeCamera.sound.play("Quickness", "sfx");
      this.updateXPBar(PLAYER_DATA.experience, this.calcMaxXP());
    }

    // this.xp += xp;
    // this.updateUI();
  }

  resetXP() {
    this.xpBarFill.style.transition = "none";
    this.xpBarFill.style.width = "0%";
    // Force reflow
    this.xpBarFill.offsetHeight;
    this.xpBarFill.style.transition = "width 0.5s ease-out";
  }

  showHealthBar() {
    const bar = this.healthBar;
    if (bar.style.display === "block") return;

    bar.style.transition = "none";
    bar.style.display = "block";
    bar.style.opacity = "0";

    bar.offsetHeight; // Force reflow

    bar.style.transition = "opacity 0.3s ease";
    requestAnimationFrame(() => {
      bar.style.opacity = "1";
    });
  }

  hideHealthBar() {
    // const bar = this.healthBar;
    // bar.style.opacity = "0";
    // setTimeout(() => {
    //   bar.style.display = "none";
    // }, 300);
  }

  updateHealthBar(currentHealth, maxHealth) {
    if (!this.healthBar) return;

    const percentage = (currentHealth / maxHealth) * 100;
    this.healthBarFill.style.width = `${percentage}%`;
    this.healthBarText.textContent = `${Math.floor(currentHealth)} / ${Math.floor(maxHealth)} HP`;

    // Visual feedback for low health
    if (percentage <= 20) {
      this.healthBar.style.filter = "brightness(1.3)";
      this.healthBar.style.boxShadow = "rgb(255 0 0 / 50%) 0px 0px 20px";
    } else {
      this.healthBar.style.filter = "brightness(1)";
      this.healthBar.style.boxShadow = "rgba(0, 0, 0, 0.8) 0px 0px 10px";
    }
  }
}

// export const skillBar = new SkillBar();
