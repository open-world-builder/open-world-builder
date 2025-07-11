import { loadHeroModel } from "../../character/hero.js";
import { setupCamera } from "../../utils/camera.js";
import { setupPhysics } from "../../utils/physics.js";
import { setupInputHandling } from "../../movement.js";
import { setupAnim } from "../../utils/anim.js";
import { loadingAnim } from "../../utils/loadingAnim.js";
import { setupSSAO } from "../../utils/ssao.js";
import { loadModels } from "../../utils/load.js";
import { InteriorEditor } from "../../utils/InteriorEditor.js";

import { Health } from "../../character/health.js";

export async function createInteriorBuilder(engine) {
  const scene = new BABYLON.Scene(engine);

  const spawnPoint = new BABYLON.Vector3(0, 20, 20);
  const { character, dummyAggregate } = await setupPhysics(scene, spawnPoint);

  const camera = setupCamera(scene, character, engine);
  camera.collisionRadius = new BABYLON.Vector3(12.5, 12.5, 12.5);
  // load all models, make sure parallel loading for speed
  const modelUrls = ["env/interior/inn/inn_map_procedural.glb", "util/atmosphere/lightrays/lightrays.glb"];
  const heroModelPromise = loadHeroModel(scene, character);
  const [heroModel, models] = await Promise.all([heroModelPromise, loadModels(scene, modelUrls)]);
  const { hero, skeleton } = heroModel;

  let anim = setupAnim(scene, skeleton);
  setupInputHandling(scene, character, camera, hero, anim, engine, dummyAggregate);
  character.health = new Health("Hero", 100, dummyAggregate);
  character.health.rotationCheck = hero;
  character.health.rangeCheck = character;
  PLAYER = character;

  setupEnvironment(scene);

  // let sword = addSword(scene, models["Sword2"]);
  // createTrail(scene, engine, sword, 0.2, 40, new BABYLON.Vector3(0, 0, 0.32));

  //   let meshes = addRoomMap(scene, models);
  hero.getChildMeshes().forEach((value) => {
    // meshes.push(value);
  });
  // console.log(hero.getChildMeshes());

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

  const interiorEditor = new InteriorEditor(scene, camera);
  loadingAnim(scene);
  setupSSAO(scene, camera);
  return scene;
}

function addRoomMap(scene, models) {
  let meshes = [];
  let town_map = models["inn_map_procedural"];
  // let town_map = models["inn_map_procedural_individual"];
  town_map.name = "inn map";
  town_map.position.y = 10;

  town_map.scaling = new BABYLON.Vector3(5, 5, 5);

  town_map.getChildMeshes().forEach((mesh) => {
    mesh.material.metallic = 0;
    mesh.receiveShadows = true;
    // set levels
    meshes.push(mesh);

    let town_mapCollision = new BABYLON.PhysicsAggregate(mesh, BABYLON.PhysicsShapeType.MESH, { mass: 0, restitution: 0.0, friction: 1.0 }, scene);
  });

  scene.physicsEnabled = true;

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
  // scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
  const pipeline = new BABYLON.DefaultRenderingPipeline(
    "default", // The name of the pipeline
    true, // Do you want HDR textures?
    scene, // The scene linked to
    [camera] // The list of cameras to be attached to
  );

  // Configure effects
  pipeline.samples = 4; // MSAA anti-aliasing
  pipeline.fxaaEnabled = true; // Enable FXAA

  pipeline.bloomEnabled = true; // Enable bloom
  pipeline.bloomThreshold = 1.85; //only affect sun not clouds

  const imgProc = pipeline.imageProcessing;

  // Apply contrast and exposure adjustments
  imgProc.contrast = 2.0;
  imgProc.exposure = 1.8;

  // Enable tone mapping
  // imgProc.toneMappingEnabled = true;
  // imgProc.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;

  // Apply vignette effect
  imgProc.vignetteEnabled = true;
  imgProc.vignetteWeight = 2.6;
  imgProc.vignetteColor = new BABYLON.Color4(0, 0, 0, 1);
  imgProc.vignetteBlendMode = BABYLON.ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY;
  //     var sharpen = new BABYLON.SharpenPostProcess("sharpen", 1.0, camera);
  // sharpen.edgeAmount = 0.15;  // Increase or decrease for more or less sharpening
  // sharpen.colorAmount = 1.0;

  pipeline.bloomThreshold = 0.005; //only affect sun not clouds
  pipeline.bloomThreshold = 0.005; //only affect sun not clouds
  pipeline.bloomWeight = 0.9;
  pipeline.bloomWeight = 0.3;

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

  let debug = false;
  if (debug) {
    // Create and style a container div for Tweakpane
    const container = document.createElement("div");
    container.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    cursor: move;
    user-select: none;
  `;
    document.body.appendChild(container);

    // Create Tweakpane inside the container
    const pane = new Tweakpane.Pane({
      title: "Post Processing",
      expanded: true,
      container: container,
    });

    // Make the panel draggable
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    container.addEventListener("mousedown", dragStart);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);

    function dragStart(e) {
      if (e.target.classList.contains("tp-rotv_t")) {
        // Only drag from title bar
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        isDragging = true;
      }
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;

        container.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    }

    function dragEnd() {
      isDragging = false;
    }

    // Rest of your Tweakpane setup code...
    const PARAMS = {
      lutIndex: 0,
      intensity: 1.0,
    };

    const lutFolder = pane.addFolder({
      title: "Color Correction",
    });

    lutFolder
      .addInput(PARAMS, "lutIndex", {
        label: "LUT Image",
        options: lutImages.map((path, index) => ({
          text: path.split("/").pop(),
          value: index,
        })),
      })
      .on("change", ({ value }) => {
        colorCorrection.dispose();
        colorCorrection = new BABYLON.ColorCorrectionPostProcess("color_correction", lutImages[value], PARAMS.intensity, camera);
      });

    lutFolder
      .addInput(PARAMS, "intensity", {
        label: "Intensity",
        min: 0,
        max: 1,
        step: 0.1,
      })
      .on("change", ({ value }) => {
        colorCorrection.intensity = value;
      });
  }
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
