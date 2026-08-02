import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSystemCombatActionDto } from './dto/update-system-combat-action.dto';

const editableSystemCombatActionCoreKeys = [
	'wait_until_after_participant',
	'enter_defense_stance',
	'end_round_participation'
];

const systemCombatActionSelect = {
	id: true,
	coreKey: true,
	label: true,
	description: true,
	targetChoiceLabel: true,
	confirmationTitle: true,
	isEnabled: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.SystemCombatActionSelect;

type SystemCombatActionRecord = Prisma.SystemCombatActionGetPayload<{
	select: typeof systemCombatActionSelect;
}>;

@Injectable()
export class SystemCombatActionsService {
	constructor(private readonly prisma: PrismaService) {}

	async getCatalog() {
		const actions = await this.prisma.systemCombatAction.findMany({
			select: systemCombatActionSelect,
			where: {
				coreKey: {
					in: editableSystemCombatActionCoreKeys
				}
			},
			orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }]
		});

		return {
			actions: actions.map(action => this.mapAction(action))
		};
	}

	async updateAction(id: string, dto: UpdateSystemCombatActionDto) {
		await this.ensureActionExists(id);

		const action = await this.prisma.systemCombatAction.update({
			select: systemCombatActionSelect,
			where: { id },
			data: {
				label: dto.label === undefined ? undefined : dto.label.trim(),
				description:
					dto.description === undefined
						? undefined
						: this.toNullableString(dto.description),
				targetChoiceLabel:
					dto.targetChoiceLabel === undefined
						? undefined
						: this.toNullableString(dto.targetChoiceLabel),
				confirmationTitle:
					dto.confirmationTitle === undefined
						? undefined
						: this.toNullableString(dto.confirmationTitle)
			}
		});

		return this.mapAction(action);
	}

	private async ensureActionExists(id: string) {
		const action = await this.prisma.systemCombatAction.findFirst({
			select: { id: true },
			where: { id, coreKey: { in: editableSystemCombatActionCoreKeys } }
		});

		if (!action) {
			throw new NotFoundException('Системное боевое действие не найдено.');
		}
	}

	private toNullableString(value: string) {
		const normalized = value.trim();
		return normalized ? normalized : null;
	}

	private mapAction(action: SystemCombatActionRecord) {
		return {
			id: action.id,
			coreKey: action.coreKey,
			label: action.label,
			description: action.description ?? '',
			targetChoiceLabel: action.targetChoiceLabel ?? '',
			confirmationTitle: action.confirmationTitle ?? '',
			isEnabled: action.isEnabled,
			sortOrder: action.sortOrder,
			createdAt: action.createdAt.toISOString(),
			updatedAt: action.updatedAt.toISOString()
		};
	}
}
