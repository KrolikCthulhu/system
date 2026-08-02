import { Injectable } from '@nestjs/common';
import {
	CombatActionDefinition,
	CombatActionProvider,
	CombatActionProviderContext,
	CombatAvailableActionSourceType
} from '../combat-available-actions.types';
import { CombatEncounterRuntimeService } from '../domain/combat-encounter-runtime.service';
import { RuntimeAction } from '../domain/combat-encounter-runtime.types';

@Injectable()
export class CreatureCombatActionProvider implements CombatActionProvider {
	constructor(private readonly runtime: CombatEncounterRuntimeService) {}

	async collect(
		context: CombatActionProviderContext
	): Promise<CombatActionDefinition[]> {
		if (context.participant.kind !== 'CREATURE') {
			return [];
		}

		const actions = [
			...this.runtime.readRuntimeActions(context.participant.creature?.actions),
			...this.runtime.readRuntimeActions(
				context.participant.creatureTier?.actions
			),
			...this.runtime.readRuntimeActions(
				context.participant.creatureTier?.actionOverrides
			)
		];

		const bySlug = actions.reduce<Map<string, RuntimeAction>>(
			(result, action) => result.set(action.slug, action),
			new Map<string, RuntimeAction>()
		);

		return [...bySlug.values()]
			.filter(action => action.isActive && action.kind !== 'passive')
			.sort((first, second) => first.sortOrder - second.sortOrder)
			.map(action => ({
				action,
				sourceType: this.resolveSourceType(action)
			}));
	}

	private resolveSourceType(
		action: RuntimeAction
	): CombatAvailableActionSourceType {
		return action.kind === 'condition_action' ||
			action.source?.type === 'condition'
			? 'condition'
			: 'creature';
	}
}
