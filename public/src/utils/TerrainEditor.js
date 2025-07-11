import { Interact } from "./interact/interact.js";
import { NPCPools } from "./npc/NPCPools.js";
import { SKILLS } from "../combat/skills/SkillData.js";
import { NPC_DATA } from "./npc/NPCData.js";
import { CUSTOM_NPC_CONFIGS } from "./npc/CustomNPCData.js";
import { createEnemyWithPosition } from "../character/enemy.js";
import { Health } from "../character/health.js";
export class TerrainEditor {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.mesh = null; // Single BABYLON.Mesh for entire terrain
    this.brushSize = options.brushSize || 20;
    this.strength = options.strength || 10.1;

    this.canvas = document.getElementById("renderCanvas");

    // Track dirty regions for optimization
    this.dirtyRegions = new Set(); // Store affected vertex indices

    const customPlane = new BABYLON.Mesh("customGrass2FacePlane", scene);

    // Half-size positions (2x2 plane split horizontally into 2)
    const PlanePositions = [
      // Top quad
      -1,
      1,
      0, // 0 - top left
      1,
      1,
      0, // 1 - top right
      -1,
      0,
      0, // 2 - middle left
      1,
      0,
      0, // 3 - middle right

      // Bottom quad
      -1,
      0,
      0, // 4 - middle left (same as 2)
      1,
      0,
      0, // 5 - middle right (same as 3)
      -1,
      -1,
      0, // 6 - bottom left
      1,
      -1,
      0, // 7 - bottom right
    ];

    const indices = [
      0,
      2,
      1, // Top left triangle
      1,
      2,
      3, // Top right triangle
      4,
      6,
      5, // Bottom left triangle
      5,
      6,
      7, // Bottom right triangle
    ];

    const uvs = [
      // Top quad
      0,
      1, // 0 - top left
      1,
      1, // 1 - top right
      0,
      0.5, // 2 - middle left
      1,
      0.5, // 3 - middle right

      // Bottom quad
      0,
      0.5, // 4 - middle left
      1,
      0.5, // 5 - middle right
      0,
      0, // 6 - bottom left
      1,
      0, // 7 - bottom right
    ];

    const vertexData2 = new BABYLON.VertexData();
    vertexData2.positions = PlanePositions;
    vertexData2.indices = indices;
    vertexData2.uvs = uvs;
    vertexData2.applyToMesh(customPlane);

    this.grassTemplate = customPlane;
    // BABYLON.MeshBuilder.CreatePlane(
    //   "grassTemplate",
    //   {
    //     width: 2,
    //     height: 2,
    //     sideOrientation: BABYLON.Mesh.DOUBLESIDE,
    //   },
    //   scene
    // );
    this.grassTemplate.useVertexColors = true;
    this.grassTemplate.setEnabled(false);
    this.grassTemplate.applyFog = false;

    const vertexData = BABYLON.VertexData.ExtractFromMesh(this.grassTemplate);
    const positions = vertexData.positions;
    const numVertices = positions.length / 3;

    // Create colors array
    const colors = [];

    for (let i = 0; i < numVertices; i++) {
      const y = positions[i * 3 + 1]; // Y coordinate
      if (y > 0.9) {
        // Only color vertices very close to the top (y=1)
        // Top vertices - red
        colors.push(1, 0, 0, 1); // RGBA
      } else {
        // All other vertices - black
        colors.push(0, 0, 0, 1); // RGBA
      }
    }
    // Assign colors and apply to mesh
    vertexData.colors = colors;
    vertexData.applyToMesh(this.grassTemplate, true);

    // Create grass material
    const grassMaterial = new BABYLON.PBRCustomMaterial("grassMat", scene);
    // grassMaterial.diffuseTexture = new BABYLON.Texture(
    //   "/assets/textures/terrain/trees/leaf card test.png",
    //   scene
    // );
    const grassTexture = new BABYLON.Texture("/assets/textures/terrain/trees/leaf card test.png", scene);
    grassTexture.hasAlpha = true;
    grassMaterial.albedoTexture = grassTexture;
    grassMaterial.emissiveTexture = grassTexture;

    grassMaterial.environmentIntensity = 2;
    grassMaterial.directIntensity = 2;
    // grassMaterial.diffuseTexture.hasAlpha = true;
    grassMaterial.albedoTexture.hasAlpha = true;

    grassMaterial.metallic = 0;
    grassMaterial._metallicF0Factor = 0;
    grassMaterial.backFaceCulling = true;
    grassMaterial.useAlphaFromAlbedoTexture = true;
    grassMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHATEST;
    grassMaterial.environmentIntensity = 0.6;
    // grassMaterial.directIntensity = 10.2;
    grassMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    grassMaterial.emissiveIntensity = 0.5;
    grassMaterial.alpha = 0.5;

    grassMaterial.AddUniform("iTime", "float", 0);
    grassMaterial.AddUniform("swayStrength", "float", 0.1);
    grassMaterial.AddUniform("swaySpeed", "float", 1.5);
    grassMaterial.onBindObservable.add(() => {
      const currentTime = performance.now() * 0.001; // Convert to seconds
      grassMaterial.getEffect().setFloat("iTime", currentTime);
      grassMaterial.getEffect().setFloat("swayStrength", this.swayStrength);
      grassMaterial.getEffect().setFloat("swaySpeed", this.swaySpeed);
    });

    grassMaterial.Vertex_MainEnd(`
      vColor = vec4(1.0); // Set vertex color to white
  `);
    //   grassMaterial.Vertex_Begin(`
    // #include<instancesDeclaration>;
    // #include<instancesVertex>;`);

    //     grassMaterial.Fragment_Definitions(`
    //     varying vec4 vColor;
    // `);
    // grassMaterial.AddAttribute("color", "vec4", 4);
    grassMaterial.Vertex_Before_PositionUpdated(`
// vec4 color = vec4(vColor.r, vColor.g, vColor.b, 1.0);
    highp float instanceIDFloat = float(gl_InstanceID);
    
    // // Generate noise based on world position
    float noise = sin(instanceIDFloat * 10.1 + iTime * swaySpeed);
    // // Apply sway effect
    float sway = noise * swayStrength;

    if (color.r > 0.99) {
    positionUpdated = position + vec3(sway * 0.2, sway * 0.1, sway * 0.2);
} else {
    // No sway
    positionUpdated = position;
}
`);
    grassMaterial.Fragment_Before_FragColor(`
    // finalColor.rgb = vColor.rgb;
`);

    const grassMaterialStandard = new BABYLON.StandardMaterial("grassMatStandard", scene);
    grassMaterialStandard.diffuseTexture = grassTexture;
    grassMaterialStandard.diffuseTexture.hasAlpha = true;
    grassMaterialStandard.emissiveTexture = grassTexture;
    grassMaterialStandard.emissiveTexture.hasAlpha = true;
    this.grassTemplate.material = grassMaterial;

    // setTimeout(() => {
    //   this.grassTemplate.material = window.ASSET_MANAGER.getMaterial("leaves", null, scene);
    // }, 10000);

    // Create parent nodes for organization
    this.previewParent = new BABYLON.TransformNode("preview", scene);
    this.placedParent = new BABYLON.TransformNode("placed", scene);
    this.grassParent = new BABYLON.TransformNode("placedGrass", scene);

    this.previewMesh = null;
    // this.previewMaterial = this.createPreviewMaterial();
    // Testing Object Templates
    // this.objectTemplates = {
    //   1: BABYLON.MeshBuilder.CreateBox("template1", { size: 10 }, scene),
    //   2: BABYLON.MeshBuilder.CreateSphere("template2", { diameter: 10 }, scene),
    //   3: BABYLON.MeshBuilder.CreateCylinder(
    //     "template3",
    //     { height: 10, diameter: 10 },
    //     scene
    //   ),
    // };

    // this.objectTemplates = {
    //   1: BABYLON.MeshBuilder.CreateBox("template1", { size: 10 }, scene),
    //   2: BABYLON.MeshBuilder.CreateSphere("template2", { diameter: 10 }, scene),
    //   3: BABYLON.MeshBuilder.CreateCylinder("template3", { height: 10, diameter: 10 }, scene),
    // };
    // // Hide templates
    // Object.values(this.objectTemplates).forEach((mesh) => mesh.setEnabled(false));
    this.objectTemplates = {};
    this.loadedTemplates = {};

    this.placedObjectsHistory = [];
    this.redoStack = [];
    // this.maxHistoryLength = 3;
    this.maxHistoryLength = 8;

    this.isPointerDown = false;
    this.currentTool = "paint";

    // Setup all pointer events
    this.setupPointerEvents();
    window.addEventListener("resize", () => this.updateTemplatePositions());

    this.createSaveLoadButtons();
    this.brightnessSliderValue = 0.5;
    this.currentLightColor = "rgba(255, 255, 255, 1)";
    this.brushSize = 1;

    this.currentNPCData = NPC_DATA["guard"];

