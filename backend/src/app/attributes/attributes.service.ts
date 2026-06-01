import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
	Prisma,
	SystemValueOwnerType
} from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { CreateCharacteristicDto } from './dto/create-characteristic.dto';
import { UpdateAttributeActiveDto } from './dto/update-attribute-active.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { UpdateCharacteristicActiveDto } from './dto/update-characteristic-active.dto';
import { UpdateCharacteristicDto } from './dto/update-characteristic.dto';

const attributeSelect = {
	id: true,
	name: true,
	description: true,
	systemValue: {
		select: {
			id: true,
			calculationGraph: true
		}
	},
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.AttributeSelect;

const characteristicSelect = {
	id: true,
	name: true,
	attributeId: true,
	description: true,
	minValue: true,
	maxValue: true,
	defaultValue: true,
	systemValue: {
		select: {
			id: true,
			calculationGraph: true
		}
	},
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.CharacteristicSelect;

@Injectable()
export class AttributesService {
	constructor(private readonly prisma: PrismaService) {}

	async getAdminCatalog() {
		const [attributes, characteristics] = await Promise.all([
			this.prisma.attribute.findMany({
				select: attributeSelect,
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.characteristic.findMany({
				select: characteristicSelect,
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
			const attribute = await this.prisma.$transaction(async tx => {
				const id = randomUUID();
				const description = this.toNullableString(dto.description) ?? null;

				await tx.systemValue.create({
					data: {
						id,
						name: dto.name,
						description,
						primaryOwnerType: SystemValueOwnerType.ATTRIBUTE,
						primaryOwnerId: id,
						calculationGraph: createCharacterInputGraph(),
						sortOrder: dto.sortOrder,
						links: {
							create: {
								id,
								targetType: SystemValueOwnerType.ATTRIBUTE,
								targetId: id,
								sortOrder: dto.sortOrder
							}
						}
					}
				});

				return tx.attribute.create({
					select: attributeSelect,
					data: {
						id,
						name: dto.name,
						description,
						sortOrder: dto.sortOrder,
						systemValueId: id
					}
				});
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
				select: attributeSelect,
				where: { id },
				data: {
					name: dto.name,
					description: this.toOptionalNullableString(dto.description),
					sortOrder: dto.sortOrder,
					systemValue: {
						update: {
							name: dto.name,
							description: this.toOptionalNullableString(dto.description),
							sortOrder: dto.sortOrder
						}
					}
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
			select: attributeSelect,
			where: { id },
			data: {
				isActive: dto.isActive,
				systemValue: {
					update: {
						isActive: dto.isActive
					}
				}
			}
		});

		return this.mapAttribute(attribute);
	}

	async deleteAttribute(id: string) {
		await this.ensureAttributeExists(id);
		const characteristicIds = (
			await this.prisma.characteristic.findMany({
				select: { id: true },
				where: { attributeId: id }
			})
		).map(characteristic => characteristic.id);

		await this.prisma.$transaction([
			this.prisma.characteristic.deleteMany({
				where: { attributeId: id }
			}),
			this.prisma.attribute.delete({
				where: { id }
			}),
			this.prisma.systemValue.deleteMany({
				where: {
					primaryOwnerType: SystemValueOwnerType.CHARACTERISTIC,
					primaryOwnerId: { in: characteristicIds }
				}
			}),
			this.prisma.systemValue.deleteMany({
				where: {
					primaryOwnerType: SystemValueOwnerType.ATTRIBUTE,
					primaryOwnerId: id
				}
			})
		]);
	}

	async createCharacteristic(dto: CreateCharacteristicDto) {
		await this.ensureAttributeExists(dto.attributeId);
		this.validateCharacteristicRange(dto.minValue, dto.maxValue, dto.defaultValue);

		try {
			const characteristic = await this.prisma.$transaction(async tx => {
				const id = randomUUID();
				const description = this.toNullableString(dto.description) ?? null;

				await tx.systemValue.create({
					data: {
						id,
						name: dto.name,
						description,
						primaryOwnerType: SystemValueOwnerType.CHARACTERISTIC,
						primaryOwnerId: id,
						calculationGraph: createCharacterInputGraph(),
						sortOrder: dto.sortOrder,
						links: {
							create: {
								id,
								targetType: SystemValueOwnerType.CHARACTERISTIC,
								targetId: id,
								sortOrder: dto.sortOrder
							}
						}
					}
				});

				return tx.characteristic.create({
					select: characteristicSelect,
					data: {
						id,
						name: dto.name,
						attributeId: dto.attributeId,
						description,
						minValue: dto.minValue,
						maxValue: dto.maxValue,
						defaultValue: dto.defaultValue,
						sortOrder: dto.sortOrder,
						systemValueId: id
					}
				});
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
			const characteristic = await this.prisma.$transaction(async tx => {
				const updatedCharacteristic = await tx.characteristic.update({
					select: characteristicSelect,
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

				if (updatedCharacteristic.systemValue) {
					await tx.systemValue.update({
						where: { id: updatedCharacteristic.systemValue.id },
						data: {
							name: updatedCharacteristic.name,
							description: updatedCharacteristic.description,
							sortOrder: updatedCharacteristic.sortOrder
						}
					});
				}

				return updatedCharacteristic;
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
			select: characteristicSelect,
			where: { id },
			data: {
				isActive: dto.isActive,
				systemValue: {
					update: {
						isActive: dto.isActive
					}
				}
			}
		});

		return this.mapCharacteristic(characteristic);
	}

	async deleteCharacteristic(id: string) {
		await this.ensureCharacteristicExists(id);
		await this.prisma.$transaction([
			this.prisma.characteristic.delete({ where: { id } }),
			this.prisma.systemValue.deleteMany({
				where: {
					primaryOwnerType: SystemValueOwnerType.CHARACTERISTIC,
					primaryOwnerId: id
				}
			})
		]);
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
		systemValue: {
			id: string;
			calculationGraph: Prisma.JsonValue | null;
		};
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
			updatedAt: attribute.updatedAt.toISOString(),
			systemValue: this.mapSystemValue(attribute)
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
		systemValue: {
			id: string;
			calculationGraph: Prisma.JsonValue | null;
		};
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
			updatedAt: characteristic.updatedAt.toISOString(),
			systemValue: this.mapSystemValue(characteristic)
		};
	}

	private mapSystemValue(value: {
		id: string;
		systemValue: {
			id: string;
			calculationGraph: Prisma.JsonValue | null;
		};
	}) {
		const systemValue = value.systemValue;

		return {
			id: systemValue.id,
			calculationGraph: systemValue.calculationGraph
		};
	}
}

function createCharacterInputGraph() {
	return {
		nodes: [
			{ id: 'character-input', kind: 'characterInput', x: 120, y: 120 },
			{ id: 'result', kind: 'result', x: 420, y: 120 }
		],
		edges: [
			{
				id: 'character-input:out -> result:in',
				source: 'character-input',
				target: 'result',
				sourceHandle: 'out',
				targetHandle: 'in'
			}
		]
	};
}
