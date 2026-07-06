import { Prisma } from '../__generated__/index.js';
import type { ContentDocument, WeaponContent } from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

const WEAPON_SEEDS = readContent<
	ContentDocument<{ weapons: WeaponContent[] }>
>('dictionaries/weapons.ts').weapons;

export async function seedWeapons(tx: Prisma.TransactionClient) {
	for (const seed of WEAPON_SEEDS) {
		const slug = seedSlug(seed);
		const skill = await tx.skill.findUnique({
			select: { id: true },
			where: { slug: seed.skill.slug }
		});

		if (!skill) {
			throw new Error(`Навык оружия "${seed.skill.name}" не найден.`);
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
					extraDamage: seed.extraDamage,
					sortOrder: seed.sortOrder,
					isActive: true
				}
			});
			continue;
		}

		await tx.weapon.create({
			data: {
				slug,
				name: seed.name,
				skillId: skill.id,
				extraDamage: seed.extraDamage,
				isActive: true,
				sortOrder: seed.sortOrder
			}
		});
	}
}
