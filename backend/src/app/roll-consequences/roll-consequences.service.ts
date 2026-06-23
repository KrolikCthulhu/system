import { Injectable, NotFoundException } from '@nestjs/common';
import {
	Prisma,
	SystemValueOwnerType
} from '@prisma/generated';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { createCharacterInputGraph } from '../shared/system-value-graph.factory';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { CreateRollConsequenceDto } from './dto/create-roll-consequence.dto';
import { RollConsequenceValueDto } from './dto/roll-consequence-value.dto';
import { UpdateRollConsequenceActiveDto } from './dto/update-roll-consequence-active.dto';
import { UpdateRollConsequenceDto } from './dto/update-roll-consequence.dto';

const rollConsequenceSelect = {
	id: true,
	name: true,
	description: true,
	rollEventGraph: true,
	isActive: true,
	sortOrder: true
} satisfies Prisma.RollConsequenceSelect;

const systemValueSelect = {
	id: true,
	name: true,
	description: true,
	primaryOwnerId: true,
	isActive: true,
	sortOrder: true
} satisfies Prisma.SystemValueSelect;

@Injectable()
export class RollConsequencesService {
	constructor(private readonly prisma: PrismaService) {}

	async getCatalog() {
		const consequences = await this.prisma.rollConsequence.findMany({
			select: rollConsequenceSelect,
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		});
		const values = await this.loadValues(consequences.map(item => item.id));

		return {
			consequences: consequences.map(item =>
				this.mapConsequence(item, values.get(item.id) ?? [])
			)
		};
	}

	async getOptions() {
		const consequences = await this.prisma.rollConsequence.findMany({
			select: rollConsequenceSelect,
			where: { isActive: true },
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		});

		return consequences.map(item => this.mapConsequence(item, []));
	}

	async get(id: string) {
		const consequence = await this.prisma.rollConsequence.findUnique({
			select: rollConsequenceSelect,
			where: { id }
		});

		if (!consequence) {
			throw new NotFoundException('Последствие броска не найдено.');
		}

		const values = await this.loadValues([id]);
		return this.mapConsequence(consequence, values.get(id) ?? []);
	}

	async create(dto: CreateRollConsequenceDto) {
		try {
			const consequenceId = await this.prisma.$transaction(async tx => {
				const created = await tx.rollConsequence.create({
					select: { id: true },
					data: {
						name: dto.name,
						description: dto.description || null,
						rollEventGraph:
							dto.rollEventGraph === null || dto.rollEventGraph === undefined
								? Prisma.JsonNull
								: (dto.rollEventGraph as Prisma.InputJsonValue),
						isActive: dto.isActive ?? true,
						sortOrder: dto.sortOrder ?? 0
					}
				});

				await this.syncValues(tx, created.id, dto.values ?? []);

				return created.id;
			});
			const consequence = await this.loadConsequence(consequenceId);
			const values = await this.loadValues([consequenceId]);

			return this.mapConsequence(consequence, values.get(consequence.id) ?? []);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать последствие броска.');
		}
	}

	async update(id: string, dto: UpdateRollConsequenceDto) {
		await this.ensureExists(id);

		try {
			await this.prisma.$transaction(async tx => {
				await tx.rollConsequence.update({
					where: { id },
					data: {
						name: dto.name,
						description:
							dto.description === undefined ? undefined : dto.description || null,
						rollEventGraph:
							dto.rollEventGraph === undefined
								? undefined
								: dto.rollEventGraph === null
									? Prisma.JsonNull
									: (dto.rollEventGraph as Prisma.InputJsonValue),
						isActive: dto.isActive,
						sortOrder: dto.sortOrder
					}
				});

				if (dto.values) {
					await this.syncValues(tx, id, dto.values);
				}
			});
			const consequence = await this.loadConsequence(id);
			const values = await this.loadValues([id]);

			return this.mapConsequence(consequence, values.get(id) ?? []);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить последствие броска.');
		}
	}

	async updateActive(id: string, dto: UpdateRollConsequenceActiveDto) {
		await this.ensureExists(id);

		const consequence = await this.prisma.rollConsequence.update({
			select: rollConsequenceSelect,
			where: { id },
			data: { isActive: dto.isActive }
		});
		const values = await this.loadValues([id]);

		return this.mapConsequence(consequence, values.get(id) ?? []);
	}

