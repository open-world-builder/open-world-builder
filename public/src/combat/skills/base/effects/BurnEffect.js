import BaseEffect from './BaseEffect.js';

class BurnEffect extends BaseEffect {
    constructor(damagePerTick, duration) {
        super({
            type: 'burn',
            value: damagePerTick,
            duration: duration * 1000, // Convert to milliseconds
            tickRate: 1000
        });
    }

    async apply(caster, target) {
        // Apply initial burn
        const burnEffect = {
            damage: this.value,
            remainingDuration: this.duration,
            lastTickTime: Date.now(),
            tickRate: this.tickRate
        };

        // Store burn effect on target
        if (!target.activeEffects) target.activeEffects = [];
        target.activeEffects.push(burnEffect);

        // Start burn tick
        this.startBurnTick(target, burnEffect);
    }

    startBurnTick(target, burnEffect) {
        const tickInterval = setInterval(() => {
            const now = Date.now();
            burnEffect.remainingDuration -= (now - burnEffect.lastTickTime);
            
            if (burnEffect.remainingDuration <= 0) {
                clearInterval(tickInterval);
                target.activeEffects = target.activeEffects.filter(e => e !== burnEffect);
                return;
            }

            target.health.takeDamage(burnEffect.damage);
            if (DMGPOP && DMGPOP.createDamagePopup) {
                DMGPOP.createDamagePopup(target.parent, burnEffect.damage, "#ff4400");
            }

            burnEffect.lastTickTime = now;
        }, burnEffect.tickRate);
    }
}

export default BurnEffect; 