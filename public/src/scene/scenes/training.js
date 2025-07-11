import { loadHeroModel } from "../../character/hero.js";
import { setupCamera } from "../../utils/camera.js";
import { setupPhysics } from "../../utils/physics.js";
import { setupInputHandling } from "../../movement.js";
import { setupAnim } from "../../utils/anim.js";
import { setupWater } from "../../utils/water.js";

import { loadModels } from "../../utils/load.js";

import { setupEnemies } from "../../character/enemy.js";
import { Health } from "../../character/health.js";
import addSword from "../../character/equips/held.js";

import { loadVRM, loadAnimationToCharacter, playAnimation, testAnimation } from "../../utils/vrm.js";
import { createEmoteFactory } from "../../utils/vrm_emote.js";
import { createMobileControls, createMobileControlsJoystickOnly } from "../../utils/mobile/joystick.js";

import { Options } from "/src/utils/options/options.js";

import { ActionMenu } from "/src/utils/action-menu/actionMenu.js";

import { SoundManager } from "/src/utils/sound.js";

export async function createTraining(engine) {
  const scene = new BABYLON.Scene(engine);

  const spawnPoint = new BABYLON.Vector3(140, 59, -269);
  const { character, dummyAggregate } = await setupPhysics(scene, spawnPoint);
  // const terrain = setupTerrain(scene);

  const camera = setupCamera(scene, character, engine);
  camera.wheelDeltaPercentage = 0.02;
  // camera.upperBetaLimit = Math.PI / 2; // Stops at the horizon (90 degrees)
  camera.upperBetaLimit = 3.13;
  camera.lowerRadiusLimit = 4; // Minimum distance to target (closest zoom)
  camera.upperRadiusLimit = 656.8044;
  camera.upperBetaLimit = Math.PI / 2; // Stops at the horizon (90 degrees)
  camera.alpha = 4.954;
  camera.beta = 1.3437;

  // load all models, make sure parallel loading for speed
  const modelUrls = ["characters/enemy/slime/Slime1.glb", "characters/weapons/Sword2.glb", "util/HPBar.glb", "env/interior/training/CharacterSelectArea.glb", "util/atmosphere/lightrays/lightrays.glb"];
  const heroModelPromise = loadHeroModel(scene, character);
  const [heroModel, models] = await Promise.all([heroModelPromise, loadModels(scene, modelUrls)]);
  const { hero, skeleton } = heroModel;
  createMobileControlsJoystickOnly(scene, camera, character);

  let anim = setupAnim(scene, skeleton);
  setupInputHandling(scene, character, camera, hero, anim, engine, dummyAggregate);
  character.health = new Health("Hero", 100, dummyAggregate);
  character.health.rotationCheck = hero;
  character.health.rangeCheck = character;
  character.health.anim = anim;
  PLAYER = character;
  PLAYER_DATA = {
    level: 1,
    experience: 0,
    nextLevelExponent: 1.2,
    skills: [],
    talents: [],
    gold: 0,
    inventory: [],
    equipment: [],
    stats: {},
    inventory: [],
  };

  await setupOptions(scene, engine);
  // Todo: add shadow and post toggles in settings
  // Defer non-critical operations
  setupEnvironment(scene);
  createSkydome(scene);
  setupTrainingArea(scene, models);
  // setupWater(scene, terrain, engine, hero, 12.16, 8000);

  const light = setupLighting(scene);

  setupShadows(light, hero);
  setupPostProcessing(scene, camera);

  loadHPModels(scene, engine, models["HPBar"]);

  let sword = addSword(scene, models["Sword2"]);
  sword.isPickable = false;
  createTrail(scene, engine, sword, 0.2, 40, new BABYLON.Vector3(0, 0, 0.32));

  const slime1 = models["Slime1"];
  let groundObject = models["CharacterSelectArea"].getChildMeshes()[0];
  setupEnemies(scene, character, groundObject, 7, slime1);

  VFX["fireBall"] = addFireball(scene, engine);

  VFX["fireBallNew"] = createFireballVFX(scene);

  addLightrays(models["lightrays"], scene, engine);

  addDust(scene, engine);
  // addNewFog(scene, engine);
  // addPostFog(scene, engine, camera);
  testText(scene);
  await createZoneText("Training", scene);

  // VRM WIP
  // let character2 = await loadVRM(scene, "characters/vrm/avatar.vrm");
  // character2.meshes[0].position.x = 140;
  // character2.meshes[0].position.y = 59;
  // character2.meshes[0].position.z = -269;
  // // character2.meshes[1].scaling.scaleInPlace(10.14);

  // // Store the animation and play it
  // // animation retargeting is tied to character
  // //seperate load animation when entire scene loads. this is used for copiying a new animation to a new character
  // const animation = await loadAnimationToCharacter(
  //   scene,
  //   character2,
  //   "characters/vrm/emote-idle.glb"
  // );
  // playAnimation(animation, true);

  // // const animFile = await BABYLON.SceneLoader.ImportMeshAsync(
  // //   "",
  // //   "./assets/",
  // //   "characters/vrm/emote-idle.glb",
  // //   scene
  // // );

  // // const emoteFactory = createEmoteFactory(animFile.animationGroups[0]);
  // // const vrmAnimation = emoteFactory.toAnimationGroup({
  // //   rootToHips: character.height,
  // //   version: "1",
  // //   getBoneName: (name) => boneMapping[name],
  // //   scene,
  // // });

  // // console.log(hero);
  // const heroCopy = character.clone("heroCopy");
  // heroCopy.position.x = hero.position.x + 10; // Offset the copy by 10 units on X axis

  // // console.log(character2.skeleton.animationGroups);
  // const animation2 = await loadAnimationToCharacter(
  //   scene,
  //   heroCopy,
  //   "characters/vrm/emote-idle.glb"
  // );
  // playAnimation(animation2, true);
  // testAnimation(scene, character2);

  setupClass();
  // Get Class JSON
  // Has SkillBar
  // Has SkillBook
  // Has SkillTree
  // const classJson = await fetch("assets/classes/warrior.json");
  // loadClass(scene, classJson);

  await setupSound(scene);
  return scene;
}

async function setupSound(scene) {
  const audioEngine = await BABYLON.CreateAudioEngineAsync();
  const sound = new SoundManager(scene);
  sound.createSoundPresets();

  sound.createSound("NPC Hey", "/assets/sounds/npc/deep/npc_deep.mp3", "sfx", { volume: 0.8 });
  sound.createSound("NPC Hmm", "/assets/sounds/npc/deep/npc_deep_hmm.mp3", "sfx", { volume: 0.8 });
  sound.createSound("NPC Hows", "/assets/sounds/npc/deep/npc_deep_hows.mp3", "sfx", { volume: 0.8 });
  sound.createSound("NPC Keep Moving", "/assets/sounds/npc/deep/npc_deep_keep_moving.mp3", "sfx", { volume: 0.8 });

  sound.createSound("Pickup", "/assets/sounds/ui/book/pickup.mp3", "sfx", { volume: 0.8 });

  // scene.activeCamera.sound.play("Ice 3", "sfx");
  scene.activeCamera.sound = sound;

  // setTimeout(() => {
  //   console.log("play sound");

  //   scene.activeCamera.sound.play("Ice 3", "sfx");
  // }, 10000);

  // setTimeout(async function () {
  //   const ambience = await BABYLON.CreateStreamingSoundAsync("Sunny Explore", "/assets/sounds/background/sunny-day-ambiance.wav");
  //   // Wait until audio engine is ready to play sounds.
  //   await audioEngine.unlockAsync();
  //   ambience.loop = true;

  //   ambience.play();
  //   ambience.volume = 0.9;
  //   scene.activeCamera.sound.ambience = ambience;
  // }, 100);

  setTimeout(async function () {
    scene.activeCamera.sound.setChannelVolume("music", 0.3);
    const sound = await BABYLON.CreateStreamingSoundAsync("Sunny Explore", "/assets/sounds/music/Enchanted Mischief.mp3");
    // Wait until audio engine is ready to play sounds.
    await audioEngine.unlockAsync();
    sound.volume = 0.1;
    sound.play();
    scene.activeCamera.sound.music = sound;

    setInterval(async function () {
      sound.play();
    }, 400000); // 100 seconds in milliseconds
  }, 15000);
}

