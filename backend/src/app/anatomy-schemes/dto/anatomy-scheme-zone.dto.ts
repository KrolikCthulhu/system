import {
	IsBoolean,
	IsIn,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Min
} from 'class-validator';

export const anatomyZoneKinds = ['MAIN', 'TARGETED'] as const;
export type AnatomyZoneKindDto = (typeof anatomyZoneKinds)[number];

export class AnatomySchemeZoneDto {
	@IsOptional()
	@IsUUID()
	id?: string;

	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	slug?: string;

	@IsOptional()
	@IsUUID()
	parentId?: string | null;

	@IsIn(anatomyZoneKinds)
	kind!: AnatomyZoneKindDto;

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
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
