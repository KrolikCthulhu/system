export interface SkillLevelSuccessPreviewParams {
	canRoll: boolean;
	successMin: number | null;
	doubleSuccessMin: number | null;
}

const D6_SIDES_COUNT = 6;

export function calculateExpectedSuccessPerDie(
	params: SkillLevelSuccessPreviewParams
) {
	if (!params.canRoll || params.successMin === null) {
		return 0;
	}

	let totalSuccesses = 0;

	for (let face = 1; face <= D6_SIDES_COUNT; face += 1) {
		if (face >= params.successMin) {
			totalSuccesses += 1;
		}

		if (
			params.doubleSuccessMin !== null &&
			face >= params.doubleSuccessMin
		) {
			totalSuccesses += 1;
		}
	}

	return Number((totalSuccesses / D6_SIDES_COUNT).toFixed(4));
}