function setupOptions(scene, engine) {
  OPTIONS = new Options();
  OPTIONS.onOptionChange("resolutionScale", (value) => {
    // Apply hardware scaling inversely (higher value = lower scaling)
    // This creates a linear relationship where 1 = 1, 2 = 0.5, 1.5 = 0.67, etc.
    engine.setHardwareScalingLevel(1 / value);
  });
  // scene.performancePriority = BABYLON.ScenePerformancePriority.Aggressive;
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      document.body.style.cursor = "default";
    }
  });
}

function loadClass(scene, classJson) {
  CLASS = new Class(scene, classJson);
}

function setupClass() {
  // Initialize skill bar
  setupSkillBar();
  setupSpellbook();
  setupSkillTree();
}

import { SkillBar } from "/src/combat/skills/SkillBar.js";
import { Spellbook } from "/src/combat/skills/Spellbook.js";
import { SkillTree } from "/src/combat/skills/SkillTree.js";

function setupSkillBar() {
  SKILL_BAR = new SkillBar();
  SKILL_BAR.showSkillBar();
}
function setupSpellbook() {
  SPELLBOOK = new Spellbook();
}
function setupSkillTree() {
  SKILL_TREE = new SkillTree();
}

// import {Text} from 'troika-three-text'

function testText(scene) {
  //        // new text
  //        const myText = new Text()
  //        scene.add(myText);

  //    // Set properties to configure:
  //    myText.text = 'Hello world!';
  //    myText.fontSize = 0.2;
  //    myText.position.z = -2;
  //    myText.color = 0x9966FF;

  const plane = BABYLON.MeshBuilder.CreatePlane("textPlane", { width: 2, height: 1 }, scene);
  const dynamicTexture = new BABYLON.DynamicTexture("dynamicTexture", { width: 512, height: 256 }, scene, true);
  const ctx = dynamicTexture.getContext();
  ctx.font = "50px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Hello world!", 50, 100);
  dynamicTexture.update();
  const material = new BABYLON.StandardMaterial("mat", scene);
  material.diffuseTexture = dynamicTexture;
  plane.material = material;
}
function addDust(scene, engine) {
  // Create a particle system
  const particleSystem = new BABYLON.ParticleSystem("particles", 2000);

  //Texture of each particle
  particleSystem.particleTexture = new BABYLON.Texture("./assets/textures/effects/flare.png");

  // Create a larger box emitter
  particleSystem.emitter = new BABYLON.Vector3(120.0, 200, -250);
  particleSystem.minEmitBox = new BABYLON.Vector3(-100, -10, -100); // Starting point of emission
  particleSystem.maxEmitBox = new BABYLON.Vector3(100, 10, 100); // End point of emission

  particleSystem.minEmitPower = 1;
  particleSystem.maxEmitPower = 3;

  particleSystem.minSize = 1.05;
  particleSystem.maxSize = 1.75;

  // Add fade effect
  particleSystem.minLifeTime = 7.0; // Minimum lifetime of particles
  particleSystem.maxLifeTime = 7.5; // Maximum lifetime of particles

  // Color gradient over lifetime
  particleSystem.addColorGradient(0, new BABYLON.Color4(0, 1, 1, 0.2)); // Start transparent
  particleSystem.addColorGradient(1.0, new BABYLON.Color4(0, 1, 1, 0.2)); // Fade out
  particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
  particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
  particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

  particleSystem.direction1 = new BABYLON.Vector3(-7, -8, 3);
  particleSystem.direction2 = new BABYLON.Vector3(7, -8, -3);

  particleSystem.addSizeGradient(0, 0.0); //size at start of particle lifetime
  particleSystem.addSizeGradient(0.3, 1); //size at end of particle lifetime
  particleSystem.addSizeGradient(0.7, 1);
  particleSystem.addSizeGradient(1, 0);

  particleSystem.start();
}

function setupTrainingArea(scene, models) {
  models["CharacterSelectArea"].scaling.scaleInPlace(5);
  models["CharacterSelectArea"].position.x = 800;
  models["CharacterSelectArea"].position.y = -20;
  models["CharacterSelectArea"].position.z = -800;
  models["CharacterSelectArea"].getChildMeshes().forEach((mesh) => {
    if (mesh.material) {
      mesh.material.metallic = 0.8;
    }
  });
  // console.log(models["CharacterSelectArea"].getChildMeshes()[1]);

  // let trainingPhysics = new BABYLON.PhysicsAggregate(models["CharacterSelectArea"].getChildMeshes()[1], BABYLON.PhysicsShapeType.MESH, { mass: 0, restitution: 0.0, friction: 1000000000.8 }, scene);

  // Add physics to each mesh in the character select area
  models["CharacterSelectArea"].getChildMeshes().forEach((mesh) => {
    let trainingPhysics = new BABYLON.PhysicsAggregate(mesh, BABYLON.PhysicsShapeType.MESH, { mass: 0, restitution: 0.0, friction: 1000000000.8 }, scene);
  });
  scene.physicsEnabled = true;
}

function setupEnvironment(scene) {
  // scene.clearColor = new BABYLON.Color3.White();
  scene.clearColor = new BABYLON.Color3.Black();
  const environmentURL = "./assets/textures/lighting/environment.env";
  const environmentMap = BABYLON.CubeTexture.CreateFromPrefilteredData(environmentURL, scene);
  scene.environmentTexture = environmentMap;
  scene.environmentIntensity = 0.3;
  scene.environmentIntensity = 0.8;
}

function createSkydome(scene) {
  var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 8000.0 }, scene);
  var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("./assets/textures/lighting/skybox", scene);
  skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
  skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
  skybox.material = skyboxMaterial;

  return skybox;
}

function setupTerrain(scene) {
  const terrainMaterial = new BABYLON.TerrainMaterial("terrainMaterial", scene);
  terrainMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  terrainMaterial.specularPower = 64;
  terrainMaterial.mixTexture = new BABYLON.Texture("assets/textures/terrain/mixMap.png", scene);
  terrainMaterial.diffuseTexture1 = new BABYLON.Texture("assets/textures/terrain/floor.png", scene);
  terrainMaterial.diffuseTexture2 = new BABYLON.Texture("assets/textures/terrain/rock.png", scene);
  terrainMaterial.diffuseTexture3 = new BABYLON.Texture("assets/textures/terrain/grass.png", scene);

  terrainMaterial.diffuseTexture1.uScale = terrainMaterial.diffuseTexture1.vScale = 15;
  terrainMaterial.diffuseTexture2.uScale = terrainMaterial.diffuseTexture2.vScale = 8;
  terrainMaterial.diffuseTexture3.uScale = terrainMaterial.diffuseTexture3.vScale = 23;

  const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
    "ground",
    "assets/textures/terrain/hieghtMap.png",
    {
      width: 1000,
      height: 1000,
      subdivisions: 100,
      minHeight: 0,
      maxHeight: 100,
      onReady: function (ground) {
        ground.position.y = -10.05;
        ground.material = terrainMaterial;
        ground.receiveShadows = true;
        // ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.HeightmapImpostor, { mass: 0, restitution: 0.0, friction: 100.8 }, scene);
        // setTimeout(() => scene.physicsEnabled = true, 1000); // Enable physics after the ground is ready
        var groundAggregate;
        groundAggregate = new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.MESH, { mass: 0, restitution: 0.0, friction: 1000000000.8 }, scene);
        setTimeout(() => {
          scene.physicsEnabled = true;
        }, 10);
      },
    },
    scene
  );

  return ground;
}

