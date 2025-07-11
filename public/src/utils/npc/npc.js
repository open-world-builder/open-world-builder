// Link quests to NPC givers
// Usage: quest.giverId = npc.id

// ===== npcs.js =====
import { showSubtitle } from "../dialog/subtitle.js";
import { QuestManager } from "./quests.js";
import { Spell } from "../../combat/spell.js";
import { SPELLS } from "../../combat/SPELLS.js";
import { SKILLS } from "../../combat/skills/SkillData.js";
import { NPC_DATA } from "./NPCData.js";
import { CUSTOM_NPC_CONFIGS } from "./CustomNPCData.js";

export class NPC {
  constructor(id, configId, scene, health) {
    // Get base NPC type data
    const baseType = configId.split("_")[0]; // e.g. "guard" from "elite_guard_captain"
    const baseData = NPC_DATA[baseType];
    // Get custom config if it exists
    const customConfig = CUSTOM_NPC_CONFIGS[configId];
    const config = {
      ...baseData,
      ...customConfig,
    };

    console.log("config", config);
    console.log("config", config.combatLines);

    this.id = id;
    this.name = config.name;
    this.talkLine = "Hmmm...";
    this.lines = ["Helloooo!! I see yooooouuu!!", "Hey! 👀 Watching you!", "Hello! Over here, idiot!"];
    this.followerLines = ["Where are we going?", "Do you have any idea where we're going?", "I'm not sure I can keep up with you, but I will try."];
    this.lineCd = 6.0;
    this.conversationTopics = [
      {
        topic: "About Yourself",
        response: "I've lived in this area for quite some time now. I know quite a bit about the local history.",
      },
      {
        topic: "The Weather",
        response: "Beautiful day, isn't it? Perfect for an adventure!",
      },
      {
        topic: "Local Rumors",
        response: "I've heard whispers of strange happenings in the forest lately...",
      },
    ];

    this.routine = [];
    this.currentRoutineIndex = 0;
    this.routineTimer = 0;
    this.isFollowingRoutine = false;
    this.routineVisuals = {
      spheres: [],
      lines: [],
      isVisible: false,
    };
    //todo move to global material
    this.waypointMaterial = new BABYLON.StandardMaterial("waypointMaterial", this.scene);
    this.waypointMaterial.emissiveColor = new BABYLON.Color3(0, 1, 0);
    this.waypointMaterial.alpha = 0.5;

    // Create material for lines
    this.lineMaterial = new BABYLON.StandardMaterial("lineMaterial", this.scene);
    this.lineMaterial.emissiveColor = new BABYLON.Color3(0, 0.7, 0);
    this.lineMaterial.alpha = 0.3;

    this.greetingName = "NPC";
    this.randomGreetingsTiming = [
      { offset: 0, length: 1 },
      { offset: 2, length: 1 },
      { offset: 4, length: 1 },
      { offset: 6, length: 1 },
    ];

    //make this into voice lines object
    this.greeting = "NPC Hey";
    this.response = "NPC Hmm";
    this.enterConversation = "NPC Hows";
    this.exitConversation = "NPC Keep Moving";
    this.exitConversationLine = "Keep moving";
    this.exitConversationFamilar = "Keep moving, buddy";

    this.scene = scene;

    this.home = new BABYLON.Vector3(0, 0, 0);
    this.isFollowing = false;
    this.isInConversation = false;
    this.shouldStopIfPlayerWalksInFront;
    // add own update cycle

    this.isInCombat = false;
    this.combatAnim = new BABYLON.Vector4(350, 662, 0, 200);
    this.animationRanges = [
      { from: 207, to: 344 }, //running
      { from: 2345, to: 4000 }, //idle
      { from: 350, to: 662 }, //punch
      { from: 670, to: 880 }, // hit
      { from: 890, to: 1500 }, // death
    ];
    this.isFollowingCombat = false;
    this.lineCdCombat = 2;
    this.combatLines = config.combatLines;
    this.health = health;
    this.target = PLAYER.health;

    this.combatSkills = [SKILLS["guardPunch"]];

    this.xp = config.baseXP;
    this.attackDamage = 10;
    this.attackDistance = 10;
    this.attackTime = 1550;
    this.getFollowPosition = () => {
      const playerPos = window.DUMMY_AGGREGATE.body.transformNode._absolutePosition;
      const npcPos = this.health.rangeCheck.getAbsolutePosition();

      // Calculate direction from NPC to player
      const direction = playerPos.subtract(npcPos).normalize();

      // Calculate position 10 units away from player towards NPC
      const followPosition = playerPos.subtract(direction.scale(this.attackDistance));

      return followPosition;
    };
  }

