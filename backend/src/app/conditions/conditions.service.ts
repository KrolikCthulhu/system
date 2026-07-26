import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { createSlug } from '../shared/slug.util';
import { CreateConditionDto } from './dto/create-condition.dto';
import { UpdateConditionDto } from './dto/update-condition.dto';
import {
	type ConditionDurationType,
	type ConditionEffectScope,
	type ConditionEffectType,
	type ConditionApplicationConditionType,
	type ConditionDuplicateInstanceMode,
	type ConditionInstanceLimitMode,
	type ConditionInstanceMode,
	type ConditionInstanceOverflowMode,
	type ConditionInstanceUniquenessMode,
	type ConditionParameterValueSource,
	type ConditionParameterType,
	type ConditionRepeatDurationMode,
	type ConditionRepeatLevelMode,
	type ConditionRemovalMethod
} from './dto/condition-rules.constants';

const conditionSelect = {
	id: true,
	slug: true,
	name: true,
	description: true,
	durationType: true,
	repeatLevelMode: true,
	repeatDurationMode: true,
	instanceMode: true,
	instanceLimitMode: true,
	maxInstances: true,
	instanceOverflowMode: true,
	instanceUniquenessMode: true,
	duplicateInstanceMode: true,
	maxLevel: true,
	removalMethods: true,
	effects: true,
	applicationConditions: true,
	parameters: true,
	textBlocks: true,
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.ConditionSelect;

type ConditionRecord = Prisma.ConditionGetPayload<{
	select: typeof conditionSelect;
}>;

@Injectable()
export class ConditionsService {
	constructor(private readonly prisma: PrismaService) {}

	async getCatalog() {
		const conditions = await this.prisma.condition.findMany({
			select: conditionSelect,
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		});

		return { conditions: conditions.map(item => this.mapCondition(item)) };
	}

	async createCondition(dto: CreateConditionDto) {
		try {
			const condition = await this.prisma.condition.create({
				select: conditionSelect,
				data: this.toCreateData(dto)
			});

			return this.mapCondition(condition);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать состояние.', {
				uniqueMessage: 'Состояние с таким названием уже существует.'
			});
		}
	}

	async updateCondition(id: string, dto: UpdateConditionDto) {
		await this.ensureConditionExists(id);

		try {
			const condition = await this.prisma.condition.update({
				select: conditionSelect,
				where: { id },
				data: this.toUpdateData(dto)
			});

			return this.mapCondition(condition);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить состояние.', {
				uniqueMessage: 'Состояние с таким названием уже существует.'
			});
		}
	}

	async deleteCondition(id: string) {
		await this.ensureConditionExists(id);
		await this.prisma.condition.delete({ where: { id } });
	}

	private async ensureConditionExists(id: string) {
		const condition = await this.prisma.condition.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!condition) {
			throw new NotFoundException('Состояние не найдено.');
		}
	}

	private toCreateData(dto: CreateConditionDto) {
		return {
			slug: createSlug(dto.name),
			name: dto.name.trim(),
			description: this.toNullableString(dto.description),
			durationType: dto.durationType ?? 'until_owner_next_activation',
			repeatLevelMode: dto.repeatLevelMode ?? 'keep_highest',
			repeatDurationMode: dto.repeatDurationMode ?? 'keep_highest',
			instanceMode: dto.instanceMode ?? 'single',
			instanceLimitMode: dto.instanceLimitMode ?? 'fixed',
			maxInstances: dto.maxInstances ?? 1,
			instanceOverflowMode: dto.instanceOverflowMode ?? 'reject_new',
			instanceUniquenessMode: dto.instanceUniquenessMode ?? 'none',
			duplicateInstanceMode: dto.duplicateInstanceMode ?? 'update_existing',
			maxLevel: dto.maxLevel ?? 1,
			removalMethods: (dto.removalMethods ?? []) as Prisma.InputJsonValue,
			effects: this.normalizeEffects(dto.effects),
			applicationConditions: this.normalizeApplicationConditions(
				dto.applicationConditions
			),
			parameters: this.normalizeParameters(dto.parameters),
			textBlocks: this.normalizeTextBlocks(dto.textBlocks),
			isActive: dto.isActive ?? true,
			sortOrder: dto.sortOrder ?? 0
		};
	}

	private toUpdateData(dto: UpdateConditionDto) {
		return {
			name: dto.name === undefined ? undefined : dto.name.trim(),
			description:
				dto.description === undefined
					? undefined
					: this.toNullableString(dto.description),
			durationType: dto.durationType,
			repeatLevelMode: dto.repeatLevelMode,
			repeatDurationMode: dto.repeatDurationMode,
			instanceMode: dto.instanceMode,
			instanceLimitMode: dto.instanceLimitMode,
			maxInstances: dto.maxInstances,
			instanceOverflowMode: dto.instanceOverflowMode,
			instanceUniquenessMode: dto.instanceUniquenessMode,
			duplicateInstanceMode: dto.duplicateInstanceMode,
			maxLevel: dto.maxLevel,
			removalMethods:
				dto.removalMethods === undefined
					? undefined
					: (dto.removalMethods as Prisma.InputJsonValue),
			effects:
				dto.effects === undefined
					? undefined
					: this.normalizeEffects(dto.effects),
			applicationConditions:
				dto.applicationConditions === undefined
					? undefined
					: this.normalizeApplicationConditions(dto.applicationConditions),
			parameters:
				dto.parameters === undefined
					? undefined
					: this.normalizeParameters(dto.parameters),
			textBlocks:
				dto.textBlocks === undefined
					? undefined
					: this.normalizeTextBlocks(dto.textBlocks),
			isActive: dto.isActive,
			sortOrder: dto.sortOrder
		};
	}

	private toNullableString(value?: string | null) {
		if (value === undefined || value === null) {
			return null;
		}

		const normalized = value.trim();
		return normalized ? normalized : null;
	}

	private mapCondition(condition: ConditionRecord) {
		return {
			id: condition.id,
			slug: condition.slug,
			name: condition.name,
			description: condition.description ?? '',
			durationType: condition.durationType as ConditionDurationType,
			repeatLevelMode: condition.repeatLevelMode as ConditionRepeatLevelMode,
			repeatDurationMode:
				condition.repeatDurationMode as ConditionRepeatDurationMode,
			instanceMode: condition.instanceMode as ConditionInstanceMode,
			instanceLimitMode:
				condition.instanceLimitMode as ConditionInstanceLimitMode,
			maxInstances: condition.maxInstances,
			instanceOverflowMode:
				condition.instanceOverflowMode as ConditionInstanceOverflowMode,
			instanceUniquenessMode:
				condition.instanceUniquenessMode as ConditionInstanceUniquenessMode,
			duplicateInstanceMode:
				condition.duplicateInstanceMode as ConditionDuplicateInstanceMode,
			maxLevel: condition.maxLevel,
			removalMethods: normalizeRemovalMethods(condition.removalMethods),
			effects: normalizeEffects(condition.effects),
			applicationConditions: normalizeApplicationConditions(
				condition.applicationConditions
			),
			parameters: normalizeParameters(condition.parameters),
			textBlocks: normalizeTextBlocks(condition.textBlocks),
			isActive: condition.isActive,
			sortOrder: condition.sortOrder,
			createdAt: condition.createdAt.toISOString(),
			updatedAt: condition.updatedAt.toISOString()
		};
	}

	private normalizeEffects(
		effects:
			| Array<{
					type: ConditionEffectType;
					scope: ConditionEffectScope;
					value?: number;
					config?: Record<string, unknown>;
					sortOrder?: number;
			  }>
			| undefined
	): Prisma.InputJsonValue {
		return (effects ?? []).map((effect, index) => ({
			type: effect.type,
			scope: effect.scope,
			value: effect.value,
			config: effect.config ?? {},
			sortOrder: effect.sortOrder ?? index
		})) as Prisma.InputJsonValue;
	}

	private normalizeApplicationConditions(
		conditions:
			| Array<{
					type: ConditionApplicationConditionType;
					isActive?: boolean;
					config?: unknown;
					sortOrder?: number;
			  }>
			| undefined
	): Prisma.InputJsonValue {
		return (conditions ?? []).map((condition, index) => ({
			type: condition.type,
			isActive: condition.isActive ?? true,
			config: normalizeApplicationConditionConfig(condition.config),
			sortOrder: condition.sortOrder ?? index
		})) as Prisma.InputJsonValue;
	}

	private normalizeParameters(
		parameters:
			| Array<{
					key: string;
					label: string;
					type: ConditionParameterType;
					valueSource?: ConditionParameterValueSource;
					isRequired?: boolean;
					defaultValue?: string | number | boolean | Record<string, unknown>;
					sortOrder?: number;
			  }>
			| undefined
	): Prisma.InputJsonValue {
		return (parameters ?? []).flatMap((parameter, index) => {
			const key = normalizeParameterKey(parameter.key);

			if (!key || !parameter.label.trim()) {
				return [];
			}

			return [
				{
					key,
					label: parameter.label.trim(),
					type: parameter.type,
					valueSource: parameter.valueSource ?? 'manual',
					isRequired: parameter.isRequired ?? true,
					defaultValue: normalizeParameterDefaultValue(parameter.defaultValue),
					sortOrder: parameter.sortOrder ?? index
				}
			];
		}) as Prisma.InputJsonValue;
	}

	private normalizeTextBlocks(
		textBlocks:
			| Array<{
					kind: string;
					text?: string;
					token?: string;
					isActive?: boolean;
					sortOrder?: number;
			  }>
			| undefined
	): Prisma.InputJsonValue {
		const result: Array<Record<string, unknown>> = [];

		(textBlocks ?? []).forEach((block, index) => {
			const sortOrder = block.sortOrder ?? index;

			if (block.kind === 'text') {
				result.push({
					kind: 'text',
					text: block.text ?? '',
					isActive: block.isActive ?? true,
					sortOrder
				});
				return;
			}

			if (block.kind === 'token' && isConditionTextToken(block.token)) {
				result.push({
					kind: 'token',
					token: block.token,
					isActive: block.isActive ?? true,
					sortOrder
				});
			}
		});

		return result as Prisma.InputJsonValue;
	}
}

