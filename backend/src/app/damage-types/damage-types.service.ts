import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { createSlug } from '../shared/slug.util';
import { CreateDamageTypeDto } from './dto/create-damage-type.dto';
import { UpdateDamageTypeDto } from './dto/update-damage-type.dto';

const damageTypeSelect = {
	id: true,
	slug: true,
	name: true,
	description: true,
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.DamageTypeSelect;

type DamageTypeRecord = Prisma.DamageTypeGetPayload<{
	select: typeof damageTypeSelect;
}>;

@Injectable()
export class DamageTypesService {
	constructor(private readonly prisma: PrismaService) {}

	async getCatalog() {
		const damageTypes = await this.prisma.damageType.findMany({
			select: damageTypeSelect,
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		});

		return { damageTypes: damageTypes.map(item => this.mapDamageType(item)) };
	}

	async createDamageType(dto: CreateDamageTypeDto) {
		try {
			const damageType = await this.prisma.damageType.create({
				select: damageTypeSelect,
				data: this.toCreateData(dto)
			});

			return this.mapDamageType(damageType);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать тип урона.', {
				uniqueMessage: 'Тип урона с таким названием уже существует.'
			});
		}
	}

	async updateDamageType(id: string, dto: UpdateDamageTypeDto) {
		await this.ensureDamageTypeExists(id);

		try {
			const damageType = await this.prisma.damageType.update({
				select: damageTypeSelect,
				where: { id },
				data: this.toUpdateData(dto)
			});

			return this.mapDamageType(damageType);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить тип урона.', {
				uniqueMessage: 'Тип урона с таким названием уже существует.'
			});
		}
	}

	async deleteDamageType(id: string) {
		await this.ensureDamageTypeExists(id);
		await this.prisma.damageType.delete({ where: { id } });
	}

	private async ensureDamageTypeExists(id: string) {
		const damageType = await this.prisma.damageType.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!damageType) {
			throw new NotFoundException('Тип урона не найден.');
		}
	}

	private toCreateData(dto: CreateDamageTypeDto) {
		return {
			slug: createSlug(dto.name),
			name: dto.name.trim(),
			description: this.toNullableString(dto.description),
			isActive: dto.isActive ?? true,
			sortOrder: dto.sortOrder ?? 0
		};
	}

	private toUpdateData(dto: UpdateDamageTypeDto) {
		return {
			name: dto.name === undefined ? undefined : dto.name.trim(),
			description:
				dto.description === undefined
					? undefined
					: this.toNullableString(dto.description),
			isActive: dto.isActive,
			sortOrder: dto.sortOrder
		};
	}

	private toNullableString(value?: string | null) {
		if (value === undefined || value === null) {
			return null;
		}

		const normalized = value.trim();
		return normalized ? normalized : null;
	}

	private mapDamageType(damageType: DamageTypeRecord) {
		return {
			id: damageType.id,
			slug: damageType.slug,
			name: damageType.name,
			description: damageType.description ?? '',
			isActive: damageType.isActive,
			sortOrder: damageType.sortOrder,
			createdAt: damageType.createdAt.toISOString(),
			updatedAt: damageType.updatedAt.toISOString()
		};
	}
}