  startCombat() {
    this.isFollowing = false;
    this.isInCombat = true;
    this.isFollowingCombat = true;

    if (this.followIntervalId) {
      clearInterval(this.followIntervalId);
      this.followIntervalId = null;
    }
    this.isFollowing = false;

    // console.log("startCombat");
    showSubtitle(this.name + ": " + this.getRandomLineCombat());
    // this.turnto = this.turnto;
    this.turnto(new BABYLON.Vector3(window.DUMMY_AGGREGATE.body.transformNode._absolutePosition.x, window.DUMMY_AGGREGATE.body.transformNode._absolutePosition.y, window.DUMMY_AGGREGATE.body.transformNode._absolutePosition.z));
    this.followAndAttack();
  }

  followAndAttack() {
    if (this.isFollowingCombat) {
      this.goto(this.getFollowPosition());
      this.combatfollowInterval = setInterval(() => {
        if (this.isFollowingCombat && !this.isDead) {
          console.log("this.target..isAlive", this.target.isAlive);
          if (!this.target.isAlive) {
            //if target died
            // this.isFollowingCombat = false;
            this.isInCombat = false;
            clearInterval(this.combatfollowInterval);
            return;
          }

          //get distance to player // todo do for any target
          const distance = BABYLON.Vector3.Distance(this.health.rangeCheck.getAbsolutePosition(), this.target.rangeCheck.getAbsolutePosition());
          console.log("distance", distance);
          //   // Get distance to player
          //   const distance = BABYLON.Vector3.Distance(
          //     this._transform.position,
          //     window.DUMMY_AGGREGATE.body.transformNode._absolutePosition
          // );

          // If within attack range (e.g. 5 units)
          if (distance < this.attackDistance + 17) {
            // Cast heavy swing
            //get a random skill
            const chosenSkill = this.combatSkills[Math.floor(Math.random() * this.combatSkills.length)];

            const spell = new Spell(
              chosenSkill.name,
              chosenSkill.effects,
              chosenSkill.animation,
              chosenSkill.vfx,
              chosenSkill.range || 100, // Default range if not specified
              chosenSkill.castTime,
              chosenSkill.castSound,
              chosenSkill.castSoundEnd
            );

            // Cast using spell mechanics
            if (spell.canCast(this.health, this.target)) {
              spell.cast(this.health, this.target);
            }
          } else {
            // hasnt reached target
            // this.goto(new BABYLON.Vector3(window.DUMMY_AGGREGATE.body.transformNode._absolutePosition.x, window.DUMMY_AGGREGATE.body.transformNode._absolutePosition.y, window.DUMMY_AGGREGATE.body.transformNode._absolutePosition.z));
            this.goto(this.getFollowPosition());
          }
        }
      }, this.attackTime);
    }
  }

  die() {
    this.isDead = true;
    this.isInCombat = true;
    this.combatfollowInterval = null;
    this.isFollowingCombat = false;
    this.combatAnim = new BABYLON.Vector4(this.animationRanges[4].from, this.animationRanges[4].to, 0, 200);
    setTimeout(() => {
      // this.isInCombat = false;
      this.combatAnim = new BABYLON.Vector4(this.animationRanges[4].to, this.animationRanges[4].to, 0, 0);
    }, 500);

    if (this.followIntervalId) {
      clearInterval(this.followIntervalId);
      this.followIntervalId = null;
    }
    this.isFollowing = false;
  }

  getRandomLine() {
    if (!this.isFollowing) {
      const randomLine = this.lines[Math.floor(Math.random() * this.lines.length)];
      return randomLine;
    } else {
      const randomLine = this.followerLines[Math.floor(Math.random() * this.followerLines.length)];
      return randomLine;
    }
  }

