import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { createSlug } from '../shared/slug.util';
import { CreateCreatureTypeDto } from './dto/create-creature-type.dto';
import { UpdateCreatureTypeDto } from './dto/update-creature-type.dto';

const creatureTypeSelect = {
	id: true,
	slug: true,
	name: true,
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.CreatureTypeSelect;

type CreatureTypeRecord = Prisma.CreatureTypeGetPayload<{
	select: typeof creatureTypeSelect;
}>;

@Injectable()
export class CreatureTypesService {
	constructor(private readonly prisma: PrismaService) {}

	async getCatalog() {
		const creatureTypes = await this.prisma.creatureType.findMany({
			select: creatureTypeSelect,
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		});

		return {
			creatureTypes: creatureTypes.map(item => this.mapCreatureType(item))
		};
	}

	async createCreatureType(dto: CreateCreatureTypeDto) {
		try {
			const creatureType = await this.prisma.creatureType.create({
				select: creatureTypeSelect,
				data: this.toCreateData(dto)
			});

			return this.mapCreatureType(creatureType);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать тип существа.', {
				uniqueMessage: 'Тип существа с таким названием уже существует.'
			});
		}
	}

	async updateCreatureType(id: string, dto: UpdateCreatureTypeDto) {
		await this.ensureCreatureTypeExists(id);

		try {
			const creatureType = await this.prisma.creatureType.update({
				select: creatureTypeSelect,
				where: { id },
				data: this.toUpdateData(dto)
			});

			return this.mapCreatureType(creatureType);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить тип существа.', {
				uniqueMessage: 'Тип существа с таким названием уже существует.'
			});
		}
	}

	async deleteCreatureType(id: string) {
		await this.ensureCreatureTypeExists(id);
		await this.prisma.creatureType.delete({ where: { id } });
	}

	private async ensureCreatureTypeExists(id: string) {
		const creatureType = await this.prisma.creatureType.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!creatureType) {
			throw new NotFoundException('Тип существа не найден.');
		}
	}

	private toCreateData(dto: CreateCreatureTypeDto) {
		return {
			slug: createSlug(dto.name),
			name: dto.name.trim(),
			isActive: dto.isActive ?? true,
			sortOrder: dto.sortOrder ?? 0
		};
	}

	private toUpdateData(dto: UpdateCreatureTypeDto) {
		return {
			name: dto.name === undefined ? undefined : dto.name.trim(),
			isActive: dto.isActive,
			sortOrder: dto.sortOrder
		};
	}

	private mapCreatureType(creatureType: CreatureTypeRecord) {
		return {
			id: creatureType.id,
			slug: creatureType.slug,
			name: creatureType.name,
			isActive: creatureType.isActive,
			sortOrder: creatureType.sortOrder,
			createdAt: creatureType.createdAt.toISOString(),
			updatedAt: creatureType.updatedAt.toISOString()
		};
	}
}
