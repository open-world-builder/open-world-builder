import { Health } from "../character/health.js";

export class Effect {
  constructor(type, value, options = {}) {
    Object.assign(this, { type, value, ...options });
    this.damageTimer = null;
  }

  apply(target) {
    if (target instanceof Health) {
      switch (this.type) {
        case "damage":
          const doDamage = () => {
            if (this.hitVFX) {
              // setTimeout(() => {
              BABYLON.ParticleHelper.CreateAsync(this.hitVFX, window.SCENE_MANAGER.activeScene).then((set) => {
                set.systems.forEach((ps) => {
                  // emit from a point:
                  // ps.emitter = new BABYLON.Vector3(5, 10, 0);

                  ps.emitter = target.parent;
                  ps.autoDispose = true;
                  ps.disposeOnStop = true; // auto-dispose when done
                  // ps.targetStopDuration = 0.8;

                  // — or, if you have a mesh:
                  // console.log(target);
                  // console.log(target.rangeCheck);
                  // ps.emitter = target.rangeCheck;
                });
                set.start();
              });
              // }, 100);
            }

            setTimeout(() => {
              const randomValue = Math.floor(Math.random() * 3);
              target.takeDamage(this.value + randomValue);

              if (window.hitStop) {
                window.hitStop(1000);
              }
              console.log("window.screenShake", window.screenShake);
              if (window.screenShake) {
                if (this.screenShakeIntensity && this.screenShakeDuration) {
                  window.screenShake(this.screenShakeIntensity, this.screenShakeDuration);
                }
              }
              // console.log("damage: " + (this.value + randomValue));
            }, 100); // maybe dont want this lag here, was 100
          };
          console.log(this.delay);
          if (this.delay != undefined) {
            setTimeout(() => {
              doDamage();
            }, this.delay * 1000);
          } else {
            doDamage();
          }
          if (this.sound) {
            if (this.soundDelay) {
              setTimeout(() => {
                window.SCENE_MANAGER.activeScene.activeCamera.sound.play(this.sound, "sfx");
              }, this.soundDelay * 1000);
            } else {
              window.SCENE_MANAGER.activeScene.activeCamera.sound.play(this.sound, "sfx");
            }
          }

          break;
        case "heal":
          target.heal(this.value);
          break;
        case "burn":
          setTimeout(() => {
            // Clear any existing timer
            if (this.damageTimer) clearTimeout(this.damageTimer);

            const doBurnDamage = () => {
              target.takeDamage(this.value);
              if (this.hitVFX) {
                BABYLON.ParticleHelper.CreateAsync(this.hitVFX, window.SCENE_MANAGER.activeScene).then((set) => {
                  set.systems.forEach((ps) => {
                    ps.emitter = target.parent;
                    ps.autoDispose = true;
                    ps.disposeOnStop = true; // auto-dispose when done
                    ps.targetStopDuration = 0.8;
                  });
                  set.start();
                });
              }
              this.damageTimer = setTimeout(doBurnDamage, this.hitTime * 1000);
            };

            // Start the burn damage loop
            this.damageTimer = setTimeout(doBurnDamage, this.hitTime * 1000);

            if (this.sound) {
              console.log("play burn sound" + this.sound);
              window.SCENE_MANAGER.activeScene.activeCamera.sound.play(this.sound, "sfx");
            }

            // Stop after duration
            setTimeout(() => {
              if (this.damageTimer) {
                clearTimeout(this.damageTimer);
                this.damageTimer = null;
                if (this.sound) {
                  setTimeout(() => {
                    window.SCENE_MANAGER.activeScene.activeCamera.sound.stop(this.sound, "sfx");
                  }, 500); // slight delay when fading out
                }
              }
            }, this.duration * 1000);
          }, this.delay * 1000);
          break;
      }
    }
  }
}
