import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { CreateCharacteristicDto } from './dto/create-characteristic.dto';
import { UpdateAttributeActiveDto } from './dto/update-attribute-active.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { UpdateCharacteristicActiveDto } from './dto/update-characteristic-active.dto';
import { UpdateCharacteristicDto } from './dto/update-characteristic.dto';

@Injectable()
export class AttributesService {
	constructor(private readonly prisma: PrismaService) {}

	async getAdminCatalog() {
		const [attributes, characteristics] = await Promise.all([
			this.prisma.attribute.findMany({
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.characteristic.findMany({
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			})
		]);

		return {
			attributes: attributes.map(attribute => this.mapAttribute(attribute)),
			characteristics: characteristics.map(characteristic =>
				this.mapCharacteristic(characteristic)
			)
		};
	}

	async createAttribute(dto: CreateAttributeDto) {
		try {
			const attribute = await this.prisma.attribute.create({
				data: {
					name: dto.name,
					description: this.toNullableString(dto.description) ?? null,
					sortOrder: dto.sortOrder
				}
			});

			return this.mapAttribute(attribute);
		} catch (error) {
			this.rethrowPrismaError(error, 'Failed to create attribute.');
		}
	}

	async updateAttribute(id: string, dto: UpdateAttributeDto) {
		await this.ensureAttributeExists(id);

		try {
			const attribute = await this.prisma.attribute.update({
				where: { id },
				data: {
					name: dto.name,
					description: this.toOptionalNullableString(dto.description),
					sortOrder: dto.sortOrder
				}
			});

			return this.mapAttribute(attribute);
		} catch (error) {
			this.rethrowPrismaError(error, 'Failed to update attribute.');
		}
	}

	async updateAttributeActive(id: string, dto: UpdateAttributeActiveDto) {
		await this.ensureAttributeExists(id);

		const attribute = await this.prisma.attribute.update({
			where: { id },
			data: { isActive: dto.isActive }
		});

		return this.mapAttribute(attribute);
	}

	async deleteAttribute(id: string) {
		await this.ensureAttributeExists(id);

		await this.prisma.$transaction([
			this.prisma.characteristic.deleteMany({
				where: { attributeId: id }
			}),
			this.prisma.attribute.delete({
				where: { id }
			})
		]);
	}

	async createCharacteristic(dto: CreateCharacteristicDto) {
		await this.ensureAttributeExists(dto.attributeId);
		this.validateCharacteristicRange(dto.minValue, dto.maxValue, dto.defaultValue);

		try {
			const characteristic = await this.prisma.characteristic.create({
				data: {
					name: dto.name,
					attributeId: dto.attributeId,
					description: this.toNullableString(dto.description) ?? null,
					minValue: dto.minValue,
					maxValue: dto.maxValue,
					defaultValue: dto.defaultValue,
					sortOrder: dto.sortOrder
				}
			});

			return this.mapCharacteristic(characteristic);
		} catch (error) {
			this.rethrowPrismaError(error, 'Failed to create characteristic.');
		}
	}

	async updateCharacteristic(id: string, dto: UpdateCharacteristicDto) {
		const currentCharacteristic =
			await this.prisma.characteristic.findUniqueOrThrow({
				where: { id }
			});

		if (dto.attributeId) {
			await this.ensureAttributeExists(dto.attributeId);
		}

		this.validateCharacteristicRange(
			dto.minValue ?? currentCharacteristic.minValue,
			dto.maxValue ?? currentCharacteristic.maxValue,
			dto.defaultValue ?? currentCharacteristic.defaultValue
		);

		try {
			const characteristic = await this.prisma.characteristic.update({
				where: { id },
				data: {
					name: dto.name,
					attributeId: dto.attributeId,
					description: this.toOptionalNullableString(dto.description),
					minValue: dto.minValue,
					maxValue: dto.maxValue,
					defaultValue: dto.defaultValue,
					sortOrder: dto.sortOrder
				}
			});

			return this.mapCharacteristic(characteristic);
		} catch (error) {
			this.rethrowPrismaError(error, 'Failed to update characteristic.');
		}
	}

	async updateCharacteristicActive(
		id: string,
		dto: UpdateCharacteristicActiveDto
	) {
		await this.ensureCharacteristicExists(id);

		const characteristic = await this.prisma.characteristic.update({
			where: { id },
			data: { isActive: dto.isActive }
		});

		return this.mapCharacteristic(characteristic);
	}

	async deleteCharacteristic(id: string) {
		await this.ensureCharacteristicExists(id);
		await this.prisma.characteristic.delete({ where: { id } });
	}

	private async ensureAttributeExists(id: string) {
		const attribute = await this.prisma.attribute.findUnique({ where: { id } });

		if (!attribute) {
			throw new NotFoundException('Attribute not found.');
		}
	}

	private async ensureCharacteristicExists(id: string) {
		const characteristic = await this.prisma.characteristic.findUnique({
			where: { id }
		});

		if (!characteristic) {
			throw new NotFoundException('Characteristic not found.');
		}
	}

	private validateCharacteristicRange(
		minValue: number,
		maxValue: number,
		defaultValue: number
	) {
		if (minValue > maxValue) {
			throw new BadRequestException(
				'Minimum value cannot be greater than maximum value.'
			);
		}

		if (defaultValue < minValue || defaultValue > maxValue) {
			throw new BadRequestException(
				'Default value must be within the configured range.'
			);
		}
	}

	private toNullableString(value?: string | null) {
		if (value === undefined || value === null) {
			return null;
		}

		const normalized = value.trim();
		return normalized ? normalized : null;
	}

	private toOptionalNullableString(value?: string | null) {
		if (value === undefined) {
			return undefined;
		}

		return this.toNullableString(value);
	}

	private rethrowPrismaError(error: unknown, fallbackMessage: string): never {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === 'P2002'
		) {
			throw new BadRequestException('Value must be unique.');
		}

		throw error instanceof Error
			? error
			: new BadRequestException(fallbackMessage);
	}

	private mapAttribute(attribute: {
		id: string;
		name: string;
		description: string | null;
		isActive: boolean;
		sortOrder: number;
		createdAt: Date;
		updatedAt: Date;
	}) {
		return {
			id: attribute.id,
			name: attribute.name,
			description: attribute.description ?? '',
			isActive: attribute.isActive,
			sortOrder: attribute.sortOrder,
			createdAt: attribute.createdAt.toISOString(),
			updatedAt: attribute.updatedAt.toISOString()
		};
	}

	private mapCharacteristic(characteristic: {
		id: string;
		name: string;
		attributeId: string;
		description: string | null;
		minValue: number;
		maxValue: number;
		defaultValue: number;
		isActive: boolean;
		sortOrder: number;
		createdAt: Date;
		updatedAt: Date;
	}) {
		return {
			id: characteristic.id,
			name: characteristic.name,
			attributeId: characteristic.attributeId,
			description: characteristic.description ?? '',
			minValue: characteristic.minValue,
			maxValue: characteristic.maxValue,
			defaultValue: characteristic.defaultValue,
			isActive: characteristic.isActive,
			sortOrder: characteristic.sortOrder,
			createdAt: characteristic.createdAt.toISOString(),
			updatedAt: characteristic.updatedAt.toISOString()
		};
	}
}