function setupLighting(scene) {
  const light = new BABYLON.DirectionalLight("light0", new BABYLON.Vector3(-800, -1400, -1000), scene);
  light.intensity = 1.7;
  // light.shadowMinZ = 1800;
  // light.shadowMinZ = 2100;
  light.shadowMinZ = 1500;
  light.shadowMaxZ = 2300;
  light.diffuse = new BABYLON.Color3(1, 1, 1);

  // var light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
  // light.intensity = 1.7;

  // light.diffuse = new BABYLON.Color3(1, 1, 1);
  // light.specular = new BABYLON.Color3(0, 1, 0);
  // light.groundColor = new BABYLON.Color3(0, 0.5, 1);

  return light;
}

function setupShadows(light, shadowCaster) {
  const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
  // shadowGenerator.useExponentialShadowMap = false;
  shadowGenerator.darkness = 0.6;
  // shadowGenerator.darkness = 1;
  shadowGenerator.usePoissonSampling = true;
  shadowGenerator.nearPlane = 1;
  shadowGenerator.farPlane = 10000;
  shadowGenerator.minZ = -100;
  shadowGenerator.addShadowCaster(shadowCaster);
}

function loadHPModels(scene, engine, HPBar) {
  HPBAR = HPBar;
  var blackMaterial = new BABYLON.StandardMaterial("blackMat", scene);
  blackMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0); // Black color
  blackMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // No specular highlight
  HPBAR.getChildMeshes()[1].material = blackMaterial;

  const shaderMaterial = new BABYLON.ShaderMaterial(
    "hpbar",
    scene,
    {
      vertex: "../../../../../shaders/hp/hp",
      fragment: "../../../shaders/hp/hp",
    },
    {
      attributes: ["position", "normal", "uv"],
      uniforms: ["worldViewProjection", "iTime", "iResolution", "iChannel0", "iChannel1"],
    }
  );

  var iChannel0 = new BABYLON.Texture("assets/textures/effects/ripple.png", scene);
  var iChannel1 = new BABYLON.Texture("assets/textures/effects/bar.png", scene);

  shaderMaterial.setTexture("iChannel0", iChannel0);
  shaderMaterial.setTexture("iChannel1", iChannel1);
  shaderMaterial.setFloat("iTime", 0);
  shaderMaterial.setVector2("iResolution", new BABYLON.Vector2(engine.getRenderWidth(), engine.getRenderHeight()));

  var iTime = 0;
  scene.onBeforeRenderObservable.add(() => {
    iTime += engine.getDeltaTime() / 1000.0;
    shaderMaterial.setFloat("iTime", iTime);
  });
  HPBAR.getChildMeshes()[0].material = shaderMaterial;

  HPBAR.getChildMeshes()[0].isPickable = false;
  HPBAR.getChildMeshes()[1].isPickable = false;
}

