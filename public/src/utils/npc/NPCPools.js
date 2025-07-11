import { loadMeshWithVAT } from "./vat.js";
import { Health } from "../../character/health.js";
import { NPC } from "./npc.js";
import { showSubtitle } from "../dialog/subtitle.js";
import { Interact } from "../interact/interact.js";
// Main class handles adding and removing NPC model pools. If a new npc is loaded into the game it's set up here
// Manages a pool of thin instances
export class NPCPools {
  static instance = null;

  static getInstance() {
    if (!NPCPools.instance) {
      NPCPools.instance = new NPCPools();
    }
    return NPCPools.instance;
  }

  constructor() {
    if (NPCPools.instance) {
      return NPCPools.instance;
    }
    this.NPCPools = {}; // {npcName: NPCPool}
    this.crowd = null;
    this.crowd = NAVIGATION_PLUGIN.createCrowd(128, 0.6, window.SCENE_MANAGER.activeScene); // 128 agents per batch is a sweet spot:contentReference[oaicite:1]{index=1}
    CROWD = this.crowd;

    // window.SCENE_MANAGER.activeScene.registerBeforeRender(() => {
    // this.update();
    // });

    NPCPools.instance = this;
  }

  async createNPCPool(npcType) {
    let mesh = null;
    if (npcType === "guard") {
      // let spawnPoint = new BABYLON.Vector3(0, 0, 0);
      const spawnPoint = new BABYLON.Vector3(1706.683, -775, 1277.427);
      console.log("loading vat");
      mesh = await loadMeshWithVAT(window.SCENE_MANAGER.activeScene, "example", "/assets/characters/enemy/npcs/npc1/", "npc1.glb", spawnPoint, "vertexData.json");
    }
    this.NPCPools[npcType] = new NPCPool(mesh);
  }

  update() {
    // Update each NPC pool
    for (const npcType in this.NPCPools) {
      this.NPCPools[npcType].update();
    }
    // if (!this.mesh) {
    //   return;
    // }
    // const tmp = new BABYLON.Matrix();
    // for (let i = 0; i < COUNT; i++) {
    //   // Example: simple upward drift
    //   this._positions[i].y += 0.1;

    //   // Rebuild the matrix for instance i
    //   BABYLON.Matrix.TranslationToRef(this._positions[i].x, this._positions[i].y, this._positions[i].z, tmp);

    //   // Write straight into the thin‐instance system:
    //   baseMesh.thinInstanceSetMatrixAt(i, tmp);
    // }

    // // Tell Babylon you’ve changed the “matrix” buffer:
    // baseMesh.thinInstanceBufferUpdated("matrix");
  }

  async addNPC(npcType, spawnPoint, configId = null) {
    if (!this.NPCPools[npcType]) {
      await this.createNPCPool(npcType);
    }

    // If no configId provided, use base npcType as configId
    const actualConfigId = configId || npcType;
    return this.NPCPools[npcType].addNPC(npcType, spawnPoint, this.crowd, actualConfigId);
  }
}

// This handles a pool for one specific NPC model.
class NPCPool {
  // Updates the position of a thin instance, for a given thinInstanceIndex
  constructor(mesh) {
    this.npcPool = [];
    this.mesh = mesh;
    this.setupCrowdUpdate();
  }
  setupCrowdUpdate() {
    // Add crowd update to scene's beforeRender
    window.SCENE_MANAGER.activeScene.onBeforeRenderObservable.add(() => {
      const dt = window.SCENE_MANAGER.activeScene.getEngine().getDeltaTime() * 0.001;
      // Update crowd simulation once for all NPCs
      if (CROWD) {
        CROWD.update(dt);
      }
    });
  }

