import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import {
	MagicWordType,
	Prisma,
	SpellStatus
} from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { CreateMagicWordDto } from './dto/create-magic-word.dto';
import { UpdateMagicWordDto } from './dto/update-magic-word.dto';
import { SaveSpellDto } from './dto/save-spell.dto';

const magicWordSelect = {
	id: true,
	type: true,
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
					name: true,
					sortOrder: true
				}
			}
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
	status: true,
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true,
	action: { select: { id: true, name: true, sortOrder: true } },
	essence: { select: { id: true, name: true, sortOrder: true } },
	gesture: { select: { id: true, name: true, sortOrder: true } }
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
				select: { id: true, name: true, sortOrder: true },
				where: { type: MagicWordType.ACTION, isActive: true },
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.magicWord.findMany({
				select: { id: true, name: true, sortOrder: true },
				where: { type: MagicWordType.ESSENCE, isActive: true },
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			})
		]);

		return {
			formulas: actions.flatMap(action =>
				essences.map(essence => ({
					actionId: action.id,
					actionName: action.name,
					essenceId: essence.id,
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
			const spell = await this.prisma.spell.create({
				select: spellSelect,
				data: {
					actionId: dto.actionId,
					essenceId: dto.essenceId,
					gestureId: dto.gestureId,
					name: dto.name.trim(),
					description: dto.description?.trim() || null,
					status: dto.status,
					isActive: normalizeSpellActive(dto.status, dto.isActive),
					sortOrder: dto.sortOrder ?? 0
				}
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
			const spell = await this.prisma.spell.update({
				select: spellSelect,
				where: { id },
				data: {
					name: dto.name.trim(),
					description: dto.description?.trim() || null,
					status: dto.status,
					isActive: normalizeSpellActive(dto.status, dto.isActive, existing),
					sortOrder: dto.sortOrder ?? 0
				}
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
		await this.assertAllowedGestureIds(dto.type, allowedGestureIds);

		try {
			const word = await this.prisma.$transaction(async tx => {
				const created = await tx.magicWord.create({
					select: magicWordSelect,
					data: {
						type: dto.type,
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

				return tx.magicWord.findUniqueOrThrow({
					select: magicWordSelect,
					where: { id: created.id }
				});
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

		try {
			const word = await this.prisma.$transaction(async tx => {
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

				return tx.magicWord.findUniqueOrThrow({
					select: magicWordSelect,
					where: { id }
				});
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

	private mapWord(word: MagicWordRecord) {
		const allowedGestures = word.modifierGestureRestrictions
			.map(restriction => restriction.gesture)
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			});

		return {
			id: word.id,
			type: word.type,
			name: word.name,
			description: word.description ?? '',
			isActive: word.isActive,
			sortOrder: word.sortOrder,
			allowedGestureIds: allowedGestures.map(gesture => gesture.id),
			allowedGestures: allowedGestures.map(gesture => ({
				id: gesture.id,
				name: gesture.name
			})),
			createdAt: word.createdAt.toISOString(),
			updatedAt: word.updatedAt.toISOString()
		};
	}

	private async loadActiveWords(type: MagicWordType) {
		return this.prisma.magicWord.findMany({
			select: { id: true, name: true, sortOrder: true },
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
			status: spell.status,
			isActive: spell.isActive,
			sortOrder: spell.sortOrder,
			formulaName: `${spell.action.name} + ${spell.essence.name} + ${spell.gesture.name}`,
			action: { id: spell.action.id, name: spell.action.name },
			essence: { id: spell.essence.id, name: spell.essence.name },
			gesture: { id: spell.gesture.id, name: spell.gesture.name },
			createdAt: spell.createdAt.toISOString(),
			updatedAt: spell.updatedAt.toISOString()
		};
	}
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
