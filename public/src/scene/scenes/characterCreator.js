// Constants for available classes and backgrounds
const CHARACTER_CLASSES = {
  WARRIOR: {
    name: "Warrior",
    modelPath: "/assets/env/objects/barrel/barrel_breakable.glb",
  },
  MAGE: {
    name: "Mage",
    modelPath: "/assets/characters/mage/mage.glb",
  },
  ROGUE: {
    name: "Rogue",
    modelPath: "/assets/characters/rogue/rogue.glb",
  },
};

const CHARACTER_BACKGROUNDS = {
  Descendant: {
    name: "Descendant of a Minor God-King",
    backgroundImage: "/assets/util/screenshots/backgrounds/mountains.jpg",
    description: "Hardened by years of military service",
    heroModel: [1],
    weather: "rain",
  },
  Acolyte: {
    name: "Acolyte of the Veiled Monastery",
    backgroundImage: "/assets/util/screenshots/backgrounds/tree_bg.jpg",
    description: "Born into privilege and trained in the arts of leadership",
    heroModel: [0],
    weather: "rain",
  },

  Citizen: {
    name: "Citizen of the Crescent City-States",
    backgroundImage: "/assets/util/screenshots/backgrounds/crescent cities.jpg",
    description: "Survived by wit and guile in the urban underbelly",
    heroModel: [2],
    weather: "light",
  },
  STREET_RAT: {
    name: "Escaped Slave of Tidemarch",
    backgroundImage: "/assets/util/screenshots/backgrounds/coast.jpg",
    description: "Survived by wit and guile in the urban underbelly",
    heroModel: [3],
    weather: "light",
  },
};

export class CharacterData {
  constructor() {
    this.class = null;
    this.background = null;
    this.name = "";
    this.stats = new CharacterStats();
    // Add other character attributes as needed
  }
}

export class CharacterStats {
  constructor() {
    this.health = 100;
    this.mana = 100;
    this.strength = 10;
    this.agility = 10;
  }
}

export class CharacterViewer {
  constructor(scene, characterData, camera) {
    this.scene = scene;
    this.currentModel = PLAYER;
    this.characterData = characterData;
    this.background = null;
    // this.backgroundPlane = BABYLON.MeshBuilder.CreatePlane("backgroundPlane", { size: 1000.0 }, this.scene);
    this.backgroundPlane = BABYLON.MeshBuilder.CreatePlane("backgroundPlane", { width: 260.0, height: 140.0 }, this.scene);
    this.backgroundPlane.position.z = -100;
    this.backgroundPlane.position.y = 5;
    this.backgroundPlane.position.x = -15;
    this.backgroundPlane.material = new BABYLON.StandardMaterial("backgroundPlane", this.scene);
    this.backgroundPlane.material.backFaceCulling = false;
    this.backgroundPlane.isPickable = false;
    const bgImage = CHARACTER_BACKGROUNDS["Acolyte"].backgroundImage;

    this.pipeline = new BABYLON.DefaultRenderingPipeline(
      "default", // The name of the pipeline
      true, // Do you want HDR textures?
      this.scene, // The scene linked to
      [camera] // The list of cameras to be attached to
    );

    // Configure effects
    this.pipeline.samples = 4; // MSAA anti-aliasing
    this.pipeline.fxaaEnabled = false; // Enable FXAA

    this.pipeline.bloomEnabled = true; // Enable bloom
    this.pipeline.bloomThreshold = 1.85; //only affect sun not clouds

    this.imgProc = this.pipeline.imageProcessing;

    // Apply contrast and exposure adjustments
    this.imgProc.contrast = 1.9;
    this.imgProc.exposure = 1.8;

    // Update scene background
    this.backgroundPlane.material.diffuseTexture = new BABYLON.Texture(bgImage, this.scene);

    Object.keys(CHARACTER_BACKGROUNDS).forEach((bgKey) => {
      const bgTexture = CHARACTER_BACKGROUNDS[bgKey].backgroundImage;
      CHARACTER_BACKGROUNDS[bgKey].bgTexture = new BABYLON.Texture(bgTexture, this.scene);
      CHARACTER_BACKGROUNDS[bgKey].bgTexture.uScale = -1;
    });

    let isDragging = false;
    let previousX = 0;

    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        isDragging = true;
        previousX = pointerInfo.event.clientX;
      } else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
        isDragging = false;
      } else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE && isDragging && this.currentModel) {
        const deltaX = pointerInfo.event.clientX - previousX;

        // Create a rotation quaternion around the Y axis
        const rotationQuaternion = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, -deltaX * 0.008);

        // Multiply the current rotation by the new rotation
        this.currentModel.rotationQuaternion = this.currentModel.rotationQuaternion.multiply(rotationQuaternion);

        previousX = pointerInfo.event.clientX;
      }
    });
  }

  async loadCharacterModel() {
    const modelIndex = CHARACTER_BACKGROUNDS[this.characterData.background].heroModel[0];
    const model = this.scene.getMeshByName(`dummyPhysicsRoot`);
    model.getChildMeshes().forEach((mesh) => {
      mesh.setEnabled(false);
    });
    model.getChildMeshes()[modelIndex].setEnabled(true);

    // if (this.currentModel) {
    //   this.currentModel.dispose();
    // }

    // if (this.characterData.class) {
    //   const modelPath = CHARACTER_CLASSES[this.characterData.class].modelPath;
    //   // Load the character model using BABYLON's ImportMeshAsync
    //   const result = await BABYLON.SceneLoader.ImportMeshAsync(null, modelPath, this.scene);
    //   this.currentModel = result.meshes[0];
    // }
  }

  setBackground() {
    if (this.characterData.background) {
      console.log(CHARACTER_BACKGROUNDS[this.characterData.background].weather);
      if (CHARACTER_BACKGROUNDS[this.characterData.background].weather === "light") {
        LIGHTRAYS.show();
        console.log("show");
        RAIN_SYSTEM.systems.forEach((system) => {
          system.stop();
        });
      } else {
        LIGHTRAYS.hide();
        RAIN_SYSTEM.systems.forEach((system) => {
          system.start();
        });
      }

      //   const bgImage = CHARACTER_BACKGROUNDS[this.characterData.background].backgroundImage;
      this.backgroundPlane.material.diffuseTexture = CHARACTER_BACKGROUNDS[this.characterData.background].bgTexture;
      // Update scene background
      //   this.backgroundPlane.material.diffuseTexture = bgTexture;
    }
  }

  update() {
    this.loadCharacterModel();
    this.setBackground();
  }
}

