import {
	IsBoolean,
	IsIn,
	IsInt,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
	Min
} from 'class-validator';

export const spellMechanicActionKinds = [
	'roll',
	'check',
	'comparison',
	'calculation',
	'branch',
	'effectScale',
	'valueChange',
	'conditionAdd',
	'conditionRemove',
	'text',
	'custom'
] as const;

export type SpellMechanicActionKindDto =
	(typeof spellMechanicActionKinds)[number];

export class SpellMechanicActionDto {
	@IsOptional()
	@IsUUID()
	id?: string;

	@IsString()
	name!: string;

	@IsIn(spellMechanicActionKinds)
	kind!: SpellMechanicActionKindDto;

	@IsOptional()
	@IsObject()
	config?: Record<string, unknown>;

	@IsBoolean()
	isActive!: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