  getRandomLineCombat() {
    const randomLine = this.combatLines[Math.floor(Math.random() * this.combatLines.length)];
    return randomLine;
  }

  // Show quests this NPC can offer
  offerQuests() {
    return QuestManager.getAvailableQuests(this.id);
  }

  // Player accepts a quest via NPC
  acceptQuest(questId) {
    QuestManager.acceptQuest(questId);
  }

  // Player turns in completed quests
  completeQuest(questId) {
    QuestManager.updateQuestStatus(questId, "completed");
  }

  playGreeting(scene) {
    // scene.activeCamera.sound.setTiming(this.greetingName, this.randomGreetingsTiming[0].offset, this.randomGreetingsTiming[0].length);
    // Randomly choose between 0 and 1 to play different greetings
    this.scene.activeCamera.sound.play(this.greeting, "sfx");
  }
  playResponse() {
    this.scene.activeCamera.sound.play(this.response, "sfx");
  }
  playEnterConversation() {
    const randomChoice = Math.floor(Math.random() * 2);
    if (randomChoice === 1) {
      this.scene.activeCamera.sound.play(this.enterConversation, "sfx");
    } else {
      this.scene.activeCamera.sound.play(this.greeting, "sfx");
    }
  }
  playExitConversation() {
    this.scene.activeCamera.sound.play(this.exitConversation, "sfx");
  }

  //walk routines
  addRoutinePoint(time, position) {
    this.routine.push({
      time: time, // Time in seconds to stay at this position
      position: position, // BABYLON.Vector3 position to move to
    });
    console.log("routine", this.routine);
  }

  clearRoutine() {
    this.hideRoutineVisuals();
    this.routine = [];
    this.currentRoutineIndex = 0;
    this.routineTimer = 0;
    this.isFollowingRoutine = false;
  }

  startRoutine() {
    if (this.routine.length === 0) return;

    console.log("starting routine");

    this.isFollowingRoutine = true;
    this.currentRoutineIndex = 0;
    this.routineTimer = 0;
    // Go to first position
    console.log("this.routine[0].position", this.routine[0].position);
    this.goto(this.routine[0].position);
  }

  stopRoutine() {
    this.isFollowingRoutine = false;
  }

  updateRoutine(dt) {
    if (!this.isFollowingRoutine || this.routine.length === 0 || this.isFollowing || this.isInConversation || this.isInCombat) return;

    this.routineTimer += dt;

    // console.log("routineTimer", this.routineTimer);
    // console.log("this.routine[this.currentRoutineIndex].time", this.routine[this.currentRoutineIndex].time);
    // Check if we need to move to next position
    if (this.routineTimer >= this.routine[this.currentRoutineIndex].time) {
      console.log("moving to next point");
      this.currentRoutineIndex = (this.currentRoutineIndex + 1) % this.routine.length;
      this.routineTimer = 0;
      this.goto(this.routine[this.currentRoutineIndex].position);
    }
  }

  showRoutineVisuals() {
    // Clear any existing visuals first
    this.hideRoutineVisuals();

    if (this.routine.length === 0) return;

    // Create material for waypoints

    // Create spheres for each waypoint
    this.routine.forEach((point, index) => {
      // Create sphere
      const sphere = BABYLON.MeshBuilder.CreateSphere(
        `routinePoint${index}`,
        {
          diameter: 10,
        },
        this.scene
      );
      sphere.position = point.position;
      sphere.material = this.waypointMaterial;
      sphere.isPickable = false;

      // Add text for time
      // const timeText = new BABYLON.GUI.TextBlock();
      // timeText.text = `${point.time}s`;
      // timeText.color = "white";
      // timeText.fontSize = 12;

      // const plane = BABYLON.MeshBuilder.CreatePlane(
      //   `routineTextPlane${index}`,
      //   {
      //     width: 2,
      //     height: 1,
      //   },
      //   this.scene
      // );
      // plane.parent = sphere;

      // plane.position.y = 1.5;
      // const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane);
      // advancedTexture.addControl(timeText);

      this.routineVisuals.spheres.push(sphere);

      // Create line to next point if there is one
      // if (index < this.routine.length - 1) {
      //   const nextPoint = this.routine[index + 1].position;
      //   const points = [point.position, nextPoint];
      //   const lines = BABYLON.MeshBuilder.CreateLines(
      //     `routineLine${index}`,
      //     {
      //       points: points,
      //       updatable: false,
      //     },
      //     this.scene
      //   );
      //   lines.color = this.lineMaterial.color;
      //   lines.alpha = this.lineMaterial.alpha;
      //   lines.isPickable = false;
      //   this.routineVisuals.lines.push(lines);
      // }

      // // If it's the last point, connect back to first point for the loop
      // if (index === this.routine.length - 1) {
      //   const firstPoint = this.routine[0].position;
      //   const points = [point.position, firstPoint];
      //   const lines = BABYLON.MeshBuilder.CreateLines(
      //     `routineLine${index}`,
      //     {
      //       points: points,
      //       updatable: false,
      //     },
      //     this.scene
      //   );
      //   lines.color = new BABYLON.Color3(0, 0.7, 0);
      //   lines.alpha = 0.3;
      //   this.routineVisuals.lines.push(lines);
      // }
    });

    this.routineVisuals.isVisible = true;
  }

