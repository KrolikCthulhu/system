import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CombatEncounterParticipantKind, Prisma } from '@prisma/generated';
import { CharacterSheetRuntimeService } from '../character-sheet/character-sheet-runtime.service';
import {
	DiceCheckResult,
	DiceCheckRuntimeService
} from '../game-events/dice-check-runtime.service';
import { PrismaService } from '../prisma/prisma.service';

type DefenseMode = 'dodge' | 'parry' | 'none';
type ParrySkillGroup = 'unarmed' | 'melee_weapon' | 'shield';

export interface CombatActionReference {
	name: string;
	slug: string;
}

export interface CombatActionRollConfig {
	type: 'none' | 'attack_profile' | 'check';
	characteristic: CombatActionReference | null;
	skill: CombatActionReference | null;
}

export interface CombatActionDefenseConfig {
	type: 'none' | 'target_physical_defense';
	canDodge: boolean;
	canParry: boolean;
	parrySkillGroups: ParrySkillGroup[];
}

export interface CombatCheckAction {
	slug: string;
	name: string;
	roll?: CombatActionRollConfig | null;
	defense?: CombatActionDefenseConfig | null;
	source?: {
		type: string;
		name: string;
		slug: string;
		profileName: string;
	} | null;
}

export interface CombatDefenseOption {
	mode: DefenseMode;
	label: string;
	skillSlug: string | null;
	skillName: string | null;
}

export interface CombatResolvedRoll {
	skillSlug: string | null;
	skillName: string;
	characteristicSlug: string | null;
	characteristicName: string;
	diceCount: number;
	dice: number[];
	successes: number;
	sixes: number;
	ones: number;
	ignoredOnes: number;
	consequenceCount: number;
	skillLevel: number;
}

