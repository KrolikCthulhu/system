import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import {
	AreaShapeKind,
	MagicWordType,
	Prisma,
	SpellStatus
} from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { createSlug } from '../shared/slug.util';
import { CreateMagicWordDto } from './dto/create-magic-word.dto';
import { UpdateMagicWordDto } from './dto/update-magic-word.dto';
import {
	SaveSpellDto,
	SaveSpellMechanicBlockDto
} from './dto/save-spell.dto';

const magicWordSelect = {
	id: true,
	type: true,
	slug: true,
	name: true,
	description: true,
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true,
	modifierGestureRestrictions: {
		select: {
			gestureId: true,
			gesture: {
				select: {
					id: true,
					slug: true,
					name: true,
					sortOrder: true
				}
			}
		}
	},
	skillLinks: {
		select: {
			skillId: true,
			skill: {
				select: {
							id: true,
							slug: true,
							name: true,
					category: {
						select: {
							name: true
						}
					},
					sortOrder: true
				}
			}
		}
	},
	damageTypeLinks: {
		select: {
			damageTypeId: true,
			damageType: {
				select: {
					id: true,
					slug: true,
					name: true,
					sortOrder: true
				}
			}
		}
	},
	conditionLinks: {
		select: {
			conditionId: true,
			condition: {
				select: {
					id: true,
					slug: true,
					name: true,
					sortOrder: true
				}
			}
		}
	},
	essenceProfile: {
		select: {
			damageAffinity: true,
			rangeAffinity: true,
			controlAffinity: true,
			durationAffinity: true,
			areaAffinity: true,
			stabilityAffinity: true
		}
	},
	areaShape: {
		select: {
			kind: true,
			name: true,
			description: true,
			dimensions: true,
			influenceConfig: true,
			isActive: true,
			sortOrder: true
		}
	}
} satisfies Prisma.MagicWordSelect;

type MagicWordRecord = Prisma.MagicWordGetPayload<{
	select: typeof magicWordSelect;
}>;

const spellSelect = {
	id: true,
	actionId: true,
	essenceId: true,
	gestureId: true,
	name: true,
	description: true,
	config: true,
	targetConfigs: true,
	textBlocks: true,
	status: true,
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true,
	action: { select: { id: true, slug: true, name: true, sortOrder: true } },
	essence: { select: { id: true, slug: true, name: true, sortOrder: true } },
	gesture: { select: { id: true, slug: true, name: true, sortOrder: true } },
	mechanicBlocks: {
		select: {
			id: true,
			mechanicId: true,
			parameterValues: true,
			config: true,
			isActive: true,
			sortOrder: true,
			createdAt: true,
			updatedAt: true
		},
		orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
	}
} satisfies Prisma.SpellSelect;

type SpellRecord = Prisma.SpellGetPayload<{ select: typeof spellSelect }>;

@Injectable()
export class MagicService {
	constructor(private readonly prisma: PrismaService) {}

