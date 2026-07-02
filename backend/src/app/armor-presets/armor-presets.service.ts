import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { createSlug } from '../shared/slug.util';
import { CreateArmorPresetDto } from './dto/create-armor-preset.dto';
import { UpdateArmorPresetDto } from './dto/update-armor-preset.dto';

const armorPresetSelect = {
	id: true,
	slug: true,
	name: true,
	points: true,
	protection: true,
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.ArmorPresetSelect;

type ArmorPresetRecord = Prisma.ArmorPresetGetPayload<{
	select: typeof armorPresetSelect;
}>;

@Injectable()
export class ArmorPresetsService {
	constructor(private readonly prisma: PrismaService) {}

	async getCatalog() {
		const armorPresets = await this.prisma.armorPreset.findMany({
			select: armorPresetSelect,
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		});

		return {
			armorPresets: armorPresets.map(item => this.mapArmorPreset(item))
		};
	}

	async createArmorPreset(dto: CreateArmorPresetDto) {
		try {
			const armorPreset = await this.prisma.armorPreset.create({
				select: armorPresetSelect,
				data: this.toCreateData(dto)
			});

			return this.mapArmorPreset(armorPreset);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать пресет брони.', {
				uniqueMessage: 'Пресет брони с таким названием уже существует.'
			});
		}
	}

	async updateArmorPreset(id: string, dto: UpdateArmorPresetDto) {
		await this.ensureArmorPresetExists(id);

		try {
			const armorPreset = await this.prisma.armorPreset.update({
				select: armorPresetSelect,
				where: { id },
				data: this.toUpdateData(dto)
			});

			return this.mapArmorPreset(armorPreset);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить пресет брони.', {
				uniqueMessage: 'Пресет брони с таким названием уже существует.'
			});
		}
	}

	async deleteArmorPreset(id: string) {
		await this.ensureArmorPresetExists(id);
		await this.prisma.armorPreset.delete({ where: { id } });
	}

	private async ensureArmorPresetExists(id: string) {
		const armorPreset = await this.prisma.armorPreset.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!armorPreset) {
			throw new NotFoundException('Пресет брони не найден.');
		}
	}

	private toCreateData(dto: CreateArmorPresetDto) {
		return {
			slug: createSlug(dto.name),
			name: dto.name.trim(),
			points: dto.points,
			protection: dto.protection,
			isActive: dto.isActive ?? true,
			sortOrder: dto.sortOrder ?? 0
		};
	}

	private toUpdateData(dto: UpdateArmorPresetDto) {
		return {
			name: dto.name === undefined ? undefined : dto.name.trim(),
			points: dto.points,
			protection: dto.protection,
			isActive: dto.isActive,
			sortOrder: dto.sortOrder
		};
	}

	private mapArmorPreset(armorPreset: ArmorPresetRecord) {
		return {
			id: armorPreset.id,
			slug: armorPreset.slug,
			name: armorPreset.name,
			points: armorPreset.points,
			protection: armorPreset.protection,
			isActive: armorPreset.isActive,
			sortOrder: armorPreset.sortOrder,
			createdAt: armorPreset.createdAt.toISOString(),
			updatedAt: armorPreset.updatedAt.toISOString()
		};
	}
}