export class CharacterCreatorUI {
  constructor(characterData, onUpdate) {
    this.characterData = characterData;
    this.onUpdate = onUpdate;
    this.container = null;
  }

  createUI() {
    // Create main container
    this.container = document.createElement("div");
    this.container.className = "character-creator";
    this.container.style.cssText = `
      position: absolute;
      left: 20px;
      top: 20px;
    //   background: rgba(0, 0, 0, 0.8);
      padding: 20px;
      border-radius: 8px;
      color: white;
      width: 300px;
    `;

    // Add class selection
    // this.addClassSelection();

    // Add background selection
    this.addBackgroundSelection();

    // Add name input
    this.addNameInput();
    this.addPlayButton();

    document.body.appendChild(this.container);
  }

  addClassSelection() {
    const classContainer = document.createElement("div");
    classContainer.className = "selection-container";

    const label = document.createElement("h3");
    label.textContent = "Class";
    classContainer.appendChild(label);

    Object.keys(CHARACTER_CLASSES).forEach((classKey) => {
      const btn = document.createElement("button");
      btn.textContent = CHARACTER_CLASSES[classKey].name;
      btn.onclick = () => {
        this.characterData.class = classKey;
        this.onUpdate();
      };
      classContainer.appendChild(btn);
    });

    this.container.appendChild(classContainer);
  }

  addBackgroundSelection() {
    const bgContainer = document.createElement("div");
    bgContainer.className = "selection-container";

    const label = document.createElement("h3");
    label.textContent = "Background";
    bgContainer.appendChild(label);

    Object.keys(CHARACTER_BACKGROUNDS).forEach((bgKey) => {
      const btn = document.createElement("button");
      btn.textContent = CHARACTER_BACKGROUNDS[bgKey].name;
      btn.onclick = () => {
        this.characterData.background = bgKey;
        this.onUpdate();
      };
      bgContainer.appendChild(btn);
    });

    this.container.appendChild(bgContainer);
  }

  addNameInput() {
    const nameContainer = document.createElement("div");
    nameContainer.className = "input-container";

    const label = document.createElement("h3");
    label.textContent = "Character Name";
    nameContainer.appendChild(label);

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter character name";
    input.onchange = (e) => {
      this.characterData.name = e.target.value;
      this.onUpdate();
    };
    nameContainer.appendChild(input);

    document.body.appendChild(nameContainer);
  }
  addPlayButton() {
    const playButton = document.createElement("button");
    playButton.className = "play-button";
    playButton.innerHTML = `
      <div class="play-button-content">
        <span>Play</span>
      </div>
    `;
    playButton.onclick = () => {
      // Handle play button click
      localStorage.setItem("characterData", JSON.stringify(this.characterData));
      window.location.href = "/"; // + this.characterData.background;
      console.log("Play clicked");
    };
    document.body.appendChild(playButton);
  }

