import BaseEffect from './BaseEffect.js';

class DamageEffect extends BaseEffect {
    constructor(damage) {
        super({
            type: 'damage',
            value: damage
        });
    }

    async apply(caster, target) {
        target.health.takeDamage(this.value);
        
        // Create damage popup
        if (DMGPOP && DMGPOP.createDamagePopup) {
            DMGPOP.createDamagePopup(target.parent, this.value);
        }
    }
}

export default DamageEffect; 