const q1 = new BABYLON.Quaternion();
const restRotationInverse = new BABYLON.Quaternion();
const parentRestWorldRotation = new BABYLON.Quaternion();

export function createEmoteFactory(animationGroup) {
  // Get the first animation from the group
  const animation = animationGroup.targetedAnimations[0].animation;

  // Get scale from the scene (assuming first mesh is armature)
  const scale = animationGroup.targetedAnimations[0].target.scaling.x;

  // Apply the same Y offset fix as Three.js version
  const yOffset = -0.05 / scale;

  let haveRoot = false;

  // Filter animations similar to Three.js version
  const filteredAnimations = animationGroup.targetedAnimations.filter(
    (targetAnim) => {
      const target = targetAnim.target;
      const animation = targetAnim.animation;

      if (animation.targetProperty === "position") {
        if (target.name === "Root") {
          haveRoot = true;
          return true;
        }
        if (target.name === "mixamorigHips") {
          return true;
        }
        return false;
      }
      return true;
    }
  );

  // Fix rotations similar to Three.js version
  filteredAnimations.forEach((targetAnim) => {
    const target = targetAnim.target;
    const animation = targetAnim.animation;

    if (animation.targetProperty === "rotationQuaternion") {
      // Get world rotation using Babylon.js methods
      restRotationInverse.copyFrom(target.absoluteRotationQuaternion);
      restRotationInverse.invert();

      parentRestWorldRotation.copyFrom(
        target.parent.absoluteRotationQuaternion
      );

      // Modify quaternion keyframes
      const keys = animation.getKeys();
      keys.forEach((key) => {
        q1.copyFrom(key.value);
        q1.multiplyInPlace(parentRestWorldRotation).multiplyInPlace(
          restRotationInverse
        );
        key.value = q1.clone();
      });
    } else if (animation.targetProperty === "position" && yOffset) {
      // Apply Y offset to position animations
      const keys = animation.getKeys();
      keys.forEach((key) => {
        key.value.y += yOffset;
      });
    }
  });

  return {
    toAnimationGroup({ rootToHips, version, getBoneName, scene }) {
      const height = rootToHips;
      const newAnimationGroup = new BABYLON.AnimationGroup(animationGroup.name);

      filteredAnimations.forEach((targetAnim) => {
        const target = targetAnim.target;
        const animation = targetAnim.animation;

        const vrmBoneName = normalizedBoneNames[target.name];
        const vrmNodeName = getBoneName(vrmBoneName);

        if (vrmNodeName) {
          const scaler = height * scale;

          // Clone animation and adjust for VRM
          const newAnimation = animation.clone();

          if (animation.targetProperty === "rotationQuaternion") {
            if (version === "0") {
              // Adjust rotation for VRM 0.0
              const keys = newAnimation.getKeys();
              keys.forEach((key) => {
                key.value.x *= -1;
                key.value.z *= -1;
              });
            }
          } else if (animation.targetProperty === "position") {
            // Scale positions
            const keys = newAnimation.getKeys();
            keys.forEach((key) => {
              if (version === "0") {
                key.value.x *= -scaler;
                key.value.y *= scaler;
                key.value.z *= -scaler;
              } else {
                key.value.scaleInPlace(scaler);
              }
            });
          }

          newAnimationGroup.addTargetedAnimation(
            newAnimation,
            scene.getTransformNodeByName(vrmNodeName)
          );
        }
      });

      return newAnimationGroup;
    },
  };
}

