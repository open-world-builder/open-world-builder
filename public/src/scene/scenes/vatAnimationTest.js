export async function createVatAnimationTest(engine) {
  // This creates a basic Babylon Scene object (non-mesh)
  var scene = new BABYLON.Scene(engine);

  // This creates and positions a free camera (non-mesh)
  var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, 10), scene);

  // This targets the camera to scene origin
  camera.setTarget(BABYLON.Vector3.Zero());

  //   // This attaches the camera to the canvas
  //   //   camera.attachControl(canvas, true);

  //   // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  //   var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  //   // Default intensity is 1. Let's dim the light a small amount
  //   light.intensity = 2;

  //   const animationRanges = [
  //     { from: 7, to: 31 },
  //     { from: 33, to: 61 },
  //     { from: 63, to: 91 },
  //     { from: 93, to: 130 },
  //   ];

  //   const importResult = await BABYLON.ImportMeshAsync("https://raw.githubusercontent.com/RaggarDK/Baby/baby/arr.babylon", scene, undefined);

  //   const mesh = importResult.meshes[0];
  //   const baker = new BABYLON.VertexAnimationBaker(scene, mesh);

  //   baker.bakeVertexData([{ from: 0, to: animationRanges[animationRanges.length - 1].to, name: "My animation" }]).then((vertexData) => {
  //     const vertexTexture = baker.textureFromBakedVertexData(vertexData);

  //     const manager = new BABYLON.BakedVertexAnimationManager(scene);

  //     manager.texture = vertexTexture;
  //     manager.animationParameters = new BABYLON.Vector4(animationRanges[0].from, animationRanges[0].to, 0, 30);

  //     mesh.bakedVertexAnimationManager = manager;

  //     scene.registerBeforeRender(() => {
  //       manager.time += engine.getDeltaTime() / 1000.0;
  //     });
  //   });

  //   await createSpider(scene, engine);

  return scene;
}

async function createSpider(scene, engine) {
  const animationRanges = [
    { from: 7, to: 31 },
    { from: 33, to: 61 },
    { from: 63, to: 91 },
    { from: 93, to: 130 },
  ];

  const importResult = await BABYLON.ImportMeshAsync("https://raw.githubusercontent.com/RaggarDK/Baby/baby/arr.babylon", scene, undefined);

  const mesh = importResult.meshes[0];
  mesh.scaling = new BABYLON.Vector3(100, 100, 100);
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
}