function normalizeRemovalMethods(
	value: Prisma.JsonValue
): ConditionRemovalMethod[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(
		(item): item is ConditionRemovalMethod => typeof item === 'string'
	);
}

function normalizeEffects(value: Prisma.JsonValue) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap(item => {
		if (!isJsonObject(item)) {
			return [];
		}

		const type = item['type'];
		const scope = item['scope'];

		if (typeof type !== 'string' || typeof scope !== 'string') {
			return [];
		}

		return [
			{
				type: type as ConditionEffectType,
				scope: scope as ConditionEffectScope,
				value: typeof item['value'] === 'number' ? item['value'] : undefined,
				config: isJsonObject(item['config']) ? item['config'] : {},
				sortOrder: typeof item['sortOrder'] === 'number' ? item['sortOrder'] : 0
			}
		];
	});
}

function normalizeApplicationConditions(value: Prisma.JsonValue) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((item, index) => {
		if (!isJsonObject(item)) {
			return [];
		}

		const type = item['type'];

		if (typeof type !== 'string') {
			return [];
		}

		return [
			{
				type: type as ConditionApplicationConditionType,
				isActive:
					typeof item['isActive'] === 'boolean' ? item['isActive'] : true,
				config: normalizeApplicationConditionConfig(item['config']),
				sortOrder:
					typeof item['sortOrder'] === 'number' ? item['sortOrder'] : index
			}
		];
	});
}

