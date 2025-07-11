import { loadHeroModel } from "../../character/hero.js";
import { setupCamera } from "../../utils/camera.js";
import { setupPhysics } from "../../utils/physics.js";
import { setupInputHandling } from "../../movement.js";
import { setupAnim } from "../../utils/anim.js";
import { loadingAnim } from "../../utils/loadingAnim.js";
import { setupSSAO } from "../../utils/ssao.js";
import { loadModels } from "../../utils/load.js";
import { createMobileControlsJoystickOnly } from "../../utils/mobile/joystick.js";
import { Health } from "../../character/health.js";
import { ActionMenu } from "/src/utils/action-menu/actionMenu.js";
import { setupEnemies } from "../../character/enemy.js";
import { createEnemyWithPosition, addEnemyOutlineCamera } from "/src/character/enemy.js";
import { SoundManager } from "/src/utils/sound.js";

export async function createLava(engine) {

  engine.setHardwareScalingLevel(10);
  // engine.maxFPS = 30;

  const scene = new BABYLON.Scene(engine);
  // const opts = BABYLON.SceneOptimizerOptions.LowDegradationAllowed();
  // opts.targetFrameRate = 2;                 // caps internal loop
  // const optimizer = new BABYLON.SceneOptimizer(scene, opts);

  const spawnPoint = new BABYLON.Vector3(0, 80, 0);
  const { character, dummyAggregate } = await setupPhysics(scene, spawnPoint);

  const camera = setupCamera(scene, character, engine);
  camera.collisionRadius = new BABYLON.Vector3(12.5, 12.5, 12.5);
  // load all models, make sure parallel loading for speed
  const modelUrls = ["env/interior/lava/lava_map.glb", "util/atmosphere/lightrays/lightrays.glb"];
  const heroModelPromise = loadHeroModel(scene, character);
  const [heroModel, models] = await Promise.all([heroModelPromise, loadModels(scene, modelUrls)]);
  const { hero, skeleton } = heroModel;

  let anim = setupAnim(scene, skeleton);
  setupInputHandling(scene, character, camera, hero, anim, engine, dummyAggregate);
  character.health = new Health("Hero", 100, dummyAggregate);
  character.health.rotationCheck = hero;
  character.health.rangeCheck = character;
  PLAYER = character;
  character.health.anim = anim;
  window.dummyAggregate = dummyAggregate;
  scene.WORLD_ID = "2";

  setupEnvironment(scene);

  // let sword = addSword(scene, models["Sword2"]);
  // createTrail(scene, engine, sword, 0.2, 40, new BABYLON.Vector3(0, 0, 0.32));

  let meshes = addLavaMap(scene, models);
  // hero.getChildMeshes().forEach((value) => {
  //   meshes.push(value);
  // });
  // console.log(hero.getChildMeshes());

  setupSound(scene, camera);


  setTimeout(() => {
    setupLighting(scene);
    setupPostProcessing(scene, camera);

    addLightrays(models["lightrays"], scene, engine);
    // // advanced lighting
    // // const spotLight = setupSpotlight(scene);
    // const light = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(-800, -1400, -1000), scene);
    // light.intensity = 15.7;
    // // // light.intensity = 0;
    // // // light.shadowMinZ = 1800;
    // // // light.shadowMinZ = 2100;
    // light.shadowMinZ = 1500;
    // light.shadowMaxZ = 2300;
    // light.diffuse = new BABYLON.Color3(1, 1, 1);

    // // let lights = [light, spotLight];
    // // setupGI(scene, engine, lights, meshes);

    // setupShadows(light, hero);
    loadingAnim(scene);
    setupSSAO(scene, camera);

    createMobileControlsJoystickOnly(scene, camera, character);
    character.shouldTapToMove = false;
    addZReset(scene, dummyAggregate);
    addCurrent(scene, dummyAggregate);

    setupSkillBar();

    // let dummy = setupTargetDummy(scene, spawnPoint);
    // let enemy = setupEnemySimple(scene, PLAYER, dummy, null);

    let barrel = setupBarrel(scene);

    scene.physicsEnabled = true;



    // setupNavmesh(meshes, scene);
  }, 1000);
  return scene;
}

async function setupSound(scene, camera) {
  const audioEngine = await BABYLON.CreateAudioEngineAsync();

  const sound = new SoundManager(scene);
  sound.createSoundPresets();
  sound.createSound("NPC Hey", "/assets/sounds/npc/deep/npc_deep.mp3", "sfx", { volume: 0.8 });
  sound.createSound("NPC Hmm", "/assets/sounds/npc/deep/npc_deep_hmm.mp3", "sfx", { volume: 0.8 });
  sound.createSound("NPC Hows", "/assets/sounds/npc/deep/npc_deep_hows.mp3", "sfx", { volume: 0.8 });
  sound.createSound("NPC Keep Moving", "/assets/sounds/npc/deep/npc_deep_keep_moving.mp3", "sfx", { volume: 0.8 });
  sound.createSound("Pickup", "/assets/sounds/ui/book/pickup.mp3", "sfx", { volume: 0.8 });

  scene.activeCamera.sound = sound;

  // setTimeout(async function () {
  //   const ambience = await BABYLON.CreateStreamingSoundAsync("Sunny Explore", "/assets/sounds/background/sunny-day-ambiance.wav");
  //   // Wait until audio engine is ready to play sounds.
  //   await audioEngine.unlockAsync();
  //   ambience.loop = true;

  //   ambience.play();
  //   ambience.volume = 0.9;
  //   scene.activeCamera.sound.ambience = ambience;
  // }, 100);

  // setTimeout(async function () {
  //   scene.activeCamera.sound.setChannelVolume("music", 0.3);
  //   const sound = await BABYLON.CreateStreamingSoundAsync("Sunny Explore", "/assets/sounds/music/Sunny Explore.mp3");
  //   // Wait until audio engine is ready to play sounds.
  //   await audioEngine.unlockAsync();
  //   sound.volume = 0.15;
  //   sound.play();
  //   scene.activeCamera.sound.music = sound;

  //   setInterval(async function () {
  //     sound.play();
  //   }, 400000); // 100 seconds in milliseconds
  // }, 15000);
}

