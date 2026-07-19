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
	maxLevel: true,
	removalMethods: true,
	effects: true,
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
			maxLevel: dto.maxLevel ?? 1,
			removalMethods: (dto.removalMethods ?? []) as Prisma.InputJsonValue,
			effects: this.normalizeEffects(dto.effects),
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
			maxLevel: dto.maxLevel,
			removalMethods:
				dto.removalMethods === undefined
					? undefined
					: (dto.removalMethods as Prisma.InputJsonValue),
			effects:
				dto.effects === undefined
					? undefined
					: this.normalizeEffects(dto.effects),
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
			maxLevel: condition.maxLevel,
			removalMethods: normalizeRemovalMethods(condition.removalMethods),
			effects: normalizeEffects(condition.effects),
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

const conditionTextTokens = [
	'conditionName',
	'description',
	'duration',
	'currentLevel',
	'maxLevel',
	'remainingDuration',
	'removalMethods',
	'effects',
	'source',
	'bodyPart'
] as const;

type ConditionTextToken = (typeof conditionTextTokens)[number];

function isConditionTextToken(value: unknown): value is ConditionTextToken {
	return (
		typeof value === 'string' &&
		conditionTextTokens.includes(value as ConditionTextToken)
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

function isJsonObject(value: Prisma.JsonValue): value is Prisma.JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
