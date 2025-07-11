import { createNight } from "./scenes/night.js";
import { createDayDynamicTerrain } from "./scenes/day.js";
import { createOutdoor } from "./scenes/outdoor.js";
import { createRoom } from "./scenes/room.js";
import { createUnderground } from "./scenes/underground.js";
import { createTown } from "./scenes/town.js";
import { createRoomGI } from "./scenes/roomGI.js";
import { createInn } from "./scenes/inn.js";
import { createBuilder } from "./scenes/builder.js";
import { createTraining } from "./scenes/training.js";
import { createHallway } from "./scenes/hallway.js";
import { createTerrain } from "./scenes/terrain.js";
import { createMapMaker } from "./scenes/mapMaker.js";
import { createTerrainPatch } from "./scenes/terrainPatch.js";
import { createInteriorBuilder } from "./scenes/interiorBuilder.js";
import { createVatAnimationTest } from "./scenes/vatAnimationTest.js";
import { createLava } from "./scenes/lava.js";
import { createCharacterCreator } from "./scenes/characterCreator.js";
import { createCastle } from "./scenes/castle.js";
import { CharacterData } from "./scenes/characterCreator.js";
import { createTerrainTiles } from "./scenes/terrainTiles.js";
class SceneManager {
  constructor(canvasId, engine) {
    this.canvas = document.getElementById(canvasId);
    this.engine = new BABYLON.Engine(this.canvas, true, {
      // audioEngine: true   // legacy engine back on
      //   preserveDrawingBuffer: true,
      //   stencil: true,
      //   disableWebGL2Support: false   // make sure we don't force WebGL1
      powerPreference: "low-power",
    });

    console.log("WebGL version:", this.engine.webGLVersion);
    this.guiTextures = new Map();
    this.scenes = [];
    this.activeScene = null;
    this.sceneCreators = {
      night: createNight,
      day: createDayDynamicTerrain,
      outdoor: createOutdoor,
      room: createRoom,
      underground: createUnderground,
      town: createTown,
      roomGI: createRoomGI,
      inn: createInn,
      builder: createBuilder,
      training: createTraining,
      hallway: createHallway,
      terrain: createTerrain,
      mapMaker: createMapMaker,
      terrainPatch: createTerrainPatch,
      interiorBuilder: createInteriorBuilder,
      vatAnimationTest: createVatAnimationTest,
      lava: createLava,
      castle: createCastle,
      charactercreator: createCharacterCreator,
      terrainTiles: createTerrainTiles,
    };
  }

  async loadScene(sceneCreationFunction) {
    const scene = await sceneCreationFunction(this.engine);
    scene.damagePopupAnimationGroup = new BABYLON.AnimationGroup("popupAnimation", scene);
    this.scenes.push(scene);
    // this.guiTextures.set(scene, new BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene));
    // this.activeGUI = this.guiTextures.get(this.activeScene);

    return scene;
  }

  async switchToScene(index) {
    if (this.activeScene) {
      this.engine.stopRenderLoop();
      if (DEBUG) this.activeScene.debugLayer.hide();
      //   this.activeScene.dispose(); // Optional: dispose only if not planning to return to this scene
      // stop all sounds.
      this.activeScene.activeCamera.sound.stopAll();
    }
    this.activeScene = this.scenes[index];
    // this.activeGUI = this.guiTextures.get(this.activeScene);
    this.engine.runRenderLoop(() => {
      this.activeScene.render();
    });

    // load scene ambience
    if (this.activeScene.activeCamera.sound?.ambience) {
      this.activeScene.activeCamera.sound.ambience.play();
    }
    if (this.activeScene.activeCamera.sound?.music) {
      this.activeScene.activeCamera.sound.music.play();
    }
    if (DEBUG) this.activeScene.debugLayer.show();
    // Update URL with current scene
    // this.updateUrlWithScene(index);
  }
  // Add this new method to update the URL
  updateUrlWithScene(sceneIndex) {
    // Find the scene name by index
    const sceneNames = Object.keys(this.sceneCreators);
    const currentSceneName = sceneNames[sceneIndex];

    if (currentSceneName) {
      const url = new URL(window.location);
      url.searchParams.set("scene", currentSceneName);

      // Update URL without reloading the page
      window.history.replaceState({}, "", url);
    }
  }

