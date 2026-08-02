import { Prisma } from '../__generated__';

const SYSTEM_COMBAT_ACTIONS = [
	{
		coreKey: 'wait_until_after_participant',
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
		coreKey: 'enter_defense_stance',
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
		coreKey: 'end_round_participation',
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
] as const;

export async function seedSystemCombatActions(tx: Prisma.TransactionClient) {
	for (const action of SYSTEM_COMBAT_ACTIONS) {
		await tx.systemCombatAction.upsert({
			where: { coreKey: action.coreKey },
			create: action,
			update: {}
		});
	}
}