function normalizeApplicationConditionConfig(value: unknown) {
	if (!isJsonObject(value)) {
		return {};
	}

	const result: Record<string, unknown> = {};

	if (typeof value['conditionId'] === 'string') {
		result['conditionId'] = value['conditionId'];
	}

	if (typeof value['sizeMode'] === 'string') {
		result['sizeMode'] = value['sizeMode'];
	}

	if (typeof value['sizeDelta'] === 'number') {
		result['sizeDelta'] = Math.max(0, Math.trunc(value['sizeDelta']));
	}

	return result;
}

function normalizeParameters(value: Prisma.JsonValue) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap(item => {
		if (!isJsonObject(item)) {
			return [];
		}

		const key = normalizeParameterKey(item['key']);
		const label = typeof item['label'] === 'string' ? item['label'].trim() : '';
		const type = item['type'];
		const valueSource = item['valueSource'];

		if (!key || !label || typeof type !== 'string') {
			return [];
		}

		return [
			{
				key,
				label,
				type: type as ConditionParameterType,
				valueSource:
					typeof valueSource === 'string'
						? (valueSource as ConditionParameterValueSource)
						: 'manual',
				isRequired:
					typeof item['isRequired'] === 'boolean' ? item['isRequired'] : true,
				defaultValue: normalizeParameterDefaultValue(item['defaultValue']),
				sortOrder: typeof item['sortOrder'] === 'number' ? item['sortOrder'] : 0
			}
		];
	});
}