	async getWords() {
		const words = await this.prisma.magicWord.findMany({
			select: magicWordSelect,
			orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }]
		});

		return { words: words.map(word => this.mapWord(word)) };
	}

	async getSpellFormulas() {
		const [actions, essences] = await Promise.all([
			this.prisma.magicWord.findMany({
				select: { id: true, slug: true, name: true, sortOrder: true },
				where: { type: MagicWordType.ACTION, isActive: true },
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.magicWord.findMany({
				select: { id: true, slug: true, name: true, sortOrder: true },
				where: { type: MagicWordType.ESSENCE, isActive: true },
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			})
		]);

		return {
			formulas: actions.flatMap(action =>
				essences.map(essence => ({
					actionId: action.id,
					actionSlug: action.slug,
					actionName: action.name,
					essenceId: essence.id,
					essenceSlug: essence.slug,
					essenceName: essence.name,
					name: `${action.name} ${essence.name}`
				}))
			)
		};
	}

	async getSpellCatalog() {
		const [actions, essences, gestures, spells] = await Promise.all([
			this.loadActiveWords(MagicWordType.ACTION),
			this.loadActiveWords(MagicWordType.ESSENCE),
			this.loadActiveWords(MagicWordType.GESTURE),
			this.prisma.spell.findMany({
				select: spellSelect,
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			})
		]);
		const spellsByFormula = new Map(
			spells.map(spell => [formulaKey(spell.actionId, spell.essenceId, spell.gestureId), spell])
		);
		const groups = actions.flatMap(action =>
			essences.map(essence => {
				const formulas = gestures.map(gesture => {
					const key = formulaKey(action.id, essence.id, gesture.id);
					const spell = spellsByFormula.get(key) ?? null;

					return {
						key,
						action,
						essence,
						gesture,
						status: spell?.status ?? 'EMPTY',
						isActive: spell?.isActive ?? false,
						spell: spell ? this.mapSpell(spell) : null
					};
				});

				return {
					key: `${action.id}:${essence.id}`,
					action,
					essence,
					label: `${action.name} + ${essence.name}`,
					formulas
				};
			})
		);

		return { groups };
	}

	async createSpell(dto: SaveSpellDto) {
		if (!dto.actionId || !dto.essenceId || !dto.gestureId) {
			throw new BadRequestException('Формула заклинания обязательна.');
		}

		await this.assertSpellFormula(dto.actionId, dto.essenceId, dto.gestureId);

		try {
			const spellId = await this.prisma.$transaction(async tx => {
				const created = await tx.spell.create({
					select: { id: true },
					data: {
						actionId: dto.actionId,
						essenceId: dto.essenceId,
						gestureId: dto.gestureId,
						name: dto.name.trim(),
						description: dto.description?.trim() || null,
						config: toJsonObject(dto.config),
						targetConfigs: toJsonArray(dto.targetConfigs),
						textBlocks: toJsonArray(dto.textBlocks),
						status: dto.status,
						isActive: normalizeSpellActive(dto.status, dto.isActive),
						sortOrder: dto.sortOrder ?? 0
					}
				});

				await this.syncSpellMechanicBlocks(
					tx,
					created.id,
					dto.mechanicBlocks ?? []
				);

				return created.id;
			});
			const spell = await this.prisma.spell.findUniqueOrThrow({
				select: spellSelect,
				where: { id: spellId }
			});

			return this.mapSpell(spell);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать заклинание.', {
				uniqueMessage: 'Заклинание с такой формулой уже существует.'
			});
		}
	}

	async updateSpell(id: string, dto: SaveSpellDto) {
		const existing = await this.prisma.spell.findUnique({
			select: { id: true, status: true, isActive: true },
			where: { id }
		});

		if (!existing) {
			throw new NotFoundException('Заклинание не найдено.');
		}

		try {
			await this.prisma.$transaction(async tx => {
				await tx.spell.update({
					select: { id: true },
					where: { id },
					data: {
						name: dto.name.trim(),
						description: dto.description?.trim() || null,
						config:
							dto.config === undefined
								? undefined
								: toJsonObject(dto.config),
						targetConfigs:
							dto.targetConfigs === undefined
								? undefined
								: toJsonArray(dto.targetConfigs),
						textBlocks:
							dto.textBlocks === undefined
								? undefined
								: toJsonArray(dto.textBlocks),
						status: dto.status,
						isActive: normalizeSpellActive(dto.status, dto.isActive, existing),
						sortOrder: dto.sortOrder ?? 0
					}
				});

				if (dto.mechanicBlocks !== undefined) {
					await this.syncSpellMechanicBlocks(tx, id, dto.mechanicBlocks);
				}
			});
			const spell = await this.prisma.spell.findUniqueOrThrow({
				select: spellSelect,
				where: { id }
			});

			return this.mapSpell(spell);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить заклинание.');
		}
	}

	async deleteSpell(id: string) {
		const existing = await this.prisma.spell.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!existing) {
			throw new NotFoundException('Заклинание не найдено.');
		}

		await this.prisma.spell.delete({ where: { id } });
	}

	async createWord(dto: CreateMagicWordDto) {
		const allowedGestureIds = dto.allowedGestureIds ?? [];
		const skillIds = dto.skillIds ?? [];
		const damageTypeIds = dto.damageTypeIds ?? [];
		const conditionIds = dto.conditionIds ?? [];
		await this.assertAllowedGestureIds(dto.type, allowedGestureIds);
		await Promise.all([
			this.assertSkillIds(skillIds),
			this.assertDamageTypeIds(damageTypeIds),
			this.assertConditionIds(conditionIds)
		]);

		try {
			const wordId = await this.prisma.$transaction(async tx => {
				const created = await tx.magicWord.create({
					select: { id: true },
					data: {
						type: dto.type,
						slug: createSlug(dto.name),
						name: dto.name.trim(),
						description: dto.description?.trim() || null,
						isActive: dto.isActive ?? true,
						sortOrder: dto.sortOrder ?? 0
					}
				});

				await this.syncGestureRestrictions(
					tx,
					created.id,
					dto.type,
					allowedGestureIds
				);
				await this.syncWordLinks(tx, created.id, {
					skillIds,
					damageTypeIds,
					conditionIds
				});
				await this.syncEssenceProfile(
					tx,
					created.id,
					dto.type,
					dto.essenceProfile
				);
				await this.syncAreaShape(
					tx,
					created.id,
					dto.type,
					dto.areaShape
				);

				return created.id;
			});
			const word = await this.prisma.magicWord.findUniqueOrThrow({
				select: magicWordSelect,
				where: { id: wordId }
			});

			return this.mapWord(word);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать слово магии.', {
				uniqueMessage: 'Слово магии с таким типом и названием уже существует.'
			});
		}
	}

	async updateWord(id: string, dto: UpdateMagicWordDto) {
		const existing = await this.prisma.magicWord.findUnique({
			select: { id: true, type: true },
			where: { id }
		});

		if (!existing) {
			throw new NotFoundException('Слово магии не найдено.');
		}

		const nextType = dto.type ?? existing.type;
		const allowedGestureIds = dto.allowedGestureIds ?? [];

		if (dto.allowedGestureIds !== undefined) {
			await this.assertAllowedGestureIds(nextType, allowedGestureIds);
		}
		await Promise.all([
			dto.skillIds === undefined ? Promise.resolve() : this.assertSkillIds(dto.skillIds),
			dto.damageTypeIds === undefined
				? Promise.resolve()
				: this.assertDamageTypeIds(dto.damageTypeIds),
			dto.conditionIds === undefined
				? Promise.resolve()
				: this.assertConditionIds(dto.conditionIds)
		]);

		try {
			await this.prisma.$transaction(async tx => {
				await tx.magicWord.update({
					where: { id },
					data: {
						type: dto.type,
						name: dto.name === undefined ? undefined : dto.name.trim(),
						description:
							dto.description === undefined
								? undefined
								: dto.description.trim() || null,
						isActive: dto.isActive,
						sortOrder: dto.sortOrder
					}
				});

				if (dto.type !== undefined || dto.allowedGestureIds !== undefined) {
					await this.syncGestureRestrictions(
						tx,
						id,
						nextType,
						dto.allowedGestureIds ?? []
					);
				}
				if (
					dto.skillIds !== undefined ||
					dto.damageTypeIds !== undefined ||
					dto.conditionIds !== undefined
				) {
					await this.syncWordLinks(tx, id, {
						skillIds: dto.skillIds,
						damageTypeIds: dto.damageTypeIds,
						conditionIds: dto.conditionIds
					});
				}
				if (dto.type !== undefined || dto.essenceProfile !== undefined) {
					await this.syncEssenceProfile(
						tx,
						id,
						nextType,
						dto.essenceProfile
					);
				}
				if (dto.type !== undefined || dto.areaShape !== undefined) {
					await this.syncAreaShape(tx, id, nextType, dto.areaShape);
				}
			});
			const word = await this.prisma.magicWord.findUniqueOrThrow({
				select: magicWordSelect,
				where: { id }
			});

			return this.mapWord(word);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить слово магии.', {
				uniqueMessage: 'Слово магии с таким типом и названием уже существует.'
			});
		}
	}

	async deleteWord(id: string) {
		const existing = await this.prisma.magicWord.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!existing) {
			throw new NotFoundException('Слово магии не найдено.');
		}

		await this.prisma.magicWord.delete({ where: { id } });
	}

	private async assertAllowedGestureIds(
		type: MagicWordType,
		allowedGestureIds: string[]
	) {
		if (type !== MagicWordType.MODIFIER && allowedGestureIds.length) {
			throw new BadRequestException(
				'Ограничения по жестам можно задавать только для модификаторов.'
			);
		}

		if (!allowedGestureIds.length) {
			return;
		}

		const gestures = await this.prisma.magicWord.findMany({
			select: { id: true },
			where: {
				id: { in: allowedGestureIds },
				type: MagicWordType.GESTURE
			}
		});

		if (gestures.length !== allowedGestureIds.length) {
			throw new BadRequestException(
				'Все ограничения модификатора должны ссылаться на жесты.'
			);
		}
	}

	private async assertSkillIds(skillIds: string[]) {
		if (!skillIds.length) {
			return;
		}

		const skills = await this.prisma.skill.findMany({
			select: { id: true },
			where: { id: { in: skillIds } }
		});

		if (skills.length !== skillIds.length) {
			throw new BadRequestException(
				'Все связи слова магии должны ссылаться на существующие навыки.'
			);
		}
	}

	private async assertDamageTypeIds(damageTypeIds: string[]) {
		if (!damageTypeIds.length) {
			return;
		}

		const damageTypes = await this.prisma.damageType.findMany({
			select: { id: true },
			where: { id: { in: damageTypeIds } }
		});

		if (damageTypes.length !== damageTypeIds.length) {
			throw new BadRequestException(
				'Все связи слова магии должны ссылаться на существующие типы урона.'
			);
		}
	}

	private async assertConditionIds(conditionIds: string[]) {
		if (!conditionIds.length) {
			return;
		}

		const conditions = await this.prisma.condition.findMany({
			select: { id: true },
			where: { id: { in: conditionIds } }
		});

		if (conditions.length !== conditionIds.length) {
			throw new BadRequestException(
				'Все связи слова магии должны ссылаться на существующие состояния.'
			);
		}
	}

	private async syncGestureRestrictions(
		tx: Prisma.TransactionClient,
		modifierId: string,
		type: MagicWordType,
		allowedGestureIds: string[]
	) {
		await tx.magicWordGestureRestriction.deleteMany({
			where: { modifierId }
		});

		if (type !== MagicWordType.MODIFIER || !allowedGestureIds.length) {
			return;
		}

		await tx.magicWordGestureRestriction.createMany({
			data: allowedGestureIds.map(gestureId => ({
				modifierId,
				gestureId
			})),
			skipDuplicates: true
		});
	}

	private async syncWordLinks(
		tx: Prisma.TransactionClient,
		magicWordId: string,
		links: {
			skillIds?: string[];
			damageTypeIds?: string[];
			conditionIds?: string[];
		}
	) {
		if (links.skillIds !== undefined) {
			await tx.magicWordSkillLink.deleteMany({ where: { magicWordId } });
			await tx.magicWordSkillLink.createMany({
				data: links.skillIds.map((skillId, index) => ({
					magicWordId,
					skillId,
					sortOrder: index
				})),
				skipDuplicates: true
			});
		}

		if (links.damageTypeIds !== undefined) {
			await tx.magicWordDamageTypeLink.deleteMany({ where: { magicWordId } });
			await tx.magicWordDamageTypeLink.createMany({
				data: links.damageTypeIds.map((damageTypeId, index) => ({
					magicWordId,
					damageTypeId,
					sortOrder: index
				})),
				skipDuplicates: true
			});
		}

		if (links.conditionIds !== undefined) {
			await tx.magicWordConditionLink.deleteMany({ where: { magicWordId } });
			await tx.magicWordConditionLink.createMany({
				data: links.conditionIds.map((conditionId, index) => ({
					magicWordId,
					conditionId,
					sortOrder: index
				})),
				skipDuplicates: true
			});
		}
	}

	private async syncEssenceProfile(
		tx: Prisma.TransactionClient,
		magicWordId: string,
		type: MagicWordType,
		profile:
			| {
					damageAffinity: number;
					rangeAffinity: number;
					controlAffinity: number;
					durationAffinity: number;
					areaAffinity: number;
					stabilityAffinity: number;
			  }
			| undefined
	) {
		if (type !== MagicWordType.ESSENCE) {
			await tx.magicWordEssenceProfile.deleteMany({ where: { magicWordId } });
			return;
		}

		const data = normalizeEssenceProfile(profile);

		await tx.magicWordEssenceProfile.upsert({
			where: { magicWordId },
			create: {
				magicWordId,
				...data
			},
			update: data
		});
	}

	private async syncAreaShape(
		tx: Prisma.TransactionClient,
		magicWordId: string,
		type: MagicWordType,
		shape:
			| {
					kind: AreaShapeKind;
					name: string;
					description?: string;
					dimensions?: unknown;
					influenceConfig?: unknown;
					isActive?: boolean;
					sortOrder?: number;
			  }
			| undefined
	) {
		if (type !== MagicWordType.GESTURE) {
			await tx.areaShape.deleteMany({ where: { gestureId: magicWordId } });
			return;
		}

		if (!shape) {
			return;
		}

		const data = {
			kind: shape.kind,
			name: shape.name.trim(),
			description: shape.description?.trim() || null,
			dimensions: toJsonObject(shape.dimensions),
			influenceConfig: toJsonObject(shape.influenceConfig),
			isActive: shape.isActive ?? true,
			sortOrder: shape.sortOrder ?? 0
		};

		await tx.areaShape.upsert({
			where: { gestureId: magicWordId },
			create: {
				gestureId: magicWordId,
				...data
			},
			update: data
		});
	}

	private async syncSpellMechanicBlocks(
		tx: Prisma.TransactionClient,
		spellId: string,
		blocks: SaveSpellMechanicBlockDto[]
	) {
		await this.assertSpellMechanicIds(
			tx,
			blocks.map(block => block.mechanicId)
		);

		await tx.spellMechanicBlock.deleteMany({ where: { spellId } });

		if (!blocks.length) {
			return;
		}

		await tx.spellMechanicBlock.createMany({
			data: blocks.map((block, index) => ({
				spellId,
				mechanicId: block.mechanicId,
				parameterValues: toJsonObject(block.parameterValues),
				config: toJsonObject(block.config),
				isActive: block.isActive ?? true,
				sortOrder: block.sortOrder ?? index
			}))
		});
	}

	private async assertSpellMechanicIds(
		tx: Prisma.TransactionClient,
		mechanicIds: string[]
	) {
		const uniqueIds = [...new Set(mechanicIds)];

		if (!uniqueIds.length) {
			return;
		}

		const mechanics = await tx.spellMechanic.findMany({
			select: { id: true },
			where: { id: { in: uniqueIds } }
		});

		if (mechanics.length !== uniqueIds.length) {
			throw new BadRequestException(
				'Все блоки заклинания должны ссылаться на существующие механики.'
			);
		}
	}

	private mapWord(word: MagicWordRecord) {
		const allowedGestures = word.modifierGestureRestrictions
			.map(restriction => restriction.gesture)
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			});
		const skills = word.skillLinks
			.map(link => link.skill)
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			});
		const damageTypes = word.damageTypeLinks
			.map(link => link.damageType)
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			});
		const conditions = word.conditionLinks
			.map(link => link.condition)
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			});

		return {
			id: word.id,
			type: word.type,
			slug: word.slug,
			name: word.name,
			description: word.description ?? '',
			isActive: word.isActive,
			sortOrder: word.sortOrder,
			allowedGestureIds: allowedGestures.map(gesture => gesture.id),
			allowedGestures: allowedGestures.map(gesture => ({
				id: gesture.id,
				slug: gesture.slug,
				name: gesture.name
			})),
			skillIds: skills.map(skill => skill.id),
			skills: skills.map(skill => ({
				id: skill.id,
				slug: skill.slug,
				name: skill.name,
				categoryName: skill.category.name
			})),
			damageTypeIds: damageTypes.map(damageType => damageType.id),
			damageTypes: damageTypes.map(damageType => ({
				id: damageType.id,
				slug: damageType.slug,
				name: damageType.name
			})),
			conditionIds: conditions.map(condition => condition.id),
			conditions: conditions.map(condition => ({
				id: condition.id,
				slug: condition.slug,
				name: condition.name
			})),
			essenceProfile: word.essenceProfile
				? {
						damageAffinity: Number(word.essenceProfile.damageAffinity),
						rangeAffinity: Number(word.essenceProfile.rangeAffinity),
						controlAffinity: Number(word.essenceProfile.controlAffinity),
						durationAffinity: Number(word.essenceProfile.durationAffinity),
						areaAffinity: Number(word.essenceProfile.areaAffinity),
						stabilityAffinity: Number(word.essenceProfile.stabilityAffinity)
				  }
				: null,
			areaShape: word.areaShape
				? {
						kind: word.areaShape.kind,
						name: word.areaShape.name,
						description: word.areaShape.description ?? '',
						dimensions: toJsonObject(word.areaShape.dimensions),
						influenceConfig: toJsonObject(word.areaShape.influenceConfig),
						isActive: word.areaShape.isActive,
						sortOrder: word.areaShape.sortOrder
				  }
				: null,
			createdAt: word.createdAt.toISOString(),
			updatedAt: word.updatedAt.toISOString()
		};
	}

	private async loadActiveWords(type: MagicWordType) {
		return this.prisma.magicWord.findMany({
			select: { id: true, slug: true, name: true, sortOrder: true },
			where: { type, isActive: true },
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		});
	}

	private async assertSpellFormula(
		actionId: string,
		essenceId: string,
		gestureId: string
	) {
		const [actions, essences, gestures] = await Promise.all([
			this.prisma.magicWord.count({
				where: { id: actionId, type: MagicWordType.ACTION, isActive: true }
			}),
			this.prisma.magicWord.count({
				where: { id: essenceId, type: MagicWordType.ESSENCE, isActive: true }
			}),
			this.prisma.magicWord.count({
				where: { id: gestureId, type: MagicWordType.GESTURE, isActive: true }
			})
		]);

		if (!actions || !essences || !gestures) {
			throw new BadRequestException(
				'Формула заклинания должна ссылаться на активные действие, сущность и жест.'
			);
		}
	}

	private mapSpell(spell: SpellRecord) {
		return {
			id: spell.id,
			actionId: spell.actionId,
			essenceId: spell.essenceId,
			gestureId: spell.gestureId,
			name: spell.name,
			description: spell.description ?? '',
			config: toJsonObject(spell.config),
			targetConfigs: Array.isArray(spell.targetConfigs)
				? spell.targetConfigs
				: [],
			textBlocks: Array.isArray(spell.textBlocks) ? spell.textBlocks : [],
			status: spell.status,
			isActive: spell.isActive,
			sortOrder: spell.sortOrder,
			formulaName: `${spell.action.name} + ${spell.essence.name} + ${spell.gesture.name}`,
			action: { id: spell.action.id, slug: spell.action.slug, name: spell.action.name },
			essence: { id: spell.essence.id, slug: spell.essence.slug, name: spell.essence.name },
			gesture: { id: spell.gesture.id, slug: spell.gesture.slug, name: spell.gesture.name },
			mechanicBlocks: spell.mechanicBlocks.map(block => ({
				id: block.id,
				mechanicId: block.mechanicId,
				parameterValues: block.parameterValues,
				config: block.config,
				isActive: block.isActive,
				sortOrder: block.sortOrder,
				createdAt: block.createdAt.toISOString(),
				updatedAt: block.updatedAt.toISOString()
			})),
			createdAt: spell.createdAt.toISOString(),
			updatedAt: spell.updatedAt.toISOString()
		};
	}
}

