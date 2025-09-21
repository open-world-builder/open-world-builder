export async function loadHeroModel(scene, character) {
  const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "/assets/characters/human_basemesh/", "HumanBaseMesh_WithEquips_WithWarlock_fast.glb", scene);
  // const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "/assets/characters/human_basemesh/", "glb fast face shapes hairstyle.glb", scene);
  // const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "/assets/characters/human_basemesh/mixamo_rig/", "2test.glb", scene);
  // old HumanBaseMesh_WithEquips.glb does have strange stop return to idle side jerk animatiion
  // redo HumanBaseMesh_WithEquips_WithWarlock.glb // blender -> align in rest mode -> parent empty

  // 	result.meshes.forEach(mesh => {
  // 		if (mesh.material) mesh.material.dispose();
  // 	});
  let shapeTargetModel = false;
  if (shapeTargetModel) {


    const mesh = result.meshes.find(m => m.morphTargetManager);
    if (!mesh) return console.warn("No morph targets found.");

    const mtm = mesh.morphTargetManager;
    console.log("Shape keys", mtm);

    function findMorphTargets(scene) {
      const out = {};
      scene.meshes.forEach(m => {
        const mtm = m.morphTargetManager; if (!mtm) return;
        for (let i = 0; i < mtm.numTargets; i++) {
          const t = mtm.getTarget(i);
          (out[t.name] ||= []).push(t);
        }
      });
      return out;
    }

    function makeInfluenceAnim(target, keys, fps = 60, loop = false, easing = null) {
      const a = new BABYLON.Animation("inf", "influence", fps,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        loop ? BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
          : BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
      if (easing) a.setEasingFunction(easing);
      a.setKeys(keys);
      const g = new BABYLON.AnimationGroup("group");
      g.addTargetedAnimation(a, target);
      return g;
    }
    function makeEase() {
      const e = new BABYLON.CubicEase();
      e.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
      return e;
    }


    const byName = findMorphTargets(scene);
    console.log("Morph keys:", Object.keys(byName)); // check names here

    const BLINK_KEYS = ["Eyes - Closed"]; // will use whichever exist
    const SPEAK_KEY = "Mouth - Open"; // e.g., "JawOpen" / "MouthOpen" / your phoneme key

    const blinkTargets = BLINK_KEYS.flatMap(n => byName[n] || []);
    const speakTarget = (byName[SPEAK_KEY] || [])[0];

    if (!blinkTargets.length) console.warn("No blink morph targets found.");
    if (!speakTarget) console.warn("No speakering morph target found.");

    // --- BLINK (one-shot): 0 -> 1 -> 0 in ~120 ms
    const blinkFPS = 60, blinkFrames = 45; // ~116 ms at 60fps
    const blinkKeys = [
      { frame: 0, value: 0 },
      { frame: blinkFrames / 2, value: 1 },
      { frame: blinkFrames, value: 0 }
    ];
    const blinkGroups = blinkTargets.map(t => makeInfluenceAnim(t, blinkKeys, blinkFPS, /*loop*/false, makeEase()));

    function blinkOnce() {
      console.log("toggle blink");
      // play all blink anims together (one-shot)
      blinkGroups.forEach(g => { g.reset(); g.play(false); });
    }

    // --- SPEAKERING (loop): 0 -> 1 -> 0, repeating
    // ~4 “syllables” per second (adjust speedRatio for rate)
    let speakGroup = null;
    if (speakTarget) {
      const speakFPS = 60, cycle = 30; // 15 frames => 4 cycles/sec
      const speakKeys = [
        { frame: 0, value: 0 },
        { frame: cycle / 2, value: 0.7 },
        { frame: cycle, value: 0 }
      ];
      speakGroup = makeInfluenceAnim(speakTarget, speakKeys, speakFPS, /*loop*/true, makeEase());
      speakGroup.speedRatio = 1.0; // <— raise for faster chatter
    }


    let speaking = false;
    function toggleSpeak() {
      console.log("toggle speaking");
      if (!speakGroup) return;
      speaking = !speaking;
      if (speaking) { speakGroup.play(true); } else { speakGroup.pause(); }
    }

    // --- controls: B to blink, S to toggle speakering
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "b") blinkOnce();
      if (e.key.toLowerCase() === "v") toggleSpeak();
    });
  }








  // console.log("Shape keys:", [...Array(mtm.numTargets())].map((_, i) => mtm.getTarget(i).name)); // names in console


  let hero = result.meshes[0];
  // hero.parent = character;
  character.addChild(hero);

  // // hero.scaling.scaleInPlace(0.7);
  hero.scaling.scaleInPlace(3.7);
  hero.position.y = -11;

  // Convert -90 degrees to radians
  var degrees = -90;
  var radians = degrees * (Math.PI / 180);

  var skeleton = result.skeletons[0];

  // Assuming the root bone is the first bone
  var rootBone = skeleton.bones[0];

  rootBone.animations = [];

  // Override the root bone's position updates
  scene.onBeforeRenderObservable.add(() => {
    rootBone.position = BABYLON.Vector3.Zero(); // Negate root motion
    rootBone.rotationQuaternion = BABYLON.Quaternion.Identity(); // Optional: Negate root rotation
  });

  result.animationGroups.forEach((group) => {
    group.targetedAnimations.forEach((targetedAnimation) => {
      targetedAnimation.animation.enableBlending = true;
      targetedAnimation.animation.blendingSpeed = 0.9;
    });
  });

  // Make hero and all child meshes non-pickable
  hero.isPickable = false;
  result.meshes.forEach((mesh) => {
    mesh.isPickable = false;
    if (mesh.getChildren) {
      mesh.getChildren().forEach((child) => {
        child.isPickable = false;
      });
    }
  });

  result.meshes[0]
    .getChildren()[0]
    .getChildren()
    .forEach((mesh) => {
      mesh.cameraCollide = false;
      if (mesh.material) mesh.material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
    });
  // result.meshes[1].material.backFaceCulling = true;
  // result.meshes[1].flipNormal = groundMat;
  // result.meshes[1].flipNormal.isEnabled = true;
  // await loadArmor(scene, skeleton, character);
  choosecharacter(hero, scene);

  return { hero: hero, skeleton: skeleton };
}

