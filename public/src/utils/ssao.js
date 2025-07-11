export function setupSSAO(scene, camera, debug = false, mobile = false) {
  const ssao = new BABYLON.SSAO2RenderingPipeline("ssao", scene, {
    ssaoRatio: mobile ? 0.5 : 1.0, // Half resolution on mobile // Ratio of the SSAO post-process, between 0 and 1
    blurRatio: mobile ? 0.5 : 1, // Ratio of the blur post-process
  });
  ssao.radius = 6; // Radius of occlusion sampling
  ssao.totalStrength = 1.5; // Overall strength of the SSAO effect
  ssao.expensiveBlur = true; // Apply a better quality blur
  ssao.samples = 16; // Number of samples used for occlusion calculation
  ssao.maxZ = 700; // Maximum distance to sample for occlusion

  // Mobile-optimized defaults
  if (mobile) {
    ssao.radius = 3;
    ssao.samples = 8;
    ssao.maxZ = 300;
    ssao.expensiveBlur = false;
    ssao.totalStrength = 1.2;
  }

  SSAO_GLOBAL = ssao;
  SSAO_GLOBAL.enabled = true; // Initial state
  SSAO_GLOBAL.setEnabled = function (enabled) {
    this.enabled = enabled;
    if (enabled) {
      scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);
    } else {
      scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline("ssao", camera);
    }
  };

  scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);

  if (debug) {
    // Load GUI library and add controls
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
}

function setupGI(scene, engine, lights, meshes) {
  // TODO set defaultRSMTextureRatio to 30 for mobile
  const defaultRSMTextureRatio = 8;
  const defaultGITextureRatio = 2;

  const outputDimensions = {
    width: engine.getRenderWidth(true),
    height: engine.getRenderHeight(true),
  };

  const rsmTextureDimensions = {
    width: Math.floor(engine.getRenderWidth(true) / defaultRSMTextureRatio),
    height: Math.floor(engine.getRenderHeight(true) / defaultRSMTextureRatio),
  };

  const giTextureDimensions = {
    width: Math.floor(engine.getRenderWidth(true) / defaultGITextureRatio),
    height: Math.floor(engine.getRenderHeight(true) / defaultGITextureRatio),
  };

  // high performance settings
  // texture ratio 45
  // radius 0.65   - 5.4
  // intesity 0.004
  // edge artifact correction 0.41
  // number of sampes 100-1000 -
  const giRSMs = [];

  giRSMs.push(new BABYLON.GIRSM(new BABYLON.ReflectiveShadowMap(scene, lights[1], rsmTextureDimensions)));

  giRSMs.forEach((girsm) => (girsm.rsm.forceUpdateLightParameters = true)); // for the demo, don't do this in production!

  const giRSMMgr = new BABYLON.GIRSMManager(scene, outputDimensions, giTextureDimensions, 2048);

  giRSMMgr.addGIRSM(giRSMs);

  giRSMMgr.enable = true;

  meshes.forEach((mesh) => {
    giRSMs.forEach((girsm) => girsm.rsm.addMesh(mesh));
    if (mesh.material) {
      giRSMMgr.addMaterial(mesh.material);
      // mesh.material.environmentIntensity = 0;
      // mesh.material.directIntensity = 0;
      mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);

      // ground for more natural spotlight
      // mesh.material.metallic = 0.5;
      // mesh.material.directIntensity = 0.0100;

      // old starting levels for GI
      mesh.material.metallic = 0.8;
      mesh.material.roughness = 1.0;
      mesh.material.directIntensity = 0.15;

      // new inn lighting
      mesh.material.metallic = 0.6;
      mesh.material.roughness = 1.0;
      mesh.material.directIntensity = 0.15;

      // only GI
      // mesh.material.metallic = 0.0;
      // mesh.material.roughness = 1.0;
      // mesh.material.directIntensity = 0.09;

      // mesh.scaling.x = -mesh.scaling.x;

      // when not using gi,
      // mesh.material.metallic = 1.0;
      // mesh.material.roughness = 1.0;
      // mesh.material.directIntensity = 0.15;
    }
  });

  giRSMMgr.giRSM.forEach((giRSM) => {
    // Mixed GI and Normal
    giRSM.numSamples = 400;
    giRSM.intensity = 0.01;
    giRSM.radius = 0.35;

    // GI only
    // giRSM.numSamples = 1000;
    // giRSM.intensity = 0.001;
    // giRSM.radius = 0.15;
  });

  // giRSMMgr.blurKernel = 20;

  let guiParams = {
    rsmTextureRatio: 8,
    giTextureRatio: 2,
  };

  const resize = () => {
    outputDimensions.width = engine.getRenderWidth(true);
    outputDimensions.height = engine.getRenderHeight(true);

    rsmTextureDimensions.width = Math.floor(engine.getRenderWidth(true) / guiParams.rsmTextureRatio);
    rsmTextureDimensions.height = Math.floor(engine.getRenderHeight(true) / guiParams.rsmTextureRatio);

    giTextureDimensions.width = Math.floor(engine.getRenderWidth(true) / guiParams.giTextureRatio);
    giTextureDimensions.height = Math.floor(engine.getRenderHeight(true) / guiParams.giTextureRatio);

    giRSMs.forEach((girsm) => girsm.rsm.setTextureDimensions(rsmTextureDimensions));
    giRSMMgr.setOutputDimensions(outputDimensions);
    giRSMMgr.setGITextureDimensions(giTextureDimensions);
  };

  engine.onResizeObservable.add(() => {
    resize();
  });

  resize();

  GIDebug(scene, giRSMMgr, engine);
}
