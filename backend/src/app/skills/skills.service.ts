import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
	Prisma,
	SystemValueBaseSourceType,
	SystemValueOwnerType
} from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillCategoryDto } from './dto/create-skill-category.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillCategoryActiveDto } from './dto/update-skill-category-active.dto';
import { UpdateSkillCategoryDto } from './dto/update-skill-category.dto';
import { UpdateSkillActiveDto } from './dto/update-skill-active.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { UpdateSkillLevelActiveDto } from './dto/update-skill-level-active.dto';
import { UpdateSkillLevelDto } from './dto/update-skill-level.dto';

const D6_SIDES_COUNT = 6;
const skillSelect = {
	id: true,
	name: true,
	categoryId: true,
	description: true,
	defaultLevel: true,
	maxLevel: true,
	usesDefaultLevelRules: true,
	systemValue: {
		select: {
			id: true,
			baseSourceType: true,
			calculationGraph: true
		}
	},
	isActive: true
} satisfies Prisma.SkillSelect;

@Injectable()
export class SkillsService {
	constructor(private readonly prisma: PrismaService) {}

	async getAdminCatalog() {
		const [categories, skills, levels] = await Promise.all([
			this.prisma.skillCategory.findMany({
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.skill.findMany({
				select: skillSelect,
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.skillLevel.findMany({
				orderBy: [{ level: 'asc' }]
			})
		]);

		return {
			categories: categories.map(category => ({
				id: category.id,
				name: category.name,
				description: category.description ?? '',
				isActive: category.isActive
			})),
			skills: skills.map(skill => ({
				id: skill.id,
				name: skill.name,
				categoryId: skill.categoryId,
				description: skill.description ?? '',
				defaultLevel: skill.defaultLevel,
				maxLevel: skill.maxLevel,
				usesDefaultLevelRules: skill.usesDefaultLevelRules,
				isActive: skill.isActive,
				systemValue: this.mapSystemValue(skill)
			})),
			levels: levels.map(level => ({
				id: level.id,
				level: level.level,
				name: level.name,
				canRoll: level.canRoll,
				successMin: level.successMin,
				doubleSuccessMin: level.doubleSuccessMin,
				ignoreOnesCount: level.ignoreOnesCount,
				expectedSuccessPerDie: Number(level.expectedSuccessPerDie),
				ruleText: level.ruleText ?? '',
				isActive: level.isActive
			}))
		};
	}

	async getCategories() {
		const categories = await this.prisma.skillCategory.findMany({
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		});

		return categories.map(category => this.mapCategory(category));
	}

	async getSkill(id: string) {
		const skill = await this.prisma.skill.findUnique({
			select: skillSelect,
			where: { id }
		});

		if (!skill) {
			throw new NotFoundException('Навык не найден.');
		}

		return this.mapSkill(skill);
	}

	async createSkill(dto: CreateSkillDto) {
		await this.ensureCategoryExists(dto.categoryId);
		this.validateSkillLevels(dto.defaultLevel, dto.maxLevel);

		try {
			const skill = await this.prisma.$transaction(async tx => {
				const id = randomUUID();
				const description = dto.description || null;

				await tx.systemValue.create({
					data: {
						id,
						name: dto.name,
						description,
						primaryOwnerType: SystemValueOwnerType.SKILL,
						primaryOwnerId: id,
						baseSourceType: SystemValueBaseSourceType.CHARACTER_INPUT,
						links: {
							create: {
								id,
								targetType: SystemValueOwnerType.SKILL,
								targetId: id
							}
						}
					}
				});

				return tx.skill.create({
					select: skillSelect,
					data: {
						id,
						name: dto.name,
						categoryId: dto.categoryId,
						description,
						defaultLevel: dto.defaultLevel,
						maxLevel: dto.maxLevel,
						usesDefaultLevelRules: dto.usesDefaultLevelRules,
						systemValueId: id
					}
				});
			});

			return this.mapSkill(skill);
		} catch (error) {
			this.rethrowPrismaError(error, 'Не удалось создать навык.');
		}
	}

	async updateSkill(id: string, dto: UpdateSkillDto) {
		await this.ensureSkillExists(id);

		if (dto.categoryId) {
			await this.ensureCategoryExists(dto.categoryId);
		}

		const currentSkill = await this.prisma.skill.findUnique({ where: { id } });

		if (!currentSkill) {
			throw new NotFoundException('Навык не найден.');
		}

		this.validateSkillLevels(
			dto.defaultLevel ?? currentSkill.defaultLevel,
			dto.maxLevel ?? currentSkill.maxLevel
		);

		try {
			const skill = await this.prisma.$transaction(async tx => {
				const updatedSkill = await tx.skill.update({
					select: skillSelect,
					where: { id },
					data: {
						name: dto.name,
						categoryId: dto.categoryId,
						description:
							dto.description === undefined ? undefined : dto.description || null,
						defaultLevel: dto.defaultLevel,
						maxLevel: dto.maxLevel,
						usesDefaultLevelRules: dto.usesDefaultLevelRules
					}
				});

				if (updatedSkill.systemValue) {
					await tx.systemValue.update({
						where: { id: updatedSkill.systemValue.id },
						data: {
							name: updatedSkill.name,
							description: updatedSkill.description
						}
					});
				}

				return updatedSkill;
			});

			return this.mapSkill(skill);
		} catch (error) {
			this.rethrowPrismaError(error, 'Не удалось обновить навык.');
		}
	}

	async updateSkillActive(id: string, dto: UpdateSkillActiveDto) {
		await this.ensureSkillExists(id);

		const skill = await this.prisma.skill.update({
			select: skillSelect,
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

		return this.mapSkill(skill);
	}

	async deleteSkill(id: string) {
		await this.ensureSkillExists(id);
		await this.prisma.$transaction([
			this.prisma.skill.delete({ where: { id } }),
			this.prisma.systemValue.deleteMany({
				where: {
					primaryOwnerType: SystemValueOwnerType.SKILL,
					primaryOwnerId: id
				}
			})
		]);
	}

	async createCategory(dto: CreateSkillCategoryDto) {
		try {
			const category = await this.prisma.skillCategory.create({
				data: {
					name: dto.name,
					description: dto.description || null
				}
			});

			return this.mapCategory(category);
		} catch (error) {
			this.rethrowPrismaError(error, 'Не удалось создать категорию.');
		}
	}

	async updateCategory(id: string, dto: UpdateSkillCategoryDto) {
		await this.ensureCategoryExists(id);

		try {
			const category = await this.prisma.skillCategory.update({
				where: { id },
				data: {
					name: dto.name,
					description: dto.description === undefined ? undefined : dto.description || null
				}
			});

			return this.mapCategory(category);
		} catch (error) {
			this.rethrowPrismaError(error, 'Не удалось обновить категорию.');
		}
	}

	async updateCategoryActive(id: string, dto: UpdateSkillCategoryActiveDto) {
		await this.ensureCategoryExists(id);

		const category = await this.prisma.skillCategory.update({
			where: { id },
			data: { isActive: dto.isActive }
		});

		return this.mapCategory(category);
	}

	async deleteCategory(id: string) {
		await this.ensureCategoryExists(id);
		const skillIds = (
			await this.prisma.skill.findMany({
				select: { id: true },
				where: { categoryId: id }
			})
		).map(skill => skill.id);

		await this.prisma.$transaction([
			this.prisma.skill.deleteMany({
				where: { categoryId: id }
			}),
			this.prisma.systemValue.deleteMany({
				where: {
					primaryOwnerType: SystemValueOwnerType.SKILL,
					primaryOwnerId: { in: skillIds }
				}
			}),
			this.prisma.skillCategory.delete({
				where: { id }
			})
		]);
	}

	async updateLevel(id: string, dto: UpdateSkillLevelDto) {
		await this.ensureLevelExists(id);
		const currentLevel = await this.prisma.skillLevel.findUniqueOrThrow({
			where: { id }
		});
		const canRoll = dto.canRoll ?? currentLevel.canRoll;
		const successMin =
			dto.successMin === undefined ? currentLevel.successMin : dto.successMin;
		const doubleSuccessMin =
			dto.doubleSuccessMin === undefined
				? currentLevel.doubleSuccessMin
				: dto.doubleSuccessMin;

		const level = await this.prisma.skillLevel.update({
			where: { id },
			data: {
				name: dto.name,
				canRoll,
				successMin,
				doubleSuccessMin,
				ignoreOnesCount: dto.ignoreOnesCount,
				expectedSuccessPerDie: new Prisma.Decimal(
					this.calculateExpectedSuccessPerDie({
						canRoll,
						successMin,
						doubleSuccessMin
					})
				),
				ruleText: dto.ruleText === undefined ? undefined : dto.ruleText || null
			}
		});

		return this.mapLevel(level);
	}

	async updateLevelActive(id: string, dto: UpdateSkillLevelActiveDto) {
		await this.ensureLevelExists(id);

		const level = await this.prisma.skillLevel.update({
			where: { id },
			data: { isActive: dto.isActive }
		});

		return this.mapLevel(level);
	}

	async deleteLevel(id: string) {
		await this.ensureLevelExists(id);
		await this.prisma.skillLevel.delete({ where: { id } });
	}

	private async ensureCategoryExists(id: string) {
		const category = await this.prisma.skillCategory.findUnique({ where: { id } });

		if (!category) {
			throw new NotFoundException('Категория навыка не найдена.');
		}
	}

	private async ensureSkillExists(id: string) {
		const skill = await this.prisma.skill.findUnique({ where: { id } });

		if (!skill) {
			throw new NotFoundException('Навык не найден.');
		}
	}

	private async ensureLevelExists(id: string) {
		const level = await this.prisma.skillLevel.findUnique({ where: { id } });

		if (!level) {
			throw new NotFoundException('Уровень навыка не найден.');
		}
	}

	private validateSkillLevels(defaultLevel: number, maxLevel: number) {
		if (defaultLevel > maxLevel) {
			throw new BadRequestException(
				'Начальный уровень навыка не может быть выше максимального.'
			);
		}
	}

	private rethrowPrismaError(error: unknown, fallbackMessage: string): never {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === 'P2002'
		) {
			throw new BadRequestException('Значение должно быть уникальным.');
		}

		throw error instanceof Error
			? error
			: new BadRequestException(fallbackMessage);
	}

	private calculateExpectedSuccessPerDie(params: {
		canRoll: boolean;
		successMin: number | null;
		doubleSuccessMin: number | null;
	}) {
		if (!params.canRoll || params.successMin === null) {
			return 0;
		}

		let totalSuccesses = 0;

		for (let face = 1; face <= D6_SIDES_COUNT; face += 1) {
			if (face >= params.successMin) {
				totalSuccesses += 1;
			}

			if (
				params.doubleSuccessMin !== null &&
				face >= params.doubleSuccessMin
			) {
				totalSuccesses += 1;
			}
		}

		return Number((totalSuccesses / D6_SIDES_COUNT).toFixed(4));
	}

	private mapSkill(skill: {
		id: string;
		name: string;
		categoryId: string;
		description: string | null;
		defaultLevel: number;
		maxLevel: number;
		usesDefaultLevelRules: boolean;
		systemValue: {
			id: string;
			baseSourceType: SystemValueBaseSourceType;
			calculationGraph: Prisma.JsonValue | null;
		};
		isActive: boolean;
	}) {
		return {
			id: skill.id,
			name: skill.name,
			categoryId: skill.categoryId,
			description: skill.description ?? '',
			defaultLevel: skill.defaultLevel,
			maxLevel: skill.maxLevel,
			usesDefaultLevelRules: skill.usesDefaultLevelRules,
			isActive: skill.isActive,
			systemValue: this.mapSystemValue(skill)
		};
	}

	private mapSystemValue(skill: {
		id: string;
		systemValue: {
			id: string;
			baseSourceType: SystemValueBaseSourceType;
			calculationGraph: Prisma.JsonValue | null;
		};
	}) {
		const systemValue = skill.systemValue;

		return {
			id: systemValue.id,
			baseSourceType: systemValue.baseSourceType,
			calculationGraph: systemValue.calculationGraph
		};
	}

	private mapCategory(category: {
		id: string;
		name: string;
		description: string | null;
		isActive: boolean;
	}) {
		return {
			id: category.id,
			name: category.name,
			description: category.description ?? '',
			isActive: category.isActive
		};
	}

	private mapLevel(level: {
		id: string;
		level: number;
		name: string;
		canRoll: boolean;
		successMin: number | null;
		doubleSuccessMin: number | null;
		ignoreOnesCount: number;
		expectedSuccessPerDie: Prisma.Decimal;
		ruleText: string | null;
		isActive: boolean;
	}) {
		return {
			id: level.id,
			level: level.level,
			name: level.name,
			canRoll: level.canRoll,
			successMin: level.successMin,
			doubleSuccessMin: level.doubleSuccessMin,
			ignoreOnesCount: level.ignoreOnesCount,
			expectedSuccessPerDie: Number(level.expectedSuccessPerDie),
			ruleText: level.ruleText ?? '',
			isActive: level.isActive
		};
	}
}
