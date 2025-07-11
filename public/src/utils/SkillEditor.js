import { addEnemyToMesh } from "/src/character/enemy.js";
import { Effect } from "/src/combat/effect.js";
import { SKILLS } from "/src/combat/skills/SkillData.js";
import { Spell } from "/src/combat/spell.js";
import { attachToBone, findAllMeshesByName, degreesToRadians } from "/src/character/equips/held.js";

export function createSkillEditor(containerId, scene) {
  // Initialize Vue component
  return Vue.createApp({
    template: `
    <div v-show="isVisible" id="skill-editor" class="skill-editor">
        <!-- <h2>Skill Editor</h2> -->
        
        <!-- Skill Phases -->
        <div class="skill-phases">
          <!-- Start Phase -->
    <!--  <div class="phase-section">
          <div class="phase-marker" :class="{ active: activePhases.includes('start') }"></div>
            <h3>Start Phase</h3>
            <div class="phase-options">
              <div class="dropdown-section">
                <label>Particle Effect</label>
                <SearchableDropdown 
                  :items="particlePresets"
                  v-model="startPhase.particle.preset"
                  placeholder="Select particle"
                />
                <div class="sub-options" v-if="startPhase.particle.preset">
                  <label>Attach Point</label>
                  <select v-model="startPhase.particle.attachPoint">
                    <option value="rightHand">Right Hand</option>
                    <option value="leftHand">Left Hand</option>
                    <option value="bothHands">Both Hands</option>
                    <option value="feet">Feet</option>
                    <option value="weapon">Weapon</option>
                  </select>
                </div>
              </div>
              <div class="dropdown-section">
                <label>Sound Effect</label>
                <SearchableDropdown 
                  :items="soundPresets"
                  v-model="startPhase.sound.preset"
                  placeholder="Select sound"
                />
                <div class="sub-options" v-if="startPhase.sound.preset">
                  <label>Volume: {{ startPhase.sound.volume }}%</label>
                  <input type="range" v-model="startPhase.sound.volume" min="0" max="100">
                </div>
              </div>
              <div class="dropdown-section">
                <label>Animation</label>
                <SearchableDropdown 
                  :items="animationPresets"
                  v-model="startPhase.animation.preset"
                  placeholder="Select animation"
                />
                <div class="sub-options" v-if="startPhase.animation.preset">
                    <div class="controls-row">
                        <div class="control-group">
                        <label>Delay: {{ startPhase.animation.delay }}s</label>
                        <input type="range" v-model="startPhase.animation.delay" min="0" max="5" step="0.1">
                        </div>
                        <div class="control-group">
                        <label>Length: {{ startPhase.animation.length }}s</label>
                        <input type="range" v-model="startPhase.animation.length" min="0.1" max="10" step="0.1">
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
-->
          <!-- Cast Phase -->
          
          <div class="phase-section">
          <div class="phase-marker" :class="{ active: activePhases.includes('cast') }"></div>
            <h3 title="The character visuals during the skill. You can change the character animation, casting sound, or particle effects on the character.">Cast Phase</h3>
            <div class="phase-options">
              <div class="dropdown-section">
                <label>Particle Effect</label>
                <SearchableDropdown 
                  :items="particlePresets"
                  v-model="castPhase.particle.preset"
                  placeholder="No cast particle"
                />
                <div class="sub-options" v-if="castPhase.particle.preset">
                  <label>Attach Point</label>
                  <select v-model="castPhase.particle.attachPoint">
                    <option value="rightHand">Right Hand</option>
                    <option value="leftHand">Left Hand</option>
                    <option value="bothHands">Both Hands</option>
                    <option value="feet">Feet</option>
                    <option value="weapon">Weapon</option>
                  </select>
                </div>
              </div>
              <div class="dropdown-section">
                <label>Sound Effect</label>
                <SearchableDropdown 
                  :items="soundPresets"
                  v-model="castPhase.sound.preset"
                  placeholder="Select cast sound"
                />
                <div class="sub-options" v-if="castPhase.sound.preset">
                  <label>Volume: {{ castPhase.sound.volume }}%</label>
                  <input type="range" v-model="castPhase.sound.volume" min="0" max="100">
                </div>
              </div>
              <div class="dropdown-section">
                <label>Animation</label>
                <SearchableDropdown 
                  :items="animationPresets"
                  v-model="castPhase.animation.preset"
                  placeholder="Select animation"
                />
                <div class="sub-options" v-if="castPhase.animation.preset">
                  <div class="controls-row">
                     <!-- <div class="control-group">
                      <label>Delay: {{ castPhase.animation.delay }}s</label>
                      <input type="range" v-model="castPhase.animation.delay" min="0" max="5" step="0.1">
                    </div>
                    <div class="control-group">
                      <label>Length: {{ castPhase.animation.length }}s</label>
                      <input type="range" v-model="castPhase.animation.length" min="0.1" max="10" step="0.1">
                    </div> -->

                     <!-- <div class="control-group">
                      <label>Cast Time: {{ castPhase.animation.castTime }}s</label>
                      <input type="range" v-model="castPhase.animation.castTime" min="0" max="5" step="0.1">
                    </div> -->
                    <div class="control-group">
                      <label>Speed: {{ castPhase.animation.speed }}x</label>
                      <input type="range" v-model="castPhase.animation.speed" min="0.1" max="3" step="0.1">
                    </div>
                  </div>
                </div>
              </div>
            </div> 
          </div>

        

          <!-- Finish Phase -->
        <!--  <div class="phase-section">
          <div class="phase-marker" :class="{ active: activePhases.includes('finish') }"></div>
            <h3>Finish Phase</h3>
            <div class="phase-options">
              <div class="dropdown-section">
                <label>Particle Effect</label>
                <SearchableDropdown 
                  :items="particlePresets"
                  v-model="finishPhase.particle.preset"
                  placeholder="Select finish particle"
                />
                <div class="sub-options" v-if="finishPhase.particle.preset">
                  <label>Attach Point</label>
                  <select v-model="finishPhase.particle.attachPoint">
                    <option value="rightHand">Right Hand</option>
                    <option value="leftHand">Left Hand</option>
                    <option value="bothHands">Both Hands</option>
                    <option value="feet">Feet</option>
                    <option value="weapon">Weapon</option>
                  </select>
                </div>
              </div>
              <div class="dropdown-section">
                <label>Sound Effect</label>
                <SearchableDropdown 
                  :items="soundPresets"
                  v-model="finishPhase.sound.preset"
                  placeholder="Select finish sound"
                />
                <div class="sub-options" v-if="finishPhase.sound.preset">
                  <label>Volume: {{ finishPhase.sound.volume }}%</label>
                  <input type="range" v-model="finishPhase.sound.volume" min="0" max="100">
                </div>
              </div>
              <div class="dropdown-section">
                <label>Animation</label>
                <SearchableDropdown 
                  :items="animationPresets"
                  v-model="finishPhase.animation.preset"
                  placeholder="Select animation"
                />
                <div class="sub-options" v-if="finishPhase.animation.preset">
                  <div class="controls-row">
                    <div class="control-group">
                      <label>Delay: {{ finishPhase.animation.delay }}s</label>
                      <input type="range" v-model="finishPhase.animation.delay" min="0" max="5" step="0.1">
                    </div>
                    <div class="control-group">
                      <label>Length: {{ finishPhase.animation.length }}s</label>
                      <input type="range" v-model="finishPhase.animation.length" min="0.1" max="10" step="0.1">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div> -->
        </div>

          <!-- Projectile/Effect Phase -->
          <div class="effect-phases">
          <div class="phase-section">
          <div class="phase-marker" :class="{ active: activePhases.includes('projectile') }"></div>
            <h3 title="You can add damage, burn, slow, etc to your skill. This happens at the end of the cast phase.">Effect Phase</h3>
                      <div class="dropdown-section">
                <label>Effect Type</label>
                <select v-model="projectilePhase.type">
                  <!-- <option value="projectile">Projectile</option> -->
                  <!-- <option value="cone">Cone</option> -->
                  <option value="singleTarget">Single Target</option>
                  <!-- <option value="areaOfEffect">Area Of Effect</option> -->
                </select>
              </div>

              <template v-if="projectilePhase.type === 'projectile' || projectilePhase.type === 'areaOfEffect'">
            <div class="phase-options">
    
              <div class="dropdown-section">
                <label>Particle Effect</label>
                <SearchableDropdown 
                  :items="particlePresets"
                  v-model="projectilePhase.particle.preset"
                  placeholder="Select effect particle"
                />
                <div class="sub-options" v-if="projectilePhase.particle.preset">
                  <label>Attach Point</label>
 <select v-model="projectilePhase.particle.attachPoint">
    <template v-if="projectilePhase.type === 'projectile'">
      <option value="projectile">Projectile</option>
    </template>
    <template v-else>
      <option value="targetFeet">Target Feet</option>
      <option value="targetHands">Target Hands</option>
      <option value="targetWeapon">Target Weapon</option>
    </template>
  </select>
                </div>
              </div>
              <div class="dropdown-section">
                <label>Start Sound</label>
                <SearchableDropdown 
                  :items="soundPresets"
                  v-model="projectilePhase.sound.preset"
                  placeholder="Select start sound"
                />
                <div class="sub-options" v-if="projectilePhase.sound.preset">
                  <label>Volume: {{ projectilePhase.sound.volume }}%</label>
                  <input type="range" v-model="projectilePhase.sound.volume" min="0" max="100">
                </div>
              </div>
              <div class="dropdown-section">
                <label>Animation</label>
                <SearchableDropdown 
                  :items="animationPresets"
                  v-model="projectilePhase.animation.preset"
                  placeholder="Select animation"
                />
                <div class="sub-options" v-if="projectilePhase.animation.preset">
                  <div class="controls-row">
                    <div class="control-group">
                      <label>Delay: {{ projectilePhase.animation.delay }}s</label>
                      <input type="range" v-model="projectilePhase.animation.delay" min="0" max="5" step="0.1">
                    </div>
                    <div class="control-group">
                      <label>Length: {{ projectilePhase.animation.length }}s</label>
                      <input type="range" v-model="projectilePhase.animation.length" min="0.1" max="10" step="0.1">
                    </div>
                  </div>
                </div>
              </div>
            </div>

  </template>
              <!-- Effects List -->
              <!-- Effects List styled like dropdown sections -->
              <div class="dropdown-section effects-list">
                <label>Effects</label>
                <div v-for="(e, idx) in projectilePhase.effectList" :key="idx" class="effect-item">
                  

                
                <div class="effect-item">
  <div class="effect-row">
    <SearchableDropdown
      :items="effectTypes"
      v-model="projectilePhase.effectList[idx].type"
      placeholder="Select effect"
    />
    <button class="remove-btn" @click="removeEffect(idx)">×</button>
  </div>
  <div class="inputs-row">
    <div class="sub-options">
      <label>Amount</label>
      <input type="number" v-model.number="e.magnitude" min="0" />
    </div>
    <template v-if="e.type === 'burn'">
      <div class="sub-options">
        <label title="Delay before the effect starts">Delay (s)</label>
        <input type="number" v-model.number="e.config.delay" min="0" step="0.01" />
      </div>
      <div class="sub-options">
        <label>Hit Time (s)</label>
        <input type="number" v-model.number="e.config.hitTime" min="0" step="0.1" />
      </div>
      <div class="sub-options">
        <label>Duration (s)</label>
        <input type="number" v-model.number="e.config.duration" min="0" step="0.1" />
      </div>
      <div class="sub-options">
        <label title="Sound when the effect hits a target">Hit Sound</label>
        <SearchableDropdown
          :items="soundPresets"
          v-model="e.config.sound"
          placeholder="Select hit sound"
        />
      </div>
      <div class="sub-options">
        <label>Hit VFX</label>
        <SearchableDropdown
          :items="particlePresets"
          v-model="e.config.hitVFX"
          placeholder="Select VFX"
        />
      </div>
    </template>
  </div>
</div>



                  
                </div>
                <button class="add-btn" @click="addEffect">+ Add Effect</button>
              </div>

          </div>
          </div>

        <!-- <div class="action-buttons">
        
          
         </div> -->


      </div>
              <div class="control-buttons">
          <button @click="togglePlay" class="play-btn" :class="{ playing: isPlaying }" :title="isPlaying ? 'Pause' : 'Play'">
            <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>

          <button @click="toggleLoop" class="loop-btn" :title="isLooping ? 'Disable Loop' : 'Enable Loop'">
            <svg v-if="isLooping" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
          </button>

          <button @click="toggleDummy" class="dummy-btn" :class="{ active: isDummyEnabled }" :title="isDummyEnabled ? 'Hide Target' : 'Show Target'">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
            </svg>
          </button>

          <button @click="toggleMute" class="mute-btn btn" :class="{ active: isMuted }" :title="isMuted ? 'Unmute' : 'Mute'">
    <svg v-if="!isMuted" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
    <svg v-else viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    </svg>
  </button>


  <div @click="toggleSpellbook" class="spellbook-btn" :title="'Toggle Spellbook'">
   <img class="spellbook-btn-image" src="/assets/textures/terrain/icons/SpellBook.png">
  </div> 
 <!-- <button @click="exportSkill" class="export-btn btn" :title="'Export Skill'">
    <svg v-if="!isMuted" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
    <svg v-else viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    </svg>
  </button> -->

        
          <div 
          title="Drag a skill here to loop and edit" class="skill-icon-box"
          @click="triggerSkillPreview" :class="{ active: isPlaying }"
            draggable="true"
  @dragstart="handleDragStart"
  @dragover.prevent
  @drop="handleDrop">


          <span class="keybind">1</span>
          <img :src="currentSkillIcon" alt="Skill Icon">
            <button class="add-skill-btn" @click.stop="addNewSkill" title="Add New Skill To Spellbook">+</button>
             <button class="edit-skill-btn" @click.stop="toggleEditPanel" title="Edit Skill Details">
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
  </button>


    <div class="skill-tooltip" v-if="currentSkillId">
        <div class="tooltip-header">{{ skillMeta.name }}</div>
        
        <div class="tooltip-cooldown">Cooldown: {{ skillMeta.cooldown / 1000 }}s</div>
        <div class="tooltip-description">{{ skillMeta.description }}</div>
    </div>
  


        </div>


          <!-- Edit Panel -->
  <div v-if="showEditPanel" class="edit-panel">
    <input v-model="skillMeta.name" placeholder="Skill Name">
      <div class="icon-scroll-container">
    <div class="icon-list">
      <div 
        v-for="icon in skillIcons" 
        :key="icon" 
        class="icon-item"
        :class="{ active: skillMeta.icon === icon }"
        @click="selectIcon(icon)"
      >
        <img :src="icon" :alt="icon">
      </div>
    </div>
  </div>
    <input v-model="skillMeta.cooldown" type="number" placeholder="Cooldown (ms)">
    <textarea v-model="skillMeta.description" placeholder="Description"></textarea>
    <button @click="saveSkillMeta">Save</button>
  </div>
        </div>
          `,

    data() {
      return {
        isVisible: true,
        dummy: null,
        startPhase: {
          particle: {
            preset: null,
            attachPoint: "rightHand", // leftHand, bothHands, feet, weapon
          },
          sound: {
            preset: null,
            volume: 100, // 0-100%
          },
          animation: {
            preset: null,
            delay: 0,
            length: 1,
          },
        },
        castPhase: {
          particle: {
            preset: null,
            attachPoint: "rightHand", // leftHand, bothHands, feet, weapon
          },
          sound: {
            preset: null,
            volume: 100, // 0-100%
          },
          animation: {
            preset: null,
            delay: 0,
            length: 1,
          },
        },
        projectilePhase: {
          type: "projectile",
          particle: {
            preset: null,
            attachPoint: "projectile", // leftHand, bothHands, feet, weapon
          },
          sound: {
            preset: null,
            volume: 100, // 0-100%
          },
          animation: {
            preset: null,
            delay: 0,
            length: 1,
          },
          effect: {
            shape: "ball",
            trail: "wavy",
            duration: 300,
            colors: { primaryHex: "#ff8000", secondaryHex: "#cc3300" },
          },
          effectList: [
            { type: "damage", magnitude: 20, config: {} },
            { type: "burn", magnitude: 5, config: { hitTime: 500, duration: 3 } },
          ],
        },
        finishPhase: {
          particle: {
            preset: null,
            attachPoint: "rightHand", // leftHand, bothHands, feet, weapon
          },
          sound: {
            preset: null,
            volume: 100, // 0-100%
          },
          animation: {
            preset: null,
            delay: 0,
            length: 1,
          },
        },
        effectTypes: [
          { name: "damage", value: "damage" },
          { name: "burn", value: "burn" },
          { name: "slow", value: "slow" },
        ],
        particlePresets: [{ name: "blueFire" }, { name: "Rain" }, { name: "ExplosionMinimalSword" }, { name: "bless_major" }],
        soundPresets: [], // Will be populated with sound presets
        animationPresets: [{ name: "BreathingIdle" }, { name: "SelfCast" }, { name: "Combo" }, { name: "Attack" }], // Will be populated with animation presets
        // Used to Display PreviewSkill
        currentAnimation: null,
        currentParticles: [],
        activePhases: [], //tracks current phase, can be multiple in parallel
        isLooping: true, //tracks if the skill is looping
        isPlaying: false,
        isDummyEnabled: false,
        isMuted: false,
        currentSkillIcon: "/assets/util/ui/icons/fireball.png",
        currentSkillId: null,
        showEditPanel: false,
        skillMeta: {
          name: "Custom Skill",
          icon: "/assets/util/ui/icons/fireball.png",
          description: "Custom skill description",
          cooldown: 5000,
        },
        skillIcons: ["/assets/util/ui/icons/skill_icons/Anchor_Symbol.png", "/assets/util/ui/icons/skill_icons/Burning_Weapon_Aura.png", "/assets/util/ui/icons/skill_icons/Demonic_Core_Skill.png", "/assets/util/ui/icons/skill_icons/Electric_Bolt_Skill.png", "/assets/util/ui/icons/skill_icons/Fiery_Explosion_Core.png", "/assets/util/ui/icons/skill_icons/Fire_Core_Energy.png", "/assets/util/ui/icons/skill_icons/Flame_Essence.png", "/assets/util/ui/icons/skill_icons/Ice_Shard_Skill.png", "/assets/util/ui/icons/skill_icons/Lightning_Wind_Surge.png", "/assets/util/ui/icons/skill_icons/Phoenix_Flame_Wheel.png", "/assets/util/ui/icons/skill_icons/Radiant_Sun_Burst.png", "/assets/util/ui/icons/skill_icons/Spinning_Circle_Fire.png", "/assets/util/ui/icons/skill_icons/Stone_Earth_Power.png", "/assets/util/ui/icons/skill_icons/Void_Magic_Orb.png", "/assets/util/ui/icons/skill_icons/Warrior_Crossed_Weapons.png", "/assets/util/ui/icons/skill_icons/Water_Ring_Force.png"],
      };
    },

    watch: {
      "projectilePhase.type"(newType) {
        // Update attachPoint when type changes to ensure it's valid
        if (newType === "projectile") {
          if (!["rightHand", "leftHand", "bothHands", "feet", "weapon", "projectile"].includes(this.projectilePhase.particle.attachPoint)) {
            this.projectilePhase.particle.attachPoint = "projectile";
          }
        } else {
          if (!["enemyFeet", "enemyHands", "weapon"].includes(this.projectilePhase.particle.attachPoint)) {
            this.projectilePhase.particle.attachPoint = "enemyFeet";
          }
        }
      },
      "projectilePhase.effectList": {
        deep: true, // Watch for nested changes
        handler(newEffectList) {
          console.log("Projectile Phase Effect List", newEffectList);
          if (!this.currentSkillId) return; // Only update if we have a current skill

          // Convert the effect list to Effect instances
          const effects = newEffectList.map((e) => {
            if (e.type.value === "burn") {
              return new Effect(e.type.value, e.magnitude, {
                delay: e.config.delay || 0,
                sound: e.config.sound?.name,
                hitTime: e.config.hitTime || 0.5,
                duration: e.config.duration || 3,
                hitVFX: e.config.hitVFX?.name,
              });
            } else if (e.type.value === "damage") {
              console.log("e", e);
              return new Effect(e.type.value, e.magnitude, {
                delay: e.config.delay || 0,
                sound: e.config.sound?.name,
                soundDelay: e.config.soundDelay,
                hitVFX: e.config.hitVFX?.name,
                screenShakeIntensity: e.config.screenShakeIntensity,
                screenShakeDuration: e.config.screenShakeDuration,
              });
            }
            // Default case for other effect types
            return new Effect(e.type.value, e.magnitude, e.config);
          });

          console.log("SKill Effect List", effects);
          // Update the skill data
          if (SKILLS[this.currentSkillId]) {
            SKILLS[this.currentSkillId].effects = effects;
          }
        },
      },
      "castPhase.animation.castTime": {
        handler(newCastTime) {
          if (!this.currentSkillId) return;

          // Update the skill's cast time
          if (SKILLS[this.currentSkillId]) {
            SKILLS[this.currentSkillId].castTime = newCastTime;
          }
        },
      },

      "castPhase.animation.speed": {
        handler(newSpeed) {
          if (!this.currentSkillId) return;

          // Update the skill's animation speed
          if (SKILLS[this.currentSkillId] && SKILLS[this.currentSkillId].animation) {
            console.log("newSpeed", newSpeed);

            SKILLS[this.currentSkillId].animation.speed = newSpeed;
          }
        },
      },
    },
    computed: {
      filteredPresets() {
        return this.search ? this.presets.filter((p) => p.name.toLowerCase().includes(this.search.toLowerCase())) : this.presets;
      },
    },

    methods: {
      show() {
        this.isVisible = true;
        setTimeout(() => {
          document.getElementById("skill-editor").classList.add("visible");
        }, 10);
      },

      hide() {
        this.isVisible = false;
        document.getElementById("skill-editor").classList.remove("visible");
        // Wait for animation to finish before hiding
        setTimeout(() => {
          this.isVisible = false;
        }, 300);
      },

      toggle() {
        this.isVisible = !this.isVisible;
      },

      toggleDummy() {
        if (!this.dummy) {
          this.dummy = BABYLON.MeshBuilder.CreateBox("dummy", { size: 4 }, scene);
          this.dummy.scaling.y = 4.1;
          this.dummy.scaling.x = 2.1;
          this.dummy.position.y = -4;
          this.dummy.position.x = -19;
          this.dummy.isPickable = false;
          this.dummy.setEnabled(false);
          // let enemy = setupEnemy(scene, PLAYER, this.dummy, HPBAR);
          this.dummy = addEnemyToMesh(this.dummy, 1000);

          PLAYER.target = this.dummy;
        }

        this.isDummyEnabled = !this.isDummyEnabled;
        this.dummy.setEnabled(this.isDummyEnabled);

        if (this.isDummyEnabled) {
          scene.activeCamera.preferredZoom = 100;
          scene.activeCamera.shouldPrefferedZoom = true;
          scene.activeCamera.shouldPreferredOffset = true;
          scene.activeCamera.preferredOffset = new BABYLON.Vector3(-15, 0, 0);
        } else {
          scene.activeCamera.preferredZoom = 30;
          scene.activeCamera.shouldPrefferedZoom = true;
          scene.activeCamera.shouldPreferredOffset = true;
          scene.activeCamera.preferredOffset = new BABYLON.Vector3(0, 0, 0);
        }
      },
      toggleMute() {
        this.isMuted = !this.isMuted;
        // Add your mute logic here, for example:
        if (this.isMuted) {
          scene.activeCamera.sound.setChannelVolume("sfx", 0);
        } else {
          scene.activeCamera.sound.setChannelVolume("sfx", 1);
        }
      },

      async previewSkill() {
        if (!this.isPlaying) return; // Stop if play is toggled off

        const playSkill = async () => {
          const phases = [
            { data: this.startPhase, name: "start" },
            { data: this.castPhase, name: "cast" },
            { data: this.finishPhase, name: "finish" },
          ];

          for (const phase of phases) {
            if (phase.name === "finish") {
              this.playPhase(this.projectilePhase, "projectile");
            }
            await this.playPhase(phase.data, phase.name);
          }

          // Reset active phases when done
          setTimeout(() => {
            // this.activePhases = [];
            if (this.isLooping && this.isPlaying) {
              this.clearSkillCycle();
              playSkill();
            } else {
              this.isPlaying = false; // Reset play state if not looping
              this.clearSkillCycle();
            }
          }, 1000);
        };

        playSkill();
      },

      toggleLoop() {
        this.isLooping = !this.isLooping;
      },

      clearSkillCycle() {
        // Clear active phases and particles at start of the skill cycle
        this.activePhases = [];
        for (let currentParticle of this.currentParticles) {
          currentParticle.dispose(true);
        }
        this.currentParticles = [];
        for (let key in scene.activeCamera.anim) {
          if (scene.activeCamera.anim.hasOwnProperty(key) && scene.activeCamera.anim[key].isPlaying) {
            if (key !== "BreathingIdle") scene.activeCamera.anim[key].stop();
          }
        }
        // Stop all sounds from sound presets
        if (this.soundPresets && this.soundPresets.length > 0) {
          for (let sound of this.soundPresets) {
            if (sound && sound.name) {
              scene.activeCamera.sound.stop(sound.name, "sfx");
            }
          }
        }
      },
      async playPhase(phase, phaseName) {
        // Set Phase Marker Duration
        const totalDuration = (phase.animation.delay + phase.animation.length) * 1000;
        const phaseTitle = phaseName.charAt(0).toUpperCase() + phaseName.slice(1) + " Phase";
        const phaseSection = Array.from(document.querySelectorAll(".phase-section")).find((section) => section.querySelector("h3").textContent === phaseTitle);
        const marker = phaseSection?.querySelector(".phase-marker");
        if (marker) {
          marker.style.setProperty("--phase-duration", `${totalDuration}ms`);
        }

        await new Promise((resolve) => setTimeout(resolve, phase.animation.delay * 1000));
        this.activePhases.push(phaseName);
        // console.log("Active Phases:", JSON.parse(JSON.stringify(this.activePhases)));

        if (phase.particle.preset) {
          await this.playParticleEffect(phase.particle.preset);
        }
        if (phase.sound.preset) {
          this.playSound(phase.sound.preset);
        }
        if (phase.animation.preset) {
          this.currentAnimation = phase.animation.preset;
          await this.playAnimation(phase.animation);
        }
        // await new Promise((resolve) => setTimeout(resolve, phase.animation.length * 1000));
        this.activePhases = this.activePhases.filter((p) => p !== phaseName);

        if (phaseName === "finish") {
          console.log("Projectile Phase:", this.curren);
          const spell = new Spell(
            "Custom Skill", // name
            SKILLS[this.currentSkillId].effects, // effects
            this.castPhase.animation.preset
              ? {
                  name: this.castPhase.animation.preset.name,
                  speed: 1.0,
                }
              : null, // animation
            this.projectilePhase.particle.preset?.name, // vfx
            200, // default range
            this.castPhase.animation.length, // castTime
            this.castPhase.sound.preset?.name, // castSound
            this.projectilePhase.sound.preset?.name // castSoundEnd
          );
          if (this.dummy && this.dummy.health) {
            spell.cast(PLAYER.health, this.dummy.health);
          }
        }
      },

      async playParticleEffect(effect) {
        const particleSet = await BABYLON.ParticleHelper.CreateAsync(effect.name, scene);
        this.currentParticles.push(particleSet);

        // Get the right hand bone if rightHand is selected as attach point
        if (this.castPhase.particle.attachPoint === "rightHand") {
          // const rightHand = scene.getMeshByName("mixamorig:RightHand");
          // TODO load all bones as global
          const rightHand = findAllMeshesByName(scene.meshes, "mixamorig:RightHand")[0];
          // const boxmesh = BABYLON.MeshBuilder.CreateBox("rightHandBox", { size: 0.2 }, scene);
          // boxmesh.isVisible = false;
          const emitterNodeRightHand = new BABYLON.TransformNode("particleEmitter", scene);
          emitterNodeRightHand.parent = rightHand;
          emitterNodeRightHand.position = new BABYLON.Vector3(0, 26, 10);
          emitterNodeRightHand.scaling = new BABYLON.Vector3(500, 500, 500);
          emitterNodeRightHand.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(degreesToRadians(0), degreesToRadians(100), degreesToRadians(180));

          if (rightHand) {
            let position = new BABYLON.Vector3(0, 26, 10);
            let scaling = new BABYLON.Vector3(500, 500, 500);
            let rotation = BABYLON.Quaternion.FromEulerAngles(
              degreesToRadians(0), // 0 degrees in radians
              degreesToRadians(100), // 100 degrees in radians
              degreesToRadians(180) // 180 degrees in radians
            );
            // attachToBone(boxmesh, rightHand, position, scaling, rotation);
            particleSet.systems.forEach((system) => {
              // system.parent = rightHand;
              // system.emitter = boxmesh;
              // system.emitter = rightHand;
              system.emitter = emitterNodeRightHand;

              // 2. Set local space to true so particles are relative to the emitter
              system.isLocal = true;

              // 3. Optionally adjust the emission box relative to the emitter
              system.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
              system.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
            });
          }
        }

        particleSet.start();

        return new Promise((resolve) => setTimeout(resolve, 1000)); // Adjust timing as needed
      },

      playSound(sound) {
        scene.activeCamera.sound.play(sound.name, "sfx");
      },

      async playAnimation(animation) {
        return new Promise((resolve) => {
          console.log("Playing animation:", animation.length);
          //   console.log(`Playing animation: ${animation.name}`);
          if (animation) {
            switch (animation.name) {
              //   case "Self Cast":
              //     scene.activeCamera.anim.SelfCast.play(true);
              //     break;
              default:
                scene.activeCamera.anim[animation.preset.name].play(true);
                break;
            }
            setTimeout(resolve, animation.length * 1000); // Adjust timing as needed
          }
        });
      },

      async applyPreset(preset) {
        this.currentPreset = preset.name;
        if (this.currentSet) {
          this.currentSet.dispose(true);
        }
        BABYLON.ParticleHelper.CreateAsync(preset.name, scene).then((set) => {
          this.currentSet = set;
          set.start();
        });
      },

      rebuild() {
        if (this.currentSet) {
          this.currentSet.dispose(true);
        }
        BABYLON.ParticleHelper.CreateAsync(this.currentPreset, scene).then((set) => {
          this.currentSet = set;
          set.start();
        });
      },
      addEffect() {
        const newEffect = {
          type: "damage", // Default to damage type
          magnitude: 5,
          config: {},
        };

        this.projectilePhase.effectList.push(newEffect);
      },
      removeEffect(idx) {
        this.projectilePhase.effectList.splice(idx, 1);
      },
      toggleSpellbook() {
        SPELLBOOK.toggleSpellbook();
      },
      // exportSkill() {
      //   // Implement skill export logic
      //   const skillData = {
      //     start: this.startPhase,
      //     cast: this.castPhase,
      //     projectile: this.projectilePhase,
      //     finish: this.finishPhase,
      //   };
      //   console.log("Exporting skill:", skillData);
      // },
      // async exportSkill() {
      //   const skillData = {
      //     projectile: {
      //       type: this.projectilePhase.type,
      //       particle: this.projectilePhase.particle,
      //       sound: this.projectilePhase.sound,
      //       animation: this.projectilePhase.animation,
      //       vfx: {
      //         type: this.projectilePhase.particle.preset?.name,
      //         shape: this.projectilePhase.effect.shape,
      //         trail: this.projectilePhase.effect.trail,
      //         duration: this.projectilePhase.effect.duration,
      //         colors: {
      //           primary: this.hexToColor4(this.projectilePhase.effect.colors.primaryHex),
      //           secondary: this.hexToColor4(this.projectilePhase.effect.colors.secondaryHex),
      //         },
      //       },
      //       effects: this.projectilePhase.effectList.map((e) => {
      //         return e.type === "burn" ? new Effect(e.type, e.magnitude, { hitTime: e.config.hitTime, duration: e.config.duration }) : new Effect(e.type, e.magnitude);
      //       }),
      //     },
      //   };

      //   const skillJson = JSON.stringify(skillData, null, 2);
      //   console.log("Exporting skill with effects:", skillData);

      //   try {
      //     await navigator.clipboard.writeText(skillJson);
      //     console.log("Skill JSON copied to clipboard");
      //   } catch (err) {
      //     console.error("Failed to copy skill JSON:", err);
      //   }
      // },

      hexToColor4(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        const r = ((bigint >> 16) & 255) / 255;
        const g = ((bigint >> 8) & 255) / 255;
        const b = (bigint & 255) / 255;
        return new BABYLON.Color4(r, g, b, 1.0);
      },

      async exportSkill() {
        const skillData = {
          id: "customSkill", // Could be made configurable
          name: "Custom Skill", // Could be made configurable
          icon: "/assets/util/ui/icons/skill_icons/Flame_Essence.png", // Could be made configurable
          description: "Custom skill description", // Could be made configurable
          animation: {
            name: this.castPhase.animation.preset?.name || "SelfCast",
            speed: 2.4, // Could be made configurable
          },
          vfx: this.projectilePhase.particle.preset?.name || null,

          cooldown: 5000, // Could be made configurable
          range: 200, // Could be made configurable
          cost: [{ type: "stamina", value: 10 }], // Could be made configurable
          target: "enemy",
          type: this.projectilePhase.type === "projectile" ? "Projectile" : "Single Target",
          effects: this.projectilePhase.effectList.map((e) => {
            if (e.type === "burn") {
              return new Effect(e.type, e.damage, {
                delay: e.config.delay,
                sound: e.config.sound?.name,
                hitTime: e.config.hitTime,
                duration: e.config.duration,
                hitVFX: e.config.hitVFX?.name,
              });
            }
            return new Effect(e.type, e.damage);
          }),
        };

        const skillJson = JSON.stringify(skillData, null, 2);
        console.log("Exporting skill:", skillData);

        try {
          await navigator.clipboard.writeText(skillJson);
          console.log("Skill JSON copied to clipboard");
        } catch (err) {
          console.error("Failed to copy skill JSON:", err);
        }
      },

      togglePlay() {
        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
          this.previewSkill();
        } else {
          this.clearSkillCycle();
        }
      },
      clearSkillCycle() {
        // Clear active phases and particles at start of the skill cycle
        this.activePhases = [];
        for (let currentParticle of this.currentParticles) {
          currentParticle.dispose(true);
        }
        this.currentParticles = [];
        for (let key in scene.activeCamera.anim) {
          if (scene.activeCamera.anim.hasOwnProperty(key) && scene.activeCamera.anim[key].isPlaying) {
            if (key !== "BreathingIdle") scene.activeCamera.anim[key].stop();
          }
        }
        // Play BreathingIdle animation when not playing skill
        if (!this.isPlaying) {
          scene.activeCamera.anim["BreathingIdle"].play(true);
        }
        // Stop all sounds from sound presets
        if (this.soundPresets && this.soundPresets.length > 0) {
          for (let sound of this.soundPresets) {
            if (sound && sound.name) {
              scene.activeCamera.sound.stop(sound.name, "sfx");
            }
          }
        }
      },

      triggerSkillPreview() {
        // Disable looping
        this.isLooping = false;

        // If already playing, stop current animation
        if (this.isPlaying) {
          this.clearSkillCycle();
          this.isPlaying = false;
        }

        // Start new preview
        this.isPlaying = true;
        this.previewSkill();
      },
      setupKeyListener() {
        this.keyListener = (event) => {
          if (event.key === "1") {
            // this.triggerSkillPreview();
          }
          if (event.key === "1" || event.key === "2" || event.key === "3") {
            this.dummy.position.x = -19;
          }
          if (event.key === "4") {
            this.dummy.position.x = -40;
          }
        };
        window.addEventListener("keydown", this.keyListener);
      },

      // loadSkill(skillId) {
      //   const skill = SKILLS[skillId];
      //   if (!skill) {
      //     console.error(`Skill ${skillId} not found`);
      //     return;
      //   }

      //   // Extract VFX data for easier access
      //   const vfx = skill.vfx?.playerVFX || {};

      //   // Map skill data to editor phases
      //   const phases = {
      //     cast: {
      //       particle: {
      //         preset: vfx.type ? { name: vfx.type } : null,
      //         attachPoint: "rightHand",
      //       },
      //       sound: {
      //         preset: skill.castSound ? { name: skill.castSound } : null,
      //         volume: 100,
      //       },
      //       animation: {
      //         preset: skill.animation ? { name: skill.animation.name } : null,
      //         delay: 0,
      //         length: skill.castTime || 1,
      //       },
      //     },
      //     projectile: {
      //       type: vfx.type || "projectile",
      //       particle: {
      //         preset: vfx.type ? { name: vfx.type } : null,
      //         attachPoint: "projectile",
      //       },
      //       sound: {
      //         preset: skill.castSoundEnd ? { name: skill.castSoundEnd } : null,
      //         volume: 100,
      //       },
      //       animation: { preset: null, delay: 0, length: 1 },
      //       effect: {
      //         shape: vfx.shape || "ball",
      //         trail: vfx.trail || "wavy",
      //         duration: vfx.duration || 300,
      //         colors: {
      //           primaryHex: this.color4ToHex(vfx.colors?.primary) || "#ff8000",
      //           secondaryHex: this.color4ToHex(vfx.colors?.secondary) || "#cc3300",
      //         },
      //       },
      //       effectList: skill.effects.map(({ type, magnitude, config = {} }) => ({
      //         type,
      //         magnitude,
      //         config,
      //       })),
      //     },
      //   };

      //   // Update editor state
      //   this.castPhase = phases.cast;
      //   this.projectilePhase = phases.projectile;

      //   console.log("Loaded skill:", skill);
      // },

      loadSkill(skillId) {
        const skill = SKILLS[skillId];
        if (!skill) {
          console.error(`Skill ${skillId} not found`);
          return;
        }

        // Extract VFX data for easier access
        const vfx = skill.vfx?.playerVFX || {};

        this.skillMeta.name = skill.name;
        this.skillMeta.icon = skill.icon;
        this.skillMeta.description = skill.description;
        this.skillMeta.cooldown = skill.cooldown;

        // Map skill data to editor phases
        const phases = {
          cast: {
            particle: {
              preset: vfx.type ? { name: vfx.type } : null,
              attachPoint: "rightHand",
            },
            sound: {
              preset: skill.castSound ? { name: skill.castSound } : null,
              volume: 100,
            },
            animation: {
              preset: skill.animation ? { name: skill.animation.name } : null,
              delay: 0,
              length: skill.castTime || 1,
              speed: skill.animation.speed,
              castTime: skill.castTime,
            },
          },
          projectile: {
            // Set type based on skill.type, defaulting to "singleTarget"
            type: (skill.type === "Single Target" ? "singleTarget" : skill.type?.toLowerCase()) || "singleTarget",
            particle: {
              preset: skill.vfx ? { name: skill.vfx } : null,
              attachPoint: "projectile",
            },
            sound: {
              preset: skill.castSoundEnd ? { name: skill.castSoundEnd } : null,
              volume: 100,
            },
            animation: { preset: null, delay: 0, length: 1 },
            effect: {
              shape: vfx.shape || "ball",
              trail: vfx.trail || "wavy",
              duration: vfx.duration || 300,
              colors: {
                primaryHex: this.color4ToHex(vfx.colors?.primary) || "#ff8000",
                secondaryHex: this.color4ToHex(vfx.colors?.secondary) || "#cc3300",
              },
            },
            effectList: skill.effects.map((effect) => ({
              type: { name: "damage", value: "damage" },
              magnitude: effect.value,
              config: {
                delay: effect.delay || 0,
                hitTime: effect.hitTime || 0,
                duration: effect.duration || 0,
                sound: effect.sound ? { name: effect.sound } : null,
                hitVFX: effect.hitVFX ? { name: effect.hitVFX } : null,
              },
            })),
          },
        };
        skill.effects.map((effect) => {
          console.log("Effect:", effect);
        });
        console.log("Phases:", phases);

        // Update editor state
        this.castPhase = phases.cast;
        this.projectilePhase = phases.projectile;

        this.currentSkillId = skill.id;
        this.currentSkillIcon = skill.icon;

        console.log("Loaded skill:", skill);
      },

      color4ToHex(color4) {
        if (!color4) return null;
        const toHex = (n) =>
          Math.round(n * 255)
            .toString(16)
            .padStart(2, "0");
        return `#${toHex(color4.r)}${toHex(color4.g)}${toHex(color4.b)}`;
      },

      async addSkillToSkillData() {
        let newId = this.skillMeta.name.replace(/ /g, "_") + "_" + Date.now();

        const skillData = {
          // Generate a unique ID for the new skill
          id: newId,
          name: this.skillMeta.name,
          icon: this.skillMeta.icon, // Use current icon
          description: this.skillMeta.description,
          animation: {
            name: this.castPhase.animation.preset?.name || "SelfCast",
            speed: 2.4,
          },
          vfx: this.projectilePhase.particle.preset?.name || null,
          cooldown: this.skillMeta.cooldown,
          range: 200,
          cost: [{ type: "stamina", value: 10 }],
          target: "enemy",
          type: this.projectilePhase.type === "projectile" ? "Projectile" : "Single Target",
          effects: this.projectilePhase.effectList.map((e) => {
            if (e.type === "burn") {
              return new Effect(e.type.value, e.magnitude, {
                delay: e.config.delay,
                sound: e.config.sound?.name,
                hitTime: e.config.hitTime,
                duration: e.config.duration,
                hitVFX: e.config.hitVFX?.name,
              });
            }
            return new Effect(e.type.value, e.magnitude);
          }),
        };

        // Add the new skill to SKILLS
        SKILLS[newId] = skillData;
        SPELLBOOK.updateSpellItems();

        return skillData;
      },

      handleDragStart(e) {
        // Create new skill from current settings
        // const skillData = this.addSkillToSkillData();

        // Set the new skill ID as drag data
        e.dataTransfer.setData("text/plain", skillData.id);

        // Optional: Create a drag image
        // const img = e.target.querySelector("img");
        // if (img) {
        //   e.dataTransfer.setDragImage(img, 25, 25);
        // }
      },

      handleDrop(e) {
        e.preventDefault();
        const skillId = e.dataTransfer.getData("text/plain");
        const skill = SKILL_BAR.slots.get(Number(skillId));

        if (skill) {
          this.loadSkill(skill.skill.id);
          this.currentSkillId = skill.skill.id;
          this.currentSkillIcon = SKILLS[skill.skill.id].icon;

          const skillIconBox = e.target.closest(".skill-icon-box");
          if (skillIconBox) {
            const skillImg = skillIconBox.querySelector("img");
            if (skillImg) {
              skillImg.setAttribute("data-spell-id", skill.skill.id);
            }
          }
        }
      },
      addNewSkill(e) {
        e.preventDefault(); // Prevent event bubbling
        // Create new skill from current settings
        const skillData = this.addSkillToSkillData();
        SPELLBOOK.openSpellbook();
        // this.currentSkillId = skillData.id;
        // this.currentSkillIcon = skillData.icon;
        this.updateSKILLS();
      },
      updateSKILLS() {
        window.parent.postMessage(
          {
            type: "UPDATE_ALL_SKILLS",
            skills: SKILLS,
          },
          "*"
        );
      },
      toggleEditPanel(e) {
        e.stopPropagation();
        this.showEditPanel = !this.showEditPanel;
      },

      saveSkillMeta() {
        if (this.currentSkillId) {
          SKILLS[this.currentSkillId] = {
            ...SKILLS[this.currentSkillId],
            ...this.skillMeta,
          };
          this.currentSkillIcon = this.skillMeta.icon;
          this.showEditPanel = false;

          SKILL_BAR.updateUI();
          SPELLBOOK.updateSpellItems();
          this.updateSKILLS();
        }
      },

      selectIcon(icon) {
        this.skillMeta.icon = icon;
        this.currentSkillIcon = icon;
      },

      addStyles() {
        const style = document.createElement("style");
        style.innerHTML = `
        #skill-editor {position: absolute; top: 0; 
 opacity: 0;

        // height: 100%;
        height: 84%;
  overflow: scroll;
  font-family: Verdana, sans-serif;
  font-weight: 300;
//   background:
// rgba(26, 26, 26, 0.95);
  padding:
20px;
  border-radius:
8px;
          padding: 20px;
//   border-radius: 8px;
//   box-shadow: 0 2px 4px rgba(0,0,0,0.1);
//   background:rgb(26, 0, 31);
    transform: translateY(10%); 
 transition: opacity 0.9s ease-out; 
}

#skill-editor.visible {
    transform: translateY(0); /* Slide in when visible */
    opacity: 1;
  }



.phase-section {
  position: relative;
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
}

.phase-marker {
  position: absolute;
  right: -20px;
//   top: 50%;
  top: 100%;
  bottom: 0;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #4CAF50;
  transition: opacity 0.3s ease;
  opacity: 0;
}

.phase-marker.active {
  opacity: 1;
  box-shadow: 0 0 10px #4CAF50;
    animation: moveDown var(--phase-duration) linear forwards;
}
    

.phase-marker::after {
//   content: '';
//   position: absolute;
//   left: 50%;
//   top: 100%;
//   height: 20px;
//   width: 2px;
//   background: #4CAF50;
//   transform: translateX(-50%);
}


@keyframes moveDown {
  0% {
    top: 0;
    opacity: 0;
  }
      5% {
    opacity: 1;
  }
  99% { // Start fading near the end
    opacity: 1;
  }
  100% {
    top: calc(100% - 12px);
    opacity: 0;
  }
  }
  

  @keyframes heightDown {
  0% {
    height: 0;
    opacity: 0;
  }
      5% {
    opacity: 1;
  }
    
  99% { // Start fading near the end
    opacity: 1;
  }
  100% {
    height: calc(100% - 12px);
    opacity: 0;
  }
  }
  

label {
color: #b3b3b3;
}
.phase-section h3 {
  margin: 0 0 10px 0;
  color: #b3b3b3;
//   color: #ffd100;
}

.phase-options {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;  
  gap: 35px;
  margin-right: 20px;
}

.dropdown-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.searchable-dropdown {
  position: relative;
  max-width: 120px;
}

.searchable-dropdown input {
  width: 100%;
  padding: 8px;
          border: 1px solid #4a4a4a;

  border-radius: 4px;
  background: rgb(0, 0, 0);
  color: #fff;
          border-radius: 4px;
}
                .dropdown-section select {
        width: 90%;
        padding: 8px;
        background: rgb(0, 0, 0);
        border-radius: 4px;
        color: white;
        border: 1px solid #4a4a4a;
      }


.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgb(0, 0, 0);
border: 1px solid #404040;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-item {
  padding: 8px;
  cursor: pointer;
  background: rgb(0, 0, 0);
  color: #fff;
  font-size: 12px;
  font-weight: 300;
  margin: 4px;
}

.dropdown-item:hover {
  background:rgb(70, 70, 70);
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.preview-btn, .export-btn {
  padding: 10px 20px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.preview-btn {
  background: #4CAF50;
  color: white;
}

.export-btn {
  background: #2196F3;
  color: white;
}

.spellbook-btn {
  transition: opacity 0.5s, transform 0.5s, filter 0.2s;
  
}

.spellbook-btn-image {
    width: 79px;
       height: 112px;
    position: absolute;
 top: -17px;
filter: brightness(1.4);
  background: url("/assets/textures/terrain/icons/SpellBook.png") -2px 0px / 84px 121px rgba(0, 0, 0, 0);

}

  .spellbook-btn:hover {
  cursor: pointer !important;
   filter: brightness(1.7);
  }
  
.loop-btn {
    bottom: 20px;
    padding: 10px;
    border-radius: 50%;
    border: none;
    cursor: pointer;

    color: white;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loop-btn:hover {
    background: #444;
  }

  .loop-btn svg {
    width: 20px;
    height: 20px;
  }

  .control-buttons {
    position: fixed;
    bottom: 20px;
    left: 20px;
    display: flex;
    gap: 10px;
    z-index: 1000;
  }

  .play-btn, .loop-btn {
    padding: 10px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    background: #3737377d;
    color: white;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .play-btn:hover, .loop-btn:hover {
 background: #090909cc;
  }

  .play-btn svg, .loop-btn svg {
    width: 20px;
    height: 20px;
  }

  .play-btn.playing {
    background: #4CAF50;
  }

  .dummy-btn {
    padding: 10px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    background: #3737377d;
    color: white;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .dummy-btn:hover {
    background: #090909cc;
  }

  .dummy-btn.active {
    background: #2196F3;
  }

  .dummy-btn svg {
    width: 20px;
    height: 20px;
  }

  // Add to the CSS section
.mute-btn {
  padding: 10px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: #3737377d;
  color: white;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.mute-btn:hover {
  background: #090909cc;
}

.mute-btn.active {
  background: #2196F3;
}

.mute-btn svg {
  width: 20px;
  height: 20px;
}
.btn {

border-radius:
50%;
  border:
none;
  cursor: pointer;
  background:
#3737377d;
}
.controls-row {
  display: flex;
  gap: 20px;
}

.control-group {
  flex: 1;
}

.control-group label {
  display: block;
  font-size: 12px !important;
//   margin-bottom: 5px;
margin-top: 5px;
}

.control-group input[type="range"] {
  width: 100%;
}
        

.skill-icon-box {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 100px;
    height: 100px;
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid #4a4a4a;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .skill-icon-box:hover {
    border-color: #666;
    transform: scale(1.05);
  }

  .skill-icon-box.active {
    border-color: #4CAF50;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
  }

  .skill-icon-box img {
    width: 80%;
    height: 80%;
    object-fit: contain;
  }

  .skill-icon-box .keybind {
    position: absolute;
    top: 3px;
    right: 3px;
    // background: #2196F3;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
  }

  .effects-list .effect-item {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
  align-items: flex-start;
}

.effects-list .searchable-dropdown {
  flex: 1;
  min-width: 150px;
}

.effects-list .sub-options {
  display: block;
  gap: 10px;
  flex: 1;
}

.remove-btn {
margin-left: 10px;
  background:rgb(0, 0, 0);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  padding: 0;
  color: white;
  cursor: pointer;
}

.sub-options input {
  color: white;
  background: rgb(0, 0, 0);
  width: 60px;
  border: 1px solid #4a4a4a;
}

.effect-row {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
}

.inputs-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 10px;
  width: 100%;
  margin-top: -10px;
  margin-left: 10px;
}

.sub-options {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-right: 10px;
}

.sub-options label {
  font-size: 12px;
  color: #b3b3b3;
}

.sub-options input[type="number"] {
  width: 100%;
  padding: 4px;
  background: rgb(0, 0, 0);
  border: 1px solid #4a4a4a;
  border-radius: 4px;
  color: white;
}
.add-skill-btn {
  position: absolute;
  bottom: -5px;
  left: -78px;
  width: 30px;
  height: 30px;
      background: rgb(255 180 47);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.add-skill-btn:hover {
  transform: scale(1.1);
  background::rgb(255, 211, 34);

}
  .edit-skill-btn {
  position: absolute;
  bottom: -5px;
  left: -38px;
  width: 30px;
  height: 30px;
  background: #2196F3;
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.edit-skill-btn:hover {
  transform: scale(1.1);
}

.edit-panel {
  position: fixed;
     bottom: 137px;
    right: 20px;
  width: 200px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #4a4a4a;
  border-radius: 6px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-panel input,
.edit-panel textarea {
  background: rgb(0, 0, 0);
  border: 1px solid #4a4a4a;
  color: white;
  padding: 6px;
  border-radius: 4px;
}

.edit-panel textarea {
  height: 60px;
  resize: none;
}

.edit-panel button {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
}
  .icon-scroll-container {
  width: 100%;
  overflow-x: auto;
  margin: 10px 0;
  padding: 5px 0;
}

.icon-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.icon-scroll-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.icon-scroll-container::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}

.icon-list {
  display: flex;
  gap: 10px;
  padding: 0 5px;
  min-width: max-content;
}

.icon-item {
  width: 40px;
  height: 40px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 2px;
}

.icon-item:hover {
  border-color: #666;
  transform: scale(1.1);
}

.icon-item.active {
  border-color: #4CAF50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
}

.icon-item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.skill-icon-box {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 100px;
    height: 100px;
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid #4a4a4a;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}
.skill-icon-box .skill-tooltip {
    display: none;
    position: absolute;
    // bottom: 120%;
    right: -20px !important;
    transform: translateX(-82%) !important;
    width: 250px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #666;
    border-radius: 4px;
    color: #fff;
    font-family: Verdana, sans-serif;
    z-index: 1000;
    pointer-events: none;
    box-shadow: 0px 0px 50px 20px rgba(0, 0, 0, 0.25);
    margin-bottom: 15px;
}

.skill-icon-box:hover .skill-tooltip {
    display: block;
}

.skill-tooltip .tooltip-header {
    color: #fff;
    font-size: 16px;
    margin-bottom: 4px;
    letter-spacing: 0.04em;
}

.skill-tooltip .tooltip-cost {
    color: #2196f3;
    font-size: 12px;
    margin-bottom: 4px;
}

.skill-tooltip .tooltip-cost .stamina-cost {
    color: #ffd700;
}

.skill-tooltip .tooltip-cooldown {
    color: #888;
    font-size: 12px;
    margin-bottom: 4px;
}

.skill-tooltip .tooltip-description {
    color: #ffd;
    font-size: 12px;
    line-height: 1.4;
}
    label {
    color: #ffc861;
  text-shadow:
        0 0 2px rgba(0,0,0,0.9);
    }
        .sub-options label {
            color: #ffdfa2;
            text-shadow:
        0 0 2px rgba(0,0,0,0.9);
            }

            .sub-options input[type="number"] {
                color: #ffdfa2;
                  background-color: #030304;
                      border: 1px solid #1c1412;
  background-image: 
    linear-gradient(
      180deg,
      rgba(255,255,255,0.03) 0%,
      rgba(0,0,0,0.05) 100%
    );
      box-shadow:
    /* very faint top highlight */
    inset 0 2px 4px rgba(255,255,255,0.08),
    /* deep inner shadow at bottom */
    inset 0 -4px 6px rgba(0,0,0,0.7),
    /* soft outer drop-shadow */
    0 2px 6px rgba(0,0,0,0.8);
  
            } 

    .dropdown-list select {
      background-color: #030304;
      color: #ffdfa2;
      border: 1px solid #1c1412;
          /*background-color: #030304;*/
                      border: 1px solid #1c1412;
/*  background-image: 
    linear-gradient(
      180deg,
      rgba(255,255,255,0.03) 0%,
      rgba(0,0,0,0.05) 100%
    );
      box-shadow:
    inset 0 2px 4px rgba(255,255,255,0.08),
    inset 0 -4px 6px rgba(0,0,0,0.7),
    0 2px 6px rgba(0,0,0,0.8); */
  
    }
    .dropdown-item {
      background-color: #030304;
      color: #ffdfa2;
      /*border: 1px solid #1c1412; */
    }
      .dropdown-section select {
        background-color: #030304;
      color: #ffdfa2;
      border: 1px solid #1c1412;
      }

    .sub-options input { 
    width: 85px;}

        .phase-section h3 {
            color: #e0b057;
            text-shadow:
        0 0 2px rgba(0,0,0,0.9);
            }
.searchable-dropdown input {
    border: 1px solid #2d1f0b;   
        color: #f3e7b6;
        // background: #2d1f0b;
}


        `;
        document.head.appendChild(style);
      },
    },
    components: {
      SearchableDropdown: {
        props: ["items", "modelValue", "placeholder"],
        template: `
            <div class="searchable-dropdown">
              <input 
                type="text" 
                v-model="search" 
                :placeholder="placeholder"
                @focus="handleFocus"
                 @blur="handleBlur"
                @keydown.stop
                @keyup.stop
                @keypress.stop
              />
              <div v-show="showDropdown" class="dropdown-list">
                <div 
                  class="dropdown-item"
                  @click="selectItem(null)"
                >
                  None
                </div>
                <div 
                  v-for="item in displayedItems" 
                  :key="item.id" 
                  @click="selectItem(item)"
                  class="dropdown-item"
                >
                  {{ item.name }}
                </div>
              </div>
            </div>
          `,
        data() {
          return {
            search: "",
            showDropdown: false,
            isTyping: false,
          };
        },
        computed: {
          displayedItems() {
            if (!this.isTyping) {
              return this.items;
            }
            if (this.search.toLowerCase() === "none") {
              return this.items;
            }
            return this.items.filter((item) => item.name.toLowerCase().includes(this.search.toLowerCase()));
          },
        },
        methods: {
          handleFocus() {
            this.showDropdown = true;
            this.isTyping = false;
          },
          handleBlur() {
            setTimeout(() => {
              this.showDropdown = false;
            }, 200);
          },
          selectItem(item) {
            this.$emit("update:modelValue", item);
            this.search = item ? item.name : "None";
            this.showDropdown = false;
            this.isTyping = false;
          },
        },
        watch: {
          modelValue: {
            immediate: true, // This makes it run on component creation
            handler(newVal) {
              this.search = newVal ? newVal.name : "";
            },
          },
          search() {
            this.isTyping = true;
          },
        },
      },
    },

    mounted() {
      BABYLON.ParticleHelper.BaseAssetsUrl = "/assets/util/particles";
      this.addStyles();
      // this.togglePlay();
      //   this.previewSkill();
      this.setupKeyListener();
      this.toggleDummy();

      // Load First fireball skill
      this.loadSkill("customSkill");
    },
    beforeUnmount() {
      // Clean up event listener
      if (this.keyListener) {
        window.removeEventListener("keydown", this.keyListener);
      }
    },
  });
}
