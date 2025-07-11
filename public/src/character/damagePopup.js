import SceneManager from "../scene/SceneManager.js";

// Assuming you have a global variable or singleton pattern to access the instance of SceneManager
let sceneManager; // This will be initialized with the SceneManager instance
let damageAndHealthBarOffset = 5;
// let damageAndHealthBarOffsetScreenSpace = -150;
let damageAndHealthBarOffsetScreenSpace = -70; //needs to be multiplied by camera.radius and viewporrt hieght to be consistent across devices

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

async function createDamagePopupMSDFLarge(damage, position) {
  const fontJson = await fetch("/lib/MSDF-Text/fontAssets/abel-regular.json").then((r) => r.json()); // load JSON as data :contentReference[oaicite:2]{index=2}
  const pngUrl = "/lib/MSDF-Text/fontAssets/abel-regular.png"; // just a URL

  const mesh = createMSDFTextMesh(
    "hello",
    {
      text: damage.toString(),
      font: fontJson, // BMFont JSON
      atlas: pngUrl, // or a BABYLON.Texture
      width: 900,
      align: "center",
      color: new BABYLON.Color3(0.2, 0, 0),
      strokeColor: new BABYLON.Color3(0, 0, 0),
      strokeWidth: 0.9,
    },
    sceneManager.activeScene
  );
  //   mesh.scaling.set(0.05, 0.05, 0.05);
  mesh.isPickable = false;

  console.log("make damage popup", mesh.name);
  const mat = mesh.material;
  makeFadeable(mat, 0);

  //   let startPosition = BABYLON.Vector3.Project(position, BABYLON.Matrix.Identity(), sceneManager.activeScene.getTransformMatrix(), sceneManager.activeScene.activeCamera.viewport.toGlobal(sceneManager.engine.getRenderWidth(), sceneManager.engine.getRenderHeight()));
  //   startPosition.x = startPosition.x - sceneManager.engine.getRenderWidth() / 2;
  //   startPosition.y = startPosition.y - sceneManager.engine.getRenderHeight() / 2;
  //   // let startPosition = position;
  //   startPosition.y = startPosition.y + damageAndHealthBarOffsetScreenSpace;
  // Make the text mesh face the camera (billboard mode)
  // Set pivot point to center of the mesh

  // Alternatively, we can manually update the mesh to face the camera each frame
  // This is useful if you need more control over the billboarding behavior
  /*
  const onBeforeRenderObserver = sceneManager.activeScene.onBeforeRenderObservable.add(() => {
    if (mesh) {
      const camera = sceneManager.activeScene.activeCamera;
      mesh.lookAt(camera.position);
    }
  });
  
  // Clean up the observer when the mesh is disposed
  mesh.onDisposeObservable.add(() => {
    sceneManager.activeScene.onBeforeRenderObservable.remove(onBeforeRenderObserver);
  });
  */

  // mesh.setPivotPoint(new BABYLON.Vector3(position.x, position.y, position.z));
  let startPosition = position;
  startPosition.x = startPosition.x - 440;
  //   startPosition.y = startPosition.y + 100;
  console.log(position);
  mesh.position = startPosition;

  mesh.setPivotPoint(new BABYLON.Vector3(0, 0, 0));

  // Enable billboarding to make the text always face the camera
  // mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;

  // mesh.position.copyFrom(position).addInPlace(new BABYLON.Vector3(0, 1.5, 0));
  // let startPosition = mesh.position;

  // Animate popup (move up and fade out)
  // let animationGroup = sceneManager.activeScene.damagePopupAnimationGroup;
  let animationGroup = new BABYLON.AnimationGroup("popupAnimation", sceneManager.activeScene);

  var moveUpAnimation = new BABYLON.Animation("moveUp", "position.y", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
  var keys = [];
  keys.push({ frame: 0, value: startPosition.y });
  keys.push({ frame: 60, value: startPosition.y + 10 });
  moveUpAnimation.setKeys(keys);

  var fadeOutAnimation = new BABYLON.Animation("fadeOut", "fade", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
  keys = [];
  keys.push({ frame: 0, value: 0 });
  keys.push({ frame: 30, value: 1 });
  keys.push({ frame: 60, value: 0 });
  fadeOutAnimation.setKeys(keys);

  animationGroup.addTargetedAnimation(moveUpAnimation, mesh);
  animationGroup.addTargetedAnimation(fadeOutAnimation, mat);
  animationGroup.onAnimationEndObservable.add(() => {
    // sceneManager.activeGUI.removeControl(text1); // Remove text after animation
  });
  animationGroup.play();
}

let msdfFontPromise = null;
let msdfAtlas = null;

// call this early in your app (or lazily the first time you need it)
function loadMsdfFont(scene) {
  if (!msdfFontPromise) {
    msdfFontPromise = fetch("/lib/MSDF-Text/fontAssets/abel-regular.json")
      .then((r) => r.json())
      .then((fontJson) => {
        msdfAtlas = new BABYLON.Texture("/lib/MSDF-Text/fontAssets/abel-regular.png", scene);
        return fontJson;
      });
  }
  return msdfFontPromise;
}

//small hits
async function createDamagePopup(damage, position, stickToCamera = false) {
  // const fontJson = await fetch("/lib/MSDF-Text/fontAssets/abel-regular.json").then((r) => r.json()); // load JSON as data :contentReference[oaicite:2]{index=2}
  // const pngUrl = "/lib/MSDF-Text/fontAssets/abel-regular.png"; // just a URL
  // ensure font + atlas are loaded
  const fontJson = await loadMsdfFont(sceneManager.activeScene);

  const mesh = createMSDFTextMesh(
    "hello",
    {
      text: damage.toString(),
      font: fontJson, // BMFont JSON
      atlas: msdfAtlas, // or a BABYLON.Texture
      width: 50,
      align: "center",
      color: new BABYLON.Color3(0.12, 0, 0),
      strokeColor: new BABYLON.Color3(0.0, 0, 0),
      strokeWidth: 0.14,
      // strokeWidth: 0.3,
      fontSize: 20,
      // color: new BABYLON.Color3(0.00, 0, 0),
      // strokeColor: new BABYLON.Color3(0.6, 0, 0),
      // color: new BABYLON.Color3(0.2, 0, 0),
      // strokeColor: new BABYLON.Color3(0, 0, 0),
      // strokeWidth: 0.9,
    },
    sceneManager.activeScene
  );
  mesh.scaling.set(0.2, 0.2, 0.2);
  mesh.isPickable = false;

  // console.log("make damage popup", mesh.name);
  const mat = mesh.material;
  makeFadeable(mat, 0);

  //   let startPosition = BABYLON.Vector3.Project(position, BABYLON.Matrix.Identity(), sceneManager.activeScene.getTransformMatrix(), sceneManager.activeScene.activeCamera.viewport.toGlobal(sceneManager.engine.getRenderWidth(), sceneManager.engine.getRenderHeight()));
  //   startPosition.x = startPosition.x - sceneManager.engine.getRenderWidth() / 2;
  //   startPosition.y = startPosition.y - sceneManager.engine.getRenderHeight() / 2;
  //   // let startPosition = position;
  //   startPosition.y = startPosition.y + damageAndHealthBarOffsetScreenSpace;
  // Make the text mesh face the camera (billboard mode)
  // Set pivot point to center of the mesh

  // Alternatively, we can manually update the mesh to face the camera each frame
  // This is useful if you need more control over the billboarding behavior
  /*
  const onBeforeRenderObserver = sceneManager.activeScene.onBeforeRenderObservable.add(() => {
    if (mesh) {
      const camera = sceneManager.activeScene.activeCamera;
      mesh.lookAt(camera.position);
    }
  });
  
  // Clean up the observer when the mesh is disposed
  mesh.onDisposeObservable.add(() => {
    sceneManager.activeScene.onBeforeRenderObservable.remove(onBeforeRenderObserver);
  });
  */

  // mesh.setPivotPoint(new BABYLON.Vector3(position.x, position.y, position.z));
  let startPosition = position.clone();
  // random x and z offset
  startPosition.x += (Math.random() - 0.5) * 5;
  startPosition.z += (Math.random() - 0.5) * 5;

  // startPosition.x = startPosition.x - 440;
  //   startPosition.y = startPosition.y + 100;
  // console.log(position);
  mesh.position = startPosition;

  // mesh.setPivotPoint(new BABYLON.Vector3(-100, 0, 0));

  // local billboard
  if (!stickToCamera) {
    mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
  } else {
    // or attach to camera
    mesh.parent = sceneManager.activeScene.activeCamera;
    startPosition = new BABYLON.Vector3(0, 0, 20);

    mesh.position = startPosition;
    mesh.scaling.set(0.02, 0.02, 0.02);
  }
  mesh.renderingGroupId = 1;
  mat.renderingGroupId = 1;
  mat.disableDepthWrite = true;

  // Enable billboarding to make the text always face the camera
  // const bb = mesh.getBoundingInfo().boundingBox;
  // const w = bb.extendSize.x; // full width
  // const h = bb.extendSize.y; // full height
  // // pivot coordinates are expressed in the mesh’s local space
  // mesh.setPivotPoint(new BABYLON.Vector3(w / 2, -h / 2, 0)); // (x, y, z)

  // Toggle billboard mode on 'h' key press
  // const billboardToggle = (evt) => {
  //   if (evt.key === "h") {
  //     mesh.billboardMode = mesh.billboardMode === BABYLON.Mesh.BILLBOARDMODE_Y ? BABYLON.Mesh.BILLBOARDMODE_NONE : BABYLON.Mesh.BILLBOARDMODE_Y;
  //   }
  // };
  // window.addEventListener("keydown", billboardToggle);

  // // Clean up event listener when mesh is disposed
  // mesh.onDisposeObservable.add(() => {
  //   window.removeEventListener("keydown", billboardToggle);
  // });

  // mesh.position.copyFrom(position).addInPlace(new BABYLON.Vector3(0, 1.5, 0));
  // let startPosition = mesh.position;

  // Animate popup (move up and fade out)
  // let animationGroup = sceneManager.activeScene.damagePopupAnimationGroup;
  let animationGroup = new BABYLON.AnimationGroup("popupAnimation", sceneManager.activeScene);

  var moveUpAnimation = new BABYLON.Animation("moveUp", "position.y", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
  var keys = [];
  keys.push({ frame: 0, value: startPosition.y });
  if (!stickToCamera) {
    // keys.push({ frame: 60, value: startPosition.y + 10 });
    // Add random x and z offsets
    const randomX = (Math.random() - 0.5) * 20; // Random value between -2 and 2
    const randomZ = (Math.random() - 0.5) * 20;
    keys.push({ frame: 11, value: startPosition.y + 9 }); // Midpoint
    keys.push({ frame: 45, value: startPosition.y + 14 });
    keys.push({ frame: 60, value: startPosition.y + 11 });

    // Add animations for x and z movement
    var moveXAnimation = new BABYLON.Animation("moveX", "position.x", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var moveZAnimation = new BABYLON.Animation("moveZ", "position.z", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    var xKeys = [];
    var zKeys = [];
    xKeys.push({ frame: 0, value: startPosition.x });
    xKeys.push({ frame: 60, value: startPosition.x + randomX });
    zKeys.push({ frame: 0, value: startPosition.z });
    zKeys.push({ frame: 60, value: startPosition.z + randomZ });

    moveXAnimation.setKeys(xKeys);
    moveZAnimation.setKeys(zKeys);

    animationGroup.addTargetedAnimation(moveXAnimation, mesh);
    animationGroup.addTargetedAnimation(moveZAnimation, mesh);
  } else {
    keys.push({ frame: 60, value: startPosition.y + 1 });
  }
  moveUpAnimation.setKeys(keys);

  var fadeOutAnimation = new BABYLON.Animation("fadeOut", "fade", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
  keys = [];
  keys.push({ frame: 0, value: 0 });
  keys.push({ frame: 8, value: 1 });
  keys.push({ frame: 30, value: 1 });
  keys.push({ frame: 55, value: 0 });
  fadeOutAnimation.setKeys(keys);

  var scaleAnimation = new BABYLON.Animation("scale", "scaling", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
  keys = [];
  keys.push({ frame: 0, value: new BABYLON.Vector3(0.15, 0.15, 0.15) });
  keys.push({ frame: 11, value: new BABYLON.Vector3(0.2, 0.2, 0.2) });
  keys.push({ frame: 60, value: new BABYLON.Vector3(0.05, 0.05, 0.05) });
  scaleAnimation.setKeys(keys);
  // Add easing to animations for snappy feel
  // moveUpAnimation.setEasingFunction(new BABYLON.BackEaseOut(2.0)); // Snappy up movement with slight overshoot
  // fadeOutAnimation.setEasingFunction(new BABYLON.QuadraticEaseIn()); // Smooth fade out
  // scaleAnimation.setEasingFunction(new BABYLON.ElasticEaseOut(1.2, 0.5)); // Bouncy scale with quick settle

  animationGroup.addTargetedAnimation(moveUpAnimation, mesh);
  animationGroup.addTargetedAnimation(fadeOutAnimation, mat);
  animationGroup.addTargetedAnimation(scaleAnimation, mesh);
  animationGroup.onAnimationEndObservable.add(() => {
    // sceneManager.activeGUI.removeControl(text1); // Remove text after animation
  });
  animationGroup.play();

  setTimeout(() => {
    mesh.dispose();
  }, 2000);
}

//small hits
export async function createXPPopup(damage, position, stickToCamera = false) {
  // const fontJson = await fetch("/lib/MSDF-Text/fontAssets/abel-regular.json").then((r) => r.json()); // load JSON as data :contentReference[oaicite:2]{index=2}
  // const pngUrl = "/lib/MSDF-Text/fontAssets/abel-regular.png"; // just a URL
  // ensure font + atlas are loaded
  const fontJson = await loadMsdfFont(sceneManager.activeScene);

  const mesh = createMSDFTextMesh(
    "hello",
    {
      text: "+ " + damage.toString(),
      font: fontJson, // BMFont JSON
      atlas: msdfAtlas, // or a BABYLON.Texture
      width: 500,
      align: "center",
      color: new BABYLON.Color3(0.76, 0.32, 0),
      strokeColor: new BABYLON.Color3(0.0, 0, 0),
      strokeWidth: 0.14,
      // strokeWidth: 0.3,
      fontSize: 20,
      // color: new BABYLON.Color3(0.00, 0, 0),
      // strokeColor: new BABYLON.Color3(0.6, 0, 0),
      // color: new BABYLON.Color3(0.2, 0, 0),
      // strokeColor: new BABYLON.Color3(0, 0, 0),
      // strokeWidth: 0.9,
    },
    sceneManager.activeScene
  );
  mesh.scaling.set(0.2, 0.2, 0.2);
  mesh.isPickable = false;

  // console.log("make damage popup", mesh.name);
  const mat = mesh.material;
  makeFadeable(mat, 0);

  //   let startPosition = BABYLON.Vector3.Project(position, BABYLON.Matrix.Identity(), sceneManager.activeScene.getTransformMatrix(), sceneManager.activeScene.activeCamera.viewport.toGlobal(sceneManager.engine.getRenderWidth(), sceneManager.engine.getRenderHeight()));
  //   startPosition.x = startPosition.x - sceneManager.engine.getRenderWidth() / 2;
  //   startPosition.y = startPosition.y - sceneManager.engine.getRenderHeight() / 2;
  //   // let startPosition = position;
  //   startPosition.y = startPosition.y + damageAndHealthBarOffsetScreenSpace;
  // Make the text mesh face the camera (billboard mode)
  // Set pivot point to center of the mesh

  // Alternatively, we can manually update the mesh to face the camera each frame
  // This is useful if you need more control over the billboarding behavior
  /*
  const onBeforeRenderObserver = sceneManager.activeScene.onBeforeRenderObservable.add(() => {
    if (mesh) {
      const camera = sceneManager.activeScene.activeCamera;
      mesh.lookAt(camera.position);
    }
  });
  
  // Clean up the observer when the mesh is disposed
  mesh.onDisposeObservable.add(() => {
    sceneManager.activeScene.onBeforeRenderObservable.remove(onBeforeRenderObserver);
  });
  */

  // mesh.setPivotPoint(new BABYLON.Vector3(position.x, position.y, position.z));
  let startPosition = position.clone();
  // random x and z offset
  startPosition.x += (Math.random() - 0.5) * 5;
  startPosition.z += (Math.random() - 0.5) * 5;

  // startPosition.x = startPosition.x - 440;
  //   startPosition.y = startPosition.y + 100;
  // console.log(position);
  mesh.position = startPosition;

  // mesh.setPivotPoint(new BABYLON.Vector3(-100, 0, 0));

  // local billboard
  if (!stickToCamera) {
    mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
  } else {
    // or attach to camera
    mesh.parent = sceneManager.activeScene.activeCamera;
    startPosition = new BABYLON.Vector3(0, 0, 20);

    mesh.position = startPosition;
    mesh.scaling.set(0.02, 0.02, 0.02);
  }
  mesh.renderingGroupId = 1;
  mat.renderingGroupId = 1;
  mat.disableDepthWrite = true;

  // Enable billboarding to make the text always face the camera
  // const bb = mesh.getBoundingInfo().boundingBox;
  // const w = bb.extendSize.x; // full width
  // const h = bb.extendSize.y; // full height
  // // pivot coordinates are expressed in the mesh’s local space
  // mesh.setPivotPoint(new BABYLON.Vector3(w / 2, -h / 2, 0)); // (x, y, z)

  // Toggle billboard mode on 'h' key press
  // const billboardToggle = (evt) => {
  //   if (evt.key === "h") {
  //     mesh.billboardMode = mesh.billboardMode === BABYLON.Mesh.BILLBOARDMODE_Y ? BABYLON.Mesh.BILLBOARDMODE_NONE : BABYLON.Mesh.BILLBOARDMODE_Y;
  //   }
  // };
  // window.addEventListener("keydown", billboardToggle);

  // // Clean up event listener when mesh is disposed
  // mesh.onDisposeObservable.add(() => {
  //   window.removeEventListener("keydown", billboardToggle);
  // });

  // mesh.position.copyFrom(position).addInPlace(new BABYLON.Vector3(0, 1.5, 0));
  // let startPosition = mesh.position;

  // Animate popup (move up and fade out)
  // let animationGroup = sceneManager.activeScene.damagePopupAnimationGroup;
  let animationGroup = new BABYLON.AnimationGroup("popupAnimation", sceneManager.activeScene);

  var moveUpAnimation = new BABYLON.Animation("moveUp", "position.y", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
  var keys = [];
  keys.push({ frame: 0, value: startPosition.y });
  if (!stickToCamera) {
    // keys.push({ frame: 60, value: startPosition.y + 10 });
    // Add random x and z offsets
    const randomX = (Math.random() - 0.5) * 20; // Random value between -2 and 2
    const randomZ = (Math.random() - 0.5) * 20;
    keys.push({ frame: 11, value: startPosition.y + 9 }); // Midpoint
    keys.push({ frame: 45, value: startPosition.y + 14 });
    keys.push({ frame: 60, value: startPosition.y + 11 });

    // Add animations for x and z movement
    var moveXAnimation = new BABYLON.Animation("moveX", "position.x", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var moveZAnimation = new BABYLON.Animation("moveZ", "position.z", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    var xKeys = [];
    var zKeys = [];
    xKeys.push({ frame: 0, value: startPosition.x });
    xKeys.push({ frame: 60, value: startPosition.x + randomX });
    zKeys.push({ frame: 0, value: startPosition.z });
    zKeys.push({ frame: 60, value: startPosition.z + randomZ });

    moveXAnimation.setKeys(xKeys);
    moveZAnimation.setKeys(zKeys);

    animationGroup.addTargetedAnimation(moveXAnimation, mesh);
    animationGroup.addTargetedAnimation(moveZAnimation, mesh);
  } else {
    keys.push({ frame: 60, value: startPosition.y + 1 });
  }
  moveUpAnimation.setKeys(keys);

  var fadeOutAnimation = new BABYLON.Animation("fadeOut", "fade", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
  keys = [];
  keys.push({ frame: 0, value: 0 });
  keys.push({ frame: 8, value: 1 });
  keys.push({ frame: 30, value: 1 });
  keys.push({ frame: 55, value: 0 });
  fadeOutAnimation.setKeys(keys);

  var scaleAnimation = new BABYLON.Animation("scale", "scaling", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
  keys = [];
  keys.push({ frame: 0, value: new BABYLON.Vector3(0.15, 0.15, 0.15) });
  keys.push({ frame: 11, value: new BABYLON.Vector3(0.2, 0.2, 0.2) });
  keys.push({ frame: 60, value: new BABYLON.Vector3(0.05, 0.05, 0.05) });
  scaleAnimation.setKeys(keys);
  // Add easing to animations for snappy feel
  // moveUpAnimation.setEasingFunction(new BABYLON.BackEaseOut(2.0)); // Snappy up movement with slight overshoot
  // fadeOutAnimation.setEasingFunction(new BABYLON.QuadraticEaseIn()); // Smooth fade out
  // scaleAnimation.setEasingFunction(new BABYLON.ElasticEaseOut(1.2, 0.5)); // Bouncy scale with quick settle

  animationGroup.addTargetedAnimation(moveUpAnimation, mesh);
  animationGroup.addTargetedAnimation(fadeOutAnimation, mat);
  animationGroup.addTargetedAnimation(scaleAnimation, mesh);
  animationGroup.onAnimationEndObservable.add(() => {
    // sceneManager.activeGUI.removeControl(text1); // Remove text after animation
  });
  animationGroup.play();

  setTimeout(() => {
    mesh.dispose();
  }, 2000);
}

function createDamagePopupOld(damage, position) {
  //createDamagePopupBabylonGUI
  if (!sceneManager) {
    console.error("SceneManager has not been initialized.");
    return;
  }

  // Update the rendering:
  myText.sync();

  let text1 = new BABYLON.GUI.TextBlock();
  text1.text = damage.toString();
  text1.color = "red";
  text1.fontSize = 24;
  text1.outlineWidth = 4;
  text1.outlineColor = "black";
  sceneManager.activeGUI.addControl(text1);

  // position = new BABYLON.Vector3(position.x, position.y + damageAndHealthBarOffset, position.z );
  // Set initial position based on the world position where the damage occurred
  let startPosition = BABYLON.Vector3.Project(position, BABYLON.Matrix.Identity(), sceneManager.activeScene.getTransformMatrix(), sceneManager.activeScene.activeCamera.viewport.toGlobal(sceneManager.engine.getRenderWidth(), sceneManager.engine.getRenderHeight()));

  startPosition.x = startPosition.x - sceneManager.engine.getRenderWidth() / 2;
  startPosition.y = startPosition.y - sceneManager.engine.getRenderHeight() / 2;
  // let startPosition = position;
  startPosition.y = startPosition.y + damageAndHealthBarOffsetScreenSpace;

  text1.left = startPosition.x;
  text1.top = startPosition.y;

  // Animate popup (move up and fade out)
  // let animationGroup = sceneManager.activeScene.damagePopupAnimationGroup;
  let animationGroup = new BABYLON.AnimationGroup("popupAnimation", sceneManager.activeScene);

  var moveUpAnimation = new BABYLON.Animation("moveUp", "top", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
  var keys = [];
  keys.push({ frame: 0, value: startPosition.y });
  keys.push({ frame: 60, value: startPosition.y - 100 });
  moveUpAnimation.setKeys(keys);

  var fadeOutAnimation = new BABYLON.Animation("fadeOut", "alpha", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
  keys = [];
  keys.push({ frame: 0, value: 1 });
  keys.push({ frame: 60, value: 0 });
  fadeOutAnimation.setKeys(keys);

  animationGroup.addTargetedAnimation(moveUpAnimation, text1);
  animationGroup.addTargetedAnimation(fadeOutAnimation, text1);
  animationGroup.onAnimationEndObservable.add(() => {
    sceneManager.activeGUI.removeControl(text1); // Remove text after animation
  });
  animationGroup.play();
}

function createHealthBar(mesh) {
  // Ensure the SceneManager and its GUI are properly initialized
  if (!sceneManager || !sceneManager.activeGUI) {
    console.error("SceneManager or its GUI layer is not initialized.");
    return null;
  }

  // Create a rectangle to serve as the health bar background
  var healthBar = new BABYLON.GUI.Rectangle();
  healthBar.width = "150px";
  healthBar.height = "40px";
  healthBar.cornerRadius = 5;
  healthBar.color = "Black";
  healthBar.thickness = 2;
  healthBar.background = "rgba(255,0,0,0.85)";
  healthBar.shadowBlur = 15;
  healthBar.shadowColor = "black";

  // Add text to display health
  var healthText = new BABYLON.GUI.TextBlock();
  healthText.text = "100%";
  healthText.color = "red";
  healthText.color = "rgb(225,225,225,1)";
  healthText.outlineColor = "black";
  healthText.outlineWidth = 5;
  healthText.fontSize = 20; // Set font size for visibility
  healthBar.addControl(healthText);

  // Add the health bar to the active GUI layer
  sceneManager.activeGUI.addControl(healthBar);
  // healthBar.show = true;
  // sceneManager.activeScene.onBeforeRenderObservable.add(() => {
  //     if (healthBar.show && PLAYER.target != null) {
  //     let startPosition = BABYLON.Vector3.Project(
  //         PLAYER.target.position,
  //         BABYLON.Matrix.Identity(),
  //         sceneManager.activeScene.getTransformMatrix(),
  //         sceneManager.activeScene.activeCamera.viewport.toGlobal(
  //             sceneManager.engine.getRenderWidth(),
  //             sceneManager.engine.getRenderHeight()
  //         )
  //     );
  //     // console.log(startPosition.x);

  //     startPosition.x = startPosition.x - sceneManager.engine.getRenderWidth()/2;
  //     startPosition.y = startPosition.y - sceneManager.engine.getRenderHeight()/2;;
  //     // healthBar.left = 10;
  //     // healthBar.top = 10;

  //     healthBar.left = startPosition.x;
  //     healthBar.top = startPosition.y;
  //     }

  // });
  healthBar.update = function (health, maxHealth) {
    // if (!healthBar || !healthBar.bar || !healthBar.text) {
    //     console.error("Invalid health bar object.");
    //     return;
    // }
    let healthPercentage = (health / maxHealth) * 100;
    console.log(healthPercentage);
    healthBar.width = `${1.5 * healthPercentage}px`; // Dynamic width based on health
    healthBar.healthText.text = `${Math.floor(healthPercentage)}%`;
    // healthBar.bar.background = healthPercentage < 50 ? "red" : "green";  // Color change based on health status
  };

  // healthBar.linkOffsetY = damageAndHealthBarOffset;

  healthBar.linkOffsetY = damageAndHealthBarOffsetScreenSpace;
  healthBar.linkWithMesh(mesh);

  healthBar.healthText = healthText;
  return healthBar;
}

function createMeshLabel(mesh, message) {
  var label = new BABYLON.GUI.Rectangle(message);
  label.background = "black";
  label.height = "30px";
  label.alpha = 0.5;
  label.width = message.length * 11 + "px";
  label.cornerRadius = 20;
  label.thickness = 1;
  //label.linkOffsetY = 30;
  sceneManager.activeGUI.addControl(label);
  label.linkWithMesh(mesh);
  var text1 = new BABYLON.GUI.TextBlock();
  text1.text = message;
  text1.color = "white";
  label.addControl(text1);

  return label;
}

function createHighPerformantHealthbar(mesh) {
  var nameplateAnchor = new BABYLON.AbstractMesh("Nameplate Anchor", sceneManager.activeScene);
  nameplateAnchor.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  nameplateAnchor.position.y = -2.5; //-meshHieght
  nameplateAnchor.parent = mesh;

  let healthBar = HPBAR.clone("hpBar");
  // var healthBar = new BABYLON.MeshBuilder.CreatePlane("healthBar", {width: 2, height: 0.7}, sceneManager.activeScene);
  healthBar.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  // healthBar.position.y = -2.5; //-meshHieght
  healthBar.parent = nameplateAnchor;
  healthBar.scaling = new BABYLON.Vector3(1, 1, 1);

  // var healthBar = new BABYLON.MeshBuilder.CreatePlane("healthBar", {width: 2, height: 0.7}, sceneManager.activeScene);
  // healthBar.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  // // healthBar.position.y = -2.5; //-meshHieght
  // healthBar.parent = nameplateAnchor;

  // healthBar.renderOutline = true;
  // healthBar.outlineWidth = 1.1;
  // healthBar.outlineColor = new BABYLON.Color3.Black();

  // var healthBarBackground = new BABYLON.MeshBuilder.CreatePlane("healthBarBackground", {width: 2, height: 0.7}, sceneManager.activeScene);
  // healthBarBackground.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  // // healthBar.position.y = -2.5; //-meshHieght
  // healthBarBackground.parent = nameplateAnchor;
  // healthBarBackground.scaling.scaleInPlace(1.1,1.1,1.1);
  // healthBarBackground.position.x = -0.001;
  // healthBarBackground.position.z = -0.001;

  // var backgroundMaterial = new BABYLON.BackgroundMaterial("backgroundMaterial", sceneManager.activeScene);
  // backgroundMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0); // Green color
  // healthBarBackground.material = backgroundMaterial;

  healthBar.update = function (health, maxHealth) {
    // if (!healthBar || !healthBar.bar || !healthBar.text) {
    //     console.error("Invalid health bar object.");
    //     return;
    // }
    let healthPercentage = health / maxHealth;
    // console.log(healthPercentage);
    healthBar.scaling.x = healthPercentage; // Dynamic width based on health
    // healthBar.healthText.text = `${Math.floor(healthPercentage)}%`;
    // healthBar.bar.background = healthPercentage < 50 ? "red" : "green";  // Color change based on health status
  };

  return healthBar;
}

function attachHealthBar(mesh) {
  // createMeshLabel(mesh, "test" );
  // let healthBar = createHealthBar(mesh);

  let healthBar = createHighPerformantHealthbar(mesh);
  return healthBar;
  // if (healthBar) {
  //     healthBar.bar.linkWithMesh(mesh);
  //     healthBar.bar.linkOffsetY = -1;  // Adjust this offset to position the health bar above the mesh
  // }
}

export function attachHealthBarToCamera(mesh) {
  // createMeshLabel(mesh, "test" );
  // let healthBar = createHealthBar(mesh);

  let healthBar = createHighPerformantHealthbar(mesh);
  // healthBar.parent = sceneManager.activeScene.activeCamera;
  return healthBar;
  // if (healthBar) {
  //     healthBar.bar.linkWithMesh(mesh);
  //     healthBar.bar.linkOffsetY = -1;  // Adjust this offset to position the health bar above the mesh
  // }
}

function setSceneManager(manager) {
  sceneManager = manager;
}

export { createDamagePopup, setSceneManager, attachHealthBar };

class FallingNumber {
  constructor(scene, number, position, duration, direction, speedScale) {
    this.scene = scene;
    this.number = number;
    this.position = position;
    this.duration = duration;
    this.direction = direction.normalize(); // Normalize the direction vector
    this.speedScale = speedScale;

    this.createTextPlane();
    this.startAnimation();
  }

  createTextPlane() {
    const dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", { width: 512, height: 256 }, this.scene, false);
    dynamicTexture.hasAlpha = true;
    // Draw black outline
    dynamicTexture.drawText(this.number, null, 140, "bold 160px Arial", "black", "transparent", true, true);
    // Draw red text on top
    dynamicTexture.drawText(this.number, null, 140, "bold 140px Arial", "red", "transparent", true, false);

    this.textPlane = BABYLON.MeshBuilder.CreatePlane("textPlane", { width: 5, height: 2.5 }, this.scene);
    this.textPlane.position = new BABYLON.Vector3(this.position.x, this.position.y, this.position.z);
    this.textPlane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", this.scene);
    this.textPlane.material.diffuseTexture = dynamicTexture;
    this.textPlane.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
    this.textPlane.material.opacityTexture = dynamicTexture;
    this.textPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  }

  startAnimation() {
    const animation = new BABYLON.Animation("movingInDirection", "position", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

    const endPosition = this.position.add(this.direction.scale(this.speedScale));

    const keys = [];
    keys.push({ frame: 0, value: this.position });
    keys.push({ frame: this.duration, value: endPosition });

    animation.setKeys(keys);

    // const easingFunction = new BABYLON.QuadraticEase();
    // easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);

    // animation.setEasingFunction(easingFunction);

    this.textPlane.animations.push(animation);

    this.scene.beginAnimation(this.textPlane, 0, this.duration, false);
  }
}

// Todo Numbers from a texture atlas
// uses 3D for better performance over babylon.js gui
function createDamagePopupWorldSpace(damage, position) {
  const direction = new BABYLON.Vector3(0, 1, 0); // Move upwards
  const speedScale = 20; // Scale the movement speed
  const fallingNumber = new FallingNumber(sceneManager.activeScene, "123", position, 120, direction, speedScale);
}

class NumberAnimator {
  constructor() {
    this.container = document.createElement("div");
    document.body.appendChild(this.container);
  }

  animateNumber(number, x, y, duration) {
    const numberElement = document.createElement("div");
    numberElement.className = "animated-number";
    numberElement.textContent = number;
    numberElement.style.left = `${x}px`;
    numberElement.style.top = `${y}px`;
    numberElement.style.animationDuration = `${duration}s`;

    const keyframes = `@keyframes moveUp {
            from {
                transform: translateY(0);
            }
            to {
                transform: translateY(-100px);
            }
        }`;

    const styleSheet = document.styleSheets[0];
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

    numberElement.style.animationName = "moveUp";

    this.container.appendChild(numberElement);

    setTimeout(() => {
      this.container.removeChild(numberElement);
    }, duration * 1000);
  }
}

const animator = new NumberAnimator();
function createDamagePopupHTML(damage, position) {
  let damagePopupPosition = position.clone();
  let hpBaroffset = -17.5;
  damagePopupPosition.y = damagePopupPosition.y - hpBaroffset;

  // document.getElementById('renderCanvas').width;
  let hpOffset = -2.5;
  // position.y = position.y - hpOffset; //changes the players position
  let startPosition = BABYLON.Vector3.Project(
    damagePopupPosition,
    BABYLON.Matrix.Identity(),
    sceneManager.activeScene.getTransformMatrix(),
    sceneManager.activeScene.activeCamera.viewport.toGlobal(
      document.getElementById("renderCanvas").width, //needs to be width of render canvas
      sceneManager.engine.getRenderHeight()
    )
  );

  animator.animateNumber(42, startPosition.x, startPosition.y, 2);
}
