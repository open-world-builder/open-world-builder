const boneMapping = {
  // Spine and Head
  "mixamorig:Hips": "J_Bip_C_Hips",
  "mixamorig:Spine": "J_Bip_C_Spine",
  "mixamorig:Spine1": "J_Bip_C_Chest",
  "mixamorig:Spine2": "J_Bip_C_UpperChest",
  "mixamorig:Neck": "J_Bip_C_Neck",
  "mixamorig:Head": "J_Bip_C_Head",

  // Right Arm and Hand
  "mixamorig:RightShoulder": "J_Bip_R_Shoulder",
  "mixamorig:RightArm": "J_Bip_R_UpperArm",
  "mixamorig:RightForeArm": "J_Bip_R_LowerArm",
  "mixamorig:RightHand": "J_Bip_R_Hand",
  "mixamorig:RightHandThumb1": "J_Bip_R_Thumb1",
  "mixamorig:RightHandThumb2": "J_Bip_R_Thumb2",
  "mixamorig:RightHandThumb3": "J_Bip_R_Thumb3",
  "mixamorig:RightHandIndex1": "J_Bip_R_Index1",
  "mixamorig:RightHandIndex2": "J_Bip_R_Index2",
  "mixamorig:RightHandIndex3": "J_Bip_R_Index3",
  "mixamorig:RightHandMiddle1": "J_Bip_R_Middle1",
  "mixamorig:RightHandMiddle2": "J_Bip_R_Middle2",
  "mixamorig:RightHandMiddle3": "J_Bip_R_Middle3",
  "mixamorig:RightHandRing1": "J_Bip_R_Ring1",
  "mixamorig:RightHandRing2": "J_Bip_R_Ring2",
  "mixamorig:RightHandRing3": "J_Bip_R_Ring3",
  "mixamorig:RightHandPinky1": "J_Bip_R_Little1",
  "mixamorig:RightHandPinky2": "J_Bip_R_Little2",
  "mixamorig:RightHandPinky3": "J_Bip_R_Little3",

  // Left Arm and Hand
  "mixamorig:LeftShoulder": "J_Bip_L_Shoulder",
  "mixamorig:LeftArm": "J_Bip_L_UpperArm",
  "mixamorig:LeftForeArm": "J_Bip_L_LowerArm",
  "mixamorig:LeftHand": "J_Bip_L_Hand",
  "mixamorig:LeftHandThumb1": "J_Bip_L_Thumb1",
  "mixamorig:LeftHandThumb2": "J_Bip_L_Thumb2",
  "mixamorig:LeftHandThumb3": "J_Bip_L_Thumb3",
  "mixamorig:LeftHandIndex1": "J_Bip_L_Index1",
  "mixamorig:LeftHandIndex2": "J_Bip_L_Index2",
  "mixamorig:LeftHandIndex3": "J_Bip_L_Index3",
  "mixamorig:LeftHandMiddle1": "J_Bip_L_Middle1",
  "mixamorig:LeftHandMiddle2": "J_Bip_L_Middle2",
  "mixamorig:LeftHandMiddle3": "J_Bip_L_Middle3",
  "mixamorig:LeftHandRing1": "J_Bip_L_Ring1",
  "mixamorig:LeftHandRing2": "J_Bip_L_Ring2",
  "mixamorig:LeftHandRing3": "J_Bip_L_Ring3",
  "mixamorig:LeftHandPinky1": "J_Bip_L_Little1",
  "mixamorig:LeftHandPinky2": "J_Bip_L_Little2",
  "mixamorig:LeftHandPinky3": "J_Bip_L_Little3",

  // Legs
  "mixamorig:RightUpLeg": "J_Bip_R_UpperLeg",
  "mixamorig:RightLeg": "J_Bip_R_LowerLeg",
  "mixamorig:RightFoot": "J_Bip_R_Foot",
  "mixamorig:RightToeBase": "J_Bip_R_ToeBase",
  "mixamorig:LeftUpLeg": "J_Bip_L_UpperLeg",
  "mixamorig:LeftLeg": "J_Bip_L_LowerLeg",
  "mixamorig:LeftFoot": "J_Bip_L_Foot",
  "mixamorig:LeftToeBase": "J_Bip_L_ToeBase",
};

export async function loadVRM(scene, urls) {
  const character = await BABYLON.SceneLoader.ImportMeshAsync(
    "",
    "./assets/",
    urls,
    scene
  );
  //   character.meshes[0].scaling = new BABYLON.Vector3(1, 1, 1);
  //   // Ensure proper skeleton setup
  if (character.skeletons?.[0]) {
    const skeleton = character.skeletons[0];
    skeleton.computeAbsoluteTransforms();
    skeleton.prepare();

    // Link bones to transform nodes and validate
    character.meshes.forEach((mesh) => {
      if (mesh.skeleton) {
        mesh.bakeCurrentTransformIntoVertices();

        mesh.skeleton = skeleton;
        mesh.computeWorldMatrix(true);
      }
    });
  }

  //   console.log(character);
  //   console.log(character.skeletons);

  return character;
}

const approvedTargets = [
  "mixamorig:Spine",
  "mixamorig:Spine1",
  "mixamorig:Spine2",
  // Main arm bones
  "mixamorig:LeftShoulder",
  "mixamorig:LeftArm",
  "mixamorig:LeftForeArm",
  "mixamorig:RightShoulder",
  "mixamorig:RightArm",
  "mixamorig:RightForeArm",
];