@Injectable()
export class CombatActionCheckRuntimeService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly diceRuntime: DiceCheckRuntimeService,
		private readonly characterSheetRuntime: CharacterSheetRuntimeService
	) {}

	async rollActionAttack(
		actorParticipantId: string,
		action: CombatCheckAction
	): Promise<CombatResolvedRoll | null> {
		const roll = action.roll;

		if (!roll || roll.type === 'none') {
			return null;
		}

		if (!roll.skill?.slug) {
			throw new BadRequestException(
				`Для действия "${action.name}" не задан навык проверки.`
			);
		}

		return this.rollParticipantSkill({
			participantId: actorParticipantId,
			skillSlug: roll.skill.slug,
			characteristicSlug: roll.characteristic?.slug ?? null
		});
	}

	async rollDefense(params: {
		participantId: string;
		option: CombatDefenseOption;
	}): Promise<CombatResolvedRoll | null> {
		if (params.option.mode === 'none' || !params.option.skillSlug) {
			return null;
		}

		return this.rollParticipantSkill({
			participantId: params.participantId,
			skillSlug: params.option.skillSlug,
			characteristicSlug: null
		});
	}

	async resolveDefenseOptions(params: {
		actorParticipantId: string;
		targetParticipantId: string;
		action: CombatCheckAction;
	}): Promise<CombatDefenseOption[]> {
		const defense = await this.resolveEffectiveDefense(
			params.actorParticipantId,
			params.action
		);

		if (!defense || defense.type === 'none') {
			return [{ mode: 'none', label: 'Не защищаться', skillSlug: null, skillName: null }];
		}

		const options: CombatDefenseOption[] = [];

		if (defense.canDodge) {
			const dodge = await this.findSkillBySlug('uklonenie');
			options.push({
				mode: 'dodge',
				label: dodge.name,
				skillSlug: dodge.slug,
				skillName: dodge.name
			});
		}

		if (defense.canParry && defense.parrySkillGroups.includes('unarmed')) {
			const unarmed = await this.findSkillBySlug('rukopashnyy-boy');
			options.push({
				mode: 'parry',
				label: `Парировать: ${unarmed.name}`,
				skillSlug: unarmed.slug,
				skillName: unarmed.name
			});
		}

		options.push({
			mode: 'none',
			label: 'Не защищаться',
			skillSlug: null,
			skillName: null
		});

		return options;
	}

	async resolveSelectedDefenseOption(params: {
		options: CombatDefenseOption[];
		mode: DefenseMode;
		skillSlug?: string | null;
	}) {
		const option =
			params.options.find(
				item =>
					item.mode === params.mode &&
					(params.mode === 'none' ||
						!params.skillSlug ||
						item.skillSlug === params.skillSlug)
			) ?? null;

		if (!option) {
			throw new BadRequestException('Выбранный способ защиты недоступен.');
		}

		return option;
	}

	private async rollParticipantSkill(params: {
		participantId: string;
		skillSlug: string;
		characteristicSlug: string | null;
	}): Promise<CombatResolvedRoll> {
		const participant = await this.prisma.combatEncounterParticipant.findUnique({
			select: {
				id: true,
				kind: true,
				playerCharacter: {
					select: {
						id: true,
						sheetInputValues: true
					}
				},
				creatureTier: {
					select: {
						skills: {
							select: {
								level: true,
								skill: {
									select: {
										id: true,
										slug: true,
										name: true,
										defaultLevel: true
									}
								}
							}
						},
						characteristics: {
							select: {
								value: true,
								characteristic: {
									select: {
										id: true,
										name: true,
										defaultValue: true,
										systemValue: {
											select: {
												slug: true
											}
										}
									}
								}
							}
						}
					}
				}
			},
			where: { id: params.participantId }
		});

		if (!participant) {
			throw new NotFoundException('Участник столкновения не найден.');
		}

		if (
			participant.kind === CombatEncounterParticipantKind.PLAYER_CHARACTER &&
			participant.playerCharacter
		) {
			const skill = await this.findSkillBySlug(params.skillSlug);
			const result = await this.characterSheetRuntime.rollSkill(
				skill.id,
				this.characterSheetRuntime.normalizeInputValues(
					participant.playerCharacter.sheetInputValues
				)
			);

			await this.prisma.playerCharacter.update({
				where: { id: participant.playerCharacter.id },
				data: {
					sheetInputValues: result.inputValues
				}
			});

			return {
				skillSlug: skill.slug,
				skillName: skill.name,
				characteristicSlug: params.characteristicSlug,
				characteristicName: 'По навыку',
				...result.roll
			};
		}

		if (!participant.creatureTier) {
			throw new BadRequestException('У участника нет данных для броска.');
		}

		const tierSkill = participant.creatureTier.skills.find(
			item => item.skill.slug === params.skillSlug
		);
		const skill = tierSkill?.skill ?? (await this.findSkillBySlug(params.skillSlug));
		const skillLevel = tierSkill?.level ?? skill.defaultLevel;
		const characteristic = this.resolveCreatureCharacteristic(
			participant.creatureTier.characteristics,
			params.characteristicSlug
		);
		const levelRule = await this.prisma.skillLevel.findUnique({
			select: {
				canRoll: true,
				successMin: true,
				doubleSuccessMin: true,
				ignoreOnesCount: true
			},
			where: { level: skillLevel }
		});
		const roll = this.diceRuntime.roll({
			diceCount: characteristic.value,
			skillLevel,
			levelRule
		});

		return {
			skillSlug: skill.slug,
			skillName: skill.name,
			characteristicSlug: characteristic.slug,
			characteristicName: characteristic.name,
			...roll
		};
	}

	private resolveCreatureCharacteristic(
		characteristics: Array<{
			value: number;
			characteristic: {
				name: string;
				defaultValue: number;
				systemValue: { slug: string };
			};
		}>,
		characteristicSlug: string | null
	) {
		const tierCharacteristic = characteristicSlug
			? characteristics.find(
					item => item.characteristic.systemValue.slug === characteristicSlug
				)
			: characteristics[0];

		if (tierCharacteristic) {
			return {
				slug: tierCharacteristic.characteristic.systemValue.slug,
				name: tierCharacteristic.characteristic.name,
				value: tierCharacteristic.value
			};
		}

		return {
			slug: characteristicSlug,
			name: 'Характеристика',
			value: 0
		};
	}

	private async resolveEffectiveDefense(
		actorParticipantId: string,
		action: CombatCheckAction
	): Promise<CombatActionDefenseConfig | null> {
		if (action.defense) {
			return action.defense;
		}

		if (action.source?.type !== 'natural_attack' || !action.source.slug) {
			return null;
		}

		const actor = await this.prisma.combatEncounterParticipant.findUnique({
			select: {
				creature: {
					select: {
						naturalAttackLinks: {
							select: {
								naturalAttack: {
									select: { slug: true }
								},
								attackProfiles: true
							}
						}
					}
				}
			},
			where: { id: actorParticipantId }
		});
		const link = actor?.creature?.naturalAttackLinks.find(
			item => item.naturalAttack.slug === action.source?.slug
		);

		if (!link || !Array.isArray(link.attackProfiles)) {
			return null;
		}

		const profile = link.attackProfiles.find(
			item =>
				isJsonObject(item) &&
				(readString(item, 'name') === action.source?.profileName ||
					readString(item, 'kind') === 'melee')
		);

		return isJsonObject(profile)
			? readDefense(profile['defaultDefense'])
			: null;
	}

	private async findSkillBySlug(slug: string) {
		const skill = await this.prisma.skill.findUnique({
			select: {
				id: true,
				slug: true,
				name: true,
				defaultLevel: true
			},
			where: { slug }
		});

		if (!skill) {
			throw new NotFoundException(`Навык "${slug}" не найден.`);
		}

		return skill;
	}
}

function readDefense(value: Prisma.JsonValue): CombatActionDefenseConfig | null {
	if (!isJsonObject(value)) {
		return null;
	}

	const type = readString(value, 'type');

	if (type !== 'target_physical_defense') {
		return { type: 'none', canDodge: false, canParry: false, parrySkillGroups: [] };
	}

	const canParry = readBoolean(value, 'canParry') ?? false;

	return {
		type,
		canDodge: readBoolean(value, 'canDodge') ?? false,
		canParry,
		parrySkillGroups: canParry
			? readParrySkillGroups(value['parrySkillGroups'])
			: []
	};
}

function readParrySkillGroups(value: Prisma.JsonValue): ParrySkillGroup[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(
		(item): item is ParrySkillGroup =>
			item === 'unarmed' || item === 'melee_weapon' || item === 'shield'
	);
}

function isJsonObject(
	value: Prisma.JsonValue | undefined
): value is Record<string, Prisma.JsonValue> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readString(
	value: Record<string, Prisma.JsonValue>,
	key: string
): string | null {
	const rawValue = value[key];
	return typeof rawValue === 'string' ? rawValue : null;
}

function readBoolean(
	value: Record<string, Prisma.JsonValue>,
	key: string
): boolean | null {
	const rawValue = value[key];
	return typeof rawValue === 'boolean' ? rawValue : null;
}
