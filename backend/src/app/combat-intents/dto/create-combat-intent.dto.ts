import {
	IsArray,
	IsBoolean,
	IsIn,
	IsInt,
	IsOptional,
	IsString,
	Min,
	ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export const combatIntentTextTokens = [
	'intentName',
	'attackerName',
	'targetName',
	'weaponName',
	'attackProfileName',
	'attackSkill',
	'attackCharacteristic',
	'baseCost',
	'baseDamage',
	'rangeMeters',
	'damageTypes',
	'selectedDamageType',
	'defenseOptions',
	'cleanSuccesses',
	'damageFormula',
	'randomHitZones',
	'targetedMainZones',
	'targetedSubzones',
	'armorRule'
] as const;

export class CombatIntentTextBlockDto {
	@IsIn(['text', 'token'])
	kind!: 'text' | 'token';

	@IsOptional()
	@IsString()
	text?: string;

	@IsOptional()
	@IsIn(combatIntentTextTokens)
	token?: (typeof combatIntentTextTokens)[number];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class CreateCombatIntentDto {
	@IsString()
	name!: string;

	@IsString()
	category!: string;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CombatIntentTextBlockDto)
	textBlocks?: CombatIntentTextBlockDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
