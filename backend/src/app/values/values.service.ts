import { Injectable, NotFoundException } from '@nestjs/common';
import {
	Prisma,
	SystemValueBaseSourceType,
	SystemValueOwnerType,
	SystemValueBaseSourceType as PrismaBaseSourceType
} from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';

const systemValueSelect = {
	id: true,
	name: true,
	description: true,
	primaryOwnerType: true,
	primaryOwnerId: true,
	baseSourceType: true,
	calculationGraph: true,
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

	async updateCalculation(
		id: string,
		baseSourceType: SystemValueBaseSourceType,
		calculationGraph: unknown | null
	) {
		const value = await this.prisma.systemValue.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!value) {
			throw new NotFoundException('System value not found.');
		}

		return this.prisma.systemValue.update({
			select: systemValueSelect,
			where: { id },
			data: {
				baseSourceType,
				calculationGraph:
					baseSourceType === PrismaBaseSourceType.COMPUTED
						? ((calculationGraph ?? Prisma.JsonNull) as Prisma.InputJsonValue)
						: Prisma.DbNull
			}
		});
	}

	private mapSystemValue(
		value: SystemValueRecord,
		context: {
			skillMap: Map<string, SkillBaseValueRecord>;
			characteristicMap: Map<string, CharacteristicBaseValueRecord>;
			characteristicsByAttributeId: Map<string, CharacteristicBaseValueRecord[]>;
		}
	) {
		return {
			id: value.id,
			name: value.name,
			kind: mapOwnerType(value.primaryOwnerType),
			groupLabel: groupLabel(value.primaryOwnerType),
			contextLabel: this.contextLabel(value, context),
			description: value.description ?? '',
			baseSourceType: value.baseSourceType,
			baseValue: this.baseValue(value, context),
			calculationGraph: this.calculationGraph(value, context),
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
			characteristicsByAttributeId: Map<string, CharacteristicBaseValueRecord[]>;
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
			return context.characteristicMap.get(value.primaryOwnerId)?.defaultValue ?? 0;
		}

		if (
			value.primaryOwnerType === SystemValueOwnerType.ATTRIBUTE &&
			value.primaryOwnerId
		) {
			return (
				context.characteristicsByAttributeId
					.get(value.primaryOwnerId)
					?.reduce((total, characteristic) => total + characteristic.defaultValue, 0) ??
				0
			);
		}

		return 0;
	}

	private calculationGraph(
		value: SystemValueRecord,
		context: {
			characteristicsByAttributeId: Map<string, CharacteristicBaseValueRecord[]>;
		}
	) {
		if (
			value.calculationGraph ||
			value.baseSourceType !== PrismaBaseSourceType.COMPUTED ||
			value.primaryOwnerType !== SystemValueOwnerType.ATTRIBUTE ||
			!value.primaryOwnerId
		) {
			return value.calculationGraph;
		}

		return createAttributeGraph(
			value.id,
			context.characteristicsByAttributeId.get(value.primaryOwnerId) ?? []
		);
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

function createAttributeGraph(
	attributeValueId: string,
	characteristics: Array<{ id: string }>
) {
	if (!characteristics.length) {
		return createEmptyGraph();
	}

	const sourceNodes = characteristics.map((characteristic, index) => ({
		id: `attribute-${attributeValueId}-source-${characteristic.id}`,
		kind: 'source',
		x: 56,
		y: 48 + index * 132,
		sourceValueId: characteristic.id
	}));

	const operationNode = {
		id: `attribute-${attributeValueId}-sum`,
		kind: 'operation',
		x: 348,
		y: 96 + Math.max(0, (characteristics.length - 1) * 66),
		operation: 'sum'
	};

	const resultNode = {
		id: `attribute-${attributeValueId}-result`,
		kind: 'result',
		x: 638,
		y: operationNode.y
	};

	const edges = sourceNodes.map(node => ({
		id: `${node.id}:out -> ${operationNode.id}:in`,
		source: node.id,
		target: operationNode.id,
		sourceHandle: 'out',
		targetHandle: 'in'
	}));

	edges.push({
		id: `${operationNode.id}:out -> ${resultNode.id}:in`,
		source: operationNode.id,
		target: resultNode.id,
		sourceHandle: 'out',
		targetHandle: 'in'
	});

	return {
		nodes: [...sourceNodes, operationNode, resultNode],
		edges
	};
}

function createEmptyGraph() {
	return {
		nodes: [{ id: 'result', kind: 'result', x: 420, y: 180 }],
		edges: []
	};
}