  dispose() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

import { setupCamera } from "../../utils/camera.js";
import { setupPhysics } from "../../utils/physics.js";
import { setupAnimVibe } from "../../utils/anim.js";
import { Health } from "../../character/health.js";
import { setupInputHandling } from "/src/movement.js";
import { loadHeroModelVibe } from "/src/character/hero.js";
import { loadModels } from "../../utils/load.js";
// Main scene creation function
export async function createCharacterCreator(engine) {
  const scene = new BABYLON.Scene(engine);

  // Setup basic scene environment
  //   setupEnvironment(scene);

  const camera = await setupCharacter(scene, engine);

  // Create lights
  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  // Initialize character data and systems
  const characterData = new CharacterData();
  const viewer = new CharacterViewer(scene, characterData, camera);
  const ui = new CharacterCreatorUI(characterData, () => viewer.update());

  // Create UI
  ui.createUI();

  BABYLON.ParticleHelper.CreateAsync("rain", scene).then((set) => {
    //   this.currentSet = set;
    RAIN_SYSTEM = set;
    set.position = new BABYLON.Vector3(0, -10, 0);
    set.start();
  });

  return scene;
}
let RAIN_SYSTEM;

async function setupCharacter(scene, engine) {
  const spawnPoint = new BABYLON.Vector3(0, 1, 0);

  const { character, dummyAggregate } = await setupPhysics(scene, spawnPoint);
  character.position.y = 10; //10 for old
  character.position.y = 8; // for new
  const modelUrls = ["util/atmosphere/lightrays/lightrays.glb"];
  const heroModelPromise = loadHeroModelVibe(scene, character);
  const [heroModel, models] = await Promise.all([heroModelPromise, loadModels(scene, modelUrls)]);
  const { hero, skeleton } = heroModel;
  let anim = setupAnimVibe(scene, skeleton);
  const camera = setupCamera(scene, character, engine);
  camera.alpha = Math.PI / 2;
  camera.preferredZoom = 30;
  camera.shouldPrefferedZoom = true;
  setupInputHandling(scene, character, camera, hero, anim, engine, dummyAggregate);
  character.getChildMeshes().forEach((mesh) => {
    mesh.material._metallicF0Factor = 0;
    mesh.setEnabled(false);
  });
  character.getChildMeshes()[0].setEnabled(true);

  character.health = new Health("Hero", 100, dummyAggregate);
  character.health.rotationCheck = hero;
  character.health.rangeCheck = character;
  PLAYER = character;

  addLightrays(models["lightrays"], scene, engine);

  camera.upperBetaLimit = 1.56037;
  camera.lowerBetaLimit = 1.56037;
  camera.beta = 1.56037;

  camera.upperAlphaLimit = 1.5;
  camera.lowerAlphaLimit = 1.5;
  camera.alpha = 1.5;

  camera.lowerRadiusLimit = 40;
  camera.upperRadiusLimit = 40;
  camera.radius = 40;

  // Add debug layer toggle on Tab key
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Tab") {
      camera.upperBetaLimit = 3;
      camera.lowerBetaLimit = 0.1;

      camera.upperAlphaLimit = 3;
      camera.lowerAlphaLimit = 0.1;

      camera.lowerRadiusLimit = 5;
      camera.upperRadiusLimit = 100;
    }
  });

  camera.anim = anim;
  return camera;
}

let LIGHTRAYS;
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
  LIGHTRAYS = lightrays;
  LIGHTRAYS.hide = () => {
    lightrays.getChildMeshes().forEach(function (childMesh) {
      childMesh.setEnabled(false);
    });
  };
  LIGHTRAYS.show = () => {
    lightrays.getChildMeshes().forEach(function (childMesh) {
      childMesh.setEnabled(true);
    });
  };
  LIGHTRAYS.hide();
  //   LIGHTRAYS.show();
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
  shaderMaterial.setColor3("lightColor", new BABYLON.Color3(100, 0.9, 0.7));
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

  grassThinShader.setColor3("color1", new BABYLON.Color3(2.0, 1.0, 0.1)); // Yellow
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

      //   clone.position.x = 0;
      clone.position.z = 10; // + Math.random() * 10;
    }
  });
}

// Add some basic CSS styles
const style = document.createElement("style");
style.textContent = `
.character-creator::before {
  backdrop-filter: blur(10px);
}
  .character-creator button {
    display: block;
    width: 100%;
    margin: 5px 0;
    padding: 8px;
    // background: #444;
    background: rgba(0, 0, 0, 0.3);
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
  }

  .input-container {
    position: absolute;
    left: 50%;
  bottom: 30px;
  transform: translateX(-50%);
  text-align: center;
  width: 300px;
  }

  
  .input-container input {
    width: 100%;
    padding:0.85rem 1.75rem;
    
    margin: 5px 0;
    background: rgba(0, 0, 0, 0.3);
    caret-color: white;
    
    border: none;
    border-radius: 4px;
    color: white;
  }


  .play-button {
    position: absolute;
    right: 40px;
    bottom: 40px;
  }


  .character-creator button:hover {
    // background: #666;
    filter: brightness(1.5);
  }

  .selection-container, .input-container {
    margin-bottom: 20px;
  }

  .character-creator h3 {
    margin: 0 0 10px 0;
    font-size: 36px;
    font-family: "Oxanium", sans-serif;
    // text-transform: uppercase;
  }
`;
document.head.appendChild(style);
