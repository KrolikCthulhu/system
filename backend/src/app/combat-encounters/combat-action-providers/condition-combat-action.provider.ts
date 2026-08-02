import { Injectable } from '@nestjs/common';
import {
	CombatActionDefinition,
	CombatActionProvider,
	CombatActionProviderContext
} from '../combat-available-actions.types';

@Injectable()
export class ConditionCombatActionProvider implements CombatActionProvider {
	async collect(
		_context: CombatActionProviderContext
	): Promise<CombatActionDefinition[]> {
		return [];
	}
}
