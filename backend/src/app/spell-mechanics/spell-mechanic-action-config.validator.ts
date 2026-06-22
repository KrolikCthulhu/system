import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import {
	SpellMechanicActionDto,
	SpellMechanicActionKindDto
} from './dto/spell-mechanic-action.dto';

type JsonObject = Record<string, unknown>;

type SourceKind =
	| 'mechanicParameter'
	| 'caster'
	| 'spellTarget'
	| 'actionResult'
	| 'constant'
	| 'linkedMagicWordSkill'
	| 'staticSkill';

const comparisonOperators = ['gt', 'gte', 'eq', 'lte', 'lt'] as const;
const valueChangeOperations = ['increase', 'decrease', 'set'] as const;
const effectScaleModes = ['best', 'choice', 'all', 'exact'] as const;

export function validateSpellMechanicActionConfig(
	action: SpellMechanicActionDto,
	path = action.name || action.kind
): Prisma.InputJsonObject {
	const config = toConfigObject(action.config);

	switch (action.kind) {
		case 'roll':
			validateOptionalSource(config, 'actor', ['mechanicParameter', 'caster', 'spellTarget', 'actionResult'], path);
			validateOptionalSource(config, 'skill', ['linkedMagicWordSkill', 'mechanicParameter', 'staticSkill'], path);
			validateOptionalString(config, 'resultName', path);
			validateOptionalBoolean(config, 'optional', path);
			return toInputJsonObject(config);
		case 'comparison':
			validateOptionalSource(config, 'left', ['mechanicParameter', 'actionResult', 'constant'], path);
			validateOptionalSource(config, 'right', ['mechanicParameter', 'actionResult', 'constant'], path);
			validateOptionalEnum(config, 'operator', comparisonOperators, path);
			validateOptionalString(config, 'resultName', path);
			validateOptionalString(config, 'marginResultName', path);
			return toInputJsonObject(config);
		case 'calculation':
			validateOptionalString(config, 'resultName', path);
			validateOptionalCalculationGraph(config, path);
			return toInputJsonObject(config);
		case 'branch':
			validateOptionalSource(config, 'condition', ['mechanicParameter', 'actionResult', 'constant'], path);
			validateNestedActions(config, 'thenActions', path);
			validateNestedActions(config, 'elseActions', path);
			return toInputJsonObject(config);
		case 'effectScale':
			validateOptionalSource(config, 'source', ['mechanicParameter', 'actionResult', 'constant'], path);
			validateOptionalEnum(config, 'mode', effectScaleModes, path);
			validateOptionalString(config, 'resultName', path);
			validateEffectScaleItems(config, path);
			return toInputJsonObject(config);
		case 'valueChange':
			validateOptionalSource(config, 'target', ['mechanicParameter', 'caster', 'spellTarget', 'actionResult'], path);
			validateOptionalSource(config, 'systemValue', ['mechanicParameter', 'actionResult', 'constant'], path);
			validateOptionalUuidString(config, 'systemValueId', path);
			validateOptionalEnum(config, 'operation', valueChangeOperations, path);
			validateOptionalSource(config, 'amount', ['mechanicParameter', 'actionResult', 'constant'], path);
			return toInputJsonObject(config);
		case 'conditionAdd':
			validateConditionConfig(config, path);
			validateOptionalSource(config, 'duration', ['mechanicParameter', 'actionResult', 'constant'], path);
			return toInputJsonObject(config);
		case 'conditionRemove':
			validateConditionConfig(config, path);
			return toInputJsonObject(config);
		case 'check':
		case 'text':
		case 'custom':
			return toInputJsonObject(config);
	}
}

function validateConditionConfig(config: JsonObject, path: string) {
	validateOptionalSource(config, 'target', ['mechanicParameter', 'caster', 'spellTarget', 'actionResult'], path);
	validateOptionalUuidString(config, 'conditionId', path);
	validateOptionalSource(config, 'source', ['mechanicParameter', 'caster', 'spellTarget', 'actionResult'], path);
}

function validateNestedActions(
	config: JsonObject,
	field: 'thenActions' | 'elseActions' | 'actions',
	path: string
) {
	const value = config[field];

	if (value === undefined) {
		return;
	}

	if (!Array.isArray(value)) {
		throw invalidConfig(path, `${field} должен быть массивом шагов.`);
	}

	value.forEach((item, index) => {
		if (!isRecord(item)) {
			throw invalidConfig(path, `${field}[${index}] должен быть объектом.`);
		}

		const kind = item['kind'];
		if (!isActionKind(kind)) {
			throw invalidConfig(path, `${field}[${index}].kind имеет неизвестный тип.`);
		}

		validateSpellMechanicActionConfig(
			{
				id: typeof item['id'] === 'string' ? item['id'] : undefined,
				name: typeof item['name'] === 'string' ? item['name'] : '',
				kind,
				config: isRecord(item['config']) ? item['config'] : {},
				isActive:
					typeof item['isActive'] === 'boolean' ? item['isActive'] : true,
				sortOrder:
					typeof item['sortOrder'] === 'number' ? item['sortOrder'] : index
			},
			`${path} / ${field}[${index}]`
		);
	});
}