  addNPC(npcType, spawnPoint, crowd, configId) {
    const npc = new BABYLON.TransformNode("npcNode");
    const npcMesh = this.mesh.clone("enemy"); //change to thin instance for performance
    // const npcMesh = this.mesh.createInstance("npcMesh"); //change to thin instance for performance
    // npcMesh.bakedVertexAnimationManager = new BABYLON.BakedVertexAnimationManager(window.SCENE_MANAGER.activeScene);
    // npcMesh.bakedVertexAnimationManager.texture = vertexTexture;

    const vatMat = npcMesh.material;
    const manager = new BABYLON.BakedVertexAnimationManager(window.SCENE_MANAGER.activeScene);

    console.log("this.mesh.bakedVertexAnimationManager", this.mesh.bakedVertexAnimationManager);
    // Copy the texture from the original mesh's animation manager
    if (this.mesh.bakedVertexAnimationManager) {
      manager.texture = this.mesh.bakedVertexAnimationManager.texture;

      // Set up the animation manager for the instance
      vatMat.bakedVertexAnimationManager = manager;
      npcMesh.material.bakedVertexAnimationManager = manager;
      npcMesh.bakedVertexAnimationManager = manager;

      // Set initial animation parameters (idle animation)
      npcMesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(0, 820, 0, 200);

      manager.time = 0; // Initialize the time
      // Register time update for this specific manager
      window.SCENE_MANAGER.activeScene.onBeforeRenderObservable.add(() => {
        const deltaTime = window.SCENE_MANAGER.activeScene.getEngine().getDeltaTime() / 1000.0;
        manager.time += deltaTime;
        // console.log("manager.time", manager.time);
      });

      manager.animationParameters = new BABYLON.Vector4(0, 820, 0, 200);
    }

    npcMesh.parent = npc;
    npc.npcMesh = npcMesh;
    npc.position = spawnPoint.clone();

    npc.npcMesh.isPickable = false;
    npc.npcMesh.isInteractable = true;
    npc.npcMesh.interact = new Interact();
    npc.npcMesh.interact.setDefaultAction("talk");

    let health = new Health("EnemySimple", 100, npc);
    // BABYLON.Tags.EnableFor(npc);
    // npc.addTags("health");
    BABYLON.Tags.AddTagsTo(npcMesh, "health");
    // let enemy = new Enemy("EnemySimple", 100, npc);
    let testNpc = new NPC("id1", configId, window.SCENE_MANAGER.activeScene, health);
    npc.NPC = testNpc;
    npc.NPC.home = npc.position;
    npc.NPC._transform = npc; //Todo refactor into one NPC class, NPC should be NPC info isntead
    npc.npcMesh.health = health;
    npc.npcMesh.health.rangeCheck = npc.npcMesh;

    const agentOpts = { radius: 0.6, height: 1.8, maxSpeed: 20, acceleration: 10 };
    const id = crowd.addAgent(npc.position, agentOpts, npc);

    // ---------- 2. Single‑line AI helpers ----------
    const goto = (p) => crowd.agentGoto(id, p); // path‑request

    const attack = () => {
      /* deal damage / spawn VFX */
    };
    // const turnto = (p) => {
    //   // Calculate direction vector from agent to target point
    //   const agentPos = crowd.getAgentPosition(id);
    //   const direction = p.subtract(agentPos);

    //   // Calculate the desired rotation angle (around Y axis)
    //   const desiredRotation = Math.atan2(direction.x, direction.z);

    //   // Get the agent's transform node and smoothly rotate it
    //   npc.rotation.y = npc.rotation.y + (desiredRotation - npc.rotation.y) * 0.1; // 0.1 is rotation speed factor
    // };
    const turnto = (p) => {
      // Store the target point on the NPC object so we can access it in the update loop
      npc.targetTurnPoint = p;

      // Add an observer to the scene's beforeRender if we haven't already
      if (!npc.turnObserver) {
        npc.turnObserver = window.SCENE_MANAGER.activeScene.onBeforeRenderObservable.add(() => {
          if (npc.targetTurnPoint) {
            const agentPos = crowd.getAgentPosition(id);
            const direction = npc.targetTurnPoint.subtract(agentPos);
            const desiredRotation = Math.atan2(direction.x, direction.z);

            // Calculate the difference between current and desired rotation
            let rotationDiff = desiredRotation - npc.rotation.y;

            // Normalize the difference to be between -PI and PI
            while (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
            while (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;

            // If we're close enough to the desired rotation, stop turning
            if (Math.abs(rotationDiff) < 0.01) {
              npc.targetTurnPoint = null; // Clear the target
              window.SCENE_MANAGER.activeScene.onBeforeRenderObservable.remove(npc.turnObserver);
              npc.turnObserver = null;
              return;
            }

            // Smooth rotation
            npc.rotation.y += rotationDiff * 0.1; // Adjust this value to control turn speed
          }
        });
      }
    };
    npc.NPC.goto = goto;
    npc.NPC.turnto = turnto;
    // ---------- 3. Spatial voice line ----------
    // const voice = new BABYLON.Sound("grunt", "/assets/sounds/vfx/ability/ice_3.mp3", scene, null, {
    // spatialSound: true,
    // maxDistance: 10000, // HRTF panning:contentReference[oaicite:2]{index=2}
    // });
    // voice.attachToMesh(npc);

    const sight_distance = 10000; //square root
    // ---------- 4. Tiny fixed‑timestep update ----------
    let wasInView = false; // track state
    let cd = 0; // attack cooldown
    window.SCENE_MANAGER.activeScene.onBeforeRenderObservable.add(() => {
      if (npc.NPC.isDead) {
        npc.npcMesh.bakedVertexAnimationManager.animationParameters = npc.NPC.combatAnim;
        return;
      }
      const dt = window.SCENE_MANAGER.activeScene.getEngine().getDeltaTime() * 0.001; // seconds:contentReference[oaicite:3]{index=3}
      npc.NPC.updateRoutine(dt);

      crowd.getAgentPosition(id, npc.position); // sync mesh
      const v = crowd.getAgentVelocity(id); // face move dir
      if (!v.equals(BABYLON.Vector3.Zero())) npc.rotation.y = Math.atan2(v.x, v.z);

      // console.log(v, v);
      if (npc.npcMesh.bakedVertexAnimationManager) {
        if (v.length() > 0.01) {
          npc.npcMesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(npc.NPC.animationRanges[0].from, npc.NPC.animationRanges[0].to, 0, 200);

          // console.log("moving");
        } else {
          // idle, or in combat
          if (npc.NPC.isInCombat) {
            npc.npcMesh.bakedVertexAnimationManager.animationParameters = npc.NPC.combatAnim;
          } else {
            npc.npcMesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(2345, 4000, 0, 200);
          }
          // npc.npcMesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(0, 820, 0, 200);
          // console.log("idle");
        }
      }
      // actions just saw hello
      // combat trigger: player <2 m *and* inside 45° cone
      const toPlayer = PLAYER.position.subtract(npc.position);
      // console.log("toPlayer", toPlayer.lengthSquared() < sight_distance);
      const distanceSq = toPlayer.lengthSquared();
      const inSight = distanceSq < sight_distance && BABYLON.Vector3.Dot(toPlayer.normalize(), npc.forward) > 0.7;

      if (inSight) {
        if (!wasInView && cd <= 0 && !npc.NPC.isInConversation) {
          if (!npc.NPC.isInCombat) {
            //play sight greeting
            npc.NPC.playGreeting(window.SCENE_MANAGER.activeScene);
            showSubtitle(npc.NPC.name + ": " + npc.NPC.getRandomLine());
            cd = npc.NPC.lineCd;
          } else {
            // in combat, play combat line

            showSubtitle(npc.NPC.name + ": " + npc.NPC.getRandomLineCombat());
            cd = npc.NPC.lineCdCombat;
            // wasInView = false;
          }
        }
        wasInView = true;
      } else {
        if (wasInView) {
          // player just left the NPC's view
          window.NPCMenu.hide();
        }
        wasInView = false;
      }
      // if (toPlayer.lengthSquared() < sight_distance && BABYLON.Vector3.Dot(toPlayer.normalize(), npc.forward) > 0.7 && cd <= 0) {
      //   // console.log("saw player");
      //   // scene.activeCamera.sound.play("Ice 3", "sfx");

      //   npc.NPC.playGreeting(scene);
      //   showSubtitle(npc.NPC.getRandomLine());
      //   // attack();
      //   // voice.play(); // fire‑and‑forget
      //   cd = npc.NPC.lineCd;
      //   wasInView = true;
      // } else {
      //   if (wasInView) {
      //     // player just left the NPC's view
      //     // menu.close(); // <-- call once when leaving
      //     window.NPCMenu.hide();
      //   }
      //   wasInView = false;
      // }
      cd = Math.max(0, cd - dt);
    });

    this.npcPool.push(npc);
    console.log("add npc");
    return npc;
  }

  update() {
    // for (const npc of this.npcPool) {
    //   npc.npcMesh.rotation.y += 0.01;
    // }
    // console.log("update");
  }
}