async function setupNavmesh(meshes, scene) {
  const recast = await new Recast();
  // Initialize and enable Recast navigation plugin
  const navigationPlugin = new BABYLON.RecastJSPlugin(recast);

  var navmeshParameters = {
    cs: 0.2,
    ch: 0.2,
    walkableSlopeAngle: 90,
    walkableHeight: 1.0,
    walkableClimb: 1,
    walkableRadius: 1,
    maxEdgeLen: 12,
    maxSimplificationError: 1.3,
    minRegionArea: 8,
    mergeRegionArea: 20,
    maxVertsPerPoly: 6,
    detailSampleDist: 6,
    detailSampleMaxError: 1,
  };

  const navmeshParametersLarge = {
    cs: 50.0, // Cell size: larger values reduce memory usage
    ch: 0.5, // Cell height: adjust based on terrain elevation detail
    walkableSlopeAngle: 30, // Maximum slope angle agents can traverse
    walkableHeight: 2.0, // Minimum agent height
    walkableClimb: 0.5, // Maximum ledge height agents can climb
    walkableRadius: 0.5, // Minimum agent radius
    maxEdgeLen: 32, // Maximum length of polygon edges
    maxSimplificationError: 1.3, // Controls mesh simplification
    minRegionArea: 50, // Minimum region size
    mergeRegionArea: 20, // Minimum region size to merge
    maxVertsPerPoly: 6, // Maximum vertices per polygon
    detailSampleDist: 6, // Detail mesh sample spacing
    detailSampleMaxError: 1, // Maximum error for detail mesh simplification
  };

  const params = {
    cs: 1.0, // Increased cell size to reduce complexity
    ch: 1.0, // Increased cell height to match cell size
    walkableSlopeAngle: 45, // More realistic slope angle
    walkableHeight: 2.0, // Keep this for normal character height
    walkableClimb: 1.0, // Increased to handle more height variations
    walkableRadius: 1.0, // Increased radius to simplify walkable areas
    maxEdgeLen: 12, // Increased for better triangulation
    maxSimplificationError: 2.0, // Increased to allow more simplification
    minRegionArea: 3, // Slightly increased to avoid tiny regions
    mergeRegionArea: 10, // Increased to merge more regions
    maxVertsPerPoly: 3, // Reduced to force triangles (helps with triangulation)
    detailSampleDist: 6, // Increased sample distance
    detailSampleMaxError: 2, // Increased error tolerance
    rebuild: () => rebuildNavMesh(),
  };
  let navmeshdebug = null;
  let matdebug = null;
  function rebuildNavMesh() {
    try {
      // Clean up existing debug mesh if it exists
      if (navmeshdebug) {
        navmeshdebug.dispose();
        matdebug.dispose();
      }
      console.log(meshes);
      console.log(meshes[1].name);
      // Create new navmesh with current parameters
      navigationPlugin.createNavMesh([meshes[1]], params);

      // Create debug visualization
      navmeshdebug = navigationPlugin.createDebugNavMesh(scene);
      navmeshdebug.isPickable = false;

      matdebug = new BABYLON.StandardMaterial("matdebug", scene);
      matdebug.diffuseColor = new BABYLON.Color3(0.1, 0.2, 1);
      matdebug.alpha = 0.2;
      navmeshdebug.material = matdebug;

      console.log("NavMesh rebuilt successfully!");
    } catch (error) {
      console.error("Failed to build NavMesh:", error);
    }
  }

  let debug = true;
  if (debug) {
    BABYLON.Tools.LoadScriptAsync("https://cdn.jsdelivr.net/npm/lil-gui@0.17.0/dist/lil-gui.umd.min.js").then(() => {
      const gui = new lil.GUI({ title: "SSAO Settings" });

      // Basic parameters folder
      const basicFolder = gui.addFolder("Basic Parameters");
      basicFolder.add(params, "cs", 0.1, 5).name("Cell Size");
      basicFolder.add(params, "ch", 0.1, 5).name("Cell Height");
      basicFolder.add(params, "walkableSlopeAngle", 0, 90).name("Slope Angle");
      basicFolder.add(params, "walkableHeight", 0.1, 5).name("Agent Height");
      basicFolder.add(params, "walkableClimb", 0.1, 5).name("Max Climb");
      basicFolder.add(params, "walkableRadius", 0.1, 5).name("Agent Radius");

      // Advanced parameters folder
      const advancedFolder = gui.addFolder("Advanced Parameters");
      advancedFolder.add(params, "maxEdgeLen", 1, 50).name("Max Edge Length");
      advancedFolder.add(params, "maxSimplificationError", 0.1, 3).name("Simplification Error");
      advancedFolder.add(params, "minRegionArea", 1, 100).name("Min Region Area");
      advancedFolder.add(params, "mergeRegionArea", 1, 100).name("Merge Region Area");
      advancedFolder.add(params, "maxVertsPerPoly", 3, 12, 1).name("Max Verts Per Poly");
      advancedFolder.add(params, "detailSampleDist", 1, 20).name("Sample Distance");
      advancedFolder.add(params, "detailSampleMaxError", 0.1, 5).name("Sample Max Error");

      // Add rebuild button
      gui.add(params, "rebuild").name("Rebuild NavMesh");

      // Add preset buttons
      const presetFolder = gui.addFolder("Presets");

      // Default preset
      presetFolder
        .add(
          {
            setDefault: () => {
              Object.assign(params, {
                cs: 0.2,
                ch: 0.2,
                walkableSlopeAngle: 90,
                walkableHeight: 1.0,
                walkableClimb: 1,
                walkableRadius: 1,
                maxEdgeLen: 12,
                maxSimplificationError: 1.3,
                minRegionArea: 8,
                mergeRegionArea: 20,
                maxVertsPerPoly: 6,
                detailSampleDist: 6,
                detailSampleMaxError: 1,
              });
              gui.refresh();
              rebuildNavMesh();
            },
          },
          "setDefault"
        )
        .name("Default Settings");
    });
  }
}
// general break function, move to own file, maybe break.js. should include
function breakBarrel(mesh, fracturedPrefab, scene, position, explosionForce = 10) {
  // make explosion force change with hit damage

  // 1.  Clean up intact barrel
  // body.dispose();
  // console.log("breaking barrel");
  mesh.setEnabled(false); // keep it as prefab if you like

  // 2. Create dynamic pieces at barrel's position
  const fracturedRoot = fracturedPrefab.clone("fractured_barrel", null);
  fracturedRoot.setEnabled(true);
  fracturedRoot.scaling.x = mesh.scaling.x;
  fracturedRoot.scaling.y = mesh.scaling.y;
  fracturedRoot.scaling.z = mesh.scaling.z;
  fracturedRoot.rotationQuaternion = mesh.rotationQuaternion?.clone() ?? BABYLON.Quaternion.Identity();

  fracturedRoot.position.copyFrom(position);
  fracturedRoot.isPickable = false;

  console.log(fracturedRoot.getChildMeshes());
  const pieces = fracturedRoot.getChildMeshes();
  pieces.forEach((piece) => {
    if (!piece.name.toLowerCase().includes("breakable")) {
      piece.setEnabled(false);
    } else {
      piece.material.backFaceCulling = false;
      // Create physics aggregate for each piece
      const pieceAggregate = new BABYLON.PhysicsAggregate(piece, BABYLON.PhysicsShapeType.CONVEX_HULL, { mass: 1, restitution: 0.1, friction: 0.5 }, scene);
      // pieceAggregate.body.setGravityFactor(20);
      pieceAggregate.body.setGravityFactor(15);

      // Position at barrel location
      piece.position.copyFrom(mesh.position);
      piece.setEnabled(true);

      // Add random explosion force
      const randomDir = new BABYLON.Vector3(
        Math.random() * 2 - 1, // -1 to 1
        Math.random() * 2, // 0 to 2 (upward bias)
        Math.random() * 2 - 1 // -1 to 1
      );
      // const explosionForce = 10;
      pieceAggregate.body.applyImpulse(randomDir.scale(explosionForce), piece.getAbsolutePosition());

      setTimeout(() => {
        pieceAggregate.dispose();
        piece.dispose();
      }, 60000);
    }
  });

  // // 2.  Clone fractured prefab at the same place
  // const root = fracturedPrefab.clone("fx", undefined);
  // root.setEnabled(true);
  // root.position.copyFrom(mesh.position);
  // root.rotationQuaternion = mesh.rotationQuaternion?.clone() ?? BABYLON.Quaternion.Identity();

  // // 3.  Give every child piece its own DYNAMIC body
  // root.getChildMeshes().forEach((piece) => {
  //   const pieceBody = new BABYLON.PhysicsBody(piece, BABYLON.PhysicsMotionType.DYNAMIC, scene);

  //   // convex hull is usually fine for debris
  //   pieceBody.shape = new BABYLON.PhysicsShapeConvexHull(pieceBody, hkPlugin);

  //   pieceBody.setMassProperties({ mass: 0.2 }); // light wood chunk
  //   pieceBody.setLinearDamping(0.3); // stops fairly quick
  //   pieceBody.setAngularDamping(0.3);

  //   //  Give it an outward impulse away from the sword
  //   const dir = piece.getAbsolutePosition().subtract(swordCollider.getAbsolutePosition()).normalize();
  //   pieceBody.applyImpulse(dir.scaleInPlace(3), BABYLON.Vector3.Zero());

  //   // 4.  Auto‑downgrade to STATIC when velocity is almost zero
  //   // scene.onBeforeRenderObservable.add(() => {
  //   //   const v = pieceBody.getLinearVelocity().length();
  //   //   if (v < 0.05) {
  //   //     pieceBody.setMotionType(BABYLON.PhysicsMotionType.STATIC);
  //   //   }
  //   // });
  // });

  // (Optional) play particle burst / sound at mesh.position
}