    setTimeout(() => {
      this.setupGrassMaterial();
    }, 10);
  }

  setupPointerEvents() {
    this.scene.onPointerDown = (evt) => this.handlePointerDown(evt);
    this.scene.onPointerUp = (evt) => this.handlePointerUp(evt);
    this.scene.onPointerMove = () => this.handlePointerMove();
    this.scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
        const key = kbInfo.event.key;
        if (["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(key)) {
          if (MODE === 0) {
            this.toggleTemplateVisibility(true);
            this.showObjectPreview(key);
          }
        }
        //alt 3, show object preview as a phyics object
        if (key === "Escape") {
          if (MODE !== 1) {
            //if in adventure mode, ignore terrain/object editor call up

            this.toggleTemplateVisibility(false);
            this.removePreviewMesh();
            this.circleColor = new BABYLON.Vector3(0.0, 0.0, 0.0);
            // this.setTerrainTool("raise");
            this.setTerrainTool("view");
          }
        }
        if (key === "t") {
          this.setTerrainTool("paint");
          // Handle mouse over for TerrainSubMenu
          // const submenu = document.getElementById("TerrainSubMenu");
          // if (submenu) {
          //   submenu.style.display = "flex";
          //   submenu.style.opacity = "1";
          //   submenu.style.transform = "translateY(0) scale(1)";
          // }
        }
        if (key === "l") {
          this.setTerrainTool("lighting");
        }
        if (key === "g") {
          this.setTerrainTool("grass");
        }
        if (key === "n") {
          this.setTerrainTool("npc");
        }
        if (key === "o") {
          this.toggleTemplateVisibility(true);
          this.showObjectPreview("3");
        }
        if (kbInfo.event.ctrlKey || kbInfo.event.metaKey) {
          if (key === "z") {
            this.undo();
          } else if (key === "y") {
            this.redo();
          }
        }
      }
    });
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        // this.paintOnTerrain();
      }
    });
  }

  async handlePointerDown(evt) {
    if (evt.button !== 0) return;
    this.isPointerDown = true;

    //move this to action menu
    const interactInfo = this.getInteractInfo();
    console.log(interactInfo);
    //show npc options, talk, edit, etc
    if (interactInfo.pickedMesh === null) {
      window.NPCMenu.hide();
    } else {
      try {
        this.scene.debugLayer.select(interactInfo.pickedMesh);
        PICKED_MESH = interactInfo.pickedMesh;
      } catch {}
      if (!interactInfo.pickedMesh.isGrabable) {
        //is talkable
        window.NPCMenu.show(interactInfo.pickedMesh.parent.NPC, this.scene.pointerX, this.scene.pointerY);
        return;
      } else {
        console.log("grab");
        if (MODE === 2) {
          interactInfo.pickedMesh.dispose();
          this.scene.activeCamera.sound.play("Pickup");
        }
        // return;
      }
    }

    if (MODE === 1) {
      // In adventure mode, both left and right clicks trigger 'h' key behavior
      if (evt.button === 0 || evt.button === 2) {
        // const event = new KeyboardEvent("keydown", {
        //   key: "h",
        //   code: "KeyH",
        //   keyCode: 72, // Deprecated but sometimes still needed
        //   which: 72,
        //   bubbles: true,
        // });

        // document.dispatchEvent(event);
        SKILL_BAR.castSkill(1, PLAYER.health, PLAYER.target.health);
      }
    }

    //terrain editing past this point
    if (!this.previewMesh) return;

    const pickInfo = this.getPickInfo();

    if (pickInfo.hit) {
      // console.log("this.currentTool ", this.currentTool);
      // this.selectedTemplateKey = this.loadedTemplates[this.currentTemplate];
      this.selectedObject = await this.addObjectAtLocation(this.currentTool, pickInfo.pickedPoint);
      console.log("selectedObject", this.selectedObject);
      // Store initial camera distance when object is placed
      const initialDistance = BABYLON.Vector3.Distance(this.scene.activeCamera.position, pickInfo.pickedPoint);
      this.dragStart = {
        mouseY: this.scene.pointerY,
        mouseX: this.scene.pointerX,
        objectY: this.selectedObject.position.y,
        rotation: this.selectedObject.rotation.y,
        initialDistance: initialDistance,
      };
      this.previewMesh.setEnabled(false);
      if (window.ON_MOBILE) {
        this.scene.activeCamera.angularSensibilityX = 50000; // disables horizontal rotation
        this.scene.activeCamera.angularSensibilityY = 50000; // disables vertical rotation
      }
    }
  }

  createObjectInteractMenu() {
    // Create menu container
    const ObjectInteractMenu = document.createElement("div");
    ObjectInteractMenu.style.display = "none";
    ObjectInteractMenu.style.marginTop = "10px";
    document.body.appendChild(ObjectInteractMenu);

    // Helper to add menu items
    function addItem(text, fn) {
      const btn = document.createElement("button");
      btn.textContent = text;
      btn.style.marginRight = "5px";
      btn.onclick = fn;
      ObjectInteractMenu.appendChild(btn);
    }

    // Menu actions
    addItem("Pick Up", () => console.log("pick up"));

    ObjectInteractMenu.toggleMenu = () => {
      ObjectInteractMenu.style.display = ObjectInteractMenu.style.display === "none" ? "block" : "none";
    };
    window.InteractMenu = ObjectInteractMenu;
  }

  handleObjectAdded(object) {
    console.log("this.selectedObject.hasPhysics", object.hasPhysics);
    if (object.hasPhysics) {
      console.log("adding physics");
      new BABYLON.PhysicsAggregate(object, BABYLON.PhysicsShapeType.MESH, { mass: 0, restitution: 0.2, friction: 0.8 }, this.scene);
    }

    // this.selectedObject.isPickable = false;
    object.isInteractable = true;
    object.isGrabable = true;
    object.interact = new Interact();
    object.interact.setDefaultAction("grab");
  }

  handlePointerUp(evt) {
    if (evt.button !== 0) return;
    this.isPointerDown = false;
    // Add physics
    console.log("this.selectedObject", this.selectedObject);
    if (this.selectedObject) {
      //in object mode
      // if this.selectedObject.hasPhysics
      // todo make this depednad on object properties save in assets table
      console.log("this.selectedObject.hasPhysics", this.selectedObject.hasPhysics);
      if (this.selectedObject.hasPhysics) {
        console.log("adding physics");
        new BABYLON.PhysicsAggregate(this.selectedObject, BABYLON.PhysicsShapeType.MESH, { mass: 0, restitution: 0.2, friction: 0.8 }, this.scene);
      }
      if (this.selectedObject.isPickable === true) {
        this.selectedObject.isPickable = true;
      } else {
        this.selectedObject.isPickable = false;
      }
      // this.selectedObject.isPickable = false;
      this.selectedObject.isInteractable = true;
      this.selectedObject.isGrabable = true;
      this.selectedObject.interact = new Interact();
      this.selectedObject.interact.setDefaultAction("grab");

      // Convert templateKey from string to BigInt for the multiplayersystem
      console.log("selectedObject", this.selectedObject.assetId);
      if (window.MULTIPLAYER) {
        if (typeof this.selectedObject.draggedRotation === "undefined") {
          this.selectedObject.draggedRotation = this.selectedObject.rotationQuaternion.x;
        }
        window.MULTIPLAYER.sendAddObject(this.selectedObject.assetId, this.selectedObject);
        // window.MULTIPLAYER.localPlayer.identity,
      }

      if (window.ON_MOBILE) {
        this.scene.activeCamera.angularSensibilityX = 1000; // enables horizontal rotation
        this.scene.activeCamera.angularSensibilityY = 1000; // enables vertical rotation
      }

      //add barrel
      if (this.selectedObject.breakable_file_path) {
        this.selectedObject = this.addBreakable(this.selectedObject);
      }
      // this.addBreakable(this.selectedObject);

      //this.selectedObject = null;
      this.selectedObject = null;
      // this.previewMesh.setEnabled(true);
      this.scene.activeCamera.sound.play("Thunk", "sfx");
    } else {
      // in other than object mode, apply the current tool on pointer up

      const pickInfo = this.getPickInfo();
      // console.log("pickInfo", pickInfo);
      console.log("pickInfo", pickInfo.pickedMesh.name);
      this.applyCurrentTool(pickInfo);
    }

    // this.updatePhysics();
  }

  //move to its own file, with interaction picking, getInteractInfo
  setCursor(newCursor, pickedName = null) {
    if (this.currentCursor !== newCursor) {
      document.body.style.cursor = newCursor;
      // update text attached to mouse here body here
      const tip = document.getElementById("interact-tip");
      let tiptext = "";
      tip.style.display = "block";
      tip.style.opacity = 1;
      tip.style.top = this.scene.pointerY + "px";
      tip.style.left = this.scene.pointerX + "px";
      tip.style.textShadow = "rgba(0, 0, 0, 0.97) 1px 0px 5px";

      switch (newCursor) {
        case "grab":
          // code to run if expression === value1
          tiptext = "Grab";
          break;
        case "pointer":
          tiptext = "Talk";
          if (pickedName) {
            tiptext = tiptext + " to " + pickedName;
          }
          break;
        case "edit material":
          // document.body.style.cursor = "pointer";
          tiptext = "Edit Material";
          break;
        case "TerrainPointed":
          document.body.style.cursor = "pointer";
          tiptext = "Can Place";
          break;
        case "default":
          tip.style.opacity = 0;
          // tip.style.display = "none";
          break;
        default:
        // code to run if no cases match
      }

      tip.innerHTML = tiptext;
      //maybe on move, set top and left to mouse cursor
      this.currentCursor = newCursor;
    }
  }

  handlePointerMove() {
    // console.log(this.scene.meshUnderPointer);

    // skip extra checks, was making grass tool laggy
    if (this.currentTool !== "grass") {
      // console.log("in interact info, shouldnt be");
      // if desktop, can afford extra per mouse click
      const interactInfo = this.getInteractInfo();
      // let last = 'pointer';
      if (interactInfo.pickedMesh === null) {
        this.setCursor("default");
      } else {
        // TODO use case instead, array, types of interactions, grabable, talkable, etc lootable
        if (interactInfo.pickedMesh.isGrabable) {
          // if in adventure mode, show adventure ineractions like grab, loot, open etc
          //make open door animation/sound. maybe disable the collision then re-enable when done
          if (MODE === 2) {
            //in edit mode
            // in delete mode
            this.setCursor("grab", interactInfo.pickedMesh.name);
          } else {
            // this.setCursor("grab");
          }
        } else if (interactInfo?.pickedMesh?.material?.name?.includes("autoBlend")) {
          this.setCursor("edit material", interactInfo.pickedMesh.name);
          console.log("edit material", interactInfo.pickedMesh.name);

          //open window.AUTOBLEND_NOISE_STRENGTH slider;
        } else {
          const npc = interactInfo?.pickedMesh?.parent?.NPC;
          if (npc && !IS_IN_CONVERSATION) {
            this.setCursor("pointer", npc.name);
          }
        }
      }
    }
    // }
    // if (interactInfo !== null && interactInfo.pickedMesh.name.includes('npc')) {
    // window.NPCMenu.show(interactInfo.pickedMesh.name, this.scene.pointerX, this.scene.pointerY);
    // } else {
    // window.NPCMenu.hide();
    // }

    const pickInfo = this.getPickInfo();

    // Handle object dragging
    if (this.selectedObject && this.isPointerDown) {
      this.setCursor("grabbing");
      // document.body.style.cursor = 'grabbing';
      this.selectedObject.rotationQuaternion = this.previewMesh.rotationQuaternion;
      // Calculate current distance and ratio compared to initial distance
      const currentDistance = BABYLON.Vector3.Distance(this.scene.activeCamera.position, this.selectedObject.position);

      // Calculate scale ratio (1 at initial distance, <1 when closer, >1 when farther)
      const distanceRatio = currentDistance / this.dragStart.initialDistance;

      // Apply scaling - using the original mesh scale (5) as the base
      // const baseScale = 5; // old base scale for parts.glm TODO make this dynamic for each glb file
      let baseScale = 1;
      if (this.selectedObject.prefferedScaling) {
        baseScale = this.selectedObject.prefferedScaling.x;
      }

      // this.selectedObject.position.y = this.dragStart.objectY - (this.scene.pointerY - this.dragStart.mouseY) * 0.1 * baseScale * distanceRatio;
      // Add dampening to y movement for larger objects
      const yScaleFactor = 1 / Math.sqrt(baseScale);
      this.selectedObject.position.y = this.dragStart.objectY - (this.scene.pointerY - this.dragStart.mouseY) * 0.1 * baseScale * distanceRatio * yScaleFactor;

      this.selectedObject.scaling = new BABYLON.Vector3(baseScale * distanceRatio, baseScale * distanceRatio, baseScale * distanceRatio);

      // Adjust rotation - calculate rotation based on mouse movement
      const rotationSpeed = 0.003;
      const rotation = this.dragStart.rotation + (this.scene.pointerX - this.dragStart.mouseX) * rotationSpeed;

      if (this.selectedObject.rotationQuaternion) {
        this.selectedObject.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(this.selectedObject.rotationQuaternion.x, rotation, this.selectedObject.rotationQuaternion.z);
        this.selectedObject.draggedRotation = rotation;
      }

      return;
    }

    if (pickInfo.hit) {
      if (this.previewMesh) {
        // Object placement mode
        this.previewMesh.position = pickInfo.pickedPoint;
        // console.log("this.pickInfo.hit", pickInfo.pickedMesh.name);
        // if (pickInfo.pickedMesh.name.includes("ground")) {
        // this.setCursor("TerrainPointed");
        // }
        // this.brushIndicator.setEnabled(false);
      } else {
        // Terrain editing mode
        // this.updateBrushPosition(pickInfo);
        this.updateTerrainSelector(pickInfo);
        if (this.isPointerDown) {
          this.applyCurrentTool(pickInfo);
        }
      }
    }
  }
  placeGrass(pickInfo) {
    if (!pickInfo.hit) {
      return;
    }

    // console.log("Placing grass at:", pickInfo.pickedPoint);

    // Initialize the thin instances on the first placement
    if (!this.grassTemplate.thinInstanceCount) {
      console.log("Initializing grass template");
      this.grassTemplate.setEnabled(true);
      this.grassTemplate.thinInstanceAdd(BABYLON.Matrix.Identity());
      // Initialize color buffer for first instance
      this.grassColorData = new Float32Array(4);
      // this.grassColorData.set([1.0, 1.0, 1.0, 1.0]); // White color
      // this.grassTemplate.thinInstanceSetBuffer("size", this.grassColorData, 4);

      console.log("Grass template initialized with count:", this.grassTemplate.thinInstanceCount);
    }

    // Configuration for grass placement
    const numGrassToPlace = 10; // Number of grass instances to place per click
    const placementRadius = 20; // Radius around picked point to place grass
    const centerPoint = pickInfo.pickedPoint;

    const newInstanceCount = this.grassTemplate.thinInstanceCount + numGrassToPlace;
    const newColorData = new Float32Array(4 * newInstanceCount);
    // Copy existing color data
    if (this.grassColorData) {
      newColorData.set(this.grassColorData);
    }

    for (let i = this.grassTemplate.thinInstanceCount; i < newInstanceCount; i++) {
      const colorIdx = i * 4;
      newColorData[colorIdx + 0] = centerPoint.x; // Random R (0-1)
      newColorData[colorIdx + 1] = centerPoint.z; // Random G (0-1)
      newColorData[colorIdx + 2] = Math.random(); // Random B (0-1)
      newColorData[colorIdx + 3] = 1.0;
    }

    this.grassColorData = newColorData;

    // Place multiple grass instances
    for (let i = 0; i < numGrassToPlace; i++) {
      // Create random offset within the radius
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * placementRadius;
      const offsetX = Math.cos(angle) * distance;
      const offsetZ = Math.sin(angle) * distance;

      // Create position with offset
      const position = new BABYLON.Vector3(centerPoint.x + offsetX, centerPoint.y, centerPoint.z + offsetZ);

      // Random rotation around Y axis
      const rotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.random() * Math.PI * 2);

      // Random scale variation
      const scale = 3.8 + Math.random() * 2.4; // Random scale between 3.8 and 6.2
      const scaling = new BABYLON.Vector3(scale, scale, scale);

      // Create and add the instance
      const matrix = BABYLON.Matrix.Compose(scaling, rotation, position);
      const idx = this.grassTemplate.thinInstanceAdd(matrix);
      // const instanceIdx = this.grassTemplate.thinInstanceAdd(matrix);

      // Store position as color data
      // const colorIdx = instanceIdx * 4;
      // this.grassColorData[colorIdx + 0] = position.x; // R = x position
      // this.grassColorData[colorIdx + 1] = position.y; // G = y position
      // this.grassColorData[colorIdx + 2] = position.z; // B = z position
      // this.grassColorData[colorIdx + 3] = 1.0;
    }
    // this.grassTemplate.thinInstanceSetBuffer("size", this.grassColorData, 4);
    // this.grassTemplate.thinInstanceSetBuffer("color", this.grassColorData, 4);
    // console.log("Total grass instances:", this.grassTemplate.thinInstanceCount);
  }

  updateTerrainSelector(pickInfo) {
    var uv = pickInfo.getTextureCoordinates();

    this.selectionCenter.x = uv.x;
    this.selectionCenter.y = uv.y;
  }

  createPreviewMaterial() {
    const previewMaterial = new BABYLON.StandardMaterial("previewMat", this.scene);
    // this.previewMesh.material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1);
    previewMaterial.alpha = 0.5;
    return previewMaterial;
  }
  async showObjectPreview(key) {
    if (this.previewMesh) this.previewMesh.dispose();
    this.circleColor = new BABYLON.Vector3(0.0, 0.0, 0.0);

    this.currentTool = key;
    this.currentTemplate = key;
    this.previewMesh = this.objectTemplates[key].clone("preview");
    // this.previewMesh = await window.ASSET_MANAGER.load(this.loadedTemplates[key], this.scene);

    // TODO for each glb file
    // this.previewMesh.scaling = new BABYLON.Vector3(5, 5, 5);
    console.log("this.previewMesh.prefferedScaling", this.previewMesh.prefferedScaling);
    if (this.previewMesh.prefferedScaling) {
      this.previewMesh.scaling = this.previewMesh.prefferedScaling;
      this.previewMesh.prefferedScaling = this.objectTemplates[key].prefferedScaling;
    } else {
      this.previewMesh.scaling = new BABYLON.Vector3(1, 1, 1);
    }
    this.previewMesh.position.x = 0;
    this.previewMesh.position.y = 0;
    this.previewMesh.position.z = 0;
    this.previewMesh.isPickable = false;
    this.previewMesh.parent = this.previewParent;
    // this.previewMesh.material = this.previewMaterial();
    this.previewMesh.setEnabled(true);
    this.handlePointerMove();

    this.canvas.focus();

    // this.previewMesh.rotation = new BABYLON.Vector3(0, Math.PI, 0);
  }

  getTerrain() {
    return this.mesh;
  }

  setupGrassMaterial() {
    const pbrCustomMat = new BABYLON.PBRCustomMaterial("pbrWindSwayMaterial", this.scene);
    pbrCustomMat.albedoTexture = new BABYLON.Texture("/assets/textures/terrain/grass/grass.png", this.scene);
    pbrCustomMat.emissiveTexture = new BABYLON.Texture("/assets/textures/terrain/grass/grass.png", this.scene);
    pbrCustomMat.metallic = 0.0;
    pbrCustomMat._metallicF0Factor = 0.0;
    pbrCustomMat.backFaceCulling = false; //VERY IMPORTANT WHEN FALSE, NO DIRECTIONAL LIGHT, TRUE FOR DIRESTIONAL LIGHT BUT THINER TREES
    pbrCustomMat.AddUniform("iTime", "float", 0);
    pbrCustomMat.AddUniform("swayStrength", "float", 0.2);
    pbrCustomMat.AddUniform("swaySpeed", "float", 1.5);
    pbrCustomMat.AddUniform("screenResolution", "vec2", 1.5);
    pbrCustomMat.Fragment_Before_FragColor(`
      // vec2 center = screenResolution * 0.5;
      // float r = 5000.0; //radius in pixels
      // if (length(gl_FragCoord.xy - center) > r) discard;

      // vec2 uv = gl_FragCoord.xy / screenResolution;
      // vec2 center = vec2(0.5, 0.5);
      // float dist = distance(uv, center);
      // float radius = 0.25;
      // if(dist < radius) {
      //   discard;
      // }
      // discard;
      `);
    pbrCustomMat.Vertex_Before_PositionUpdated(`
float sway = sin(position.x * 2.0 + iTime * swaySpeed) * swayStrength;
    positionUpdated = position + vec3(0.0, sway, 0.0); // Apply sway in Y-axis
`);

    this.swaySpeed = 2.3;
    this.swayStrength = 0.35;
    pbrCustomMat.onBindObservable.add(() => {
      const currentTime = performance.now() * 0.001; // Convert to seconds
      pbrCustomMat.getEffect().setFloat("iTime", currentTime);
      pbrCustomMat.getEffect().setFloat("swayStrength", this.swayStrength);
      pbrCustomMat.getEffect().setFloat("swaySpeed", this.swaySpeed);
      pbrCustomMat.getEffect().setVector2("screenResolution", new BABYLON.Vector2(this.scene.getEngine().getRenderWidth(), this.scene.getEngine().getRenderHeight()));
    });

    this.pbrCustomMat = pbrCustomMat;
  }
  setModels(models) {
    // Object.values(this.objectTemplates).forEach((mesh) => mesh.dispose());
    // this.objectTemplates = {};
    return;
    // console.log("window.assetsSearchResults", window.assetsSearchResults);
    // assetsSearchResults
    // Only set the defualt tree models, if no connection to asset database
    // if (window.assetsSearchResults) {
    // return;
    // }

    // Clear existing templates
    Object.values(this.objectTemplates).forEach((mesh) => mesh.dispose());
    this.objectTemplates = {};

    let meshes = [];
    models.getChildMeshes().forEach((mesh) => {
      // mesh.material.metallic = 0;
      // mesh.receiveShadows = true;
      // mesh.useVertexColors = true;
      // set levels
      // per model scaling
      mesh.scaling = new BABYLON.Vector3(1, 1, 1);
      meshes.push(mesh);
    });

    // Create new templates from the provided models
    let templateIndex = 1;
    meshes.forEach((mesh) => {
      this.objectTemplates[templateIndex] = mesh.clone(`template_${templateIndex}`);
      // this.objectTemplates[templateIndex].material =
      // new BABYLON.StandardMaterial("templateMat", this.scene);
      // this.objectTemplates[templateIndex].material.diffuseColor =
      // new BABYLON.Color3(0.5, 0.5, 1);
      this.objectTemplates[templateIndex].useVertexColors = false;
      this.objectTemplates[templateIndex].applyFog = false;
      this.objectTemplates[templateIndex].material._metallicF0Factor = 0;
      this.objectTemplates[templateIndex].material.emissiveIntensity = 0.0;

      //todo have an object configuration, that can contain multiple models like trees and trunks
      // for plants
      // this.objectTemplates[templateIndex].material.environmentIntensity = 0.1;
      // this.objectTemplates[templateIndex].material.directIntensity = 5.2;

      // for objects
      this.objectTemplates[templateIndex].material.environmentIntensity = 0.15;
      this.objectTemplates[templateIndex].material.directIntensity = 6.2;
      // this.objectTemplates[templateIndex].material.environmentIntensity = 0.3;
      // this.objectTemplates[templateIndex].material.directIntensity = 50.2;
      if (templateIndex === 1 || templateIndex === 3) {
        const pbrCustomMat = new BABYLON.PBRCustomMaterial("pbrWindSwayMaterial", this.scene);
        pbrCustomMat.albedoTexture = this.objectTemplates[templateIndex].material.albedoTexture;
        pbrCustomMat.emissiveTexture = this.objectTemplates[templateIndex].material.emissiveTexture;
        pbrCustomMat.metallic = 0.0;
        pbrCustomMat._metallicF0Factor = 0.0;
        pbrCustomMat.backFaceCulling = false; //VERY IMPORTANT WHEN FALSE, NO DIRECTIONAL LIGHT, TRUE FOR DIRESTIONAL LIGHT BUT THINER TREES
        pbrCustomMat.AddUniform("iTime", "float", 0);
        pbrCustomMat.AddUniform("swayStrength", "float", 0.2);
        pbrCustomMat.AddUniform("swaySpeed", "float", 1.5);
        pbrCustomMat.AddUniform("screenResolution", "vec2", 1.5);
        pbrCustomMat.Fragment_Before_FragColor(`
          // vec2 center = screenResolution * 0.5;
          // float r = 5000.0; //radius in pixels
          // if (length(gl_FragCoord.xy - center) > r) discard;

          // vec2 uv = gl_FragCoord.xy / screenResolution;
          // vec2 center = vec2(0.5, 0.5);
          // float dist = distance(uv, center);
          // float radius = 0.25;
          // if(dist < radius) {
          //   discard;
          // }
          // discard;
          `);
        pbrCustomMat.Vertex_Before_PositionUpdated(`
float sway = sin(position.x * 2.0 + iTime * swaySpeed) * swayStrength;
        positionUpdated = position + vec3(0.0, sway, 0.0); // Apply sway in Y-axis
    `);

        this.swaySpeed = 2.3;
        this.swayStrength = 0.35;
        pbrCustomMat.onBindObservable.add(() => {
          const currentTime = performance.now() * 0.001; // Convert to seconds
          pbrCustomMat.getEffect().setFloat("iTime", currentTime);
          pbrCustomMat.getEffect().setFloat("swayStrength", this.swayStrength);
          pbrCustomMat.getEffect().setFloat("swaySpeed", this.swaySpeed);
          pbrCustomMat.getEffect().setVector2("screenResolution", new BABYLON.Vector2(this.scene.getEngine().getRenderWidth(), this.scene.getEngine().getRenderHeight()));
        });
        this.objectTemplates[templateIndex].material = pbrCustomMat;

        // const testMesh = BABYLON.MeshBuilder.CreatePlane(
        //   "testPlane",
        //   { size: 20 },
        //   this.scene
        // );
        // // Set position to spawn point from terrain patch scene
        // const spawnPoint = new BABYLON.Vector3(1716.683, -775, 1277.427);
        // testMesh.position = spawnPoint;
        // testMesh.material = pbrCustomMat;
        this.pbrCustomMat = pbrCustomMat;
        //   const container = document.createElement("div");
        //   container.style.cssText = `
        //   position: absolute;
        //   top: 40%;
        //   left: 40%;
        //   transform: translate(-50%, -50%);
        //   z-index: 1000;
        //   cursor: move;
        //   user-select: none;
        //   translate: (100px, 100px);
        // `;
        //   document.body.appendChild(container);

        //   const PARAMS = {
        //     selectionRadius: 0.043,
        //     edgeSoftness: 0.1,
        //     selectionColor: { r: 1, g: 0, b: 0 },
        //     // Add new sway parameters
        //     swayStrength: 0.2,
        //     swaySpeed: 1.5,
        //   };

        //   const pane = new Tweakpane.Pane({
        //     title: "Post Processing 2",
        //     expanded: true,
        //     container: container,
        //   });

        //   const swayFolder = pane.addFolder({
        //     title: "Vegetation Sway",
        //   });

        //   swayFolder
        //     .addInput(PARAMS, "swayStrength", {
        //       label: "Strength",
        //       min: 0,
        //       max: 1,
        //       step: 0.01,
        //     })
        //     .on("change", ({ value }) => {
        //       // Update shader for templates 1 and 3
        //       this.swayStrength = value;
        //     });

        //   swayFolder
        //     .addInput(PARAMS, "swaySpeed", {
        //       label: "Speed",
        //       min: 0,
        //       max: 5,
        //       step: 0.1,
        //     })
        //     .on("change", ({ value }) => {
        //       this.swaySpeed = value;
        //     });

        this.objectTemplates[templateIndex].useVertexColors = false;
        this.objectTemplates[templateIndex].isPickable = true; // Ensures the mesh can be interacted with
        this.objectTemplates[templateIndex].alwaysSelectAsActiveMesh = true;

        //for tree imports
        this.objectTemplates[templateIndex].material.environmentIntensity = 0.6;
        this.objectTemplates[templateIndex].material.directIntensity = 10.2;
        this.objectTemplates[templateIndex].material.transparencyMode = BABYLON.Material.MATERIAL_ALPHATEST;
        // Set emissive color to white
        this.objectTemplates[templateIndex].material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        // Set emissive intensity to 0.5
        this.objectTemplates[templateIndex].material.emissiveIntensity = 0.5;
      }

      if (templateIndex === 2) {
        //for tree imports

        // this.objectTemplates[templateIndex].material.transparencyMode =
        //   BABYLON.Material.MATERIAL_ALPHATEST;
        // // Set emissive color to white
        // this.objectTemplates[templateIndex].material.emissiveColor =
        //   new BABYLON.Color3(1, 1, 1);
        // // Set emissive intensity to 0.5
        // this.objectTemplates[templateIndex].material.emissiveIntensity = 0.5;

        // standard for fog
        const albedoTexture = this.objectTemplates[templateIndex].material.albedoTexture;

        const emissiveTexture = albedoTexture.clone("emissiveTexture");

        // Create new StandardMaterial
        const standardMat = new BABYLON.CustomMaterial("templateMat", this.scene);

        // Copy the albedo texture to diffuse
        standardMat.diffuseTexture = albedoTexture;
        // standardMat.emissiveTexture = emissiveTexture;
        standardMat.emissiveTexture = emissiveTexture;
        standardMat.emissiveTexture.level = 0.5;
        standardMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        // standardMat.emissiveTexture.level = 3;
        // standardMat.ambientTexture = emissiveTexture;
        // Set lighting properties
        standardMat.diffuseTexture.level = 1.1;
        // standardMat.emissiveTexture.level = 1.25;
        // standardMat.ambientTexture.level = 5.25;

        // Additional standard material properties
        // standardMat.useAlphaFromDiffuseTexture = true;
        standardMat.specularColor = new BABYLON.Color3(0, 0, 0); // Reduce specular reflection
        // standardMat.emissiveColor = new BABYLON.Color3(0, 0, 0);

        standardMat.useVertexColors = false;

        // Apply the material and fog
        this.objectTemplates[templateIndex].useVertexColors = false;
        this.objectTemplates[templateIndex].hasVertexAlpha = false;
        this.objectTemplates[templateIndex].applyFog = true;
        this.objectTemplates[templateIndex].material = standardMat;
      }

      this.objectTemplates[templateIndex].material.useAlphaFromDiffuseTexture = true;
      templateIndex++;
    });

    this.setupTemplatePreview();
    // console.log("window.ON_MOBILE", window.ON_MOBILE);
    // if (!window.ON_MOBILE) {
    // this.showObjectPreview("3");
    setTimeout(() => {
      // this.setTerrainTool("paint");
      this.setTerrainTool("view");
    }, 1000);
    // this.setTerrainTool("paint");
    // console.log("showObjectPreview", "1");
    // }

    // if (this.objectTemplates[4]) {
    //   // Dispose of old grass template if it exists
    //   if (this.grassTemplate) {
    //     this.grassTemplate.dispose();
    //   }

    //   // Clone the grass model and set it up
    //   this.grassTemplate = this.objectTemplates[4];
    //   this.grassTemplate.setEnabled(false); // Start disabled
    //   this.grassTemplate.parent = this.grassParent;
    //   this.grassTemplate.isPickable = false;
    //   console.log("Grass template initialized from model");
    // } else {
    //   console.warn("No grass model found in template 4, using default plane");
    //   // Keep the existing plane-based grass template
    // }
    // this.grassTemplate = this.objectTemplates[4].clone("grassTemplate");
    // this.grassTemplate.setEnabled(true);
    // this.grassTemplate.scaling = new BABYLON.Vector3(5, 5, 5);
    // this.grassTemplate.parent = this.grassParent;
    // this.grassTemplate.isPickable = false;
  }

  setModelsFromJson(modelsJson) {
    // Clear existing templates
    Object.values(this.objectTemplates).forEach((mesh) => mesh.dispose());
    this.objectTemplates = {};

    let meshes = [];
    modelsJson.forEach((modelJson) => {
      let templateIndex = modelJson.assetId; //From Assets Table

      //Asset manager load each asset
      // let mesh = await AssetsManager.LoadMesh(modelJson.assetId);
      this.objectTemplates[templateIndex] = mesh;

      //Set material settings
      this.objectTemplates[templateIndex].useVertexColors = false;
      this.objectTemplates[templateIndex].applyFog = false;
      this.objectTemplates[templateIndex].material._metallicF0Factor = 0;
      this.objectTemplates[templateIndex].material.emissiveIntensity = 0.0;

      //Set object settings from json
      this.objectTemplates[templateIndex].isPickable = modelJson.isPickable;
    });

    this.setupTemplatePreview();
    // this.showObjectPreview("1");
  }

  addModel(parentMesh) {
    // todo remove one
    let newMesh = parentMesh; // parentMesh.clone("newMesh");

    let totalObjectCount = Object.keys(this.objectTemplates).length;
    let newKey = totalObjectCount + 1;
    this.objectTemplates[newKey] = newMesh;
    // console.log("this.objectTemplates", this.objectTemplates);
    // console.log("this.objectTemplates[key]", this.objectTemplates[newKey]);
    // this should be new key
    // get total object count  in ObjectTemplates
    // let totalObjectCount = Object.keys(this.objectTemplates).length;
    // console.log("totalObjectCount", totalObjectCount);
    this.objectTemplates[newKey].scaling = new BABYLON.Vector3(10, 10, 10);
    if (!this.objectTemplates[newKey].preffered_scale) {
      this.objectTemplates[newKey].prefferedScaling = new BABYLON.Vector3(10, 10, 10);
    } else {
      this.objectTemplates[newKey].prefferedScaling = new BABYLON.Vector3(parentMesh.preffered_scale, parentMesh.preffered_scale, parentMesh.preffered_scale);
    }

    console.log("newMesh", newMesh);
    this.loadedTemplates[newKey] = newMesh.assetId;
    console.log("this.loadedTemplates", this.loadedTemplates);

    this.setupTemplatePreview();

    this.toggleTemplateVisibility(true);
    this.showObjectPreview(newKey);
    this.numberGrid.update();
  }

  removePreviewMesh() {
    if (typeof this.previewMesh !== "undefined" && this.previewMesh !== null) {
      this.previewMesh.dispose();
      this.previewMesh = null;
    }
  }
  // Add method to switch back to terrain editing
  setTerrainTool(tool) {
    if (tool === "adventure") {
      MODE = 1;
      SKILL_BAR.showSkillBar();
      // Hide menu with smooth transition
      // document.body.style.cursor = "none";
      const mainMenu = document.querySelector("#mainMenu");
      if (mainMenu) {
        // mainMenu.style.opacity = "0";
        // mainMenu.style.display = "none";
        // mainMenu.style.transform = "translateY(20px)";
        setTimeout(() => {
          mainMenu.style.opacity = "0";
          setTimeout(() => {
            mainMenu.style.display = "none";
          }, 1000);
        }, 400);
      }
      this.canvas.addEventListener("click", () => {
        // this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;
        // if (this.canvas.requestPointerLock) {
        //   this.canvas.requestPointerLock();
        // }
      });
    } else {
      SKILL_BAR.hideSkillBar();
      if (tool === "options") {
        OPTIONS.togglePanel();
        return;
      }
      document.body.style.cursor = "default";
      MODE = 0;

      // Only show menu if on desktop
      if (window.innerWidth > 768) {
        const mainMenu = document.querySelector("#mainMenu");
        if (mainMenu) {
          mainMenu.style.display = "block";
          // Trigger reflow
          // mainMenu.offsetHeight;
          mainMenu.style.opacity = "1";
          // mainMenu.style.transform = "translateY(0)";
        }
      }
    }

    if (this.previewMesh) {
      //objects
      this.removePreviewMesh();
      this.selectedObject = null;
      this.circleColor = new BABYLON.Vector3(0.0, 0.0, 0.0);
    }
    if (tool === "paint") {
      this.circleColor = new BABYLON.Vector3(0.0, 1.0, 0.42);
    }
    if (tool === "lighting") {
      this.circleColor = new BABYLON.Vector3(0.5 + this.brightnessSliderValue * 0.01, 0.5 + this.brightnessSliderValue * 0.01, 0.5 + this.brightnessSliderValue * 0.01);
    }
    if (tool === "grass") {
      this.circleColor = new BABYLON.Vector3(0.0, 0.5, 0.06);
      // Change cursor to grass icon when grass tool is selected
      // document.body.style.cursor = "url('/assets/textures/terrain/icons/texture_paint.png'), auto";
    }
    if (tool === "npc") {
      this.circleColor = new BABYLON.Vector3(0.1, 0.1, 0.2);
    }
    this.currentTool = tool; // 'raise', 'lower', or 'flatten'
  }

  setShadowGenerator(shadowGenerator) {
    this.shadowGenerator = shadowGenerator;
  }

  animateLoadIn(mesh, duration = 30) {
    console.log("animateLoadIn", mesh);
    // Animate scaling from 0 to current scale
    const startScale = new BABYLON.Vector3(0, 0, 0);
    const endScale = mesh.scaling.clone();

    // Reset to zero scale for animation start
    mesh.scaling.copyFrom(startScale);

    // Create animation
    const animation = new BABYLON.Animation(
      "loadInScale",
      "scaling",
      60, // frames per second
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: startScale },
      { frame: duration, value: endScale },
    ];
    animation.setKeys(keys);

    // Optionally, add easing for smoothness
    const easing = new BABYLON.CubicEase();
    easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
    animation.setEasingFunction(easing);

    // Start animation
    mesh.animations = [animation];
    mesh.getScene().beginAnimation(mesh, 0, duration, false);
  }

  async addObjectAtLocation(templateKey, position, dragged_rotation = null, scale_x = null, loadAnimation = false, assetId = -1) {
    // if the object is not in the objectTemplates, load the object template
    // if (!this.objectTemplates[templateKey] ) return;
    // console.log("templateKey", templateKey);

    // if (this.objectTemplates[templateKey]) {
    //   this.objectTemplates[templateKey] = window.AssetManager.load(templateKey, this.scene);
    //   console.log("objectTemplates[templateKey]", this.objectTemplates[templateKey]);
    // } else {
    //   // object already loaded
    // }

    // adding to scene based on player click
    // let instance = null;
    // if (this.objectTemplates[templateKey].material_type === "lightray") {
    //   instance = this.objectTemplates[templateKey].clone(`object_${Date.now()}`);
    // } else {
    //   // console.log("templateKey", templateKey);
    //   instance = this.objectTemplates[templateKey].createInstance(`object2_${Date.now()}`);
    // }

    // if (assetId !== -1) {
    //   // let asset = { asset_id: assetId }
    //   // window.assetsSearchResults;
    // console.log("fullAsset", fullAsset);
    //   this.objectTemplates[assetId] = window.ASSET_MANAGER.load(fullAsset, this.scene);
    //   console.log("objectTemplates[assetId]", this.objectTemplates[assetId]);
    //   // templateKey = assetId;
    // }
    //loading in asset based on scene load or other player
    // if (assetId !== -1) {
    //   let fullAsset = null;
    //   assetId = Number(assetId);
    //   window.assetsSearchResults.forEach((asset) => {
    //     if (asset.asset_id === assetId) {
    //       fullAsset = asset;
    //     }
    //   });

    let original = null;
    let instance = null;
    console.log(" loading assetId:" + assetId + " templateKey:" + templateKey);
    if (assetId !== -1) {
      let fullAsset = null;
      assetId = Number(assetId);
      if (window.assetsSearchResults) {
        window.assetsSearchResults.forEach((asset) => {
          if (asset.asset_id === assetId) {
            fullAsset = asset;
          }
        });
        console.log("fullAsset", fullAsset);

        //probably just need the assetId
        original = await window.ASSET_MANAGER.load(fullAsset, this.scene);
        // original = await window.ASSET_MANAGER.load(fullAsset, this.scene);

        // console.log("original", original);
        // console.log("original.name", original.name);

        instance = original.createInstance(`object_${Date.now()}`);

        // if (assetId === 1) `addBreakable`(instance);
        // todo make physics from object
        // instance.isPickable = true;
      }
    }

    if (assetId === -1) {
      let fullAsset = null;
      console.log("this.loadedTemplates", this.loadedTemplates);
      console.log("templateKey", templateKey);
      console.log("this.loadedTemplates[templateKey]", this.loadedTemplates[templateKey]);
      let assetIdToGet = this.loadedTemplates[templateKey];
      assetId = Number(assetIdToGet);
      console.log("searching for AssetId", assetId);

      if (window.assetsSearchResults) {
        window.assetsSearchResults.forEach((asset) => {
          if (asset.asset_id === assetId) {
            fullAsset = asset;
          }
        });
        console.log("fullAsset", fullAsset);

        //probably just need the assetId
        original = await window.ASSET_MANAGER.load(fullAsset, this.scene);

        instance = original.createInstance(`object_${Date.now()}`);
      }
    }

    console.log("instance", instance);
    console.log("original", original);

    instance.hasPhysics = true;

    // console.log("instance.scaling.x", instance.scaling.x);

    function generateUUIDv4() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
    instance.id = generateUUIDv4();

    instance.isGrabable = true;
    instance.interact = new Interact();
    instance.interact.addDefaultAction("grab");
    instance.interact.addCustomAction("toggleMaterialMenu", () => {
      console.log("toggleMaterialMenu");
    });

    // if (templateKey === "2") {
    //   instance.hasPhysics = true;
    // }

    if (original && original.prefferedScaling) {
      instance.prefferedScaling = original.prefferedScaling;
    }
    if (original && original.preffered_scale) {
      instance.preffered_scale = original.preffered_scale;
      instance.prefferedScaling = new BABYLON.Vector3(instance.preffered_scale, instance.preffered_scale, instance.preffered_scale);
    }
    console.log("instance.prefferedScaling", instance.prefferedScaling);
    console.log("instance.preffered_scale", instance.preffered_scale);

    // Get the bounding box info and adjust Y position
    instance.position = position.clone();
    // instance.scaling = new BABYLON.Vector3(5, 5, 5); // get scale for each object
    if (scale_x) {
      instance.scaling = new BABYLON.Vector3(scale_x, scale_x, scale_x); // get scale for each object
    } else {
      if (instance.preffered_scale) {
        instance.scaling = new BABYLON.Vector3(instance.preffered_scale, instance.preffered_scale, instance.preffered_scale);
      } else {
        instance.scaling = new BABYLON.Vector3(1, 1, 1); // get scale for each object
      }
    }
    // console.log("rotationQuaternionX", rotationQuaternionX);
    if (typeof dragged_rotation == "undefined" && this.previewMesh) {
      instance.rotationQuaternion.x = this.previewMesh.rotationQuaternion.x;
    } else {
      console.log("setting dragged_rotation", dragged_rotation);
      // instance.rotationQuaternion.x = rotationQuaternionX;
      instance.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(instance.rotationQuaternion.x, dragged_rotation, instance.rotationQuaternion.z);
    }

    // const boundingInfo = instance.getBoundingInfo();
    // const height =
    //   boundingInfo.boundingBox.maximumWorld.y -
    //   boundingInfo.boundingBox.minimumWorld.y;
    // instance.position.y += height / 2;

    instance.parent = this.placedParent;

    instance.isPickable = false;

    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(instance);
    }

    if (instance) {
      // Clear redo stack when new action is performed
      this.redoStack = [];

      // Add to history
      this.placedObjectsHistory.push(instance);

      // Keep only last 3 objects in history
      if (this.placedObjectsHistory.length > this.maxHistoryLength) {
        this.placedObjectsHistory.shift();
      }
    }

    // if (assetId === -1) {
    // const assetIdJustInCase = BigInt(assetId);
    // const assetId = templateKey;

    // instance.assetId = assetIdJustInCase;
    // } else {
    // instance.assetId = assetId;
    // }
    if (original && original.material_type === "lightray") {
      instance.hasPhysics = false;
    }

    console.log("original", original);
    if (original && original.material_type === "leaves") {
      instance.applyFog = false;
      console.log("setting applyFog to false");
    }

    let templatePlacedAssetId = this.loadedTemplates[templateKey];
    if (assetId !== -1) {
      templatePlacedAssetId = assetId;
    }

    instance.assetId = templatePlacedAssetId;

    if (loadAnimation) {
      this.animateLoadIn(instance, 500); // 30 frames = 0.5s at 60fps
    }

    // Setting up physics and interactable for objects loaded in from streamer, isntead of placed by player
    if (assetId !== -1) {
      console.log("setting up physics and interactable for object loaded in from streamer");
      this.handleObjectAdded(instance);
    }
    // console.log("instance.scaling.x", instance.scaling.x);
    console.log("instance from addObjectAtLocation", instance);
    console.log("instance.hasPhysics", instance.hasPhysics);
    return instance;
  }

  async addBreakable(instance) {
    // Add breakable barrel functionality when assetId is 0
    // Load the fractured barrel prefab if not already loaded
    const loadResult = await BABYLON.SceneLoader.ImportMeshAsync("", "/assets/env/objects/barrel/", "barrel_breakable.glb", this.scene);

    // TODO make this cached
    // const loadResult = await BABYLON.SceneLoader.ImportMeshAsync("", "/assets/env/objects/barrel/", "barrel_breakable.glb", this.scene);
    // instance.breakable_file_path
    // "/assets/env/objects/barrel/barrel_breakable.glb"

    const fracturedPrefabRoot = loadResult.meshes[0];

    // Fix negative scaling if needed
    if (fracturedPrefabRoot.scaling.z < 0) {
      fracturedPrefabRoot.scaling.z *= -1;
      fracturedPrefabRoot.rotate(BABYLON.Vector3.Up(), Math.PI);
    }

    // Add break functionality to the instance
    instance.isInteractable = true;
    instance.break = true;
    instance.fracturedPrefabRoot = fracturedPrefabRoot;

    let position = instance.position.clone();

    // Add the breakBarrel method to the instance
    instance.breakBarrel = (mesh, fracturedPrefab, scene, position, explosionForce = 10) => {
      mesh.setEnabled(false);

      const fracturedRoot = fracturedPrefab.clone("fractured_barrel", null);
      fracturedRoot.setEnabled(true);
      fracturedRoot.scaling = mesh.scaling.clone();
      fracturedRoot.rotationQuaternion = mesh.rotationQuaternion?.clone() ?? BABYLON.Quaternion.Identity();
      fracturedRoot.position.copyFrom(position);
      fracturedRoot.isPickable = false;

      const pieces = fracturedRoot.getChildMeshes();
      pieces.forEach((piece) => {
        if (!piece.name.toLowerCase().includes("breakable")) {
          piece.setEnabled(false);
        } else {
          piece.material.backFaceCulling = false;
          const pieceAggregate = new BABYLON.PhysicsAggregate(piece, BABYLON.PhysicsShapeType.CONVEX_HULL, { mass: 1, restitution: 0.1, friction: 0.5 }, scene);
          pieceAggregate.body.setGravityFactor(15);
          piece.position.copyFrom(mesh.position);
          piece.setEnabled(true);

          const randomDir = new BABYLON.Vector3(Math.random() * 2 - 1, Math.random() * 2, Math.random() * 2 - 1);
          pieceAggregate.body.applyImpulse(randomDir.scale(explosionForce), piece.getAbsolutePosition());

          setTimeout(() => {
            pieceAggregate.dispose();
            piece.dispose();
          }, 60000);
        }
      });
    };

    let barrelEnemy = createEnemyWithPosition(instance, 10, new BABYLON.Vector3(instance.position.x, instance.position.y, instance.position.z), this.scene);
    PLAYER.target = barrelEnemy;
    console.log("adding breakable");

    // Set up the barrel as an enemy with health
    instance.name = "enemy";
    // instance.isPickable = false;
    // BABYLON.Tags.EnableFor(instance);
    // instance.addTags("health");

    // // Add physics aggregate for the barrel
    // let enemyAggregate = new BABYLON.PhysicsAggregate(instance, BABYLON.PhysicsShapeType.CONVEX_HULL, { mass: 0, restitution: 0.0, friction: 0.5 }, this.scene);
    // instance.enemyAggregate = enemyAggregate;

    // // Override the break function to handle physics and health
    instance.break = (amount) => {
      // instance.enemyAggregate.dispose();
      instance.dispose();
      instance.breakBarrel(instance, instance.fracturedPrefabRoot, this.scene, position, amount);
    };

    // // Add health component with 10 HP (same as in lava.js)
    let health = new Health("EnemySimple", 10, instance);
    instance.health = health;
    return instance;
  }

  getPickInfo() {
    return this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => mesh === this.mesh, true);
  }

  getInteractInfo() {
    // get list of npcs to do this with
    // const mesh = this.scene.getMeshByName('npc');
    let pick = null;
    // if (mesh !== null) {
    // mesh.isPickable = true;

    // pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY);

    // pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => mesh.name.startsWith("npc"), true);
    // maybe do mesh.isInteractable instead
    pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => mesh.isInteractable, true);
    // mesh.isPickable = false;
    // }

    return pick;
  }

  applyCurrentTool(pickInfo) {
    const tools = {
      raise: this.raise,
      lower: this.lower,
      flatten: this.flatten,
      paint: this.paintOnTerrain,
      lighting: this.paintOnTerrainLighting,
      grass: this.placeGrass,
      adventure: function () {},
      view: function () {},
      npc: async function (pickInfo) {
        console.log("npc");
        console.log("pickInfo", pickInfo);
        // Prevent spawning too many NPCs at once
        if (pickInfo && pickInfo.pickedPoint) {
          if (!this.lastNPCSpawnTime || Date.now() - this.lastNPCSpawnTime > 100) {
            console.log("npc", this.currentNPCData);
            console.log("pickInfo.pickedPoint", this.currentNPCData.id);
            await NPCPools.getInstance().addNPC(this.currentNPCData.id, pickInfo.pickedPoint);
            this.lastNPCSpawnTime = Date.now();
            this.scene.activeCamera.sound.play("Thunk", "sfx");
          }
        }

        // if (pickInfo && pickInfo.pickedPoint) {
        // await NPCPools.getInstance().addNPC("guard", pickInfo.pickedPoint);
        // }
      },
    };
    if (typeof this.currentTool === "undefined") {
      this.currentTool = "adventure";
    }
    tools[this.currentTool].call(this, pickInfo);
  }

  initialize(width, depth, subdivisions) {
    // Create single ground mesh
    this.mesh = BABYLON.MeshBuilder.CreateGround(
      "terrain",
      {
        width: width,
        height: depth,
        subdivisions: subdivisions,
      },
      this.scene
    );
    let gridConfig = {
      gridSize: 19,
    };

    // Initialize vertex colors - set default color for all vertices
    const positions = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const vertexCount = positions.length / 3;
    const colors = new Array(vertexCount * 4);

    for (let i = 0; i < vertexCount; i++) {
      const colorIndex = i * 4;
      colors[colorIndex] = 0.7; // R
      colors[colorIndex + 1] = 0.7; // G
      colors[colorIndex + 2] = 0.7; // B
      colors[colorIndex + 3] = 1.0; // A
    }

    this.mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);

    // Setup shader material
    // const terrainMaterial = new BABYLON.ShaderMaterial(
    //   "terrain",
    //   this.scene,
    //   {
    //     vertex: "/shaders/env/terrain/slope_blender_terrain",
    //     fragment: "/shaders/env/terrain/slope_blender_terrain",
    //   },
    //   {
    //     attributes: ["position", "normal", "uv", "color"],
    //     uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "time", "viewProjection"],
    //   }
    // );

    // // Setup textures
    // terrainMaterial.setTexture("grassTexture", new BABYLON.Texture("/assets/textures/terrain/darkgrass.png", this.scene));
    // terrainMaterial.setTexture("rockTexture", new BABYLON.Texture("assets/textures/terrain/rock.png", this.scene));
    // // terrainMaterial.setTexture(
    // //   "pathTexture",
    // //   new BABYLON.Texture("assets/textures/terrain/floor.png", this.scene)
    // // );
    // terrainMaterial.setTexture("transitionTexture", new BABYLON.Texture("assets/textures/terrain/terrainMask.png", this.scene));
    // terrainMaterial.setFloat("slopeThreshold", 0.05);
    // terrainMaterial.setFloat("transitionSmoothness", 0.9);
    // terrainMaterial.setFloat("transitionExtent", 0.1);
    // terrainMaterial.setVector2("grassScale", new BABYLON.Vector2((7 * gridConfig.gridSize) / 19, (7 * gridConfig.gridSize) / 19));
    // terrainMaterial.setVector2("rockScale", new BABYLON.Vector2((6 * gridConfig.gridSize) / 19, (6 * gridConfig.gridSize) / 19));
    // terrainMaterial.setVector2("transitionScale", new BABYLON.Vector2((19 * gridConfig.gridSize) / 19, (19 * gridConfig.gridSize) / 19));

    // const terrainMaterial2 = new BABYLON.StandardMaterial("terrainMaterial", this.scene);
    // terrainMaterial2.diffuseTexture = new BABYLON.Texture("/assets/textures/terrain/floor.png", this.scene);

    // // Optional but recommended settings for terrain textures
    // terrainMaterial2.diffuseTexture.uScale = 300; // Adjust the texture tiling in U direction
    // terrainMaterial2.diffuseTexture.vScale = 300; // Adjust the texture tiling in V direction
    // terrainMaterial2.specularColor = new BABYLON.Color3(0.0, 0.0, 0.0); // Reduce specular highlights
    // terrainMaterial2.backFaceCulling = false; // E
    // terrainMaterial2.specularPower = 128;
    // terrainMaterial2.diffuseIntensity = 3;
    this.mesh.receiveShadows = true;

    this.fromHeightMap();

    this.initializeSplatmapCanvas();
    this.currentSplatColor = "rgba(0, 255, 0, 0.5)";
    this.textureBrushRadius = 0.5; // brush size in pixels

    // this.mesh.material = terrainMaterial2;
    this.updatePhysics(); // Add physics after initialization
    this.scene.physicsEnabled = true;

    // Create surrounding terrain copies
  }

  createSurroundingTerrain(width, depth) {
    // Positions for 8 surrounding terrain pieces (relative to center)
    const positions = [
      [-1, -1],
      [0, -1],
      [1, -1], // Top row
      [-1, 0],
      [1, 0], // Middle row
      [-1, 1],
      [0, 1],
      [1, 1], // Bottom row
    ];

    this.surroundingTerrain = positions.map((pos, index) => {
      const terrainCopy = this.mesh.clone(`terrain_copy_${index}`);

      // Position the terrain copy
      terrainCopy.position.x = pos[0] * width;
      terrainCopy.position.z = pos[1] * depth;
      terrainCopy.position.y = -1030.05;
      terrainCopy.computeWorldMatrix(true);
      terrainCopy.refreshBoundingInfo();
      terrainCopy.backFaceCulling = false;

      // Apply the same material as the main terrain
      terrainCopy.material = this.mesh.material;
      terrainCopy.alwaysSelectAsActiveMesh = true;
      // this.scene.activeCamera.maxZ = 500000;
      // terrainCopy.ignoreCameraMaxZ = true;

      // Add physics to the copy if needed
      new BABYLON.PhysicsAggregate(terrainCopy, BABYLON.PhysicsShapeType.MESH, { mass: 0, restitution: 0.0, friction: 1000000000.8 }, this.scene);

      return terrainCopy;
    });
  }

  getMesh() {
    return this.mesh;
  }

  fromHeightMap() {
    const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
      "ground",
      "assets/textures/terrain/hieghtMapTileFixed.png",
      {
        width: 10000,
        height: 10000,
        subdivisions: 100,
        minHeight: 0,
        maxHeight: 1000,
        onReady: (ground) => {
          ground.position.y = -1010.05;
          ground.material = this.mesh.material;
          ground.receiveShadows = true;

          // Update the mesh reference to use this ground
          if (this.mesh) {
            this.mesh.dispose();
          }
          this.mesh = ground;
          this.mesh.material = this.splatmapToMaterial;
          // Add physics
          this.updatePhysics();

          this.createSurroundingTerrain(10000, 10000);
        },
      },
      this.scene
    );

    // Alternatively, we can use setTimeout to ensure the operation completes
    setTimeout(() => {
      if (ground) {
        // console.log("Extending heightmap loading timeout...");
        // Force completion or provide fallback if needed
        // const chunkSize = 32;
        // ground.optimize(chunkSize);
        // ground.refreshRate = 5000000;
        ground.material.freeze();
      }
    }, 5000);
  }

  // Core editing function
  modifyTerrain(pickInfo, operation) {
    if (!pickInfo.hit) return;

    const positions = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const vertexCount = positions.length / 3;
    const currentPoint = pickInfo.pickedPoint;

    // Clear previous dirty regions
    this.dirtyRegions.clear();

    // Modify vertices within brush radius
    for (let i = 0; i < vertexCount; i++) {
      const vertexPosition = new BABYLON.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);

      const distance = BABYLON.Vector3.Distance(vertexPosition, currentPoint);
      if (distance < this.brushSize) {
        operation(positions, i);
        this.dirtyRegions.add(i);
      }
    }

    // Update mesh data
    this.updateMesh(positions);
  }

  // Update mesh with new data
  updateMesh(positions) {
    // Compute new normals
    const normals = [];
    BABYLON.VertexData.ComputeNormals(positions, this.mesh.getIndices(), normals, {
      useRightHandedSystem: true,
    });

    // Update mesh data
    this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions, true);
    this.mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
    this.mesh.refreshBoundingInfo();
    this.mesh.convertToFlatShadedMesh();
    this.mesh.refreshBoundingInfo();
    this.mesh.markAsDirty();
  }

  // Editing operations
  raise(pickInfo) {
    this.modifyTerrain(pickInfo, (positions, i) => {
      positions[i * 3 + 1] += this.strength;
    });
    this.updateBrushPosition(pickInfo);
  }

  lower(pickInfo) {
    this.modifyTerrain(pickInfo, (positions, i) => {
      positions[i * 3 + 1] -= this.strength;
    });
    this.updateBrushPosition(pickInfo);
  }

  flatten(pickInfo) {
    const targetHeight = pickInfo.pickedPoint.y;
    this.modifyTerrain(pickInfo, (positions, i) => {
      positions[i * 3 + 1] = targetHeight;
    });
    this.updateBrushPosition(pickInfo);
  }

  // Data handling
  serialize() {
    return {
      positions: this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind),
      colors: this.mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind),
      metadata: {
        width: this.mesh.width,
        height: this.mesh.height,
        subdivisions: this.mesh.subdivisions,
      },
    };
  }

  deserialize(data) {
    this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, data.positions);
    if (data.colors) {
      this.mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, data.colors);
    }
    this.updateMesh(data.positions);
    this.updatePhysics(); // Add physics after loading
  }

  // Storage methods
  saveToLocalStorage(name) {
    localStorage.setItem(name, JSON.stringify(this.serialize()));
  }

  loadFromLocalStorage(name) {
    const data = JSON.parse(localStorage.getItem(name));
    if (data) this.deserialize(data);
  }

  exportToFile(filename = "terrain.json") {
    const blob = new Blob([JSON.stringify(this.serialize())], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importFromFile(file) {
    const text = await file.text();
    this.deserialize(JSON.parse(text));
  }

  updatePhysics() {
    // Dispose of existing physics aggregate if it exists
    if (this.physicsAggregate) {
      this.physicsAggregate.dispose();
    }

    // Create new physics aggregate
    this.physicsAggregate = new BABYLON.PhysicsAggregate(this.mesh, BABYLON.PhysicsShapeType.MESH, { mass: 0, restitution: 0.0, friction: 1000000000.8 }, this.scene);
  }

  // Add this method to update brush position
  updateBrushPosition(pickInfo) {
    if (!pickInfo.hit) {
      // this.brushIndicator.setEnabled(false);
      return;
    }

    this.brushIndicator.setEnabled(true);
    this.brushIndicator.position = pickInfo.pickedPoint;
    this.brushIndicator.position.y += 0.5; // Small offset to prevent z-fighting
  }

  undo() {
    if (this.placedObjectsHistory.length > 0) {
      const lastObject = this.placedObjectsHistory.pop();

      // Clean up physics before hiding the object
      if (lastObject.physicsBody) {
        lastObject.physicsBody.dispose();
      }
      this.redoStack.push(lastObject);
      lastObject.setEnabled(false); // Hide the object instead of disposing
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const objectToRestore = this.redoStack.pop();
      this.placedObjectsHistory.push(objectToRestore);
      objectToRestore.setEnabled(true); // Show the object again
    }
  }

  updateTemplatePositions() {
    const templateKeys = Object.keys(this.objectTemplates);
    const canvasWidth = this.scene.getEngine().getRenderWidth();
    const spacing = canvasWidth * 0.001;

    templateKeys.forEach((key, index) => {
      const template = this.objectTemplates[key];

      // Only update the x position
      const xOffset = (index - (templateKeys.length - 1) / 2) * spacing;
      template.position.x = xOffset;
    });
  }

  dispose() {
    window.removeEventListener("resize", () => this.updateTemplatePositions());
  }

  setupTemplatePreview() {
    const camera = this.scene.activeCamera;
    const templateKeys = Object.keys(this.objectTemplates);
    const canvasWidth = this.scene.getEngine().getRenderWidth();
    const spacing = canvasWidth * 0.001;
    const bottomOffset = -4; // Distance below camera
    // const templateScale = 0.1; // Scale for the template previews - for smaller
    const templateScale = 0.02; // Scale for the template previews - alrger
    const partsTemplateScale = 0.3; // Scale for the template previews - alrger

    // Two lists
    // 1 Has all loaded assets by asset id
    // 2 Has all templatesInHotbar = [assetid = 1, assetid = 2, assetid = 3, assetid = 4]

    this.visualTemplates = [1, 2, 3, 4];

    // hide all unsed hotbar templates
    // templateKeys.forEach((key, index) => {
    //   const template = this.objectTemplates[key];
    //   template.isVisible = false;
    //   template.isPickable = false;
    // });

    // Object.values(this.objectTemplates).forEach((mesh) => mesh.dispose());
    // this.objectTemplates = {};

    // if (templateKeys.length > 3) {
    //   return;
    // }
    // console.log("templateKeys", templateKeys);

    // clear out all old templates
    // set enabled false all old templates

    // this.loadedTemplates.forEach((template) => {
    //   template.dispose();
    // });
    // this.loadedTemplates = [];

    templateKeys.forEach((key, index) => {
      const template = this.objectTemplates[key];

      // template.setEnabled(false);
      template.setEnabled(true);
      template.isPickable = false;

      // Position relative to center
      const xOffset = (index - (templateKeys.length - 1) / 2) * spacing;
      template.position = new BABYLON.Vector3(xOffset, bottomOffset, 12);

      // Scale down the template
      template.scaling = new BABYLON.Vector3(templateScale, templateScale, templateScale);
      if (template.asset_id !== undefined) {
        if (template.asset_id === 8 || template.asset_id === 9 || template.asset_id === 10) {
          //Old Sizes from treepacked
          template.scaling = new BABYLON.Vector3(templateScale, templateScale, templateScale);
        } else {
          template.scaling = new BABYLON.Vector3(partsTemplateScale, partsTemplateScale, partsTemplateScale);
        }
      }

      // Parent to camera
      template.parent = camera;
    });
  }

  toggleTemplateVisibility(show) {
    if (MODE === 1) {
      return;
    }
    const mainMenu = document.querySelector("#mainMenu");
    const templateMenu = document.querySelector("#templateMenu");

    if (mainMenu && templateMenu) {
      if (show) {
        // Fade out main menu
        mainMenu.style.opacity = "0";
        mainMenu.style.transform = "translateY(20px)";

        setTimeout(() => {
          mainMenu.style.display = "none";
          templateMenu.style.display = "block";
          // Trigger template menu animation
          setTimeout(() => {
            templateMenu.style.opacity = "1";
            templateMenu.style.transform = "translateY(0)";
          }, 50);
        }, 100);
      } else {
        // Fade out template menu
        templateMenu.style.opacity = "0";
        templateMenu.style.transform = "translateY(20px)";

        setTimeout(() => {
          templateMenu.style.display = "none";
          mainMenu.style.display = "block";
          // Trigger main menu animation
          setTimeout(() => {
            mainMenu.style.opacity = "1";
            mainMenu.style.transform = "translateY(0)";
          }, 50);
        }, 100);
      }
    }
    Object.values(this.objectTemplates).forEach((template) => {
      // if (this.visualTemplates.includes(template.asset_id)) {
      template.isVisible = show;
      // }
    });
  }
  setBrushSize(radius) {
    this.textureBrushRadius = radius;
    this.selectionRadius = radius * 0.008;
    this.edgeSoftness = radius * 0.0146;
  }

  createSaveLoadButtons() {
    // Create main UI container
    const uiContainer = document.createElement("div");
    uiContainer.style.position = "fixed";
    uiContainer.style.zIndex = "1000";
    uiContainer.style.padding = "20px";
    uiContainer.style.display = "flex";
    uiContainer.style.flexDirection = "column";
    uiContainer.style.gap = "15px";

    // uiContainer.style.background = "rgba(0, 0, 0, 0.7)";
    uiContainer.style.borderRadius = "10px";
    uiContainer.style.transition = "all 0.2s ease";

    // Create mobile FAB menu
    const fabMenu = document.createElement("div");
    fabMenu.style.position = "fixed";
    fabMenu.style.bottom = "20px";
    fabMenu.style.right = "20px";
    fabMenu.style.display = "none";
    fabMenu.style.flexDirection = "column-reverse";
    fabMenu.style.gap = "10px";
    fabMenu.style.zIndex = "1001";
    fabMenu.style.overflowY = "scroll";
    // fabMenu.style.overflowX = "hidden";
    fabMenu.style.maxHeight = "91vh";
    // fabMenu.style.maxHeight = "80vh"; // Add max height constraint
    // fabMenu.style.overflowY = "auto"; // Enable vertical scrolling
    fabMenu.style.overscrollBehavior = "contain"; // Prevent page scroll while menu scrolls
    // fabMenu.style.paddingBottom = "80px"; // Add padding for FAB button
    fabMenu.style.scrollbarWidth = "none";

    // Create main FAB button
    const mainFab = document.createElement("button");
    mainFab.innerHTML = "🎨";
    mainFab.style.width = "60px";
    mainFab.style.height = "60px";
    mainFab.style.borderRadius = "50%";
    mainFab.style.border = "none";
    mainFab.style.backgroundColor = "#000";
    mainFab.style.color = "white";
    mainFab.style.fontSize = "24px";
    mainFab.style.cursor = "pointer";
    mainFab.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    mainFab.style.transition = "transform 0.3s";
    mainFab.style.padding = "10px";
    mainFab.id = "mainFab";

    // Create menu items container
    const menuItems = document.createElement("div");
    menuItems.style.display = "none";
    menuItems.style.flexDirection = "column";
    menuItems.style.gap = "10px";
    menuItems.style.transition = "all 0.3s";
    menuItems.style.overflowY = "auto"; // Enable vertical scrolling
    // menuItems.style.maxHeight = "calc(80vh - 80px)"; // Account for FAB button height
    menuItems.style.scrollbarWidth = "thin"; // Slim scrollbar for Firefox
    menuItems.style.scrollbarColor = "rgba(255,255,255,0.3) transparent"; // Scrollbar color for Firefox
    menuItems.style.padding = "10px";
    // menuItems.style.sc    scrollbar-width: none;

    // Add webkit scrollbar styles
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      #${menuItems.id}::-webkit-scrollbar {
        width: 5px;
      }
      #${menuItems.id}::-webkit-scrollbar-track {
        background: transparent;
      }
      #${menuItems.id}::-webkit-scrollbar-thumb {
        background-color: rgba(255,255,255,0.3);
        border-radius: 3px;
      }
    `;
    document.head.appendChild(styleSheet);

    fabMenu.addEventListener("mouseout", () => {
      // console.log("left");
      // toggleMenu(isOpen);
      setTimeout(() => {
        alreadyOver = false;
      }, 1500);
    });

    // Create menu items
    let items = [
      {
        icon: "",
        image: "/assets/textures/terrain/icons/options_icon.png",
        tool: "options",
        label: "Options",
        subIcons: [
          {
            image: "/assets/textures/terrain/icons/effects_icon.png",
            tool: "lighting",
            handler: () => this.saveScene(),
          },
          {
            image: "/assets/textures/terrain/icons/save_icon.png",
            tool: "save",
            handler: () => this.saveScene(),
          },
          {
            image: "/assets/textures/terrain/icons/load_icon.png",
            tool: "load",
            handler: () => this.loadScene(),
          },
          {
            image: "/assets/textures/terrain/icons/multiplayer.png",
            tool: "multiplayer",
            handler: () => (this.multiplayerBrowser.style.display = "flex"),
          },
        ],
        // handler: () => this.saveScene(),
      },
      {
        icon: "",
        image: "/assets/textures/terrain/icons/edit.png",
        tool: "edit",
        label: "Edit",
        handler: () => (MODE = 2),
      },

      // {
      //   icon: "🎨",
      //   image: "/assets/textures/terrain/icons/multiplayer.png",
      //   tool: "multiplayer",
      //   label: "Multiplayer",
      //   handler: () => (this.multiplayerBrowser.style.display = "flex"),
      //   //when pressing this button give the option to connect to channels.  save your world will be overwritten with the current multiplayer state (no undo)
      // },

      {
        icon: "👤",
        image: "/assets/textures/terrain/icons/npcn.png",
        tool: "npc",
        label: "NPC",
        subIcons: [
          {
            image: "/assets/textures/terrain/grass_01_dark.png",
            tool: "npc",
            handler: () => (this.currentNPCData = NPC_DATA["guard"]),
          },
          {
            image: "/assets/textures/terrain/rock.png",
            tool: "rock_paint",
            handler: () => (this.currentNPCData = NPC_DATA["wolf"]),
          },
        ],
      },

      {
        icon: "🌿",
        image: "/assets/textures/terrain/icons/grass.png",
        tool: "grass",
        label: "Grass",
      },
      {
        icon: "🖌️",
        image: "/assets/textures/terrain/icons/terrain.png",
        tool: "paint",
        label: "Terrain",
        subIcons: [
          {
            image: "/assets/textures/terrain/grass_01_dark.png",
            tool: "grass_paint",
            handler: () => (this.currentSplatColor = "rgba(0, 255, 0, 0.5)"),
          },
          {
            image: "/assets/textures/terrain/rock.png",
            tool: "rock_paint",
            handler: () => (this.currentSplatColor = "rgba(255, 0, 0, 0.5)"),
          },
          {
            image: "/assets/textures/terrain/floor.png",
            tool: "path_paint",
            handler: () => (this.currentSplatColor = "rgba(0, 0, 255, 0.5)"),
          },
        ],
      },

      {
        icon: "🎨",
        image: "/assets/textures/terrain/icons/objects.png",
        tool: "objects",
        label: "Objects",
        // subIcons: [
        //   {
        //     image: "/assets/textures/terrain/icons/undo.png",
        //     tool: "undo",
        //     handler: () => this.undo(),
        //   },
        //   {
        //     image: "/assets/textures/terrain/icons/redo.png",
        //     tool: "redo",
        //     handler: () => this.redo(),
        //   },
        //   {
        //     image: "/assets/textures/terrain/icons/search.png",
        //     tool: "search",
        //     label: "Search",
        //   },
        // ],
        subIcons: [
          {
            image: "/assets/textures/terrain/icons/search.png",
            tool: "search",
            handler: () => {
              const assetBrowser = document.getElementById("assetBrowser");
              if (assetBrowser) {
                assetBrowser.style.display = "flex";
              }
            },
          },
        ],
      },
      // add effects, for lighting atmosphere

      // {
      // icon: "💾",
      // image: "/assets/textures/terrain/icons/objects.png",
      // tool: "save",
      // label: "Save",
      // },

      // {
      //   icon: "🎨2",
      //   image: "/assets/textures/terrain/icons/objects.png",
      //   tool: "options2",
      //   label: "Options2",
      // },

      {
        icon: "🏃‍♂️",
        image: "/assets/textures/terrain/icons/adventure.png",
        tool: "adventure",
        label: "Adventure",
      },
    ];

    const itemsAdventure = [
      {
        icon: "",
        image: "/assets/textures/terrain/icons/options_icon.png",
        tool: "options",
        label: "Options",
        subIcons: [
          {
            image: "/assets/textures/terrain/icons/save_icon.png",
            tool: "save",
            handler: () => this.saveScene(), //Save game instead, or maybe its all one
          },
          {
            image: "/assets/textures/terrain/icons/load_icon.png",
            tool: "load",
            handler: () => this.loadScene(),
          },
          {
            image: "/assets/textures/terrain/icons/multiplayer.png",
            tool: "multiplayer",
            handler: () => (this.multiplayerBrowser.style.display = "flex"),
          },
        ],
        // handler: () => this.saveScene(),
      },

      {
        icon: "🏃‍♂️",
        image: "/assets/textures/terrain/icons/adventure.png",
        tool: "adventure",
        label: "Adventure",
      },
    ];

    // Create main FAB button with background image
    mainFab.innerHTML = "";
    mainFab.style.width = "70px";
    mainFab.style.height = "70px";
    mainFab.style.backgroundImage = `url(/assets/textures/terrain/icons/Tools.png)`;
    mainFab.style.backgroundSize = "86%";
    mainFab.style.backgroundPosition = "4px 0px";
    mainFab.style.borderRadius = "10px";
    mainFab.style.margin = "10px";
    // mainFab.onclick = () => toggleMenu(!isOpen);
    // For mobile, handle tap/click
    // mainFab.onclick = () => {
    // if (window.innerWidth <= 1050) {
    // Only handle taps on mobile
    // toggleMenu(!isOpen);
    // }
    // };

    let alreadyOver = false;
    mainFab.addEventListener("mouseover", () => {
      mainFab.style.transform = "scale(1.2)";
      mainFab.style.filter = "brightness(1.4)";
    });

    mainFab.addEventListener("mouseenter", () => {
      if (!alreadyOver) {
        toggleMenu(!isOpen);
        alreadyOver = true;
      }
    });

    // Add touch event handlers for the main FAB
    mainFab.addEventListener("touchstart", (e) => {
      e.preventDefault(); // Prevent default touch behavior
      if (!alreadyOver) {
        toggleMenu(!isOpen);
        alreadyOver = true;
      }
    });

    mainFab.addEventListener("touchend", () => {
      setTimeout(() => {
        alreadyOver = false;
      }, 100);
    });

    mainFab.addEventListener("mouseleave", () => {
      // console.log("left");
      // toggleMenu(isOpen);
      // setTimeout(() => { alreadyOver = false; }, 1000);
    });

    mainFab.addEventListener("mouseout", () => {
      mainFab.style.transform = "scale(1)";
      mainFab.style.filter = "brightness(1)";
    });

    let isInObjectMode = false;
    let touchStartY = 0;

    // Add touch event handlers for template switching
    document.addEventListener("touchstart", (e) => {
      if (!isInObjectMode) return;
      touchStartY = e.touches[0].clientY;
    });

    document.addEventListener("touchend", (e) => {
      if (!isInObjectMode) return;

      const touchEndY = e.changedTouches[0].clientY;
      const windowHeight = window.innerHeight;

      // Only process if touch ended in bottom 20% of screen
      if (touchEndY > windowHeight * 0.8) {
        const touchX = e.changedTouches[0].clientX;
        const windowWidth = window.innerWidth;
        const numTemplates = Object.keys(this.objectTemplates).length;

        // Divide screen width into sections based on number of templates
        const sectionWidth = windowWidth / numTemplates;
        const templateIndex = Math.floor(touchX / sectionWidth) + 1;

        if (templateIndex <= numTemplates) {
          this.showObjectPreview(templateIndex.toString());
        }
      }
    });

    if (MODE === 1) {
      items = itemsAdventure;
    }
    items.forEach((item) => {
      const menuItem = document.createElement("button");
      menuItem.style.width = "70px";
      menuItem.style.height = "70px";
      menuItem.style.borderRadius = "10px";
      menuItem.style.border = "none";
      menuItem.style.backgroundColor = "#444";
      menuItem.style.backgroundImage = `url(${item.image})`;
      menuItem.style.backgroundSize = "86%";
      menuItem.style.backgroundPosition = "4px 0px";
      menuItem.style.cursor = "pointer";
      menuItem.style.opacity = "0";
      menuItem.style.transform = "scale(0.8)";
      menuItem.style.transition = "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)";
      menuItem.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
      menuItem.style.position = "relative"; // Added for sub-icons positioning

      // Remove the mouseenter/mouseleave listeners and replace with click handling
      // console.log(item.subIcons);
      if (item.subIcons) {
        const subIconContainer = document.createElement("div");
        // subIconContainer.style.position = "absolute";
        subIconContainer.style.top = "-80px";
        subIconContainer.style.left = "50%";
        // subIconContainer.style.transform = "translateX(-50%)";
        subIconContainer.style.display = "none";
        subIconContainer.style.flexDirection = "column";
        subIconContainer.style.gap = "10px";
        subIconContainer.style.padding = "10px";
        // subIconContainer.style.background = "rgba(0, 0, 0, 0.8)";
        subIconContainer.style.borderRadius = "8px";
        subIconContainer.style.zIndex = "1002";
        subIconContainer.style.marginLeft = "15px";
        subIconContainer.style.transition = "all 0.3s ease";
        subIconContainer.style.opacity = "0";
        // subIconContainer.style.transform = "translateX(-50%) translateY(10px)";
        menuItem.subMenuToShow = subIconContainer;

        item.subIcons.forEach((subIcon) => {
          const subIconBtn = document.createElement("button");
          subIconBtn.style.width = "40px";
          subIconBtn.style.height = "40px";
          subIconBtn.style.background = "black";
          subIconBtn.style.color = "black";
          subIconBtn.style.backgroundImage = `url(${subIcon.image})`;
          subIconBtn.style.backgroundSize = "cover";
          subIconBtn.style.border = "none";
          subIconBtn.style.borderRadius = "6px";
          subIconBtn.style.cursor = "pointer";
          subIconBtn.style.boxShadow = " rgba(0, 0, 0, 0.2) 0px 2px 5px";
          subIconBtn.style.transition = "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)";
          subIconBtn.style.filter = "brightness(1)";

          subIconBtn.addEventListener("mouseover", () => {
            subIconBtn.style.transform = "scale(1.2)";
            subIconBtn.style.filter = "brightness(1.4)";
          });

          subIconBtn.addEventListener("mouseout", () => {
            subIconBtn.style.transform = "scale(1)";
            subIconBtn.style.filter = "brightness(1)";
          });

          subIconBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (subIcon.handler) {
              subIcon.handler();

              this.canvas.focus();
            }

            // hideAllSubMenus();
          });

          subIconContainer.appendChild(subIconBtn);
        });

        //atach to main object button at bottom instead of the menu item
        fabMenu.appendChild(subIconContainer);
      }

      //after sub menu
      fabMenu.appendChild(menuItems);
      fabMenu.appendChild(mainFab);
      document.body.appendChild(fabMenu);

      // Add hover effect
      menuItem.addEventListener("mouseenter", () => {
        menuItem.style.transform = "scale(1.1)";
        menuItem.style.filter = "brightness(1.2)";
        menuItem.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
      });

      menuItem.addEventListener("mouseleave", () => {
        menuItem.style.transform = "scale(1)";
        menuItem.style.filter = "brightness(1)";
        menuItem.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
      });

      menuItem.onclick = () => {
        mainFab.style.backgroundImage = `url(${item.image})`;

        if (item.tool === "objects") {
          MODE = 0;
          SKILL_BAR.hideSkillBar();

          isInObjectMode = true;
          this.toggleTemplateVisibility(true);
          this.showObjectPreview("3");
          mainFab.style.backgroundImage = `url(${item.image})`;

          this.hideAllSubMenus();

          if (menuItem.subMenuToShow) {
            console.log("trying to show submenu");

            const subMenu = menuItem.subMenuToShow;
            // const isVisible = subMenu.style.display === "flex";
            // console.log(subMenu);
            // if (!isVisible) {
            subMenu.style.display = "flex";
            // Trigger animation after display is set
            setTimeout(() => {
              subMenu.style.opacity = "1";
              // subMenu.style.transform = "translateX(-50%) translateY(0)";
            }, 250);
            // } else {
            // hideSubMenu(subMenu);
            // }
          }
        } else {
          isInObjectMode = false;
          // Hide template objects when switching to other modes
          this.toggleTemplateVisibility(false);
          if (this.previewMesh) {
            this.removePreviewMesh();
          }
          this.circleColor = new BABYLON.Vector3(0.0, 0.0, 0.0);

          if (item.tool === "search") {
            const assetBrowser = document.getElementById("assetBrowser");
            if (assetBrowser) {
              assetBrowser.style.display = "flex";
            }
          } else {
            this.setTerrainTool(item.tool);
          }

          if (item.handler) {
            item.handler();
          }

          this.hideAllSubMenus();

          if (menuItem.subMenuToShow) {
            console.log("trying to show submenu");

            const subMenu = menuItem.subMenuToShow;
            // const isVisible = subMenu.style.display === "flex";
            console.log(subMenu);
            // if (!isVisible) {
            subMenu.style.display = "flex";
            // Trigger animation after display is set
            setTimeout(() => {
              subMenu.style.opacity = "1";
              // subMenu.style.transform = "translateX(-50%) translateY(0)";
            }, 250);
            // } else {
            // hideSubMenu(subMenu);
            // }
          }
        }

        toggleMenu(false);
        if (item.tool === "adventure") {
          alreadyOver = true;
        }
        this.canvas.focus();
      };

      // Add this function at the beginning of createSaveLoadButtons
      this.hideSubMenu = (subMenu) => {
        subMenu.style.opacity = "0";
        subMenu.style.display = "none";

        // subMenu.style.transform = "translateX(-50%) translateY(10px)";
        setTimeout(() => {}, 300);
      };

      this.hideAllSubMenus = () => {
        const children = menuItems.children; // This gets HTMLCollection of child elements

        for (let i = 0; i < children.length; i++) {
          if (children[i].subMenuToShow) {
            this.hideSubMenu(children[i].subMenuToShow);
          }
        }
      };

      menuItems.appendChild(menuItem);
    });

    let isOpen = false;
    const toggleMenu = (open) => {
      isOpen = open;
      mainFab.style.transform = open ? "rotate(45deg)" : "rotate(0)";
      if (open) {
        mainFab.style.display = "none";
        this.hideAllSubMenus();
      }
      // mainFab.style.display = open ? "none" : "block";
      menuItems.style.display = "flex";

      Array.from(menuItems.children)
        .reverse()
        .forEach((item, i) => {
          // Stagger the animations slightly
          setTimeout(
            () => {
              item.style.transition = "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)";
              if (open) {
                item.style.opacity = "1";
                item.style.transform = "scale(1)";
                item.style.filter = "brightness(1)";
              } else {
                item.style.opacity = "0";
                item.style.transform = "scale(0.8)";
                item.style.filter = "brightness(1.2)";
              }
            },
            open ? i * 0 : (menuItems.children.length - i - 1) * 25
          );
        });

      // Hide menu container after fade out
      if (!open) {
        setTimeout(() => {
          menuItems.style.display = "none";
          mainFab.style.display = "block";
          // }, 50);
        }, menuItems.children.length * 25 + 0);
      }
    };

    // Create main menu and template menu
    const mainMenu = this.createMenuContainer();
    const templateMenu = this.createTemplateContainer();

    // Position UI based on screen size
    const updateLayout = () => {
      if (window.innerWidth <= 1050) {
        // Mobile
        // uiContainer.style.right = "10px";
        // uiContainer.style.top = "50%";
        // uiContainer.style.transform = "translateY(-50%)";
        // buttonContainer.style.flexDirection = "column";
        // buttonContainer.style.alignItems = "flex-end";
        // utilityContainer.style.flexDirection = "column";
        // utilityContainer.style.alignItems = "flex-end";
        // numberGrid.style.gridTemplateColumns = "1fr";
        // mainMenu.style.backgroundImage = "none";
        // mainMenu.style.width = "385px";
        uiContainer.style.transform = "scale(0.75) translateX(-66%)";

        uiContainer.style.bottom = "0px";
        fabMenu.style.display = "block"; // Show FAB menu
        uiContainer.style.display = "none"; // Hide main UI
      } else {
        // Desktop
        uiContainer.style.left = "50%";
        uiContainer.style.transform = "translateX(-50%)";
        // uiContainer.style.height = "100px";
        buttonContainer.style.flexDirection = "row";
        buttonContainer.style.alignItems = "center";

        numberGrid.style.gridTemplateColumns = "repeat(3, 1fr)";
        uiContainer.style.bottom = "0px";
        fabMenu.style.display = "block"; // Hide FAB menu
        uiContainer.style.display = "flex"; // Show main UI
      }
    };
    if (MODE === 1) {
      mainMenu.style.display = "none";
    }
    document.body.appendChild(uiContainer);

    uiContainer.appendChild(mainMenu);
    uiContainer.appendChild(templateMenu);
    templateMenu.style.display = "none";

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.transition = "all 0.2s ease";
    buttonContainer.style.height = "135px";
    buttonContainer.style.left = "35px";
    buttonContainer.style.top = "27px";
    buttonContainer.style.position = "relative";

    mainMenu.appendChild(buttonContainer);

    // Create main menu buttons with submenu support
    const menuButtons = [
      { text: "🎨 Objects", tool: "objects" },
      {
        text: "🖌️ Textures",
        submenu: [
          { text: "🌱 Paint Grass", tool: "paint", color: "rgba(0, 255, 0, 0.5)" },
          { text: "🪨 Paint Rock", tool: "paint", color: "rgba(255, 0, 0, 0.5)" },
          { text: "🛣️ Paint Path", tool: "paint", color: "rgba(0, 0, 255, 0.5)" },
        ],
      },
      {
        text: "💡 Lighting",
        submenu: [
          { text: "☀️ Bright", tool: "lighting", color: "rgba(255, 255, 255, 1)" },
          { text: "🌙 Dark", tool: "lighting", color: "rgba(0, 0, 0, 1)" },
          { text: "🌅 Ambient", tool: "lighting", color: "rgba(128, 128, 128, 1)" },
        ],
      },
      { text: "🌿 Grass", tool: "grass" },
      { text: "👤 NPC", tool: "npc" },
      { text: "💧 Skill", tool: "skill" },
    ];

    // Function to create and position submenu
    const createSubmenu = (parentButton, items) => {
      const submenu = document.createElement("div");
      submenu.id = "TerrainSubMenu";
      submenu.style.position = "relative";
      submenu.style.display = "none";
      submenu.style.flexDirection = "column"; // Changed to column for stacked submenus
      submenu.style.gap = "15px";
      submenu.style.background = "rgba(0, 0, 0, 0.9)";

      submenu.style.backgroundImage = "url(/assets/textures/terrain/icons/bar_background.png)";
      submenu.style.backgroundSize = "280px 385px";
      submenu.style.padding = "15px";
      submenu.style.borderRadius = "8px";
      submenu.style.zIndex = "1001";
      submenu.style.transition = "all 0.2s ease";
      submenu.style.transform = "translateY(10%) scale(0.95)";
      submenu.style.opacity = "0";
      submenu.style.width = "280px";
      submenu.style.height = "242px";

      submenu.classList.add("submenu");

      // Create two sections: Terrain Textures and Lighting
      const createSection = (title) => {
        const section = document.createElement("div");
        section.style.display = "none";
        section.style.flexDirection = "column";
        section.style.gap = "10px";

        const header = document.createElement("div");
        header.textContent = title;
        header.style.color = "white";
        header.style.fontWeight = "bold";
        header.style.marginBottom = "10px";

        // section.appendChild(header);
        return section;
      };

      const textureSection = createSection("Terrain Textures");
      const lightingSection = createSection("Terrain Lighting");

      // Create section toggle buttons
      const buttonContainer = document.createElement("div");
      buttonContainer.style.display = "flex";
      buttonContainer.style.gap = "10px";
      buttonContainer.style.marginBottom = "10px";

      const createToggleButton = (text, targetSection, otherSection) => {
        const button = document.createElement("button");
        button.textContent = text;
        button.style.padding = "8px 15px";
        button.style.border = "none";
        button.style.borderRadius = "4px";
        button.style.backgroundColor = "#000";
        button.style.display = "flex";

        // button.style.background = `url("./test metal 2.jpg"), linear-gradient(to bottom, #462523 0%, #e68b00 22%, #f6e27a 45%, #f4d86c 50%, #f6e27a 55%, #cb9b51 78%, #462523 100%)`;

        // button.style.position = "relative";
        // textSpan.style.webkitTextStroke = "1px #ffedde2b";
        // button.style.backgroundBlendMode = "overlay";
        // button.style.backgroundSize = "50px 30px";
        // button.style.webkitBackgroundClip = "text";
        // button.style.webkitTextFillColor = "transparent";
        // button.style.display = "inline-block";

        button.style.color = "#e68b00";
        button.style.cursor = "pointer";
        button.style.transition = "all 0.2s ease";

        // Create background image div for the button
        const buttonBackground = document.createElement("div");
        buttonBackground.style.position = "absolute";
        buttonBackground.style.top = "0";
        buttonBackground.style.left = "0";
        buttonBackground.style.width = "100%";
        buttonBackground.style.height = "100%";
        buttonBackground.style.backgroundImage = "url('/assets/textures/terrain/icons/button_blank.png')";
        buttonBackground.style.backgroundSize = "cover";
        buttonBackground.style.backgroundPosition = "center";
        buttonBackground.style.borderRadius = "4px";
        buttonBackground.style.zIndex = "-1";

        // Add the background to the button
        button.style.position = "relative";
        button.appendChild(buttonBackground);

        button.onclick = () => {
          targetSection.style.display = "flex";
          otherSection.style.display = "none";
          button.style.backgroundColor = "rgb(0, 0, 0)";
          button.style.transform = "scale(1.05)";
          const otherButton = button.nextElementSibling || button.previousElementSibling;
          otherButton.style.backgroundColor = "#000000";
          otherButton.style.transform = "scale(1)";

          // Set terrain tool based on which section is being shown
          if (text === "Textures") {
            this.setTerrainTool("paint");
          } else if (text === "Lighting") {
            this.setTerrainTool("lighting");
            // Update circle color based on current brightness
            this.circleColor = new BABYLON.Vector3(0.5 + this.brightnessSliderValue * 0.01, 0.5 + this.brightnessSliderValue * 0.01, 0.5 + this.brightnessSliderValue * 0.01);
          }
        };

        return button;
      };

      buttonContainer.appendChild(createToggleButton("Textures", textureSection, lightingSection));
      buttonContainer.appendChild(createToggleButton("Lighting", lightingSection, textureSection));
      submenu.appendChild(buttonContainer);

      // Set initial state to textures
      textureSection.style.display = "flex";
      lightingSection.style.display = "none";

      // Add click handler for the lighting section
      lightingSection.addEventListener("click", () => {
        this.setTerrainTool("lighting");
      });

      // Create texture options
      const textureContainer = document.createElement("div");
      textureContainer.style.display = "flex";
      textureContainer.style.flexDirection = "row";
      textureContainer.style.gap = "10px";

      const textures = [
        { name: "Grass", color: "rgba(0, 255, 0, 0.5)", icon: "", preview: "/assets/textures/terrain/grass_01_dark.png" },
        { name: "Rock", color: "rgba(255, 0, 0, 0.5)", icon: "", preview: "/assets/textures/terrain/rock.png" },
        { name: "Path", color: "rgba(0, 0, 255, 0.5)", icon: "", preview: "/assets/textures/terrain/floor.png" },
      ];

      textures.forEach((texture) => {
        const textureButton = document.createElement("div");
        textureButton.style.display = "flex";
        textureButton.style.flexDirection = "column";
        textureButton.style.alignItems = "center";
        textureButton.style.gap = "5px";
        textureButton.style.cursor = "pointer";
        textureButton.style.padding = "10px";
        textureButton.style.paddingBottom = "7px";

        textureButton.style.position = "relative";
        textureButton.style.borderRadius = "5px";
        textureButton.style.border = "1px solid transparent";
        textureButton.style.transition = "all 0.2s ease";

        textureButton.addEventListener("mouseenter", () => {
          textureButton.style.transform = "scale(1.1)";
          textureButton.style.filter = "brightness(1.2)";
          textureButton.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
        });

        textureButton.addEventListener("mouseleave", () => {
          textureButton.style.transform = "scale(1)";
          textureButton.style.filter = "brightness(1)";
          textureButton.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
        });

        //link edit
        const editButton = document.createElement("button");
        editButton.innerHTML = "🔗"; // Link emoji
        editButton.style.position = "absolute";
        editButton.style.top = "5px";
        editButton.style.right = "5px";
        editButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        editButton.style.border = "none";
        editButton.style.borderRadius = "3px";
        editButton.style.padding = "3px 6px";
        editButton.style.color = "white";
        editButton.style.fontSize = "12px";
        editButton.style.cursor = "pointer";
        editButton.style.zIndex = "2";
        editButton.style.transition = "all 0.2s ease";
        editButton.title = "Custom Texture From URL";

        // Create texture edit dialog
        const createTextureDialog = (textureName) => {
          const dialog = document.createElement("div");
          dialog.style.position = "fixed";
          dialog.style.top = "50%";
          dialog.style.left = "50%";
          dialog.style.transform = "translate(-50%, -50%)";
          dialog.style.backgroundColor = "rgba(0, 0, 0, 0.95)";
          dialog.style.padding = "30px";
          dialog.style.borderRadius = "10px";
          dialog.style.zIndex = "1003";
          dialog.style.minWidth = "400px";
          dialog.style.boxShadow = "0 0 20px rgba(0, 0, 0, 0.5)";
          dialog.style.border = "1px solid rgba(255, 255, 255, 0.1)";

          const title = document.createElement("h3");
          title.textContent = `Edit ${textureName} Texture`;
          title.style.color = "white";
          title.style.marginBottom = "20px";
          title.style.textAlign = "center";

          const urlInput = document.createElement("input");
          urlInput.type = "text";
          urlInput.placeholder = "Enter texture URL";
          urlInput.style.width = "100%";
          urlInput.style.padding = "8px";
          urlInput.style.marginBottom = "15px";
          urlInput.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          urlInput.style.border = "1px solid rgba(255, 255, 255, 0.2)";
          urlInput.style.borderRadius = "4px";
          urlInput.style.color = "white";

          //prevent default on typing in input
          // urlInput.addEventListener("keydown", (e) => {
          // e.preventDefault();
          // });

          const buttonContainer = document.createElement("div");
          buttonContainer.style.display = "flex";
          buttonContainer.style.justifyContent = "center";
          buttonContainer.style.gap = "10px";

          const cancelButton = document.createElement("button");
          cancelButton.textContent = "Cancel";
          cancelButton.style.padding = "8px 16px";
          cancelButton.style.backgroundColor = "#444";
          cancelButton.style.color = "white";
          cancelButton.style.border = "none";
          cancelButton.style.borderRadius = "4px";
          cancelButton.style.cursor = "pointer";

          const updateButton = document.createElement("button");
          updateButton.textContent = "Update Texture";
          updateButton.style.padding = "8px 16px";
          updateButton.style.backgroundColor = "#e68b00";
          updateButton.style.color = "white";
          updateButton.style.border = "none";
          updateButton.style.borderRadius = "4px";
          updateButton.style.cursor = "pointer";

          cancelButton.onclick = () => {
            this.inEditTextureURL = false;
            dialog.remove();
          };

          updateButton.onclick = () => {
            this.inEditTextureURL = false;
            const newUrl = urlInput.value.trim();
            if (newUrl) {
              switch (textureName.toLowerCase()) {
                case "rock":
                  this.rockTex.updateURL(newUrl);
                  preview.style.backgroundImage = `url(${newUrl})`;
                  break;
                case "grass":
                  this.grassTex.updateURL(newUrl);
                  preview.style.backgroundImage = `url(${newUrl})`;
                  break;
                case "path":
                  this.floorTex.updateURL(newUrl);
                  preview.style.backgroundImage = `url(${newUrl})`;
                  break;
              }
            }
            dialog.remove();
          };

          buttonContainer.appendChild(cancelButton);
          buttonContainer.appendChild(updateButton);

          dialog.appendChild(title);
          dialog.appendChild(urlInput);
          dialog.appendChild(buttonContainer);

          return dialog;
        };

        editButton.onclick = (e) => {
          this.inEditTextureURL = true;
          e.stopPropagation(); // Prevent texture button click
          const dialog = createTextureDialog(texture.name);
          document.body.appendChild(dialog);
        };

        editButton.onmouseover = (e) => {
          e.stopPropagation();
          editButton.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
          editButton.style.transform = "scale(1.1)";
        };

        editButton.onmouseout = (e) => {
          e.stopPropagation();
          editButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
          editButton.style.transform = "scale(1)";
        };

        const preview = document.createElement("div");
        preview.style.width = "50px";
        preview.style.height = "50px";
        preview.style.backgroundImage = `url(${texture.preview})`;
        preview.id = `${texture.name}-preview`;
        preview.style.backgroundSize = "cover";
        preview.style.borderRadius = "5px";

        const label = document.createElement("div");
        label.textContent = `${texture.icon} ${texture.name}`;
        label.style.fontSize = "12px";
        label.style.color = "white";
        label.style.textShadow = "0px 1px 11px #000000";
        label.style.color = "#ffdfa2";

        textureButton.appendChild(editButton);
        textureButton.appendChild(preview);
        textureButton.appendChild(label);

        textureButton.onclick = () => {
          document.querySelectorAll(".texture-button").forEach((btn) => {
            btn.style.border = "1px solid transparent";
          });
          // textureButton.style.border = "1px solid rgb(63, 39, 6)";
          textureButton.style.border = "1px solid rgb(104, 65, 10)";
          this.currentSplatColor = texture.color;
          this.setTerrainTool("paint");
          this.canvas.focus();
        };

        textureButton.classList.add("texture-button");
        textureContainer.appendChild(textureButton);
      });

      // Add brush size slider
      const brushRadiusControl = document.createElement("div");
      brushRadiusControl.style.display = "flex";
      brushRadiusControl.style.flexDirection = "column";
      brushRadiusControl.style.gap = "5px";

      const brushRadiusLabel = document.createElement("label");
      brushRadiusLabel.textContent = "Brush Radius";
      brushRadiusLabel.style.marginBottom = "-5px";
      brushRadiusLabel.style.marginTop = "-5px";
      brushRadiusLabel.style.color = "white";
      brushRadiusLabel.style.textShadow = "0px 1px 11px #000000";
      brushRadiusLabel.style.color = "#ffdfa2";

      const brushRadiusSlider = document.createElement("input");
      brushRadiusSlider.type = "range";
      brushRadiusSlider.min = "0.25";
      brushRadiusSlider.max = "10";
      brushRadiusSlider.step = "0.25";
      brushRadiusSlider.value = "0.5";
      brushRadiusSlider.style.width = "90%";
      brushRadiusSlider.style.left = "5%";
      brushRadiusSlider.style.position = "relative";

      brushRadiusSlider.oninput = (e) => {
        const value = e.target.value;
        const brushRadius = parseFloat(value);

        this.setBrushSize(brushRadius);

        //  this.setTerrainTool("paint");
      };

      textureSection.appendChild(brushRadiusLabel);
      textureSection.appendChild(brushRadiusSlider);

      textureSection.appendChild(textureContainer);

      // Create lighting controls
      const lightingControls = document.createElement("div");
      lightingControls.style.display = "flex";
      lightingControls.style.flexDirection = "column";
      lightingControls.style.gap = "10px";

      const colorPicker = document.createElement("input");
      colorPicker.type = "color";
      colorPicker.value = "#ffffff"; // Default color
      colorPicker.style.position = "absolute";
      colorPicker.style.top = "170px";
      colorPicker.style.left = "10%";
      colorPicker.style.zIndex = "100";
      colorPicker.addEventListener("input", (e) => {
        const hex = e.target.value;
        const rgba = hexToRgba(hex, 1); // Alpha = 1 (fully opaque)
        this.currentLightColor = rgba;
      });
      // Add change event listener (fires when color picker is closed)
      colorPicker.addEventListener("change", (e) => {
        const hex = e.target.value;
        const rgba = hexToRgba(hex, 1);
        this.currentLightColor = rgba;

        // Convert hex to RGB values (0-255)
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        // Set brightness slider value to average RGB
        const brightness = Math.round((r + g + b) / 3);
        brightnessSlider.value = brightness;
        this.brightnessSliderValue = brightness;

        // Switch to lighting mode
        this.setTerrainTool("lighting");
      });
      this.currentLightColor = "rgba(1.0, 1.0, 1.0, 1)";
      function hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      document.body.appendChild(colorPicker);
      // Add color picker label
      const colorPickerLabel = document.createElement("label");
      colorPickerLabel.textContent = "Light Color";
      colorPickerLabel.style.color = "white";
      colorPickerLabel.style.position = "absolute";
      colorPickerLabel.style.top = "145px";
      colorPickerLabel.style.left = "10%";
      lightingControls.appendChild(colorPickerLabel);

      // Add brightness slider
      const brightnessControl = document.createElement("div");
      brightnessControl.style.display = "flex";
      brightnessControl.style.flexDirection = "column";
      brightnessControl.style.gap = "5px";

      const brightnessLabel = document.createElement("label");
      brightnessLabel.textContent = "Brightness";
      brightnessLabel.style.color = "white";

      const brightnessSlider = document.createElement("input");
      brightnessSlider.type = "range";
      brightnessSlider.min = "0";
      brightnessSlider.max = "255";
      brightnessSlider.value = "128";
      brightnessSlider.style.width = "90%";
      brightnessSlider.style.left = "5%";
      brightnessSlider.style.position = "relative";

      brightnessSlider.oninput = (e) => {
        const value = e.target.value;
        const brightness = parseInt(value);
        this.currentLightColor = `rgba(${brightness}, ${brightness}, ${brightness}, 1)`;
        this.brightnessSliderValue = brightness; // = new BABYLON.Vector3(brightness, brightness, brightness);
        this.setTerrainTool("lighting");
      };

      brightnessControl.appendChild(colorPicker);
      brightnessControl.appendChild(brightnessLabel);
      brightnessControl.appendChild(brightnessSlider);
      lightingControls.appendChild(brightnessControl);

      lightingSection.appendChild(lightingControls);

      // Add sections to submenu
      submenu.appendChild(textureSection);
      submenu.appendChild(lightingSection);

      // Show textures by default
      textureSection.style.display = "flex";

      // Update submenu position and animation
      const updateSubmenuPosition = () => {
        if (window.innerWidth <= 768) {
          submenu.style.right = "100%";
          submenu.style.top = "100px";
          submenu.style.marginRight = "10px";
        } else {
          submenu.style.top = "-50px";
          submenu.style.left = "-100px";
          submenu.style.marginTop = "-80px";
        }
      };

      const toggleSubmenu = (show) => {
        submenu.style.display = "flex";
        setTimeout(() => {
          submenu.style.transform = show ? "translateY(0) scale(1)" : "translateY(0) scale(0.95)";
          submenu.style.opacity = show ? "1" : "0";
        }, 10);

        if (!show) {
          setTimeout(() => {
            submenu.style.display = "none";
          }, 300);
        }
      };

      updateSubmenuPosition();
      window.addEventListener("resize", updateSubmenuPosition);

      // Handle submenu toggling
      const originalOnClick = parentButton.onclick;
      parentButton.onclick = (e) => {
        e.stopPropagation();
        const isVisible = submenu.style.display !== "none";
        // toggleSubmenu(!isVisible);
      };

      document.addEventListener("click", (e) => {
        if (!submenu.contains(e.target) && !parentButton.contains(e.target)) {
          // toggleSubmenu(false);
        }
      });

      return submenu;
    };

    // Create and attach buttons with submenus
    menuButtons.forEach((button) => {
      const buttonElement = this.createButton(button.text, () => {
        console.log(button);
        if (button.tool === "skill") {
          // console.log("skill");
          this.circleColor = new BABYLON.Vector3(0.0, 0.0, 0.0);
          // show spellbook and set adventure mode
          this.setTerrainTool("adventure");
          SPELLBOOK.toggleSpellbook();
          this.canvas.focus();
          return;
        }
        if (button.tool === "objects") {
          // this.setTerrainTool("object");
          this.toggleTemplateVisibility(true);
          this.showObjectPreview("3");

          // mainMenu.style.display = "none";
          // templateMenu.style.display = "block";
        } else if (button.submenu) {
          // console.log("submenu");
          // this.setTerrainTool("paint");
        } else if (!button.submenu) {
          // Direct tool selection for non-submenu buttons
          this.setTerrainTool(button.tool);
        }
        this.canvas.focus();
      });

      if (button.submenu) {
        const submenu = createSubmenu(buttonElement, button.submenu);
        submenu.classList.add("submenu");
        buttonElement.style.position = "relative";
        buttonElement.appendChild(submenu);

        // Add hover event listeners
        buttonElement.addEventListener("mouseenter", () => {
          // Hide all other submenus
          const allSubmenus = document.querySelectorAll(".submenu");
          allSubmenus.forEach((menu) => {
            if (menu !== submenu) {
              menu.style.display = "none";
            }
          });

          this.setTerrainTool("paint");
          // Show this submenu
          submenu.style.display = "flex";
          // setTimeout(() => {
          submenu.style.transform = "translateY(-105px) scale(1)";
          submenu.style.opacity = "1";
          // }, 00);
        });

        // Handle mouseleave for the button and submenu
        const hideSubmenu = (e) => {
          if (this.inEditTextureURL) {
            return;
          }
          // Check if we're moving to the submenu or its children
          if (!submenu.contains(e.relatedTarget) && e.relatedTarget !== buttonElement) {
            submenu.style.transform = "translateY(-80px) scale(0.95)";
            submenu.style.opacity = "0";
            setTimeout(() => {
              submenu.style.display = "none";
            }, 200);
          }
        };

        buttonElement.addEventListener("mouseleave", hideSubmenu);
        submenu.addEventListener("mouseleave", hideSubmenu);

        // Add click handlers for submenu items
        if (button.text.includes("Textures")) {
          const textureButtons = submenu.querySelectorAll(".texture-button");
          textureButtons.forEach((textureBtn) => {
            textureBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              this.setTerrainTool("paint");
              // Hide submenu after selection
              // submenu.style.display = "none";
            });
          });
        } else if (button.text.includes("Lighting")) {
          const lightingControls = submenu.querySelector(".lighting-controls");
          if (lightingControls) {
            lightingControls.addEventListener("click", (e) => {
              e.stopPropagation();
              this.setTerrainTool("lighting");
            });
          }
        }
      }

      buttonContainer.appendChild(buttonElement);
    });

    // Remove the old click event listener for submenus since we're using hover now
    document.removeEventListener("click", (event) => {
      const submenus = document.querySelectorAll(".submenu");
      const isClickInsideSubmenu = Array.from(submenus).some((menu) => menu.contains(event.target) || event.target.parentNode.contains(menu));

      if (!isClickInsideSubmenu) {
        // submenus.forEach((menu) => (menu.style.display = "none"));
      }
    });

    // Create back button for template menu
    const backButton = this.createButton("← Back (Esc)", () => {
      templateMenu.style.display = "none";
      mainMenu.style.display = "block";
      this.toggleTemplateVisibility(false);
      this.removePreviewMesh();
      this.circleColor = new BABYLON.Vector3(0.0, 0.0, 0.0);
      this.canvas.focus();
    });
    templateMenu.appendChild(backButton);

    // Create template number grid
    const numberGrid = document.createElement("div");
    // numberGrid.style.display = "grid";
    numberGrid.style.display = "flex";
    numberGrid.style.gap = "10px";
    numberGrid.style.marginTop = "10px";
    numberGrid.style.transition = "all 0.3s ease";
    templateMenu.appendChild(numberGrid);
    this.numberGrid = numberGrid;

    // Create asset browser button
    const assetBrowser = this.createAssetBrowser();
    const assetBrowserButton = document.createElement("div");
    assetBrowserButton.id = "assetBrowserButton";
    assetBrowserButton.style.position = "absolute";
    assetBrowserButton.style.right = "-185px";
    assetBrowserButton.style.top = "14px";
    // assetBrowserButton.style.backgroundImage = "url('/assets/textures/terrain/icons/search.png')";
    assetBrowserButton.style.backgroundSize = "cover";
    assetBrowserButton.style.width = "150px";
    // assetBrowserButton.style.height = "38px";
    assetBrowserButton.style.cursor = "pointer";
    assetBrowserButton.style.border = "none";
    assetBrowserButton.innerHTML = "🔍 Search For Assets";
    templateMenu.appendChild(assetBrowserButton);

    assetBrowserButton.onclick = () => {
      assetBrowser.style.display = "flex";
      document.getElementById("assetSearchInput").focus();
    };

    // create multiplayer browser
    // const multiplayerBrowserButton = document.createElement("div");
    // multiplayerBrowserButton.id = "multiplayerBrowserButton";
    // multiplayerBrowserButton.style.position = "absolute";
    // multiplayerBrowserButton.style.right = "-185px";
    // multiplayerBrowserButton.style.top = "60px"; // Adjust position as needed
    // multiplayerBrowserButton.style.width = "150px";
    // multiplayerBrowserButton.style.cursor = "pointer";
    // multiplayerBrowserButton.style.border = "none";
    // multiplayerBrowserButton.innerHTML = "🌐 Multiplayer";
    // mainMenu.appendChild(multiplayerBrowserButton);

    this.multiplayerBrowser = createMultiplayerBrowser();
    // multiplayerBrowserButton.onclick = () => {
    //   multiplayerBrowser.style.display = "flex";
    // };

    const canvasWidth = this.scene.getEngine().getRenderWidth();
    const spacing = canvasWidth * 0.001; // Same spacing calculation as templates

    // Add template number buttons
    const numTemplates = Object.keys(this.objectTemplates).length;
    for (let i = 1; i <= numTemplates; i++) {
      const btn = this.createButton(i.toString(), () => this.showObjectPreview(i.toString()));
      btn.style.width = "50px";
      btn.style.height = "50px";
      // Calculate position relative to center
      // const xOffset = (i - (numTemplates + 1) / 2) * spacing;
      // btn.style.transform = `translateX(${xOffset}px)`;
      // btn.style.position = "relative"; // Enable positioning

      numberGrid.appendChild(btn);
    }

    this.numberGrid.update = () => {
      this.numberGrid.innerHTML = "";
      const numTemplates = Object.keys(this.objectTemplates).length;
      for (let i = 1; i <= numTemplates; i++) {
        const btn = this.createButton(i.toString(), () => this.showObjectPreview(i.toString()));
        btn.style.width = "50px";
        btn.style.height = "50px";
        numberGrid.appendChild(btn);
      }
    };

    // const updateButtonPositions = () => {
    //   const newCanvasWidth = this.scene.getEngine().getRenderWidth();
    //   const newSpacing = newCanvasWidth * 0.001;

    //   numberGrid.querySelectorAll("button").forEach((btn, index) => {
    //     const xOffset = (index + 1 - (numTemplates + 1) / 2) * newSpacing;
    //     btn.style.transform = `translateX(${xOffset}px)`;
    //   });
    // };

    // window.addEventListener("resize", updateButtonPositions);

    // Create utility container for save/load buttons
    const utilityContainer = document.createElement("div");
    utilityContainer.appendChild(this.createButton("💾 Save", () => this.saveScene()));
    utilityContainer.appendChild(this.createButton("📂 Load", () => this.loadScene()));
    utilityContainer.style.display = "flex";
    utilityContainer.style.gap = "6px";
    utilityContainer.style.marginTop = "20px";

    utilityContainer.style.transition = "all 0.3s ease";
    utilityContainer.style.position = "relative";
    utilityContainer.style.left = "339px";
    utilityContainer.style.top = "-25px";
    utilityContainer.style.width = "250px; !important";
    // utilityContainer.style.width = "100px";
    mainMenu.appendChild(utilityContainer);

    // Initial layout update and window resize handler
    updateLayout();
    window.addEventListener("resize", updateLayout);
  }

  // Enhanced button creation method
  createButton(text, onClick) {
    const button = document.createElement("button");
    button.style.background = "rgba(0,0,0,0)";
    button.style.opacity = "0";

    //   text: "🖌️ Textures",
    //   submenu: [
    //     { text: "🌱 Paint Grass", tool: "paint", color: "rgba(0, 255, 0, 0.5)" },
    //     { text: "🪨 Paint Rock", tool: "paint", color: "rgba(255, 0, 0, 0.5)" },
    //     { text: "🛣️ Paint Path", tool: "paint", color: "rgba(0, 0, 255, 0.5)" },
    //   ],
    // },
    // {
    //   submenu: [
    //     { text: "☀️ Bright", tool: "lighting", color: "rgba(255, 255, 255, 1)" },
    //     { text: "🌙 Dark", tool: "lighting", color: "rgba(0, 0, 0, 1)" },
    //     { text: "🌅 Ambient", tool: "lighting", color: "rgba(128, 128, 128, 1)" },
    //   ],
    // },
    // { text: "🌿 Grass",
    if (text === "🎨 Objects") {
      button.style.backgroundImage = "url('/assets/textures/terrain/icons/objects.png')"; // Add background image
      button.style.backgroundSize = "cover";
      button.style.backgroundPosition = "center";
      button.style.width = "81px";
      button.style.height = "135px";
      button.style.textAlign = "left";
      button.style.position = "relative";
      button.style.border = "none";
      button.style.zIndex = "1";

      // button.style.left = "20px";
      // button.style.boxShadow = "0 0 20px rgba(150, 0, 0, 0.4)";
      button.style.cursor = "pointer";
    } else if (text === "💡 Lighting") {
      button.style.display = "none";
    } else if (text === "🖌️ Textures") {
      button.style.backgroundImage = "url('/assets/textures/terrain/icons/terrain.png')"; // Add background image
      button.style.backgroundSize = "cover";
      button.style.backgroundPosition = "center";
      button.style.width = "81px";
      button.style.height = "135px";
      button.style.cursor = "pointer";
      button.style.border = "none";
    } else if (text === "🌿 Grass") {
      button.style.backgroundImage = "url('/assets/textures/terrain/icons/grass.png')"; // Add background image
      button.style.backgroundSize = "cover";
      button.style.backgroundPosition = "center";
      button.style.width = "81px";
      button.style.height = "135px";
      button.style.zIndex = "1";
      button.style.position = "relative";
    } else if (text === "💾 Save") {
      button.style.backgroundImage = "url('/assets/textures/terrain/icons/save.png')"; // Add background image
      button.style.backgroundSize = "cover";
      button.style.backgroundPosition = "center";
      button.style.width = "120px";
      button.style.height = "38px";
      button.title = "Download Scene To JSON";
    } else if (text === "📂 Load") {
      button.style.backgroundImage = "url('/assets/textures/terrain/icons/load.png')"; // Add background image
      button.style.backgroundSize = "cover";
      button.style.backgroundPosition = "center";
      button.style.width = "120px";
      button.style.height = "38px";
      button.title = "Load Scene From JSON";
    } else if (text === "👤 NPC") {
      button.style.backgroundImage = "url('/assets/textures/terrain/icons/npcn.png')"; // Add background image
      button.style.backgroundSize = "cover";
      button.style.backgroundPosition = "center";
      button.style.width = "81px";
      button.style.height = "97px";
      button.style.zIndex = "1";
      button.style.position = "relative";
      button.style.backgroundSize = "84px 121px";
      button.style.backgroundPosition = "-2px 0px";
      button.style.top = "-17px";
    } else if (text === "💧 Skill") {
      button.style.backgroundImage = "url('/assets/textures/terrain/icons/SpellBook.png')"; // Add background image
      button.style.backgroundSize = "cover";
      button.style.backgroundPosition = "center";
      button.style.width = "81px";
      button.style.height = "93px";
      button.style.zIndex = "1";
      button.style.position = "relative";
      button.style.backgroundSize = "84px 121px";
      button.style.backgroundPosition = "-2px 0px";
      button.style.top = "-17px";
      button.style.filter = "brightness(1.3)";
    } else {
      // button.textContent = text;
      button.style.padding = "10px 20px";
      button.style.fontSize = "16px";
      button.style.cursor = "pointer";
      button.style.backgroundColor = "rgba(0, 0, 0, 0.0)";
      button.style.color = "white";
      button.style.border = "none";
      button.style.borderRadius = "5px";
      button.style.transition = "all 0.3s ease";
      button.style.width = "100%";
      button.style.textAlign = "left";
      button.style.position = "relative";
      // button.style.backgroundImage = "url('/assets/textures/terrain/icons/button_blank.png')"; // Add background image
      button.style.backgroundSize = "cover";
      button.style.backgroundPosition = "center";
      // button.style.boxShadow = "0 0 20px rgba(150, 0, 0, 0.4)";
    }
    button.style.cursor = "pointer";
    button.style.border = "none";
    // Add fade-in animation effect
    button.style.transform = "translateY(20px)";
    button.style.transition = "opacity 0.5s ease, transform 0.5s ease, filter 0.1s ease";
    // Trigger the animation after a small delay
    setTimeout(() => {
      button.style.opacity = "1";
      button.style.transform = "translateY(0)";
    }, 100);

    button.onclick = onClick;
    button.onmouseover = () => {
      button.style.filter = "brightness(1.4)"; // Increase brightness on hover
      // button.style.transform = "scale(1.02)"; // Slight scale effect
    };
    button.onmouseout = () => {
      button.style.filter = "brightness(1)"; // Reset brightness
      // button.style.transform = "scale(1)"; // Reset scale
    };

    if (text === "🎨 Objects" || text === "💡 Lighting" || text === "🖌️ Textures" || text === "🌿 Grass" || text === "💾 Save" || text === "📂 Load" || text === "👤 NPC" || text === "💧 Skill") {
    } else {
      const textSpan = document.createElement("span");
      textSpan.textContent = text;
      textSpan.setAttribute("data-text", text);

      textSpan.style.background = `url("./test metal 2.jpg"), linear-gradient(to bottom, #462523 0%, #e68b00 22%, #f6e27a 45%, #f4d86c 50%, #f6e27a 55%, #cb9b51 78%, #462523 100%)`;
      textSpan.style.position = "relative";
      // textSpan.style.webkitTextStroke = "1px #ffedde2b";
      textSpan.style.backgroundBlendMode = "overlay";
      // textSpan.style.backgroundSize = "200px 100px";
      textSpan.style.webkitBackgroundClip = "text";
      textSpan.style.webkitTextFillColor = "transparent";
      textSpan.style.display = "inline-block";
      textSpan.style.width = "100%";
      // textSpan.style.textShadow = "-3px 0 3px #000, 0 3px 3px #000, 5px 5px 10px rgb(0, 0, 0), -5px -5px 10px rgb(0, 0, 0)";

      if (text === "← Back (Esc)") {
        textSpan.style.position = "absolute";
        textSpan.style.left = "-200px";
        textSpan.style.top = "44px;";
      }
      // Add span to button
      button.appendChild(textSpan);
    }

    return button;
  }

  createMenuContainer() {
    const container = document.createElement("div");
    container.id = "mainMenu";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    container.style.height = "195px";
    container.style.width = "600px";
    // Add transition properties for smooth animation
    container.style.transition = "all 0.1s ease-out";
    container.style.opacity = "1";
    container.style.transform = "translateY(0)";
    container.style.backgroundImage = "url('/assets/textures/terrain/icons/bar_background.png')"; // Add background image
    container.style.backgroundSize = "cover";
    container.style.backgroundPosition = "center";
    return container;
  }

  createTemplateContainer() {
    const container = document.createElement("div");
    container.id = "templateMenu";
    container.style.display = "none";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    // Add transition properties for smooth animation
    container.style.transition = "all 0.1s ease-out";
    container.style.opacity = "0";
    container.style.transform = "translateY(20px)"; // Start slightly below final position
    return container;
  }

  buildSceneData() {
    const splatmapData = this.splatmapCanvas.toDataURL("image/png");
    const lightmapData = this.lightmapCanvas.toDataURL("image/png");

    // Add grass instances data
    // const grassData = {};
    // if (this.grassTemplate && this.grassTemplate.thinInstanceCount) {
    //   // 1. matrices  ───────────────────────────────────────────────────────────
    //   // Reference held by Babylon – clone it so JSON has its own copy
    //   const m = this.grassTemplate.thinInstanceGetBuffer("matrix"); // Float32Array
    //   grassData.matrices = Array.from(m); // flatten to plain JS array

    //   // 2. any custom buffers (example: colour)  ───────────────────────────────
    //   const c = this.grassTemplate.thinInstanceGetBuffer("color"); // maybe undefined
    //   if (c) grassData.color = Array.from(c);

    //   // 3. optional meta info ---------------------------------------------------
    //   grassData.sourceMeshId = this.grassTemplate.id; // lets you find/create it again
    // }
    /* -------------------------------------------------
     * 1. grab every world matrix in one call
     * ------------------------------------------------- */
    const worldMats = this.grassTemplate.thinInstanceGetWorldMatrices(); // Matrix[]

    // flatten → [m00, m01, …, m33,  m00, m01, …]  length = 16 × instanceCount
    const flatMats = new Float32Array(worldMats.length * 16);
    worldMats.forEach((m, i) => m.copyToArray(flatMats, i * 16));
    /* -------------------------------------------------
     * 2. (optional) grab per‑instance colours, sizes, …
     *    You must have kept a reference to your arrays,
     *    because Babylon offers no "getBuffer" call.
     * ------------------------------------------------- */
    const flatColors = this.grassColorData
      ? Array.from(this.grassColorData) // JS array → JSON‑safe
      : null;

    // Add NPC data to the scene data

    const npcData = [];
    const npcPools = NPCPools.getInstance();
    for (const npcType in npcPools.NPCPools) {
      const pool = npcPools.NPCPools[npcType];
      pool.npcPool.forEach((npc) => {
        // Serialize the complete NPC state
        npcData.push({
          type: npcType,
          position: {
            x: npc.position.x,
            y: npc.position.y,
            z: npc.position.z,
          },
          npcState: {
            id: npc.NPC.id,
            configId: npc.NPC.configId,
            name: npc.NPC.name,
            talkLine: npc.NPC.talkLine,
            lines: npc.NPC.lines,
            followerLines: npc.NPC.followerLines,
            lineCd: npc.NPC.lineCd,
            conversationTopics: npc.NPC.conversationTopics,
            routine: npc.NPC.routine,
            currentRoutineIndex: npc.NPC.currentRoutineIndex,
            routineTimer: npc.NPC.routineTimer,
            isFollowingRoutine: npc.NPC.isFollowingRoutine,
            greetingName: npc.NPC.greetingName,
            greeting: npc.NPC.greeting,
            response: npc.NPC.response,
            enterConversation: npc.NPC.enterConversation,
            exitConversation: npc.NPC.exitConversation,
            exitConversationLine: npc.NPC.exitConversationLine,
            exitConversationFamilar: npc.NPC.exitConversationFamilar,
            home: {
              x: npc.NPC.home.x,
              y: npc.NPC.home.y,
              z: npc.NPC.home.z,
            },
            isFollowing: npc.NPC.isFollowing,
            isInConversation: npc.NPC.isInConversation,
            shouldStopIfPlayerWalksInFront: npc.NPC.shouldStopIfPlayerWalksInFront,
            isInCombat: npc.NPC.isInCombat,
            combatAnim: {
              x: npc.NPC.combatAnim.x,
              y: npc.NPC.combatAnim.y,
              z: npc.NPC.combatAnim.z,
              w: npc.NPC.combatAnim.w,
            },
            animationRanges: npc.NPC.animationRanges,
            isFollowingCombat: npc.NPC.isFollowingCombat,
            lineCdCombat: npc.NPC.lineCdCombat,
            combatLines: npc.NPC.combatLines,
            health: {
              current: npc.NPC.health.current,
              max: npc.NPC.health.max,
            },
            xp: npc.NPC.xp,
            attackDamage: npc.NPC.attackDamage,
            attackDistance: npc.NPC.attackDistance,
            attackTime: npc.NPC.attackTime,
            isDead: npc.NPC.isDead,
            // combatSkills: npc.NPC.combatSkills.map((skill) => skill.name), // Store skill names to reconstruct later
          },
        });

        // npcData.push({
        //   type: npcType,
        //   position: {
        //     x: npc.position.x,
        //     y: npc.position.y,
        //     z: npc.position.z,
        //   },
        //   configId: npc.NPC.configId,
        //   npcState: npcState,
        // });
      });
    }

    const channelId = window.SCENE_MANAGER.activeScene.CHANNEL_ID;
    const snapshot = {
      timestamp: Date.now(),
      objects: this.placedParent.getChildMeshes().map((mesh) => {
        let id = mesh.id;
        console.log(mesh.assetId);
        return {
          id: mesh.id,
          assetId: mesh.assetId,
          position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
          rotationQuaternionX: mesh.rotationQuaternion.x,
          scaleX: mesh.scaling.x,
        };
      }),
      NPC_DATA: NPC_DATA,
      CUSTOM_NPC_CONFIGS: CUSTOM_NPC_CONFIGS,
      npcs: npcData,
      textureUrls: {
        rock: this.rockTex.url,
        grass: this.grassTex.url,
        floor: this.floorTex.url,
      },
      splatmapData: splatmapData,
      lightmapData: lightmapData,
      grass: {
        matrices: Array.from(flatMats), // JSON can’t hold TypedArrays
        colors: flatColors, // null if you don’t need it
        templateId: this.grassTemplate.id, // lets you find/re‑create
      },
    };
    return snapshot;
  }

  saveScene() {
    // full scene saver
    // // var serializedScene = BABYLON.SceneSerializer.Serialize(this.scene);
    // // // Convert it to a JSON string
    // // var jsonString = JSON.stringify(serializedScene);
    // // // Download as a .babylon file (optional)
    // // var blob = new Blob([jsonString], { type: "octet/stream" });
    // // var url = window.URL.createObjectURL(blob);
    // // var a = document.createElement('a');
    // // a.href = url;
    // // a.download = 'scene.babylon';
    // // a.click();
    // window.URL.revokeObjectURL(url);

    // custom saver
    const sceneData = this.buildSceneData();
    // const sceneData = {
    //   objects: this.placedParent.getChildMeshes().map((mesh) => ({
    //     // Extract template key from the instance name
    //     // Change this line to properly extract the template number
    //     templateKey: mesh.name.split("template_")[1]?.split("_")[0] || "1",
    //     position: {
    //       x: mesh.position.x,
    //       y: mesh.position.y,
    //       z: mesh.position.z,
    //     },
    //     rotation: {
    //       x: mesh.rotation.x,
    //       y: mesh.rotation.y,
    //       z: mesh.rotation.z,
    //     },
    //     scaling: {
    //       x: mesh.scaling.x,
    //       y: mesh.scaling.y,
    //       z: mesh.scaling.z,
    //     },
    //   })),
    // };
    sceneData.SKILL_DATA = SKILLS;
    sceneData.SKILL_DATA["test"] = { test: "test" };
    sceneData.PLAYER_DATA = window.PLAYER_DATA;
    sceneData.NPC_DATA = window.NPC_DATA;

    function stringifyWithBigInt(obj) {
      return JSON.stringify(
        obj,
        (_key, value) =>
          typeof value === "bigint"
            ? value.toString() // convert to string
            : value // leave everything else alone
      );
    }

    const blob = new Blob([stringifyWithBigInt(sceneData)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scene.json";
    a.click();
    URL.revokeObjectURL(url);

    this.canvas.focus();
  }

  loadScene() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          function parseWithBigInt(str) {
            return JSON.parse(str, (_key, value) => {
              // here: detect numeric strings that should be BigInt
              // e.g. you could tag them in step 1, or just assume any all‑digit string is bigint
              if (typeof value === "string" && /^[0-9]+$/.test(value)) {
                // beware: this will turn *all* digit‑only strings into BigInt
                if (typeof value === "string" && value.endsWith("n")) {
                  return BigInt(value.slice(0, -1));
                }
              }
              return value;
            });
          }

          const sceneData = parseWithBigInt(e.target.result);
          this.loadSceneData(sceneData);
        };
        reader.readAsText(file);
      }
    };
    input.click();

    // Set focus to the canvas
    this.canvas.focus();
  }

  loadSceneData(sceneData) {
    console.log(sceneData);
    // Clear existing objects
    this.placedParent.getChildMeshes().forEach((mesh) => mesh.dispose());
    this.placedObjectsHistory = [];
    this.redoStack = [];

    // console.log(window.STREAMER);
    window.STREAMER.addObjectsToScene(sceneData.objects);

    setTimeout(() => {
      // Load splatmap data if it exists
      if (sceneData.splatmapData) {
        const splatmapImg = new Image();
        splatmapImg.onload = () => {
          // Clear the canvas and draw the new image
          this.splatmapCtx.clearRect(0, 0, this.splatmapCanvas.width, this.splatmapCanvas.height);
          this.splatmapCtx.drawImage(splatmapImg, 0, 0);
          this.dynamicSplatTexture.update();
        };
        splatmapImg.src = sceneData.splatmapData;
      }

      // Load lightmap data if it exists
      if (sceneData.lightmapData) {
        const lightmapImg = new Image();
        lightmapImg.onload = () => {
          // Clear the canvas and draw the new image
          this.lightmapCtx.clearRect(0, 0, this.lightmapCanvas.width, this.lightmapCanvas.height);
          this.lightmapCtx.drawImage(lightmapImg, 0, 0);
          this.dynamicLightTexture.update();
        };
        lightmapImg.src = sceneData.lightmapData;
      }

      if (sceneData.textureUrls) {
        if (sceneData.textureUrls.rock) {
          this.rockTex.updateURL(sceneData.textureUrls.rock);
          document.getElementById("Rock-preview").style.backgroundImage = `url(${sceneData.textureUrls.rock})`;
        }
        if (sceneData.textureUrls.grass) {
          this.grassTex.updateURL(sceneData.textureUrls.grass);
          document.getElementById("Grass-preview").style.backgroundImage = `url(${sceneData.textureUrls.grass})`;
        }
        if (sceneData.textureUrls.floor) {
          this.floorTex.updateURL(sceneData.textureUrls.floor);
          document.getElementById("Path-preview").style.backgroundImage = `url(${sceneData.textureUrls.floor})`;
        }
      }

      console.log("sceneData", sceneData.grass.templateId);
      /* 1. find (or rebuild) the template mesh ----------------------------- */
      let grassTemplate = this.scene.getMeshById(sceneData.grass.templateId);
      if (!grassTemplate) {
        // grassTemplate = await createGrassTemplateMesh(scene); // your own helper
      }

      console.log("sceneData", sceneData.grass);
      console.log("grassTemplate", grassTemplate.name);
      const matrixData = new Float32Array(sceneData.grass.matrices);
      // grassTemplate.thinInstanceCount = 0; // clear anything old
      grassTemplate.thinInstanceSetBuffer("matrix", matrixData, 16, false);
      grassTemplate.thinInstanceRefreshBoundingInfo();

      /* 2. reconstruct the GPU buffers in ONE call ------------------------- */
      // const matData = new Float32Array(sceneData.grass.matrices); // back to TypedArray
      // console.log("matData", matData);
      // grassTemplate.thinInstanceCount = 0; // clear anything old
      // grassTemplate.thinInstanceSetBuffer("matrix", matData, 16, false);

      // console.log("grassTemplate", grassTemplate);

      // if (sceneData.grass.colors) {
      //   const colData = new Float32Array(sceneData.grass.colors);
      //   grassTemplate.thinInstanceSetBuffer("color", colData, 4, false);
      // }

      grassTemplate.thinInstanceRefreshBoundingInfo(); // (picking / culling)

      // Load NPC Templates and specifc NPCS
      // NPC_DATA = sceneData.NPC_DATA;
      // CUSTOM_NPC_CONFIGS = sceneData.CUSTOM_NPC_CONFIGS;

      // Load NPCs if they exist in the scene data
      setTimeout(async () => {
        if (sceneData.npcs && Array.isArray(sceneData.npcs)) {
          const npcPools = NPCPools.getInstance();

          // Clear existing NPCs first
          for (const npcType in npcPools.NPCPools) {
            npcPools.NPCPools[npcType].npcPool = [];
          }

          // Spawn new NPCs from saved data
          for (const npcData of sceneData.npcs) {
            const spawnPoint = new BABYLON.Vector3(npcData.position.x, npcData.position.y, npcData.position.z);

            // Create the NPC
            const npc = await npcPools.addNPC(npcData.type, spawnPoint, npcData.npcState.configId);

            // Restore the complete NPC state
            const state = npcData.npcState;
            Object.assign(npc.NPC, {
              id: state.id,
              name: state.name,
              talkLine: state.talkLine,
              lines: state.lines,
              followerLines: state.followerLines,
              lineCd: state.lineCd,
              conversationTopics: state.conversationTopics,
              routine: state.routine,
              currentRoutineIndex: state.currentRoutineIndex,
              routineTimer: state.routineTimer,
              isFollowingRoutine: state.isFollowingRoutine,
              greetingName: state.greetingName,
              greeting: state.greeting,
              response: state.response,
              enterConversation: state.enterConversation,
              exitConversation: state.exitConversation,
              exitConversationLine: state.exitConversationLine,
              exitConversationFamilar: state.exitConversationFamilar,
              home: new BABYLON.Vector3(state.home.x, state.home.y, state.home.z),
              isFollowing: state.isFollowing,
              isInConversation: state.isInConversation,
              shouldStopIfPlayerWalksInFront: state.shouldStopIfPlayerWalksInFront,
              isInCombat: state.isInCombat,
              combatAnim: new BABYLON.Vector4(state.combatAnim.x, state.combatAnim.y, state.combatAnim.z, state.combatAnim.w),
              animationRanges: state.animationRanges,
              isFollowingCombat: state.isFollowingCombat,
              lineCdCombat: state.lineCdCombat,
              combatLines: state.combatLines,
              xp: state.xp,
              attackDamage: state.attackDamage,
              attackDistance: state.attackDistance,
              attackTime: state.attackTime,
              isDead: state.isDead,
            });

            // Restore health
            if (npc.NPC.health) {
              npc.NPC.health.current = state.health.current;
              npc.NPC.health.max = state.health.max;
            }

            // Restore combat skills by name
            // npc.NPC.combatSkills = state.combatSkills.map((skillName) => SKILLS[skillName]);

            // If the NPC was in combat or following a routine, restart those states
            if (state.isInCombat) {
              npc.NPC.startCombat();
            }
            if (state.isFollowingRoutine) {
              npc.NPC.startRoutine();
            }
          }
        }
      }, 10);
    }, 10);
    // Recreate objects from saved data
    // sceneData.objects.forEach((objData) => {

    // Convert templateKey to number and ensure it exists in objectTemplates
    // console.log("objData.templateKey", objData.templateKey);
    // const templateKey = parseInt(objData.templateKey);
    // console.log("templateKey", templateKey);
    // if (!this.objectTemplates[templateKey]) {
    //   console.warn(`Template ${templateKey} not found, skipping object`);
    //   return;
    // }

    // const instance = this.objectTemplates[templateKey].createInstance(`template_${templateKey}_${Date.now()}`);

    // instance.position = new BABYLON.Vector3(objData.position.x, objData.position.y, objData.position.z);
    // instance.rotation = new BABYLON.Vector3(objData.rotation.x, objData.rotation.y, objData.rotation.z);
    // instance.scaling = new BABYLON.Vector3(objData.scaling.x, objData.scaling.y, objData.scaling.z);

    // instance.parent = this.placedParent;
    // instance.isPickable = false;

    // if (this.shadowGenerator) {
    //   this.shadowGenerator.addShadowCaster(instance);
    // }

    // this.placedObjectsHistory.push(instance);
    // if (this.placedObjectsHistory.length > this.maxHistoryLength) {
    //   this.placedObjectsHistory.shift();
    // }
    // });
  }

  createSplatmapControls() {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "80px";
    container.style.right = "10px";
    container.style.background = "rgba(0, 0, 0, 0.7)";
    container.style.padding = "10px";
    container.style.borderRadius = "8px";
    container.style.color = "white";
    container.style.zIndex = "1000";
    container.style.fontFamily = "Verdana, sans-serif";

    const title = document.createElement("div");
    title.textContent = "Splatmap Texture";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    container.appendChild(title);

    const textures = ["grass", "rock", "path"];
    textures.forEach((texture) => {
      const button = document.createElement("button");
      button.textContent = texture.charAt(0).toUpperCase() + texture.slice(1);
      button.style.margin = "4px";
      button.style.padding = "6px 12px";
      button.style.cursor = "pointer";
      button.style.border = "none";
      button.style.borderRadius = "4px";
      button.style.background = "#555";
      button.style.color = "white";

      button.onclick = () => {
        this.setBrushTexture(texture); // You can define what each tool does in setTerrainTool
      };

      container.appendChild(button);
    });

    document.body.appendChild(container);
  }

  setBrushTexture(tool) {
    // Update splatmap paint color according to selected tool
    switch (tool) {
      case "grass":
        this.currentSplatColor = "rgba(0, 255, 0, 0.5)";
        break;
      case "rock":
        this.currentSplatColor = "rgba(255, 0, 0, 0.5)";
        break;
      case "path":
        this.currentSplatColor = "rgba(0, 0, 255, 0.5)";
        break;
      default:
        this.currentSplatColor = "rgba(255, 0, 0, 0.5)";
    }
  }

  // Move to new file
  createSplatmapShader() {
    // Vertex shader (splatmapVertexShader)
    BABYLON.Effect.ShadersStore["splatmapVertexShader"] = `
    precision highp float;
    
    // Attributes from the mesh
    attribute vec3 position;
    attribute vec2 uv;
    
    // Uniform for transforming positions
    uniform mat4 worldViewProjection;
    
    // Varying to pass UV coordinates to the fragment shader
    varying vec2 vUV;
    
    void main(void) {
        vUV = uv;
        gl_Position = worldViewProjection * vec4(position, 1.0);
    }
`;

    // Fragment shader (splatmapFragmentShader)
    BABYLON.Effect.ShadersStore["splatmapFragmentShader"] = `
precision highp float;

// UV coordinates passed from the vertex shader
varying vec2 vUV;

// Sampler uniforms for the splatmap and textures
uniform sampler2D splatTexture;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform sampler2D texture3;

// UV scale uniforms for each texture
uniform vec2 texture1Scale;
uniform vec2 texture2Scale;
uniform vec2 texture3Scale;

void main(void) {
    // Sample the splatmap; each channel controls a texture's weight
    vec4 splat = texture2D(splatTexture, vUV);
    
    // Sample each texture with its own UV scale
    vec4 tex1 = texture2D(texture1, vUV * texture1Scale);
    vec4 tex2 = texture2D(texture2, vUV * texture2Scale);
    vec4 tex3 = texture2D(texture3, vUV * texture3Scale);
    
    // Blend the textures based on the splatmap's red, green, and blue channels
    vec4 finalColor = tex1 * splat.r + tex2 * splat.g + tex3 * splat.b;
    
    gl_FragColor = finalColor;
}
`;

    var shaderMaterial = new BABYLON.ShaderMaterial(
      "splatmapMaterial",
      this.scene,
      {
        vertex: "splatmap",
        fragment: "splatmap",
      },
      {
        attributes: ["position", "uv"],
        uniforms: ["worldViewProjection"],
      }
    );

    // Set the textures used by the shader
    // Replace the paths with the URLs or file paths to your textures
    this.dynamicSplatTexture = new BABYLON.DynamicTexture("splatTexture", this.splatmapCanvas, this.scene, false);
    // shaderMaterial.setTexture("splatTexture", this.dynamicSplatTexture);
    // shaderMaterial.setTexture("splatTexture", new BABYLON.Texture("path_to_your_splatmap.png", scene));
    shaderMaterial.setTexture("texture1", new BABYLON.Texture("/assets/textures/terrain/rock.png", this.scene));
    shaderMaterial.setTexture("texture2", new BABYLON.Texture("/assets/textures/terrain/grass.png", this.scene));
    shaderMaterial.setTexture("texture3", new BABYLON.Texture("/assets/textures/terrain/floor.png", this.scene));

    // Set UV scale factors (modify these vectors to achieve your desired tiling)
    shaderMaterial.setVector2("texture1Scale", new BABYLON.Vector2(100.0, 100.0));
    shaderMaterial.setVector2("texture2Scale", new BABYLON.Vector2(100.0, 100.0));
    shaderMaterial.setVector2("texture3Scale", new BABYLON.Vector2(100.0, 100.0));

    // Apply the shader material to your terrain mesh
    // this.splatmapToMaterial = shaderMaterial;

    this.dynamicLightTexture = new BABYLON.DynamicTexture("lightmapTexture", this.lightmapCanvas, this.scene, false);
    this.fillRandomAmbientMap();

    const splatMat = new SplatMapMaterial("splatMat", this.scene);
    splatMat.diffuseTexture = new BABYLON.Texture("/assets/textures/terrain/undefined - Imgur.png", this.scene);
    // splatMat.ambientTexture = this.dynamicSplatTexture;
    // splatMat.lightmapTexture = this.dynamicLightTexture;
    splatMat.ambientTexture = this.dynamicLightTexture;
    splatMat.splatTexture = this.dynamicSplatTexture;

    splatMat.diffuseTexture.level = 5.0;
    splatMat.specularPower = 0.0;
    splatMat.specularColor = new BABYLON.Color3(0, 0, 0);

    const noiseTexture = new BABYLON.Texture("/assets/textures/terrain/rockDark.png", this.scene);
    noiseTexture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    noiseTexture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    this.macroScale = new BABYLON.Vector2(1.0, 1.0);
    this.macroStrength = 3.5;
    this.distanceFade = 13000.0;

    // const rockTex = new BABYLON.Texture("/assets/textures/terrain/rock.png", this.scene);
    // const grassTex = new BABYLON.Texture("/assets/textures/terrain/grass_01.png", this.scene);
    // const floorTex = new BABYLON.Texture("/assets/textures/terrain/floor.png", this.scene);

    this.rockTex = new BABYLON.Texture("/assets/textures/terrain/rock.png", this.scene);
    this.grassTex = new BABYLON.Texture("/assets/textures/terrain/grass_01.png", this.scene);
    this.floorTex = new BABYLON.Texture("/assets/textures/terrain/floor.png", this.scene);
    const symbolsTex = new BABYLON.Texture("/assets/textures/terrain/symbols.png", this.scene);
    var startTime = Date.now();

    // this.AddUniform("selectionCenter", "vec2", selectionCenter);
    // this.AddUniform("selectionRadius", "float", 500.0);
    // this.AddUniform("edgeSoftness", "float", 0.1);
    // this.AddUniform("circleColor", "vec3", circleColor);
    this.circleColor = new BABYLON.Vector3(0.0, 1.0, 0.42);
    this.selectionCenter = new BABYLON.Vector2(0.7, 0.7);
    this.selectionRadius = 0.0043;
    this.edgeSoftness = 0.0073;
    const textureScale1 = new BABYLON.Vector2(100.0, 100.0);
    const textureScaleGrass = new BABYLON.Vector2(150.0, 150.0);
    splatMat.onBindObservable.add(() => {
      const effect = splatMat.getEffect();
      effect.setTexture("texture1", this.rockTex);
      effect.setTexture("texture2", this.grassTex);
      effect.setTexture("texture3", this.floorTex);
      effect.setTexture("uSymbolsTexture", symbolsTex);
      effect.setVector2("texture1Scale", textureScale1);
      effect.setVector2("texture2Scale", textureScaleGrass);
      effect.setVector2("texture3Scale", textureScale1);
      splatMat.getEffect().setTexture("splatmapSampler", splatMat.splatTexture);

      effect.setVector2("selectionCenter", this.selectionCenter);
      effect.setFloat("selectionRadius", this.selectionRadius);
      effect.setFloat("edgeSoftness", this.edgeSoftness);
      effect.setVector3("circleColor", this.circleColor);

      effect.setTexture("noiseTexture", noiseTexture);
      effect.setVector2("macroScale", this.macroScale);
      effect.setFloat("macroStrength", this.macroStrength);
      effect.setFloat("distanceFade", this.distanceFade);
      effect.setVector3("cameraPosition", this.scene.activeCamera.position);

      var currentTime = (Date.now() - startTime) / 1000; // Time in seconds
      effect.setFloat("time", currentTime);
    });

    // // Create and style a container div for Tweakpane
    // const container = document.createElement("div");
    // container.style.cssText = `
    //   position: absolute;
    //   top: 50%;
    //   left: 50%;
    //   transform: translate(-50%, -50%);
    //   z-index: 1000;
    //   cursor: move;
    //   user-select: none;
    //   translate: (100px, 100px);
    // `;
    // document.body.appendChild(container);

    // // Create Tweakpane inside the container
    // const pane = new Tweakpane.Pane({
    //   title: "Post Processing",
    //   expanded: true,
    //   container: container,
    // });

    // // Make the panel draggable
    // let isDragging = false;
    // let currentX;
    // let currentY;
    // let initialX;
    // let initialY;
    // let xOffset = 0;
    // let yOffset = 0;

    // container.addEventListener("mousedown", dragStart);
    // document.addEventListener("mousemove", drag);
    // document.addEventListener("mouseup", dragEnd);

    // function dragStart(e) {
    //   if (e.target.classList.contains("tp-rotv_t")) {
    //     // Only drag from title bar
    //     initialX = e.clientX - xOffset;
    //     initialY = e.clientY - yOffset;
    //     isDragging = true;
    //   }
    // }

    // function drag(e) {
    //   if (isDragging) {
    //     e.preventDefault();
    //     currentX = e.clientX - initialX;
    //     currentY = e.clientY - initialY;
    //     xOffset = currentX;
    //     yOffset = currentY;

    //     container.style.transform = `translate(${currentX}px, ${currentY}px)`;
    //   }
    // }

    // function dragEnd() {
    //   isDragging = false;
    // }

    // // Rest of your Tweakpane setup code...
    // const PARAMS = {
    //   selectionRadius: 0.043,
    //   edgeSoftness: 0.1,
    //   selectionColor: { r: 1, g: 0, b: 0 },
    //   macroScaleX: 1.0,
    //   macroScaleY: 1.0,
    //   macroStrength: 0.5,
    //   distanceFade: 2000.0,
    // };

    // const lutFolder = pane.addFolder({
    //   title: "Selection",
    // });

    // lutFolder
    //   .addInput(PARAMS, "selectionRadius", {
    //     label: "selectionRadius",
    //     min: 0,
    //     max: 0.1,
    //     format: (v) => v.toFixed(4),
    //   })
    //   .on("change", ({ value }) => {
    //     selectionRadius = value;
    //   });

    // lutFolder
    //   .addInput(PARAMS, "edgeSoftness", {
    //     label: "edgeSoftness",
    //     min: 0,
    //     max: 0.015,
    //     format: (v) => v.toFixed(4),
    //   })
    //   .on("change", ({ value }) => {
    //     edgeSoftness = value;
    //   });

    // lutFolder
    //   .addInput(PARAMS, "selectionColor", {
    //     label: "Selection Color",
    //     color: { type: "float" }, // Use float type for 0-1 range
    //   })
    //   .on("change", ({ value }) => {
    //     circleColor = new BABYLON.Vector3(value.r, value.g, value.b);
    //   });

    // lutFolder
    //   .addInput(PARAMS, "macroScaleX", {
    //     label: "macroScaleX",
    //     min: -1,
    //     max: 40,
    //     format: (v) => v.toFixed(4),
    //   })
    //   .on("change", ({ value }) => {
    //     this.macroScale = new BABYLON.Vector2(value, this.macroScale.y);
    //   });

    // lutFolder
    //   .addInput(PARAMS, "macroScaleY", {
    //     label: "macroScaleY",
    //     min: -2,
    //     max: 40,
    //     format: (v) => v.toFixed(4),
    //   })
    //   .on("change", ({ value }) => {
    //     this.macroScale = new BABYLON.Vector2(this.macroScale.x, value);
    //   });

    // lutFolder
    //   .addInput(PARAMS, "macroStrength", {
    //     label: "macroStrength",
    //     min: -2,
    //     max: 20,
    //     format: (v) => v.toFixed(4),
    //   })
    //   .on("change", ({ value }) => {
    //     this.macroStrength = value;
    //   });

    // lutFolder
    //   .addInput(PARAMS, "distanceFade", {
    //     label: "distanceFade",
    //     min: -1000,
    //     max: 20000,
    //     format: (v) => v.toFixed(4),
    //   })
    //   .on("change", ({ value }) => {
    //     this.distanceFade = value;
    //   });

    // this.fillRandomSplatmap();
    // this.dynamicSplatTexture.update();
    // this.splatMat.getEffect().setTexture("splatTexture", this.dynamicSplatTexture);

    // // this.dynamicSplatTexture = new BABYLON.DynamicTexture("splatTexture", this.splatmapCanvas, this.scene, false);
    // splatMat.setSplatTexture(this.dynamicSplatTexture);
    // splatMat.setTexture1(new BABYLON.Texture("/assets/textures/terrain/rock.png", this.scene));
    // splatMat.setTexture2(new BABYLON.Texture("/assets/textures/terrain/grass.png", this.scene));
    // splatMat.setTexture3(new BABYLON.Texture("/assets/textures/terrain/floor.png", this.scene));

    // // Optionally, adjust the UV scale
    // splatMat.setTexture1Scale(new BABYLON.Vector2(100, 100));
    // splatMat.setTexture2Scale(new BABYLON.Vector2(100, 100));
    // splatMat.setTexture3Scale(new BABYLON.Vector2(100, 100));
    //set specular power 0.5 and specolar color grey

    this.splatmapToMaterial = splatMat;

    // const splatMat2 = new SplatmapMaterial2("splatMat", this.scene);
    // splatMat2.setTexture("splatTexture", this.dynamicSplatTexture);
    // splatMat2.SetTexture
    // splatMat.setTexture1(new BABYLON.Texture("/assets/textures/terrain/rock.png", this.scene));
    // this.splatmapToMaterial = splatMat2;

    // var pbr = new BABYLON.PBRMaterial("pbr", this.scene);
    // pbr.albedoColor = new BABYLON.Color3(1, 1, 1);

    // // Attach the splat map plugin to the material
    // var splatPlugin = new SplatMapMaterialPlugin(pbr, "splat bpc plugin", 10, this.scene);

    // // Make sure the plugin's code is activated by adding a define
    // pbr.getEffect().getDefines().push("#define SPLATMAP_PLUGIN");

    // // Finally, assign the material to a mesh
    // this.splatmapToMaterial = pbr;
  }
  initializeSplatmapCanvas() {
    // Create the canvas element
    this.splatmapCanvas = document.createElement("canvas");
    this.splatmapCanvas.id = "paintingCanvas";
    this.splatmapCanvas.width = 200; // Set desired width
    this.splatmapCanvas.height = 200; // Set desired height

    // Style the canvas for positioning
    this.splatmapCanvas.style.position = "absolute";
    this.splatmapCanvas.style.top = "200px";
    this.splatmapCanvas.style.right = "10px";
    this.splatmapCanvas.style.border = "1px solid #000";
    this.splatmapCanvas.style.zIndex = "1000"; // Ensure it's above other elements
    this.splatmapCanvas.style.display = "none";
    // Append the canvas to the body or a specific container
    document.body.appendChild(this.splatmapCanvas);

    this.lightmapCanvas = document.createElement("canvas");
    this.lightmapCanvas.id = "lightmapCanvas";
    this.lightmapCanvas.width = 200; // Set desired width
    this.lightmapCanvas.height = 200; // Set desired height

    // Style the canvas for positioning
    this.lightmapCanvas.style.position = "absolute";
    this.lightmapCanvas.style.top = "400px";
    this.lightmapCanvas.style.right = "10px";
    this.lightmapCanvas.style.border = "1px solid #000";
    this.lightmapCanvas.style.zIndex = "1000"; // Ensure it's above other elements
    this.lightmapCanvas.style.display = "none";
    this.lightmapCtx = this.lightmapCanvas.getContext("2d");
    document.body.appendChild(this.lightmapCanvas);

    this.createSplatmapShader();

    this.splatmapCtx = this.splatmapCanvas.getContext("2d");
    this.fillRandomSplatmap();

    // Set up painting event listeners
    this.isPainting = false;

    this.splatmapCanvas.addEventListener("mousedown", (e) => {
      this.isPainting = true;
      this.paint(e);
      this.updateSplatmapTexture();
    });

    this.splatmapCanvas.addEventListener("mousemove", (e) => {
      if (this.isPainting) {
        this.paint(e);
        this.updateSplatmapTexture();
      }
    });

    this.splatmapCanvas.addEventListener("mouseup", () => {
      this.isPainting = false;
      this.updateSplatmapTexture();
    });

    this.splatmapCanvas.addEventListener("mouseleave", () => {
      this.isPainting = false;
    });

    // this.createSplatmapControls();
  }

  paint(event) {
    const rect = this.splatmapCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const brushSize = 10; // Adjust brush size as needed

    this.splatmapCtx.fillStyle = this.currentSplatColor;
    this.splatmapCtx.beginPath();
    this.splatmapCtx.arc(x, y, brushSize, 0, 2 * Math.PI);
    this.splatmapCtx.fill();
  }

  createSplatmapTexture() {
    const width = this.splatmapCanvas.width;
    const height = this.splatmapCanvas.height;
    const textureData = new Uint8Array(width * height * 4);

    // Initialize texture data (e.g., fill with transparent pixels)
    for (let i = 0; i < textureData.length; i += 4) {
      textureData[i] = 0; // R
      textureData[i + 1] = 0; // G
      textureData[i + 2] = 0; // B
      textureData[i + 3] = 0; // A
    }

    this.splatmapTexture = new BABYLON.RawTexture(textureData, width, height, BABYLON.Engine.TEXTUREFORMAT_RGBA, this.scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);

    // Apply the splatmap texture to your terrain material
    this.applySplatmapToMaterial();
  }

  paintOnTerrain(pickInfo) {
    // Use pick info to get intersection data on the terrain mesh
    // var pickInfo = this.getPickInfo();

    // Ensure we hit the terrain and have valid UV coordinates
    if (pickInfo.hit && pickInfo.getTextureCoordinates()) {
      var uv = pickInfo.getTextureCoordinates();

      // this.selectionCenter.x = uv.x;
      // this.selectionCenter.y = uv.y;

      // Convert UV (range 0-1) to canvas coordinates
      var canvasX = uv.x * this.splatmapCanvas.width;
      // Flip Y coordinate: canvas origin is top-left, but UV origin is bottom-left
      var canvasY = (1 - uv.y) * this.splatmapCanvas.height;

      // Define your brush properties
      this.splatmapCtx.beginPath();
      this.splatmapCtx.arc(canvasX, canvasY, this.textureBrushRadius, 0, Math.PI * 2);
      // Choose a fill color; for example, red with some transparency
      this.splatmapCtx.fillStyle = this.currentSplatColor;
      this.splatmapCtx.fill();

      // Update the dynamic texture so the shader sees the new paint
      this.dynamicSplatTexture.update();
      // this.splatMat.getEffect().setTexture("splatTexture", this.dynamicSplatTexture);
    }
  }

  paintOnTerrainLighting(pickInfo) {
    if (pickInfo.hit && pickInfo.getTextureCoordinates()) {
      var uv = pickInfo.getTextureCoordinates();
      // Convert UV (range 0-1) to canvas coordinates
      var canvasX = uv.x * this.lightmapCanvas.width;
      // Flip Y coordinate: canvas origin is top-left, but UV origin is bottom-left
      var canvasY = (1 - uv.y) * this.lightmapCanvas.height;

      // Define your brush properties
      this.lightmapCtx.beginPath();
      this.lightmapCtx.arc(canvasX, canvasY, this.textureBrushRadius, 0, Math.PI * 2);
      // Choose a fill color; for example, red with some transparency
      this.lightmapCtx.fillStyle = this.currentLightColor;
      this.lightmapCtx.fill();

      // Update the dynamic texture so the shader sees the new paint
      this.dynamicLightTexture.update();
      // this.splatMat.getEffect().setTexture("splatTexture", this.dynamicSplatTexture);
    }
  }
  // fillRandomSplatmap() {
  //   const width = this.splatmapCanvas.width;
  //   const height = this.splatmapCanvas.height;
  //   let imageData = this.splatmapCtx.createImageData(width, height);
  //   let data = imageData.data;

  //   // let base = 255;
  //   let base = 80;
  //   // Loop over each pixel and assign random colors
  //   for (let i = 0; i < data.length; i += 4) {
  //     data[i] = Math.floor(Math.random() * 125 + base / 4); // Red
  //     data[i + 1] = Math.floor(Math.random() * 125 + base / 4); // Green
  //     data[i + 2] = Math.floor(Math.random() * 125 + base / 4); // Blue
  //     data[i + 3] = 255; // Alpha (fully opaque)
  //     if (data[i] < base && data[i + 1] < base && data[i + 2] < base) {
  //       // data[i] = 80;
  //       // data[i + 1] = 80;
  //       // data[i + 2] = 80;
  //       data[i] = 125;
  //       // data[i] = 255;
  //     }
  //   }

  //   // Update the canvas with the random image data
  //   this.splatmapCtx.putImageData(imageData, 0, 0);
  //   this.dynamicSplatTexture.update();
  // }

  fillRandomSplatmap() {
    const width = this.splatmapCanvas.width;
    const height = this.splatmapCanvas.height;
    let imageData = this.splatmapCtx.createImageData(width, height);
    let data = imageData.data;

    // let base = 255;
    let base = 80;
    // Loop over each pixel and assign random colors
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.floor(Math.random() * 125 + base / 4); // Red
      data[i + 1] = Math.floor(Math.random() * 125 + base / 4); // Green
      data[i + 2] = Math.floor(Math.random() * 125 + base / 4); // Blue
      data[i + 3] = 255; // Alpha (fully opaque)
      if (data[i] < base && data[i + 1] < base && data[i + 2] < base) {
        // data[i] = 80;
        // data[i + 1] = 80;
        // data[i + 2] = 80;
        data[i] = 125;
        // data[i] = 255;
      }
    }

    // Update the canvas with the random image data
    this.splatmapCtx.putImageData(imageData, 0, 0);
    this.dynamicSplatTexture.update();
  }

  fillRandomAmbientMap() {
    const width = this.lightmapCanvas.width;
    const height = this.lightmapCanvas.height;
    let imageData = this.lightmapCtx.createImageData(width, height);
    let data = imageData.data;
    let base = 100;
    // let base = 80;

    // Loop over each pixel and assign random colors
    for (let i = 0; i < data.length; i += 4) {
      let val = Math.floor((Math.random() / 3) * 256 + base);
      // let val = base;
      data[i] = val; // Red
      data[i + 1] = val; // Green
      data[i + 2] = val; // Blue
      data[i + 3] = 255; // Alpha (fully opaque)
    }

    // Update the canvas with the random image data
    this.lightmapCtx.putImageData(imageData, 0, 0);
    this.dynamicLightTexture.update();
  }

  // fillRandomAmbientMap() {
  //   const width = this.lightmapCanvas.width;
  //   const height = this.lightmapCanvas.height;
  //   let imageData = this.lightmapCtx.createImageData(width, height);
  //   let data = imageData.data;
  //   let base = 100;

  //   // Create multiple layers of noise with different frequencies
  //   const createNoiseLayer = (frequency) => {
  //     const noise = new Array(width * height);
  //     for (let y = 0; y < height; y++) {
  //       for (let x = 0; x < width; x++) {
  //         // Create larger patterns by reducing frequency
  //         const nx = (x * frequency) / width;
  //         const ny = (y * frequency) / height;
  //         // Simple noise function (can be replaced with better noise algorithms)
  //         noise[y * width + x] = Math.sin(nx) * Math.cos(ny) * Math.sin(nx * 2.5) * Math.cos(ny * 2.5);
  //       }
  //     }
  //     return noise;
  //   };

  //   // Create multiple noise layers with different frequencies
  //   const noiseLayer1 = createNoiseLayer(4); // Large patterns
  //   const noiseLayer2 = createNoiseLayer(8); // Medium patterns
  //   const noiseLayer3 = createNoiseLayer(16); // Small patterns

  //   // Blend the layers and apply to the image data
  //   for (let y = 0; y < height; y++) {
  //     for (let x = 0; x < width; x++) {
  //       const i = (y * width + x) * 4;

  //       // Blend different noise layers with weights
  //       const blendedNoise =
  //         noiseLayer1[y * width + x] * 0.5 + // 50% large patterns
  //         noiseLayer2[y * width + x] * 0.01 + // 30% medium patterns
  //         noiseLayer3[y * width + x] * 0.01; // 20% small patterns

  //       // Normalize to 0-1 range and apply base value
  //       const normalizedValue = (blendedNoise + 1) / 2;
  //       const val = Math.floor(normalizedValue * 156 + base);

  //       // Apply smoothed value to all channels
  //       data[i] = val; // Red
  //       data[i + 1] = val; // Green
  //       data[i + 2] = val; // Blue
  //       data[i + 3] = 255; // Alpha (fully opaque)
  //     }
  //   }

  //   // Apply Gaussian blur for additional smoothing
  //   this.applyGaussianBlur(data, width, height, 2);

  //   // Update the canvas with the smoothed image data
  //   this.lightmapCtx.putImageData(imageData, 0, 0);
  //   this.dynamicLightTexture.update();
  // }

  // // Helper method for Gaussian blur
  // applyGaussianBlur(data, width, height, radius) {
  //   const kernel = this.createGaussianKernel(radius);
  //   const tempData = new Uint8ClampedArray(data);

  //   for (let y = 0; y < height; y++) {
  //     for (let x = 0; x < width; x++) {
  //       let r = 0,
  //         g = 0,
  //         b = 0;
  //       let weightSum = 0;

  //       // Apply kernel
  //       for (let ky = -radius; ky <= radius; ky++) {
  //         for (let kx = -radius; kx <= radius; kx++) {
  //           const px = Math.min(Math.max(x + kx, 0), width - 1);
  //           const py = Math.min(Math.max(y + ky, 0), height - 1);
  //           const i = (py * width + px) * 4;
  //           const weight = kernel[ky + radius][kx + radius];

  //           r += tempData[i] * weight;
  //           g += tempData[i + 1] * weight;
  //           b += tempData[i + 2] * weight;
  //           weightSum += weight;
  //         }
  //       }

  //       const i = (y * width + x) * 4;
  //       data[i] = r / weightSum;
  //       data[i + 1] = g / weightSum;
  //       data[i + 2] = b / weightSum;
  //     }
  //   }
  // }

  // // Helper method to create Gaussian kernel
  // createGaussianKernel(radius) {
  //   const kernel = [];
  //   const sigma = radius / 3;
  //   let sum = 0;

  //   for (let y = -radius; y <= radius; y++) {
  //     const row = [];
  //     for (let x = -radius; x <= radius; x++) {
  //       const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
  //       row.push(value);
  //       sum += value;
  //     }
  //     kernel.push(row);
  //   }

  //   // Normalize kernel
  //   for (let y = 0; y < kernel.length; y++) {
  //     for (let x = 0; x < kernel[y].length; x++) {
  //       kernel[y][x] /= sum;
  //     }
  //   }

  //   return kernel;
  // }

  // updateSplatmapTexture() {
  //   this.dynamicSplatTexture.update();
  // }

  createAssetBrowser() {
    // Create the asset browser container
    const assetBrowser = document.createElement("div");
    assetBrowser.id = "assetBrowser";
    assetBrowser.style.position = "relative";
    // assetBrowser.style.right = "4vw";
    assetBrowser.style.top = "-97%";
    assetBrowser.style.maxWidth = "1400px";
    assetBrowser.style.margin = "auto";
    // assetBrowser.style.transform = "translateY(-50%)";
    assetBrowser.style.width = "80vw";
    assetBrowser.style.height = "67vh";
    assetBrowser.style.backgroundColor = "rgba(0, 0, 0, 0.0)";
    // assetBrowser.style.backgroundImage = "url(/assets/textures/terrain/icons/bar_background.png)";
    assetBrowser.style.backgroundSize = "cover";
    assetBrowser.style.padding = "20px";
    assetBrowser.style.borderRadius = "8px";
    assetBrowser.style.display = "none";
    assetBrowser.style.flexDirection = "column";
    assetBrowser.style.gap = "15px";
    assetBrowser.style.zIndex = "9999";
    assetBrowser.style.transition = "all 0.3s ease";
    assetBrowser.style.backdropFilter = "blur(4px)";
    // assetBrowser.style.backgroundPosition = "-20px -124px";
    // assetBrowser.style.backgroundRepeat = "no-repeat";
    // assetBrowser.style.backgroundSize = "102.5% 185%";
    // assetBrowser.style.opacity = "0.95";
    assetBrowser.classList.add("assetBrowser");

    // Create search input
    const searchContainer = document.createElement("div");
    searchContainer.style.display = "flex";
    searchContainer.style.alignItems = "center";
    searchContainer.style.gap = "10px";
    searchContainer.style.marginBottom = "15px";

    const searchInput = document.createElement("input");
    searchInput.id = "assetSearchInput";
    searchInput.type = "text";
    searchInput.placeholder = "Search assets...";
    searchInput.style.flex = "1";
    searchInput.style.padding = "8px 12px";
    searchInput.style.borderRadius = "4px";
    searchInput.style.border = "none";
    searchInput.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
    searchInput.style.color = "#ffe8b4";
    searchInput.style.color = "rgb(255 255 213)";

    searchInput.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif';
    // searchInput.style.backgroundImage = "url(/assets/textures/terrain/icons/titlebar.png)";
    searchInput.style.backgroundPosition = "7px -16px";
    searchInput.style.backgroundSize = "103% 54px";

    searchInput.style.backgroundPosition = "-2.5vw -21px";
    searchInput.style.backgroundSize = "108% 107px";
    searchInput.style.marginTop = "21px";
    searchInput.style.marginLeft = "3%";
    searchInput.style.marginRight = "3%";

    searchInput.style.height = "73px";
    searchInput.style.fontSize = "20px";
    searchInput.style.borderRadius = "22px";
    searchInput.style.paddingLeft = "30px";

    searchInput.addEventListener("keydown", (e) => {
      e.stopPropagation();
    });

    // Add this code after the assetGrid creation but before appending to assetBrowser
    const customUrlContainer = document.createElement("div");
    customUrlContainer.style.position = "absolute";
    customUrlContainer.style.bottom = "20px";
    customUrlContainer.style.left = "50%";
    customUrlContainer.style.transform = "translateX(-50%)";
    customUrlContainer.style.display = "flex";
    customUrlContainer.style.gap = "10px";
    customUrlContainer.style.alignItems = "center";
    customUrlContainer.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
    customUrlContainer.style.padding = "15px";
    customUrlContainer.style.borderRadius = "8px";
    customUrlContainer.style.width = "80%";
    customUrlContainer.style.maxWidth = "600px";

    // Create name input
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Asset Name in File";
    nameInput.style.flex = "1";
    nameInput.style.padding = "8px 12px";
    nameInput.style.borderRadius = "4px";
    nameInput.style.border = "none";
    nameInput.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
    nameInput.style.color = "white";
    nameInput.style.fontSize = "14px";

    // Create URL input
    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.placeholder = "Asset URL";
    urlInput.style.flex = "2";
    urlInput.style.padding = "8px 12px";
    urlInput.style.borderRadius = "4px";
    urlInput.style.border = "none";
    urlInput.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
    urlInput.style.color = "white";
    urlInput.style.fontSize = "14px";

    // Create Add button
    const addButton = document.createElement("button");
    addButton.textContent = "Load Asset";
    addButton.style.padding = "8px 16px";
    addButton.style.borderRadius = "4px";
    addButton.style.border = "none";
    addButton.style.backgroundColor = "#e68b00";
    addButton.style.color = "white";
    addButton.style.cursor = "pointer";
    addButton.style.transition = "all 0.2s ease";

    // Add hover effects
    addButton.addEventListener("mouseover", () => {
      addButton.style.backgroundColor = "#ff9900";
    });
    addButton.addEventListener("mouseout", () => {
      addButton.style.backgroundColor = "#e68b00";
    });

    // Add click handler
    addButton.addEventListener("click", async () => {
      const name = nameInput.value.trim();
      const url = urlInput.value.trim();

      if (!name || !url) {
        alert("Please enter both a name and URL");
        return;
      }

      try {
        const mesh = await window.ASSET_MANAGER.loadCustomURL(url, name, window.SCENE_MANAGER.activeScene);
        if (mesh) {
          window.TERRAIN_EDITOR.addModel(mesh);
          nameInput.value = "";
          urlInput.value = "";
        }
      } catch (error) {
        console.error("Error loading custom asset:", error);
        alert("Failed to load asset. Please check the URL and try again.");
      }
    });
    // / Prevent event propagation for the inputs
    nameInput.addEventListener("keydown", (e) => e.stopPropagation());
    urlInput.addEventListener("keydown", (e) => e.stopPropagation());

    // Add elements to container
    customUrlContainer.appendChild(nameInput);
    customUrlContainer.appendChild(urlInput);
    customUrlContainer.appendChild(addButton);

    // Add the container to the asset browser
    assetBrowser.appendChild(customUrlContainer);

    // Create asset grid
    const assetGrid = document.createElement("div");
    assetGrid.style.display = "grid";
    // assetGrid.style.gridTemplateColumns = "repeat(4, 1fr)";
    assetGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(125px, 1fr))";
    assetGrid.style.gap = "15px";
    assetGrid.style.overflowY = "auto";
    assetGrid.style.padding = "10px";
    assetGrid.id = "assetGrid";

    // Add some sample assets (you can replace these with your actual assets)
    const sampleAssets = [
      // { name: "Tree", preview: "/assets/textures/terrain/icons/objects.png", asset_type: "Model", asset_id: "1" },
      // { name: "Rock", preview: "/assets/textures/terrain/icons/terrain.png", asset_type: "Model", asset_id: "2" },
      // { name: "Bush", preview: "/assets/textures/terrain/icons/grass.png", asset_type: "Model", asset_id: "3" },
      {
        asset_id: 8,
        name: "Leaves Small",
        asset_type: "Model",
        file_path: "https://game.openworldbuilder.com/assets/textures/terrain/trees/newTreePacked.glb",
        mesh: "Mesh_1.001",
        image_link: "/assets/thumbnails/Leaves Small.png",
        description: "The leaves of a tree, consider matching with a trunk.",
        radius: 70,
        target_y: 12,
        material_type: "leaves",
        preffered_scale: 1,
      },
      // Add more assets as needed
    ];

    sampleAssets.forEach((asset) => {
      const assetCard = document.createElement("div");
      assetCard.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
      assetCard.style.borderRadius = "4px";
      assetCard.style.padding = "10px";
      assetCard.style.cursor = "pointer";
      assetCard.style.transition = "all 0.15s ease";

      const preview = document.createElement("img");
      preview.src = asset.preview;
      preview.style.width = "100%";
      preview.style.height = "100px";
      preview.style.objectFit = "cover";
      preview.style.borderRadius = "4px";
      preview.style.marginBottom = "8px";

      const name = document.createElement("div");
      name.textContent = asset.name;
      name.style.color = "white";
      name.style.textAlign = "center";
      name.style.fontSize = "14px";

      assetCard.appendChild(preview);
      assetCard.appendChild(name);

      assetCard.onmouseover = () => {
        assetCard.style.transform = "scale(1.05)";
        assetCard.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
      };

      assetCard.onmouseout = () => {
        assetCard.style.transform = "scale(1)";
        assetCard.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      };

      assetGrid.appendChild(assetCard);
    });

    function createCloseButton() {
      const closeBtn = document.createElement("button");
      // closeBtn.innerHTML = "×";
      closeBtn.style.cssText = `
        position: absolute;
/*       top: 63px;
  right: 10vw; */
      top: -12px;
    right: -20px;

        width: 55px;
        height: 30px;
      //   border-radius: 50%;
      //   background: #ff4444;
      background-size: contain;
        background-position:
        color: black;
        background: black;
  center;
  background-size: 55px 33px;
        background-image: url("/assets/textures/terrain/icons/xbutton.png");
        color: white;
        border: none;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        line-height: 1;
        box-shadow: rgb(0, 0, 0) 0px 0px 10px;
        transition: filter 0.2s ease;
        filter: brightness(1.3);
        
      `;

      closeBtn.addEventListener("mouseover", () => {
        closeBtn.style.filter = "brightness(1.4)";
      });
      closeBtn.addEventListener("mouseout", () => {
        closeBtn.style.filter = "brightness(1.2)";
      });
      closeBtn.addEventListener("click", () => {
        closeBtn.parentElement.style.display = "none";
        const canvas = document.getElementById("renderCanvas");
        canvas.focus();
        // this.canvas.focus(); in function, cant use this
      });

      return closeBtn;
    }
    let closeBtn = createCloseButton();
    assetBrowser.appendChild(closeBtn);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        assetBrowser.style.display = "none";
        this.canvas.focus();
      }
    });

    updateAssetGrid(assetGrid, sampleAssets);

    setTimeout(() => {
      updateAssetGrid(assetGrid, window.assetsSearchResults);
      clickAssetsByNames(["Castle Wall", "Barrel", "Leaves Small"]);
    }, 13000);
    // Add search input listener
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      const filteredAssets = window.assetsSearchResults.filter((asset) => asset.name.toLowerCase().includes(query) || asset.description.toLowerCase().includes(query));
      updateAssetGrid(assetGrid, filteredAssets);
    });

    // Function to update asset grid
    function updateAssetGrid(grid, assets) {
      // filter assets to only get models
      const models = assets.filter((asset) => asset.asset_type === "Model");
      assets = models;
      console.log(assets);

      grid.innerHTML = "";
      assets.forEach((asset) => {
        const assetCard = document.createElement("div");
        // assetCard.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
        assetCard.style.position = "relative";
        assetCard.style.borderRadius = "4px";
        assetCard.style.padding = "10px";
        assetCard.style.cursor = "pointer";
        assetCard.style.transition = "all 0.15s ease";
        assetCard.style.backgroundColor = "rgba(255, 255, 255, 0.02)";
        assetCard.asset_id = asset.asset_id;

        const preview = document.createElement("img");
        preview.src = "https://openworldbuilder.com" + asset.image_link;
        preview.style.width = "100%";
        preview.style.height = "100px";
        preview.style.objectFit = "cover";
        preview.style.borderRadius = "4px";
        preview.style.marginBottom = "8px";

        const name = document.createElement("div");
        name.textContent = asset.name;
        name.style.color = "white";
        name.style.textAlign = "center";
        name.style.fontSize = "14px";

        assetCard.appendChild(preview);
        assetCard.appendChild(name);

        assetCard.onmouseover = () => {
          assetCard.style.transform = "scale(1.05)";
          preview.style.filter = "brightness(1.6)";
          assetCard.style.backgroundColor = "rgba(255, 255, 255, 0.05)";

          // assetCard.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
        };

        assetCard.onmouseout = () => {
          assetCard.style.transform = "scale(1)";
          preview.style.filter = "brightness(1.3)";
          assetCard.style.backgroundColor = "rgba(255, 255, 255, 0.02)";
        };

        assetCard.onclick = async () => {
          try {
            const mesh = await window.ASSET_MANAGER.load(asset, window.SCENE_MANAGER.activeScene);
            // console.log("Loaded mesh:", mesh);
            // this.add
            // console.log("mesh", mesh.getChildMeshes());
            // let meshToAdd = mesh.getChildMeshes()[0].clone(`template_${mesh.name}`);
            let meshToAdd = mesh.clone(`template_${mesh.name}`);
            meshToAdd.scaling = new BABYLON.Vector3(1, 1, 1);
            meshToAdd.asset_id = asset.asset_id;
            meshToAdd.material_type = asset.material_type;
            // meshToAdd
            //
            window.TERRAIN_EDITOR.addModel(meshToAdd);

            //Close search menu when picked an asset
            assetBrowser.style.display = "none";
            const canvas = document.getElementById("renderCanvas");
            canvas.focus();

            // add remove button to the asset card
            updateAssetCardRemoveButton(assetCard);
          } catch (error) {
            console.error("Error loading asset:", error);
          }
        };

        grid.appendChild(assetCard);

        // Check if this asset is in templates and add remove button if it is
        // if (window.TERRAIN_EDITOR) {
        //   const isInTemplates = Object.values(window.TERRAIN_EDITOR.objectTemplates).some((template) => template.asset_id === asset.asset_id);

        //   if (isInTemplates) {
        //     updateAssetCardRemoveButton(assetCard);
        //   }
        // }
      });

      // clickAssetsByNames(["Barrel", "Castle Stairs", "Castle Wall", "Castle Floor", "Light Ray"]);
    }

    function clickAssetsByNames(assetNames) {
      // Convert to array if a single name is passed
      const names = Array.isArray(assetNames) ? assetNames : [assetNames];

      // Get all asset cards
      const assetCards = document.querySelectorAll("div");

      // Filter and click cards that match the names
      assetCards.forEach((card) => {
        const nameDiv = card.querySelector("div");
        if (nameDiv && names.includes(nameDiv.textContent)) {
          card.click();
        }
      });
    }

    function updateAssetCardRemoveButton(assetCard) {
      // Check if this asset is in templates
      // const isInTemplates = Object.values(this.objectTemplates).some((template) => template.asset_id === asset.asset_id);

      // if (isInTemplates) {
      // Create close button
      const closeButton = document.createElement("button");
      closeButton.innerHTML = "×";
      closeButton.style.position = "absolute";
      closeButton.style.top = "5px";
      closeButton.style.right = "5px";
      closeButton.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
      closeButton.style.color = "white";
      closeButton.style.border = "none";
      closeButton.style.borderRadius = "50%";
      closeButton.style.width = "24px";
      closeButton.style.height = "24px";
      closeButton.style.cursor = "pointer";
      closeButton.style.display = "flex";
      closeButton.style.alignItems = "center";
      closeButton.style.justifyContent = "center";
      closeButton.style.fontSize = "16px";
      closeButton.style.transition = "all 0.2s ease";
      closeButton.style.zIndex = "1";

      // Add hover effects
      closeButton.onmouseover = (e) => {
        e.stopPropagation(); // Prevent card hover effect
        closeButton.style.backgroundColor = "rgba(255, 0, 0, 0.9)";
        closeButton.style.transform = "scale(1.1)";
      };

      closeButton.onmouseout = (e) => {
        e.stopPropagation(); // Prevent card hover effect
        closeButton.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
        closeButton.style.transform = "scale(1)";
      };

      // Add click handler
      closeButton.onclick = (e) => {
        e.stopPropagation(); // Prevent card click
        // Find and remove the template
        Object.entries(window.TERRAIN_EDITOR.objectTemplates).forEach(([key, template]) => {
          if (template.asset_id === assetCard.asset_id) {
            // template.dispose();

            template.setEnabled(false);

            delete window.TERRAIN_EDITOR.objectTemplates[key];
          }
        });
        window.TERRAIN_EDITOR.setupTemplatePreview();
        // Update the number grid
        window.TERRAIN_EDITOR.numberGrid.update();
        // Update the asset card (remove close button)
        closeButton.remove();
        assetCard.style.backgroundColor = "rgba(255, 255, 255, 0.02)";
      };

      assetCard.appendChild(closeButton);
      // assetCard.style.backgroundColor = "rgba(100, 255, 100, 0.05)"; // Highlight selected assets
      // }
    }

    searchContainer.appendChild(searchInput);
    assetBrowser.appendChild(searchContainer);
    assetBrowser.appendChild(assetGrid);
    document.body.appendChild(assetBrowser);

    //asset search
    async function fetchAssetsSQL(search = "") {
      // Build SQL query
      // let sql = "SELECT * FROM asset where name = '" + search + "'";
      let sql = "SELECT * FROM asset";
      console.log(window.location.hostname);
      const API_URL = window.location.hostname === "localhost" ? "http://localhost:3000/v1/database/c2008f332bb48b811c15ec9e918a715185d0d947c7208bf2e1fadaa3715ed636/sql" : "https://openworldbuilder.com/assetSearch";

      const TOKEN = window.location.hostname === "localhost" ? "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJoZXhfaWRlbnRpdHkiOiJjMjAwOWM3ODRjNDRlMjc1M2Y0MWRjMjExMmNlY2JmZmExYmE4MGMxZTMxZWQ5ZDA0Y2VlOGEwMDc2MjExNjI4Iiwic3ViIjoiOWM2ZjI3YzktODZlNy00ZTFlLWEwNjUtODczMDdhYTkxZGIxIiwiaXNzIjoibG9jYWxob3N0IiwiYXVkIjpbInNwYWNldGltZWRiIl0sImlhdCI6MTc0NjIzNTk2NiwiZXhwIjpudWxsfQ.wTdE5nF1kMiwIkd1DVp6c1r30LnH7DvZYO1Z1QeYB6itsvgHbsJinJMp4JcUZEnDgBYco0y_1IQrHo2Xswl4MQ" : "";

      // Fetch from API
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + TOKEN,
          "Content-Type": "application/json",
        },
        body: sql,
      });
      const result = await response.json();
      const assetsRaw = await parseAssetsApiResponse(result);
      console.log("assetsRaw", assetsRaw);
      // const assets = addDefaultFields(assetsRaw);
      // console.log("rows", result[0].rows);

      // this.assets = assets;
      window.assetsSearchResults = assetsRaw;
    }
    function addDefaultFields(assets) {
      console.log(assets[0]);
      return assets.map((asset) => ({
        id: asset.asset_id,
        name: asset.name || "Untitled Asset",
        load_script: asset.load_script || "loadTree",
        description: asset.description || `${asset.name || "Untitled Asset"}`,
        type: asset.type || "Models", // Default to Models if no type specified
        thumbnail: asset.image_link || "/assets/thumbnails/default.png",
        size: asset.size || "1MB",
        tags: asset.tags ? JSON.parse(asset.tags) : ["Props", "Environment"],
        // Technical fields
        file_path: asset.file_path || "test",
        export_path: asset.export_path || "",
        blender_object: asset.blender_object || "",
      }));
    }
    function parseAssetsApiResponse(apiResponse) {
      // The response is an array with one object
      // The response is an array with one object
      const result = apiResponse[0];

      // Get field names from schema
      const fieldNames = result.schema.elements.map((e) => e.name.some);

      // Map each row (array) to an object
      return result.rows.map((rowArr) => {
        const obj = {};
        fieldNames.forEach((field, i) => {
          obj[field] = rowArr[i];
        });
        return obj;
      });
    }

    setTimeout(() => {
      fetchAssetsSQL();
    }, 3000);

    return assetBrowser;
  }
}