function setupPostProcessing(scene, camera) {
  // scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
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
  imgProc.contrast = 1.6;
  imgProc.exposure = 1.8;

  // Enable tone mapping
  imgProc.toneMappingEnabled = true;
  imgProc.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
  imgProc.contrast = 2.1;
  imgProc.contrast = 3.0;
  imgProc.exposure = 4.0;

  // pipeline.bloomThreshold = 0.01;
  pipeline.bloomThreshold = 0.0;
  pipeline.bloomKernel = 128;
  // pipeline.bloomWeight = 0.5;
  pipeline.bloomWeight = 0.25;

  // Apply vignette effect
  imgProc.vignetteEnabled = true;
  // imgProc.vignetteWeight = 2.6;
  imgProc.vignetteWeight = 2.6;
  imgProc.vignetteCameraFov = 0.4;
  imgProc.vignetteColor = new BABYLON.Color4(0, 0, 0, 1);
  imgProc.vignetteBlendMode = BABYLON.ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY;
  //     var sharpen = new BABYLON.SharpenPostProcess("sharpen", 1.0, camera);
  // sharpen.edgeAmount = 0.15;  // Increase or decrease for more or less sharpening
  // sharpen.colorAmount = 1.0;

  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2; // Exponential squared fog
  scene.fogDensity = 0.0017; // Adjust this value to control fog thickness
  // scene.fogColor = new BABYLON.Color3(0.039, 0.275, 0.322); // Teal fog color #0A4652
  scene.fogColor = new BABYLON.Color3(0, 0.212, 0.278); // Fog color #003647

  // pipeline.colorCurvesEnabled = true;
  // const colorCurves = new BABYLON.ColorCurves();
  // pipeline.colorCurves = colorCurves;

  // // Set color correction values
  // colorCurves.globalPower = new BABYLON.Color3(10.1, 1.1, 1.1);      // RGB power values
  // colorCurves.globalMultiplier = new BABYLON.Color3(2.2, 1.2, 1.2); // RGB multiplier values

  // Add SSAO
  const ssao = new BABYLON.SSAO2RenderingPipeline("ssao", scene, {
    ssaoRatio: 1.0, // Ratio of the SSAO post-process, between 0 and 1
    blurRatio: 1, // Ratio of the blur post-process
  });
  ssao.radius = 6; // Radius of occlusion sampling
  ssao.totalStrength = 1.5; // Overall strength of the SSAO effect
  // ssao.expensiveBlur = true; // Apply a better quality blur
  // ssao.bilateralSample = 16;
  ssao.bilateralSample = 4;
  ssao.expensiveBlur = false; // Apply a better quality blur
  ssao.samples = 16; // Number of samples used for occlusion calculation
  ssao.maxZ = 700; // Maximum distance to sample for occlusion

  scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);
  // Load GUI library and add controls

  // In your main scene setup or where you handle SSAO

  // Register callbacks for SSAO options
  OPTIONS.onOptionChange("ssaoToggle", (enabled) => {
    if (enabled) {
      scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);
    } else {
      scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline("ssao", camera);
    }
  });

  OPTIONS.onOptionChange("ssaoSamples", (samples) => {
    ssao.samples = samples;
  });

  OPTIONS.onOptionChange("expensiveBlur", (enabled) => {
    ssao.expensiveBlur = enabled;
  });

  let debug = false;
  if (debug) {
    BABYLON.Tools.LoadScriptAsync("https://cdn.jsdelivr.net/npm/lil-gui@0.17.0/dist/lil-gui.umd.min.js").then(() => {
      const gui = new lil.GUI({ title: "SSAO Settings" });
      const ssaoFolder = gui.addFolder("SSAO Parameters");

      ssaoFolder.add(ssao, "radius", 0.1, 10, 0.1).name("Radius");
      ssaoFolder.add(ssao, "totalStrength", 0, 5, 0.1).name("Strength");
      ssaoFolder.add(ssao, "samples", 4, 64, 1).name("Samples");
      ssaoFolder.add(ssao, "maxZ", 0, 1000, 10).name("Max Z");

      const params = {
        ssaoRatio: 1.0,
        blurRatio: 1.0,
        expensiveBlur: true,
      };

      ssaoFolder
        .add(params, "ssaoRatio", 0.1, 1, 0.1)
        .name("SSAO Ratio")
        .onChange((value) => {
          scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline("ssao", camera);
          ssao.dispose();
          ssao._ratio = value;
          scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);
        });

      ssaoFolder
        .add(params, "blurRatio", 0.1, 2, 0.1)
        .name("Blur Ratio")
        .onChange((value) => {
          scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline("ssao", camera);
          ssao.dispose();
          ssao._blurRatio = value;
          scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);
        });

      ssaoFolder
        .add(params, "expensiveBlur")
        .name("High Quality Blur")
        .onChange((value) => {
          ssao.expensiveBlur = value;
        });

      // Open the folder by default
      ssaoFolder.open();
    });
  }
  // LUT Texture Color Grading
  var postProcess = new BABYLON.ColorCorrectionPostProcess("color_correction", "./assets/textures/postprocess/cutoff-start-end.png", 1.0, camera);
  // var postProcess = new BABYLON.ColorCorrectionPostProcess("color_correction", "./assets/textures/postprocess/cutoff-start-end.png", 0.3, camera);
  // BABYLON.Tools.LoadScriptAsync("https://cdn.jsdelivr.net/npm/lil-gui@0.17.0/dist/lil-gui.umd.min.js").then(() => {
  //     const gui = new lil.GUI({ title: "Color Correction" });

  //     // Create a parameters object to track the intensity
  //     const params = {
  //         intensity: 1.0
  //     };

  //     gui.add(params, 'intensity', 0, 2, 0.01)
  //         .name('Color Correction Intensity')
  //         .onChange((value) => {
  //             postProcess.updateEffect("./assets/textures/postprocess/cutoff-start-end.png", value);
  //         });
  // });

  // var postProcess2 = new BABYLON.TonemapPostProcess("tonemap", BABYLON.TonemappingOperator.Hable, 1.0, camera);

  // var postProcess = new BABYLON.ImageProcessingPostProcess("processing", 1.0, camera);
  // var curve = new BABYLON.ColorCurves();
  // // curve.globalHue = 200;
  // // curve.globalDensity = 0;
  // // curve.globalSaturation = 0;
  // // curve.globalSaturation = 0;
  // curve.globalExposure = 100;

  // // curve.highlightsHue = 20;
  // // curve.highlightsDensity = 80;
  // // curve.highlightsSaturation = -80;

  // // curve.shadowsHue = 2;
  // // curve.shadowsDensity = 80;
  // // curve.shadowsSaturation = 40;
  // postProcess.colorCurvesEnabled = true;
  // postProcess.colorCurves = curve;

  // // Add GUI controls for color curves
  // BABYLON.Tools.LoadScriptAsync("https://cdn.jsdelivr.net/npm/lil-gui@0.17.0/dist/lil-gui.umd.min.js").then(() => {
  //     const gui = new lil.GUI({ title: "Color Curve Settings" });

  //     // Global settings folder
  //     const globalFolder = gui.addFolder('Global');
  //     globalFolder.add(curve, 'globalHue', 0, 360).name('Hue');
  //     globalFolder.add(curve, 'globalDensity', 0, 100).name('Density');
  //     globalFolder.add(curve, 'globalSaturation', -100, 100).name('Saturation');
  //     globalFolder.add(curve, 'globalExposure', 0, 200).name('Exposure');

  //     // Highlights folder
  //     const highlightsFolder = gui.addFolder('Highlights');
  //     highlightsFolder.add(curve, 'highlightsHue', 0, 360).name('Hue');
  //     highlightsFolder.add(curve, 'highlightsDensity', 0, 100).name('Density');
  //     highlightsFolder.add(curve, 'highlightsSaturation', -100, 100).name('Saturation');

  //     // Shadows folder
  //     const shadowsFolder = gui.addFolder('Shadows');
  //     shadowsFolder.add(curve, 'shadowsHue', 0, 360).name('Hue');
  //     shadowsFolder.add(curve, 'shadowsDensity', 0, 100).name('Density');
  //     shadowsFolder.add(curve, 'shadowsSaturation', -100, 100).name('Saturation');

  //     // Open folders by default
  //     globalFolder.open();
  //     highlightsFolder.open();
  //     shadowsFolder.open();
  // });
}

function addFireball(scene, engine) {
  let orbMaterial = addShaders(scene, engine);

  const sphere = BABYLON.MeshBuilder.CreateSphere("Fireball Orb", { diameter: 2, segments: 32 }, scene);
  sphere.material = orbMaterial;
  sphere.material.backFaceCulling = true;
  sphere.material.alphaMode = BABYLON.Constants.ALPHA_COMBINE;
  sphere.material.needAlphaBlending = function () {
    return true;
  };

  createTrailFire(scene, engine, sphere);
  return sphere;
}

function addShaders(scene, engine) {
  var orbMaterial = new BABYLON.ShaderMaterial(
    "orb",
    scene,
    {
      vertex: "../../../shaders/vfx/orb",
      fragment: "../../../shaders/vfx/orb",
    },
    {
      attributes: ["position", "uv"],
      uniforms: ["worldViewProjection", "iTime", "iResolution", "iMouse", "Radius", "Background", "NoiseSteps", "NoiseAmplitude", "NoiseFrequency", "Animation", "Color1", "Color2", "Color3", "Color4"],
    }
  );

  orbMaterial.setFloat("Radius", 2.0);
  orbMaterial.setVector4("Background", new BABYLON.Vector4(0.1, 0.0, 0.0, 0.0));
  orbMaterial.setInt("NoiseSteps", 8);
  orbMaterial.setFloat("NoiseAmplitude", 0.09);
  orbMaterial.setFloat("NoiseFrequency", 1.2);
  orbMaterial.setVector3("Animation", new BABYLON.Vector3(0.0, -2.0, 0.5));
  orbMaterial.setVector4("Color1", new BABYLON.Vector4(1.0, 1.0, 1.0, 1.0));
  orbMaterial.setVector4("Color2", new BABYLON.Vector4(1.0, 0.3, 0.0, 1.0));
  orbMaterial.setVector4("Color3", new BABYLON.Vector4(1.0, 0.03, 0.0, 1.0));
  orbMaterial.setVector4("Color4", new BABYLON.Vector4(0.05, 0.02, 0.02, 1.0));

  engine.runRenderLoop(() => {
    orbMaterial.setFloat("iTime", performance.now() * 0.001);
    orbMaterial.setVector2("iResolution", new BABYLON.Vector2(engine.getRenderWidth(), engine.getRenderHeight()));
    orbMaterial.setFloat("uAlpha", 0.5);
  });

  function creatDebug() {
    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    const panel = new BABYLON.GUI.StackPanel();
    panel.width = "220px";
    panel.top = "-20px";
    panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(panel);

    const createSlider = (label, min, max, value, step, callback) => {
      const header = new BABYLON.GUI.TextBlock();
      header.text = label;
      header.height = "30px";
      header.color = "white";
      panel.addControl(header);

      const slider = new BABYLON.GUI.Slider();
      slider.minimum = min;
      slider.maximum = max;
      slider.value = value;
      slider.step = step;
      slider.height = "20px";
      slider.width = "200px";
      slider.onValueChangedObservable.add(callback);
      panel.addControl(slider);
    };

    const createColorPicker = (label, defaultColor, callback) => {
      const header = new BABYLON.GUI.TextBlock();
      header.text = label;
      header.height = "30px";
      header.color = "white";
      panel.addControl(header);

      const picker = new BABYLON.GUI.ColorPicker();
      picker.value = defaultColor;
      picker.height = "150px";
      picker.width = "150px";
      picker.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      picker.onValueChangedObservable.add(callback);
      panel.addControl(picker);
    };

    createSlider("Radius", 0.0, 5.0, 2.0, 0.1, (value) => orbMaterial.setFloat("Radius", value));
    createSlider("Noise Amplitude", 0.0, 1.0, 0.09, 0.01, (value) => orbMaterial.setFloat("NoiseAmplitude", value));
    createSlider("Noise Frequency", 0.0, 5.0, 1.2, 0.1, (value) => orbMaterial.setFloat("NoiseFrequency", value));

    createColorPicker("Color1", BABYLON.Color3.FromHexString("#640000"), (color) => {
      orbMaterial.setVector4("Color1", new BABYLON.Vector4(color.r, color.g, color.b, 1.0));
    });

    createColorPicker("Color2", BABYLON.Color3.FromHexString("#ff4d00"), (color) => {
      orbMaterial.setVector4("Color2", new BABYLON.Vector4(color.r, color.g, color.b, 1.0));
    });

    createColorPicker("Color3", BABYLON.Color3.FromHexString("#ff0a00"), (color) => {
      orbMaterial.setVector4("Color3", new BABYLON.Vector4(color.r, color.g, color.b, 1.0));
    });

    createColorPicker("Color4", BABYLON.Color3.FromHexString("#0d0505"), (color) => {
      orbMaterial.setVector4("Color4", new BABYLON.Vector4(color.r, color.g, color.b, 1.0));
    });
  }

  // if (DEBUG) creatDebug();

  return orbMaterial;
}