async function setupBarrel(scene) {
  const loadResult = await BABYLON.SceneLoader.ImportMeshAsync("", "/assets/env/objects/barrel/", "barrel_breakable.glb", scene);
  const fracturedPrefabRoot = loadResult.meshes[0];

  // const fracturedPrefabRoot = new BABYLON.TransformNode("fracturedPrefabRoot", scene);
  // const preview = BABYLON.TransformNode("preview", scene);
  // loadResult.meshes[0].parent = null;
  // Fix the negative scaling before parenting
  if (fracturedPrefabRoot.scaling.z < 0) {
    // Flip the mesh back to positive scaling
    fracturedPrefabRoot.scaling.z *= -1;
    // Rotate 180 degrees around Y axis to maintain same visual orientation
    fracturedPrefabRoot.rotate(BABYLON.Vector3.Up(), Math.PI);
  }

  // loadResult.meshes[0].parent = fracturedPrefabRoot;

  // console.log(loadResult.meshes.map((mesh) => mesh.name));

  // const barrel = BABYLON.MeshBuilder.CreateBox("barrel", { size: 5 }, scene);
  const barrel = loadResult.meshes[0].getChildMeshes()[0];
  let spawnPoint = new BABYLON.Vector3(10, 20, 0);
  barrel.position = spawnPoint.clone();
  barrel.scaling.y = 4.1;
  barrel.scaling.x = 4.1;
  barrel.scaling.z = 4.1;
  barrel.isPickable = false;
  barrel.isInteractable = true;
  barrel.break = true;
  barrel.breakBarrel = breakBarrel;
  barrel.fracturedPrefabRoot = fracturedPrefabRoot;
  barrel.setEnabled(false);

  addEnemyOutlineCamera(scene, PLAYER);

  let barrelEnemy = createEnemyWithPosition(barrel, 10, new BABYLON.Vector3(10, 20, 0), scene);
  let barrelEnemy2 = createEnemyWithPosition(barrel, 10, new BABYLON.Vector3(30, 20, 0), scene);
  PLAYER.target = barrelEnemy;

  // setTimeout(() => {
  //   breakBarrel(barrel, fracturedPrefabRoot, scene, 10);
  // }, 1000);

  // dummy.interact = new Interact();
  // dummy.interact.addAction("talk", () => {
  //   console.log("talk");
  // });
  // this.dummy.setEnabled(false);
  //   PLAYER.target = barrel;
  return barrel;
}

