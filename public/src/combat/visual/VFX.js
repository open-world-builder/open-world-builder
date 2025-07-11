import { Projectile } from './projectile.js';

// Base class for all VFX effects
class BaseEffect {
    constructor(config = {}) {
        this.duration = config.duration || 1000;
        this.scene = SCENE_MANAGER.activeScene;
    }

    cast(caster, target) {
        console.warn('Base cast method called - should be implemented by child class');
    }

    cleanup() {
        // Cleanup resources
    }
}

// Projectile-based effects (like fireballs)
class ProjectileEffect extends BaseEffect {
    constructor(config) {
        super(config);
        this.growthDuration = config.growthDuration || 500;
        this.moveSpeed = config.moveSpeed || 1000;
        this.offset = config.offset || new BABYLON.Vector3(100, 0, 0);
        this.projectileClass = config.projectileClass || Projectile;
    }

    cast(caster, target) {
        const projectile = new this.projectileClass(
            this.growthDuration,
            this.moveSpeed,
            this.offset
        );
        projectile.launch(caster, target);
    }
}

// Particle-based effects (like slashes, explosions)
class ParticleEffect extends BaseEffect {
    constructor(config) {
        super(config);
        this.particleConfig = {
            capacity: config.capacity || 2000,
            texturePath: config.texturePath || "/assets/textures/effects/flare.png",
            emitRate: config.emitRate || 500,
            minSize: config.minSize || 0.1,
            maxSize: config.maxSize || 0.5,
            minLifeTime: config.minLifeTime || 0.2,
            maxLifeTime: config.maxLifeTime || 0.5,
            gravity: config.gravity || new BABYLON.Vector3(0, -9.81, 0),
            direction1: config.direction1 || new BABYLON.Vector3(-1, 1, -1),
            direction2: config.direction2 || new BABYLON.Vector3(1, 1, 1),
            color1: config.color1 || new BABYLON.Color4(1, 0.5, 0.5, 1.0),
            color2: config.color2 || new BABYLON.Color4(1, 0.5, 0, 1.0),
            colorDead: config.colorDead || new BABYLON.Color4(0, 0, 0, 0.0),
            blendMode: config.blendMode || BABYLON.ParticleSystem.BLENDMODE_ONEONE,
            updateSpeed: config.updateSpeed || 0.005
        };
    }

    createParticleSystem(emitter) {
        const system = new BABYLON.ParticleSystem("particles", this.particleConfig.capacity, this.scene);
        
        // Apply configuration
        system.particleTexture = new BABYLON.Texture(this.particleConfig.texturePath, this.scene);
        system.emitter = emitter;
        // system.minEmitBox = new BABYLON.Vector3(emitter.position.x, emitter.position.y, emitter.position.z);
        // system.maxEmitBox = new BABYLON.Vector3(emitter.position.x, emitter.position.y, emitter.position.z);
        system.color1 = this.particleConfig.color1;
        system.color2 = this.particleConfig.color2;
        system.colorDead = this.particleConfig.colorDead;
        system.minSize = this.particleConfig.minSize;
        system.maxSize = this.particleConfig.maxSize;
        system.minLifeTime = this.particleConfig.minLifeTime;
        system.maxLifeTime = this.particleConfig.maxLifeTime;
        system.emitRate = this.particleConfig.emitRate;
        system.blendMode = this.particleConfig.blendMode;
        system.gravity = this.particleConfig.gravity;
        system.direction1 = this.particleConfig.direction1;
        system.direction2 = this.particleConfig.direction2;
        system.updateSpeed = this.particleConfig.updateSpeed;

        return system;
    }

    cast(caster, target) {
        const system = this.createParticleSystem(caster);
        system.start();
        setTimeout(() => {
            system.stop();
            this.cleanup();
        }, this.duration);
    }
}

// Effect definitions
const EFFECT_CONFIGS = {
    fireballVFX: {
        type: 'projectile',
        config: {
            growthDuration: 5000,
            moveSpeed: 1000,
            offset: new BABYLON.Vector3(100, 0, 0)
        }
    },
    slashVFX: {
        type: 'particle',
        config: {
            duration: 300,
            capacity: 2000,
            texturePath: "/assets/textures/effects/flare.png",
            color1: new BABYLON.Color4(1, 1, 1, 1.0),
            color2: new BABYLON.Color4(0.5, 0.5, 1, 1.0),
            emitRate: 500,
            minSize: 0.1,
            maxSize: 0.3
        }
    }
    // Add more effect configurations here
};

class VFXSystem {
    constructor() {
        this.effects = new Map();
        this.initializeEffects();
    }

    initializeEffects() {
        Object.entries(EFFECT_CONFIGS).forEach(([effectId, config]) => {
            let effectClass;
            switch (config.type) {
                case 'projectile':
                    effectClass = new ProjectileEffect(config.config);
                    break;
                case 'particle':
                    effectClass = new ParticleEffect(config.config);
                    break;
                default:
                    console.warn(`Unknown effect type: ${config.type}`);
                    return;
            }
            this.register(effectId, effectClass);
        });
    }

    register(effectId, effect) {
        this.effects.set(effectId, effect);
    }

    cast(effectId, caster, target) {
        const effect = this.effects.get(effectId);
        if (effect) {
            effect.cast(caster, target);
        } else {
            console.warn(`VFX effect '${effectId}' not found`);
        }
    }
}

export const VFX = new VFXSystem();