function createMultiplayerBrowser() {
  // Create the multiplayer browser container
  const multiplayerBrowser = document.createElement("div");
  multiplayerBrowser.id = "multiplayerBrowser";
  multiplayerBrowser.style.position = "relative";
  multiplayerBrowser.style.top = "-100%";
  multiplayerBrowser.style.maxWidth = "1400px";
  multiplayerBrowser.style.margin = "auto";
  multiplayerBrowser.style.width = "100vw";
  multiplayerBrowser.style.height = "100vh";
  multiplayerBrowser.style.backgroundColor = "rgba(0, 0, 0, 0.0)";
  multiplayerBrowser.style.backgroundSize = "cover";
  multiplayerBrowser.style.padding = "20px";
  multiplayerBrowser.style.borderRadius = "8px";
  multiplayerBrowser.style.display = "none";
  multiplayerBrowser.style.flexDirection = "column";
  multiplayerBrowser.style.gap = "15px";
  multiplayerBrowser.style.zIndex = "1001";
  multiplayerBrowser.style.transition = "all 0.3s ease";
  multiplayerBrowser.style.backdropFilter = "blur(4px)";
  multiplayerBrowser.classList.add("multiplayerBrowser");

  // Create header text
  const headerText = document.createElement("h2");
  headerText.textContent = "Available Servers";
  headerText.style.color = "white";
  headerText.style.textAlign = "center";
  headerText.style.marginTop = "40px";
  headerText.style.fontSize = "24px";

  // Create channel grid
  const channelGrid = document.createElement("div");
  channelGrid.style.display = "grid";
  channelGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(250px, 1fr))";
  channelGrid.style.gap = "20px";
  channelGrid.style.padding = "20px";
  channelGrid.style.margin = "0 auto";
  channelGrid.style.maxWidth = "100vw";

  // Default channels
  const channels = [
    { name: "Server 1", players: "?/20", status: "Active" },
    { name: "Server 2", players: "?/20", status: "Active" },
    { name: "Server 3", players: "?/20", status: "Active" },
    { name: "Server 4", players: "?/20", status: "Active" },
    { name: "Server 5", players: "?/20", status: "Active" },
  ];

  // Create confirmation dialog
  const createConfirmDialog = (channelName) => {
    const dialog = document.createElement("div");
    dialog.style.position = "fixed";
    dialog.style.top = "50%";
    dialog.style.left = "50%";
    dialog.style.transform = "translate(-50%, -50%)";
    dialog.style.backgroundColor = "rgba(0, 0, 0, 0.95)";
    dialog.style.padding = "30px";
    dialog.style.borderRadius = "10px";
    dialog.style.zIndex = "1002";
    dialog.style.minWidth = "300px";
    dialog.style.textAlign = "center";
    dialog.style.boxShadow = "0 0 20px rgba(0, 0, 0, 0.5)";
    dialog.style.border = "1px solid rgba(255, 255, 255, 0.1)";

    const message = document.createElement("p");
    message.textContent = `Are you sure you want to join ${channelName}? This will overwrite your existing changes.`;
    message.style.color = "white";
    message.style.marginBottom = "20px";

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "center";
    buttonContainer.style.gap = "15px";

    const stayButton = document.createElement("button");
    stayButton.textContent = "Stay Here";
    stayButton.style.padding = "10px 20px";
    stayButton.style.backgroundColor = "#444";
    stayButton.style.color = "white";
    stayButton.style.border = "none";
    stayButton.style.borderRadius = "5px";
    stayButton.style.cursor = "pointer";
    stayButton.style.transition = "background-color 0.2s";

    const overwriteButton = document.createElement("button");
    overwriteButton.textContent = "Join Server";
    overwriteButton.style.padding = "10px 20px";
    overwriteButton.style.backgroundColor = "#e68b00";
    overwriteButton.style.color = "white";
    overwriteButton.style.border = "none";
    overwriteButton.style.borderRadius = "5px";
    overwriteButton.style.cursor = "pointer";
    overwriteButton.style.transition = "background-color 0.2s";

    stayButton.onclick = () => {
      dialog.remove();
      multiplayerBrowser.style.filter = "none";
    };

    overwriteButton.onclick = () => {
      // Handle joining server and overwriting changes
      // if (window.MULTIPLAYER) {
      //   window.MULTIPLAYER.joinChannel(channelName);
      // }
      // dialog.remove();
      // multiplayerBrowser.style.filter = "none";
      // multiplayerBrowser.style.display = "none";
      // Get the channel index (1-based) from the channels array
      const channelIndex = channels.findIndex((ch) => ch.name === channelName) + 1;

      // Construct the new URL with server parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("server", channelIndex.toString());

      // Reload the page with the new URL
      window.location.href = newUrl.toString();
    };

    buttonContainer.appendChild(stayButton);
    buttonContainer.appendChild(overwriteButton);
    dialog.appendChild(message);
    dialog.appendChild(buttonContainer);

    return dialog;
  };

  channels.forEach((channel) => {
    const channelCard = document.createElement("div");
    channelCard.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
    channelCard.style.borderRadius = "8px";
    channelCard.style.padding = "20px";
    channelCard.style.cursor = "pointer";
    channelCard.style.transition = "all 0.2s ease";
    channelCard.style.border = "1px solid rgba(255, 255, 255, 0.1)";

    const channelName = document.createElement("h3");
    channelName.textContent = channel.name;
    channelName.style.color = "white";
    channelName.style.marginBottom = "10px";

    const channelInfo = document.createElement("div");
    channelInfo.style.color = "#aaa";
    channelInfo.style.fontSize = "14px";
    channelInfo.innerHTML = `
          <div>Players: ${channel.players}</div>
          <div>Status: ${channel.status}</div>
      `;

    channelCard.appendChild(channelName);
    channelCard.appendChild(channelInfo);

    channelCard.onmouseover = () => {
      channelCard.style.transform = "translateY(-5px)";
      channelCard.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
    };

    channelCard.onmouseout = () => {
      channelCard.style.transform = "translateY(0)";
      channelCard.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
    };

    channelCard.onclick = () => {
      multiplayerBrowser.style.filter = "blur(3px)";
      const dialog = createConfirmDialog(channel.name);
      document.body.appendChild(dialog);
    };

    channelGrid.appendChild(channelCard);
  });

  // Create close button
  const closeBtn = document.createElement("button");
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "63px";
  closeBtn.style.right = "10vw";
  closeBtn.style.width = "55px";
  closeBtn.style.height = "30px";
  closeBtn.style.backgroundSize = "65px 40px";
  closeBtn.style.backgroundImage = 'url("/assets/textures/terrain/icons/xbutton.png")';
  closeBtn.style.backgroundPosition = "center";
  closeBtn.style.border = "none";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.transition = "filter 0.2s ease";
  closeBtn.style.filter = "brightness(1.2)";
  closeBtn.style.backgroundColor = "transparent";

  closeBtn.onclick = () => (multiplayerBrowser.style.display = "none");
  closeBtn.onmouseover = () => (closeBtn.style.filter = "brightness(1.4)");
  closeBtn.onmouseout = () => (closeBtn.style.filter = "brightness(1.2)");

  multiplayerBrowser.appendChild(closeBtn);
  multiplayerBrowser.appendChild(headerText);
  multiplayerBrowser.appendChild(channelGrid);
  document.body.appendChild(multiplayerBrowser);

  return multiplayerBrowser;
}