const normalizedBoneNames = {
  // vrm standard
  hips: "hips",
  spine: "spine",
  chest: "chest",
  upperChest: "upperChest",
  neck: "neck",
  head: "head",
  leftShoulder: "leftShoulder",
  leftUpperArm: "leftUpperArm",
  leftLowerArm: "leftLowerArm",
  leftHand: "leftHand",
  leftThumbProximal: "leftThumbProximal",
  leftThumbIntermediate: "leftThumbIntermediate",
  leftThumbDistal: "leftThumbDistal",
  leftIndexProximal: "leftIndexProximal",
  leftIndexIntermediate: "leftIndexIntermediate",
  leftIndexDistal: "leftIndexDistal",
  leftMiddleProximal: "leftMiddleProximal",
  leftMiddleIntermediate: "leftMiddleIntermediate",
  leftMiddleDistal: "leftMiddleDistal",
  leftRingProximal: "leftRingProximal",
  leftRingIntermediate: "leftRingIntermediate",
  leftRingDistal: "leftRingDistal",
  leftLittleProximal: "leftLittleProximal",
  leftLittleIntermediate: "leftLittleIntermediate",
  leftLittleDistal: "leftLittleDistal",
  rightShoulder: "rightShoulder",
  rightUpperArm: "rightUpperArm",
  rightLowerArm: "rightLowerArm",
  rightHand: "rightHand",
  rightLittleProximal: "rightLittleProximal",
  rightLittleIntermediate: "rightLittleIntermediate",
  rightLittleDistal: "rightLittleDistal",
  rightRingProximal: "rightRingProximal",
  rightRingIntermediate: "rightRingIntermediate",
  rightRingDistal: "rightRingDistal",
  rightMiddleProximal: "rightMiddleProximal",
  rightMiddleIntermediate: "rightMiddleIntermediate",
  rightMiddleDistal: "rightMiddleDistal",
  rightIndexProximal: "rightIndexProximal",
  rightIndexIntermediate: "rightIndexIntermediate",
  rightIndexDistal: "rightIndexDistal",
  rightThumbProximal: "rightThumbProximal",
  rightThumbIntermediate: "rightThumbIntermediate",
  rightThumbDistal: "rightThumbDistal",
  leftUpperLeg: "leftUpperLeg",
  leftLowerLeg: "leftLowerLeg",
  leftFoot: "leftFoot",
  leftToes: "leftToes",
  rightUpperLeg: "rightUpperLeg",
  rightLowerLeg: "rightLowerLeg",
  rightFoot: "rightFoot",
  rightToes: "rightToes",
  // vrm uploaded to mixamo
  // these are latest mixamo bone names
  Hips: "hips",
  Spine: "spine",
  Spine1: "chest",
  Spine2: "upperChest",
  Neck: "neck",
  Head: "head",
  LeftShoulder: "leftShoulder",
  LeftArm: "leftUpperArm",
  LeftForeArm: "leftLowerArm",
  LeftHand: "leftHand",
  LeftHandThumb1: "leftThumbProximal",
  LeftHandThumb2: "leftThumbIntermediate",
  LeftHandThumb3: "leftThumbDistal",
  LeftHandIndex1: "leftIndexProximal",
  LeftHandIndex2: "leftIndexIntermediate",
  LeftHandIndex3: "leftIndexDistal",
  LeftHandMiddle1: "leftMiddleProximal",
  LeftHandMiddle2: "leftMiddleIntermediate",
  LeftHandMiddle3: "leftMiddleDistal",
  LeftHandRing1: "leftRingProximal",
  LeftHandRing2: "leftRingIntermediate",
  LeftHandRing3: "leftRingDistal",
  LeftHandPinky1: "leftLittleProximal",
  LeftHandPinky2: "leftLittleIntermediate",
  LeftHandPinky3: "leftLittleDistal",
  RightShoulder: "rightShoulder",
  RightArm: "rightUpperArm",
  RightForeArm: "rightLowerArm",
  RightHand: "rightHand",
  RightHandPinky1: "rightLittleProximal",
  RightHandPinky2: "rightLittleIntermediate",
  RightHandPinky3: "rightLittleDistal",
  RightHandRing1: "rightRingProximal",
  RightHandRing2: "rightRingIntermediate",
  RightHandRing3: "rightRingDistal",
  RightHandMiddle1: "rightMiddleProximal",
  RightHandMiddle2: "rightMiddleIntermediate",
  RightHandMiddle3: "rightMiddleDistal",
  RightHandIndex1: "rightIndexProximal",
  RightHandIndex2: "rightIndexIntermediate",
  RightHandIndex3: "rightIndexDistal",
  RightHandThumb1: "rightThumbProximal",
  RightHandThumb2: "rightThumbIntermediate",
  RightHandThumb3: "rightThumbDistal",
  LeftUpLeg: "leftUpperLeg",
  LeftLeg: "leftLowerLeg",
  LeftFoot: "leftFoot",
  LeftToeBase: "leftToes",
  RightUpLeg: "rightUpperLeg",
  RightLeg: "rightLowerLeg",
  RightFoot: "rightFoot",
  RightToeBase: "rightToes",
  // these must be old mixamo names, prefixed with "mixamo"
  mixamorigHips: "hips",
  mixamorigSpine: "spine",
  mixamorigSpine1: "chest",
  mixamorigSpine2: "upperChest",
  mixamorigNeck: "neck",
  mixamorigHead: "head",
  mixamorigLeftShoulder: "leftShoulder",
  mixamorigLeftArm: "leftUpperArm",
  mixamorigLeftForeArm: "leftLowerArm",
  mixamorigLeftHand: "leftHand",
  mixamorigLeftHandThumb1: "leftThumbProximal",
  mixamorigLeftHandThumb2: "leftThumbIntermediate",
  mixamorigLeftHandThumb3: "leftThumbDistal",
  mixamorigLeftHandIndex1: "leftIndexProximal",
  mixamorigLeftHandIndex2: "leftIndexIntermediate",
  mixamorigLeftHandIndex3: "leftIndexDistal",
  mixamorigLeftHandMiddle1: "leftMiddleProximal",
  mixamorigLeftHandMiddle2: "leftMiddleIntermediate",
  mixamorigLeftHandMiddle3: "leftMiddleDistal",
  mixamorigLeftHandRing1: "leftRingProximal",
  mixamorigLeftHandRing2: "leftRingIntermediate",
  mixamorigLeftHandRing3: "leftRingDistal",
  mixamorigLeftHandPinky1: "leftLittleProximal",
  mixamorigLeftHandPinky2: "leftLittleIntermediate",
  mixamorigLeftHandPinky3: "leftLittleDistal",
  mixamorigRightShoulder: "rightShoulder",
  mixamorigRightArm: "rightUpperArm",
  mixamorigRightForeArm: "rightLowerArm",
  mixamorigRightHand: "rightHand",
  mixamorigRightHandPinky1: "rightLittleProximal",
  mixamorigRightHandPinky2: "rightLittleIntermediate",
  mixamorigRightHandPinky3: "rightLittleDistal",
  mixamorigRightHandRing1: "rightRingProximal",
  mixamorigRightHandRing2: "rightRingIntermediate",
  mixamorigRightHandRing3: "rightRingDistal",
  mixamorigRightHandMiddle1: "rightMiddleProximal",
  mixamorigRightHandMiddle2: "rightMiddleIntermediate",
  mixamorigRightHandMiddle3: "rightMiddleDistal",
  mixamorigRightHandIndex1: "rightIndexProximal",
  mixamorigRightHandIndex2: "rightIndexIntermediate",
  mixamorigRightHandIndex3: "rightIndexDistal",
  mixamorigRightHandThumb1: "rightThumbProximal",
  mixamorigRightHandThumb2: "rightThumbIntermediate",
  mixamorigRightHandThumb3: "rightThumbDistal",
  mixamorigLeftUpLeg: "leftUpperLeg",
  mixamorigLeftLeg: "leftLowerLeg",
  mixamorigLeftFoot: "leftFoot",
  mixamorigLeftToeBase: "leftToes",
  mixamorigRightUpLeg: "rightUpperLeg",
  mixamorigRightLeg: "rightLowerLeg",
  mixamorigRightFoot: "rightFoot",
  mixamorigRightToeBase: "rightToes",
};
