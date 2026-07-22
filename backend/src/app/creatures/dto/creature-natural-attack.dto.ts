import { Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsIn,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Min,
	ValidateNested
} from 'class-validator';

export class CreatureNaturalAttackProfileIntentDto {
	@IsUUID()
	combatIntentId!: string;

	@IsOptional()
	@IsInt()
	costModifier?: number;

	@IsOptional()
	@IsInt()
	damageModifier?: number;

	@IsOptional()
	@IsString()
	ruleText?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class CreatureNaturalAttackProfileDto {
	@IsIn(['melee', 'ranged'])
	kind!: 'melee' | 'ranged';

	@IsString()
	name!: string;

	@IsUUID()
	skillId!: string;

	@IsOptional()
	@IsUUID()
	characteristicId?: string | null;

	@IsInt()
	@Min(0)
	baseCost!: number;

	@IsInt()
	baseDamage!: number;

	@IsInt()
	@Min(0)
	rangeMeters!: number;

	@IsOptional()
	@IsBoolean()
	usesAmmo?: boolean;

	@IsOptional()
	@IsBoolean()
	canBeParried?: boolean;

	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	damageTypeIds?: string[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureNaturalAttackProfileIntentDto)
	intents?: CreatureNaturalAttackProfileIntentDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class CreatureNaturalAttackDto {
	@IsUUID()
	naturalAttackId!: string;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureNaturalAttackProfileDto)
	attackProfiles?: CreatureNaturalAttackProfileDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
