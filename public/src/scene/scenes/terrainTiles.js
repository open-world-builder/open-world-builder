// RECOPY FROM CASTLE SCENE,

import { loadHeroModel } from "../../character/hero.js";
import { setupCamera } from "../../utils/camera.js";
import { setupPhysics } from "../../utils/physics.js";
import { setupInputHandling } from "../../movement.js";
import { setupAnim } from "../../utils/anim.js";
import { setupWaterNoFog } from "../../utils/water.js";
import { setupEnemy } from "/src/character/enemy.js";

import { loadModels } from "../../utils/load.js";

import { Health } from "../../character/health.js";
import addSword from "../../character/equips/held.js";
import { TerrainEditor } from "../../utils/TerrainEditor.js";
import { setupSSAO } from "../../utils/ssao.js";

import { RemotePlayer } from "../../utils/npc/RemotePlayer.js";
import { createMobileControlsJoystickOnly } from "../../utils/mobile/joystick.js";

import { Options } from "/src/utils/options/options.js";

import { SoundManager } from "/src/utils/sound.js";

import { showSubtitle } from "../../utils/dialog/subtitle.js";

import { NPCPools } from "../../utils/npc/NPCPools.js";
import { NPC } from "../../utils/npc/npc.js";
import { loadMeshWithVAT } from "../../utils/npc/vat.js";
import { addEnemyOutlineCamera } from "../../character/enemy.js";
export async function createTerrainTiles(engine) {
  const scene = new BABYLON.Scene(engine);
  // const spawnPoint = new BABYLON.Vector3(134.683, 80, -271.427);
  const spawnPoint = new BABYLON.Vector3(1706.683, -775, 1277.427);
  scene.spawnPoint = spawnPoint;
  const { character, dummyAggregate } = await setupPhysics(scene, spawnPoint);

  const terrainEditor = setupTerrainEditor(scene);
  TERRAIN_EDITOR = terrainEditor;

  const camera = setupCamera(scene, character, engine);
  camera.wheelDeltaPercentage = 0.02;

  camera.lowerRadiusLimit = 4; // Minimum distance to target (closest zoom)
  camera.upperRadiusLimit = 656.8044;
  // camera.upperBetaLimit = Math.PI / 2; // Stops at the horizon (90 degrees)
  // camera.upperBetaLimit = 3.13; // full
  // camera.upperBetaLimit = 3.0; // should be this value for freedom, need to fix skybox
  camera.upperBetaLimit = 1.8;
  // camera.upperBetaLimit = Math.PI / 2; // Stops at the horizon (90 degrees)
  camera.alpha = 0.5077;
  camera.beta = 1.4437;

  // load all models, make sure parallel loading for speed
  const modelUrls = [
    "characters/weapons/Sword2.glb",
    "env/exterior/grass/grass.glb",
    "textures/terrain/trees/newTreePacked.glb",
    "env/objects/castle/modular/castle_modular_blend.glb",
    "util/HPBar.glb",
    // "env/night/Bridge.glb",
  ];

  const heroModelPromise = loadHeroModel(scene, character);
  // const { hero, skeleton } = await loadHeroModel(scene, character);

  //9000 ms all in the heroModelPromise load.
  const [heroModel, models] = await Promise.all([heroModelPromise, loadModels(scene, modelUrls)]);
  const { hero, skeleton } = heroModel;

  let anim = setupAnim(scene, skeleton);
  setupInputHandling(scene, character, camera, hero, anim, engine, dummyAggregate);
  character.health = new Health("Hero", 100, dummyAggregate);
  character.health.rotationCheck = hero;
  character.health.rangeCheck = character;
  character.health.anim = anim;
  PLAYER = character;
  scene.WORLD_ID = "1";
  window.DUMMY_AGGREGATE = dummyAggregate;
  window.CHARACTER = character;

  hero.getChildMeshes().forEach((mesh) => {
    mesh.applyFog = false;
    mesh.material._metallicF0Factor = 0;
    mesh.material.environmentIntensity = 0.7;
    mesh.material.directIntensity = 10.7;

    //this doesnt work for some reason - todo make work for all scenes in loadHeroModel
    mesh.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
    mesh.animationPropertiesOverride.enableBlending = true;
    mesh.animationPropertiesOverride.blendingSpeed = 0.15;
  });

  // Todo: add shadow and post toggles in settings
  // Defer non-critical operations
  setupEnvironment(scene);
  const skybox = createSkydome(scene, spawnPoint);
  // const godrays = new BABYLON.VolumetricLightScatteringPostProcess("godrays", 1.0, camera, skybox, 150, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, true);
  // godrays.exposure = 0.55;
  // godrays.decay = 0.95815;
  // // godrays.weight = 0.38767
  // godrays.weight = 0.18767;
  // godrays.weight = 0.07767;
  // godrays.density = 0.926;

  // setupColorCorrection(camera);

  //   setupWater(scene, terrain, engine, hero, -1, 8000);

  const light = setupLighting(scene, terrainEditor.getTerrain());

  setupShadows2(light, hero);
  const pipeline = setupPostProcessing(scene, camera);
  setupWaterPostProcessing(scene, camera, pipeline);
  //non critical

  setTimeout(async () => {
    // terrainEditor.setModels(models["grass"]);
    // terrainEditor.setModels(models["grass"]);
    terrainEditor.setModels(models["newTreePacked"]);
    terrainEditor.setShadowGenerator(light.getShadowGenerator());
    scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN && kbInfo.event.key === "Tab") {
        // Prevent default tab behavior (switching focus)
        kbInfo.event.preventDefault();

        // Add your tab key functionality here
        // terrainEditor.setModels(models["Bridge"]);
      }
    });
    window.TERRAIN_EDITOR = terrainEditor;
    // loadHPModels(scene, engine, models["HPBar"]);

    let sword = addSword(scene, models["Sword2"]);
    sword.isPickable = false;
    // createTrail(scene, engine, sword, 0.2, 40, new BABYLON.Vector3(0, 0, 0.32));

    setupDustParticles(scene, spawnPoint);

    performance(scene);

    console.log("setupCombat");
    setupCombat();

    debugTeleport(scene, dummyAggregate);
    // createSpider(scene, engine, spawnPoint);

    createMobileControlsJoystickOnly(scene, camera, character);
    character.shouldTapToMove = false;
    // if (window.ON_MOBILE) {
    // terrainEditor.setTerrainTool("movement");
    // }

    setupSound(scene, camera);
    setTimeout(() => {
      loadHPModels(scene, engine, models["HPBar"]);

      setupNPCs(scene, spawnPoint, camera, character);

      //   debugNavmesh(scene);
      toggleNavMesh(scene);
    }, 3000);

    // if (!window.ON_MOBILE) {
    setupSSAO(scene, camera, false, window.ON_MOBILE);
    // }
    setTimeout(() => {
      const ground = scene.getMeshByName("ground");
      setupWaterNoFog(scene, ground, engine, hero, -800, 8000, skybox);
      addWaterMovement(scene, dummyAggregate, anim);
    }, 1000);

    //laptop optimize
    engine.setHardwareScalingLevel(1); // scale down resolution, e.g., by 2
    //engine.setFrameRate(30);
    //scene.optimizeAsync();
    // engine.targetFps = 30;

    //show subtitle

    // showSubtitle('Level Up!', 10000);
    if (window.ON_MOBILE) {
      setTimeout(() => {
        showSubtitle("Bottom left corner drag to move, anywhere else to rotate view.", 5000);
      }, 20000);
      setTimeout(() => {
        showSubtitle("Try out the tools in the bottom right, or explore...", 5000);
      }, 32000);
    } else {
      setTimeout(() => {
        showSubtitle("WASD to move, right click drag to rotate view.", 6000);
      }, 20000);
      setTimeout(() => {
        showSubtitle("Take a look around, build something, or find an npc to mess with.", 5000);
      }, 32000);
    }

    // setTimeout(() => {
    //   showSubtitle("Hello! Over here! I'm over on the shore.", 5000);
    // }, 40000);

    addZReset(scene, dummyAggregate, spawnPoint);
    //when pressing v, create first person camera
    // firstPersonCamera(scene, engine, camera, character);
    setupOptions(scene, engine);

    // setupInteractable(scene, spawnPoint);

    setupCutscene(scene, engine);

    setupJumpToInspectorObject(scene, dummyAggregate);

    // setupTargetDummy(scene, spawnPoint);

    // setupDoor(scene, spawnPoint);
    setupFog(scene);

    // setupCastleBlendMaterial(scene, models["castle_modular_blend"], spawnPoint);

    setupUIHide(scene);
  }, 10);
  return scene;
}

