import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { Prisma, SystemValueOwnerType } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { createCharacterInputGraph } from '../shared/system-value-graph.factory';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { createSlug } from '../shared/slug.util';
import { CreateManualSystemValueDto } from './dto/create-manual-system-value.dto';
import { UpdateSystemValueDto } from './dto/update-system-value.dto';

const systemValueSelect = {
	id: true,
	slug: true,
	name: true,
	description: true,
	primaryOwnerType: true,
	primaryOwnerId: true,
	coreKey: true,
	displaySection: true,
	calculationGraph: true,
	isSystemManaged: true,
	isActive: true,
	sortOrder: true,
	links: {
		select: {
			targetType: true,
			targetId: true,
			label: true,
			sortOrder: true
		},
		orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }]
	}
} satisfies Prisma.SystemValueSelect;

const characteristicBaseValueSelect = {
	id: true,
	defaultValue: true,
	attributeId: true
} satisfies Prisma.CharacteristicSelect;

const skillBaseValueSelect = {
	id: true,
	defaultLevel: true,
	category: {
		select: {
			name: true
		}
	}
} satisfies Prisma.SkillSelect;

type SystemValueRecord = Prisma.SystemValueGetPayload<{
	select: typeof systemValueSelect;
}>;
type SkillBaseValueRecord = Prisma.SkillGetPayload<{
	select: typeof skillBaseValueSelect;
}>;
type CharacteristicBaseValueRecord = Prisma.CharacteristicGetPayload<{
	select: typeof characteristicBaseValueSelect;
}>;

@Injectable()
export class ValuesService {
	constructor(private readonly prisma: PrismaService) {}

	async createManualValue(dto: CreateManualSystemValueDto) {
		try {
			const value = await this.prisma.systemValue.create({
				select: systemValueSelect,
				data: {
					name: dto.name.trim(),
					slug: createSlug(dto.name),
					description: dto.description?.trim() || null,
					primaryOwnerType: SystemValueOwnerType.MANUAL,
					primaryOwnerId: null,
					displaySection: dto.displaySection?.trim() || null,
					calculationGraph: createCharacterInputGraph()
				}
			});

			return this.mapSystemValue(value, {
				skillMap: new Map(),
				characteristicMap: new Map(),
				characteristicsByAttributeId: new Map()
			});
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать значение системы.');
		}
	}

	async getCatalog() {
		const [values, skills, characteristics] = await Promise.all([
			this.prisma.systemValue.findMany({
				select: systemValueSelect,
				orderBy: [
					{ primaryOwnerType: 'asc' },
					{ sortOrder: 'asc' },
					{ name: 'asc' }
				]
			}),
			this.prisma.skill.findMany({
				select: skillBaseValueSelect
			}),
			this.prisma.characteristic.findMany({
				select: characteristicBaseValueSelect
			})
		]);

		const skillMap = new Map(skills.map(skill => [skill.id, skill]));
		const characteristicMap = new Map(
			characteristics.map(characteristic => [characteristic.id, characteristic])
		);
		const characteristicsByAttributeId = new Map<
			string,
			CharacteristicBaseValueRecord[]
		>();

		for (const characteristic of characteristics) {
			const items =
				characteristicsByAttributeId.get(characteristic.attributeId) ?? [];
			items.push(characteristic);
			characteristicsByAttributeId.set(characteristic.attributeId, items);
		}

		return {
			values: values.map(value =>
				this.mapSystemValue(value, {
					skillMap,
					characteristicMap,
					characteristicsByAttributeId
				})
			)
		};
	}

	async updateCalculation(id: string, calculationGraph: unknown | null) {
		const value = await this.prisma.systemValue.findUnique({
			select: { id: true, coreKey: true, isSystemManaged: true },
			where: { id }
		});

		if (!value) {
			throw new NotFoundException('System value not found.');
		}

		if (value.isSystemManaged && !value.coreKey) {
			throw new BadRequestException(
				'Расчёт системного значения управляется системой.'
			);
		}

		return this.prisma.systemValue.update({
			select: systemValueSelect,
			where: { id },
			data: {
				calculationGraph: (calculationGraph ??
					createEmptyGraph()) as Prisma.InputJsonValue
			}
		});
	}

	async updateManualValue(id: string, dto: UpdateSystemValueDto) {
		const value = await this.prisma.systemValue.findUnique({
			select: {
				id: true,
				primaryOwnerType: true,
				coreKey: true,
				isSystemManaged: true
			},
			where: { id }
		});

		if (!value) {
			throw new NotFoundException('System value not found.');
		}

		if (
			value.primaryOwnerType !== SystemValueOwnerType.MANUAL ||
			(value.isSystemManaged && !value.coreKey)
		) {
			throw new BadRequestException(
				'Можно редактировать только свободные значения системы.'
			);
		}

		try {
			const updated = await this.prisma.systemValue.update({
				select: systemValueSelect,
				where: { id },
				data: {
					...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
					...(dto.description !== undefined
						? { description: dto.description.trim() || null }
						: {}),
					...(dto.displaySection !== undefined
						? { displaySection: dto.displaySection.trim() || null }
						: {})
				}
			});

			return this.mapSystemValue(updated, {
				skillMap: new Map(),
				characteristicMap: new Map(),
				characteristicsByAttributeId: new Map()
			});
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить значение системы.');
		}
	}

