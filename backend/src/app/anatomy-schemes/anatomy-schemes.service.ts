import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { AnatomyZoneKind, Prisma } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { createSlug } from '../shared/slug.util';
import { AnatomySyncService } from './anatomy-sync.service';
import { AnatomySchemeZoneDto } from './dto/anatomy-scheme-zone.dto';
import { CreateAnatomySchemeDto } from './dto/create-anatomy-scheme.dto';
import { UpdateAnatomySchemeDto } from './dto/update-anatomy-scheme.dto';

const anatomySchemeSelect = {
	id: true,
	slug: true,
	name: true,
	description: true,
	zones: {
		select: {
			id: true,
			slug: true,
			name: true,
			parentId: true,
			kind: true,
			isRandomHitEligible: true,
			randomHitWeight: true,
			targetedAttackDicePenalty: true,
			extraPotentialCost: true,
			isActive: true,
			sortOrder: true
		},
		orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
	},
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.AnatomySchemeSelect;

type AnatomySchemeRecord = Prisma.AnatomySchemeGetPayload<{
	select: typeof anatomySchemeSelect;
}>;

@Injectable()
export class AnatomySchemesService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly anatomySyncService: AnatomySyncService
	) {}

	async getCatalog() {
		const anatomySchemes = await this.prisma.anatomyScheme.findMany({
			select: anatomySchemeSelect,
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		});

		return {
			anatomySchemes: anatomySchemes.map(item => this.mapScheme(item))
		};
	}

	async createScheme(dto: CreateAnatomySchemeDto) {
		this.validateZones(dto.zones);

		try {
			const scheme = await this.prisma.$transaction(async tx => {
				const created = await tx.anatomyScheme.create({
					select: { id: true },
					data: {
						slug: createSlug(dto.name),
						name: dto.name.trim(),
						description: this.toNullableString(dto.description),
						isActive: dto.isActive ?? true,
						sortOrder: dto.sortOrder ?? 0
					}
				});

				await this.replaceZones(tx, created.id, dto.zones);

				return tx.anatomyScheme.findUniqueOrThrow({
					select: anatomySchemeSelect,
					where: { id: created.id }
				});
			});

			return this.mapScheme(scheme);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать анатомическую схему.', {
				uniqueMessage: 'Анатомическая схема с таким названием уже существует.'
			});
		}
	}

	async updateScheme(id: string, dto: UpdateAnatomySchemeDto) {
		await this.ensureSchemeExists(id);

		if (dto.zones) {
			this.validateZones(dto.zones);
		}

		try {
			const scheme = await this.prisma.$transaction(async tx => {
				await tx.anatomyScheme.update({
					where: { id },
					data: {
						name: dto.name === undefined ? undefined : dto.name.trim(),
						description:
							dto.description === undefined
								? undefined
								: this.toNullableString(dto.description),
						isActive: dto.isActive,
						sortOrder: dto.sortOrder
					}
				});

				if (dto.zones) {
					await this.replaceZones(tx, id, dto.zones);
					await this.anatomySyncService.syncCreaturesUsingScheme(tx, id);
				}

				return tx.anatomyScheme.findUniqueOrThrow({
					select: anatomySchemeSelect,
					where: { id }
				});
			});

			return this.mapScheme(scheme);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить анатомическую схему.', {
				uniqueMessage: 'Анатомическая схема с таким названием уже существует.'
			});
		}
	}

	async deleteScheme(id: string) {
		await this.ensureSchemeExists(id);
		await this.prisma.anatomyScheme.delete({ where: { id } });
	}

	private async ensureSchemeExists(id: string) {
		const scheme = await this.prisma.anatomyScheme.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!scheme) {
			throw new NotFoundException('Анатомическая схема не найдена.');
		}
	}

	private async replaceZones(
		tx: Prisma.TransactionClient,
		schemeId: string,
		zones: AnatomySchemeZoneDto[]
	) {
		await tx.anatomySchemeZone.deleteMany({ where: { schemeId } });

		const zoneIdsByClientKey = new Map<string, string>();
		const orderedZones = zones.map((zone, index) => ({
			...zone,
			sortOrder: zone.sortOrder ?? index,
			slug: zone.slug?.trim() || createSlug(zone.name)
		}));

		for (const zone of orderedZones.filter(item => !item.parentId)) {
			const created = await tx.anatomySchemeZone.create({
				select: { id: true },
				data: this.toZoneCreateData(schemeId, null, zone)
			});
			zoneIdsByClientKey.set(zone.id ?? zone.slug, created.id);
		}

		for (const zone of orderedZones.filter(item => item.parentId)) {
			const parentId = zoneIdsByClientKey.get(zone.parentId ?? '');

			if (!parentId) {
				throw new BadRequestException(
					`Родительская зона для «${zone.name}» не найдена.`
				);
			}

			const created = await tx.anatomySchemeZone.create({
				select: { id: true },
				data: this.toZoneCreateData(schemeId, parentId, zone)
			});
			zoneIdsByClientKey.set(zone.id ?? zone.slug, created.id);
		}
	}

	private toZoneCreateData(
		schemeId: string,
		parentId: string | null,
		zone: AnatomySchemeZoneDto & { slug: string; sortOrder: number }
	): Prisma.AnatomySchemeZoneUncheckedCreateInput {
		return {
			schemeId,
			parentId,
			slug: zone.slug,
			name: zone.name.trim(),
			kind: zone.kind as AnatomyZoneKind,
			isRandomHitEligible: zone.isRandomHitEligible,
			randomHitWeight: zone.randomHitWeight,
			targetedAttackDicePenalty: zone.targetedAttackDicePenalty,
			extraPotentialCost: zone.extraPotentialCost,
			isActive: zone.isActive ?? true,
			sortOrder: zone.sortOrder
		};
	}

	private validateZones(zones: AnatomySchemeZoneDto[]) {
		const names = new Set<string>();
		const clientKeys = new Set<string>();

		for (const zone of zones) {
			const name = zone.name.trim();

			if (!name) {
				throw new BadRequestException('Название зоны обязательно.');
			}

			if (names.has(name)) {
				throw new BadRequestException(`Зона «${name}» указана дважды.`);
			}

			names.add(name);
			clientKeys.add(zone.id ?? zone.slug ?? createSlug(name));

			if (zone.kind === 'MAIN' && zone.randomHitWeight < 1) {
				throw new BadRequestException(
					`Основная зона «${name}» должна иметь вес попадания не меньше 1.`
				);
			}
		}

		for (const zone of zones) {
			if (zone.parentId && !clientKeys.has(zone.parentId)) {
				throw new BadRequestException(
					`Родительская зона для «${zone.name}» не найдена.`
				);
			}
		}
	}

	private toNullableString(value?: string | null) {
		if (value === undefined || value === null) {
			return null;
		}

		const normalized = value.trim();
		return normalized ? normalized : null;
	}

	private mapScheme(scheme: AnatomySchemeRecord) {
		return {
			id: scheme.id,
			slug: scheme.slug,
			name: scheme.name,
			description: scheme.description ?? '',
			zones: scheme.zones.map(zone => ({
				id: zone.id,
				slug: zone.slug,
				name: zone.name,
				parentId: zone.parentId,
				kind: zone.kind,
				isRandomHitEligible: zone.isRandomHitEligible,
				randomHitWeight: zone.randomHitWeight,
				targetedAttackDicePenalty: zone.targetedAttackDicePenalty,
				extraPotentialCost: zone.extraPotentialCost,
				isActive: zone.isActive,
				sortOrder: zone.sortOrder
			})),
			isActive: scheme.isActive,
			sortOrder: scheme.sortOrder,
			createdAt: scheme.createdAt.toISOString(),
			updatedAt: scheme.updatedAt.toISOString()
		};
	}
}
