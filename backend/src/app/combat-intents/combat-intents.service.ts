import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { createSlug } from '../shared/slug.util';
import { CreateCombatIntentDto } from './dto/create-combat-intent.dto';
import { UpdateCombatIntentDto } from './dto/update-combat-intent.dto';

const combatIntentSelect = {
	id: true,
	slug: true,
	name: true,
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.CombatIntentSelect;

type CombatIntentRecord = Prisma.CombatIntentGetPayload<{
	select: typeof combatIntentSelect;
}>;

@Injectable()
export class CombatIntentsService {
	constructor(private readonly prisma: PrismaService) {}

	async getCatalog() {
		const combatIntents = await this.prisma.combatIntent.findMany({
			select: combatIntentSelect,
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		});

		return {
			combatIntents: combatIntents.map(item => this.mapCombatIntent(item))
		};
	}

	async createCombatIntent(dto: CreateCombatIntentDto) {
		try {
			const combatIntent = await this.prisma.combatIntent.create({
				select: combatIntentSelect,
				data: this.toCreateData(dto)
			});

			return this.mapCombatIntent(combatIntent);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать боевое намерение.', {
				uniqueMessage: 'Боевое намерение с таким названием уже существует.'
			});
		}
	}

	async updateCombatIntent(id: string, dto: UpdateCombatIntentDto) {
		await this.ensureCombatIntentExists(id);

		try {
			const combatIntent = await this.prisma.combatIntent.update({
				select: combatIntentSelect,
				where: { id },
				data: this.toUpdateData(dto)
			});

			return this.mapCombatIntent(combatIntent);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить боевое намерение.', {
				uniqueMessage: 'Боевое намерение с таким названием уже существует.'
			});
		}
	}

	async deleteCombatIntent(id: string) {
		await this.ensureCombatIntentExists(id);
		await this.prisma.combatIntent.delete({ where: { id } });
	}

	private async ensureCombatIntentExists(id: string) {
		const combatIntent = await this.prisma.combatIntent.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!combatIntent) {
			throw new NotFoundException('Боевое намерение не найдено.');
		}
	}

	private toCreateData(dto: CreateCombatIntentDto) {
		return {
			slug: createSlug(dto.name),
			name: dto.name.trim(),
			isActive: dto.isActive ?? true,
			sortOrder: dto.sortOrder ?? 0
		};
	}

	private toUpdateData(dto: UpdateCombatIntentDto) {
		return {
			name: dto.name === undefined ? undefined : dto.name.trim(),
			isActive: dto.isActive,
			sortOrder: dto.sortOrder
		};
	}

	private mapCombatIntent(combatIntent: CombatIntentRecord) {
		return {
			id: combatIntent.id,
			slug: combatIntent.slug,
			name: combatIntent.name,
			isActive: combatIntent.isActive,
			sortOrder: combatIntent.sortOrder,
			createdAt: combatIntent.createdAt.toISOString(),
			updatedAt: combatIntent.updatedAt.toISOString()
		};
	}
}