	async delete(id: string) {
		await this.ensureExists(id);

		await this.prisma.$transaction([
			this.prisma.rollConsequence.delete({ where: { id } }),
			this.prisma.systemValue.deleteMany({
				where: {
					primaryOwnerType: SystemValueOwnerType.ROLL_CONSEQUENCE,
					primaryOwnerId: id
				}
			})
		]);
	}

	private async syncValues(
		tx: Prisma.TransactionClient,
		consequenceId: string,
		values: RollConsequenceValueDto[]
	) {
		const existingValues = await tx.systemValue.findMany({
			select: { id: true },
			where: {
				primaryOwnerType: SystemValueOwnerType.ROLL_CONSEQUENCE,
				primaryOwnerId: consequenceId
			}
		});
		const existingIds = new Set(existingValues.map(value => value.id));
		const nextIds = new Set(
			values
				.map(value => value.id)
				.filter((id): id is string => Boolean(id) && existingIds.has(id))
		);

		await tx.systemValue.deleteMany({
			where: {
				primaryOwnerType: SystemValueOwnerType.ROLL_CONSEQUENCE,
				primaryOwnerId: consequenceId,
				id: { notIn: Array.from(nextIds) }
			}
		});

		for (const [index, value] of values.entries()) {
			const sortOrder = value.sortOrder ?? index;

			if (value.id && existingIds.has(value.id)) {
				await tx.systemValue.update({
					where: { id: value.id },
					data: {
						name: value.name,
						description: value.description || null,
						isActive: value.isActive ?? true,
						sortOrder
					}
				});
				await tx.systemValueLink.upsert({
					where: {
						systemValueId_targetType_targetId: {
							systemValueId: value.id,
							targetType: SystemValueOwnerType.ROLL_CONSEQUENCE,
							targetId: consequenceId
						}
					},
					create: {
						id: value.id,
						systemValueId: value.id,
						targetType: SystemValueOwnerType.ROLL_CONSEQUENCE,
						targetId: consequenceId,
						sortOrder
					},
					update: {
						sortOrder
					}
				});
				continue;
			}

			const id = randomUUID();

			await tx.systemValue.create({
				data: {
					id,
					name: value.name,
					description: value.description || null,
					primaryOwnerType: SystemValueOwnerType.ROLL_CONSEQUENCE,
					primaryOwnerId: consequenceId,
					calculationGraph: createCharacterInputGraph(),
					isActive: value.isActive ?? true,
					sortOrder,
					links: {
						create: {
							id,
							targetType: SystemValueOwnerType.ROLL_CONSEQUENCE,
							targetId: consequenceId,
							sortOrder
						}
					}
				}
			});
		}
	}

	private async loadValues(consequenceIds: string[]) {
		const values = await this.prisma.systemValue.findMany({
			select: systemValueSelect,
			where: {
				primaryOwnerType: SystemValueOwnerType.ROLL_CONSEQUENCE,
				primaryOwnerId: { in: consequenceIds }
			},
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		});
		const grouped = new Map<string, typeof values>();

		for (const value of values) {
			const ownerId = value.primaryOwnerId;

			if (!ownerId) {
				continue;
			}

			grouped.set(ownerId, [...(grouped.get(ownerId) ?? []), value]);
		}

		return grouped;
	}

	private mapConsequence(
		consequence: {
			id: string;
			name: string;
			description: string | null;
			rollEventGraph: Prisma.JsonValue | null;
			isActive: boolean;
			sortOrder: number;
		},
		values: Array<{
			id: string;
			name: string;
			description: string | null;
			primaryOwnerId: string | null;
			isActive: boolean;
			sortOrder: number;
		}>
	) {
		return {
			id: consequence.id,
			name: consequence.name,
			description: consequence.description ?? '',
			rollEventGraph: normalizeJsonObject(consequence.rollEventGraph),
			isActive: consequence.isActive,
			sortOrder: consequence.sortOrder,
			values: values.map(value => ({
				id: value.id,
				name: value.name,
				description: value.description ?? '',
				isActive: value.isActive,
				sortOrder: value.sortOrder
			}))
		};
	}

	private async ensureExists(id: string) {
		const consequence = await this.prisma.rollConsequence.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!consequence) {
			throw new NotFoundException('Последствие броска не найдено.');
		}
	}

	private loadConsequence(id: string) {
		return this.prisma.rollConsequence.findUniqueOrThrow({
			select: rollConsequenceSelect,
			where: { id }
		});
	}

}

function normalizeJsonObject(value: Prisma.JsonValue | null) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null;
	}

	return value;
}