function validateEffectScaleItems(config: JsonObject, path: string) {
	const items = config['items'];

	if (items === undefined) {
		return;
	}

	if (!Array.isArray(items)) {
		throw invalidConfig(path, 'items должен быть массивом пунктов шкалы.');
	}

	items.forEach((item, index) => {
		if (!isRecord(item)) {
			throw invalidConfig(path, `items[${index}] должен быть объектом.`);
		}

		if (typeof item['id'] !== 'string') {
			throw invalidConfig(path, `items[${index}].id должен быть строкой.`);
		}

		if (typeof item['threshold'] !== 'number') {
			throw invalidConfig(path, `items[${index}].threshold должен быть числом.`);
		}

		if (typeof item['name'] !== 'string') {
			throw invalidConfig(path, `items[${index}].name должен быть строкой.`);
		}

		if (item['description'] !== undefined && typeof item['description'] !== 'string') {
			throw invalidConfig(path, `items[${index}].description должен быть строкой.`);
		}

		const nestedPath = `${path} / items[${index}]`;
		const nestedConfig: JsonObject = { actions: item['actions'] };
		validateNestedActions(nestedConfig, 'actions', nestedPath);
	});
}

function validateOptionalSource(
	config: JsonObject,
	field: string,
	allowedKinds: readonly SourceKind[],
	path: string
) {
	const value = config[field];

	if (value === undefined) {
		return;
	}

	if (!isRecord(value) || typeof value['kind'] !== 'string') {
		throw invalidConfig(path, `${field} должен быть источником значения.`);
	}

	if (!allowedKinds.includes(value['kind'] as SourceKind)) {
		throw invalidConfig(path, `${field} имеет недопустимый тип источника.`);
	}

	switch (value['kind']) {
		case 'mechanicParameter':
			requireString(value, 'parameterId', field, path);
			return;
		case 'actionResult':
			requireString(value, 'actionId', field, path);
			requireString(value, 'resultName', field, path);
			return;
		case 'constant':
			if (typeof value['value'] !== 'number') {
				throw invalidConfig(path, `${field}.value должен быть числом.`);
			}
			return;
		case 'staticSkill':
			requireString(value, 'skillId', field, path);
			return;
		case 'caster':
		case 'spellTarget':
		case 'linkedMagicWordSkill':
			return;
	}
}

function validateOptionalCalculationGraph(config: JsonObject, path: string) {
	const graph = config['graph'];

	if (graph === undefined || graph === null) {
		return;
	}

	if (!isRecord(graph) || !Array.isArray(graph['nodes']) || !Array.isArray(graph['edges'])) {
		throw invalidConfig(path, 'graph должен содержать nodes и edges.');
	}
}

function validateOptionalString(config: JsonObject, field: string, path: string) {
	const value = config[field];

	if (value !== undefined && typeof value !== 'string') {
		throw invalidConfig(path, `${field} должен быть строкой.`);
	}
}

function validateOptionalUuidString(
	config: JsonObject,
	field: string,
	path: string
) {
	validateOptionalString(config, field, path);
}

function validateOptionalBoolean(config: JsonObject, field: string, path: string) {
	const value = config[field];

	if (value !== undefined && typeof value !== 'boolean') {
		throw invalidConfig(path, `${field} должен быть boolean.`);
	}
}

function validateOptionalEnum<T extends string>(
	config: JsonObject,
	field: string,
	values: readonly T[],
	path: string
) {
	const value = config[field];

	if (value !== undefined && !values.includes(value as T)) {
		throw invalidConfig(path, `${field} имеет недопустимое значение.`);
	}
}

function requireString(
	source: JsonObject,
	field: string,
	sourceName: string,
	path: string
) {
	if (typeof source[field] !== 'string') {
		throw invalidConfig(path, `${sourceName}.${field} должен быть строкой.`);
	}
}

function toConfigObject(value: Record<string, unknown> | undefined): JsonObject {
	return isRecord(value) ? value : {};
}

function toInputJsonObject(value: JsonObject): Prisma.InputJsonObject {
	return value as Prisma.InputJsonObject;
}

function isRecord(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isActionKind(value: unknown): value is SpellMechanicActionKindDto {
	return (
		value === 'roll' ||
		value === 'check' ||
		value === 'comparison' ||
		value === 'calculation' ||
		value === 'branch' ||
		value === 'effectScale' ||
		value === 'valueChange' ||
		value === 'conditionAdd' ||
		value === 'conditionRemove' ||
		value === 'text' ||
		value === 'custom'
	);
}

function invalidConfig(path: string, message: string) {
	return new BadRequestException(`Некорректная конфигурация шага "${path}": ${message}`);
}
