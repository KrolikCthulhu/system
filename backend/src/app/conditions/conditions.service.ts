import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { CreateConditionDto } from './dto/create-condition.dto';
import { UpdateConditionDto } from './dto/update-condition.dto';

const conditionSelect = {
	id: true,
	name: true,
	description: true,
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.ConditionSelect;

type ConditionRecord = Prisma.ConditionGetPayload<{
	select: typeof conditionSelect;
}>;

@Injectable()
export class ConditionsService {
	constructor(private readonly prisma: PrismaService) {}

	async getCatalog() {
		const conditions = await this.prisma.condition.findMany({
			select: conditionSelect,
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		});

		return { conditions: conditions.map(item => this.mapCondition(item)) };
	}

	async createCondition(dto: CreateConditionDto) {
		try {
			const condition = await this.prisma.condition.create({
				select: conditionSelect,
				data: this.toCreateData(dto)
			});

			return this.mapCondition(condition);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать состояние.', {
				uniqueMessage: 'Состояние с таким названием уже существует.'
			});
		}
	}

	async updateCondition(id: string, dto: UpdateConditionDto) {
		await this.ensureConditionExists(id);

		try {
			const condition = await this.prisma.condition.update({
				select: conditionSelect,
				where: { id },
				data: this.toUpdateData(dto)
			});

			return this.mapCondition(condition);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить состояние.', {
				uniqueMessage: 'Состояние с таким названием уже существует.'
			});
		}
	}

	async deleteCondition(id: string) {
		await this.ensureConditionExists(id);
		await this.prisma.condition.delete({ where: { id } });
	}

	private async ensureConditionExists(id: string) {
		const condition = await this.prisma.condition.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!condition) {
			throw new NotFoundException('Состояние не найдено.');
		}
	}

	private toCreateData(dto: CreateConditionDto) {
		return {
			name: dto.name.trim(),
			description: this.toNullableString(dto.description),
			isActive: dto.isActive ?? true,
			sortOrder: dto.sortOrder ?? 0
		};
	}

	private toUpdateData(dto: UpdateConditionDto) {
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

	private mapCondition(condition: ConditionRecord) {
		return {
			id: condition.id,
			name: condition.name,
			description: condition.description ?? '',
			isActive: condition.isActive,
			sortOrder: condition.sortOrder,
			createdAt: condition.createdAt.toISOString(),
			updatedAt: condition.updatedAt.toISOString()
		};
	}
}