const conditionTextTokens = [
	'conditionName',
	'ownerName',
	'description',
	'duration',
	'currentLevel',
	'maxLevel',
	'remainingDuration',
	'removalMethods',
	'effects',
	'source',
	'targetName',
	'bodyPart',
	'holdingPart',
	'maxDistanceMeters',
	'movementRule',
	'escapeMode',
	'escapeCostPotential',
	'escapeDifficulty',
	'escapeRule'
] as const;

type ConditionTextToken =
	| (typeof conditionTextTokens)[number]
	| `parameter:${string}`;

function isConditionTextToken(value: unknown): value is ConditionTextToken {
	return (
		typeof value === 'string' &&
		(conditionTextTokens.includes(
			value as (typeof conditionTextTokens)[number]
		) ||
			/^parameter:[a-z][a-z0-9_]*$/.test(value))
	);
}

function normalizeTextBlocks(value: Prisma.JsonValue) {
	if (!Array.isArray(value)) {
		return [];
	}

	const result: Array<Record<string, unknown>> = [];

	value.forEach((item, index) => {
		if (!isJsonObject(item)) {
			return;
		}

		const kind = item['kind'];
		const sortOrder =
			typeof item['sortOrder'] === 'number' ? item['sortOrder'] : index;
		const isActive =
			typeof item['isActive'] === 'boolean' ? item['isActive'] : true;

		if (kind === 'text') {
			result.push({
				kind,
				text: typeof item['text'] === 'string' ? item['text'] : '',
				isActive,
				sortOrder
			});
			return;
		}

		const token = item['token'];

		if (kind === 'token' && isConditionTextToken(token)) {
			result.push({ kind, token, isActive, sortOrder });
		}
	});

	return result;
}

function isJsonObject(value: unknown): value is Prisma.JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeParameterKey(value: unknown) {
	if (typeof value !== 'string') {
		return '';
	}

	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9_]+/g, '_')
		.replace(/^_+|_+$/g, '');
}

function normalizeParameterDefaultValue(value: unknown) {
	if (
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
	) {
		return value;
	}

	if (isRuleTemplateValue(value)) {
		return value;
	}

	return undefined;
}

function isRuleTemplateValue(
	value: unknown
): value is Record<string, string | number> {
	if (!isJsonObject(value)) {
		return false;
	}

	const template = value['template'];

	return (
		template === 'opposed_check' ||
		template === 'fixed_difficulty' ||
		template === 'spend_potential' ||
		template === 'remove_source'
	);
}