  // todo map of scenes near the current scene
  // in this case, just load starting zone
  async start() {
    const urlParams = new URLSearchParams(window.location.search);

    const debugParam = urlParams.get("debug");
    if (debugParam === "true") {
      DEBUG = true;
    }

    const modeParam = urlParams.get("mode");
    if (modeParam === "adventure") {
      MODE = 1;
      const characterData = localStorage.getItem("selectedCharacter");
      if (characterData) {
        CHARACTER_DATA = JSON.parse(characterData);
        console.log(character.name);
      } else {
        console.log("No character data found, making new character");
        CHARACTER_DATA = new CharacterData();
      }
    }

    const sceneParam = urlParams.get("scene");
    const defaultScene = this.sceneCreators[sceneParam] || this.sceneCreators.castle; // Default to outdoor if no valid scene parameter

    await this.loadScene(defaultScene);
    await this.switchToScene(0);
    this.canvas.focus();

    window.addEventListener("keydown", (ev) => {
      if (ev.key === "\\") {
        ev.preventDefault(); // Prevent Tab from changing focus
        if (this.activeScene.debugLayer.isVisible()) {
          this.activeScene.debugLayer.hide();
        } else {
          this.activeScene.debugLayer.show();
        }
      }
    });

    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    this.setupSceneDataLoading(urlParams.get("sceneData"));
    this.setupPlayModeFromUrl(urlParams.get("mode"));

    let timeout = 100;
    if (!FAST_RELOAD) timeout = 3500;
    setTimeout(() => {
      this.canvas.classList.add("visible");
    }, timeout);

    const endTime = performance.now();
    const sceneLoadTime = endTime - startTime;
    const sceneOnly = sceneLoadTime - domLoadTime;
    console.log(`Scene loaded in ${sceneLoadTime.toFixed(2)} milliseconds`);
    console.log(`Scene minus dom ${sceneOnly.toFixed(2)} milliseconds`);

    // Uncomment this for key based scene switching.
    // see a little stutter when doing this, move to webworker maybe
    // await this.loadScene(this.sceneCreators["inn"]); //make sure not blocking the main thread
    // // // await this.loadScene(this.sceneCreators["builder"]);
    // // // Setup scene switching logic, e.g., based on user input or game events
    // window.addEventListener("keydown", (e) => {
    //   if (e.key === "i") {
    //     this.switchToScene(0);
    //   } else if (e.key === "o") {
    //     this.switchToScene(1);
    //   } else if (e.key === "p") {
    //     this.switchToScene(2);
    //   }
    // });

    const loading = document.getElementById("loading");
    if (loading) {
      loading.style.opacity = 0;
      setTimeout(() => {
        loading.style.display = "none";
      }, 1000);
    }
  }

  //setup scene loading json from url
  setupSceneDataLoading(sceneDataPath) {
    setTimeout(() => {
      // get file name from url
      // load json from url /data
      const fullPath = sceneDataPath ? `/data/sceneData/${sceneDataPath}` : "/data/sceneData/test.json";
      // const fullPath = `/data/sceneData/${sceneDataPath}`;

      fetch(fullPath)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load scene data: ${response.statusText}`);
          }
          return response.json();
        })
        .then((json) => {
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

          // const sceneData = parseWithBigInt(response.text);

          console.log(json);

          // Do something with jsonData, e.g., initialize scene
          // this.initializeScene(jsonData);
          window.STREAMER.addObjectsToScene(json.objects);
        })
        .catch((error) => {
          console.error("Error loading scene data:", error);
        });
    }, 1000);
  }

  //setup playmode
  setupPlayModeFromUrl(mode) {
    setTimeout(() => {
      // get file name from url
    }, 1000);
  }
}

export default SceneManager;
