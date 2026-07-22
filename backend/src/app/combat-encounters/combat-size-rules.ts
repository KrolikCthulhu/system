export interface CombatSizeRuleSize {
	id: string | null;
	name: string;
	rank: number;
	source: 'creature_tier' | 'default';
}

export interface KnockdownSizeRuleResult {
	attackerSize: CombatSizeRuleSize;
	targetSize: CombatSizeRuleSize;
	sizeDifference: number;
	isAvailable: boolean;
	requiredCleanSuccesses: number | null;
	text: string;
}

export function resolveKnockdownSizeRule(
	attackerSize: CombatSizeRuleSize,
	targetSize: CombatSizeRuleSize
): KnockdownSizeRuleResult {
	const sizeDifference = targetSize.rank - attackerSize.rank;

	if (sizeDifference >= 2) {
		return {
			attackerSize,
			targetSize,
			sizeDifference,
			isAvailable: false,
			requiredCleanSuccesses: null,
			text: `Цель крупнее атакующего на ${sizeDifference} категории. Намерение «Сбить с ног» недоступно без особого правила.`
		};
	}

	const requiredCleanSuccesses = sizeDifference === 1 ? 2 : 1;
	const text =
		sizeDifference === 1
			? 'Цель крупнее атакующего на 1 категорию. Для сбивания с ног требуется минимум 2 чистых успеха.'
			: 'Цель не крупнее атакующего. Для сбивания с ног требуется минимум 1 чистый успех.';

	return {
		attackerSize,
		targetSize,
		sizeDifference,
		isAvailable: true,
		requiredCleanSuccesses,
		text
	};
}
