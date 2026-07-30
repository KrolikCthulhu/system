import { RuntimeActionEffect } from './combat-encounter-runtime.types';

export class CombatActionEffectEngine {
	resolveDamage(
		effect: RuntimeActionEffect,
		result: { cleanSuccesses?: number }
	) {
		const cleanSuccesses = Math.max(0, result.cleanSuccesses ?? 0);
		const value = Math.max(0, effect.value ?? 0);

		switch (effect.damageMode) {
			case 'clean_successes':
				return cleanSuccesses;
			case 'clean_successes_plus_base':
				return cleanSuccesses + value;
			case 'base_damage':
				return value;
			default:
				return value;
		}
	}

	conditionInstanceKey(participantId: string, conditionId: string) {
		return `${participantId}:${conditionId}`;
	}
}
