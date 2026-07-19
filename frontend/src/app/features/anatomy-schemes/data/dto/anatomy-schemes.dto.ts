import {
	AnatomyScheme,
	AnatomySchemeZone
} from '../../domain/anatomy-schemes.models';

export type AnatomySchemeDto = AnatomyScheme;
export type AnatomySchemeZoneDto = AnatomySchemeZone;

export interface AnatomySchemesCatalogResponseDto {
	anatomySchemes: AnatomySchemeDto[];
}

export interface CreateAnatomySchemeDto {
	name: string;
	description?: string;
	zones: AnatomySchemeZoneCommandDto[];
	isActive?: boolean;
	sortOrder?: number;
}

export interface UpdateAnatomySchemeDto {
	name?: string;
	description?: string;
	zones?: AnatomySchemeZoneCommandDto[];
	isActive?: boolean;
	sortOrder?: number;
}

export interface AnatomySchemeZoneCommandDto {
	id?: string;
	slug?: string;
	name: string;
	parentId?: string | null;
	kind: AnatomySchemeZone['kind'];
	isRandomHitEligible: boolean;
	randomHitWeight: number;
	targetedAttackDicePenalty: number;
	extraPotentialCost: number;
	isActive?: boolean;
	sortOrder?: number;
}