export async function loadAnimationToCharacter(
  scene,
  character,
  animationFile
) {
  try {
    const result = await BABYLON.SceneLoader.ImportMeshAsync(
      "",
      "./assets/",
      animationFile,
      scene
    );

    if (!result.animationGroups?.[0]) {
      console.warn("No animation groups found");
      return null;
    }
    const fullPath = animationFile;
    const fileName = fullPath.split("/").pop();
    result.animationGroups[0].name = fileName;
    const sourceAnimation = result.animationGroups[0];

    // Create new animation group for the VRM character
    const vrmAnimation = new BABYLON.AnimationGroup("" + sourceAnimation.name);

    // Map and transfer animations
    // console.log(sourceAnimation.targetedAnimations);
    // character.skeletons[0].bones.forEach((bone) => {
    //   console.log(bone.name);
    // });

    // Keep track of unmapped bones
    const unmappedBones = new Set();
    sourceAnimation.targetedAnimations.forEach((targetAnim) => {
      const target = targetAnim.target;
      const animation = targetAnim.animation;

      // Find corresponding VRM transform node
      let vrmTarget = target;
      //   console.log(target.name + " target property " + animation.targetProperty);
      if (target.name in boneMapping) {
        if (
          animation.targetProperty === "scaling" ||
          animation.targetProperty === "position"
        ) {
          return;
        }
        vrmTarget = scene.getTransformNodeByName(boneMapping[target.name]);
        console.log(
          "mapping " + target.name + " -> " + boneMapping[target.name]
        );
        const clonedAnimation = animation.clone();
        vrmAnimation.addTargetedAnimation(clonedAnimation, vrmTarget);
      } else {
        unmappedBones.add(target.name);
      }
      // Log any unmapped bones at the end
    });

    console.log(unmappedBones);
    if (unmappedBones.size > 0) {
      console.warn("Unmapped source bones:", Array.from(unmappedBones));
    }
    // Cleanup imported animation mesh
    result.meshes.forEach((mesh) => mesh.dispose());
    result.skeletons.forEach((skeleton) => skeleton.dispose());
    // sourceAnimation.dispose();

    return vrmAnimation;
  } catch (error) {
    console.error("Error loading animation:", error);
    throw error;
  }
}

export function playAnimation(animation, loop = true) {
  if (!animation) return;

  // Stop any currently playing animations in the group
  if (animation.targetedAnimations[0]?.target?.skeleton) {
    const skeleton = animation.targetedAnimations[0].target.skeleton;
    skeleton.getAnimationGroups().forEach((group) => {
      if (group !== animation) {
        group.stop();
      }
    });
  }

  animation.play(loop);
}

export function testAnimation(scene, character) {
  if (!character.skeletons?.[0]) {
    console.warn("No skeleton found");
    return null;
  }

  const skeleton = character.skeletons[0];

  // Ensure skeleton is properly prepared
  skeleton.computeAbsoluteTransforms();
  skeleton.prepare();

  const animationGroup = new BABYLON.AnimationGroup("testGroup");

  // Link bones to transform nodes with validation
  skeleton.bones.forEach((bone) => {
    const transformNode = scene.getTransformNodeByName(bone.name);
    if (transformNode) {
      try {
        bone.linkTransformNode(transformNode);
        console.log(bone.getTransformNode().name);
        bone._linkedTransformNode = transformNode;
        bone.computeAbsoluteTransforms();
      } catch (error) {
        console.warn(`Failed to link bone ${bone.name}:`, error);
      }
    }
    if (bone.name === "J_Bip_C_Spine") {
      console.log("moving spine");
      //   const transformNode = bone.getTransformNode();
      //   if (transformNode) {
      //     transformNode.position = new BABYLON.Vector3(0, 2, 2);
      //   }
    }
  });

  // Ensure mesh is properly bound to skeleton
  character.meshes.forEach((mesh) => {
    if (mesh.skeleton) {
      mesh.skeleton = skeleton;
      mesh.computeWorldMatrix(true);
    }
  });

  const spineTransform = scene.getTransformNodeByName("J_Bip_C_Spine");
  const headTransform = scene.getTransformNodeByName("J_Bip_C_Head");

  if (spineTransform && headTransform) {
    // Create spine rotation animation
    const spineAnim = new BABYLON.Animation(
      "spineRotation",
      "rotationQuaternion",
      30,
      BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    // Create keyframes for a simple rotation
    const spineKeys = [];
    const frameRate = 30;
    const duration = 2 * frameRate; // 2 seconds

    spineKeys.push({
      frame: 0,
      value: BABYLON.Quaternion.Identity(),
    });

    spineKeys.push({
      frame: duration / 2,
      value: BABYLON.Quaternion.RotationAxis(BABYLON.Vector3.Up(), Math.PI / 4),
    });

    spineKeys.push({
      frame: duration,
      value: BABYLON.Quaternion.Identity(),
    });

    // Set the keys and add to animation group
    spineAnim.setKeys(spineKeys);
    animationGroup.addTargetedAnimation(spineAnim, spineTransform);

    // Create a nodding animation for the head
    const headAnim = new BABYLON.Animation(
      "headNod",
      "rotationQuaternion",
      30,
      BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const headKeys = [];
    headKeys.push({
      frame: 0,
      value: BABYLON.Quaternion.Identity(),
    });

    headKeys.push({
      frame: duration / 2,
      value: BABYLON.Quaternion.RotationAxis(
        BABYLON.Vector3.Right(),
        Math.PI / 8
      ),
    });

    headKeys.push({
      frame: duration,
      value: BABYLON.Quaternion.Identity(),
    });

    headAnim.setKeys(headKeys);
    animationGroup.addTargetedAnimation(headAnim, headTransform);
  }

  animationGroup.play(true);
  return animationGroup;
}
