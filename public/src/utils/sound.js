export class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.channels = {
      music: { volume: 1, sounds: new Map() },
      sfx: { volume: 1, sounds: new Map() },
      voice: { volume: 1, sounds: new Map() },
    };
    this.soundPresets = [
      // UI
      { name: "Thunk", path: "/assets/sounds/ui/thunk.wav" },
      // Ability Effects
      { name: "Explosion", path: "/assets/sounds/vfx/fire/foom_0.wav", volume: 0.45 },
      { name: "Cleanse", path: "/assets/sounds/vfx/ability/ability_cleanse.mp3" },
      { name: "Infected Bolt Loop", path: "/assets/sounds/vfx/ability/ability_infected_bolt_loop.mp3" },
      { name: "Iron Maiden", path: "/assets/sounds/vfx/ability/ability_iron_maiden.mp3" },
      { name: "Open Wound", path: "/assets/sounds/vfx/ability/ability_openwound.mp3" },
      { name: "Protect", path: "/assets/sounds/vfx/ability/ability_protect.mp3" },
      { name: "Protective Spirit", path: "/assets/sounds/vfx/ability/ability_protectivespirit.mp3", volume: 0.8 },
      { name: "Purge", path: "/assets/sounds/vfx/ability/ability_purge.mp3" },
      { name: "Quickness", path: "/assets/sounds/vfx/ability/ability_quickness.mp3", volume: 0.5 },
      { name: "Silence", path: "/assets/sounds/vfx/ability/ability_silence.mp3", volume: 0.5 },
      { name: "Subduct Down", path: "/assets/sounds/vfx/ability/ability_subduct_down.mp3" },
      { name: "Subduct Up", path: "/assets/sounds/vfx/ability/ability_subduct_up.mp3", volume: 0.25 },
      { name: "Ice 2", path: "/assets/sounds/vfx/ability/ice_2.mp3" },
      { name: "Ice 3", path: "/assets/sounds/vfx/ability/ice_3.mp3" },
      { name: "Sword SFX", path: "/assets/sounds/vfx/ability/sword_sfx.wav" },
      { name: "Fireplace", path: "/assets/sounds/vfx/fire/fireplace_long.mp3", volume: 0.25 },
      //Background

      //Music

      //Footsteps
      { name: "Grass 1", path: "/assets/sounds/vfx/footsteps/grass/grass_1.mp3", volume: 0.6 },
      { name: "Grass 2", path: "/assets/sounds/vfx/footsteps/grass/grass_2.mp3", volume: 0.6 },
      { name: "Grass 3", path: "/assets/sounds/vfx/footsteps/grass/grass_3.mp3", volume: 0.6 },
      { name: "Grass 4", path: "/assets/sounds/vfx/footsteps/grass/grass_4.mp3", volume: 0.5 },
    ];
  }

  async createSoundPresets() {
    for (const soundPreset of this.soundPresets) {
      if (soundPreset.volume) {
        this.createSound(soundPreset.name, soundPreset.path, "sfx", { volume: soundPreset.volume, loop: true });
      } else {
        this.createSound(soundPreset.name, soundPreset.path, "sfx", { loop: true });
      }
    }
    return this.soundPresets;
  }

  async createSound(name, file, channel = "sfx", options = {}) {
    if (!this.channels[channel]) {
      console.warn(`Channel ${channel} doesn't exist`);
      return null;
    }

    // Don't recreate if sound exists
    if (this.channels[channel].sounds.has(name)) {
      return this.channels[channel].sounds.get(name);
    }

    // Create new sound with default options
    const sound = await BABYLON.CreateSoundAsync(name, file, this.scene, null, {
      ...options,
      // volume: 0.01,
      loop: false,
      autoplay: false,
      streaming: false,
      // spatialSound:true, maxDistance:10
    });
    // Store sound in appropriate channel
    this.channels[channel].sounds.set(name, sound);
    if (options.offset) {
      sound.offset = options.offset;
      console.log("setting offset");
    }
    if (options.length) {
      sound.length = options.length;
    }
    if (options.volume) {
      const defaultVolume = options.volume ? options.volume : this.channels[channel].volume;
      console.log("defaultVolume", defaultVolume);
      sound.volume = defaultVolume;
      sound.defaultVolume = defaultVolume;
    }
    // Only cleanup when done if not looping
    // if (!options.loop) {
    //   sound.onEndedObservable.add(() => {
    //     this.channels[channel].sounds.delete(name);
    //   });
    // }

    return sound;
  }

  setTiming(name, offset, length, channel = "sfx") {
    let sound = this.channels[channel]?.sounds.get(name);
    sound.length = length;
    sound.offset = offset;
    this.channels[channel].sounds.set(name, sound);
  }

  play(name, channel = "sfx") {
    const sound = this.channels[channel]?.sounds.get(name);
    if (sound) {
      if (sound.isPlaying) {
        sound.stop();
      }
      console.log("Playing sound:", name, "on channel:", channel);

      if (sound.offset && sound.length) {
        sound.stop();
        // sound._startOffset = sound.offset;
        // console.log(sound.offset);
        sound.play({
          startDelay: 0, // wait N seconds before starting   (optional)
          offset: sound.offset, // jump 2 s into the file
          duration: sound.length, // play exactly 2 s
        });
        // sound.play(3, 3, 3  );

        console.log("playing offset");
      } else {
        sound.play();
      }
      return sound;
    }
    return null;
  }

  stop(name, channel = "sfx") {
    const sound = this.channels[channel]?.sounds.get(name);
    if (sound) {
      sound.stop();
    }
  }

  delete(name, channel = "sfx") {
    const sound = this.channels[channel]?.sounds.get(name);
    if (sound) {
      sound.stop();
      if (!sound.loop) {
        this.channels[channel].sounds.delete(name);
      }
    }
  }

  setChannelVolume(channel, volume) {
    if (this.channels[channel]) {
      this.channels[channel].volume = volume; // multiplby by sound.defaultVolume if there
      this.channels[channel].sounds.forEach((sound) => {
        sound.volume = volume;
      });
    }
  }

  stopChannel(channel) {
    if (this.channels[channel]) {
      this.channels[channel].sounds.forEach((sound) => sound.stop());

      this.channels[channel].sounds.clear();
    }
  }

  stopAll() {
    console.log("stopping all sounds");
    // Object.keys(this.channels).forEach((channel) => this.stopChannel(channel));
    console.log("stopping all sounds");
    Object.keys(this.channels).forEach((channel) => {
      // First stop all sounds
      this.channels[channel].sounds.forEach((sound) => {
        console.log("stopping sound", sound.name);
        if (sound.isPlaying) {
          sound.stop();
        }
      });
      // Only clear non-looping sounds
      // this.channels[channel].sounds.forEach((sound, name) => {
      //   if (!sound.loop) {
      //     this.channels[channel].sounds.delete(name);
      //   }
      // });
    });

    // Stop the direct music/ambience sounds
    if (this.music && this.music.stop) {
      this.music.stop();
      // Clear the replay interval if it exists
      if (this.musicInterval) {
        clearInterval(this.musicInterval);
        this.musicInterval = null;
      }
    }

    if (this.ambience && this.ambience.stop) {
      this.ambience.stop();
    }
  }
}
