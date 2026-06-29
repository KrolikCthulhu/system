import { Injectable, NotFoundException } from '@nestjs/common';
import {
	Prisma,
	SpellMechanicActionKind,
	SpellMechanicParameterDefaultMode,
	SpellMechanicParameterKind,
	SpellMechanicNumericRole,
	SpellMechanicParameterScope
} from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { createSlug } from '../shared/slug.util';
import { CreateSpellMechanicCategoryDto } from './dto/create-spell-mechanic-category.dto';
import { CreateSpellMechanicDto } from './dto/create-spell-mechanic.dto';
import {
	SpellMechanicActionDto,
	SpellMechanicActionKindDto
} from './dto/spell-mechanic-action.dto';
import {
	SpellMechanicParameterDefaultModeDto,
	SpellMechanicParameterDto,
	SpellMechanicParameterKindDto,
	SpellMechanicNumericRoleDto,
	SpellMechanicParameterScopeDto
} from './dto/spell-mechanic-parameter.dto';
import { UpdateSpellMechanicCategoryDto } from './dto/update-spell-mechanic-category.dto';
import { UpdateSpellMechanicDto } from './dto/update-spell-mechanic.dto';
import { validateSpellMechanicActionConfig } from './spell-mechanic-action-config.validator';

const categorySelect = {
	id: true,
	slug: true,
	name: true,
	description: true,
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.SpellMechanicCategorySelect;

const mechanicSelect = {
	id: true,
	categoryId: true,
	slug: true,
	name: true,
	description: true,
	configSchema: true,
	textTemplate: true,
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true,
	parameters: {
		select: {
			id: true,
			mechanicId: true,
			slug: true,
			name: true,
			kind: true,
			numericRole: true,
			scope: true,
			defaultMode: true,
			staticSkillId: true,
			staticDamageTypeId: true,
			staticConditionId: true,
			staticSystemValueId: true,
			staticTextValue: true,
			defaultTargetConfig: true,
			isRequired: true,
			configuredBySpell: true,
			overrideAllowed: true,
			sortOrder: true,
			createdAt: true,
			updatedAt: true
		},
		orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
	},
	actions: {
		select: {
			id: true,
			mechanicId: true,
			name: true,
			kind: true,
			config: true,
			isActive: true,
			sortOrder: true,
			createdAt: true,
			updatedAt: true
		},
		orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
	}
} satisfies Prisma.SpellMechanicSelect;

type CategoryRecord = Prisma.SpellMechanicCategoryGetPayload<{
	select: typeof categorySelect;
}>;
type MechanicRecord = Prisma.SpellMechanicGetPayload<{
	select: typeof mechanicSelect;
}>;

@Injectable()
export class SpellMechanicsService {
	constructor(private readonly prisma: PrismaService) {}

	async getCatalog() {
		const [categories, mechanics] = await Promise.all([
			this.prisma.spellMechanicCategory.findMany({
				select: categorySelect,
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.spellMechanic.findMany({
				select: mechanicSelect,
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			})
		]);

		return {
			categories: categories.map(category => this.mapCategory(category)),
			mechanics: mechanics.map(mechanic => this.mapMechanic(mechanic))
		};
	}

	async createCategory(dto: CreateSpellMechanicCategoryDto) {
		try {
			const category = await this.prisma.spellMechanicCategory.create({
				select: categorySelect,
				data: this.toCategoryCreateData(dto)
			});

			return this.mapCategory(category);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать категорию механик.', {
				uniqueMessage: 'Категория механик с таким названием уже существует.'
			});
		}
	}

	async updateCategory(id: string, dto: UpdateSpellMechanicCategoryDto) {
		await this.ensureCategoryExists(id);

		try {
			const category = await this.prisma.spellMechanicCategory.update({
				select: categorySelect,
				where: { id },
				data: this.toCategoryUpdateData(dto)
			});

			return this.mapCategory(category);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить категорию механик.', {
				uniqueMessage: 'Категория механик с таким названием уже существует.'
			});
		}
	}

	async deleteCategory(id: string) {
		await this.ensureCategoryExists(id);
		await this.prisma.spellMechanicCategory.delete({ where: { id } });
	}

	async createMechanic(dto: CreateSpellMechanicDto) {
		await this.ensureCategoryExists(dto.categoryId);

		try {
			const created = await this.prisma.spellMechanic.create({
				select: { id: true },
				data: this.toMechanicCreateData(dto)
			});
			const mechanic = await this.loadMechanic(created.id);

			return this.mapMechanic(mechanic);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать механику.', {
				uniqueMessage: 'Механика с таким названием уже существует.'
			});
		}
	}

	async updateMechanic(id: string, dto: UpdateSpellMechanicDto) {
		await this.ensureMechanicExists(id);

		if (dto.categoryId) {
			await this.ensureCategoryExists(dto.categoryId);
		}

		try {
			const mechanic =
				dto.parameters === undefined && dto.actions === undefined
					? await this.updateMechanicOnly(id, dto)
					: await this.replaceMechanicChildren(id, dto);

			return this.mapMechanic(mechanic);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить механику.', {
				uniqueMessage: 'Механика с таким названием уже существует.'
			});
		}
	}

	private async updateMechanicOnly(id: string, dto: UpdateSpellMechanicDto) {
		await this.prisma.spellMechanic.update({
			where: { id },
			data: this.toMechanicUpdateData(dto)
		});

		return this.loadMechanic(id);
	}

	private async replaceMechanicChildren(
		id: string,
		dto: UpdateSpellMechanicDto
	) {
		await this.prisma.$transaction(async tx => {
			await tx.spellMechanic.update({
				where: { id },
				data: this.toMechanicUpdateData(dto)
			});

			if (dto.parameters !== undefined) {
				await tx.spellMechanicParameter.deleteMany({
					where: { mechanicId: id }
				});

				if (dto.parameters.length) {
					await tx.spellMechanicParameter.createMany({
						data: dto.parameters.map((parameter, index) =>
							this.toMechanicParameterCreateManyData(id, parameter, index)
						)
					});
				}
			}

			if (dto.actions !== undefined) {
				await tx.spellMechanicAction.deleteMany({
					where: { mechanicId: id }
				});

				if (dto.actions.length) {
					await tx.spellMechanicAction.createMany({
						data: dto.actions.map((action, index) =>
							this.toMechanicActionCreateManyData(id, action, index)
						)
					});
				}
			}
		});

		return this.loadMechanic(id);
	}

	async deleteMechanic(id: string) {
		await this.ensureMechanicExists(id);
		await this.prisma.spellMechanic.delete({ where: { id } });
	}

	private async ensureCategoryExists(id: string) {
		const category = await this.prisma.spellMechanicCategory.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!category) {
			throw new NotFoundException('Категория механик не найдена.');
		}
	}

	private async ensureMechanicExists(id: string) {
		const mechanic = await this.prisma.spellMechanic.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!mechanic) {
			throw new NotFoundException('Механика не найдена.');
		}
	}

	private loadMechanic(id: string) {
		return this.prisma.spellMechanic.findUniqueOrThrow({
			select: mechanicSelect,
			where: { id }
		});
	}

	private toCategoryCreateData(dto: CreateSpellMechanicCategoryDto) {
		return {
			slug: createSlug(dto.name),
			name: dto.name.trim(),
			description: this.toNullableString(dto.description),
			isActive: dto.isActive ?? true,
			sortOrder: dto.sortOrder ?? 0
		};
	}

	private toCategoryUpdateData(dto: UpdateSpellMechanicCategoryDto) {
		return {
			name: dto.name === undefined ? undefined : dto.name.trim(),
			description:
				dto.description === undefined
					? undefined
					: this.toNullableString(dto.description),
			isActive: dto.isActive,
			sortOrder: dto.sortOrder
		};
	}

	private toMechanicCreateData(dto: CreateSpellMechanicDto) {
		return {
			categoryId: dto.categoryId,
			slug: createSlug(dto.name),
			name: dto.name.trim(),
			description: this.toNullableString(dto.description),
			configSchema: this.toJsonObject(dto.configSchema),
			textTemplate: this.toNullableString(dto.textTemplate),
			isActive: dto.isActive ?? true,
			sortOrder: dto.sortOrder ?? 0,
			parameters: {
				create: (dto.parameters ?? []).map((parameter, index) =>
					this.toMechanicParameterCreateData(parameter, index)
				)
			},
			actions: {
				create: (dto.actions ?? []).map((action, index) =>
					this.toMechanicActionCreateData(action, index)
				)
			}
		};
	}

	private toMechanicUpdateData(dto: UpdateSpellMechanicDto) {
		return {
			categoryId: dto.categoryId,
			name: dto.name === undefined ? undefined : dto.name.trim(),
			description:
				dto.description === undefined
					? undefined
					: this.toNullableString(dto.description),
			configSchema:
				dto.configSchema === undefined
					? undefined
					: this.toJsonObject(dto.configSchema),
			textTemplate:
				dto.textTemplate === undefined
					? undefined
					: this.toNullableString(dto.textTemplate),
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

	private toJsonObject(value?: Record<string, unknown>) {
		return (value ?? {}) as Prisma.InputJsonObject;
	}

	private toMechanicParameterCreateData(
		parameter: SpellMechanicParameterDto,
		index: number
	): Prisma.SpellMechanicParameterCreateWithoutMechanicInput {
		const defaultRefs = this.toMechanicParameterDefaultRefs(parameter);

		return {
			id: parameter.id,
			slug: createSlug(parameter.name),
			name: parameter.name.trim() || 'Параметр',
			kind: this.toParameterKind(parameter.kind),
			numericRole: this.toNumericRole(parameter.numericRole, parameter.kind),
			scope: this.toParameterScope(parameter),
			defaultMode: this.toParameterDefaultMode(parameter.defaultValue.mode),
			...defaultRefs,
			defaultTargetConfig: this.toParameterDefaultTargetConfig(parameter),
			isRequired: parameter.required,
			configuredBySpell: parameter.configuredBySpell,
			overrideAllowed: parameter.overrideAllowed,
			sortOrder: parameter.sortOrder ?? index
		};
	}

	private toMechanicParameterCreateManyData(
		mechanicId: string,
		parameter: SpellMechanicParameterDto,
		index: number
	): Prisma.SpellMechanicParameterCreateManyInput {
		const defaultRefs = this.toMechanicParameterDefaultRefs(parameter);

		return {
			id: parameter.id,
			mechanicId,
			slug: createSlug(parameter.name),
			name: parameter.name.trim() || 'Параметр',
			kind: this.toParameterKind(parameter.kind),
			numericRole: this.toNumericRole(parameter.numericRole, parameter.kind),
			scope: this.toParameterScope(parameter),
			defaultMode: this.toParameterDefaultMode(parameter.defaultValue.mode),
			...defaultRefs,
			defaultTargetConfig: this.toParameterDefaultTargetConfig(parameter),
			isRequired: parameter.required,
			configuredBySpell: parameter.configuredBySpell,
			overrideAllowed: parameter.overrideAllowed,
			sortOrder: parameter.sortOrder ?? index
		};
	}

	private toMechanicParameterDefaultRefs(parameter: SpellMechanicParameterDto) {
		const mode = parameter.defaultValue.mode;
		const value = parameter.defaultValue.value.trim();

		if (mode !== 'static' || !value) {
			return {
				staticSkillId: null,
				staticDamageTypeId: null,
				staticConditionId: null,
				staticSystemValueId: null,
				staticTextValue: null
			};
		}

		return {
			staticSkillId: parameter.kind === 'skill' ? value : null,
			staticDamageTypeId: parameter.kind === 'damageType' ? value : null,
			staticConditionId: parameter.kind === 'condition' ? value : null,
			staticSystemValueId: parameter.kind === 'systemValue' ? value : null,
			staticTextValue:
				parameter.kind === 'number' ||
				parameter.kind === 'formula' ||
				parameter.kind === 'text'
					? value
					: null
		};
	}

	private toParameterDefaultTargetConfig(parameter: SpellMechanicParameterDto) {
		if (parameter.kind !== 'target' || !parameter.defaultTargetConfig) {
			return null;
		}

		return {
			name: parameter.defaultTargetConfig.name?.trim() || 'Цель',
			source: parameter.defaultTargetConfig.source,
			relation: parameter.defaultTargetConfig.relation,
			countMode: parameter.defaultTargetConfig.countMode,
			countValueMode: parameter.defaultTargetConfig.countValueMode ?? 'fixed',
			countValue: parameter.defaultTargetConfig.countValue ?? 1,
			countFormula: parameter.defaultTargetConfig.countFormula?.trim() ?? '',
			targetCountParameterId:
				parameter.defaultTargetConfig.targetCountParameterId?.trim() ?? '',
			isRequired: parameter.defaultTargetConfig.isRequired ?? true
		} satisfies Prisma.InputJsonObject;
	}

	private toMechanicActionCreateData(
		action: SpellMechanicActionDto,
		index: number
	): Prisma.SpellMechanicActionCreateWithoutMechanicInput {
		return {
			id: action.id,
			name: action.name.trim() || 'Действие',
			kind: this.toActionKind(action.kind),
			config: validateSpellMechanicActionConfig(action),
			isActive: action.isActive,
			sortOrder: action.sortOrder ?? index
		};
	}

	private toMechanicActionCreateManyData(
		mechanicId: string,
		action: SpellMechanicActionDto,
		index: number
	): Prisma.SpellMechanicActionCreateManyInput {
		return {
			id: action.id,
			mechanicId,
			name: action.name.trim() || 'Действие',
			kind: this.toActionKind(action.kind),
			config: validateSpellMechanicActionConfig(action),
			isActive: action.isActive,
			sortOrder: action.sortOrder ?? index
		};
	}

	private toActionKind(kind: SpellMechanicActionKindDto) {
		const kinds = {
			roll: 'ROLL',
			check: 'CHECK',
			comparison: 'COMPARISON',
			calculation: 'CALCULATION',
			branch: 'BRANCH',
			effectScale: 'EFFECT_SCALE',
			valueChange: 'VALUE_CHANGE',
			conditionAdd: 'CONDITION_ADD',
			conditionRemove: 'CONDITION_REMOVE',
			text: 'TEXT',
			custom: 'CUSTOM'
		} satisfies Record<SpellMechanicActionKindDto, SpellMechanicActionKind>;

		return kinds[kind];
	}

	private fromActionKind(
		kind: SpellMechanicActionKind
	): SpellMechanicActionKindDto {
		const kinds = {
			ROLL: 'roll',
			CHECK: 'check',
			COMPARISON: 'comparison',
			CALCULATION: 'calculation',
			BRANCH: 'branch',
			EFFECT_SCALE: 'effectScale',
			VALUE_CHANGE: 'valueChange',
			CONDITION_ADD: 'conditionAdd',
			CONDITION_REMOVE: 'conditionRemove',
			TEXT: 'text',
			CUSTOM: 'custom'
		} satisfies Record<SpellMechanicActionKind, SpellMechanicActionKindDto>;

		return kinds[kind];
	}

	private toParameterKind(kind: SpellMechanicParameterKindDto) {
		const kinds = {
			target: 'TARGET',
			skill: 'SKILL',
			number: 'NUMBER',
			formula: 'FORMULA',
			damageType: 'DAMAGE_TYPE',
			condition: 'CONDITION',
			systemValue: 'SYSTEM_VALUE',
			text: 'TEXT'
		} satisfies Record<
			SpellMechanicParameterKindDto,
			SpellMechanicParameterKind
		>;

		return kinds[kind];
	}

	private toParameterDefaultMode(mode: SpellMechanicParameterDefaultModeDto) {
		const modes = {
			empty: 'EMPTY',
			static: 'STATIC',
			fromMagicWord: 'FROM_MAGIC_WORD'
		} satisfies Record<
			SpellMechanicParameterDefaultModeDto,
			SpellMechanicParameterDefaultMode
		>;

		return modes[mode];
	}

	private toNumericRole(
		role: SpellMechanicNumericRoleDto | undefined,
		kind: SpellMechanicParameterKindDto
	) {
		if (kind !== 'number' && kind !== 'formula') {
			return SpellMechanicNumericRole.CUSTOM;
		}

		const roles = {
			damage: 'DAMAGE',
			range: 'RANGE',
			duration: 'DURATION',
			area: 'AREA',
			targetCount: 'TARGET_COUNT',
			custom: 'CUSTOM'
		} satisfies Record<SpellMechanicNumericRoleDto, SpellMechanicNumericRole>;

		return roles[role ?? 'custom'];
	}

	private toParameterScope(parameter: SpellMechanicParameterDto) {
		if (parameter.scope) {
			const scopes = {
				caster: 'CASTER',
				target: 'TARGET',
				spell: 'SPELL',
				effect: 'EFFECT',
				environment: 'ENVIRONMENT'
			} satisfies Record<
				SpellMechanicParameterScopeDto,
				SpellMechanicParameterScope
			>;

			return scopes[parameter.scope];
		}

		return inferParameterScope(parameter);
	}

	private fromParameterKind(
		kind: SpellMechanicParameterKind
	): SpellMechanicParameterKindDto {
		const kinds = {
			TARGET: 'target',
			SKILL: 'skill',
			NUMBER: 'number',
			FORMULA: 'formula',
			DAMAGE_TYPE: 'damageType',
			CONDITION: 'condition',
			SYSTEM_VALUE: 'systemValue',
			TEXT: 'text'
		} satisfies Record<
			SpellMechanicParameterKind,
			SpellMechanicParameterKindDto
		>;

		return kinds[kind];
	}

	private fromNumericRole(
		role: SpellMechanicNumericRole
	): SpellMechanicNumericRoleDto {
		const roles = {
			DAMAGE: 'damage',
			RANGE: 'range',
			DURATION: 'duration',
			AREA: 'area',
			TARGET_COUNT: 'targetCount',
			CUSTOM: 'custom'
		} satisfies Record<SpellMechanicNumericRole, SpellMechanicNumericRoleDto>;

		return roles[role];
	}

	private fromParameterScope(
		scope: SpellMechanicParameterScope
	): SpellMechanicParameterScopeDto {
		const scopes = {
			CASTER: 'caster',
			TARGET: 'target',
			SPELL: 'spell',
			EFFECT: 'effect',
			ENVIRONMENT: 'environment'
		} satisfies Record<
			SpellMechanicParameterScope,
			SpellMechanicParameterScopeDto
		>;

		return scopes[scope];
	}

	private fromParameterDefaultMode(
		mode: SpellMechanicParameterDefaultMode
	): SpellMechanicParameterDefaultModeDto {
		const modes = {
			EMPTY: 'empty',
			STATIC: 'static',
			FROM_MAGIC_WORD: 'fromMagicWord'
		} satisfies Record<
			SpellMechanicParameterDefaultMode,
			SpellMechanicParameterDefaultModeDto
		>;

		return modes[mode];
	}

	private mapCategory(category: CategoryRecord) {
		return {
			id: category.id,
			slug: category.slug,
			name: category.name,
			description: category.description ?? '',
			isActive: category.isActive,
			sortOrder: category.sortOrder,
			createdAt: category.createdAt.toISOString(),
			updatedAt: category.updatedAt.toISOString()
		};
	}

	private mapMechanic(mechanic: MechanicRecord) {
		return {
			id: mechanic.id,
			categoryId: mechanic.categoryId,
			slug: mechanic.slug,
			name: mechanic.name,
			description: mechanic.description ?? '',
			configSchema: mechanic.configSchema,
			textTemplate: mechanic.textTemplate ?? '',
			isActive: mechanic.isActive,
			sortOrder: mechanic.sortOrder,
			parameters: mechanic.parameters.map(parameter => ({
				id: parameter.id,
				mechanicId: parameter.mechanicId,
				slug: parameter.slug,
				name: parameter.name,
				kind: this.fromParameterKind(parameter.kind),
				numericRole: this.fromNumericRole(parameter.numericRole),
				scope: this.fromParameterScope(parameter.scope),
				required: parameter.isRequired,
				configuredBySpell: parameter.configuredBySpell,
				overrideAllowed: parameter.overrideAllowed,
				defaultValue: {
					mode: this.fromParameterDefaultMode(parameter.defaultMode),
					value: this.getParameterDefaultValue(parameter)
				},
				defaultTargetConfig:
					parameter.defaultTargetConfig &&
					typeof parameter.defaultTargetConfig === 'object' &&
					!Array.isArray(parameter.defaultTargetConfig)
						? parameter.defaultTargetConfig
						: null,
				sortOrder: parameter.sortOrder,
				createdAt: parameter.createdAt.toISOString(),
				updatedAt: parameter.updatedAt.toISOString()
			})),
			actions: mechanic.actions.map(action => ({
				id: action.id,
				mechanicId: action.mechanicId,
				name: action.name,
				kind: this.fromActionKind(action.kind),
				config: action.config,
				isActive: action.isActive,
				sortOrder: action.sortOrder,
				createdAt: action.createdAt.toISOString(),
				updatedAt: action.updatedAt.toISOString()
			})),
			createdAt: mechanic.createdAt.toISOString(),
			updatedAt: mechanic.updatedAt.toISOString()
		};
	}

	private getParameterDefaultValue(
		parameter: MechanicRecord['parameters'][number]
	) {
		if (parameter.defaultMode !== 'STATIC') {
			return '';
		}

		return (
			parameter.staticSkillId ??
			parameter.staticDamageTypeId ??
			parameter.staticConditionId ??
			parameter.staticSystemValueId ??
			parameter.staticTextValue ??
			''
		);
	}
}

function inferParameterScope(
	parameter: Pick<SpellMechanicParameterDto, 'kind' | 'name' | 'numericRole'>
): SpellMechanicParameterScope {
	const normalized = parameter.name.toLocaleLowerCase('ru');

	if (parameter.kind === 'target') {
		return SpellMechanicParameterScope.TARGET;
	}

	if (parameter.kind === 'skill') {
		if (normalized.includes('защит')) {
			return SpellMechanicParameterScope.TARGET;
		}

		if (normalized.includes('атак')) {
			return SpellMechanicParameterScope.CASTER;
		}
	}

	if (parameter.kind === 'damageType' || parameter.kind === 'condition') {
		return SpellMechanicParameterScope.EFFECT;
	}

	return SpellMechanicParameterScope.SPELL;
}
