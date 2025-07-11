import BaseEffect from './BaseEffect.js';

class HealEffect extends BaseEffect {
    constructor(healAmount) {
        super({
            type: 'heal',
            value: healAmount
        });
    }

    async apply(caster, target) {
        target.health.heal(this.value);
        
        // Create heal popup in green
        if (DMGPOP && DMGPOP.createDamagePopup) {
            DMGPOP.createDamagePopup(target.parent, this.value, "#00ff00");
        }
    }
}

export default HealEffect; 