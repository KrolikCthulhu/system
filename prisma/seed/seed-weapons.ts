import { Prisma } from '../__generated__/index.js';
import type { ContentDocument, WeaponContent } from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

const WEAPON_SEEDS = readContent<ContentDocument<{ weapons: WeaponContent[] }>>(
	'dictionaries/weapons.ts'
).weapons;
const REMOVED_WEAPON_SLUGS = ['legkaya-sablya'];

export async function seedWeapons(tx: Prisma.TransactionClient) {
	await tx.weapon.deleteMany({
		where: { slug: { in: REMOVED_WEAPON_SLUGS } }
	});

	for (const seed of WEAPON_SEEDS) {
		const slug = seedSlug(seed);
		const skill = await tx.skill.findUnique({
			select: { id: true },
			where: { slug: seed.skill.slug }
		});
		const template = await tx.weaponTemplate.findUnique({
			select: { id: true },
			where: { slug: seed.template.slug }
		});

		if (!skill) {
			throw new Error(`Навык оружия "${seed.skill.name}" не найден.`);
		}

		if (!template) {
			throw new Error(`Шаблон оружия "${seed.template.name}" не найден.`);
		}

		const existing = await tx.weapon.findFirst({
			select: { id: true },
			where: {
				OR: [{ slug }, { name: seed.name }]
			}
		});

		if (existing) {
			await tx.weapon.update({
				where: { id: existing.id },
				data: {
					slug,
					skillId: skill.id,
					templateId: template.id,
					extraDamage: seed.extraDamage,
					sortOrder: seed.sortOrder,
					isActive: true
				}
			});
			await seedWeaponAttackProfiles(tx, existing.id, seed);
			continue;
		}

		const weapon = await tx.weapon.create({
			select: { id: true },
			data: {
				slug,
				name: seed.name,
				templateId: template.id,
				skillId: skill.id,
				extraDamage: seed.extraDamage,
				isActive: true,
				sortOrder: seed.sortOrder
			}
		});
		await seedWeaponAttackProfiles(tx, weapon.id, seed);
	}

	await removeLegacyGeneratedWeaponTemplates(tx);
}

async function seedWeaponAttackProfiles(
	tx: Prisma.TransactionClient,
	weaponId: string,
	seed: WeaponContent
) {
	const profiles =
		seed.attackProfiles && seed.attackProfiles.length
			? seed.attackProfiles
			: await profilesFromTemplate(
					tx,
					seed.template.slug,
					seed.extraDamage,
					seed.damageTypes
				);

	await tx.weaponAttackProfile.deleteMany({ where: { weaponId } });

	for (const [index, profile] of profiles.entries()) {
		const skill = await tx.skill.findUnique({
			select: { id: true },
			where: { slug: profile.skill.slug }
		});
		const characteristic = await tx.characteristic.findFirst({
			select: { id: true },
			where: {
				OR: [
					{ systemValue: { slug: profile.characteristic.slug } },
					{ name: profile.characteristic.name }
				]
			}
		});

		if (!skill) {
			throw new Error(`Навык профиля атаки "${profile.skill.name}" не найден.`);
		}

		if (!characteristic) {
			throw new Error(
				`Характеристика "${profile.characteristic.name}" не найдена.`
			);
		}

		const intentIds = [];
		for (const intent of profile.combatIntents ?? []) {
			const combatIntent = await tx.combatIntent.findUnique({
				select: { id: true },
				where: { slug: intent.slug }
			});

			if (!combatIntent) {
				throw new Error(`Боевое намерение "${intent.name}" не найдено.`);
			}

			intentIds.push(combatIntent.id);
		}
		const damageTypeIds = [];
		for (const damageTypeRef of profile.damageTypes ?? seed.damageTypes ?? []) {
			const damageType = await tx.damageType.findUnique({
				select: { id: true },
				where: { slug: damageTypeRef.slug }
			});

			if (!damageType) {
				throw new Error(`Тип урона "${damageTypeRef.name}" не найден.`);
			}

			damageTypeIds.push(damageType.id);
		}

		await tx.weaponAttackProfile.create({
			data: {
				weaponId,
				kind: profile.kind === 'melee' ? 'MELEE' : 'RANGED',
				name: profile.name,
				skillId: skill.id,
				characteristicId: characteristic.id,
				baseCost: profile.baseCost,
				baseDamage: profile.baseDamage,
				rangeMeters: profile.rangeMeters,
				usesAmmo: profile.usesAmmo ?? false,
				canBeParried: profile.canBeParried ?? profile.kind === 'melee',
				isActive: profile.isActive ?? true,
				sortOrder: profile.sortOrder ?? index,
				damageTypeLinks: {
					create: damageTypeIds.map((damageTypeId, damageTypeIndex) => ({
						damageTypeId,
						sortOrder: damageTypeIndex
					}))
				},
				intentLinks: {
					create: intentIds.map((combatIntentId, intentIndex) => ({
						combatIntentId,
						sortOrder: intentIndex
					}))
				}
			}
		});
	}
}

async function profilesFromTemplate(
	tx: Prisma.TransactionClient,
	templateSlug: string,
	extraDamage: number,
	weaponDamageTypes: WeaponContent['damageTypes'] = []
): Promise<WeaponContent['attackProfiles']> {
	const template = await tx.weaponTemplate.findUnique({
		where: { slug: templateSlug },
		select: {
			attackProfiles: {
				select: {
					kind: true,
					name: true,
					skill: { select: { slug: true, name: true } },
					characteristic: {
						select: { name: true, systemValue: { select: { slug: true } } }
					},
					baseCost: true,
					baseDamage: true,
					rangeMeters: true,
					usesAmmo: true,
					canBeParried: true,
					isActive: true,
					sortOrder: true,
					damageTypeLinks: {
						select: {
							damageType: { select: { slug: true, name: true } }
						},
						orderBy: [{ sortOrder: 'asc' }]
					},
					intentLinks: {
						select: {
							combatIntent: { select: { slug: true, name: true } }
						},
						orderBy: [{ sortOrder: 'asc' }]
					}
				},
				orderBy: [{ sortOrder: 'asc' }]
			}
		}
	});

	if (!template) {
		throw new Error(`Шаблон оружия "${templateSlug}" не найден.`);
	}

	return template.attackProfiles.map(profile => ({
		kind: profile.kind === 'MELEE' ? 'melee' : 'ranged',
		name: profile.name,
		skill: profile.skill,
		characteristic: {
			name: profile.characteristic?.name ?? 'Мощь',
			slug: profile.characteristic?.systemValue.slug ?? 'mosch'
		},
		baseCost: profile.baseCost,
		baseDamage: profile.baseDamage + extraDamage,
		rangeMeters: profile.rangeMeters,
		usesAmmo: profile.usesAmmo,
		canBeParried: profile.canBeParried,
		damageTypes: weaponDamageTypes?.length
			? weaponDamageTypes
			: profile.damageTypeLinks.map(link => link.damageType),
		combatIntents: profile.intentLinks.map(link => link.combatIntent),
		sortOrder: profile.sortOrder,
		isActive: profile.isActive
	}));
}

async function removeLegacyGeneratedWeaponTemplates(
	tx: Prisma.TransactionClient
) {
	await tx.weaponTemplate.deleteMany({
		where: {
			name: { endsWith: ': базовый шаблон' },
			weapons: { none: {} }
		}
	});
}