function toJsonObject(value: unknown) {
	if (
		!value ||
		Array.isArray(value) ||
		typeof value !== 'object'
	) {
		return {};
	}

	return value as Prisma.InputJsonObject;
}

function toJsonArray(value: unknown[] | undefined) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value as Prisma.InputJsonArray;
}

function normalizeEssenceProfile(
	profile:
		| {
				damageAffinity: number;
				rangeAffinity: number;
				controlAffinity: number;
				durationAffinity: number;
				areaAffinity: number;
				stabilityAffinity: number;
		  }
		| undefined
) {
	return {
		damageAffinity: clampAffinity(profile?.damageAffinity ?? 0.5),
		rangeAffinity: clampAffinity(profile?.rangeAffinity ?? 0.5),
		controlAffinity: clampAffinity(profile?.controlAffinity ?? 0.5),
		durationAffinity: clampAffinity(profile?.durationAffinity ?? 0.5),
		areaAffinity: clampAffinity(profile?.areaAffinity ?? 0.5),
		stabilityAffinity: clampAffinity(profile?.stabilityAffinity ?? 0.5)
	};
}

function clampAffinity(value: number) {
	if (!Number.isFinite(value)) {
		return 0.5;
	}

	return Math.min(1, Math.max(0, value));
}

function formulaKey(actionId: string, essenceId: string, gestureId: string) {
	return `${actionId}:${essenceId}:${gestureId}`;
}

function normalizeSpellActive(
	status: SpellStatus,
	requested: boolean | undefined,
	previous?: { status: SpellStatus; isActive: boolean }
) {
	if (status === SpellStatus.DRAFT) {
		return false;
	}

	if (previous?.status === SpellStatus.DRAFT) {
		return true;
	}

	return requested ?? true;
}
