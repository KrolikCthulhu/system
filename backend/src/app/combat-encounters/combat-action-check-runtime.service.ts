import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { CombatEncounterParticipantKind, Prisma } from '@prisma/generated';
import { CharacterSheetRuntimeService } from '../character-sheet/character-sheet-runtime.service';
import {
	DiceCheckResult,
	DiceCheckRuntimeService
} from '../game-events/dice-check-runtime.service';
import { PrismaService } from '../prisma/prisma.service';
import { CombatActionCheckEngine } from './domain/combat-action-check.engine';
import {
	CombatActionDefenseConfig,
	CombatCheckAction,
	CombatDefenseOption,
	CombatResolvedRoll,
	DefenseMode
} from './domain/combat-action-check.types';

@Injectable()
export class CombatActionCheckRuntimeService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly diceRuntime: DiceCheckRuntimeService,
		private readonly characterSheetRuntime: CharacterSheetRuntimeService,
		private readonly checkEngine: CombatActionCheckEngine
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
			return [
				{
					mode: 'none',
					label: 'Не защищаться',
					skillSlug: null,
					skillName: null
				}
			];
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
		const result = this.checkEngine.resolveSelectedDefenseOption(params);

		if (result.ok === false) {
			throw new BadRequestException({
				code: result.error.code,
				message: result.error.message
			});
		}

		return result.value;
	}

	private async rollParticipantSkill(params: {
		participantId: string;
		skillSlug: string;
		characteristicSlug: string | null;
	}): Promise<CombatResolvedRoll> {
		const participant = await this.prisma.combatEncounterParticipant.findUnique(
			{
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
			}
		);

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
		const skill =
			tierSkill?.skill ?? (await this.findSkillBySlug(params.skillSlug));
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

		const profile = this.checkEngine.findAttackProfile(
			link.attackProfiles as Prisma.JsonValue[],
			action.source.profileName
		);

		return profile
			? this.checkEngine.readDefense(profile['defaultDefense'])
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