import { SkillBar } from "/src/combat/skills/SkillBar.js";
import { Spellbook } from "/src/combat/skills/Spellbook.js";
import { SkillTree } from "/src/combat/skills/SkillTree.js";

function setupSkillBar() {
  SKILL_BAR = new SkillBar();
  SKILL_BAR.showSkillBar();
}

function setupTargetDummy(scene, spawnPoint) {
  const dummy = BABYLON.MeshBuilder.CreateBox("dummy", { size: 10 }, scene);

  dummy.position = spawnPoint.clone();
  dummy.scaling.y = 4.1;
  dummy.scaling.x = 2.1;
  dummy.position.y = 20;
  dummy.position.z += -50;
  dummy.isPickable = false;
  dummy.isInteractable = true;
  // dummy.interact = new Interact();
  // dummy.interact.addAction("talk", () => {
  //   console.log("talk");
  // });
  // this.dummy.setEnabled(false);
  return dummy;
}
// function setupLavaMaterial(scene) {
//   const lavaMat = new BABYLON.CustomMaterial("lavaMat", scene, { attributes: ["position", "normal", "uv"] });
//   lavaMat.diffuseTexture = new BABYLON.Texture("/assets/textures/terrain/undefined - Imgur.png", scene);
//   // we’ll need time + resolution from JavaScript every frame
//   //   lavaMat.AddUniform("iTime", "float");
//   //   lavaMat.AddUniform("iResolution", "vec2");

//   lavaMat.AddAttribute("uv");
//   lavaMat.Vertex_Definitions(`
//     // attribute vec2 uv;
//     varying vec2 vUV;
//   `);
//   lavaMat.Vertex_MainBegin(`
//     vUV = uv;
//   `);

//   // --- 2. GLSL: helper functions (Fragment_Definitions) ------------------------------
//   lavaMat.Fragment_Definitions(`
//     varying vec2 vUV;
//     uniform float iTime;
//     uniform vec2  iResolution;

//     mat2 rot(float a){
//         return mat2(cos(a),sin(a),-sin(a),cos(a));
//     }

//     float hash21(vec2 n){
//         return fract(cos(dot(n, vec2(5.9898, 4.1414))) * 65899.89956);
//     }

//     float noise(in vec2 n){
//         const vec2 d = vec2(0.0,1.0);
//         vec2 b = floor(n);
//         vec2 f = smoothstep(vec2(0.),vec2(1.),fract(n));
//         return mix(mix(hash21(b),hash21(b+d.yx),f.x),
//                    mix(hash21(b+d.xy),hash21(b+d.yy),f.x),f.y);
//     }

//     vec2 mixNoise(vec2 p){
//         float eps = .968785675;
//         float nx = noise(vec2(p.x+eps,p.y)) - noise(vec2(p.x-eps,p.y));
//         float ny = noise(vec2(p.x,p.y+eps)) - noise(vec2(p.x,p.y-eps));
//         return vec2(nx,ny);
//     }

//     float fbm(in vec2 p){
//         float amplitude = 3.0;
//         float total     = 0.0;
//         vec2  pom       = p;
//         for (float i = 1.3232; i < 7.45; i++){
//             p   += iTime * 0.05;
//             pom += iTime * 0.09;
//             vec2 n = mixNoise(i * p * 0.3244243 + iTime * 0.131321);
//             n *= rot(iTime * 0.5 - (0.03456 * p.x + 0.0342322 * p.y) * 50.0);
//             p += n * 0.5;
//             total += (sin(noise(p) * 8.5) * 0.55 + 0.4566) / amplitude;

//             p = mix(pom, p, 0.5);
//             amplitude *= 1.3;
//             p   *= 2.007556;
//             pom *= 1.6895367;
//         }
//         return total;
//     }
//     `);

//   // --- 3. core shader snippet (Fragment_Before_FragColor) ----------------------------
//   lavaMat.Fragment_Before_FragColor(`
//     vec2 uv = vUV;                      // vUV is Babylon’s built‑in UV
//     uv.x *= iResolution.x / iResolution.y;
//     uv *= 2.2;

//     float h = fbm(uv);

//     vec3 col = vec3(0.212, 0.08, 0.03) / max(0.2, 0.0001); //1 = h
//     col = pow(col, vec3(1.5));

//     color.rgb = col;   // “color” is Babylon’s working surface color
//     // alpha     = 0.0;
//     color.rgb = vec3(h, 0.08, 0.03);
//     `);

//   // --- 4. pump uniforms each frame ---------------------------------------------------
//   lavaMat.onBind = () => {
//     const effect = lavaMat.getEffect();
//     effect.setFloat("iTime", performance.now() * 0.001);
//     effect.setVector2("iResolution", new BABYLON.Vector2(engine.getRenderWidth(), engine.getRenderHeight()));
//   };

//   // 2. keep an accumulating clock
//   let lavaTime = 0;

//   // 3. push the clock + current viewport into the shader each frame
//   scene.registerBeforeRender(() => {
//     // deltaTime is in ms → convert to seconds and scale if you want faster motion
//     lavaTime += scene.getEngine().getDeltaTime() * 0.001; // seconds elapsed
//     const eff = lavaMat.getEffect();
//     if (eff) {
//       eff.setFloat("iTime", lavaTime);

//       eff.setVector2("iResolution", new BABYLON.Vector2(scene.getEngine().getRenderWidth(), scene.getEngine().getRenderHeight()));
//     }
//   });

