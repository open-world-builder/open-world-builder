class Skill {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.type = config.type;  // melee, magic, etc
        this.effects = config.effects || [];
        this.cooldown = config.cooldown || 0;
        this.range = config.range || 1;
        this.animation = config.animation;
        this.vfx = config.vfx;
        this.requirements = config.requirements || {};
        this.lastCastTime = 0;
    }

    canCast(caster, target) {
        // Check cooldown
        if (Date.now() - this.lastCastTime < this.cooldown) {
            return false;
        }

        // Check range
        if (target && this.range) {
            const distance = BABYLON.Vector3.Distance(
                caster.position,
                target.position
            );
            if (distance > this.range) {
                return false;
            }
        }

        // Check requirements (mana, stamina etc)
        for (const [resource, cost] of Object.entries(this.requirements)) {
            if (caster[resource] < cost) {
                return false;
            }
        }

        return true;
    }

    async cast(caster, target) {
        if (!this.canCast(caster, target)) {
            return false;
        }

        // Consume resources
        for (const [resource, cost] of Object.entries(this.requirements)) {
            caster[resource] -= cost;
        }

        // Play animation if specified
        if (this.animation) {
            await this.playAnimation(caster);
        }

        // Play VFX if specified 
        if (this.vfx) {
            await this.playVFX(caster, target);
        }

        // Apply all effects
        for (const effect of this.effects) {
            await effect.apply(caster, target);
        }

        this.lastCastTime = Date.now();
        return true;
    }

    playAnimation(caster) {
        // Animation logic
    }

    playVFX(caster, target) {
        // VFX logic
    }
}

export default Skill; 