class SplatMapMaterial extends BABYLON.CustomMaterial {
  constructor(name, scene) {
    super(name, scene);

    // Add uniforms for the splat map and the three textures.
    // "sampler2D" type is used for textures.
    this.AddUniform("splatTexture", "sampler2D");
    this.AddUniform("texture1", "sampler2D");
    this.AddUniform("texture2", "sampler2D");
    this.AddUniform("texture3", "sampler2D");
    this.AddUniform("uSymbolsTexture", "sampler2D");
    this.AddUniform("splatmapSampler", "sampler2D");
    this.AddUniform("uMinAmbient", "float", 0.05);

    // Add uniforms for the UV scales (vec2).
    this.AddUniform("texture1Scale", "vec2", new BABYLON.Vector2(100, 100));
    this.AddUniform("texture2Scale", "vec2", new BABYLON.Vector2(100, 100));
    this.AddUniform("texture3Scale", "vec2", new BABYLON.Vector2(100, 100));

    this.AddUniform("selectionCenter", "vec2", new BABYLON.Vector2(0, 0));
    this.AddUniform("selectionRadius", "float", 0.1);
    this.AddUniform("edgeSoftness", "float", 0.1);
    this.AddUniform("circleColor", "vec3", new BABYLON.Vector3(0.23, 1.0, 0));

    this.AddUniform("noiseTexture", "sampler2D");
    this.AddUniform("macroScale", "vec2", new BABYLON.Vector2(0.01, 0.01));
    this.AddUniform("macroStrength", "float", 0.5);
    this.AddUniform("distanceFade", "float", 2000.0);
    this.AddUniform("cameraPosition", "vec3", new BABYLON.Vector3(0, 0, 0));

    this.AddUniform("time", "float", 0);

    this.AddAttribute("uv");
    this.Vertex_Definitions(`
    varying vec2 vUV;
`);
    this.Vertex_MainBegin(`
    vUV = uv;
`);

    this.diffuseColor = new BABYLON.Color3(1, 1, 1);

    // Assign a dummy diffuse texture to ensure vUV is defined.
    // this.diffuseTexture = new BABYLON.Texture(, scene);

    // Inject custom fragment code to override the albedo (diffuse) calculation.
    // This code will sample the splat map and then blend three textures accordingly.
    this.Fragment_Custom_Diffuse(`
    // vec4 txt = texture2D(texture1, vDiffuseUV * texture1Scale);
    // diffuseColor = txt.rgb;

    // vec4 splat = texture2D(splatTexture, vDiffuseUV);
    vec4 lightmapTex = texture2D(splatmapSampler, vDiffuseUV);
    

    // // Sample each texture with its own UV scale
    vec4 tex1 = texture2D(texture1, vDiffuseUV * texture1Scale);
    vec4 tex2 = texture2D(texture2, vDiffuseUV * texture2Scale);
    vec4 tex3 = texture2D(texture3, vDiffuseUV * texture3Scale);

    vec4 tex2Tiling = texture2D(texture2, vDiffuseUV * texture2Scale * 0.1) * 0.55;



      //Macro Anti-Tiling
    // Sample noise texture at different scales
    vec4 noise = texture2D(noiseTexture, vDiffuseUV * macroScale);
    vec4 noise2 = texture2D(noiseTexture, vDiffuseUV * macroScale * 2.3);
    
    // Calculate view distance for fade
    // float macroDist = length(vPositionW);
        float macroDist = distance(vPositionW, cameraPosition);
      float distanceFactor = clamp(macroDist / distanceFade, 0.0, 1.0);
  
    
    // Blend noise with base textures
    vec4 tex1Detail = mix(tex1, tex2Tiling,  macroStrength * distanceFactor);
    vec4 tex2Detail = mix(tex2, tex2Tiling,  macroStrength * distanceFactor);
    vec4 tex3Detail = mix(tex3, tex2Tiling,  macroStrength * distanceFactor);
    // noise.r

// Max Isntead of Mic
//     float influence = macroStrength * distanceFactor;
// vec4 adjustedNoise = noise * influence;
//     vec4 tex1Detail = max(tex1, adjustedNoise);
//     vec4 tex2Detail = max(tex2, adjustedNoise);
// vec4 tex3Detail = max(tex3, adjustedNoise);
    

    
    // // // // Blend the textures based on the splatmap's red, green, and blue channels
    // vec4 finalColor = tex1 * splat.r + tex2 * splat.g + tex3 * splat.b;
    
    // No Anti-Tiling
    // vec4 finalBlend = tex1 * lightmapTex.r + tex2 * lightmapTex.g + tex3 * lightmapTex.b;

// Anti tiling
    vec4 finalBlend = tex1Detail * lightmapTex.r + 
                     tex2Detail * lightmapTex.g + 
                     tex3Detail * lightmapTex.b;

    diffuseColor = finalBlend.rgb;

       // Compute the distance from the current UV to the selection circle center.
      // float dist = distance(vDiffuseUV, selectionCenter);
          // float circleMask = smoothstep(selectionRadius, selectionRadius - edgeSoftness, dist);
          // vec3 finalBlendCircle = mix(circleColor, finalBlend.rgb, circleMask);

    // diffuseColor = finalBlendCircle;
    // finalColor
      `);

    // Compute distance from current UV coordinate to the selection center
    this.Fragment_Before_FragColor(`
    // vec3 minAmbient = diffuseColor * uMinAmbient;
    // vec3 minAmbient = color.rgb * uMinAmbient;

    /* max() keeps every channel at least minAmbient,
       but still lets real lighting lift it higher          */
    // color.rgb = max(color.rgb, minAmbient);
      
  float dist = distance(vDiffuseUV, selectionCenter);
  
  // Create rotation matrix based on time
  float rotationSpeed = 0.5;
  float rotation = time * rotationSpeed;
  mat2 rotMat = mat2(
    cos(rotation), -sin(rotation),
    sin(rotation), cos(rotation)
  );

  // Get vector from center and rotate it
  vec2 fromCenter = rotMat * (vDiffuseUV - selectionCenter);
  
  // Map to texture coordinates (assuming square texture)
  vec2 texCoord = fromCenter / selectionRadius * 0.5 + 0.5;
  
  // Sample the symbol texture
  vec4 symbolsTexture = texture2D(uSymbolsTexture, texCoord);
  
  // Combine with glow effect
  float glowMask = 1.0 - smoothstep(selectionRadius - edgeSoftness, selectionRadius, dist);
  color.rgb = mix(color.rgb, circleColor, glowMask * symbolsTexture.r);

  
    `);
  }
}