function toggleNavMesh(scene) {
  scene.onKeyboardObservable.add((kbInfo) => {
    if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN && kbInfo.event.key === "k") {
      scene.getMeshByName("navmeshdebug").isVisible = !scene.getMeshByName("navmeshdebug").isVisible;
    }
  });
}

function debugNavmesh(scene) {
  const params = {
    cs: 10.0, // Increased cell size to reduce complexity
    ch: 10.0, // Increased cell height to match cell size
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
      // Create new navmesh with current parameters
      let terrain = scene.getMeshByName("ground");
      NAVIGATION_PLUGIN.createNavMesh([terrain], params);

      // Create debug visualization
      navmeshdebug = NAVIGATION_PLUGIN.createDebugNavMesh(scene);
      navmeshdebug.isPickable = false;

      matdebug = new BABYLON.StandardMaterial("matdebug", scene);
      matdebug.diffuseColor = new BABYLON.Color3(0.1, 0.2, 1);
      matdebug.alpha = 0.55;
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
      basicFolder.add(params, "cs", 0.1, 10).name("Cell Size");
      basicFolder.add(params, "ch", 0.1, 10).name("Cell Height");
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

function setupUIHide(scene) {
  let isUIHidden = false;
  scene.onKeyboardObservable.add((kbInfo) => {
    if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN && kbInfo.event.key === "i") {
      isUIHidden = !isUIHidden;
      if (isUIHidden) {
        scene.getMeshByName("mesh").isVisible = false;
        scene.getMeshByName("base").isVisible = false;
        document.getElementById("mainMenu").style.display = "none";
      } else {
        scene.getMeshByName("mesh").isVisible = true;
        scene.getMeshByName("base").isVisible = true;
        document.getElementById("mainMenu").style.display = "block";
      }
    }
  });
}

class ThreeTextureBlendMaterial extends BABYLON.CustomMaterial {
  constructor(name, scene) {
    super(name, scene);

    // Define textures and their properties
    this.baseTexture = null;
    this.overlayTexture1 = null;
    this.overlayTexture2 = null;
    this.heightMap1 = null;
    this.heightMap2 = null;

    // Tiling settings
    this.baseTiling = new BABYLON.Vector2(1, 1);
    this.overlay1Tiling = new BABYLON.Vector2(1, 1);
    this.overlay2Tiling = new BABYLON.Vector2(1, 1);

    // Register uniforms and samplers
    this.AddUniform("baseTiling", "vec2");
    this.AddUniform("overlay1Tiling", "vec2");
    this.AddUniform("overlay2Tiling", "vec2");

    this.AddUniform("heightMap1Tiling", "vec2");
    this.AddUniform("heightMap2Tiling", "vec2");

    this.AddUniform("baseTexture", "sampler2D");
    this.AddUniform("overlayTexture1", "sampler2D");
    this.AddUniform("overlayTexture2", "sampler2D");
    this.AddUniform("heightMap1", "sampler2D");
    this.AddUniform("heightMap2", "sampler2D");

    this.AddUniform("ambientColor", "vec3");

    this.AddUniform("heightBlendStart", "float");
    this.AddUniform("heightBlendEnd", "float");

    this.AddUniform("heightMapStrength", "float");
    this.AddUniform("heightMapStrength2", "float");

    this.AddUniform("noiseScale", "float"); // Control noise frequency
    this.AddUniform("noiseStrength", "float"); // Control noise intensity

    this.AddUniform("ambientAmount", "float");

    this.AddAttribute("uv");
    this.AddAttribute("position");
    this.Vertex_Definitions(`
        varying vec2 vUV;
        // varying vec3 vPosition;
    `);
    this.Vertex_MainBegin(`
        vUV = uv;
        // vPosition = position;
    `);

    this.Fragment_Definitions(`
        // Fast smooth noise function
        vec2 hash22(vec2 p) {
            vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
            p3 += dot(p3, p3.yzx+33.33);
            return fract((p3.xx+p3.yz)*p3.zy);
        }

        float smoothNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            
            // Smooth interpolation
            vec2 u = f * f * (3.0 - 2.0 * f);
            
            // Sample 4 corners
            float a = dot(hash22(i), f);
            float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
            float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
            float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
            
            // Interpolate
            return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }
    `);

    this.Fragment_Custom_Diffuse(`
                vec4 baseLayerColor = texture2D(baseTexture, vDiffuseUV * baseTiling);
                vec4 overlay1LayerColor = texture2D(overlayTexture1, vDiffuseUV * overlay1Tiling);
                vec4 overlay2LayerColor = texture2D(overlayTexture2, vDiffuseUV * overlay2Tiling);

                diffuseColor = baseLayerColor.rgb;


                           float blendFactor;
     
                // Use vertical position for blending
                blendFactor = smoothstep(heightBlendStart, heightBlendEnd, vPositionW.y);
                    
                //Debug vertical position blending
                vec3 red = vec3(1.0, 0.0, 0.0);
                vec3 blue = vec3(0.0, 0.0, 1.0);
                //   diffuseColor = mix(red, blue, blendFactor);


                    // float height1 = texture2D(heightMap1, vDiffuseUV * heightMap1Tiling).r * heightMapStrength;
          
                      // Generate noise
                float noise = smoothNoise(vDiffuseUV * noiseScale);
                noise = noise * 2.0 - 1.0; // Convert to -1 to 1 range
             
                    float height1 = texture2D(heightMap1, vDiffuseUV *heightMap1Tiling).r;
                  height1 = height1 + (noise * noiseStrength);
                height1 = clamp(height1 * heightMapStrength, 0.0, 1.0);
            
              
                  // First blend overlay1 based on its height map
                diffuseColor = mix(diffuseColor.rgb, overlay1LayerColor.rgb, height1);
                
                
      float height2 = texture2D(heightMap2, vDiffuseUV * heightMap2Tiling).r * heightMapStrength2;
      diffuseColor = mix(diffuseColor.rgb, overlay2LayerColor.rgb, height2 * blendFactor);
                //   diffuseColor = mix(diffuseColor.rgb, overlay2LayerColor.rgb, blendFactor);

            `);

    this.Fragment_Before_FragColor(`


          
            vec3 customAmbient = diffuseColor.rgb;
            color.rgb = mix(color.rgb, customAmbient, ambientAmount);
            
            
            // color.rgb = diffuseColor.rgb * ambientColor;
        `);

    // // Create the custom shader
    // this.CustomParts.Fragment_Begin = `
    //         // Additional varyings and uniforms
    //         // uniform sampler2D baseTexture;
    //         // uniform sampler2D overlayTexture1;
    //         // uniform sampler2D overlayTexture2;
    //         // uniform sampler2D heightMap1;
    //         // uniform sampler2D heightMap2;

    //         // uniform vec2 baseTiling;
    //         // uniform vec2 overlay1Tiling;
    //         // uniform vec2 overlay2Tiling;
    //     `;

    // this.CustomParts.Fragment_MainBegin = `
    //         // Calculate UV coordinates for each texture based on tiling
    //         // vec2 baseUV = vUV * baseTiling;
    //         // vec2 overlay1UV = vUV * overlay1Tiling;
    //         // vec2 overlay2UV = vUV * overlay2Tiling;

    //         // // Sample textures
    //         // vec4 baseColor = texture2D(baseTexture, baseUV);
    //         // vec4 overlay1Color = texture2D(overlayTexture1, overlay1UV);
    //         // vec4 overlay2Color = texture2D(overlayTexture2, overlay2UV);

    //         // // Sample height maps
    //         // float height1 = texture2D(heightMap1, vUV).r;
    //         // float height2 = texture2D(heightMap2, vUV).r;
    //     `;

    // this.CustomParts.Fragment_Custom_Diffuse = `
    //         // Blend based on height maps
    //         // vec4 finalColor = baseColor;

    //         // // Apply first overlay based on height map
    //         // finalColor = mix(finalColor, overlay1Color, height1);

    //         // // Apply second overlay based on height map
    //         // finalColor = mix(finalColor, overlay2Color, height2);

    //         // color = finalColor;
    //     `;
  }

  // Helper methods to set textures and properties
  setBaseTexture(texture) {
    this.baseTexture = texture;
  }

  setOverlayTexture1(texture) {
    this.overlayTexture1 = texture;
  }

  setOverlayTexture2(texture) {
    this.overlayTexture2 = texture;
  }

  setHeightMap1(texture) {
    this.heightMap1 = texture;
  }

  setHeightMap2(texture) {
    this.heightMap2 = texture;
  }

  setBaseTiling(x, y) {
    this.baseTiling.x = x;
    this.baseTiling.y = y;
  }

  setOverlay1Tiling(x, y) {
    this.overlay1Tiling.x = x;
    this.overlay1Tiling.y = y;
  }

  setOverlay2Tiling(x, y) {
    this.overlay2Tiling.x = x;
    this.overlay2Tiling.y = y;
  }

  setHeightBlendStart(value) {
    this.heightBlendStart = value;
  }

  setHeightBlendEnd(value) {
    this.heightBlendEnd = value;
  }
}
function setupCastleBlendMaterial(scene, mesh, spawnPoint) {
  mesh.position = spawnPoint.clone();
  mesh.scaling.x = 35;
  mesh.scaling.y = 35;
  mesh.scaling.z = 35;
  mesh.position.x += 100;
  mesh.position.z -= 50;
  mesh.position.y -= 40;

  scene.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  const blendMaterial = new ThreeTextureBlendMaterial("blendMaterial", scene);
  blendMaterial.diffuseTexture = new BABYLON.Texture("/assets/textures/terrain/undefined - Imgur.png", scene);
  //   blendMaterial.ambientTexture = new BABYLON.Texture("/assets/textures/terrain/undefined - Imgur.png", scene);
  //   blendMaterial.diffuseIntensity = 10.1;
  blendMaterial.diffuseTexture.level = 2.2;
  blendMaterial.specularPower = 0.0;
  blendMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

  // Set textures
  blendMaterial.setBaseTexture(new BABYLON.Texture("/assets/env/objects/castle/modular/base_stone.png", scene));
  blendMaterial.setOverlayTexture1(new BABYLON.Texture("/assets/env/objects/castle/modular/stone1.png", scene));
  blendMaterial.setOverlayTexture2(new BABYLON.Texture("/assets/textures/terrain/grass_01_dark.png", scene));
  blendMaterial.setHeightMap1(new BABYLON.Texture("/assets/env/objects/castle/modular/height1.png", scene));
  blendMaterial.setHeightMap2(new BABYLON.Texture("/assets/textures/terrain/trees/leaf card 2.png", scene));

  // Set tiling
  blendMaterial.setBaseTiling(1, 1);
  blendMaterial.setOverlay1Tiling(1, 1);
  blendMaterial.setOverlay2Tiling(1, 1);

  blendMaterial.setHeightBlendStart(-750);
  blendMaterial.setHeightBlendEnd(-819);
  let debug = false;

  let heightBlendStart = -750;
  let heightBlendEnd = -819;
  let baseTiling = 1;
  let overlay1Tiling = 1;
  let overlay2Tiling = 1;
  let diffuseIntensity = 2.2;
  let heightMapStrength = 1.0;
  let heightMapStrength2 = 5.0;
  let heightMap1TilingValue = 0.7;
  let heightMap2TilingValue = 1.6;
  let heightMap1Tiling = new BABYLON.Vector2(heightMap1TilingValue, heightMap1TilingValue);
  let heightMap2Tiling = new BABYLON.Vector2(heightMap2TilingValue, heightMap2TilingValue);
  let noiseScale = 2.0; // Control noise frequency
  let noiseStrength = -0.15;
  let ambientAmount = 0.05;
  if (debug) {
    BABYLON.Tools.LoadScriptAsync("https://cdn.jsdelivr.net/npm/lil-gui@0.17.0/dist/lil-gui.umd.min.js").then(() => {
      const gui = new lil.GUI({ title: "Height Blend" });
      gui.add(blendMaterial, "heightBlendStart", -1000, 1000, 1).onChange((value) => {
        heightBlendStart = value;
      });
      gui.add(blendMaterial, "heightBlendEnd", -1000, 1000, 1).onChange((value) => {
        heightBlendEnd = value;
      });
      gui.add({ baseTiling: baseTiling }, "baseTiling", 1, 10, 0.5).onChange((value) => {
        blendMaterial.setBaseTiling(value, value);
      });
      gui.add({ overlay1Tiling: overlay1Tiling }, "overlay1Tiling", 1, 10, 1).onChange((value) => {
        blendMaterial.setOverlay1Tiling(value, value);
      });
      gui.add({ overlay2Tiling: overlay2Tiling }, "overlay2Tiling", 1, 10, 1).onChange((value) => {
        blendMaterial.setOverlay2Tiling(value, value);
      });

      gui.add({ diffuseIntensity: diffuseIntensity }, "diffuseIntensity", 1, 10, 0.1).onChange((value) => {
        blendMaterial.diffuseTexture.level = value;
      });
      gui.add({ heightMapStrength: heightMapStrength }, "heightMapStrength", 0, 10, 0.1).onChange((value) => {
        heightMapStrength = value;
      });
      gui.add({ heightMapStrength2: heightMapStrength2 }, "heightMapStrength2", 0, 10, 0.1).onChange((value) => {
        heightMapStrength2 = value;
      });
      gui.add({ heightMap1TilingValue: heightMap1TilingValue }, "heightMap1TilingValue", 0, 10, 0.1).onChange((value) => {
        heightMap1TilingValue = value;
        heightMap1Tiling = new BABYLON.Vector2(value, value);
      });
      gui.add({ heightMap2TilingValue: heightMap2TilingValue }, "heightMap2TilingValue", 0, 10, 0.1).onChange((value) => {
        heightMap2TilingValue = value;
        heightMap2Tiling = new BABYLON.Vector2(value, value);
      });
      gui.add({ noiseScale: noiseScale }, "noiseScale", 0.1, 10, 0.5).onChange((value) => {
        noiseScale = value;
      });

      gui.add({ noiseStrength: noiseStrength }, "noiseStrength", -1, 1, 0.05).onChange((value) => {
        noiseStrength = value;
      });
      gui.add({ ambientAmount: ambientAmount }, "ambientAmount", 0, 1, 0.01).onChange((value) => {
        ambientAmount = value;
      });
    });
  }

  blendMaterial.onBindObservable.add(() => {
    const effect = blendMaterial.getEffect();
    effect.setTexture("baseTexture", blendMaterial.baseTexture);
    effect.setTexture("overlayTexture1", blendMaterial.overlayTexture1);
    effect.setTexture("overlayTexture2", blendMaterial.overlayTexture2);
    effect.setTexture("heightMap1", blendMaterial.heightMap1);
    effect.setTexture("heightMap2", blendMaterial.heightMap2);
    effect.setVector2("baseTiling", blendMaterial.baseTiling);
    effect.setVector2("overlay1Tiling", blendMaterial.overlay1Tiling);
    effect.setVector2("overlay2Tiling", blendMaterial.overlay2Tiling);

    // effect.setFloat("heightBlendStart", -805);
    // effect.setFloat("heightBlendEnd", -795);
    // effect.setFloat("heightBlendStart", -900);
    // effect.setFloat("heightBlendEnd", -700);
    effect.setFloat("heightBlendStart", heightBlendStart);
    effect.setFloat("heightBlendEnd", heightBlendEnd);
    effect.setFloat("heightMapStrength", heightMapStrength);
    effect.setFloat("heightMapStrength2", heightMapStrength2);
    effect.setVector2("heightMap1Tiling", heightMap1Tiling);
    effect.setVector2("heightMap2Tiling", heightMap2Tiling);

    effect.setFloat("noiseScale", noiseScale);
    effect.setFloat("noiseStrength", noiseStrength);
    effect.setFloat("ambientAmount", ambientAmount);
    // var currentTime = (Date.now() - startTime) / 1000; // Time in seconds
    // effect.setFloat("time", currentTime);
  });
  // Apply to mesh
  console.log("blendMaterial", blendMaterial);
  mesh.getChildMeshes().forEach((child) => {
    child.material = blendMaterial;
    if (child.name.toLowerCase().includes("wall")) {
      // Create 3 instances
      console.log("wallmesh", child.name);
      let wall1 = child.createInstance("wall1");
      let wall2 = child.createInstance("wall2");
      let wall3 = child.createInstance("wall3");

      //   // Position the instances
      wall1.position = child.position.clone();
      wall1.position.x += 2.46;
      wall2.position = child.position.clone();
      wall2.position.x += 4.92;
      wall3.position = child.position.clone();
      wall3.position.x += 7.38;

      //   // Hide original wall mesh
      //   child.setEnabled(false);
    }
  });
  // mesh.material = blendMaterial;
  console.log("mesh.material", mesh.material);
}

function setupFog(scene) {
  // scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
  // scene.fogColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  // scene.fogStart = 0;
  // scene.fogEnd = 1000;
}

function setupDoor(scene, spawnPoint) {
  const door = BABYLON.MeshBuilder.CreateBox("door", { size: 10 }, scene);
  door.position = spawnPoint.clone();
  door.scaling.y = 4.1;
  door.scaling.x = 2.1;
  door.position.y += -4;
  door.position.x += 50;
  // door.isPickable = false;
  // door.isInteractable = true;
  door.interact = new Interact();
  // door.interact.addAction("open", () => {
  //   console.log("open");
  // });
  // door.interact.addAction("open", () => {
  //   console.log("open");
  // });
  // this.dummy.setEnabled(false);
}

function setupTargetDummy(scene, spawnPoint) {
  const dummy = BABYLON.MeshBuilder.CreateBox("dummy", { size: 10 }, scene);
  dummy.position = spawnPoint.clone();
  dummy.scaling.y = 4.1;
  dummy.scaling.x = 2.1;
  dummy.position.y += -4;
  dummy.position.x += -50;
  dummy.isPickable = false;
  dummy.isInteractable = true;
  // dummy.interact = new Interact();
  // dummy.interact.addAction("talk", () => {
  //   console.log("talk");
  // });
  // this.dummy.setEnabled(false);
  let enemy = setupEnemy(scene, PLAYER, dummy, null);
  PLAYER.target = enemy;
}

function setupJumpToInspectorObject(scene, dummyAggregate) {
  scene.onKeyboardObservable.add((kbInfo) => {
    if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN && kbInfo.event.key === "]") {
      kbInfo.event.preventDefault();
      console.log(scene.debugLayer);
      dummyAggregate.jumpToPosition(PICKED_MESH.position.x, PICKED_MESH.position.y, PICKED_MESH.position.z);
    }
  });
}