	async deleteManualValue(id: string) {
		const value = await this.prisma.systemValue.findUnique({
			select: {
				id: true,
				primaryOwnerType: true,
				isSystemManaged: true
			},
			where: { id }
		});

		if (!value) {
			throw new NotFoundException('System value not found.');
		}

		if (
			value.isSystemManaged ||
			value.primaryOwnerType !== SystemValueOwnerType.MANUAL
		) {
			throw new BadRequestException(
				'Можно удалять только свободные значения системы.'
			);
		}

		await this.prisma.systemValue.delete({
			where: { id }
		});
	}

	private mapSystemValue(
		value: SystemValueRecord,
		context: {
			skillMap: Map<string, SkillBaseValueRecord>;
			characteristicMap: Map<string, CharacteristicBaseValueRecord>;
			characteristicsByAttributeId: Map<
				string,
				CharacteristicBaseValueRecord[]
			>;
		}
	) {
		return {
			id: value.id,
			slug: value.slug,
			name: value.name,
			kind: mapOwnerType(value.primaryOwnerType),
			groupLabel:
				value.displaySection?.trim() || groupLabel(value.primaryOwnerType),
			displaySection: value.displaySection ?? '',
			contextLabel: this.contextLabel(value, context),
			description: value.description ?? '',
			coreKey: value.coreKey,
			isSystemManaged: value.isSystemManaged,
			baseValue: this.baseValue(value, context),
			calculationGraph: value.calculationGraph ?? createEmptyGraph(),
			primaryOwner: {
				type: mapOwnerType(value.primaryOwnerType),
				id: value.primaryOwnerId
			},
			links: value.links.map(link => ({
				targetType: mapOwnerType(link.targetType),
				targetId: link.targetId,
				label: link.label ?? '',
				sortOrder: link.sortOrder
			}))
		};
	}

	private contextLabel(
		value: SystemValueRecord,
		context: { skillMap: Map<string, SkillBaseValueRecord> }
	) {
		if (
			value.primaryOwnerType === SystemValueOwnerType.SKILL &&
			value.primaryOwnerId
		) {
			return context.skillMap.get(value.primaryOwnerId)?.category.name ?? '';
		}

		return '';
	}

	private baseValue(
		value: SystemValueRecord,
		context: {
			skillMap: Map<string, SkillBaseValueRecord>;
			characteristicMap: Map<string, CharacteristicBaseValueRecord>;
			characteristicsByAttributeId: Map<
				string,
				CharacteristicBaseValueRecord[]
			>;
		}
	) {
		if (
			value.primaryOwnerType === SystemValueOwnerType.SKILL &&
			value.primaryOwnerId
		) {
			return context.skillMap.get(value.primaryOwnerId)?.defaultLevel ?? 0;
		}

		if (
			value.primaryOwnerType === SystemValueOwnerType.CHARACTERISTIC &&
			value.primaryOwnerId
		) {
			return (
				context.characteristicMap.get(value.primaryOwnerId)?.defaultValue ?? 0
			);
		}

		if (
			value.primaryOwnerType === SystemValueOwnerType.ATTRIBUTE &&
			value.primaryOwnerId
		) {
			return (
				context.characteristicsByAttributeId
					.get(value.primaryOwnerId)
					?.reduce(
						(total, characteristic) => total + characteristic.defaultValue,
						0
					) ?? 0
			);
		}

		return 0;
	}
}

function mapOwnerType(type: SystemValueOwnerType) {
	switch (type) {
		case SystemValueOwnerType.ATTRIBUTE:
			return 'attribute';
		case SystemValueOwnerType.CHARACTERISTIC:
			return 'characteristic';
		case SystemValueOwnerType.SKILL:
			return 'skill';
		case SystemValueOwnerType.ROLL_CONSEQUENCE:
			return 'roll-consequence';
		case SystemValueOwnerType.MANUAL:
			return 'manual';
	}
}

function groupLabel(type: SystemValueOwnerType) {
	switch (type) {
		case SystemValueOwnerType.ATTRIBUTE:
			return 'Атрибуты';
		case SystemValueOwnerType.CHARACTERISTIC:
			return 'Характеристики';
		case SystemValueOwnerType.SKILL:
			return 'Навыки';
		case SystemValueOwnerType.ROLL_CONSEQUENCE:
			return 'Последствия броска';
		case SystemValueOwnerType.MANUAL:
			return 'Без раздела';
	}
}

function createEmptyGraph() {
	return {
		nodes: [{ id: 'result', kind: 'result', x: 420, y: 180 }],
		edges: []
	};
}
