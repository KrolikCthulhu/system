import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProgressionPresetKind } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { createSlug } from '../shared/slug.util';
import { CreateProgressionPresetDto } from './dto/create-progression-preset.dto';
import { UpdateProgressionPresetDto } from './dto/update-progression-preset.dto';

const progressionPresetSelect = {
	id: true,
	slug: true,
	name: true,
	description: true,
	kind: true,
	config: true,
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.ProgressionPresetSelect;

type ProgressionPresetRecord = Prisma.ProgressionPresetGetPayload<{
	select: typeof progressionPresetSelect;
}>;
type ProgressionPresetRoundingMode = 'floor' | 'round' | 'ceil';

@Injectable()
export class ProgressionPresetsService {
	constructor(private readonly prisma: PrismaService) {}

	async getCatalog() {
		const presets = await this.prisma.progressionPreset.findMany({
			select: progressionPresetSelect,
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		});

		return { presets: presets.map(item => this.mapPreset(item)) };
	}

	async createPreset(dto: CreateProgressionPresetDto) {
		try {
			const preset = await this.prisma.progressionPreset.create({
				select: progressionPresetSelect,
				data: this.toCreateData(dto)
			});

			return this.mapPreset(preset);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать пресет прогрессии.', {
				uniqueMessage: 'Пресет прогрессии с таким названием уже существует.'
			});
		}
	}

	async updatePreset(id: string, dto: UpdateProgressionPresetDto) {
		const current = await this.ensurePresetExists(id);

		try {
			const preset = await this.prisma.progressionPreset.update({
				select: progressionPresetSelect,
				where: { id },
				data: this.toUpdateData(dto, current.kind)
			});

			return this.mapPreset(preset);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить пресет прогрессии.', {
				uniqueMessage: 'Пресет прогрессии с таким названием уже существует.'
			});
		}
	}

	async deletePreset(id: string) {
		await this.ensurePresetExists(id);
		await this.prisma.progressionPreset.delete({ where: { id } });
	}

	private async ensurePresetExists(id: string) {
		const preset = await this.prisma.progressionPreset.findUnique({
			select: { id: true, kind: true },
			where: { id }
		});

		if (!preset) {
			throw new NotFoundException('Пресет прогрессии не найден.');
		}

		return preset;
	}

	private toCreateData(dto: CreateProgressionPresetDto) {
		return {
			slug: createSlug(dto.name),
			name: dto.name.trim(),
			description: this.toNullableString(dto.description),
			kind: dto.kind,
			config: this.normalizeConfig(dto.kind, dto.config),
			isActive: dto.isActive ?? true,
			sortOrder: dto.sortOrder ?? 0
		};
	}

	private toUpdateData(
		dto: UpdateProgressionPresetDto,
		currentKind: ProgressionPresetKind
	) {
		const kind = dto.kind ?? currentKind;

		return {
			name: dto.name === undefined ? undefined : dto.name.trim(),
			description:
				dto.description === undefined
					? undefined
					: this.toNullableString(dto.description),
			kind: dto.kind,
			config:
				dto.config === undefined ? undefined : this.normalizeConfig(kind, dto.config),
			isActive: dto.isActive,
			sortOrder: dto.sortOrder
		};
	}

	private normalizeConfig(
		kind: ProgressionPresetKind,
		config: Record<string, unknown>
	): Record<string, number | ProgressionPresetRoundingMode> {
		const numberConfig = Object.fromEntries(
			Object.entries(config)
				.filter(([key]) => key !== 'roundingMode')
				.map(([key, value]) => [key, this.toFiniteNumber(value)])
		);

		for (const key of this.requiredConfigKeys(kind)) {
			if (numberConfig[key] === undefined) {
				throw new BadRequestException(`Не заполнен параметр прогрессии: ${key}.`);
			}
		}

		return {
			...numberConfig,
			roundingMode: this.toRoundingMode(config['roundingMode'])
		};
	}

	private requiredConfigKeys(kind: ProgressionPresetKind): string[] {
		switch (kind) {
			case ProgressionPresetKind.LINEAR:
				return ['base', 'step'];
			case ProgressionPresetKind.STEP:
				return ['base', 'step', 'interval'];
			case ProgressionPresetKind.QUADRATIC:
			case ProgressionPresetKind.SQUARE_ROOT:
			case ProgressionPresetKind.LOGARITHMIC:
				return ['base', 'multiplier'];
			case ProgressionPresetKind.SATURATION:
				return ['min', 'max', 'speed'];
			case ProgressionPresetKind.PERCENT:
				return ['base', 'percent'];
		}
	}

	private toFiniteNumber(value: unknown) {
		const numericValue = typeof value === 'number' ? value : Number(value);

		if (!Number.isFinite(numericValue)) {
			throw new BadRequestException('Все параметры прогрессии должны быть числами.');
		}

		return numericValue;
	}

	private toRoundingMode(value: unknown): ProgressionPresetRoundingMode {
		if (value === 'floor' || value === 'round' || value === 'ceil') {
			return value;
		}

		return 'round';
	}

	private toNullableString(value?: string | null) {
		if (value === undefined || value === null) {
			return null;
		}

		const normalized = value.trim();
		return normalized ? normalized : null;
	}

	private mapPreset(preset: ProgressionPresetRecord) {
		return {
			id: preset.id,
			slug: preset.slug,
			name: preset.name,
			description: preset.description ?? '',
			kind: preset.kind,
			config: preset.config,
			isActive: preset.isActive,
			sortOrder: preset.sortOrder,
			createdAt: preset.createdAt.toISOString(),
			updatedAt: preset.updatedAt.toISOString()
		};
	}
}