function setupCutscene(scene, engine) {
  function animateVignette(wipeIn = true, duration = 1000, callback) {
    const start = vignette.imageProcessing.vignetteWeight;
    const end = wipeIn ? 5.0 : 1.0;

    const anim = new BABYLON.Animation("vignetteAnim", "imageProcessing.vignetteWeight", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

    const keys = [
      { frame: 0, value: start },
      { frame: 60, value: end },
    ];

    anim.setKeys(keys);
    vignette.animations = [anim];

    const animatable = scene.beginAnimation(vignette, 0, 60, false, (60 / duration) * 1000, () => {
      if (callback) callback();
    });
  }

  // 2) make & activate your UniversalCamera
  const oldCam = scene.activeCamera;
  const cutCam = new BABYLON.UniversalCamera("cutCam", scene.activeCamera.position.clone(), scene);
  cutCam.intertia = 0.3;
  cutCam.angularSensitivity = 400;
  cutCam.setTarget(scene.activeCamera.getTarget());
  setupPostProcessing(scene, cutCam);

  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "v") {
      //start blink animation

      // Cutscene animation
      let startPos = oldCam.position.clone();
      // 2) define the animation keys
      // const keys = [
      //   { frame: 0, value: startPos },
      //   { frame: 120, value: new BABYLON.Vector3(startPos.x, startPos.y + 10, startPos.z) },
      //   { frame: 240, value: new BABYLON.Vector3(startPos.x, startPos.y + 20, startPos.z) },
      //   { frame: 360, value: startPos },
      // ];
      const keys = [
        { frame: 0, value: new BABYLON.Vector3(3684.451, -600, 100) },
        { frame: 360, value: new BABYLON.Vector3(1700, -600, 1200) },
        { frame: 480, value: startPos },
      ];

      // 3) create & start the fly‑through animation
      const anim = new BABYLON.Animation(
        "flyAnim",
        "position",
        60, // fps
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      // const easingFunction = new BABYLON.CubicEase();
      // easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
      // anim.setEasingFunction(easingFunction);
      anim.setKeys(keys);
      cutCam.animations = [anim];

      scene.activeCamera = cutCam;
      let canvas = engine.getRenderingCanvas();
      cutCam.attachControl(canvas, true);

      // COLOR_CORRECTION.dispose();
      scene.beginAnimation(cutCam, 0, 480, false, 1.0, () => {
        // Animation ended, switch back to oldCam
        // const forward = cutCam.getForwardRay().direction;
        // const alpha = Math.atan2(forward.z, forward.x); // horizontal angle
        // const beta = Math.acos(forward.y / forward.length()); // vertical angle
        // oldCam.alpha = alpha;
        // oldCam.beta = beta;
        setTimeout(() => {
          scene.activeCamera = oldCam;
          oldCam.attachControl(engine.getRenderingCanvas(), true);
        }, 1500);
      });
    }
  });
}

