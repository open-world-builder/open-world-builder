// bake the VAT to disk
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

export async function loadMeshWithVAT(scene, name = "example", folder = "/assets/characters/human_basemesh/", path = "remotePlayerForVAT_includessprint.glb", defaultSpawnPosition, vatJsonPath = "remotePlayerForVAT_vertexData.json") {
  const { meshes, skeletons, animationGroups } = await BABYLON.SceneLoader.ImportMeshAsync(
    "", // root url
    folder,
    path,
    //   "remotePlayerForVAT.glb",
    scene
  );

  //   const mesh = meshes.find((mesh) => mesh.name === "base");
  //   console.log("base mesh", mesh);
  const mesh = meshes[0].getChildMeshes()[0];
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

  //Load a pre-baked vat json at runtime
  let vatPath = folder + vatJsonPath;
  fetch(vatPath)
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

      // scene.registerBeforeRender(() => {
      //   manager.time += scene.getEngine().getDeltaTime() / 1000.0;
      // });

      //set animation as idle
      // mesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(1018, 1081, 0, 100);
      mesh.bakedVertexAnimationManager.animationParameters = new BABYLON.Vector4(0, 820, 0, 200);
    });

  mesh.numBoneInfluencers = 4;
  mesh.parent = null;
  // mesh.position.y = defaultSpawnPosition.y;
  // mesh.position.x = defaultSpawnPosition.x;
  // mesh.position.z = defaultSpawnPosition.z;

  // mesh.scaling.x = 100;
  // mesh.scaling.y = 100;
  // mesh.scaling.z = 100;
  if (mesh.name === "base") {
    mesh.scaling.x = 0.036;
    mesh.scaling.y = 0.036;
    mesh.scaling.z = 0.036;
    mesh.rotation.x = BABYLON.Tools.ToRadians(90);

    mesh.applyFog = false;
    mesh.material._metallicF0Factor = 0;
    mesh.material.environmentIntensity = 0.7;
    mesh.material.directIntensity = 10.7;
  } else {
    mesh.scaling.x = 10;
    mesh.scaling.y = 10;
    mesh.scaling.z = 10;
    mesh.applyFog = false;
  }

  mesh.isPickable = false;

  // window.SCENE_MANAGER.activeScene.registerBeforeRender(() => {
  //     const deltaTime = window.SCENE_MANAGER.activeScene.getEngine().getDeltaTime() / 1000;
  //     this.update(deltaTime);
  // });

  return mesh;
}

// exampleVATLoad
// vatLoad("example");

// this.createPlayerInstance(window.SCENE_MANAGER.activeScene);
// // TODO: Consider removing, this might be rendering twice
// window.SCENE_MANAGER.activeScene.registerBeforeRender(() => {
//     const deltaTime = window.SCENE_MANAGER.activeScene.getEngine().getDeltaTime() / 1000;
//     this.update(deltaTime);
// });
