import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input
} from '@angular/core';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import {
	CreatureTierAbility,
	CreatureTierAction
} from '../../../domain/creatures.models';
import { CreatureDraft } from '../../pages/admin-creatures-page/admin-creature-editor.models';

interface DemoAction {
	label: string;
	description: string;
}

interface DemoAttackGroup {
	sourceName: string;
	costText: string;
	profileName: string;
	actions: DemoAction[];
}

interface DemoTier {
	tier: number;
	name: string;
	attacks: DemoAttackGroup[];
	abilities: DemoAction[];
	contextualActions: DemoAction[];
}

@Component({
	selector: 'app-creature-actions-demo',
	standalone: true,
	imports: [Button, Tag],
	templateUrl: './creature-actions-demo.component.html',
	styleUrl: './creature-actions-demo.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatureActionsDemoComponent {
	readonly draft = input.required<CreatureDraft>();
	readonly effectiveActionsByTier =
		input.required<ReadonlyMap<number, CreatureTierAction[]>>();

	protected readonly demoTiers = computed<DemoTier[]>(() =>
		this.draft().tiers.map(tier => {
			const actions = this.effectiveActionsByTier().get(tier.tier) ?? [];
			return {
				tier: tier.tier,
				name: tier.name,
				attacks: this.attackGroups(actions),
				abilities: this.abilityActions(actions, tier.abilities),
				contextualActions: actions
					.filter(
						action => action.isActive && action.kind === 'condition_action'
					)
					.map(action => this.demoAction(action))
			};
		})
	);

	private attackGroups(actions: CreatureTierAction[]): DemoAttackGroup[] {
		const groups = new Map<string, DemoAttackGroup>();

		for (const action of actions.filter(
			item => item.isActive && item.kind === 'attack'
		)) {
			const sourceName = action.source?.name || 'Источник не задан';
			const group = groups.get(sourceName) ?? {
				sourceName,
				costText: this.costText(action),
				profileName: action.source?.profileName ?? '',
				actions: []
			};
			group.actions.push(this.demoAction(action));
			groups.set(sourceName, group);
		}

		return [...groups.values()];
	}

	private abilityActions(
		actions: CreatureTierAction[],
		abilities: CreatureTierAbility[]
	): DemoAction[] {
		const result = new Map<string, DemoAction>();

		for (const action of actions.filter(
			item => item.isActive && item.kind === 'active_ability'
		)) {
			const demoAction = this.demoAction(action);
			result.set(demoAction.label, demoAction);
		}

		for (const ability of abilities) {
			result.set(ability.name, {
				label: ability.name,
				description: ability.effectText || ability.description
			});
		}

		return [...result.values()];
	}

	private demoAction(action: CreatureTierAction): DemoAction {
		return {
			label: action.source?.intent?.name || action.name || 'Без названия',
			description: this.actionDescription(action)
		};
	}

	private actionDescription(action: CreatureTierAction): string {
		const effects = [...action.effects]
			.sort((first, second) => first.sortOrder - second.sortOrder)
			.map(effect => {
				switch (effect.type) {
					case 'damage':
						return 'нанести урон';
					case 'apply_condition':
						return `наложить ${effect.conditionDisplayName || effect.condition?.name || 'состояние'}`;
					case 'link_condition':
						return 'связать состояния';
					case 'unlink_condition':
						return 'разорвать связь состояний';
					case 'move_linked_target':
						return 'переместить связанную цель';
					case 'remove_condition':
						return `снять ${effect.conditionDisplayName || effect.condition?.name || 'состояние'}`;
					case 'dice_pool_modifier':
						return 'изменить пул кубиков';
					case 'special_rule':
						return effect.text.trim();
				}
			})
			.filter(Boolean);

		return effects.length ? effects.join(', ') : 'эффекты не заданы';
	}

	private costText(action: CreatureTierAction): string {
		switch (action.cost.mode) {
			case 'free':
				return '0 Потенциала';
			case 'fixed':
				return `${action.cost.potential ?? 0} Потенциала`;
			case 'per_meter':
				return `${action.cost.perMeter ?? 0} Потенциала за метр`;
			case 'rule':
				return 'Стоимость по правилу';
		}
	}
}