  hideRoutineVisuals() {
    this.routineVisuals.spheres.forEach((sphere) => {
      if (sphere.parent) {
        sphere.parent.dispose(); // Dispose the plane with text
      }
      sphere.dispose();
    });
    this.routineVisuals.lines.forEach((line) => line.dispose());

    this.routineVisuals.spheres = [];
    this.routineVisuals.lines = [];
    this.routineVisuals.isVisible = false;
  }

  // Modify existing clearRoutine to also clear visuals
  clearRoutine() {
    this.hideRoutineVisuals();
    this.routine = [];
    this.currentRoutineIndex = 0;
    this.routineTimer = 0;
    this.isFollowingRoutine = false;
  }
}

export const npcRegistry = new Map();
export function registerNPC(npc) {
  npcRegistry.set(npc.id, npc);
}

createNPCMenu(); //runs on first import
// Npc Menu
export function createNPCMenu() {
  // Create menu container
  const menu = document.createElement("div");
  menu.style.display = "none";
  menu.style.marginTop = "10px";
  menu.style.position = "absolute";
  menu.style.transition = "opacity 0.5s ease";
  menu.id = "npc-menu";
  menu.style.zIndex = "2";
  menu.menuHistory = []; //
  menu.NPC = null;

  // Create a permanent title element
  const titleElement = document.createElement("div");
  titleElement.style.color = "white";
  titleElement.style.marginBottom = "10px";
  titleElement.style.fontWeight = "bold";
  titleElement.style.textShadow = "rgba(0, 0, 0, 0.97) 1px 0px 5px";
  menu.appendChild(titleElement);

  document.body.appendChild(menu);

  // Helper to add menu items
  function addItem(text, fn) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.style.marginRight = "5px";
    btn.style.textShadow = "rgba(0, 0, 0, 0.97) 1px 0px 5px";
    btn.style.fontWeight = "bold";
    btn.style.fontSize = "15px";
    btn.style.padding = "10px";
    btn.style.marginBottom = "5px";
    btn.style.fontFamily = "revert";
    btn.style.borderRadius = "5px";
    btn.style.backgroundColor = "#000";
    btn.style.color = "#fff4d5";
    btn.style.boxShadow = "0px 0px 14px 0px rgba(0, 0, 0, 0.9)";
    btn.onclick = fn;
    btn.id = text;
    menu.appendChild(btn);
    btn.addEventListener("mousedown", (e) => e.preventDefault());
  }

  // Add this helper function to clear menu
  function clearMenu() {
    while (menu.firstChild) {
      menu.removeChild(menu.firstChild);
    }
  }

  // Helper to create a submenu
  function createSubmenu(title, items) {
    // Store current menu items for history
    const currentItems = Array.from(menu.children);
    menu.menuHistory.push(currentItems);

    // Clear and create new submenu
    clearMenu();

    // Add back button
    addItem("← Back", () => {
      if (menu.menuHistory.length > 0) {
        clearMenu();
        // Restore previous menu items
        const previousItems = menu.menuHistory.pop();
        previousItems.forEach((item) => menu.appendChild(item));
      }
    });

    // Add submenu title
    const titleElement = document.createElement("div");
    titleElement.textContent = title;
    titleElement.style.color = "white";
    titleElement.style.marginBottom = "10px";
    titleElement.style.fontWeight = "bold";
    titleElement.style.textShadow = "rgba(0, 0, 0, 0.97) 1px 0px 5px";
    menu.insertBefore(titleElement, menu.firstChild);

    // Add submenu items
    items.forEach((item) => {
      addItem(item.text, item.action);
    });
  }

  let greeting = "yo";
  // Menu actions
  addItem("Talk", () => {
    if (!menu.NPC.health.isAlive) {
      showSubtitle(menu.NPC.name + " " + "is dead.");
      return;
    }

    showSubtitle(menu.NPC.name + ": " + menu.NPC.talkLine);
    menu.NPC.playResponse();

    // Create array of conversation items from NPC's topics
    const conversationItems = menu.NPC.conversationTopics.map((topic) => ({
      text: topic.topic,
      action: () => {
        // Show the response
        showSubtitle(menu.NPC.name + ": " + topic.response);
        menu.NPC.playResponse();

        // Focus camera on NPC
        // const camera = menu.NPC.scene.activeCamera;

        // if (camera) {
        //   camera.focusedOnNPC = true;
        //   const npcPosition = menu.NPC._transform.position;
        //   camera.focusTarget = new BABYLON.Vector3(npcPosition.x, npcPosition.y - 1, npcPosition.z);
        // }
      },
    }));

    // Set camera to focus on NPC
    console.log("menu.NPC.scene", menu.NPC.scene);
    const camera = menu.NPC.scene.activeCamera;
    if (camera) {
      camera.focusedOnNPC = true;

      // Calculate a position slightly offset from the NPC for better framing
      const npcPosition = menu.NPC._transform.position;
      // console.log("npcPosition", menu.NPC.mesh.position);

      // Set the focus target with a slight height offset for better framing
      camera.focusTarget = new BABYLON.Vector3(
        npcPosition.x,
        npcPosition.y - 1, // Adjust this offset as needed
        npcPosition.z
      );
    }
    menu.NPC.scene.activeCamera.oldpreferredZoom = Number(menu.NPC.scene.activeCamera.preferredZoom);
    menu.NPC.scene.activeCamera.preferredZoom = 50;
    menu.NPC.scene.activeCamera.shouldPrefferedZoom = true;

    createSubmenu("Talking With " + menu.NPC.name, conversationItems);
  });
  addItem("Follow Me", () => {
    if (!menu.NPC.health.isAlive) return;
    menu.NPC.playResponse();
    // every
    if (!menu.NPC.isFollowing) {
      const followTime = 1000;
      // update the goto
      menu.NPC.goto(new BABYLON.Vector3(window.DUMMY_AGGREGATE.body.transformNode._absolutePosition.x, window.DUMMY_AGGREGATE.body.transformNode._absolutePosition.y, window.DUMMY_AGGREGATE.body.transformNode._absolutePosition.z));
      const followInterval = setInterval(() => {
        menu.NPC.goto(menu.NPC.getFollowPosition());
        // menu.NPC.goto(new BABYLON.Vector3(window.DUMMY_AGGREGATE.body.transformNode._absolutePosition.x, window.DUMMY_AGGREGATE.body.transformNode._absolutePosition.y, window.DUMMY_AGGREGATE.body.transformNode._absolutePosition.z));
      }, followTime); // 5000 milliseconds = 5 seconds

      // Store the interval ID on the NPC so we can clear it later
      menu.NPC.followIntervalId = followInterval;
      menu.NPC.isFollowing = true;
      showSubtitle(menu.NPC.name + ": " + menu.NPC.getRandomLine());

      // have follower lines, that play
      menu.NPC.lineCd = 30;
    }
  });

  addItem("Go Home", () => {
    if (!menu.NPC.health.isAlive) return;

    menu.NPC.playResponse();
    //play see you later conversion
    showSubtitle(menu.NPC.name + ": " + "See you later!");
    if (menu.NPC.followIntervalId) {
      clearInterval(menu.NPC.followIntervalId);
      menu.NPC.followIntervalId = null;
    }
    menu.NPC.isFollowing = false;
    menu.NPC.goto(menu.NPC.home);
  });
  // addItem("Edit", () => {
  //   const ng = prompt("Edit greeting:", menu.NPC.talkLine);
  //   if (ng && ng.trim()) {
  //     // npcRegistry(id);
  //     menu.NPC.talkLine = ng.trim();
  //     // alert("Greeting updated.");
  //     menu.NPC.playResponse();
  //   }
  // });

  addItem("Edit NPC", () => {
    // menu.NPC.playResponse();
    createSubmenu("Edit NPC", [
      {
        text: "Edit Name",
        action: () => {
          createSubmenu("Edit Name", [
            {
              text: "Change Name",
              action: () => {
                const newName = prompt("Enter new name:", menu.NPC.name);
                if (newName && newName.trim()) {
                  menu.NPC.name = newName.trim();
                  titleElement.textContent = menu.NPC.name;
                }
              },
            },
          ]);
        },
      },
      {
        text: "Edit Routine",
        action: () => {
          menu.NPC.scene.activeCamera.preferredZoom = 200;
          menu.NPC.scene.activeCamera.shouldPrefferedZoom = true;
          createSubmenu("Edit Routine", [
            {
              text: "Add Waypoint",
              action: () => {
                // Get current player position as the waypoint
                const playerPos = window.DUMMY_AGGREGATE.body.transformNode._absolutePosition;
                // Get highest time value from existing routine points and add 1
                const defaultTime = menu.NPC.routine.length > 0 ? Math.max(...menu.NPC.routine.map((point) => point.time)) + 1 : 5;
                const time = parseFloat(prompt("Enter time to stay at this position (in seconds):", defaultTime));

                if (!isNaN(time) && time > 0) {
                  menu.NPC.addRoutinePoint(time, new BABYLON.Vector3(playerPos.x, playerPos.y, playerPos.z));
                  menu.NPC.showRoutineVisuals();
                }
              },
            },
            {
              text: "Start Routine",
              action: () => {
                menu.NPC.startRoutine();
              },
            },
            {
              text: "Stop Routine",
              action: () => {
                menu.NPC.stopRoutine();
              },
            },
            {
              text: "Clear Routine",
              action: () => {
                menu.NPC.clearRoutine();
              },
            },
            {
              text: "Toggle Waypoints",
              action: () => {
                if (menu.NPC.routineVisuals.isVisible) {
                  menu.NPC.hideRoutineVisuals();
                } else {
                  menu.NPC.showRoutineVisuals();
                }
              },
            },
          ]);
        },
      },
      {
        text: "Edit Dialog",
        action: () => {
          createSubmenu("Edit Dialog", [
            {
              text: "Edit Conversation Topics",
              action: () => {
                createSubmenu("Edit Conversation Topics", [
                  {
                    text: "Add New Topic",
                    action: () => {
                      const topic = prompt("Enter the topic:");
                      const response = prompt("Enter the NPC's response:");
                      if (topic && response) {
                        menu.NPC.conversationTopics.push({
                          topic: topic.trim(),
                          response: response.trim(),
                        });
                      }
                    },
                  },
                  {
                    text: "Remove Topic",
                    action: () => {
                      createSubmenu(
                        "Remove Topic",
                        menu.NPC.conversationTopics.map((topic, index) => ({
                          text: topic.topic,
                          action: () => {
                            menu.NPC.conversationTopics.splice(index, 1);
                            // Go back to previous menu after removing
                            if (menu.menuHistory.length > 0) {
                              clearMenu();
                              const previousItems = menu.menuHistory.pop();
                              previousItems.forEach((item) => menu.appendChild(item));
                            }
                          },
                        }))
                      );
                    },
                  },
                ]);
              },
            },
            {
              text: "Edit Voice Lines",
              action: () => {
                alert("Coming soon! You can record your own voice lines, or chose from npc sound effects.");
                // Edit voice lines logic
              },
            },
            // ... existing code ...
            {
              text: "Edit Voice Lines",
              action: () => {
                alert("Coming soon! You can record your own voice lines, or chose from npc sound effects.");
                // Edit voice lines logic
              },
            },
            {
              text: "Edit Lines",
              action: () => {
                createSubmenu("Edit Lines", [
                  {
                    text: "Edit Greeting Lines",
                    action: () => {
                      createSubmenu("Edit Greeting Lines", [
                        {
                          text: "Add Greeting Line",
                          action: () => {
                            const line = prompt("Enter new greeting line:");
                            if (line && line.trim()) {
                              menu.NPC.lines.push(line.trim());
                              showSubtitle(menu.NPC.name + ": Added new greeting line");
                            }
                          },
                        },
                        {
                          text: "Remove Greeting Line",
                          action: () => {
                            createSubmenu(
                              "Remove Greeting Line",
                              menu.NPC.lines.map((line, index) => ({
                                text: line,
                                action: () => {
                                  menu.NPC.lines.splice(index, 1);
                                  if (menu.menuHistory.length > 0) {
                                    clearMenu();
                                    const previousItems = menu.menuHistory.pop();
                                    previousItems.forEach((item) => menu.appendChild(item));
                                  }
                                },
                              }))
                            );
                          },
                        },
                      ]);
                    },
                  },
                  {
                    text: "Edit Follower Lines",
                    action: () => {
                      createSubmenu("Edit Follower Lines", [
                        {
                          text: "Add Follower Line",
                          action: () => {
                            const line = prompt("Enter new follower line:");
                            if (line && line.trim()) {
                              menu.NPC.followerLines.push(line.trim());
                              showSubtitle(menu.NPC.name + ": Added new follower line");
                            }
                          },
                        },
                        {
                          text: "Remove Follower Line",
                          action: () => {
                            createSubmenu(
                              "Remove Follower Line",
                              menu.NPC.followerLines.map((line, index) => ({
                                text: line,
                                action: () => {
                                  menu.NPC.followerLines.splice(index, 1);
                                  if (menu.menuHistory.length > 0) {
                                    clearMenu();
                                    const previousItems = menu.menuHistory.pop();
                                    previousItems.forEach((item) => menu.appendChild(item));
                                  }
                                },
                              }))
                            );
                          },
                        },
                      ]);
                    },
                  },
                  {
                    text: "Edit Combat Lines",
                    action: () => {
                      createSubmenu("Edit Combat Lines", [
                        {
                          text: "Add Combat Line",
                          action: () => {
                            const line = prompt("Enter new combat line:");
                            if (line && line.trim()) {
                              menu.NPC.combatLines.push(line.trim());
                              showSubtitle(menu.NPC.name + ": Added new combat line");
                            }
                          },
                        },
                        {
                          text: "Remove Combat Line",
                          action: () => {
                            createSubmenu(
                              "Remove Combat Line",
                              menu.NPC.combatLines.map((line, index) => ({
                                text: line,
                                action: () => {
                                  menu.NPC.combatLines.splice(index, 1);
                                  if (menu.menuHistory.length > 0) {
                                    clearMenu();
                                    const previousItems = menu.menuHistory.pop();
                                    previousItems.forEach((item) => menu.appendChild(item));
                                  }
                                },
                              }))
                            );
                          },
                        },
                      ]);
                    },
                  },
                ]);
              },
            },
          ]);
        },
      },
      {
        text: "Edit Appearance",
        action: () => {
          createSubmenu("Edit Appearance", [
            {
              text: "Change Model",
              action: () => {
                alert("Coming soon! More customization options.");
              },
            },
          ]);
        },
      },
      {
        text: "Edit Stats",
        action: () => {
          createSubmenu("Edit Stats", [
            {
              text: "Edit Damage",
              action: () => {
                alert("Coming soon! More customization options.");
              },
            },
            {
              text: "Edit Health",
              action: () => {
                let newHealth = parseFloat(prompt("Enter new health:", menu.NPC.health.health));
                if (newHealth) {
                  menu.NPC.health.setMaxHealth(newHealth);
                  showSubtitle(menu.NPC.name + ": Health updated to " + menu.NPC.health.health);
                }
              },
            },
          ]);
        },
      },
    ]);
  });

  addItem("Goodbye", () => {
    if (menu.NPC.health.isAlive) {
      menu.NPC.playExitConversation();
      if (menu.NPC.isFollowing) {
        showSubtitle(menu.NPC.name + ": " + menu.NPC.exitConversationFamilar);
      } else {
        showSubtitle(menu.NPC.name + ": " + menu.NPC.exitConversationLine);
      }
    }
    menu.NPC.scene.activeCamera.preferredZoom = menu.NPC.scene.activeCamera.oldpreferredZoom;
    menu.hide();
  });

  menu.show = (NPC, x, y) => {
    IS_IN_CONVERSATION = true;
    menu.style.top = y + "px";
    menu.style.left = x + "px";
    menu.style.display = "block";
    menu.style.opacity = "1";

    menu.NPC = NPC;
    titleElement.textContent = NPC.name;

    menu.NPC.scene.activeCamera.oldpreferredZoom = Number(menu.NPC.scene.activeCamera.preferredZoom);

    if (!menu.NPC.isDead) {
      // console.log(menu.NPC);
      menu.NPC.playEnterConversation();
      menu.NPC.isInConversation = true;
      menu.NPC.turnto(new BABYLON.Vector3(window.DUMMY_AGGREGATE.body.transformNode._absolutePosition.x, window.DUMMY_AGGREGATE.body.transformNode._absolutePosition.y, window.DUMMY_AGGREGATE.body.transformNode._absolutePosition.z));
    } else {
      //is dead show loot
    }
    //hide forward interact or mouse interact

    document.getElementById("interact-tip").style.display = "none";
    document.getElementById("interactionUI").style.visibility = "hidden";
    document.getElementById("interactionUI").style.opacity = "0";
    if (MODE == 1) {
      //If in adventure mode, dont show edit button
      if (document.getElementById("Edit NPC")) {
        document.getElementById("Edit NPC").style.display = "none";
      }
    } else {
      if (document.getElementById("Edit NPC")) {
        document.getElementById("Edit NPC").style.display = "inline-block";
      }
    }
    // get npc from id
  };
  menu.hide = () => {
    IS_IN_CONVERSATION = false;
    menu.style.opacity = "0";
    setTimeout(() => {
      menu.style.display = "none";
    }, 500);
    if (menu.NPC !== null) {
      menu.NPC.isInConversation = false;
      // menu.NPC.playExitConversation();
      // Reset camera focus
      const camera = menu.NPC.scene.activeCamera;
      if (camera) {
        camera.focusedOnNPC = false;
        camera.focusTarget = window.DUMMY_AGGREGATE.body.transformNode._absolutePosition;
        setTimeout(() => {
          camera.target = window.CHARACTER;
          camera.focusTarget = null;
        }, 1000);
      }
    }
  };

  ///set up optional audio recording
  let audioRecording = true;
  if (audioRecording) {
    const recordBtn = document.createElement("button");
    recordBtn.innerHTML = "🎤 Record";

    const playBtn = document.createElement("button");
    playBtn.innerHTML = "▶️ Play";
    let mediaRecorder,
      audioChunks = [],
      audioBlob;

    // Setup Babylon scene (optional)
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    new BABYLON.FreeCamera("cam", new BABYLON.Vector3(0, 5, -10), scene);
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    engine.runRenderLoop(() => scene.render());

    // Record button
    recordBtn.onclick = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
      mediaRecorder.onstop = () => {
        audioBlob = new Blob(audioChunks);
        playBtn.disabled = false;
      };

      mediaRecorder.start();
      recordBtn.textContent = "⏹️ Stop";
      recordBtn.onclick = () => {
        mediaRecorder.stop();
        recordBtn.textContent = "🎤 Record";
        recordBtn.onclick = recordBtn.onclick; // re-bind
      };
    };

    // Play button
    playBtn.onclick = () => {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    };
  }

  window.NPCMenu = menu;
}

// export class NPC {
//   constructor(name, position) {
//     this.name = name;
//     this.position = position;
//   }

//   createNPC() {
//     // ask asset loaded to load model
//     // ask asset loaded to load animation vat
//     // then make npc
//     // npc1_vat.glb

//     const npc = new BABYLON.MeshBuilder.CreateSphere("npc", { diameter: 1 }, this.scene);
//     npc.position = this.position;
//   }

//   moveTo(position) {
//     this.position = position;
//   }

//   rotateTo(rotation) {
//     this.rotation = rotation;
//   }
// }
