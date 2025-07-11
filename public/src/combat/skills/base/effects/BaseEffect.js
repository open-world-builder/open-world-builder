class BaseEffect {
    constructor(config) {
        this.type = config.type;
        this.value = config.value;
        this.duration = config.duration || 0;
        this.tickRate = config.tickRate || 1000;
        this.lastTickTime = 0;
    }

    async apply(caster, target) {
        // Base implementation
    }

    async tick(target) {
        // Base tick implementation for DoT/HoT effects
    }
}

export default BaseEffect; 