function setupCombat() {
  // Initialize skill bar
  setupSkillBar();
  setupSpellbook();
  // setupSkillTree();
}
import { SkillBar } from "/src/combat/skills/SkillBar.js";
import { Spellbook } from "/src/combat/skills/Spellbook.js";
import { SkillTree } from "/src/combat/skills/SkillTree.js";

function setupSkillBar() {
  console.log("setupSkillBar");
  SKILL_BAR = new SkillBar();
  if (MODE === 1) {
    SKILL_BAR.showSkillBar();
  }
}
function setupSpellbook() {
  SPELLBOOK = new Spellbook();
}
function setupSkillTree() {
  SKILL_TREE = new SkillTree();
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

function setupOptions(scene, engine) {
  OPTIONS = new Options(true);
  OPTIONS.onOptionChange("resolutionScale", (value) => {
    // Apply hardware scaling inversely (higher value = lower scaling)
    // This creates a linear relationship where 1 = 1, 2 = 0.5, 1.5 = 0.67, etc.
    engine.setHardwareScalingLevel(1 / value);
  });
  // scene.performancePriority = BABYLON.ScenePerformancePriority.Aggressive;
  // document.addEventListener("keydown", function (event) {
  //   if (event.key === "Escape") {
  //   }
  // });
  OPTIONS.onOptionChange("unstuckMe", () => {
    console.log("unstuckMe");
    scene.activeCamera.preferredZoom = 100;
  });

  OPTIONS.onOptionChange("masterVolume", (value) => {
    // Handle master volume - you might need to implement this in SoundManager
    // scene.activeCamera.sound.setChannelVolume("master", value);
  });

  OPTIONS.onOptionChange("musicVolume", (value) => {
    scene.activeCamera.sound.music.volume = value;
  });

  OPTIONS.onOptionChange("sfxVolume", (value) => {
    scene.activeCamera.sound.setChannelVolume("sfx", value);
  });

  OPTIONS.onOptionChange("ambienceVolume", (value) => {
    scene.activeCamera.sound.ambience.volume = value;
    // scene.activeCamera.sound.setChannelVolume("voice", value);
  });
}

function addZReset(scene, dummyAggregate) {
  scene.onBeforeRenderObservable.add(() => {
    if (dummyAggregate.body.transformNode._absolutePosition.y < -1000) {
      dummyAggregate.resetToSpawn();
    }
  });
}

function addWaterMovement(scene, dummyAggregate, anim) {
  scene.onBeforeRenderObservable.add(() => {
    if (dummyAggregate.body.transformNode._absolutePosition.y < -800) {
      dummyAggregate.waterMovement();
      anim.Running = scene.getAnimationGroupByName("Jump");
    } else {
      dummyAggregate.normalMovement();
      anim.Running = scene.getAnimationGroupByName("RunningSprint");
    }
  });
}

function setupInteractable(scene, spawnPoint) {
  // use grab
  const grababble = BABYLON.MeshBuilder.CreateBox("grababble", { size: 5 }, scene);
  grababble.position = spawnPoint.clone();
  grababble.position.x += 40;
  grababble.position.z += 40;
  grababble.isPickable = false;
  grababble.isInteractable = true;
  grababble.isGrabable = true;
}

function firstPersonCamera(scene, engine, camera, character) {
  let fpsCam = null;

  scene.onKeyboardObservable.add(({ type, event }) => {
    if (type !== BABYLON.KeyboardEventTypes.KEYDOWN) return;

    // toggle first‐person view
    if (event.key.toLowerCase() === "v") {
      const canvas = engine.getRenderingCanvas();

      if (scene.activeCamera === camera) {
        // create FPS cam on first use
        if (!fpsCam) {
          const eye = character.position.add(new BABYLON.Vector3(0, 1.6, 0));
          fpsCam = new BABYLON.UniversalCamera("fpsCam", eye, scene);
          fpsCam.minZ = 0.1;
        }
        // sync your look direction
        fpsCam.rotation.copyFrom(camera.target.subtract(camera.position).normalize().toEulerAngles());
        fpsCam.attachControl(canvas, true);
        scene.activeCamera = fpsCam;
      } else {
        // return to ArcRotateCamera
        fpsCam.detachControl();
        camera.attachControl(canvas, true);
        scene.activeCamera = camera;
      }
    }
  });
}

function setupWaterPostProcessing(scene, camera, pipeline) {
  // put water droplets animated  on the camera maybe
  // Easing function for smoother transition
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  // Define our depth thresholds and colors
  const depthThresholds = {
    underwater: -805,
    surface: -798,
  };

  const colors = {
    normal: new BABYLON.Color4(0, 0, 0, 1),
    underwater: new BABYLON.Color4(14 / 255, 41 / 255, 65 / 255, 1),
    // underwater2: new BABYLON.Color4(10/255, 20/255, 29/255, 1),
    // underwater: new BABYLON.Color4(11 / 255, 22 / 255, 25 / 255, 1),
  };

  // Store the original vignette settings
  const originalVignetteWeight = pipeline.imageProcessing.vignetteWeight;
  const originalVignetteColor = pipeline.imageProcessing.vignetteColor.clone();
  const originalVignetteCameraFov = pipeline.imageProcessing.vignetteCameraFov;

  // Update the vignette color based on camera height
  scene.onBeforeRenderObservable.add(() => {
    const cameraHeight = camera.position.y;
    // console.log("cameraHeight", cameraHeight);

    if (cameraHeight <= depthThresholds.underwater) {
      pipeline.imageProcessing.vignetteColor = colors.underwater;
      // pipeline.imageProcessing.vignetteWeight = 5.2;
      pipeline.imageProcessing.vignetteWeight = 0.2;
      pipeline.imageProcessing.vignetteCameraFov = 3.2;
      // pipeline.imageProcessing.vignetteBlendMode = 1;
    } else if (cameraHeight >= depthThresholds.surface) {
      pipeline.imageProcessing.vignetteColor = originalVignetteColor;
      pipeline.imageProcessing.vignetteWeight = originalVignetteWeight;
      pipeline.imageProcessing.vignetteCameraFov = originalVignetteCameraFov;
      // pipeline.imageProcessing.vignetteBlendMode = 0;
    } else {
      const t = (cameraHeight - depthThresholds.underwater) / (depthThresholds.surface - depthThresholds.underwater);

      const lerpedColor = new BABYLON.Color4(BABYLON.Scalar.Lerp(colors.underwater.r, originalVignetteColor.r, t), BABYLON.Scalar.Lerp(colors.underwater.g, originalVignetteColor.g, t), BABYLON.Scalar.Lerp(colors.underwater.b, originalVignetteColor.b, t), BABYLON.Scalar.Lerp(colors.underwater.a, originalVignetteColor.a, t));

      const lerpedWeight = BABYLON.Scalar.Lerp(0.2, originalVignetteWeight, t);

      const lerpedCameraFov = BABYLON.Scalar.Lerp(3.2, originalVignetteCameraFov, t);

      pipeline.imageProcessing.vignetteColor = lerpedColor;
      pipeline.imageProcessing.vignetteWeight = lerpedWeight;
      pipeline.imageProcessing.vignetteCameraFov = lerpedCameraFov;
    }
  });
}

function setupCrowd(scene, spawnPoint, camera, player) {
  const crowd = navigationPlugin.createCrowd(128, 0.6, scene); // 128 agents per batch is a sweet spot:contentReference[oaicite:1]{index=1}
  CROWD = crowd;
}

var agents = [];
async function setupNPCs(scene, spawnPoint, camera, player) {
  console.log("setupNPCs");
  // const recast = await new Recast();

  // let navigationPlugin = new BABYLON.RecastJSPlugin(recast);
  // // 3) Sanity‑check that it held onto your module
  // console.log("plugin._recast:", navigationPlugin._recast);
  // console.log("plugin.", navigationPlugin);

  // const navmeshParameters = {
  //   cs: 0.5,
  //   ch: 0.5,
  //   walkableSlopeAngle: 45,
  //   walkableHeight: 1,
  //   walkableClimb: 0.5,
  //   walkableRadius: 0.5,
  //   maxEdgeLen: 10,
  //   maxSimplificationError: 1,
  //   minRegionArea: 0,
  //   mergeRegionArea: 0,
  //   maxVertsPerPoly: 6,
  //   detailSampleDist: 2,
  //   detailSampleMaxError: 1,
  // };
  // let mesh = scene.getMeshByName("ground");
  // scene.render(); // cheap “one frame” render
  // mesh.computeWorldMatrix(true);
  // console.log("positions count:", mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)?.length);
  // console.log("indices count:", mesh.getIndices().length);
  // const bb = mesh.getBoundingInfo().boundingBox;
  // console.log("World‐space min:", bb.minimumWorld, "max:", bb.maximumWorld);

  // if (!mesh.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind) || mesh.getIndices().length === 0) {
  //   console.error("Mesh has no position data or no triangles!");
  // }

  // mesh.computeWorldMatrix(true);
  // const vdata = BABYLON.VertexData.ExtractFromMesh(mesh, /* applyWorld?: */ true);

  // // now give Recast a clean data object instead of a Mesh
  // navigationPlugin.createNavMesh(vdata, navmeshParameters);
  // // navigationPlugin.createNavMesh(mesh, navmeshParameters);

  const recast = await new Recast();
  // Initialize and enable Recast navigation plugin
  const navigationPlugin = new BABYLON.RecastJSPlugin(recast);
  NAVIGATION_PLUGIN = navigationPlugin;
  // scene.enableNavigationPlugin(navPlugin);

  //test mesh
  // const staticMesh = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
  // var navmeshParameters = {
  //   cs: 0.2,
  //   ch: 0.2,
  //   walkableSlopeAngle: 90,
  //   walkableHeight: 1.0,
  //   walkableClimb: 1,
  //   walkableRadius: 1,
  //   maxEdgeLen: 12,
  //   maxSimplificationError: 1.3,
  //   minRegionArea: 8,
  //   mergeRegionArea: 20,
  //   maxVertsPerPoly: 6,
  //   detailSampleDist: 6,
  //   detailSampleMaxError: 1,
  // };
  // navigationPlugin.createNavMesh([staticMesh], navmeshParameters);
  // staticMesh.position = spawnPoint;

  const staticMeshActualTerrain = scene.getMeshByName("ground");

  const staticMesh = BABYLON.MeshBuilder.CreateGround("groundNavTest", { width: 5000, height: 5000 }, scene);
  // const staticMesh = BABYLON.MeshBuilder.CreateGround("ground", { width: 500, height: 500 }, scene);
  spawnPoint.y = spawnPoint.y - 19;
  // spawnPoint.x = spawnPoint.x - 100;
  // spawnPoint.z = spawnPoint.z + 100;
  staticMesh.position = spawnPoint;

  staticMesh.computeWorldMatrix(true);
  staticMesh.isPickable = false;
  staticMesh.isVisible = false;

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
  //   navigationPlugin.createNavMesh([staticMesh], navmeshParametersLarge);
  // navigationPlugin.createNavMesh([staticMeshActualTerrain], navmeshParametersLarge);

  const navmeshSettingsWorking = {
    cs: 4.0, // Very large cell size for guaranteed processing
    ch: 3.0, // Matching cell height
    walkableSlopeAngle: 60, // More permissive slope angle
    walkableHeight: 3.0, // Increased height clearance
    walkableClimb: 2.0, // More permissive climbing
    walkableRadius: 2.0, // Larger radius
    maxEdgeLen: 30, // Much larger edges allowed
    maxSimplificationError: 4.0, // Aggressive simplification
    minRegionArea: 20, // Much larger minimum regions
    mergeRegionArea: 40, // Aggressive region merging
    maxVertsPerPoly: 3, // Keep triangles
    detailSampleDist: 30, // Very sparse sampling
    detailSampleMaxError: 10.0, // Very permissive error tolerance
  };
  const navmeshSettings = {
    cs: 10.0, // Increased cell size to reduce complexity
    ch: 10.0, // Increased cell height to match cell size
    walkableSlopeAngle: 45, // More realistic slope angle
    walkableHeight: 2.0, // Keep this for normal character height
    walkableClimb: 1.0, // Increased to handle more height variations
    walkableRadius: 1.0, // Increased radius to simplify walkable areas
    maxEdgeLen: 12, // Increased for better triangulation
    maxSimplificationError: 2.0, // Increased to allow more simplification
    minRegionArea: 3, // Slightly increased to avoid tiny regions
    mergeRegionArea: 10, // Increased to merge more regions
    maxVertsPerPoly: 3, // Reduced to force triangles (helps with triangulation)
    detailSampleDist: 3, // Increased sample distance
    detailSampleMaxError: 2, // Increased error tolerance
  };
  navigationPlugin.createNavMesh([staticMeshActualTerrain], navmeshSettings);

  //debug
  var navmeshdebug = navigationPlugin.createDebugNavMesh(scene);
  navmeshdebug.isPickable = false;
  navmeshdebug.name = "navmeshdebug";
  navmeshdebug.isVisible = false;
  // navmeshdebug.position = new BABYLON.Vector3(spawnPoint.x, spawnPoint.y + 0.01, spawnPoint.z);

  var matdebug = new BABYLON.StandardMaterial("matdebug", scene);
  matdebug.diffuseColor = new BABYLON.Color3(0.1, 0.2, 1);
  matdebug.alpha = 0.55;
  navmeshdebug.material = matdebug;
  // navmeshdebug.isVisible = false;

  addNPC("guard");

  async function addNPC(npcType) {
    const spawnPoint = new BABYLON.Vector3(1706.683, -805, 1277.427);
    await NPCPools.getInstance().addNPC(npcType, spawnPoint);

    //something to do with loading causes occasional shader glitches
    setTimeout(() => {
      addEnemyOutlineCamera(scene, PLAYER);
    }, 10000);
    // const spawnPoint2 = new BABYLON.Vector3(1606.683, -805, 1277.427);
    // await NPCPools.getInstance().addNPC(npcName, spawnPoint2);
  }

  vatNPCExampleExample();
  //crowd example
  async function vatNPCExampleExample() {
    const crowd = navigationPlugin.createCrowd(128, 0.6, scene); // 128 agents per batch is a sweet spot:contentReference[oaicite:1]{index=1}
    CROWD = crowd;
    // const npc = BABYLON.MeshBuilder.CreateBox("npc", { size: 10 }, scene);
    const npc = new BABYLON.TransformNode("npc");
    // const npcMesh = await loadMeshWithVAT(scene, "example", "/assets/characters/human_basemesh/", "remotePlayerForVAT_includessprint.glb", spawnPoint, "remotePlayerForVAT_vertexData.json");
    const npcMesh = await loadMeshWithVAT(scene, "example", "/assets/characters/enemy/npcs/npc1/", "npc1.glb", spawnPoint, "vertexData.json");
    // const animationRanges = [
    //   { from: 207, to: 344 },
    //   { from: 352, to: 727 },
    //   { from: 760, to: 927 },
    //   { from: 2000, to: 2000 }
    //   ];
    npcMesh.parent = npc;
    npc.npcMesh = npcMesh;
    npc.position = spawnPoint.clone();
    // npc.position.x += 40;
    // npc.position.z -= 50;
    //was nice position over by the water, this is a new one
    npc.position.x -= 200;
    npc.position.z -= 10;
    npc.position.y += 90;
    npc.rotation.y = BABYLON.Tools.ToRadians(60);
    npc.npcMesh.isPickable = false;
    npc.npcMesh.isInteractable = true;
    let health = new Health("EnemySimple", 100, npc);
    let testNpc = new NPC("id1", "Barry", scene, health);
    npc.NPC = testNpc;
    npc.NPC.home = npc.position;
    npc.NPC._transform = npc; //Todo refactor into one NPC class, NPC should be NPC info isntead
    // npc.NPC.npcMesh.nnamenpcMesh;
    npc.npcMesh.health = health;
    npc.npcMesh.health.rangeCheck = npc.npcMesh;
    PLAYER.target = npc.npcMesh;

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
        npc.turnObserver = scene.onBeforeRenderObservable.add(() => {
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
              scene.onBeforeRenderObservable.remove(npc.turnObserver);
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
    scene.onBeforeRenderObservable.add(() => {
      if (npc.NPC.isDead) {
        npc.npcMesh.bakedVertexAnimationManager.animationParameters = npc.NPC.combatAnim;
        return;
      }
      const dt = scene.getEngine().getDeltaTime() * 0.001; // seconds:contentReference[oaicite:3]{index=3}
      crowd.update(dt); // batched steering
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
      const toPlayer = player.position.subtract(npc.position);
      // console.log("toPlayer", toPlayer.lengthSquared() < sight_distance);
      const distanceSq = toPlayer.lengthSquared();
      const inSight = distanceSq < sight_distance && BABYLON.Vector3.Dot(toPlayer.normalize(), npc.forward) > 0.7;

      if (inSight) {
        if (!wasInView && cd <= 0 && !npc.NPC.isInConversation) {
          if (!npc.NPC.isInCombat) {
            //play sight greeting
            npc.NPC.playGreeting(scene);
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
  }
  debugClick();
  //debug click
  async function debugClick() {
    var crowd = navigationPlugin.createCrowd(10, 0.1, scene);
    var i;
    var agentParams = {
      radius: 10.1,
      height: 10.2,
      maxAcceleration: 70.0,
      maxSpeed: 200.0,
      collisionQueryRange: 20.5,
      pathOptimizationRange: 0.0,
      separationWeight: 5.0,
    };

    const npcMesh = await loadMeshWithVAT(scene, "example", "/assets/characters/enemy/npcs/npc1/", "npc1.glb", spawnPoint, "vertexData.json");

    for (i = 0; i < 10; i++) {
      var width = 10.2;
      // var agentCube = BABYLON.MeshBuilder.CreateBox("cube", { size: width, height: width }, scene);
      var agentCube = npcMesh.createInstance("npc");

      // create crowd of npcs here
      agentCube.isPickable = false;
      var targetCube = BABYLON.MeshBuilder.CreateBox("cube", { size: 0.1, height: 0.1 }, scene);
      var matAgent = new BABYLON.StandardMaterial("mat2", scene);
      var variation = Math.random();
      matAgent.diffuseColor = new BABYLON.Color3(0.4 + variation * 0.6, 0.3, 1.0 - variation * 0.3);
      agentCube.material = matAgent;
      var randomPos = navigationPlugin.getRandomPointAround(new BABYLON.Vector3(-2.0, 0.1, -1.8), 0.5);
      var transform = new BABYLON.TransformNode();
      // npcMesh.parent = transform;
      //agentCube.parent = transform;
      var agentIndex = crowd.addAgent(randomPos, agentParams, transform);
      agents.push({ idx: agentIndex, trf: transform, mesh: agentCube, target: targetCube });
    }

    var startingPoint;
    var currentMesh;
    var pathLine;
    var getGroundPosition = function () {
      var pickinfo = scene.pick(scene.pointerX, scene.pointerY);
      // console.log("Pick info:", pickinfo);
      console.log("Pick info:", pickinfo.pickedMesh.name);
      if (pickinfo.hit) {
        return pickinfo.pickedPoint;
      }

      return null;
    };

    var pointerDown = function (mesh) {
      currentMesh = mesh;
      startingPoint = getGroundPosition();
      if (startingPoint) {
        // we need to disconnect camera from canvas
        // setTimeout(function () {
        // camera.detachControl(canvas);
        // }, 0);
        var agents = crowd.getAgents();
        var i;
        for (i = 0; i < agents.length; i++) {
          var randomPos = navigationPlugin.getRandomPointAround(startingPoint, 1.0);
          crowd.agentGoto(agents[i], navigationPlugin.getClosestPoint(startingPoint));
        }
        var pathPoints = navigationPlugin.computePath(crowd.getAgentPosition(agents[0]), navigationPlugin.getClosestPoint(startingPoint));
        pathLine = BABYLON.MeshBuilder.CreateDashedLines("ribbon", { points: pathPoints, updatable: true, instance: pathLine }, scene);
        pathLine.isPickable = false;
      }
    };

    scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERDOWN:
          if (pointerInfo.pickInfo.hit) {
            pointerDown(pointerInfo.pickInfo.pickedMesh);
          }
          break;
      }
    });

    scene.onBeforeRenderObservable.add(() => {
      var agentCount = agents.length;
      for (let i = 0; i < agentCount; i++) {
        var ag = agents[i];
        ag.mesh.position = crowd.getAgentPosition(ag.idx);

        let vel = crowd.getAgentVelocity(ag.idx);
        crowd.getAgentNextTargetPathToRef(ag.idx, ag.target.position);
        if (vel.length() > 0.2) {
          vel.normalize();
          var desiredRotation = Math.atan2(vel.x, vel.z);
          ag.mesh.rotation.y = ag.mesh.rotation.y + (desiredRotation - ag.mesh.rotation.y) * 0.05;
        }
        const pos = ag.mesh.position;
        // const goal = crowd.getAgentTarget(ag.idx);

        const goalRadius = 40.0;
        if (startingPoint && BABYLON.Vector3.Distance(pos, startingPoint) < goalRadius) {
          crowd.agentGoto(ag.idx, pos); // Effectively stops it
        }
      }
    });
  }
}
async function setupSound(scene, camera) {
  let soundPresets = [
    { name: "Ice 3", path: "/assets/sounds/vfx/ability/ice_3.mp3" },
    { name: "Thunk", path: "/assets/sounds/ui/thunk.wav" },
  ];

  const audioEngine = await BABYLON.CreateAudioEngineAsync();
  // const gunshot = await BABYLON.CreateSoundAsync("gunshot", "/assets/sounds/vfx/fire/foom_0.wav");
  // Wait until audio engine is ready to play sounds.
  // await audioEngine.unlockAsync();
  // gunshot.play();
  // Create sounds here, but don't call `play()` on them, yet ...
  const sound = new SoundManager(scene);

  for (const soundPreset of soundPresets) {
    sound.createSound(soundPreset.name, soundPreset.path, "sfx", { volume: 0.8, loop: true });
    // sound.play("explosion", "sfx");
  }
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

  setTimeout(async function () {
    const ambience = await BABYLON.CreateStreamingSoundAsync("Sunny Explore", "/assets/sounds/background/sunny-day-ambiance.wav");
    // Wait until audio engine is ready to play sounds.
    await audioEngine.unlockAsync();
    ambience.loop = true;

    ambience.play();
    ambience.volume = 0.9;
    scene.activeCamera.sound.ambience = ambience;
  }, 100);

  setTimeout(async function () {
    scene.activeCamera.sound.setChannelVolume("music", 0.3);
    const sound = await BABYLON.CreateStreamingSoundAsync("Sunny Explore", "/assets/sounds/music/Sunny Explore.mp3");
    // Wait until audio engine is ready to play sounds.
    await audioEngine.unlockAsync();
    sound.volume = 0.15;
    sound.play();
    scene.activeCamera.sound.music = sound;

    setInterval(async function () {
      sound.play();
    }, 400000); // 100 seconds in milliseconds
  }, 15000);
}
function createStaticMesh(scene) {
  var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);

  // Materials
  var mat1 = new BABYLON.StandardMaterial("mat1", scene);
  mat1.diffuseColor = new BABYLON.Color3(1, 1, 1);

  var sphere = BABYLON.MeshBuilder.CreateSphere("sphere1", { diameter: 2, segments: 16 }, scene);
  sphere.material = mat1;
  sphere.position.y = 1;

  var cube = BABYLON.MeshBuilder.CreateBox("cube", { size: 1, height: 3 }, scene);
  cube.position = new BABYLON.Vector3(1, 1.5, 0);
  //cube.material = mat2;

  var mesh = BABYLON.Mesh.MergeMeshes([sphere, cube, ground]);
  return mesh;
}

// create an object type that can load a list of assets, then can run code to set them up

async function createSpider(scene, engine, spawnPoint) {
  const animationRanges = [
    { from: 7, to: 31 },
    { from: 33, to: 61 },
    { from: 63, to: 91 },
    { from: 93, to: 130 },
  ];

  const importResult = await BABYLON.ImportMeshAsync("https://raw.githubusercontent.com/RaggarDK/Baby/baby/arr.babylon", scene, undefined);

  const mesh = importResult.meshes[0];
  // mesh.scaling.x = 100;
  // mesh.scaling.y = 100;
  // mesh.scaling.z = 100;
  mesh.isAlwaysActive = true;
  mesh.alwaysSelectAsActiveMesh = true;
  // mesh.name = "spider";
  const baker = new BABYLON.VertexAnimationBaker(scene, mesh);

  baker.bakeVertexData([{ from: 0, to: animationRanges[animationRanges.length - 1].to, name: "My animation" }]).then((vertexData) => {
    const vertexTexture = baker.textureFromBakedVertexData(vertexData);

    const manager = new BABYLON.BakedVertexAnimationManager(scene);

    manager.texture = vertexTexture;
    manager.animationParameters = new BABYLON.Vector4(animationRanges[0].from, animationRanges[0].to, 0, 30);

    mesh.bakedVertexAnimationManager = manager;

    scene.registerBeforeRender(() => {
      // console.log("scene.getEngine().getDeltaTime()", scene.getEngine().getDeltaTime());
      manager.time += engine.getDeltaTime() / 1000.0;
    });
  });

  mesh.position = spawnPoint;
}

function debugTeleport(scene, dummyAggregate) {
  window.addEventListener("keydown", onKeyDown);
  function onKeyDown(event) {
    if (event.key === "=") {
      dummyAggregate.resetToSpawn();
    }
    if (event.key === "-") {
      dummyAggregate.jumpToSpawn();
    }
  }
}
function performance(scene) {
  // setTimeout(() => {
  //   scene.materials.forEach((material) => {
  //     if (material && !material.isFrozen) {
  //       material.freeze();
  //     }
  //   });
  // }, 1000 * 10);
  // scene.autoClear = false; // Color buffer
  // scene.autoClearDepthAndStencil = false; // Depth and stencil, obviously
}
function setupDustParticles(scene, spawnPoint) {
  // Create the particle system
  // Create a particle system
  const particleSystem = new BABYLON.ParticleSystem("particles", 1000);

  //Texture of each particle
  particleSystem.particleTexture = new BABYLON.Texture("./assets/textures/effects/flare.png");

  // Create a larger box emitter
  particleSystem.emitter = new BABYLON.Vector3(spawnPoint.x, spawnPoint.y + 2, spawnPoint.z);
  particleSystem.minEmitBox = new BABYLON.Vector3(-100, -10, -100); // Starting point of emission
  particleSystem.maxEmitBox = new BABYLON.Vector3(100, 10, 100); // End point of emission

  particleSystem.minEmitPower = 1;
  particleSystem.maxEmitPower = 3;

  particleSystem.minSize = 0.0;
  particleSystem.maxSize = 0.0;

  // Add fade effect
  particleSystem.minLifeTime = 3.0; // Minimum lifetime of particles
  particleSystem.maxLifeTime = 5.5; // Maximum lifetime of particles

  // Color gradient over lifetime
  particleSystem.addColorGradient(0, new BABYLON.Color4(0, 1, 1, 0.2)); // Start transparent
  particleSystem.addColorGradient(1.0, new BABYLON.Color4(0, 1, 1, 0.2)); // Fade out
  particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
  particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
  particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

  particleSystem.direction1 = new BABYLON.Vector3(-3, 1, 1.5);
  particleSystem.direction2 = new BABYLON.Vector3(3, -2, -1.5);

  particleSystem.addSizeGradient(0, 0.0); //size at start of particle lifetime
  particleSystem.addSizeGradient(0.3, 0.26); //size at end of particle lifetime
  particleSystem.addSizeGradient(0.7, 0.26);
  particleSystem.addSizeGradient(1, 0);

  particleSystem.start();
}

function setupTerrainEditor(scene) {
  const editor = new TerrainEditor(scene, {
    brushSize: 50,
    strength: 10.1,
  });

  editor.initialize(1000, 1000, 100);

  // To change tools, just call:
  // editor.setTool("raise"); // or "lower" or "flatten"
  // return editor.getMesh();
  return editor;
}

function setupEnvironment(scene) {
  scene.clearColor = new BABYLON.Color3.White();
  const environmentURL = "./assets/textures/lighting/environment.env";
  const environmentMap = BABYLON.CubeTexture.CreateFromPrefilteredData(environmentURL, scene);
  scene.environmentTexture = environmentMap;
  scene.environmentIntensity = 1.0;
}

function createSkydome(scene, spawnPoint) {
  var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 14000.0 }, scene);
  skybox.infiniteDistance = true;
  var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("./assets/textures/lighting/skybox", scene);
  skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
  skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
  // if upperBetaLimit is 3.13, then the skybox should be 0.8 to avoid white corner
  // skybox.scaling.x = 0.8;
  // skybox.scaling.y = 0.8;
  // skybox.scaling.z = 0.8;
  skybox.material = skyboxMaterial;
  // if no godrays
  // skyboxMaterial.reflectionTexture.level = 2.0;

  scene.onBeforeRenderObservable.add(() => {
    // Adjust the rotation speed by changing the value (smaller = slower)
    skybox.rotation.y += 0.00003;
  });
  return skybox;

  // const skyDome = BABYLON.MeshBuilder.CreateSphere("skyDome", { segments: 8, diameter: 14000 }, scene);
  // //The sphere normals point outward by default. To make the texture visible from the inside
  // skyDome.scaling.x = -1;
  // skyDome.position = spawnPoint.clone();

  // const skyMaterial = new BABYLON.StandardMaterial("skyMaterial", scene);
  // skyMaterial.backFaceCulling = false; // Ensure inside is visible
  // skyMaterial.diffuseTexture = new BABYLON.Texture("/assets/textures/lighting/sky/testsky2.png", scene);
  // skyMaterial.diffuseTexture.coordinatesMode = BABYLON.Texture.SPHERICAL_MODE;
  // skyMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  // skyMaterial.emissiveTexture = skyMaterial.diffuseTexture;

  // skyDome.material = skyMaterial;

  // return skyDome;
}

function setupLighting(scene, terrain) {
  // var light0 = new BABYLON.HemisphericLight(
  //   "hemiLight",
  //   new BABYLON.Vector3(0, 1, 0),
  //   scene
  // );
  // light0.intensity = 0.0;

  var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 10 }, scene);
  sphere.position.y = 1;

  const light = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(-2, -1, -2), scene);
  light.position = new BABYLON.Vector3(20, -10, 20);
  light.direction = new BABYLON.Vector3(9.3, -11, 10);

  light.intensity = 0.4;

  let shouldMove = false;

  if (shouldMove) {
    // Track light control state
    let isAutoRotating = true;
    let isManuallyControlling = false;
    // Handle T key press to toggle control mode
    scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN && kbInfo.event.key === "t") {
        isAutoRotating = !isAutoRotating;
        isManuallyControlling = !isAutoRotating;
      }
    });

    // Handle mouse input for manual control
    scene.onPointerMove = (evt) => {
      if (isManuallyControlling) {
        const normalizedX = (evt.clientX / scene.getEngine().getRenderWidth()) * 2 - 1;
        const normalizedY = (evt.clientY / scene.getEngine().getRenderHeight()) * 2 - 1;

        light.direction.x = normalizedX * 20;
        light.direction.y = -Math.abs(normalizedY * 20);

        sphere.position.x = -light.direction.x;
        sphere.position.y = -light.direction.y;
        sphere.position.z = light.direction.z;
      }
    };

    // Handle click to lock direction
    scene.onPointerDown = (evt) => {
      if (evt.button === 0 && isManuallyControlling) {
        // Left click
        isManuallyControlling = false;
      }
    };

    // Auto-rotation update
    scene.onBeforeRenderObservable.add(() => {
      if (isAutoRotating) {
        light.direction.x = Math.sin(Date.now() / 2000) * 20;
        light.direction.z = 0;
        light.direction.y = -Math.abs(Math.cos(Date.now() / 2000) * 20);
        sphere.position.x = -light.direction.x;
        sphere.position.y = -light.direction.y;
        sphere.position.z = light.direction.z;
      }
    });
  }

  // const shadowGenerator = new BABYLON.CascadedShadowGenerator(
  //   1024,
  //   light,
  //   false,
  //   undefined,
  //   false
  // );
  // shadowGenerator.usePercentageCloserFiltering = false;
  // shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
  // shadowGenerator.bias = 0.01;
  // shadowGenerator.normalBias = 0;
  // /** KEEP THIS LOW TO AVOID STRIPES */
  // shadowGenerator.shadowMaxZ = 100;

  // return shadowGenerator;

  // const hemiLight = new BABYLON.HemisphericLight(
  //   "hemiLight",
  //   new BABYLON.Vector3(0, 1, 0),
  //   scene
  // );
  // hemiLight.intensity = 0.7;
  // hemiLight.diffuse = new BABYLON.Color3(0.9, 0.9, 1.0); // Slightly bluish sky light
  // hemiLight.groundColor = new BABYLON.Color3(0.4, 0.3, 0.2); // Brownish ground reflection
  // hemiLight.specular = new BABYLON.Color3(0.5, 0.5, 0.5);

  // const light = new BABYLON.DirectionalLight(
  //   "light0",
  //   new BABYLON.Vector3(-800, -1400, -1000),
  //   scene
  // );
  // light.intensity = 1.7;
  // // light.shadowMinZ = 1800;
  // // light.shadowMinZ = 2100;
  // light.shadowMinZ = 1500;
  // light.shadowMaxZ = 2300;
  // light.diffuse = new BABYLON.Color3(1, 1, 1);

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
  // shadowGenerator.farPlane = 10000;
  shadowGenerator.farPlane = 10000;
  shadowGenerator.minZ = -200;
  shadowGenerator.maxZ = 200;
  shadowGenerator.shadowMaxZ = 100;
  shadowGenerator.addShadowCaster(shadowCaster);
}