function createTrailFire(scene, engine, sphere) {
  let spawnPoint = new BABYLON.Vector3(154.683, 70, -281.427);
  sphere.position.y = spawnPoint.y;
  sphere.position.x = spawnPoint.x;
  sphere.position.z = spawnPoint.z;
  // sphere.position = spawnPoint;

  // uncomment for fireball demo
  // sphere.scaling.scaleInPlace(3, 3, 3);
  // // Animate the sphere
  // var AlphaTime = 0;
  // var alpha = 0;
  // var alphaChange = 0.5;
  // scene.registerBeforeRender(function () {
  //     sphere.position.x = 19.1 * Math.cos(alpha) + spawnPoint.x;
  //     sphere.position.y = 2 * Math.sin(alpha) + spawnPoint.y;
  //     // sphere.position.y = 4 * Math.sin(alpha) + spawnPoint.y;
  //     // sphere.position.y = 20 * Math.sin(alpha);
  //     sphere.position.z = 5.1 * Math.sin(alpha) + spawnPoint.z;

  //     alphaChange = 0.05 * Math.sin(AlphaTime);
  //     alpha += alphaChange;
  //     AlphaTime += 0.01;

  //     // alpha += 0.01;
  //     // alpha += 0.05;
  // });

  SHADERS["fireTrailShader"] = new BABYLON.ShaderMaterial(
    "fireTrail",
    scene,
    {
      vertex: "../../../shaders/vfx/trail",
      fragment: "../../../shaders/vfx/trail",
    },
    {
      attributes: ["position", "normal", "uv"],
      uniforms: ["world", "worldViewProjection", "view", "projection", "time"],
      needAlphaBlending: true,
    }
  );
  SHADERS["fireTrailShader"].transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
  // fireTrailShader.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;

  const trail = new BABYLON.TrailMesh("trail", sphere, scene, 0.5, 120, true);
  trail.diameter = 0.5;
  trail.material = SHADERS["fireTrailShader"];
  trail.alphaIndex = 0; // Set beside fire shader
  // trail.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  // trail.scaling.scaleInPlace(1, 1, 1);

  let time = 0;
  scene.registerBeforeRender(() => {
    time += engine.getDeltaTime() * 0.001;
    SHADERS["fireTrailShader"].setFloat("time", time);
    // trail.update();
  });

  // trail.parent = sphere;

  // const gizmoManager = new BABYLON.GizmoManager(scene);

  // // Enable position, rotation, and scale gizmos
  // gizmoManager.positionGizmoEnabled = true;
  // gizmoManager.rotationGizmoEnabled = true;
  // gizmoManager.scaleGizmoEnabled = true;

  // // Attach the gizmo to the trail
  // gizmoManager.attachToMesh(trail);

  // Create the trail material
  // var trailMaterial = new BABYLON.StandardMaterial("trailMaterial", scene);
  // trailMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0);

  // // Create the trail mesh
  // var trail = new BABYLON.TrailMesh("trail", sphere, scene, 0.2, 30, true);
  // trail.material = trailMaterial;
}

function createTrail(scene, engine, objectToAttach, diameter, segments, offset, rotation, scale) {
  const fireTrailShader = new BABYLON.ShaderMaterial(
    "fireTrail",
    scene,
    {
      vertex: "../../../shaders/vfx/trail_sword",
      fragment: "../../../shaders/vfx/trail_sword",
    },
    {
      attributes: ["position", "normal", "uv"],
      uniforms: ["world", "worldViewProjection", "view", "projection", "time"],
      needAlphaBlending: true,
    }
  );
  // fireTrailShader.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
  fireTrailShader.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
  fireTrailShader.backFaceCulling = false;

  var trailNode = new BABYLON.TransformNode("trailNode");
  trailNode.parent = objectToAttach;
  trailNode.position = offset;
  trailNode.scaling.scale;
  // Set rotation in degrees
  var rotationXInDegrees = 196.2;
  var rotationYInDegrees = 269.8;
  var rotationZInDegrees = 0;

  // Convert rotation from degrees to radians
  trailNode.rotation.x = BABYLON.Tools.ToRadians(rotationXInDegrees);
  trailNode.rotation.y = BABYLON.Tools.ToRadians(rotationYInDegrees);
  trailNode.rotation.z = BABYLON.Tools.ToRadians(rotationZInDegrees);

  // Set scale
  trailNode.scaling = new BABYLON.Vector3(1, 0.2, 1);

  // Can also rotate trailNode for cool effects!
  // can use rotate z for hand casting animation!

  const trail = new BABYLON.TrailMesh("SwordTrail", trailNode, scene, diameter, segments, true);
  trail.diameter = diameter;
  trail.material = fireTrailShader;
  trail.alphaIndex = 0; // Set beside fire shader
  trail.isPickable = false;
  // trail.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  // trail.scaling.scaleInPlace(1, 1, 1);

  var offset = new BABYLON.Vector3(0, 2, 0);

  const parentMesh = objectToAttach;
  // Function to apply local transformation
  function applyLocalTransformation(mesh, offset) {
    // Transform the offset into the parent mesh's local space
    var worldMatrix = mesh.getWorldMatrix();
    var localOffset = BABYLON.Vector3.TransformCoordinates(offset, worldMatrix);
    return localOffset;
  }
  // Update the trail mesh position with the offset
  let time = 0;
  scene.registerBeforeRender(() => {
    time += engine.getDeltaTime() * 0.001;
    fireTrailShader.setFloat("time", time);

    // var localOffset = applyLocalTransformation(parentMesh, offset);
    // trail.position = parentMesh.position.add(localOffset);
    // trail.rotationQuaternion = parentMesh.rotationQuaternion ? parentMesh.rotationQuaternion.clone() : BABYLON.Quaternion.Identity();
    // trail.update();
  });

  // trail.rotation.y = Math.PI / 4; // 45 degrees
}

