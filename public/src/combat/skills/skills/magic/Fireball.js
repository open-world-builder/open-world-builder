import Skill from '../../base/Skill.js';
import DamageEffect from '../../effects/DamageEffect.js';
import BurnEffect from '../../effects/BurnEffect.js';

class Fireball extends Skill {
    constructor() {
        super({
            id: 'fireball',
            name: 'Fireball',
            type: 'magic',
            effects: [
                new DamageEffect(20),
                new BurnEffect(5, 3) // 5 damage per tick for 3 ticks
            ],
            cooldown: 1000,
            range: 200,
            animation: 'castFireball',
            vfx: 'fireballVFX',
            requirements: {
                mana: 25
            }
        });
    }

    // Override VFX method for custom projectile behavior
    async playVFX(caster, target) {
        const projectile = VFX['fireBall'].clone();
        // Custom projectile logic here
    }
}

export default Fireball; 