function setupShadows2(light, shadowCaster) {
  const shadowGenerator = new BABYLON.CascadedShadowGenerator(1024, light, false, undefined, false);
  shadowGenerator.usePercentageCloserFiltering = false;
  shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
  shadowGenerator.bias = 0.01;
  shadowGenerator.normalBias = 0;
  shadowGenerator.darkness = 0.6;
  // shadowGenerator.shadowMaxZ = 100;
  shadowGenerator.shadowMaxZ = 1200;

  shadowGenerator.addShadowCaster(shadowCaster);
  shadowGenerator.toggleShadows = function (enabled) {
    if (enabled) {
      light.shadowEnabled = true;
      shadowGenerator.darkness = 0.61;
    } else {
      shadowGenerator.darkness = 1.0;
      shadowGenerator.shadowMaxZ = 1201;
      light.shadowEnabled = false;
    }
  };
  SHADOW_GENERATOR = shadowGenerator;
}

function setupPostProcessing(scene, camera) {
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
  scene.fogColor = new BABYLON.Color3(67 / 255, 136 / 255, 255 / 255);
  scene.fogDensity = 0.0002;
  scene.fogDensity = 0.0001;

  // scene.fogDensity = 0.00005;
  const pipeline = new BABYLON.DefaultRenderingPipeline(
    "default", // The name of the pipeline
    true, // Do you want HDR textures?
    scene, // The scene linked to
    [camera] // The list of cameras to be attached to
  );

  //attemp to get MSAA back, didn't work.
  // if (scene.getEngine().webGLVersion === 2) {
  //   pipeline.samples = 4;                   // 2, 4 or 8 – check engine.getCaps().maxSamples
  //   scene.prePassRenderer?.renderTargets.forEach(rt => rt.samples = 4); // if you enabled PrePass
  // }
  pipeline.imageProcessingEnabled = true;

  // Configure effects
  pipeline.samples = 4; // MSAA anti-aliasing
  // pipeline.fxaaEnabled = false; // Enable FXAA

  pipeline.bloomEnabled = true; // Enable bloom
  pipeline.bloomThreshold = 1.85; //only affect sun not clouds

  // interstng effect makes lighting nices and more uniform, might want to darken again
  // pipeline.bloomThreshold = 0.0; //effect evrything cool feeling on sunlight on player back and ground but blurry
  pipeline.bloomThreshold = 0.006; //less blurry
  // pipeline.bloomThreshold = 0.02; //less blurry
  // pipeline.bloomThreshold = 1.5000; // good for cloud variations less blurry
  pipeline.bloomWeight = 0.2; //affect ground

  // make this adjustable in atmospheric settign viewport setting

  const imgProc = pipeline.imageProcessing;

  // Apply contrast and exposure adjustments
  // imgProc.contrast = 2.0;
  // imgProc.exposure = 4.0;
  // imgProc.contrast = 2.3;
  // imgProc.exposure = 4.3;
  imgProc.contrast = 2.45;
  imgProc.exposure = 4.45;

  imgProc.toneMappingEnabled = true;
  imgProc.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL;

  // Apply vignette effect
  imgProc.vignetteEnabled = true;
  imgProc.vignetteWeight = 2.6;
  imgProc.vignetteColor = new BABYLON.Color4(0, 0, 0, 1);
  imgProc.vignetteBlendMode = BABYLON.ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY;

  // pipeline.sharpenEnabled = true;
  // pipeline.sharpenAmount = 0.15;
  // pipeline.sharpenColorAmount = 1.0;

  // let colorCorrection = new BABYLON.ColorCorrectionPostProcess("color_correction", "/assets/textures/postprocess/lut-terrain-5.png", 1.0, camera);
  // colorCorrection.samples = 4;

  COLOR_CORRECTION = new BABYLON.ColorCorrectionPostProcess("color_correction", "/assets/textures/postprocess/lut-terrain-5.png", 1.0, camera);
  COLOR_CORRECTION.samples = 4;

  return pipeline;
}

function setupColorCorrection(camera) {
  // Create array of available LUT images
  const lutImages = [
    "./assets/textures/postprocess/lut-default.png",
    "./assets/textures/postprocess/cutoff-start-end.png",
    "./assets/textures/postprocess/lut-inn.png",
    "./assets/textures/postprocess/lut-terrain-2.png",
    "./assets/textures/postprocess/lut-terrain-3.png",
    "./assets/textures/postprocess/lut-terrain-4.png",
    "./assets/textures/postprocess/lut-terrain-5.png",
    "./assets/textures/postprocess/lut-terrain-small.png",
    "./assets/textures/postprocess/lut-grade.png",
    "./assets/textures/postprocess/lut-highcontrast.png",
    // Add more LUT images as needed
  ];

  // Create initial color correction post process
  let colorCorrection = new BABYLON.ColorCorrectionPostProcess("color_correction", lutImages[0], 1.0, camera);

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
  // trail.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  // trail.scaling.scaleInPlace(1, 1, 1);
  trail.isPickable = false;

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
