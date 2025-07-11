//should have set animations for each character, can be any character that is a full mesh, just need
// idle
// run
// jump
// roll
// it

// npc animations
// idle
// run

// hit
// attack
// death

// talk - optional

export function setupAnim(scene) {
  let anim = {};
  // anim.BreathingIdle = scene.beginWeightedAnimation(skeleton, scene.getAnimationGroupByName("BreathingIdle").from, scene.getAnimationGroupByName("BreathingIdle").to, 0.0, true);
  // anim.Running = scene.beginWeightedAnimation(skeleton, scene.getAnimationGroupByName("RunningSprint").from, scene.getAnimationGroupByName("RunningSprint").to, 0.0, true);
  // anim.Running.weight = 1.0;
  // anim.BreathingIdle.syncWith(anim.Running);

  anim.BreathingIdle = scene.getAnimationGroupByName("BreathingIdle");
  anim.Running = scene.getAnimationGroupByName("RunningSprint");
  anim.Jump = scene.getAnimationGroupByName("Jump");
  anim.Roll = scene.getAnimationGroupByName("SprintingForwardRollInPlace");
  anim.SelfCast = scene.getAnimationGroupByName("Standing 2H Magic Area Attack 02");
  anim.Combo = scene.getAnimationGroupByName("OneHandClubCombo");
  anim.Attack = scene.getAnimationGroupByName("Sword And Shield Attack");

  scene.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
  scene.animationPropertiesOverride.enableBlending = true;
  scene.animationPropertiesOverride.blendingSpeed = 0.15;

  // scene.animationPropertiesOverride.loopMode = 0;
  // for (let aniCounter = 0; aniCounter < scene.animationGroups.length; aniCounter++) {
  //     for (let index = 0; index < scene.animationGroups[aniCounter].targetedAnimations.length; index++) {
  //       let animation = scene.animationGroups[aniCounter].targetedAnimations[index].animation
  //       animation.enableBlending = true
  //       animation.blendingSpeed = 0.02;
  //     }
  //   }

  // anim.runAnim = scene.beginWeightedAnimation(hero, anim.Running.from, anim.Running.to, 0, true);

  scene.animationGroups.forEach((animationGroup) => {
    animationGroup.stop();
  });

  // Footsteps
  const footstepSounds = ["Grass 4"];
  function playRandomFootstep() {
    // console.log("footstep");
    const s = footstepSounds[Math.floor(Math.random() * footstepSounds.length)];
    //  make sure overlapping instances don’t pile up
    // window.SCENE_MANAGER.activeScene.activeCamera.sound.stop(s);
    window.SCENE_MANAGER.activeScene.activeCamera.sound?.play(s, "sfx");

    // if (!s.isPlaying) s.play();
  }

  (function addFootstepEvents() {
    const run = anim.Running; // AnimationGroup that drives the GLB run cycle
    if (!run) {
      console.warn("Running animation not found");
      return;
    }

    // choose the foot–plant frames inside the animation (works whatever speed you later use)
    const CONTACT_FRAMES = [5, 20]; // adapt to your GLB: two plants per cycle is typical

    // guard so we don’t add duplicates if this file runs twice (eg. on hot‑reload)
    if (run.__footstepEventsAdded) return;
    run.__footstepEventsAdded = true;

    // EVERY targetedAnimation inside the group shares the same timeline,
    // so we can safely attach the event to the first one.
    const ta = run.targetedAnimations[0];
    CONTACT_FRAMES.forEach((frame) => {
      ta.animation.addEvent(
        new BABYLON.AnimationEvent(frame, playRandomFootstep, false) // onlyOnce = true
      );
    });
  })();

  //Swing Sword Trail

  return anim;
}

export function setupAnimVibe(scene) {
  let anim = {};
  // anim.BreathingIdle = scene.beginWeightedAnimation(skeleton, scene.getAnimationGroupByName("BreathingIdle").from, scene.getAnimationGroupByName("BreathingIdle").to, 0.0, true);
  // anim.Running = scene.beginWeightedAnimation(skeleton, scene.getAnimationGroupByName("RunningSprint").from, scene.getAnimationGroupByName("RunningSprint").to, 0.0, true);
  // anim.Running.weight = 1.0;
  // anim.BreathingIdle.syncWith(anim.Running);

  anim.BreathingIdle = scene.getAnimationGroupByName("Breathing Idle");
  anim.Running = scene.getAnimationGroupByName("Running(1)");
  anim.Jump = scene.getAnimationGroupByName("Jumping");
  anim.Roll = scene.getAnimationGroupByName("Sprinting Forward Roll");
  anim.SelfCast = scene.getAnimationGroupByName("Standing 2H Magic Attack 02");
  anim.Combo = scene.getAnimationGroupByName("One Hand Club Combo");
  anim.Attack = scene.getAnimationGroupByName("Sword And Shield Attack");

  // scene.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
  // scene.animationPropertiesOverride.enableBlending = true;
  // scene.animationPropertiesOverride.blendingSpeed = 0.15;

  // scene.animationPropertiesOverride.loopMode = 0;
  // for (let aniCounter = 0; aniCounter < scene.animationGroups.length; aniCounter++) {
  //     for (let index = 0; index < scene.animationGroups[aniCounter].targetedAnimations.length; index++) {
  //       let animation = scene.animationGroups[aniCounter].targetedAnimations[index].animation
  //       animation.enableBlending = true
  //       animation.blendingSpeed = 0.02;
  //     }
  //   }

  // anim.runAnim = scene.beginWeightedAnimation(hero, anim.Running.from, anim.Running.to, 0, true);

  scene.animationGroups.forEach((animationGroup) => {
    animationGroup.stop();
  });

  return anim;
}
