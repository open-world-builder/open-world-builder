export class RemotePlayer {
  constructor(position) {
    this.defaultSpawnPosition = new BABYLON.Vector3(
      1706.683, // Default Spawn Point For Terrain Patch
      -775,
      1277.427
    );
    if (position) {
      this.defaultSpawnPosition = position;
    }
    this.targetPosition = this.defaultSpawnPosition;
    this.currentPosition = this.defaultSpawnPosition.clone();
    this.targetRotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(3.14 / 2, 3.14 / 2, 0);
    this.currentRotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(3.14 / 2, 3.14 / 2, 0);

    this.offset = new BABYLON.Vector3(0, -10.1, 0);

    this.mesh = null;
    this.interpolationFactor = 0.01; // Adjust this value between 0 and 1 for different smoothing effects

    this.checkAndCreateVisual();
    console.log("RemotePlayer constructor");

    //thinInstanceId // Value in the thin instance array to update

    // this.setupGUI();
    this.animationOverrideUI = false;
    // Animation presets for quick access
    window.addEventListener("keydown", (event) => {
      if (event.key === "\\") {
        this.createAnimationOverrideUI();
      }
    });
  }
  createAnimationOverrideUI() {
    if (this.animationOverrideUI) {
      // If UI already exists, remove it
      const existingUI = document.getElementById("animation-override-ui");
      if (existingUI) {
        document.body.removeChild(existingUI);
      }
      this.animationOverrideUI = false;
      return;
    }

    this.animationOverrideUI = true;
    // Create container
    const container = document.createElement("div");
    container.id = "animation-override-ui";
    container.style.position = "fixed";
    container.style.top = "10px";
    container.style.right = "10px";
    container.style.background = "rgba(0,0,0,0.7)";
    container.style.padding = "10px";
    container.style.zIndex = 9999;
    container.style.color = "#fff";
    container.style.fontFamily = "monospace";
    container.style.borderRadius = "8px";

    // Create title with toggle button
    const titleRow = document.createElement("div");
    titleRow.style.display = "flex";
    titleRow.style.justifyContent = "space-between";
    titleRow.style.marginBottom = "8px";

    const title = document.createElement("div");
    title.textContent = "Animation Override";
    title.style.fontWeight = "bold";

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "×";
    toggleBtn.style.background = "none";
    toggleBtn.style.border = "none";
    toggleBtn.style.color = "#fff";
    toggleBtn.style.cursor = "pointer";
    toggleBtn.onclick = () => this.createAnimationOverrideUI(); // Toggle UI

    titleRow.appendChild(title);
    titleRow.appendChild(toggleBtn);
    container.appendChild(titleRow);

    // Create inputs for x, y, z, w
    const labels = ["x", "y", "z", "w"];
    const inputs = {};
    const sliders = {};

    labels.forEach((label) => {
      const row = document.createElement("div");
      row.style.marginBottom = "4px";
      row.style.display = "flex";
      row.style.alignItems = "center";

      // Create number input
      const input = document.createElement("input");
      input.type = "number";
      input.step = "1";
      input.value = 0;
      input.style.width = "80px";
      input.style.marginLeft = "4px";

      // Create slider
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "1500";
      slider.value = "0";
      slider.style.marginLeft = "8px";
      slider.style.width = "100px";

      // Sync input and slider
      input.addEventListener("change", () => {
        slider.value = input.value;
      });

      slider.addEventListener("input", () => {
        input.value = slider.value;
      });

      row.appendChild(document.createTextNode(label + ":"));
      row.appendChild(input);
      row.appendChild(slider);
      container.appendChild(row);

      inputs[label] = input;
      sliders[label] = slider;
    });

    // Button
    const btn = document.createElement("button");
    btn.textContent = "Apply Animation Params";
    btn.style.marginTop = "8px";
    btn.onclick = () => {
      if (this.mesh && this.mesh.bakedVertexAnimationManager) {
        const x = parseFloat(inputs.x.value);
        const y = parseFloat(inputs.y.value);
        const z = parseFloat(inputs.z.value);
        const w = parseFloat(inputs.w.value);
        this.mesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(x, y, z, w);
        console.log(`Set animationParameters to (${x}, ${y}, ${z}, ${w})`);
      }
    };
    container.appendChild(btn);

    document.body.appendChild(container);
  }

  async setupGUI() {
    try {
      await this.LoadLiLGUI();

      const gui = new lil.GUI({ title: "Remote Player Settings" });
      gui.domElement.style.marginTop = "120px"; // Position below other GUIs

      const params = {
        interpolationFactor: this.interpolationFactor,
      };

      gui
        .add(params, "interpolationFactor", 0.001, 10, 0.001)
        .name("Movement Smoothing")
        .onChange((value) => {
          this.interpolationFactor = value;
        });

      console.log("Remote player GUI setup complete");
    } catch (error) {
      console.error("Failed to setup Remote Player GUI:", error);
    }
  }

  async LoadLiLGUI() {
    return BABYLON.Tools.LoadScriptAsync("https://cdn.jsdelivr.net/npm/lil-gui@0.17.0/dist/lil-gui.umd.min.js");
  }

  checkAndCreateVisual() {
    if (window.SCENE_MANAGER?.activeScene) {
      this.createVisual();
    } else {
      setTimeout(() => this.checkAndCreateVisual(), 1000);
    }
  }

  createVisual() {
    // this.mesh = BABYLON.MeshBuilder.CreateBox(
    //   `player-playervisual`,
    //   {
    //     size: 10,
    //   },
    //   SCENE_MANAGER.activeScene
    // );
    // Clone the dummy physics character as the visual representation
    // this.createCharacterMesh();
    // this.create100sCharacters(window.SCENE_MANAGER.activeScene);
    // this.createSpider(window.SCENE_MANAGER.activeScene);
    this.createPlayerInstance(window.SCENE_MANAGER.activeScene);
    // TODO: Consider removing, this might be rendering twice
    window.SCENE_MANAGER.activeScene.registerBeforeRender(() => {
      const deltaTime = window.SCENE_MANAGER.activeScene.getEngine().getDeltaTime() / 1000;
      this.update(deltaTime);
    });
  }
  duplicate(container, offset, delay) {
    let entries = container.addAllToScene();

    for (var node of entries.rootNodes) {
      node.position.x += offset;
    }
    console.log("entries.animationGroups", entries.animationGroups);
    setTimeout(() => {
      for (var group of entries.animationGroups) {
        group.play(true);
      }
    }, delay);
  }

  //   const animationRanges = [
  //     { from: 7, to: 31, name: "idle1" },
  //     { from: 33, to: 61, name: "idle2" },
  //     { from: 63, to: 91, name: "jump1" },
  //     { from: jump.from, to: jump.to, name: "jump" },
  //   ];
  // const idle = scene.getAnimationGroupByName("BreathingIdle");
  // const jump = scene.getAnimationGroupByName("Jump");
  // console.log("jump", jump.from);
  // console.log("jump", jump.to);
  // console.log("idle", idle.from);
  // console.log("idle", idle.to);

  buildRanges(groups, fps = 30) {
    let cursor = 0;
    const ranges = [];

    for (const g of groups) {
      const length = g.to - g.from; // how many source frames
      ranges.push({ name: g.name, from: cursor, to: cursor + length });
      cursor += length + 1; // +1 because “to” is inclusive
    }
    return ranges;
  }

  async createPlayerInstance(scene) {
    //   const importResult = await BABYLON.ImportMeshAsync("https://raw.githubusercontent.com/RaggarDK/Baby/baby/arr.babylon", scene, undefined);
    const { meshes, skeletons, animationGroups } = await BABYLON.SceneLoader.ImportMeshAsync(
      "", // root url
      "/assets/characters/human_basemesh/", // folder
      "remotePlayerForVAT_includessprint.glb",
      //   "remotePlayerForVAT.glb",
      scene
    );

    const mesh = meshes.find((mesh) => mesh.name === "base");
    console.log("base mesh", mesh);

    /* GLB exports start every clip at 0, so we build our own ranges       */
    const fps = 30; // change if you exported at another FPS
    // const ranges = this.buildRanges(animationGroups, fps); // ⇢ [{ name, from, to } …]

    const ranges = animationGroups.map((g) => ({
      name: g.name,
      from: g.from ?? g.fromFrame, // depending on Babylon version
      to: g.to ?? g.toFrame,
    }));

    console.log("ranges", ranges);
    // vat wdith 264, vat height 2082 //ranges
    // vat width 264, vat height 92.9990530303030  with animationranges

    // const vatMat = new BABYLON.StandardMaterial("Standard for VAT Anim", scene);
    const vatMat = mesh.material;
    mesh.material = vatMat;
    mesh.skeleton = skeletons[0];
    const baker = new BABYLON.VertexAnimationBaker(scene, mesh);

    // using single track, blender nla manual drag export
    const animationRanges = [
      { from: 0, to: 480 },
      { from: 480, to: 890 },
      { from: 890, to: 1120 },
    ];
    //bake at runtime
    // baker.bakeVertexData([{ from: 0, to: animationRanges[animationRanges.length - 1].to, name: "My animation" }]).then((vertexData) => {
    //   //try to use helper to get multiple animation groups working
    //   // baker.bakeVertexData(ranges).then((vertexData) => {

    //   const finalRanges = ranges;

    //   const manager = new BABYLON.BakedVertexAnimationManager(scene);
    //   const vertexTexture = baker.textureFromBakedVertexData(vertexData);

    //   manager.texture = vertexTexture;
    //   manager.animationParameters = new BABYLON.Vector4(0, "30", 0, 30);

    //   vatMat.bakedVertexAnimationManager = manager; // ⚠️ the missing link
    //   mesh.material.bakedVertexAnimationManager = manager;
    //   mesh.bakedVertexAnimationManager = manager;

    //   manager.play = (name) => {
    //     const r = finalRanges.find((r) => r.name === name);
    //     if (!r) return;
    //     manager.setAnimationParameters(r.from, r.to, 0, fps); // (start, end, offset, fps)
    //     manager.time = 0;
    //   };

    //   scene.registerBeforeRender(() => {
    //     // console.log("scene.getEngine().getDeltaTime()", scene.getEngine().getDeltaTime());
    //     manager.time += scene.getEngine().getDeltaTime() / 1000.0;
    //   });

    //   //bake vertex data to json
    //   // we got the vertex data. let's serialize it:
    //   // const vertexDataJSON = baker.serializeBakedVertexDataToJSON(vertexData);
    //   // // and save it to a local JSON file
    //   // let a = document.createElement("a");
    //   // a.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(vertexDataJSON));
    //   // a.setAttribute("download", "vertexData.json");
    //   // a.click();

    //   //   createTexture(vertexTexture);
    //   function createTexture(texture) {
    //     setTimeout(() => {
    //       const canvas = document.querySelector("canvas.preview");

    //       if (canvas) {
    //         // Step 2: Convert the canvas content to a data URL in PNG format
    //         const imageDataURL = canvas.toDataURL("image/png");

    //         // Step 3: Create a temporary anchor element to facilitate the download
    //         const downloadLink = document.createElement("a");
    //         downloadLink.href = imageDataURL;
    //         downloadLink.download = "canvas_snapshot.png"; // Specify the desired file name

    //         // Step 4: Programmatically trigger a click on the anchor to initiate the download
    //         downloadLink.click();
    //       } else {
    //         console.error('Canvas element with class "preview" not found.');
    //       }
    //     }, 10000);
    //   }
    // });

    //Load a pre-baked vat json at runtime
    fetch("/assets/characters/human_basemesh/remotePlayerForVAT_vertexData.json")
      .then((response) => {
        return response.json();
      })
      .then(async (jsonData) => {
        const jsonString = await JSON.stringify(jsonData);

        const manager = new BABYLON.BakedVertexAnimationManager(scene);
        const vertexData = baker.loadBakedVertexDataFromJSON(jsonString);
        const vertexTexture = baker.textureFromBakedVertexData(vertexData);

        manager.texture = vertexTexture;

        vatMat.bakedVertexAnimationManager = manager; // ⚠️ the missing link
        mesh.material.bakedVertexAnimationManager = manager;
        mesh.bakedVertexAnimationManager = manager;

        scene.registerBeforeRender(() => {
          manager.time += scene.getEngine().getDeltaTime() / 1000.0;
        });
      });

    // const assetsManager = new BABYLON.AssetsManager(scene);
    // const vatTask = assetsManager.addTextFileTask("load VAT JSON", "/assets/characters/human_basemesh/remotePlayerForVAT_vertexData.json");

    // Load a pre-baked VAT texture instead of baking at runtime
    // const vatTexturePath = "/assets/characters/human_basemesh/VATCharacter.png";
    // const vertexTexture = new BABYLON.Texture(vatTexturePath, scene);

    // // Set texture parameters for proper VAT rendering
    // vertexTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
    // vertexTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
    // vertexTexture.updateSamplingMode(BABYLON.Texture.BILINEAR_SAMPLINGMODE);

    // // Create a dummy vertexData object to satisfy the manager
    // const vertexData = {
    //   width: 264, // Width of your VAT texture
    //   height: 1120, // Height based on your animation frames
    //   getTextureWidth: () => vertexData.width,
    //   getTextureHeight: () => vertexData.height,
    // };
    // const finalRanges = ranges;

    // const manager = new BABYLON.BakedVertexAnimationManager(scene);

    // manager.texture = vertexTexture;
    // manager.animationParameters = new BABYLON.Vector4(0, "30", 0, 30);

    // vatMat.bakedVertexAnimationManager = manager; // ⚠️ the missing link
    // mesh.material.bakedVertexAnimationManager = manager;
    // mesh.bakedVertexAnimationManager = manager;

    // manager.animationParameters = new BABYLON.Vector4(0, "30", 0, 30);

    // scene.registerBeforeRender(() => {
    //   // console.log("scene.getEngine().getDeltaTime()", scene.getEngine().getDeltaTime());
    //   manager.time += scene.getEngine().getDeltaTime() / 1000.0;
    // });

    mesh.numBoneInfluencers = 4;
    mesh.parent = null;
    mesh.position.y = this.defaultSpawnPosition.y;
    mesh.position.x = this.defaultSpawnPosition.x;
    mesh.position.z = this.defaultSpawnPosition.z;

    // mesh.scaling.x = 100;
    // mesh.scaling.y = 100;
    // mesh.scaling.z = 100;
    mesh.scaling.x = 0.036;
    mesh.scaling.y = 0.036;
    mesh.scaling.z = 0.036;
    mesh.rotation.x = BABYLON.Tools.ToRadians(90);

    mesh.isPickable = false;
    mesh.applyFog = false;
    mesh.material._metallicF0Factor = 0;
    mesh.material.environmentIntensity = 0.7;
    mesh.material.directIntensity = 10.7;
    this.mesh = mesh;
    this.setupKeyboardControls(scene);

    // importResult.animationGroups.forEach((g) => g.stop()); // or dispose()
    // mesh.skeleton = null;
  }

  async createSpider(scene) {
    const animationRanges = [
      { from: 7, to: 31 },
      { from: 33, to: 61 },
      { from: 63, to: 91 },
      { from: 93, to: 130 },
    ];

    const importResult = await BABYLON.ImportMeshAsync("https://raw.githubusercontent.com/RaggarDK/Baby/baby/arr.babylon", scene, undefined);

    /* GLB exports start every clip at 0, so we build our own ranges       */
    // const fps = 30; // change if you exported at another FPS
    // const ranges = buildRanges(animationGroups, fps); // ⇢ [{ name, from, to } …]

    const mesh = importResult.meshes[0];
    // mesh.scaling.x = 100;
    // mesh.scaling.y = 100;
    // mesh.scaling.z = 100;
    // mesh.name = "spider";
    const baker = new BABYLON.VertexAnimationBaker(scene, mesh);

    baker.bakeVertexData([{ from: 0, to: animationRanges[animationRanges.length - 1].to, name: "My animation" }]).then((vertexData) => {
      const vertexTexture = baker.textureFromBakedVertexData(vertexData);

      const manager = new BABYLON.BakedVertexAnimationManager(scene);

      manager.texture = vertexTexture;
      manager.animationParameters = new BABYLON.Vector4(animationRanges[1].from, animationRanges[1].to, 0, 30);

      mesh.bakedVertexAnimationManager = manager;

      scene.registerBeforeRender(() => {
        // console.log("scene.getEngine().getDeltaTime()", scene.getEngine().getDeltaTime());
        manager.time += scene.getEngine().getDeltaTime() / 1000.0;
      });
    });
    mesh.position.y = this.defaultSpawnPosition.y;
    mesh.position.x = this.defaultSpawnPosition.x;
    mesh.position.z = this.defaultSpawnPosition.z;
    // this.mesh = mesh;
  }

  async create100sCharacters(scene) {
    console.log("create100sCharacters", scene);
    const result = await BABYLON.SceneLoader.ImportMeshAsync("", "/assets/characters/human_basemesh/", "HumanBaseMesh_WithEquips_WithWarlock.glb", scene);
    // const baseMesh = glb.meshes[0];
    // console.log("baseMesh", baseMesh);

    // 2. Grab the rig
    const skeleton = result.skeletons[0]; // <- the Mixamo / Blender armature

    // 3. Choose the *skinned* mesh, **not** the __root__ node
    const baseMesh = result.meshes.find((m) => m.skeleton);
    // const baseMesh = BABYLON.MeshBuilder.CreateBox("boxBase", { size: 5 }, scene);

    //    (If nothing comes back, link it yourself)
    if (!baseMesh.skeleton) {
      baseMesh.skeleton = skeleton; // attach the rig to the mesh
    }
    // Create a TransformNode to act as a parent for the mesh
    // This allows us to manipulate the position, rotation, and scale of the character
    // without directly affecting the mesh's local transformations
    const transformNode = new BABYLON.TransformNode("characterTransform", scene);
    // Set the mesh as a child of the transform node
    baseMesh.parent = transformNode;
    // Store the transform node for later use
    // this.transformNode = transformNode;
    // Scale the character to an appropriate size
    transformNode.scaling = new BABYLON.Vector3(0.07, 0.07, 0.07);

    transformNode.position.y = this.defaultSpawnPosition.y;
    transformNode.position.x = this.defaultSpawnPosition.x;
    transformNode.position.z = this.defaultSpawnPosition.z;
    baseMesh.position.y += 200;
    // Reset the mesh's parent before continuing with the vertex animation baking
    // baseMesh.parent = null;

    console.log("skeleton", skeleton);
    console.log("baseMesh", baseMesh.name);
    const idle = scene.getAnimationGroupByName("BreathingIdle");
    const jump = scene.getAnimationGroupByName("Jump");

    // 1) Bake every AnimationGroup to a texture
    const baker = new BABYLON.VertexAnimationBaker(scene, baseMesh);
    // const manager = await baker.bakeVertexData([
    //   { from: idle.from, to: idle.to, frameRate: 30 },
    //   { from: jump.from, to: jump.to, frameRate: 30 },
    // ]);
    const textureData = await baker.bakeVertexData([
      { from: idle.from, to: idle.to, frameRate: 30 },
      { from: jump.from, to: jump.to, frameRate: 30 },
    ]);

    const manager = new BABYLON.BakedVertexAnimationManager(scene);
    manager.texture = textureData;

    baseMesh.bakedVertexAnimationManager = manager;

    const ranges = [
      { from: idle.from, to: idle.to }, // 0
      { from: jump.from, to: jump.to }, // 1
    ];

    manager.setAnimationParameters(
      ranges[0].from, // initial frame
      ranges[0].to, // last frame
      0, // offset
      30 // frames per second
    );

    // 2) Spawn 1500 thin instances with random start frames
    const COUNT = 10;
    const world = new Float32Array(COUNT * 16); // fill with matrices
    const anim = new Float32Array(COUNT * 4); // per-instance VAT data

    // Optional: keep an array of current positions if you need velocities, etc.
    this._positions = [];
    for (let i = 0; i < COUNT; i++) {
      // random offset in a 100×100×100 cube
      const offset = new BABYLON.Vector3((Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 100);
      offset.y += 200;
      const pos = this.defaultSpawnPosition.add(offset);
      //   this._positions.push(pos);
      this._positions.push(offset);

      // Create matrices for each transformation

      // Combine matrices: translation * rotation * scale

      // Create rotation matrix for 90 degrees around Y axis
      const scaleMatrix = BABYLON.Matrix.Scaling(0.5, 0.5, 0.5); // Scale to 50% size
      const rotationMatrix = BABYLON.Matrix.RotationX(Math.PI / 2);
      const translationMatrix = BABYLON.Matrix.Translation(pos.x, pos.y, pos.z);
      const mat = translationMatrix.multiply(rotationMatrix).multiply(scaleMatrix);

      mat.copyToArray(world, i * 16);

      //   // Set animation parameters for this instance
      //   anim[i * 4] = 1; // animationGroupIndex (0 for idle, 1 for jump)
      //   anim[i * 4 + 1] = 0; // normalizedTime (0-1)
      //   anim[i * 4 + 2] = 1; // weight
      //   anim[i * 4 + 3] = 0; // unused

      // animation ----------------------------------------------------
      const useJump = Math.random() < 0.25; // 25 % will be jumping
      const range = useJump ? ranges[1] : ranges[0];

      anim[i * 4] = range.from; // start
      anim[i * 4 + 1] = range.to; // end
      anim[i * 4 + 2] = Math.random() * (range.to - range.from); // random offset
      anim[i * 4 + 3] = 1; // speed
    }

    baseMesh.thinInstanceSetBuffer("matrix", world, 16, true);
    // baseMesh.thinInstanceSetBuffer("bakedVertexAnimationSettingsInstanced", anim, 4, true);
    baseMesh.thinInstanceSetBuffer("bakedVertexAnimationSettingsInstanced", anim, 4, true);
    // baseMesh.thinInstanceAdd(mats, true);

    baseMesh.thinInstanceRegisterAttribute("bakedVertexAnimationSettingsInstanced", 4);
    baseMesh.thinInstanceSetBuffer("matrix", world, 16, true);
    baseMesh.thinInstanceSetBuffer("bakedVertexAnimationSettingsInstanced", anim, 4, true);

    this.mesh = baseMesh;
    this.mesh.isPickable = false;
    // this.mesh.position = this.targetPosition;

    scene.onBeforeRenderObservable.add(() => {
      manager.time += scene.getEngine().getDeltaTime() * 0.001; // 1 second == 1 second
    });

    //animation debug
    baseMesh.skeleton = null;
    const mat = baseMesh.material; // or StandardMaterial
    mat.numBoneInfluencers = 0;
    mat.useBones = false;

    // 3) (optional) force the material to recompile with the VAT path
    mat.markAsDirty(BABYLON.Material.TextureDirtyFlag);
    console.log("manager", manager);

    const mats =
      baseMesh.material instanceof BABYLON.MultiMaterial
        ? baseMesh.material.subMaterials // GLB often uses MultiMaterial
        : [baseMesh.material];

    for (const m of mats) {
      if (!m) continue; // a sub-slot can be null
      m.useBones = false; // ❶ strip bone defines
      m.numBoneInfluencers = 0;
      m.markAsDirty(BABYLON.Material.TextureDirtyFlag); // ❷ force re-compile
    }
  }

  createCharacterMesh() {
    const dummyPhysicsRoot = window.SCENE_MANAGER.activeScene.getMeshByName("dummyPhysicsRoot");

    if (dummyPhysicsRoot) {
      //   this.mesh = dummyPhysicsRoot.clone("remotePlayer", null);

      //   const characterSkeleton = window.SCENE_MANAGER.activeScene.skeletons.find((skeleton) => skeleton.name === "Character");
      //   this.container = new BABYLON.AssetContainer(window.SCENE_MANAGER.activeScene);
      //   // adding mesh to container
      //   this.container.addAllAssetsToContainer(this.mesh);
      //   this.container.addAllAssetsToContainer(characterSkeleton);

      //   this.duplicate(this.container, 0, 0);

      //       // Find the Character skeleton directly in the scene
      //       const characterSkeleton = window.SCENE_MANAGER.activeScene.skeletons.find((skeleton) => skeleton.name === "Character");

      //         if (characterSkeleton) {
      //           this.skeleton = characterSkeleton.clone("remotePlayerSkeleton");

      //           // Assign the skeleton to the root mesh and all children that need it
      //           const assignSkeletonToMesh = (mesh) => {
      //             if (mesh.skeleton) {
      //               mesh.skeleton = this.skeleton;
      //             }
      //             mesh.getChildren().forEach(assignSkeletonToMesh);
      //           };

      //           // Start with the root mesh
      //           assignSkeletonToMesh(this.mesh);

      //           console.log("Skeleton assigned to meshes");
      //         } else {
      //           console.warn("Could not find Character skeleton!");
      //         }

      //         this.animations = {};
      //         const animationGroups = window.SCENE_MANAGER.activeScene.animationGroups;

      //         function getAnimationGroupsForMesh(mesh, scene) {
      //             return scene.animationGroups.filter(group => {
      //                 return group.targetedAnimations.some(targetedAnim => targetedAnim.target === mesh);
      //             });
      //         }
      //         // Now clone the AnimationGroup
      // const clonedAnimGroup = originalAnimGroup.clone("clonedAnimGroup", (oldTarget) => {
      //     if (oldTarget === originalMesh) {
      //         return clonedMesh;
      //     }
      //     return oldTarget; // or return null if you only want animation for the cloned mesh
      // });

      //         // Store all animation groups that have targets
      //         animationGroups.forEach((animGroup) => {
      //           if (animGroup.targetedAnimations.length > 0) {
      //             console.log(`Adding animation group: ${animGroup.name}`);
      //             this.animations[animGroup.name] = animGroup;
      //           }
      //         });
      this.clonePlayerVisual();

      console.log("Available animations for RemotePlayer:", Object.keys(this.animations));
    } else {
      this.mesh = BABYLON.MeshBuilder.CreateBox(`player-fallback`, { size: 10 }, window.SCENE_MANAGER.activeScene);
    }
  }

  clonePlayerVisual() {
    const dummyPhysicsRoot = window.SCENE_MANAGER.activeScene.getMeshByName("dummyPhysicsRoot");

    const soldier = dummyPhysicsRoot.clone("dummyPhysicsRoot2");

    // 2. Give the clone its *own* skeleton
    const characterSkeleton = window.SCENE_MANAGER.activeScene.skeletons.find((skeleton) => skeleton.name === "Character");
    soldier.skeleton = characterSkeleton.clone("Character2");

    // 3. Re-wire every AnimationGroup to drive the new bones
    window.SCENE_MANAGER.activeScene.animationGroups.forEach((ag) => {
      const cloned = ag.clone(ag.name + "_soldier", (oldTarget) => {
        // Bones keep their index order, so mapping is trivial
        if (oldTarget instanceof BABYLON.Bone) {
          const i = characterSkeleton.bones.indexOf(oldTarget);
          return soldier.skeleton.bones[i];
        }
        // Mesh-level transforms
        if (oldTarget === dummyPhysicsRoot) return soldier;
        return oldTarget; // cameras, lights, empties, etc.
      });
      cloned.play(true); // independent playback
    });
  }

  playAnimation(animationName, loop = true) {
    if (this.animations[animationName]) {
      //   this.stopAllAnimations();

      const anim = this.animations[animationName];

      anim.start(loop, 1.0, anim.from, anim.to, false, undefined, undefined, false, [this.skeleton]);
      return anim;
    }
    console.warn(`Animation ${animationName} not found`);
    return null;
  }

  //   stopAnimation(animationName) {
  //     if (this.animations[animationName]) {
  //       this.animations[animationName].stop([this.skeleton]);
  //     }
  //   }

  stopAnimation(animationName) {
    if (!this.skeleton) return;

    if (this.animations[animationName]) {
      const anim = this.animations[animationName];
      anim.targetedAnimations.forEach((targetAnim) => {
        if (targetAnim.target === this.skeleton || targetAnim.target.skeleton === this.skeleton) {
          anim.stop();
        }
      });
    }
  }

  stopAllAnimations() {
    Object.values(this.animations).forEach((anim) => {
      anim.stop([this.skeleton]);
    });
  }

  //   stopAllAnimations() {
  //     if (!this.skeleton) return;

  //     Object.values(this.animations).forEach((anim) => {
  //       anim.targetedAnimations.forEach((targetAnim) => {
  //         if (targetAnim.target === this.skeleton || targetAnim.target.skeleton === this.skeleton) {
  //           anim.stop();
  //         }
  //       });
  //     });
  //   }

  setTargetPosition(position) {
    this.targetPosition = position;
  }

  setTargetRotation(rotationX) {
    // this.targetRotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(rotationX, 3.14 / 2, 0);
    const targetQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(rotationX, 3.14 / 2, 0);
    const modelOffset = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
    this.targetRotationQuaternion = modelOffset.multiply(targetQuaternion);
  }

  moveTo(position) {
    this.mesh.position = position;
  }

  // ... existing code ...
  async setupKeyboardControls(scene) {
    // Add event listener to the window object for keydown events
    window.addEventListener("keydown", (event) => {
      // console.log("Keydown event:", event.key);
      switch (
      event.key.toLowerCase() // Convert to lowercase for case-insensitive comparison
      ) {
        case "l":
          console.log("this.mesh", this.mesh);
          if (this.mesh.bakedVertexAnimationManager) {
            this.mesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(0, 800, 0, 220);

            console.log("Animation parameters changed with L key");
            console.log("this.mesh.manager", this.mesh.bakedVertexAnimationManager);
            this.overrideAnimation = true;
          }
          break;
        case "k":
          if (this.mesh.bakedVertexAnimationManager) {
            // this.mesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(0, 30, 0, 30);
            this.mesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(800, 1010, 0, 120);
            // this.mesh.bakedVertexAnimationManager.play("BreathingIdle");
            console.log("Animation parameters changed with K key");
            this.overrideAnimation = true;
          }
          break;
        case "j":
          if (this.mesh.bakedVertexAnimationManager) {
            // this.mesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(0, 192, 0, 30);
            this.mesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(1010, 1110, 0, 170);
            // this.mesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(0, 480, 0, 30);
            // console.log("Animation parameters changed with K key");
            // this.mesh.bakedVertexAnimationManager.play("Jump");
            this.overrideAnimation = true;
          }
          break;
      }
    });

    // setTimeout(async () => {
    //   try {
    //     await this.LoadLiLGUI();

    //     const gui = new lil.GUI({ title: "Animation Paramter Settings" });
    //     gui.domElement.style.marginTop = "120px"; // Position below other GUIs

    //     const params = {
    //       interpolationFactor: this.mesh.bakedVertexAnimationManager.animationParameters.x,
    //     };

    //     gui
    //       .add(params, "interpolationFactor", 0, 1000, 1)
    //       .name("x")
    //       .onChange((value) => {
    //         this.interpolationFactor = value;
    //       });

    //     console.log("Remote player GUI setup complete");
    //   } catch (error) {
    //     console.error("Failed to setup Remote Player GUI:", error);
    //   }
    // }, 20000);
  }

  // ... existing code ...
  update(deltaTime) {
    if (!this.mesh) {
      return;
    }
    // Old  Linear - Smoothly interpolate between current position and target position
    // const dx = this.targetPosition.x + this.offset.x - this.currentPosition.x;
    // const dy = this.targetPosition.y + this.offset.y - this.currentPosition.y;
    // const dz = this.targetPosition.z + this.offset.z - this.currentPosition.z;
    // this.currentPosition.x += dx * this.interpolationFactor;
    // this.currentPosition.y += dy * this.interpolationFactor;
    // this.currentPosition.z += dz * this.interpolationFactor;

    const maxSpeed = 70; // maxSpeed in units/sec, deltaTime in seconds
    const maxStep = maxSpeed * deltaTime; // maxSpeed in units/sec, deltaTime in seconds
    const dx = this.targetPosition.x + this.offset.x - this.currentPosition.x;
    const dy = this.targetPosition.y + this.offset.y - this.currentPosition.y;
    const dz = this.targetPosition.z + this.offset.z - this.currentPosition.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance > maxStep) {
      // Move at constant speed toward target
      const direction = new BABYLON.Vector3(dx, dy, dz).normalize();
      this.currentPosition.addInPlace(direction.scale(maxStep));
    } else {
      // Close enough, snap to target
      this.currentPosition.x = this.targetPosition.x + this.offset.x;
      this.currentPosition.y = this.targetPosition.y + this.offset.y;
      this.currentPosition.z = this.targetPosition.z + this.offset.z;
    }

    if (Math.abs(dx) > 2.2 || Math.abs(dy) > 2.2 || Math.abs(dz) > 2.2) {
      // this.playAnimation("Jump");
      //   this.mesh.manager.animationParameters = new BABYLON.Vector4(0, 100, 0, 30);

      if (this.mesh.bakedVertexAnimationManager && !this.overrideAnimation) {
        //  this.mesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(0, 64, 0, 30);
        // this.mesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(750, 910, 0, 120);
        this.mesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(1018, 1081, 0, 100);
      }
    } else {
      if (this.mesh.bakedVertexAnimationManager && !this.animationOverrideUI) {
        this.mesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(0, 820, 0, 150);
      }
      //   this.playAnimation("Jump");
    }

    // Update mesh position
    this.mesh.position.copyFrom(this.currentPosition);

    this.rotationInterpolationFactor = 0.2;
    // Interpolate rotation quaternion
    BABYLON.Quaternion.SlerpToRef(this.currentRotationQuaternion, this.targetRotationQuaternion, this.rotationInterpolationFactor, this.currentRotationQuaternion);
    // // Update mesh rotation
    this.mesh.rotationQuaternion = this.currentRotationQuaternion;
    // this.mesh.rotationQuaternion = this.targetRotationQuaternion;

    // Thin instance movement attempt
    //   // Example: simple upward drift

    // let i = 1;
    // const tmp = new BABYLON.Matrix();
    // this._positions[i].y += 0.01;

    // // Rebuild the matrix for instance i
    // BABYLON.Matrix.TranslationToRef(this._positions[i].x, this._positions[i].y, this._positions[i].z, tmp);

    // // Write straight into the thin‐instance system:
    // this.mesh.thinInstanceSetMatrixAt(i, tmp);
    // // Tell Babylon you’ve changed the “matrix” buffer:
    // this.mesh.thinInstanceBufferUpdated("matrix");
    // console.log("updated matrix");

    // // const tmp = new BABYLON.Matrix();
    // // for (let i = 0; i < COUNT; i++) {

    // }
  }

  rotateTo(rotation) {
    this.rotation = rotation;
  }

  // Add this helper method
  listAvailableAnimations() {
    return Object.keys(this.animations);
  }
}

window.RemotePlayer = RemotePlayer;
