import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
	CombatActionDefinition,
	CombatActionProvider,
	CombatActionProviderContext
} from '../combat-available-actions.types';
import { coreCombatActionKeys } from '../domain/core-combat-actions';
import { campaignMemberRoles } from '../domain/combat-encounter.types';
import { RuntimeAction } from '../domain/combat-encounter-runtime.types';

interface SystemCombatActionSetting {
	coreKey: string;
	label: string;
	description: string | null;
	targetChoiceLabel: string | null;
	confirmationTitle: string | null;
	optionLabelTemplate: string | null;
	costLabelTemplate: string | null;
	unavailableText: string | null;
	isEnabled: boolean;
	sortOrder: number;
}

const DEFAULT_SYSTEM_COMBAT_ACTIONS: SystemCombatActionSetting[] = [
	{
		coreKey: coreCombatActionKeys.waitUntilAfterParticipant,
		label: 'Выждать',
		description:
			'Потратьте Потенциал, чтобы уступить инициативу выбранному участнику и действовать после него.',
		targetChoiceLabel: 'Действовать после',
		confirmationTitle: null,
		optionLabelTemplate: 'Действовать после {participant}',
		costLabelTemplate: '−{cost}',
		unavailableText: 'Нет участника, после которого можно действовать.',
		isEnabled: true,
		sortOrder: 10_010
	},
	{
		coreKey: coreCombatActionKeys.enterDefenseStance,
		label: 'Перейти в оборону',
		description:
			'Откажитесь от активных действий до конца текущего раунда и сохраните оставшийся Потенциал для защитных реакций.',
		targetChoiceLabel: null,
		confirmationTitle: 'Перейти в оборону?',
		optionLabelTemplate: null,
		costLabelTemplate: null,
		unavailableText: 'Участник уже в обороне.',
		isEnabled: true,
		sortOrder: 10_020
	},
	{
		coreKey: coreCombatActionKeys.endRoundParticipation,
		label: 'Завершить участие в раунде',
		description:
			'Участник выходит из очереди до следующего раунда и не сможет использовать оставшийся Потенциал на действия, защиты и реакции.',
		targetChoiceLabel: null,
		confirmationTitle: 'Завершить участие в раунде?',
		optionLabelTemplate: null,
		costLabelTemplate: null,
		unavailableText: 'Участник уже завершил участие в этом раунде.',
		isEnabled: true,
		sortOrder: 10_030
	}
];

@Injectable()
export class BasicCombatActionProvider implements CombatActionProvider {
	constructor(private readonly prisma: PrismaService) {}

	async collect(
		context: CombatActionProviderContext
	): Promise<CombatActionDefinition[]> {
		const settings = await this.findSettings();

		return settings
			.filter(setting => setting.isEnabled)
			.filter(
				setting =>
					this.canUseSystemAction(setting.coreKey, context)
			)
			.map(setting => ({
				sourceType: 'system' as const,
				action: this.toRuntimeAction(setting)
			}));
	}

	private canUseSystemAction(
		coreKey: string,
		context: CombatActionProviderContext
	) {
		if (coreKey === coreCombatActionKeys.endRoundParticipation) {
			return context.currentUserRole === campaignMemberRoles.gm;
		}

		if (
			context.participant.kind === 'PLAYER_CHARACTER' &&
			context.currentUserRole === campaignMemberRoles.gm
		) {
			return false;
		}

		return true;
	}

	private async findSettings() {
		const settings = await this.prisma.systemCombatAction.findMany({
			where: {
				coreKey: {
					in: DEFAULT_SYSTEM_COMBAT_ACTIONS.map(action => action.coreKey)
				}
			}
		});
		const byCoreKey = new Map(
			settings.map(setting => [setting.coreKey, setting])
		);

		return DEFAULT_SYSTEM_COMBAT_ACTIONS.map(
			defaultSetting => byCoreKey.get(defaultSetting.coreKey) ?? defaultSetting
		);
	}

	private toRuntimeAction(setting: SystemCombatActionSetting): RuntimeAction {
		return {
			slug: setting.coreKey,
			name: setting.label,
			kind: 'system',
			source: {
				type: 'custom',
				name: 'Система',
				slug: 'system',
				profileName: '',
				intent: null
			},
			cost: {
				mode: 'free',
				potential: null
			},
			target: {
				type:
					setting.coreKey === coreCombatActionKeys.waitUntilAfterParticipant
						? 'creature'
						: 'self'
			},
			roll: null,
			defense: null,
			effects: [],
			playerText: setting.description,
			targetChoiceLabel: setting.targetChoiceLabel,
			confirmationTitle: setting.confirmationTitle,
			optionLabelTemplate: setting.optionLabelTemplate,
			costLabelTemplate: setting.costLabelTemplate,
			isActive: true,
			sortOrder: setting.sortOrder
		};
	}
}
