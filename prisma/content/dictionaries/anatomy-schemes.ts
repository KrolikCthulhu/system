import type { AnatomySchemeContent, ContentDocument } from '../content-types';

const humanoidZones: AnatomySchemeContent['zones'] = [
	{
		name: 'Голова',
		slug: 'golova',
		kind: 'MAIN',
		isRandomHitEligible: true,
		randomHitWeight: 1,
		targetedAttackDicePenalty: -1,
		extraPotentialCost: 1,
		sortOrder: 0
	},
	{
		name: 'Корпус',
		slug: 'korpus',
		kind: 'MAIN',
		isRandomHitEligible: true,
		randomHitWeight: 4,
		targetedAttackDicePenalty: 0,
		extraPotentialCost: 0,
		sortOrder: 1
	},
	{
		name: 'Левая рука',
		slug: 'levaya-ruka',
		kind: 'MAIN',
		isRandomHitEligible: true,
		randomHitWeight: 1,
		targetedAttackDicePenalty: -1,
		extraPotentialCost: 1,
		sortOrder: 2
	},
	{
		name: 'Правая рука',
		slug: 'pravaya-ruka',
		kind: 'MAIN',
		isRandomHitEligible: true,
		randomHitWeight: 1,
		targetedAttackDicePenalty: -1,
		extraPotentialCost: 1,
		sortOrder: 3
	},
	{
		name: 'Левая нога',
		slug: 'levaya-noga',
		kind: 'MAIN',
		isRandomHitEligible: true,
		randomHitWeight: 1,
		targetedAttackDicePenalty: -1,
		extraPotentialCost: 1,
		sortOrder: 4
	},
	{
		name: 'Правая нога',
		slug: 'pravaya-noga',
		kind: 'MAIN',
		isRandomHitEligible: true,
		randomHitWeight: 1,
		targetedAttackDicePenalty: -1,
		extraPotentialCost: 1,
		sortOrder: 5
	},
	{
		name: 'Левый глаз',
		slug: 'levyy-glaz',
		parent: { name: 'Голова', slug: 'golova' },
		kind: 'TARGETED',
		isRandomHitEligible: false,
		randomHitWeight: 0,
		targetedAttackDicePenalty: -2,
		extraPotentialCost: 1,
		sortOrder: 6
	},
	{
		name: 'Правый глаз',
		slug: 'pravyy-glaz',
		parent: { name: 'Голова', slug: 'golova' },
		kind: 'TARGETED',
		isRandomHitEligible: false,
		randomHitWeight: 0,
		targetedAttackDicePenalty: -2,
		extraPotentialCost: 1,
		sortOrder: 7
	},
	{
		name: 'Горло',
		slug: 'gorlo',
		parent: { name: 'Голова', slug: 'golova' },
		kind: 'TARGETED',
		isRandomHitEligible: false,
		randomHitWeight: 0,
		targetedAttackDicePenalty: -2,
		extraPotentialCost: 1,
		sortOrder: 8
	},
	{
		name: 'Левая кисть',
		slug: 'levaya-kist',
		parent: { name: 'Левая рука', slug: 'levaya-ruka' },
		kind: 'TARGETED',
		isRandomHitEligible: false,
		randomHitWeight: 0,
		targetedAttackDicePenalty: -2,
		extraPotentialCost: 1,
		sortOrder: 9
	},
	{
		name: 'Правая кисть',
		slug: 'pravaya-kist',
		parent: { name: 'Правая рука', slug: 'pravaya-ruka' },
		kind: 'TARGETED',
		isRandomHitEligible: false,
		randomHitWeight: 0,
		targetedAttackDicePenalty: -2,
		extraPotentialCost: 1,
		sortOrder: 10
	}
];

const quadrupedZones: AnatomySchemeContent['zones'] = [
	{
		name: 'Голова',
		slug: 'golova',
		kind: 'MAIN',
		isRandomHitEligible: true,
		randomHitWeight: 1,
		targetedAttackDicePenalty: -1,
		extraPotentialCost: 1,
		sortOrder: 0
	},
	{
		name: 'Корпус',
		slug: 'korpus',
		kind: 'MAIN',
		isRandomHitEligible: true,
		randomHitWeight: 4,
		targetedAttackDicePenalty: 0,
		extraPotentialCost: 0,
		sortOrder: 1
	},
	{
		name: 'Левая передняя конечность',
		slug: 'levaya-perednyaya-konechnost',
		kind: 'MAIN',
		isRandomHitEligible: true,
		randomHitWeight: 1,
		targetedAttackDicePenalty: -1,
		extraPotentialCost: 1,
		sortOrder: 2
	},
	{
		name: 'Правая передняя конечность',
		slug: 'pravaya-perednyaya-konechnost',
		kind: 'MAIN',
		isRandomHitEligible: true,
		randomHitWeight: 1,
		targetedAttackDicePenalty: -1,
		extraPotentialCost: 1,
		sortOrder: 3
	},
	{
		name: 'Левая задняя конечность',
		slug: 'levaya-zadnyaya-konechnost',
		kind: 'MAIN',
		isRandomHitEligible: true,
		randomHitWeight: 1,
		targetedAttackDicePenalty: -1,
		extraPotentialCost: 1,
		sortOrder: 4
	},
	{
		name: 'Правая задняя конечность',
		slug: 'pravaya-zadnyaya-konechnost',
		kind: 'MAIN',
		isRandomHitEligible: true,
		randomHitWeight: 1,
		targetedAttackDicePenalty: -1,
		extraPotentialCost: 1,
		sortOrder: 5
	}
];

export default {
	anatomySchemes: [
		{
			name: 'Гуманоид',
			slug: 'gumanoid',
			description: 'Базовая анатомия двурукого двуногого существа.',
			sortOrder: 0,
			zones: humanoidZones
		},
		{
			name: 'Четвероногое',
			slug: 'chetveronogoe',
			description:
				'Базовая анатомия существа с четырьмя опорными конечностями.',
			sortOrder: 1,
			zones: quadrupedZones
		}
	],
	schemaVersion: 1
} satisfies ContentDocument<{ anatomySchemes: AnatomySchemeContent[] }>;