function saveDepthMap(scene, engine) {
  var depthRenderer = scene.enableDepthRenderer();
  if (!depthRenderer) {
    console.error("Failed to enable depth renderer.");
    return;
  }

  var depthTexture = depthRenderer.getDepthMap();
  if (!depthTexture) {
    console.error("Failed to get depth map.");
    return;
  }

  console.log(depthTexture);
  saveDepthTextureToFile(depthTexture, "depth.jpg", scene);

  if (!engine) {
    console.error("Failed to get engine from scene.");
    return;
  }

  var width = depthTexture.getSize().width;
  var height = depthTexture.getSize().height;

  var internalTexture = depthTexture.getInternalTexture();
  if (!internalTexture) {
    console.error("Failed to get internal texture from depth map.");
    return;
  }

  var pixels = new Uint8Array(width * height * 4);

  try {
    engine.bindFramebuffer(internalTexture);
  } catch (error) {
    console.error("Failed to bind framebuffer:", error);
    return;
  }

  // Check if framebuffer binding is successful
  if (!engine._currentFramebuffer) {
    console.error("Failed to bind framebuffer.");
    engine.unBindFramebuffer(internalTexture);
    return;
  }

  try {
    engine.readPixels(0, 0, width, height, pixels);
  } catch (error) {
    console.error("Error reading pixels:", error);
    engine.unBindFramebuffer(internalTexture);
    return;
  }

  engine.unBindFramebuffer(internalTexture);

  // Create a canvas to convert the pixels to an image
  var canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  var context = canvas.getContext("2d");
  var imageData = context.createImageData(width, height);

  // Copy pixel data to the ImageData object
  for (var i = 0; i < pixels.length; i++) {
    imageData.data[i] = pixels[i];
  }

  context.putImageData(imageData, 0, 0);

  // Convert the canvas to a data URL
  var dataURL = canvas.toDataURL();

  // Trigger a download of the data URL
  var link = document.createElement("a");
  link.href = dataURL;
  link.download = "depthMap.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

  grassThinShader.setColor3("color1", new BABYLON.Color3(0.0, 0.6, 0.4)); // Yellow
  grassThinShader.setColor3("color2", new BABYLON.Color3(0.0, 0.2, 0.2)); // Orange
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
    const blendFactor = (Math.sin(time * 0.1) + 1) * 0.5; // Creates a 0-1 loop
    grassThinShader.setFloat("colorBlendFactor", blendFactor);
  });

  let debug = false;
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

    const lightraysToPlace = 6;
    const minX = -30;

    const maxX = 30;
    const minZ = 0;
    const maxZ = 60;
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

function addNewFog(scene, engine) {
  const vertexShader = `
    precision highp float;

    // Attributes
    attribute vec3 position;
    attribute vec2 uv;

    // Uniforms
    uniform mat4 world;
    uniform mat4 worldViewProjection;

    // Varyings
    varying vec3 vPosition;
    varying vec2 vUV;

    void main() {
        vec4 worldPosition = world * vec4(position, 1.0);
        gl_Position = worldViewProjection * worldPosition;
        vPosition = worldPosition.xyz;
        vUV = uv;
    }
`;

  const fragmentShader = `
    precision highp float;

    // Varyings
    varying vec3 vPosition;
    varying vec2 vUV;

    // Uniforms
    uniform vec3 cameraPosition;
    uniform float time;
    uniform float density;
    uniform vec3 fogColor;

    float noise(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 128.852))) * 43758.5453);
    }

    void main() {
        float dist = length(vPosition - cameraPosition);
        float fogFactor = exp(-density * dist * dist);

        vec3 fogNoise = vec3(noise(vPosition + vec3(time * 0.1)));
        vec3 color = mix(fogNoise, fogColor, fogFactor);

        gl_FragColor = vec4(color, fogFactor);
    }
`;
  const fogMaterial = new BABYLON.ShaderMaterial(
    "fogMaterial",
    scene,
    {
      vertexSource: vertexShader,
      fragmentSource: fragmentShader,
    },
    {
      attributes: ["position", "uv"],
      uniforms: ["world", "worldView", "worldViewProjection", "cameraPosition", "time", "density", "fogColor"],
    }
  );

  // Set initial uniform values
  const fogParams = {
    density: 0.0005, // Adjusted for subtle fog
    fogColor: [0.7, 0.8, 1.0], // Light blue fog
    boxSize: 500, // Larger size to cover the scene
    positionY: 50,
    positionX: 0, // Centered on X-axis
  };

  fogMaterial.setFloat("density", fogParams.density);
  fogMaterial.setVector3("fogColor", new BABYLON.Color3(...fogParams.fogColor));
  fogMaterial.setFloat("time", 0.0);
  fogMaterial.setVector3("cameraPosition", scene.activeCamera.position);
  fogMaterial.backFaceCulling = false;
  fogMaterial.alpha = 1.0;
  fogMaterial.needDepthPrePass = true;
  fogMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;

  // Create a large transparent box to encompass the scene
  const fogBox = BABYLON.MeshBuilder.CreateBox("fogBox", { size: fogParams.boxSize }, scene);
  fogBox.position.y = fogParams.positionY;
  fogBox.position.x = fogParams.positionX;
  fogBox.material = fogMaterial;
  fogBox.isPickable = false; // Prevent the fog from interfering with raycasts

  // Enable alpha blending for the fog
  fogMaterial.alpha = 0.5;
  fogMaterial.needDepthPrePass = true;
  fogMaterial.backFaceCulling = false; // Render both sides
  fogMaterial.disableDepthWrite = true; // Fog should not write to depth

  // Update Time and Camera Position Uniforms in the Render Loop
  engine.runRenderLoop(() => {
    const currentTime = performance.now() * 0.001;
    fogMaterial.setFloat("time", currentTime);
    fogMaterial.setVector3("cameraPosition", scene.activeCamera.position);
    scene.render();
  });

  // Add GUI controls
  BABYLON.Tools.LoadScriptAsync("https://cdn.jsdelivr.net/npm/lil-gui@0.17.0/dist/lil-gui.umd.min.js").then(() => {
    const gui = new lil.GUI({ title: "Fog Controls" });

    gui
      .add(fogParams, "density", 0, 0.005, 0.0001)
      .name("Density")
      .onChange((value) => {
        fogMaterial.setFloat("density", value);
      });

    gui
      .addColor(fogParams, "fogColor")
      .name("Fog Color")
      .onChange((value) => {
        fogMaterial.setVector3("fogColor", new BABYLON.Color3(value[0] / 255, value[1] / 255, value[2] / 255));
      });

    gui
      .add(fogParams, "boxSize", 100, 1000, 10)
      .name("Box Size")
      .onChange((value) => {
        fogBox.scaling = new BABYLON.Vector3(value / 10, value / 10, value / 10);
      });

    gui
      .add(fogParams, "positionY", 0, 100, 1)
      .name("Position Y")
      .onChange((value) => {
        fogBox.position.y = value;
      });

    gui
      .add(fogParams, "positionX", -500, 500, 1)
      .name("Position X")
      .onChange((value) => {
        fogBox.position.x = value;
      });
  });
}

function addPostFog(scene, engine, camera) {
  const fogPostProcess = new BABYLON.PostProcess("Fog", "customFog", ["time", "fogColor"], null, 1.0, camera);

  // Shader for Post-process
  fogPostProcess.onApply = (effect) => {
    effect.setFloat("time", performance.now() * 0.001);
    effect.setColor3("fogColor", new BABYLON.Color3(0.7, 0.8, 1.0));
  };

  // Fog Fragment Shader
  fogPostProcess.fragmentUrl = `
    precision highp float;

    uniform float time;
    uniform vec3 fogColor;

    varying vec2 vUV;

    void main() {
        float fogFactor = exp(-pow(vUV.y + sin(time) * 0.1, 2.0));
        gl_FragColor = vec4(mix(vec3(1.0), fogColor, fogFactor), 1.0);
    }
`;
}

