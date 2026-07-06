import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { createSlug } from '../shared/slug.util';
import { CreateWeaponDto } from './dto/create-weapon.dto';
import { UpdateWeaponDto } from './dto/update-weapon.dto';

const weaponSelect = {
	id: true,
	slug: true,
	name: true,
	skillId: true,
	skill: {
		select: {
			id: true,
			slug: true,
			name: true,
			categoryId: true,
			category: {
				select: {
					id: true,
					slug: true,
					name: true
				}
			},
			isActive: true,
			sortOrder: true
		}
	},
	extraDamage: true,
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.WeaponSelect;

type WeaponRecord = Prisma.WeaponGetPayload<{
	select: typeof weaponSelect;
}>;

@Injectable()
export class WeaponsService {
	constructor(private readonly prisma: PrismaService) {}

	async getCatalog() {
		const [weapons, skills] = await this.prisma.$transaction([
			this.prisma.weapon.findMany({
				select: weaponSelect,
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.skill.findMany({
				select: {
					id: true,
					slug: true,
					name: true,
					categoryId: true,
					category: {
						select: {
							id: true,
							slug: true,
							name: true
						}
					},
					isActive: true,
					sortOrder: true
				},
				orderBy: [
					{ category: { sortOrder: 'asc' } },
					{ sortOrder: 'asc' },
					{ name: 'asc' }
				]
			})
		]);

		return {
			weapons: weapons.map(item => this.mapWeapon(item)),
			skills
		};
	}

	async createWeapon(dto: CreateWeaponDto) {
		await this.ensureSkillExists(dto.skillId);

		try {
			const weapon = await this.prisma.weapon.create({
				select: weaponSelect,
				data: this.toCreateData(dto)
			});

			return this.mapWeapon(weapon);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать оружие.', {
				uniqueMessage: 'Оружие с таким названием уже существует.'
			});
		}
	}

	async updateWeapon(id: string, dto: UpdateWeaponDto) {
		await this.ensureWeaponExists(id);

		if (dto.skillId !== undefined) {
			await this.ensureSkillExists(dto.skillId);
		}

		try {
			const weapon = await this.prisma.weapon.update({
				select: weaponSelect,
				where: { id },
				data: this.toUpdateData(dto)
			});

			return this.mapWeapon(weapon);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить оружие.', {
				uniqueMessage: 'Оружие с таким названием уже существует.'
			});
		}
	}

	async deleteWeapon(id: string) {
		await this.ensureWeaponExists(id);
		await this.prisma.weapon.delete({ where: { id } });
	}

	private async ensureWeaponExists(id: string) {
		const weapon = await this.prisma.weapon.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!weapon) {
			throw new NotFoundException('Оружие не найдено.');
		}
	}

	private async ensureSkillExists(skillId: string) {
		const skill = await this.prisma.skill.findUnique({
			select: { id: true },
			where: { id: skillId }
		});

		if (!skill) {
			throw new BadRequestException('Навык оружия не найден.');
		}
	}

	private toCreateData(dto: CreateWeaponDto) {
		return {
			slug: createSlug(dto.name),
			name: dto.name.trim(),
			skillId: dto.skillId,
			extraDamage: dto.extraDamage,
			isActive: dto.isActive ?? true,
			sortOrder: dto.sortOrder ?? 0
		};
	}

	private toUpdateData(dto: UpdateWeaponDto) {
		return {
			name: dto.name === undefined ? undefined : dto.name.trim(),
			skillId: dto.skillId,
			extraDamage: dto.extraDamage,
			isActive: dto.isActive,
			sortOrder: dto.sortOrder
		};
	}

	private mapWeapon(weapon: WeaponRecord) {
		return {
			id: weapon.id,
			slug: weapon.slug,
			name: weapon.name,
			skillId: weapon.skillId,
			skill: weapon.skill,
			extraDamage: weapon.extraDamage,
			isActive: weapon.isActive,
			sortOrder: weapon.sortOrder,
			createdAt: weapon.createdAt.toISOString(),
			updatedAt: weapon.updatedAt.toISOString()
		};
	}
}