export async function loadHeroModelVibe(scene, character) {
  const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "/assets/characters/human_basemesh/vibe/", "4char.glb", scene);
  // old HumanBaseMesh_WithEquips.glb does have strange stop return to idle side jerk animatiion
  // redo HumanBaseMesh_WithEquips_WithWarlock.glb // blender -> align in rest mode -> parent empty

  // 	result.meshes.forEach(mesh => {
  // 		if (mesh.material) mesh.material.dispose();
  // 	});

  console.log(result.meshes[1].name);
  for (let i = 1; i < result.meshes.length; i++) {
    // console.log(result.meshes[i].name);
    result.meshes[i].scaling.scaleInPlace(10.7);
    character.addChild(result.meshes[i]);
  }
  let hero = result.meshes[1];
  // // hero.parent = character;
  // character.addChild(hero);

  // // hero.scaling.scaleInPlace(0.7);

  // hero.scaling.scaleInPlace(10.7);

  // hero.position.y = -11;

  // Convert -90 degrees to radians
  var degrees = -90;
  var radians = degrees * (Math.PI / 180);

  var skeleton = result.skeletons[0];

  // Assuming the root bone is the first bone
  var rootBone = skeleton.bones[0];

  rootBone.animations = [];

  // Override the root bone's position updates
  scene.onBeforeRenderObservable.add(() => {
    rootBone.position = BABYLON.Vector3.Zero(); // Negate root motion
    rootBone.rotationQuaternion = BABYLON.Quaternion.Identity(); // Optional: Negate root rotation
  });

  result.animationGroups.forEach((group) => {
    group.targetedAnimations.forEach((targetedAnimation) => {
      targetedAnimation.animation.enableBlending = true;
      targetedAnimation.animation.blendingSpeed = 0.9;
    });
  });

  // Make hero and all child meshes non-pickable
  hero.isPickable = false;
  result.meshes.forEach((mesh) => {
    mesh.isPickable = false;
    if (mesh.getChildren) {
      mesh.getChildren().forEach((child) => {
        child.isPickable = false;
      });
    }
  });

  result.meshes[0]
    .getChildren()[0]
    .getChildren()
    .forEach((mesh) => {
      mesh.cameraCollide = false;
      if (mesh.material) mesh.material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
    });
  // result.meshes[1].material.backFaceCulling = true;
  // result.meshes[1].flipNormal = groundMat;
  // result.meshes[1].flipNormal.isEnabled = true;
  // await loadArmor(scene, skeleton, character);
  choosecharacter(hero, scene);

  return { hero: hero, skeleton: skeleton };
}

function choosecharacter(hero, scene) {
  // Get the first child (which should be the mesh container)
  const mainMesh = hero.getChildren()[0];
  if (!mainMesh) {
    console.warn("No main mesh found");
    return;
  }

  // Get the actual character parts
  const characterParts = mainMesh.getChildren();

  // Define which meshes we want to show (base character parts)
  const visibleMeshNames = ["base", "mixamorig:Hips"];

  // Show/hide meshes based on their names
  characterParts.forEach((mesh) => {
    // console.log(mesh.name);
    const shouldBeVisible = visibleMeshNames.includes(mesh.name);
    // console.log(`Setting mesh ${mesh.name} to ${shouldBeVisible ? 'visible' : 'hidden'}`);
    mesh.setEnabled(shouldBeVisible);

    if (shouldBeVisible && mesh.material) {
      mesh.material.metallic = 0.0;
      mesh.material.roughness = 0.83;
    }
  });

  chooseWeapon(hero, scene);
}

function chooseWeapon(hero, scene) {
  const mainMesh = hero.getChildren()[0];
  if (!mainMesh) {
    console.warn("No main mesh found");
    return;
  }

  // Define specific weapon mesh names to show
  const visibleWeapons = ["mesh"]; // Add specific weapon mesh names here

  const node = scene.getMeshByName("mesh");
  if (node) {
    if (node.material) {
      node.material.metallic = 1.0;
      node.material.roughness = 0.58;
      node.material.directIntensity = 0;
    }
    node.setEnabled(true); // or node.isVisible = true;
  }
}
