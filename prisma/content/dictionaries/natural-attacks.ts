import type { ContentDocument, NaturalAttackContent } from '../content-types';

const POWER = { name: 'Мощь', slug: 'mosch' };
const REFLEXES = { name: 'Рефлексы', slug: 'refleksy' };
const UNARMED = { name: 'Рукопашный бой', slug: 'rukopashnyy-boy' };

const DAMAGE_TYPES = {
	slashing: { name: 'Режущий', slug: 'rezhuschiy' },
	piercing: { name: 'Колющий', slug: 'kolyuschiy' },
	bludgeoning: { name: 'Дробящий', slug: 'drobyaschiy' }
};

const INTENTS = {
	wound: { name: 'Ранить', slug: 'ranit' },
	targetedWound: { name: 'Прицельно ранить', slug: 'pricelno-ranit' },
	vulnerableSpot: {
		name: 'Поразить уязвимое место',
		slug: 'porazit-uyazvimoe-mesto'
	},
	stun: { name: 'Оглушить', slug: 'oglushit' },
	knockdown: { name: 'Сбить с ног', slug: 'sbit-s-nog' },
	push: { name: 'Оттолкнуть', slug: 'ottolknut' },
	grab: { name: 'Захватить', slug: 'zahvatit' },
	pin: { name: 'Пригвоздить', slug: 'prigvozdit' }
};

function meleeAttack(params: {
	name: string;
	slug: string;
	baseCost: number;
	baseDamage: number;
	characteristic: typeof POWER | typeof REFLEXES;
	damageTypes: NaturalAttackContent['attackProfiles'][number]['damageTypes'];
	combatIntents: NaturalAttackContent['attackProfiles'][number]['combatIntents'];
	canBeParried?: boolean;
	defaultDefense?: NaturalAttackContent['attackProfiles'][number]['defaultDefense'];
	sortOrder: number;
}): NaturalAttackContent {
	return {
		name: params.name,
		slug: params.slug,
		sortOrder: params.sortOrder,
		skill: UNARMED,
		attackProfiles: [
			{
				kind: 'melee',
				name: 'Ближняя атака',
				skill: UNARMED,
				characteristic: params.characteristic,
				baseCost: params.baseCost,
				baseDamage: params.baseDamage,
				rangeMeters: 1,
				usesAmmo: false,
				canBeParried: params.canBeParried ?? true,
				defaultDefense: params.defaultDefense,
				damageTypes: params.damageTypes,
				combatIntents: params.combatIntents,
				sortOrder: 0
			}
		]
	};
}

export default {
	schemaVersion: 1,
	naturalAttacks: [
		meleeAttack({
			name: 'Удар рукой',
			slug: 'udar-rukoy',
			baseCost: 1,
			baseDamage: 0,
			characteristic: POWER,
			damageTypes: [DAMAGE_TYPES.bludgeoning],
			combatIntents: [
				INTENTS.wound,
				INTENTS.targetedWound,
				INTENTS.stun,
				INTENTS.knockdown,
				INTENTS.push
			],
			sortOrder: 0
		}),
		meleeAttack({
			name: 'Удар ногой',
			slug: 'udar-nogoy',
			baseCost: 1,
			baseDamage: 1,
			characteristic: POWER,
			damageTypes: [DAMAGE_TYPES.bludgeoning],
			combatIntents: [
				INTENTS.wound,
				INTENTS.targetedWound,
				INTENTS.stun,
				INTENTS.knockdown,
				INTENTS.push
			],
			sortOrder: 1
		}),
		meleeAttack({
			name: 'Укус',
			slug: 'ukus',
			baseCost: 1,
			baseDamage: 1,
			characteristic: POWER,
			damageTypes: [DAMAGE_TYPES.piercing],
			combatIntents: [
				INTENTS.wound,
				INTENTS.targetedWound,
				INTENTS.vulnerableSpot,
				INTENTS.knockdown,
				INTENTS.grab
			],
			canBeParried: true,
			defaultDefense: {
				type: 'target_physical_defense',
				canDodge: true,
				canParry: true,
				parrySkillGroups: ['melee_weapon', 'shield']
			},
			sortOrder: 2
		}),
		meleeAttack({
			name: 'Удар когтями',
			slug: 'udar-kogtyami',
			baseCost: 1,
			baseDamage: 1,
			characteristic: REFLEXES,
			damageTypes: [DAMAGE_TYPES.slashing],
			combatIntents: [
				INTENTS.wound,
				INTENTS.targetedWound,
				INTENTS.vulnerableSpot,
				INTENTS.knockdown
			],
			sortOrder: 3
		}),
		meleeAttack({
			name: 'Удар рогами',
			slug: 'udar-rogami',
			baseCost: 2,
			baseDamage: 2,
			characteristic: POWER,
			damageTypes: [DAMAGE_TYPES.piercing, DAMAGE_TYPES.bludgeoning],
			combatIntents: [
				INTENTS.wound,
				INTENTS.targetedWound,
				INTENTS.knockdown,
				INTENTS.push
			],
			sortOrder: 4
		}),
		meleeAttack({
			name: 'Удар хвостом',
			slug: 'udar-hvostom',
			baseCost: 1,
			baseDamage: 1,
			characteristic: POWER,
			damageTypes: [DAMAGE_TYPES.bludgeoning],
			combatIntents: [INTENTS.wound, INTENTS.knockdown, INTENTS.push],
			sortOrder: 5
		}),
		meleeAttack({
			name: 'Удар крылом',
			slug: 'udar-krylom',
			baseCost: 1,
			baseDamage: 0,
			characteristic: POWER,
			damageTypes: [DAMAGE_TYPES.bludgeoning],
			combatIntents: [INTENTS.wound, INTENTS.knockdown, INTENTS.push],
			sortOrder: 6
		}),
		meleeAttack({
			name: 'Удар щупальцем',
			slug: 'udar-schupalcem',
			baseCost: 1,
			baseDamage: 1,
			characteristic: REFLEXES,
			damageTypes: [DAMAGE_TYPES.bludgeoning],
			combatIntents: [
				INTENTS.wound,
				INTENTS.targetedWound,
				INTENTS.grab,
				INTENTS.knockdown
			],
			sortOrder: 7
		}),
		meleeAttack({
			name: 'Жало',
			slug: 'zhalo',
			baseCost: 1,
			baseDamage: 1,
			characteristic: REFLEXES,
			damageTypes: [DAMAGE_TYPES.piercing],
			combatIntents: [
				INTENTS.wound,
				INTENTS.targetedWound,
				INTENTS.vulnerableSpot
			],
			sortOrder: 8
		})
	]
} satisfies ContentDocument<{ naturalAttacks: NaturalAttackContent[] }>;
