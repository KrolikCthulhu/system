import { Prisma } from '../__generated__/index.js';
import type {
	ContentDocument,
	WeaponAttackProfileContent,
	WeaponTemplateContent
} from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

const WEAPON_TEMPLATE_SEEDS = readContent<
	ContentDocument<{ weaponTemplates: WeaponTemplateContent[] }>
>('dictionaries/weapon-templates.ts').weaponTemplates;

export async function seedWeaponTemplates(tx: Prisma.TransactionClient) {
	for (const seed of WEAPON_TEMPLATE_SEEDS) {
		const slug = seedSlug(seed);
		const skill = await findSkill(tx, seed.skill.slug, seed.skill.name);
		const existing = await tx.weaponTemplate.findFirst({
			select: { id: true },
			where: {
				OR: [{ slug }, { name: seed.name }]
			}
		});

		const template = existing
			? await tx.weaponTemplate.update({
					select: { id: true },
					where: { id: existing.id },
					data: {
						slug,
						name: seed.name,
						skillId: skill.id,
						handsMin: seed.handsMin,
						handsMax: seed.handsMax,
						defaultHands: seed.defaultHands,
						isActive: true,
						sortOrder: seed.sortOrder
					}
				})
			: await tx.weaponTemplate.create({
					select: { id: true },
					data: {
						slug,
						name: seed.name,
						skillId: skill.id,
						handsMin: seed.handsMin,
						handsMax: seed.handsMax,
						defaultHands: seed.defaultHands,
						isActive: true,
						sortOrder: seed.sortOrder
					}
				});

		await seedTemplateProfiles(tx, template.id, seed.attackProfiles);
	}
}

async function seedTemplateProfiles(
	tx: Prisma.TransactionClient,
	templateId: string,
	profiles: WeaponAttackProfileContent[]
) {
	await tx.weaponTemplateAttackProfile.deleteMany({ where: { templateId } });

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

		await tx.weaponTemplateAttackProfile.create({
			data: {
				templateId,
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
		throw new Error(`Навык шаблона оружия "${name}" не найден.`);
	}

	return skill;
}
