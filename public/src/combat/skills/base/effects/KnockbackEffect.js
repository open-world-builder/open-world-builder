import BaseEffect from './BaseEffect.js';

class KnockbackEffect extends BaseEffect {
    constructor(force) {
        super({
            type: 'knockback',
            value: force
        });
    }

    async apply(caster, target) {
        if (!target.parent || !caster.parent) return;

        const direction = target.parent.position.subtract(caster.parent.position);
        direction.normalize();
        direction.scaleInPlace(this.value);

        // Apply impulse using physics
        if (target.parent.physicsImpostor) {
            target.parent.physicsImpostor.applyImpulse(
                direction,
                target.parent.getAbsolutePosition()
            );
        }
    }
}

export default KnockbackEffect; 