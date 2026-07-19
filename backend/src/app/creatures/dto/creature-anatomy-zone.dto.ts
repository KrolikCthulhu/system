import {
	IsArray,
	IsBoolean,
	IsIn,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Min
} from 'class-validator';
import { anatomyZoneKinds } from '../../anatomy-schemes/dto/anatomy-scheme-zone.dto';

export class CreatureAnatomyZoneDto {
	@IsOptional()
	@IsString()
	id?: string;

	@IsOptional()
	@IsUUID()
	sourceZoneId?: string | null;

	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	slug?: string;

	@IsOptional()
	@IsString()
	parentId?: string | null;

	@IsIn(anatomyZoneKinds)
	kind!: (typeof anatomyZoneKinds)[number];

	@IsBoolean()
	isRandomHitEligible!: boolean;

	@IsInt()
	@Min(0)
	randomHitWeight!: number;

	@IsInt()
	targetedAttackDicePenalty!: number;

	@IsInt()
	@Min(0)
	extraPotentialCost!: number;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	overriddenFields?: string[];

	@IsOptional()
	@IsBoolean()
	isInherited?: boolean;

	@IsOptional()
	@IsBoolean()
	isRemoved?: boolean;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
