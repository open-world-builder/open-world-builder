import { Projectile } from "./visual/projectile.js";
// contains list of spells
// each spell has a list of effects

// self cast (apply affect to self)
// cause damage to target (apply affect to target)
// cause damage in area (apply affect to area

export class Spell {
  constructor(name, effects, animation, vfx, range, castTime, castSound, castSoundEnd) {
    this.name = name;
    this.effects = effects; // Array of effects
    this.animation = animation; // Animation object or string
    this.vfx = vfx; // Visual effects object or string
    this.range = range;
    if (castTime) this.castTime = castTime;
    if (castSound) this.castSound = castSound;
    if (castSoundEnd) this.castSoundEnd = castSoundEnd;
    // this.castSoundDelay;
    this.facingThreshold = 0.507; // 0.707, 45 degrees threshold
  }

  canCast(caster, target) {
    if (caster.parent && caster.name != "Hero") {
      caster.rotationCheck = caster.parent;
      caster.rangeCheck = caster.parent;
    } else {
    }

    console.log("target.name: " + target.name);
    if (target.name === "Hero") {
      console.log("hi");
      // target.position = target.rangeCheck.position.clone();
      return true;
      // console.log("target.rangeCheck.position: " + target.rangeCheck.position);
    } else {
      target = target.parent;
      console.log("caster.rangeCheck.position: " + caster.rangeCheck.position);
      console.log("target.position: " + target.position);
    }

    // console.log("target.parent.name: " + target.parent.name);

    // console.log(caster);
    let range = BABYLON.Vector3.Distance(caster.rangeCheck.position, target.position);
    if (range > this.range) {
      console.log("caster out of range");
      return false;
    }
    //   Calculate the vector from the caster to the target
    let directionToTarget = target.position.subtract(caster.rangeCheck.position);
    directionToTarget.normalize();

    // Check if the caster is facing the target
    let dotProduct = BABYLON.Vector3.Dot(caster.rotationCheck.forward, directionToTarget);
    //   console.log(caster.rotationCheck.forward);
    if (dotProduct < this.facingThreshold) {
      console.log("Caster is not facing the target.");
      // return false; //was false when not rotated to target

      let directionToTarget = target.position.subtract(caster.rangeCheck.position);
      directionToTarget.normalize();

      let forwardAngle = Math.atan2(directionToTarget.x, directionToTarget.z);
      caster.rotationCheck.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(forwardAngle, 3.14, 0);
      var rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
      caster.rotationCheck.rotationQuaternion = rotationQuaternion.multiply(caster.rotationCheck.rotationQuaternion);

      console.log("Caster rotated to target.");
      return true;
    }
    return true;
  }

  cast(caster, target) {
    if (!this.canCast(caster, target)) return false;
    if (caster.name === "Hero") {
      // console.log("hero: " + caster.name);

      this.playVFX(caster, target);
      this.playAnimation(caster);
      this.playCastSound(caster);
    }
    // on animation end or projectile hit, play effect
    this.effects.forEach((effect) => {
      effect.apply(target);
    });

    console.log("hit target: " + target.parent.name);
  }

  playCastSound(caster) {
    console.log("playing sound");
    if (this.castSound)
      window.SCENE_MANAGER.activeScene.activeCamera.sound.play(this.castSound, "sfx");
    setTimeout(() => {
      window.SCENE_MANAGER.activeScene.activeCamera.sound.play(this.castSoundEnd, "sfx");
      setTimeout(() => {
        window.SCENE_MANAGER.activeScene.activeCamera.sound.stop(this.castSound, "sfx");
      }, 30); //overlap casting sound
    }, this.castTime * 1000);
    // await this.playParticleEffect(phase.particle.preset);
  }

  playAnimation(caster) {
    // console.log(`Playing animation: ${this.animation}`);
    // Animation logic here
  }

  playVFX(caster, target) {
    // console.log(VFX[this.vfx()]);
    // const fireProjectile = new Projectile(5000, 1000, new BABYLON.Vector3(100, 0, 0));
    // fireProjectile.launch(caster, target);
    // this.vfx();
    // console.log(`Playing VFX: ${this.vfx}`);
    // VFX logic here
  }
}
