import { Prisma, SystemValueOwnerType } from '../__generated__/index.js';

export type SeedSystemValue = {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	primaryOwnerType: SystemValueOwnerType;
	primaryOwnerId: string | null;
	displaySection: string | null;
	calculationGraph: Prisma.JsonValue | null;
	isSystemManaged: boolean;
	isActive: boolean;
	sortOrder: number;
};

export type SeedAttribute = {
	id: string;
	name: string;
	description: string | null;
	systemValueId: string;
	poolPenaltyValueId: string | null;
	availablePoolValueId: string | null;
	isActive: boolean;
	sortOrder: number;
};

export type SeedCharacteristic = {
	id: string;
	name: string;
	attributeId: string;
	description: string | null;
	minValue: number;
	maxValue: number;
	defaultValue: number;
	systemValueId: string;
	isActive: boolean;
	sortOrder: number;
};

export type SeedRollConsequence = {
	id: string;
	name: string;
	description: string | null;
	rollEventGraph: Prisma.JsonValue | null;
	isActive: boolean;
	sortOrder: number;
};

export type SeedSkillCategory = {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	isActive: boolean;
	sortOrder: number;
};

export type SeedSkill = {
	id: string;
	slug: string;
	name: string;
	categoryId: string;
	description: string | null;
	defaultLevel: number;
	maxLevel: number;
	usesDefaultLevelRules: boolean;
	systemValueId: string;
	rollCharacteristicId: string | null;
	rollConsequenceId: string | null;
	isActive: boolean;
	sortOrder: number;
};
