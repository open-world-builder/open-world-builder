export function createEffectEditor(containerId, scene) {
  // Initialize Vue component
  return Vue.createApp({
    template: `
            <div v-show="isVisible" id="effect-editor">
                <div id="controls">
                    <h3>Presets</h3>
                    <input type="text" v-model="search" placeholder="Search presets..." class="search-box" />

                    <div class="preset-list">
                        <button v-for="preset in filteredPresets" 
                                :key="preset.name" 
                                @click="applyPreset(preset)" 
                                :class="{ 'selected': currentPreset === preset.name }">
                            {{ preset.name }}
                        </button>
                    </div>

                    <br /><br />
                    <div>
                        <label>
                            <input type="checkbox" v-model="circularMotion" /> 
                            Enable Circular Motion
                        </label>
                    </div>

                    <div v-if="circularMotion" class="parameter-controls">
                        <label>Radius: {{ radius.toFixed(1) }}</label>
                        <input type="range" v-model.number="radius" min="1" max="10" step="0.1" />
                    </div>

                    <br /><br />
                    <button @click="exportPS">Export Effects</button>

                    <div v-if="activePreset" class="parameter-controls">
                        <div>
                            <label>Emit Rate: {{ activePreset.emitRate }}</label>
                            <input type="range" v-model.number="activePreset.emitRate" 
                                   min="100" max="1000" @input="rebuild" />
                        </div>

                        <div>
                            <label>Size: {{ activePreset.size.toFixed(2) }}</label>
                            <input type="range" v-model.number="activePreset.size" 
                                   min="0.2" max="2" step="0.1" @input="rebuild" />
                        </div>

                        <div>
                            <label>Lifetime: {{ activePreset.lifetime.toFixed(2) }}</label>
                            <input type="range" v-model.number="activePreset.lifetime" 
                                   min="0.2" max="2" step="0.1" @input="rebuild" />
                        </div>
                    </div>
                </div>
            </div>
        `,

    data() {
      return {
        isVisible: false,
        presets: [
          { name: "fire" }, { name: "blueFire" }, { name: "rain" },
          { name: "smoke" }, { name: "sun" }, { name: "sun2" }, { name: "explosion" },
          { name: "explosionMinimal" }

        ],
        activePreset: null,
        currentPreset: null,
        currentSet: null,
        search: "",
        circularMotion: false,
        angle: 0,
        radius: 5,
      };
    },

    computed: {
      filteredPresets() {
        return this.search ? this.presets.filter((p) => p.name.toLowerCase().includes(this.search.toLowerCase())) : this.presets;
      },
    },

    methods: {
      show() {
        this.isVisible = true;
      },

      hide() {
        this.isVisible = false;
      },

      toggle() {
        this.isVisible = !this.isVisible;
      },

      async applyPreset(preset) {
        this.currentPreset = preset.name;
        if (this.currentSet) {
          this.currentSet.dispose(true);
        }
        BABYLON.ParticleHelper.CreateAsync(preset.name, scene).then((set) => {
          this.currentSet = set;
          set.start();
        });
      },

      rebuild() {
        if (this.currentSet) {
          this.currentSet.dispose(true);
        }
        BABYLON.ParticleHelper.CreateAsync(this.currentPreset, scene).then((set) => {
          this.currentSet = set;
          set.start();
        });
      },

      exportPS() {
        const systems = scene.particleSystems;
        if (!systems.length) {
          alert("No effects to export");
          return;
        }

        try {
          const exportData = {
            systems: systems.map((ps) => ps.serialize()),
          };

          const json = JSON.stringify(exportData, null, 2);
          const link = document.createElement("a");
          link.href = "data:text/json;charset=utf-8," + encodeURIComponent(json);
          link.download = "effect.json";
          link.click();
        } catch (error) {
          console.error("Export failed:", error);
          alert("Failed to export effects");
        }
      },
      setupPostProcess() {
        scene.clearColor = new BABYLON.Color3.White();
        const environmentURL = "/assets/textures/lighting/environment.env";
        const environmentMap = BABYLON.CubeTexture.CreateFromPrefilteredData(environmentURL, scene);
        scene.environmentTexture = environmentMap;
        scene.environmentIntensity = 0.35;

        var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
        skybox.infiniteDistance = true;
        var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("/assets/textures/lighting/skybox", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;
        // if no godrays
        // skyboxMaterial.reflectionTexture.level = 2.0;

        scene.onBeforeRenderObservable.add(() => {
          // Adjust the rotation speed by changing the value (smaller = slower)
          skybox.rotation.y += 0.00003;
        });

        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogColor = new BABYLON.Color3(15 / 255, 15 / 255, 27 / 255);
        scene.fogDensity = 0.0026;

        const pipeline = new BABYLON.DefaultRenderingPipeline(
          "default", // The name of the pipeline
          true, // Do you want HDR textures?
          scene, // The scene linked to
          [scene.activeCamera] // The list of cameras to be attached to
        );

        // Configure effects
        pipeline.samples = 4; // MSAA anti-aliasing
        pipeline.fxaaEnabled = true; // Enable FXAA

        pipeline.bloomEnabled = true; // Enable bloom
        pipeline.bloomThreshold = 0.006; //less blurry
        pipeline.bloomWeight = 0.2; //affect ground

        const imgProc = pipeline.imageProcessing;

        imgProc.contrast = 2.3;
        imgProc.exposure = 4.3;
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
        let colorCorrection = new BABYLON.ColorCorrectionPostProcess("color_correction", "/assets/textures/postprocess/lut-terrain-5.png", 1.0, scene.activeCamera);
        //   const ssao = new BABYLON.SSAO2RenderingPipeline("ssao", scene, {
        //     ssaoRatio: 1.0, // Ratio of the SSAO post-process, between 0 and 1
        //     blurRatio: 1, // Ratio of the blur post-process
        //   });
        //   ssao.radius = 6; // Radius of occlusion sampling
        //   ssao.totalStrength = 1.5; // Overall strength of the SSAO effect
        //   ssao.expensiveBlur = true; // Apply a better quality blur
        //   ssao.samples = 16; // Number of samples used for occlusion calculation
        //   ssao.maxZ = 700; // Maximum distance to sample for occlusion
        //   scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);
      },
    },

    mounted() {
      BABYLON.ParticleHelper.BaseAssetsUrl = "/assets/util/particles";

      this.setupPostProcess();
      // Setup circular motion update
      scene.onBeforeRenderObservable.add(() => {
        if (this.currentSet && this.circularMotion) {
          const offset = {
            x: this.radius * Math.cos(this.angle),
            z: this.radius * Math.sin((this.angle += 0.01)),
          };

          this.currentSet.systems.forEach((system) => {
            system.worldOffset.x = offset.x;
            system.worldOffset.z = offset.z;
          });
        }
      });
    },
  });
}
