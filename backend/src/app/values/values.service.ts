import { Injectable, NotFoundException } from '@nestjs/common';
import {
	Prisma,
	SystemValueBaseSourceType,
	SystemValueBaseSourceType as PrismaBaseSourceType
} from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';

const skillSelect = {
	id: true,
	name: true,
	categoryId: true,
	description: true,
	defaultLevel: true,
	isSystemValue: true,
	baseSourceType: true,
	calculationGraph: true
} satisfies Prisma.SkillSelect;

const skillCategorySelect = {
	id: true,
	name: true
} satisfies Prisma.SkillCategorySelect;

const attributeSelect = {
	id: true,
	name: true,
	description: true,
	isSystemValue: true,
	baseSourceType: true,
	calculationGraph: true
} satisfies Prisma.AttributeSelect;

const characteristicSelect = {
	id: true,
	name: true,
	attributeId: true,
	description: true,
	defaultValue: true,
	isSystemValue: true,
	baseSourceType: true,
	calculationGraph: true
} satisfies Prisma.CharacteristicSelect;

type SourceType = 'skill' | 'attribute' | 'characteristic';

@Injectable()
export class ValuesService {
	constructor(private readonly prisma: PrismaService) {}

	async getCatalog() {
		const [skills, categories, attributes, characteristics] = await Promise.all([
			this.prisma.skill.findMany({
				select: skillSelect,
				where: { isSystemValue: true },
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.skillCategory.findMany({
				select: skillCategorySelect
			}),
			this.prisma.attribute.findMany({
				select: attributeSelect,
				where: { isSystemValue: true },
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.characteristic.findMany({
				select: characteristicSelect,
				where: { isSystemValue: true },
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			})
		]);

		const categoryMap = new Map(categories.map(category => [category.id, category.name]));
		const attributeMap = new Map(attributes.map(attribute => [attribute.id, attribute]));

		return {
			values: [
				...attributes.map(attribute => {
					const relatedCharacteristics = characteristics.filter(
						characteristic => characteristic.attributeId === attribute.id
					);

					return {
						id: attribute.id,
						name: attribute.name,
						kind: 'attribute',
						groupLabel: 'Атрибуты',
						contextLabel: '',
						description: attribute.description ?? '',
						isSystemValue: attribute.isSystemValue,
						baseSourceType: attribute.baseSourceType,
						baseValue: relatedCharacteristics.reduce(
							(total, characteristic) => total + characteristic.defaultValue,
							0
						),
						calculationGraph:
							attribute.calculationGraph ??
							(attribute.baseSourceType === PrismaBaseSourceType.COMPUTED
								? createAttributeGraph(attribute.id, relatedCharacteristics)
								: null)
					};
				}),
				...characteristics.map(characteristic => ({
					id: characteristic.id,
					name: characteristic.name,
					kind: 'characteristic',
					groupLabel: 'Характеристики',
					contextLabel:
						attributeMap.get(characteristic.attributeId)?.name ?? '',
					description: characteristic.description ?? '',
					isSystemValue: characteristic.isSystemValue,
					baseSourceType: characteristic.baseSourceType,
					baseValue: characteristic.defaultValue,
					calculationGraph: characteristic.calculationGraph
				})),
				...skills.map(skill => ({
					id: skill.id,
					name: skill.name,
					kind: 'skill',
					groupLabel: 'Навыки',
					contextLabel: categoryMap.get(skill.categoryId) ?? '',
					description: skill.description ?? '',
					isSystemValue: skill.isSystemValue,
					baseSourceType: skill.baseSourceType,
					baseValue: skill.defaultLevel,
					calculationGraph: skill.calculationGraph
				}))
			]
		};
	}

	async updateCalculation(
		sourceType: SourceType,
		id: string,
		baseSourceType: SystemValueBaseSourceType,
		calculationGraph: unknown | null
	) {
		switch (sourceType) {
			case 'skill':
				return this.updateSkillCalculation(id, baseSourceType, calculationGraph);
			case 'attribute':
				return this.updateAttributeCalculation(id, baseSourceType, calculationGraph);
			case 'characteristic':
				return this.updateCharacteristicCalculation(id, baseSourceType, calculationGraph);
		}
	}

	private async updateSkillCalculation(
		id: string,
		baseSourceType: SystemValueBaseSourceType,
		calculationGraph: unknown | null
	) {
		const skill = await this.prisma.skill.findUnique({
			select: skillSelect,
			where: { id }
		});

		if (!skill || !skill.isSystemValue) {
			throw new NotFoundException('System value not found.');
		}

		return this.prisma.skill.update({
			select: skillSelect,
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

	private async updateAttributeCalculation(
		id: string,
		baseSourceType: SystemValueBaseSourceType,
		calculationGraph: unknown | null
	) {
		const attribute = await this.prisma.attribute.findUnique({
			select: attributeSelect,
			where: { id }
		});

		if (!attribute || !attribute.isSystemValue) {
			throw new NotFoundException('System value not found.');
		}

		return this.prisma.attribute.update({
			select: attributeSelect,
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

	private async updateCharacteristicCalculation(
		id: string,
		baseSourceType: SystemValueBaseSourceType,
		calculationGraph: unknown | null
	) {
		const characteristic = await this.prisma.characteristic.findUnique({
			select: characteristicSelect,
			where: { id }
		});

		if (!characteristic || !characteristic.isSystemValue) {
			throw new NotFoundException('System value not found.');
		}

		return this.prisma.characteristic.update({
			select: characteristicSelect,
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
}

function createAttributeGraph(
	attributeId: string,
	characteristics: Array<{ id: string }>
) {
	if (!characteristics.length) {
		return createEmptyGraph();
	}

	const sourceNodes = characteristics.map((characteristic, index) => ({
		id: `attribute-${attributeId}-source-${characteristic.id}`,
		kind: 'source',
		x: 56,
		y: 48 + index * 132,
		sourceValueId: characteristic.id
	}));

	const operationNode = {
		id: `attribute-${attributeId}-sum`,
		kind: 'operation',
		x: 348,
		y: 96 + Math.max(0, (characteristics.length - 1) * 66),
		operation: 'sum'
	};

	const resultNode = {
		id: `attribute-${attributeId}-result`,
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