//   // --- 5. assign to any mesh ---------------------------------------------------------
//   lavaMat.backFaceCulling = false; // looks nicer on thin planes
//   return lavaMat;
// }
function setupLavaMaterial(scene) {
  BABYLON.Effect.ShadersStore["lavaVertexShader"] = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform mat4 worldViewProjection;
varying vec2 vUV;
void main(void){
    vUV = uv;
    gl_Position = worldViewProjection * vec4(position,1.0);
}`;

  BABYLON.Effect.ShadersStore["lavaFragmentShader"] = `
precision highp float;
varying vec2 vUV;
uniform sampler2D lavaTex;
uniform sampler2D lavaTex2;  // new
uniform float t;
uniform float exposure;   // new
uniform float contrast;   // new

void main(void){
    // base flow
    vec2 uv  = vUV * 5.9;
    uv.y   += t * 0.1;

    // cheap ripple
    float w1 = sin((uv.y + t*0.1)*20.0);
    float w2 = sin((uv.x + t*0.06 +1.6)*15.0);
    vec2 ripple = vec2(w1,w2)*0.015;

    // first sample
    vec4 col1 = texture2D(lavaTex, uv + (ripple * 0.3));

    // second scroll (faster, different tiling)
    vec2 uv2 = vUV * 4.0;
    uv2.y += t * 0.09;  // horizontal drift
    vec4 col2 = texture2D(lavaTex2, uv2 + (ripple * 0.5));

    // blend: change 0.3 to taste
    vec4 col = mix(col1, col2, 0.5);


    // 2️⃣ exposure (simple “film” curve)
    col.rgb = 1.0 - exp(-col.rgb * exposure);

    // 3️⃣ contrast around mid-grey
    col.rgb = (col.rgb - 0.5) * contrast + 0.5;

    gl_FragColor = col;

    // gl_FragColor = mix(col1, col2;
}`;

  // 2. Material
  const lavaMat = new BABYLON.ShaderMaterial("lava", scene, { vertex: "lava", fragment: "lava" }, { attributes: ["position", "uv"], uniforms: ["worldViewProjection", "t", "exposure", "contrast"] });
  // 3. Lava texture (any fiery JPG/PNG)
  lavaMat.setTexture("lavaTex", new BABYLON.Texture("/assets/textures/effects/lava2.png", scene));
  lavaMat.setTexture("lavaTex2", new BABYLON.Texture("/assets/textures/effects/lava.png", scene));

  lavaMat.setFloat("exposure", 0.4);
  lavaMat.setFloat("contrast", 1.08);

  // 4. Time driver
  scene.registerBeforeRender(() => {
    lavaMat.setFloat("t", performance.now() * 0.001); // seconds
  });

  const debug = false;
  if (debug) {
    const settings = [
      { name: "exposure", min: 0, max: 5, step: 0.01, value: 0.4 },
      { name: "contrast", min: 0, max: 3, step: 0.01, value: 1.08 },
    ];

    settings.forEach((opt) => {
      // 1️⃣ make label + slider
      const label = document.createElement("label");
      label.textContent = `${opt.name.charAt(0).toUpperCase() + opt.name.slice(1)}: `;
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = opt.min;
      slider.max = opt.max;
      slider.step = opt.step;
      slider.value = opt.value;
      slider.style.top = "0px";
      slider.style.position = "absolute";
      slider.id = opt.name;
      label.appendChild(slider);
      document.body.appendChild(label);

      // 2️⃣ init uniform
      lavaMat.setFloat(opt.name, opt.value);

      // 3️⃣ update on input
      slider.oninput = () => {
        lavaMat.setFloat(opt.name, +slider.value);
        console.log(opt.name, +slider.value);
      };
    });
  }
  return lavaMat;
}

function addLavaMap(scene, models) {
  let meshes = [];
  let town_map = models["lava_map"];
  // let town_map = models["inn_map_procedural_individual"];
  town_map.name = "inn map";
  town_map.position.y = 10;

  town_map.scaling = new BABYLON.Vector3(5, 5, 5);

  const lavaMat = setupLavaMaterial(scene);

  town_map.getChildMeshes().forEach((mesh) => {
    mesh.material.metallic = 0;
    mesh.receiveShadows = true;
    // set levels
    meshes.push(mesh);
    if (mesh.name.includes("Lava")) {
      mesh.material = lavaMat;
    }

    let town_mapCollision = new BABYLON.PhysicsAggregate(
      mesh,
      BABYLON.PhysicsShapeType.MESH,
      {
        mass: 0,
        restitution: 0.0,
        friction: 1.0,
        // enableCCD: true, 2-3x performance hit, only for desktop, try other ways instead
      },
      scene
    );
    // let town_mapCollision = new BABYLON.PhysicsAggregate(mesh, BABYLON.PhysicsShapeType.CONVEX_HULL, { mass: 0, restitution: 0.0, friction: 1.0 }, scene);
  });

  return meshes;
}

function setupEnvironment(scene) {
  scene.clearColor = new BABYLON.Color3.Black();
  const environmentURL = "./assets/textures/lighting/environment.env";
  const environmentMap = BABYLON.CubeTexture.CreateFromPrefilteredData(environmentURL, scene);
  scene.environmentTexture = environmentMap;
  scene.environmentIntensity = 1.0;
  scene.environmentIntensity = 0.0;
}

async function LoadLiLGUI() {
  return BABYLON.Tools.LoadScriptAsync("https://cdn.jsdelivr.net/npm/lil-gui@0.17.0/dist/lil-gui.umd.min.js");
}

async function GIDebug(scene, giRSMMgr, engine) {
  await LoadLiLGUI();

  const gui = new lil.GUI({ title: "RSM Global Illumination" });

  gui.domElement.style.marginTop = "60px";
  // gui.domElement.id = domElementName;

  const firstRSMParams = giRSMMgr.giRSM[0];
  let guiInputs = {
    rsmTextureRatio: 8,
    giTextureRatio: 2,
  };
  const params = {
    // Global
    enabled: giRSMMgr.enable,
    fxaa: true,
    disableShadows: false,

    // RSM
    rsmTextureRatio: guiInputs.rsmTextureRatio,

    // // GI
    useFullRSMTexture: firstRSMParams.useFullTexture,
    radius: firstRSMParams.radius,
    intensity: firstRSMParams.intensity,
    edgeArtifactCorrection: firstRSMParams.edgeArtifactCorrection,
    numSamples: firstRSMParams.numSamples,
    rotateSamples: firstRSMParams.rotateSample,
    noiseFactor: firstRSMParams.noiseFactor,
    giTextureRatio: guiInputs.giTextureRatio,
    giTextureType: giRSMMgr.giTextureType,
    showOnlyGI: giRSMMgr.showOnlyGI,

    // // GI - Blur
    enableBlur: giRSMMgr.enableBlur,
    blurKernel: giRSMMgr.blurKernel,
    bilateralBlurDepthThreshold: giRSMMgr.blurDepthThreshold,
    bilateralBlurNormalThreshold: giRSMMgr.blurNormalThreshold,
    useQualityBilateralBlur: giRSMMgr.useQualityBlur,
    fullSizeBlur: giRSMMgr.fullSizeBlur,
    bilateralUpsamplerKernel: giRSMMgr.upsamplerKernel,
    useQualityBilateralUpsampling: giRSMMgr.useQualityUpsampling,

    // GPU timings
    counter: "",
  };

  // gui
  //     .add(params, "disableShadows")
  //     .name("Disable shadows")
  //     .onChange((value) => {
  //         console.log(giRSMMgr);
  //         giRSMMgr.giRSM.forEach((girsm) => girsm.rsm.light.shadowEnabled = !value);
  //         if (!checkCounterList()) {
  //             createGPUTimingsGUI();
  //         }
  //     });
  gui
    .add(params, "rsmTextureRatio", 1, 60, 1)
    .name("Texture ratio")
    .onChange((value) => {
      giRSMMgr.giRSM.forEach((girsm) =>
        girsm.rsm.setTextureDimensions({
          width: Math.floor(engine.getRenderWidth(true) / value),
          height: Math.floor(engine.getRenderHeight(true) / value),
        })
      );
    });

  gui
    .add(params, "enabled")
    .name("Enabled")
    .onChange((value) => {
      giRSMMgr.enable = value;
    });

  let fxaa = null;
  gui
    .add(params, "fxaa")
    .name("FXAA")
    .onChange((value) => {
      fxaa?.dispose();
      fxaa = null;
      if (value) {
        fxaa = new BABYLON.FxaaPostProcess("fxaa", 1, scene.activeCamera);
      }
    });

  gui
    .add(params, "showOnlyGI")
    .name("Show only GI")
    .onChange((value) => {
      giRSMMgr.showOnlyGI = value;
    });

  gui
    .add(params, "radius", 0, 6, 0.01)
    .name("Radius")
    .onChange((value) => {
      giRSMMgr.giRSM.forEach((girsm) => (girsm.radius = value));
    });

  gui
    .add(params, "intensity", 0, 1, 0.001)
    .name("Intensity")
    .onChange((value) => {
      giRSMMgr.giRSM.forEach((girsm) => (girsm.intensity = value));
    });

  gui
    .add(params, "edgeArtifactCorrection", 0, 1, 0.01)
    .name("Edge artifact correction")
    .onChange((value) => {
      giRSMMgr.giRSM.forEach((girsm) => (girsm.edgeArtifactCorrection = value));
    });

  gui
    .add(params, "numSamples", 16, 2048, 16)
    .name("Number of samples")
    .onChange((value) => {
      giRSMMgr.giRSM.forEach((girsm) => (girsm.numSamples = value));
    });

  gui
    .add(params, "rotateSamples")
    .name("Rotate samples")
    .onChange((value) => {
      giRSMMgr.giRSM.forEach((girsm) => (girsm.rotateSample = value));
    });

  gui
    .add(params, "noiseFactor", 0, 1000, 0.1)
    .name("Noise factor")
    .onChange((value) => {
      giRSMMgr.giRSM.forEach((girsm) => (girsm.noiseFactor = value));
    });

  gui
    .add(params, "enableBlur")
    .name("Enable Blur")
    .onChange((value) => {
      giRSMMgr.enableBlur = value;
    });
  gui
    .add(params, "blurKernel", 1, 64, 1)
    .name("Blur kernel")
    .onChange((value) => {
      giRSMMgr.blurKernel = value;
    });
  gui
    .add(params, "useQualityBilateralBlur")
    .name("Use quality blur")
    .onChange((value) => {
      giRSMMgr.useQualityBlur = value;
    });

  // giRSMMgr.enable = true;
  // giRSMMgr.showOnlyGI = true;

  return guiInputs;
}

function setupSpotlight(scene) {
  // Create a spotlight
  var spotlight = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(0, 40, 80), new BABYLON.Vector3(0, -1, 0), Math.PI / 3, 2, scene);
  spotlight.diffuse = new BABYLON.Color3(1, 1, 1); // White light
  spotlight.specular = new BABYLON.Color3(1, 1, 1);
  // Mixed GI and normal
  // spotlight.intensity = 1000000;
  // spotlight.intensity = 1000000;
  // GI Only
  spotlight.intensity = 10000.0;
  // spotlight.angle = 166.1005;
  spotlight.angle = 140.1005;

  var frameRate = 30;
  var animation = new BABYLON.Animation("spotlightAnimation", "direction", frameRate, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

  var keyFrames = [];
  var radius = 1; // Radius of the circular path
  var yPosition = -1; // Y position to keep the light pointing downwards

  for (var i = 0; i <= frameRate; i++) {
    var angle = (i / frameRate) * 2 * Math.PI; // Full circle in one second
    keyFrames.push({
      frame: i,
      value: new BABYLON.Vector3(Math.sin(angle) * radius, yPosition, Math.cos(angle) * radius),
    });
  }

  animation.setKeys(keyFrames);
  spotlight.animations.push(animation);

  scene.beginAnimation(spotlight, 0, frameRate, true, 0.2);

  return spotlight;
}

function setupLighting(scene) {
  // var light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
  // light.intensity = 1.7;

  // light.diffuse = new BABYLON.Color3(1, 1, 1);
  // light.specular = new BABYLON.Color3(0, 1, 0);
  // light.groundColor = new BABYLON.Color3(0, 0.5, 1);

  // light.visible = true;

  var hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", new BABYLON.Vector3(0, 1, 0), scene);
  hemisphericLight.intensity = 1.15; // Adjust intensity of the light
  hemisphericLight.diffuse = new BABYLON.Color3(1, 183 / 255, 124 / 255); // White light
  hemisphericLight.specular = new BABYLON.Color3(0.0, 0.0, 0.0); // Gray specular highlight
  hemisphericLight.groundColor = new BABYLON.Color3(52 / 255, 63 / 255, 112 / 255); // Dark ground color

  hemisphericLight.diffuse = new BABYLON.Color3(1, 105 / 255, 65 / 255); // White light
  //   255;

  return hemisphericLight;
}

function setupShadows(light, shadowCaster) {
  const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
  // shadowGenerator.useExponentialShadowMap = false;
  shadowGenerator.darkness = 0.3;
  // shadowGenerator.darkness = 0.6;
  // shadowGenerator.darkness = 1;
  shadowGenerator.usePoissonSampling = true;
  shadowGenerator.nearPlane = 1621.2952;
  shadowGenerator.farPlane = 2007.0404;
  // shadowGenerator.minZ = -1000;
  shadowGenerator.addShadowCaster(shadowCaster);
}

function setupPostProcessing(scene, camera) {
  // scene. Mode = BABYLON.Scene.FOGMODE_EXP;
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  //   scene.fogColor = new BABYLON.Color3(54 / 255, 41 / 255, 58 / 255);
  scene.fogColor = new BABYLON.Color3(54 / 255, 32 / 255, 32 / 255);
  //   54
  scene.fogDensity = 0.0007;
  scene.fogDensity = 0.0008;

  const pipeline = new BABYLON.DefaultRenderingPipeline(
    "default", // The name of the pipeline
    true, // Do you want HDR textures?
    scene, // The scene linked to
    [camera] // The list of cameras to be attached to
  );

  // Configure effects
  pipeline.samples = 4; // MSAA anti-aliasing
  pipeline.fxaaEnabled = false; // Enable FXAA

  pipeline.bloomEnabled = true; // Enable bloom
  pipeline.bloomThreshold = 1.85; //only affect sun not clouds

  const imgProc = pipeline.imageProcessing;

  // Apply contrast and exposure adjustments
  imgProc.contrast = 2.0;
  imgProc.exposure = 1.8;

  imgProc.contrast = 2.0;
  imgProc.exposure = 3.0;

  // Enable tone mapping
  // imgProc.toneMappingEnabled = true;
  // imgProc.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;

  // Apply vignette effect
  imgProc.vignetteEnabled = true;
  imgProc.vignetteWeight = 1.1;
  imgProc.vignetteColor = new BABYLON.Color4(0, 0, 0, 1);
  imgProc.vignetteBlendMode = BABYLON.ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY;
  //     var sharpen = new BABYLON.SharpenPostProcess("sharpen", 1.0, camera);
  // sharpen.edgeAmount = 0.15;  // Increase or decrease for more or less sharpening
  // sharpen.colorAmount = 1.0;

  pipeline.bloomThreshold = 0.005; //only affect sun not clouds
  pipeline.bloomThreshold = 0.001; //only affect sun not clouds
  //   pipeline.bloomWeight = 0.9;
  //   pipeline.bloomWeight = 0.3;
  pipeline.bloomWeight = 0.6;

  imgProc.contrast = 1.4;
  imgProc.exposure = 1.7;

  imgProc.contrast = 1.4;
  imgProc.exposure = 2.0;
  imgProc.toneMappingEnabled = true;
  imgProc.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL;

  // Create array of available LUT images
  const lutImages = [
    "./assets/textures/postprocess/lut-inn.png",
    "./assets/textures/postprocess/cutoff-start-end.png",
    "./assets/textures/postprocess/lut-default.png",
    "./assets/textures/postprocess/lut-grade.png",
    "./assets/textures/postprocess/lut-highcontrast.png",
    // Add more LUT images as needed
  ];

  // Create initial color correction post process
  let colorCorrection = new BABYLON.ColorCorrectionPostProcess("color_correction", lutImages[0], 1.0, camera);
  colorCorrection.samples = 4;
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
  //   lutIndex: 0,
  //   intensity: 1.0,
  // };

  // const lutFolder = pane.addFolder({
  //   title: "Color Correction",
  // });

  // lutFolder
  //   .addInput(PARAMS, "lutIndex", {
  //     label: "LUT Image",
  //     options: lutImages.map((path, index) => ({
  //       text: path.split("/").pop(),
  //       value: index,
  //     })),
  //   })
  //   .on("change", ({ value }) => {
  //     colorCorrection.dispose();
  //     colorCorrection = new BABYLON.ColorCorrectionPostProcess(
  //       "color_correction",
  //       lutImages[value],
  //       PARAMS.intensity,
  //       camera
  //     );
  //   });

  // lutFolder
  //   .addInput(PARAMS, "intensity", {
  //     label: "Intensity",
  //     min: 0,
  //     max: 1,
  //     step: 0.1,
  //   })
  //   .on("change", ({ value }) => {
  //     colorCorrection.intensity = value;
  //   });
}

//create meta-setup for things every scene file needs, like z-reset

function addCurrent(scene, dummyAggregate) {
  scene.onBeforeRenderObservable.add(() => {
    if (dummyAggregate.body.transformNode._absolutePosition.y < -100) {
      dummyAggregate.current(-300);
    }
  });
}

function addZReset(scene, dummyAggregate) {
  scene.onBeforeRenderObservable.add(() => {
    if (dummyAggregate.body.transformNode._absolutePosition.y < -150) {
      dummyAggregate.resetToSpawn();
    }
  });
}

function addLightrays(lightrays, scene, engine) {
  lightrays.position.x = 40;
  lightrays.position.z = 40;
  lightrays.scaling = new BABYLON.Vector3(10, 10, 10);
  const lightRayMaterial = createLightRayMaterial(scene, engine);
  // const lightRayMaterial = createLightRayPBR(scene, engine);
  lightrays.getChildMeshes().forEach(function (childMesh) {
    childMesh.material = lightRayMaterial;
    childMesh.scaling.y = 5;
    childMesh.scaling.x = 3;
    childMesh.isPickable = false;
    // childMesh.billboardMode = 2;
  });
  placeLightRaysMesh(lightrays, scene);
  // placeLightRaysInstance(lightrays, scene);

  // lightshaftsAsParticles(scene);
  // particles(scene);
}
const createLightRayMaterial = (scene, engine) => {
  const shaderMaterial = new BABYLON.ShaderMaterial(
    "lightRayShader",
    scene,
    {
      vertex: "../../../shaders/vfx/atmosphere/lightray",
      fragment: "../../../shaders/vfx/atmosphere/lightray",
    },
    {
      attributes: ["position", "uv"],
      uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "time", "lightColor", "speed", "density", "falloff"],
      needAlphaBlending: true,
      needAlphaTesting: true,
    }
  );
  const texture = new BABYLON.Texture("assets/util/atmosphere/lightrays/smoothLightshafts.png", scene);
  shaderMaterial.setTexture("textureSampler", texture);
  shaderMaterial.backFaceCulling = false;
  shaderMaterial.needPre = false;
  shaderMaterial.needDepthPrePass = true;
  shaderMaterial.setFloat("time", 0);
  shaderMaterial.setColor3("lightColor", new BABYLON.Color3(1, 0.9, 0.7));
  shaderMaterial.setFloat("speed", 1.0);
  // shaderMaterial.setFloat("density", 3.0);
  // shaderMaterial.setFloat("falloff", 2.0);

  const grassThinShader = new BABYLON.ShaderMaterial(
    "grass_thin",
    scene,
    {
      vertex: "../../../shaders/vfx/atmosphere/lightray",
      fragment: "../../../shaders/vfx/atmosphere/lightray",
    },
    {
      attributes: ["position", "normal", "uv", "color", "world0", "world1", "world2", "world3"],
      uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "time", "viewProjection", "vFogInfos", "vFogColor", "color1", "color2", "colorBlendFactor"],
      needAlphaTesting: true,
      needAlphaBlending: true,
    }
  );

  var grassThinTexture = new BABYLON.Texture("./assets/env/exterior/grass/grass_transparent_shadow.png", scene);
  grassThinShader.setTexture("textureSampler", texture);
  grassThinShader.setArray4("world0", [1, 0, 0, 0]);
  grassThinShader.setArray4("world1", [0, 1, 0, 0]);
  grassThinShader.setArray4("world2", [0, 0, 1, 0]);
  grassThinShader.setArray4("world3", [0, 0, 0, 1]);
  grassThinShader.backFaceCulling = false;
  grassThinShader.needDepthPrePass = true;

  grassThinShader.setColor3("color1", new BABYLON.Color3(1.0, 0.1, 0.1)); // Yellow
  grassThinShader.setColor3("color2", new BABYLON.Color3(1.0, 0.05, 0.05)); // Orange
  // grassThinShader.setVector4("color1", new BABYLON.Vector4(1.0, 0.7, 0.0, 0.0));  // Yellow, fully opaque
  // grassThinShader.setVector4("color2", new BABYLON.Vector4(1.0, 0.2, 0.0, 0.0));  // Orange, slightly transparent

  grassThinShader.setFloat("colorBlendFactor", 0.6);

  scene.onBeforeRenderObservable.add(() => {
    const time = performance.now() * 0.001; // Current time in seconds
    grassThinShader.setFloat("time", time);
  });

  let time = 0;
  scene.registerBeforeRender(() => {
    time += engine.getDeltaTime() * 0.01;
    shaderMaterial.setFloat("time", time);

    // Add oscillating blend factor
    const blendFactor = (Math.sin(time * 0.04) + 1) * 0.5; // Creates a 0-1 loop
    grassThinShader.setFloat("colorBlendFactor", blendFactor);
  });

  const debug = false;
  if (debug) {
    BABYLON.Tools.LoadScriptAsync("https://cdn.jsdelivr.net/npm/lil-gui@0.17.0/dist/lil-gui.umd.min.js").then(() => {
      const gui = new lil.GUI({ title: "RAY" });

      const params = {
        colorBlendFactor: 0.6,
        color1: [1.0, 0.7, 0.0],
        color2: [1.0, 0.2, 0.0],
      };

      gui.add(params, "colorBlendFactor", 0, 1, 0.01).onChange((value) => {
        grassThinShader.setFloat("colorBlendFactor", value);
      });

      // Add color controls
      const color1Control = gui.addColor(params, "color1").onChange((value) => {
        grassThinShader.setColor3("color1", BABYLON.Color3.FromArray(value));
      });

      const color2Control = gui.addColor(params, "color2").onChange((value) => {
        grassThinShader.setColor3("color2", BABYLON.Color3.FromArray(value));
      });
    });
  }
  return grassThinShader;
};

function placeLightRaysMesh(lightrays, scene) {
  function getRandomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  lightrays.getChildMeshes().forEach(function (childMesh) {
    // childMesh.billboardMode = 2;

    const lightraysToPlace = 12;
    const minX = -30;

    const maxX = 30;
    const minZ = -40;
    const maxZ = 40;
    for (let i = 0; i < lightraysToPlace; i++) {
      const matrix = BABYLON.Matrix.Identity();
      let x = getRandomInRange(minX, maxX);
      let z = getRandomInRange(minZ, maxZ);

      const fixedRotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Z, Math.PI / 8);
      // const randomRotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Z, Math.random() * Math.PI * 2);
      // const combinedRotation = fixedRotation.multiply(randomRotation);

      const clone = childMesh.clone("lightrayClone");

      // Place the instance at a specific position
      clone.position = new BABYLON.Vector3(x, -20, z); // Example position (x: 2, y: 0, z: 0)
      clone.scaling.x = 5 + (clone.scaling.x * 1 * x) / 20;
      clone.scaling.y = clone.scaling.y * 3;

      clone.rotationQuaternion = fixedRotation;
    }
  });
}
