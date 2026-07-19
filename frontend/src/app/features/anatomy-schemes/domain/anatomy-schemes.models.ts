export type AnatomyZoneKind = 'MAIN' | 'TARGETED';

export interface AnatomySchemeZone {
	id: string;
	slug: string;
	name: string;
	parentId: string | null;
	kind: AnatomyZoneKind;
	isRandomHitEligible: boolean;
	randomHitWeight: number;
	targetedAttackDicePenalty: number;
	extraPotentialCost: number;
	isActive: boolean;
	sortOrder: number;
}

export interface AnatomyScheme {
	id: string;
	slug: string;
	name: string;
	description: string;
	zones: AnatomySchemeZone[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface AnatomySchemesCatalog {
	anatomySchemes: AnatomyScheme[];
}