function createFireballVFX(scene) {
  // Modify createFireballShader to include the new uniforms
  const createFireballShader = () => {
    BABYLON.Effect.ShadersStore["fireballVertexShader"] = `
                precision highp float;
                attribute vec3 position;
                attribute vec2 uv;
                attribute vec3 normal;

                uniform mat4 world;
                uniform mat4 worldViewProjection;
                
                varying vec3 vPositionW;
                varying vec3 vNormalW;
                varying vec2 vUV;

                void main() {
                    vec4 outPosition = worldViewProjection * vec4(position, 1.0);
                    gl_Position = outPosition;
                    
                    vPositionW = vec3(world * vec4(position, 1.0));
                    vNormalW = normalize(vec3(world * vec4(normal, 0.0)));
                    vUV = uv;
                }
            `;

    return new BABYLON.ShaderMaterial(
      "fireballMaterial",
      scene,
      {
        vertex: "fireball",
        fragment: "fireball",
      },
      {
        attributes: ["position", "normal", "uv"],
        uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "time", "cameraPosition", "primaryColor", "secondaryColor", "noiseParams", "glowParams"],
      }
    );
  };
  const offsetAngle = 0;
  const params = {
    primary: {
      r: 1,
      g: 0.3,
      b: 0,
    },
    secondary: {
      r: 1,
      g: 0.7,
      b: 0.2,
    },
    noise: {
      scale1: 5,
      scale2: 8,
      speed1: 0.5,
      speed2: 0.7,
    },
    glow: {
      intensity: 1,
      power: 1,
    },
  };

  // Add these shader definitions
  BABYLON.Effect.ShadersStore["fireballVertexShader"] = `
                      precision highp float;
                      attribute vec3 position;
                      attribute vec2 uv;
                      attribute vec3 normal;
      
                      uniform mat4 world;
                      uniform mat4 worldViewProjection;
                      
                      varying vec3 vPositionW;
                      varying vec3 vNormalW;
                      varying vec2 vUV;
      
                      void main() {
                          vec4 outPosition = worldViewProjection * vec4(position, 1.0);
                          gl_Position = outPosition;
                          
                          vPositionW = vec3(world * vec4(position, 1.0));
                          vNormalW = normalize(vec3(world * vec4(normal, 0.0)));
                          vUV = uv;
                      }
                  `;

  BABYLON.Effect.ShadersStore["fireballFragmentShader"] = `
                  precision highp float;
      
                  uniform vec3 cameraPosition;
                  uniform float time;
                  uniform vec3 primaryColor;
                  uniform vec3 secondaryColor;
                  uniform vec4 noiseParams;  // x: scale1, y: scale2, z: speed1, w: speed2
                  uniform vec2 glowParams;   // x: intensity, y: power
                  
                  varying vec3 vPositionW;
                  varying vec3 vNormalW;
                  varying vec2 vUV;
      
                  // Simplex noise function
                  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      
                  float snoise(vec3 v) {
                      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      
                      vec3 i  = floor(v + dot(v, C.yyy));
                      vec3 x0 = v - i + dot(i, C.xxx);
      
                      vec3 g = step(x0.yzx, x0.xyz);
                      vec3 l = 1.0 - g;
                      vec3 i1 = min(g.xyz, l.zxy);
                      vec3 i2 = max(g.xyz, l.zxy);
      
                      vec3 x1 = x0 - i1 + C.xxx;
                      vec3 x2 = x0 - i2 + C.yyy;
                      vec3 x3 = x0 - D.yyy;
      
                      i = mod289(i);
                      vec4 p = permute(permute(permute(
                          i.z + vec4(0.0, i1.z, i2.z, 1.0))
                          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      
                      float n_ = 0.142857142857;
                      vec3 ns = n_ * D.wyz - D.xzx;
      
                      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      
                      vec4 x_ = floor(j * ns.z);
                      vec4 y_ = floor(j - 7.0 * x_);
      
                      vec4 x = x_ *ns.x + ns.yyyy;
                      vec4 y = y_ *ns.x + ns.yyyy;
                      vec4 h = 1.0 - abs(x) - abs(y);
      
                      vec4 b0 = vec4(x.xy, y.xy);
                      vec4 b1 = vec4(x.zw, y.zw);
      
                      vec4 s0 = floor(b0)*2.0 + 1.0;
                      vec4 s1 = floor(b1)*2.0 + 1.0;
                      vec4 sh = -step(h, vec4(0.0));
      
                      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      
                      vec3 p0 = vec3(a0.xy, h.x);
                      vec3 p1 = vec3(a0.zw, h.y);
                      vec3 p2 = vec3(a1.xy, h.z);
                      vec3 p3 = vec3(a1.zw, h.w);
      
                      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                      p0 *= norm.x;
                      p1 *= norm.y;
                      p2 *= norm.z;
                      p3 *= norm.w;
      
                      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                      m = m * m;
                      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
                  }
      
                  void main() {
                      vec3 viewDirectionW = normalize(cameraPosition - vPositionW);
                      float fresnelTerm = dot(viewDirectionW, vNormalW);
                      fresnelTerm = clamp(1.0 - fresnelTerm, 0., 1.);
      
                      // Animated noise with parameters
                      float noise1 = snoise(vec3(vUV * noiseParams.x, time * noiseParams.z)) * 0.5 + 0.5;
                      float noise2 = snoise(vec3(vUV * noiseParams.y, time * noiseParams.w + 1000.0)) * 0.5 + 0.5;
                      
                      // Update color mixing to use primary/secondary colors
                      vec3 finalColor = mix(primaryColor, secondaryColor, fresnelTerm * noise1);
                      finalColor += noise2 * 0.3;
                      
                      // Update glow color to use secondary color
                      float glow = pow(fresnelTerm, glowParams.y) * (noise1 * 0.5 + 0.5) * glowParams.x;
                      finalColor += glow * secondaryColor;
      
                      gl_FragColor = vec4(finalColor, 1.0);
                  }
              `;

  const fireballMaterial2 = new BABYLON.ShaderMaterial(
    "fireballMaterial",
    scene,
    {
      vertex: "fireball",
      fragment: "fireball",
    },
    {
      attributes: ["position", "normal", "uv"],
      uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "time", "cameraPosition", "primaryColor", "secondaryColor", "noiseParams", "glowParams"],
    }
  );

  const fireballParent = new BABYLON.TransformNode("fireballParent", scene);
  fireballParent.position.y = 40;
  fireballParent.position.x = -30;

  const fireballCore = BABYLON.MeshBuilder.CreateSphere(
    "fireballCore",
    {
      diameter: 1, //make editable
      segments: 32,
    },
    scene
  );
  fireballCore.parent = fireballParent;
  fireballCore.material = fireballMaterial2;

  // Add trail system
  const trail = new BABYLON.TrailMesh("trail", fireballCore, scene, 0.4, 200, true);
  const trailMaterial = new BABYLON.StandardMaterial("trailMat", scene);
  trailMaterial.emissiveColor = new BABYLON.Color3(1, 0.3, 0);
  trailMaterial.diffuseColor = new BABYLON.Color3(1, 0.3, 0);
  trailMaterial.alpha = 0.9;
  trailMaterial.alphaMode = BABYLON.Engine.ALPHA_ADD;
  trailMaterial.backFaceCulling = false;

  // Configure texture
  const trailTexture = new BABYLON.Texture("/assets/textures/effects/spell.png", scene);
  trailTexture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
  trailTexture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
  trailTexture.uScale = 0.35;
  trailTexture.vScale = 0.9;

  trailMaterial.diffuseTexture = trailTexture;
  trailMaterial.opacityTexture = trailTexture;
  trailMaterial.useAlphaFromDiffuseTexture = true;

  trail.material = trailMaterial;

  // Add UV animation to the render loop
  let textureOffset = 0;
  scene.registerBeforeRender(() => {
    textureOffset += 0.005; // Adjust speed here
    trailTexture.vOffset = textureOffset;
  });

  // Create and setup shader material
  const fireballMaterial = createFireballShader();
  fireballMaterial.setVector3("cameraPosition", scene.activeCamera.position);
  fireballMaterial.setVector3("primaryColor", new BABYLON.Vector3(params.primary.r, params.primary.g, params.primary.b));
  fireballMaterial.setVector3("secondaryColor", new BABYLON.Vector3(params.secondary.r, params.secondary.g, params.secondary.b));
  fireballMaterial.setVector4("noiseParams", new BABYLON.Vector4(params.noise.scale1, params.noise.scale2, params.noise.speed1, params.noise.speed2));
  fireballMaterial.setVector2("glowParams", new BABYLON.Vector2(params.glow.intensity, params.glow.power));

  // Add time animator
  let time = 0;
  scene.registerBeforeRender(() => {
    time += scene.getEngine().getDeltaTime() / 1000;
    fireballMaterial.setFloat("time", time);
    fireballMaterial.setVector3("cameraPosition", scene.activeCamera.position);
  });

  fireballCore.material = fireballMaterial;

  // Particle system with optimized settings
  const fireSystem = new BABYLON.ParticleSystem("fireParticles", 1000, scene);
  fireSystem.particleTexture = new BABYLON.Texture("/assets/textures/effects/flare.png", scene);

  fireSystem.emitter = fireballCore;
  fireSystem.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.2);
  fireSystem.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2);

  fireSystem.color1 = new BABYLON.Color4(1, 0.5, 0, 1);
  fireSystem.color2 = new BABYLON.Color4(1, 0.3, 0, 1);
  fireSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);

  fireSystem.minSize = 0.1;
  fireSystem.maxSize = 1.0;
  fireSystem.minLifeTime = 0.9;
  fireSystem.maxLifeTime = 4.9;
  fireSystem.emitRate = 70; // Reduced for better performance

  fireSystem.direction1 = new BABYLON.Vector3(-1, 0, -1);
  fireSystem.direction2 = new BABYLON.Vector3(1, 0, 1);
  fireSystem.minAngularSpeed = 0;
  fireSystem.maxAngularSpeed = Math.PI;
  fireSystem.minEmitPower = 0.1;
  fireSystem.maxEmitPower = 1;
  fireSystem.updateSpeed = 0.1;

  fireSystem.start();

  // Optimized animations using fewer keyframes
  const spinningAnimation = new BABYLON.Animation("spinningAnimation", "rotation.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

  const keys = [
    { frame: 0, value: 0 },
    { frame: 30, value: 2 * Math.PI },
  ];
  spinningAnimation.setKeys(keys);

  const circleAnimation = new BABYLON.Animation("circleAnimation", "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

  const radius = 10;
  const circleKeys = [];
  // Slower animation with same number of keyframes but spread over more frames
  for (let i = 0; i <= 15; i++) {
    const angle = (i / 15) * 2 * Math.PI + offsetAngle;
    circleKeys.push({
      frame: i * 8, // Changed from i * 2 to i * 8 for slower movement
      value: new BABYLON.Vector3(radius * Math.cos(angle), 2, radius * Math.sin(angle)),
    });
  }
  circleAnimation.setKeys(circleKeys);

  fireballParent.animations = [spinningAnimation, circleAnimation];
  scene.beginAnimation(fireballParent, 0, 120, true); // Changed from 30 to 120 frames for full rotation

  //   return {
  //       parent: fireballParent,
  //       core: fireballCore,
  //       particleSystem: fireSystem,
  //       trail: trail,
  //       dispose: () => {
  //           fireSystem.dispose();
  //           trail.dispose();
  //           fireballCore.dispose();
  //           fireballParent.dispose();
  //       }
  //   };

  return {
    core: fireballCore,
    particleSystem: fireSystem,
    trail: trail,
  };
}

// Move to zone text util
function makeFadeable(mat, initial = 1) {
  // private backing store
  mat._fade = initial;
  mat.setFloat("uOpacity", initial);

  Object.defineProperty(mat, "fade", {
    get() {
      return this._fade;
    },
    set(v) {
      this._fade = v; // cache
      this.setFloat("uOpacity", v);
    }, // push to GPU
  });
}

async function createZoneText(zoneName, scene) {
  const fontJson = await fetch("/lib/MSDF-Text/fontAssets/abel-regular.json").then((r) => r.json());
  const pngUrl = "/lib/MSDF-Text/fontAssets/abel-regular.png";

  const mesh = createMSDFTextMesh(
    "zoneText",
    {
      text: zoneName,
      font: fontJson,
      atlas: pngUrl,
      width: 1200,
      align: "center",
      color: new BABYLON.Color3(0.8, 1, 1), // White text
      strokeColor: new BABYLON.Color3(0.8, 1, 1),
      strokeWidth: 0.0,
    },
    scene
  );

  // mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
  // Create a parent mesh to control positioning and scaling
  // const parentMesh = new BABYLON.Mesh("zoneTextParent", scene);
  // parentMesh.position = new BABYLON.Vector3(scene.activeCamera.position.x - 480, scene.activeCamera.position.y - 90, scene.activeCamera.position.z + 2);
  // parentMesh.isPickable = false;

  // // Parent the text mesh to the parent mesh
  // mesh.parent = parentMesh;
  // mesh.position = BABYLON.Vector3.Zero(); // Reset position relative to parent
  mesh.scaling = new BABYLON.Vector3(1, 1, 1);
  mesh.isPickable = false;

  const mat = mesh.material;
  makeFadeable(mat, 0); // Start fully transparent

  // Parent to camera and position relative to it
  mesh.position = new BABYLON.Vector3(scene.activeCamera.position.x - 480, scene.activeCamera.position.y - 100, scene.activeCamera.position.z + 2); // Adjust these values to position the text

  // mesh.parent = scene.activeCamera;

  // Create animation group
  let animationGroup = new BABYLON.AnimationGroup("zoneTextAnimation", scene);

  // Fade in animation
  var fadeInAnimation = new BABYLON.Animation("fadeIn", "fade", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

  const keys = [];
  keys.push({ frame: 0, value: 0 }); // Start transparent
  keys.push({ frame: 250, value: 0.5 }); // Fade in
  keys.push({ frame: 250, value: 0.5 }); // Stay visible
  keys.push({ frame: 650, value: 0 }); // Fade out
  fadeInAnimation.setKeys(keys);

  // Add easing function for smooth fade
  const easingFunction = new BABYLON.CubicEase();
  easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
  fadeInAnimation.setEasingFunction(easingFunction);

  animationGroup.addTargetedAnimation(fadeInAnimation, mat);

  // Clean up after animation
  animationGroup.onAnimationEndObservable.add(() => {
    // mesh.dispose();
  });

  // Play once and stop after 4 seconds

  // Set a timeout to dispose the mesh after animation completes
  setTimeout(() => {
    animationGroup.play(false);
  }, 8000);

  return mesh;
}
