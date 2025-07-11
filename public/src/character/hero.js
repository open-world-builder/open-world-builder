export async function loadHeroModel(scene, character) {
  // const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "/assets/characters/human_basemesh/", "HumanBaseMesh_WithEquips_WithWarlock_fast.glb", scene);
  const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "/assets/characters/human_basemesh/", "humanbasemesh_withequips_withwarlock_fast-opt.glb", scene);
  // const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "/assets/characters/human_basemesh/mixamo_rig/", "2test.glb", scene);
  // old HumanBaseMesh_WithEquips.glb does have strange stop return to idle side jerk animatiion
  // redo HumanBaseMesh_WithEquips_WithWarlock.glb // blender -> align in rest mode -> parent empty

  // 	result.meshes.forEach(mesh => {
  // 		if (mesh.material) mesh.material.dispose();
  // 	});

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
