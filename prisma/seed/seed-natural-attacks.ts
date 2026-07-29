import { Prisma } from '../__generated__/index.js';
import type {
	ContentDocument,
	NaturalAttackContent,
	WeaponAttackProfileContent
} from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

const NATURAL_ATTACK_SEEDS = readContent<
	ContentDocument<{ naturalAttacks: NaturalAttackContent[] }>
>('dictionaries/natural-attacks.ts').naturalAttacks;

export async function seedNaturalAttacks(tx: Prisma.TransactionClient) {
	for (const seed of NATURAL_ATTACK_SEEDS) {
		const slug = seedSlug(seed);
		const skill = await findSkill(tx, seed.skill.slug, seed.skill.name);
		const existing = await tx.naturalAttack.findFirst({
			select: { id: true },
			where: {
				OR: [{ slug }, { name: seed.name }]
			}
		});

		const naturalAttack = existing
			? await tx.naturalAttack.update({
					select: { id: true },
					where: { id: existing.id },
					data: {
						slug,
						name: seed.name,
						skillId: skill.id,
						isActive: true,
						sortOrder: seed.sortOrder
					}
				})
			: await tx.naturalAttack.create({
					select: { id: true },
					data: {
						slug,
						name: seed.name,
						skillId: skill.id,
						isActive: true,
						sortOrder: seed.sortOrder
					}
				});

		await seedNaturalAttackProfiles(tx, naturalAttack.id, seed.attackProfiles);
	}
}

async function seedNaturalAttackProfiles(
	tx: Prisma.TransactionClient,
	naturalAttackId: string,
	profiles: WeaponAttackProfileContent[]
) {
	await tx.naturalAttackProfile.deleteMany({ where: { naturalAttackId } });

	for (const [index, profile] of profiles.entries()) {
		const skill = await findSkill(tx, profile.skill.slug, profile.skill.name);
		const characteristic = await tx.characteristic.findFirst({
			select: { id: true },
			where: {
				OR: [
					{ systemValue: { slug: profile.characteristic.slug } },
					{ name: profile.characteristic.name }
				]
			}
		});

		if (!characteristic) {
			throw new Error(
				`Характеристика "${profile.characteristic.name}" не найдена.`
			);
		}

		const combatIntentIds = [];
		for (const intent of profile.combatIntents ?? []) {
			const combatIntent = await tx.combatIntent.findUnique({
				select: { id: true },
				where: { slug: intent.slug }
			});

			if (!combatIntent) {
				throw new Error(`Боевое намерение "${intent.name}" не найдено.`);
			}

			combatIntentIds.push(combatIntent.id);
		}

		const damageTypeIds = [];
		for (const damageTypeRef of profile.damageTypes ?? []) {
			const damageType = await tx.damageType.findUnique({
				select: { id: true },
				where: { slug: damageTypeRef.slug }
			});

			if (!damageType) {
				throw new Error(`Тип урона "${damageTypeRef.name}" не найден.`);
			}

			damageTypeIds.push(damageType.id);
		}

		await tx.naturalAttackProfile.create({
			data: {
				naturalAttackId,
				kind: profile.kind === 'melee' ? 'MELEE' : 'RANGED',
				name: profile.name,
				skillId: skill.id,
				characteristicId: characteristic.id,
				baseCost: profile.baseCost,
				baseDamage: profile.baseDamage,
				rangeMeters: profile.rangeMeters,
				usesAmmo: profile.usesAmmo ?? false,
				canBeParried: profile.canBeParried ?? profile.kind === 'melee',
				defaultDefense:
					profile.defaultDefense ??
					defaultProfileDefense(profile.kind, profile.canBeParried),
				isActive: profile.isActive ?? true,
				sortOrder: profile.sortOrder ?? index,
				damageTypeLinks: {
					create: damageTypeIds.map((damageTypeId, damageTypeIndex) => ({
						damageTypeId,
						sortOrder: damageTypeIndex
					}))
				},
				intentLinks: {
					create: combatIntentIds.map((combatIntentId, intentIndex) => ({
						combatIntentId,
						sortOrder: intentIndex
					}))
				}
			}
		});
	}
}

function defaultProfileDefense(
	kind: WeaponAttackProfileContent['kind'],
	canBeParried: boolean | undefined
) {
	const canParry = canBeParried ?? kind === 'melee';
	return {
		type: kind === 'melee' ? 'target_physical_defense' : 'none',
		canDodge: kind === 'melee',
		canParry,
		parrySkillGroups: canParry ? ['melee_weapon', 'shield'] : []
	};
}

async function findSkill(
	tx: Prisma.TransactionClient,
	slug: string,
	name: string
) {
	const skill = await tx.skill.findUnique({
		select: { id: true },
		where: { slug }
	});

	if (!skill) {
		throw new Error(`Навык естественной атаки "${name}" не найден.`);
	}

	return skill;
}
