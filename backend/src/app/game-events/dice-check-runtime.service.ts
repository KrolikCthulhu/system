import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';

const D6_SIDES_COUNT = 6;

export interface DiceCheckLevelRule {
	canRoll: boolean;
	successMin: number | null;
	doubleSuccessMin: number | null;
	ignoreOnesCount: number;
}

export interface DiceCheckResult {
	diceCount: number;
	dice: number[];
	successes: number;
	sixes: number;
	ones: number;
	ignoredOnes: number;
	consequenceCount: number;
	skillLevel: number;
}

@Injectable()
export class DiceCheckRuntimeService {
	roll(params: {
		diceCount: number;
		skillLevel: number;
		levelRule: DiceCheckLevelRule | null;
	}): DiceCheckResult {
		const diceCount = Math.max(0, Math.floor(params.diceCount));
		const dice = Array.from({ length: diceCount }, () =>
			randomInt(1, D6_SIDES_COUNT + 1)
		);
		const successes = this.countSuccesses(dice, params.levelRule);
		const sixes = dice.filter(value => value === 6).length;
		const ones = dice.filter(value => value === 1).length;
		const ignoredOnes = Math.min(
			ones,
			params.levelRule?.ignoreOnesCount ?? 0
		);
		const consequenceCount = Math.max(0, ones - ignoredOnes);

		return {
			diceCount,
			dice,
			successes,
			sixes,
			ones,
			ignoredOnes,
			consequenceCount,
			skillLevel: Math.max(0, Math.floor(params.skillLevel))
		};
	}

	private countSuccesses(
		dice: number[],
		levelRule: {
			canRoll: boolean;
			successMin: number | null;
			doubleSuccessMin: number | null;
		} | null
	) {
		if (!levelRule?.canRoll || levelRule.successMin === null) {
			return 0;
		}

		return dice.reduce((total, die) => {
			const normalSuccess = die >= levelRule.successMin ? 1 : 0;
			const doubleSuccess =
				levelRule.doubleSuccessMin !== null && die >= levelRule.doubleSuccessMin
					? 1
					: 0;

			return total + normalSuccess + doubleSuccess;
		}, 0);
	}
}
