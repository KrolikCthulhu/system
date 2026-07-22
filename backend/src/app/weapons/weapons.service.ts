import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { Prisma, WeaponAttackProfileKind } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../shared/prisma-error.util';
import { createSlug } from '../shared/slug.util';
import { CreateWeaponTemplateDto } from './dto/create-weapon-template.dto';
import { CreateWeaponDto } from './dto/create-weapon.dto';
import { UpdateWeaponTemplateDto } from './dto/update-weapon-template.dto';
import { UpdateWeaponDto } from './dto/update-weapon.dto';

const damageTypeOptionSelect = {
	id: true,
	slug: true,
	name: true,
	isActive: true,
	sortOrder: true
} satisfies Prisma.DamageTypeSelect;

const weaponSelect = {
	id: true,
	slug: true,
	name: true,
	templateId: true,
	template: {
		select: {
			id: true,
			slug: true,
			name: true,
			handsMin: true,
			handsMax: true,
			defaultHands: true,
			skillId: true
		}
	},
	skillId: true,
	skill: {
		select: {
			id: true,
			slug: true,
			name: true,
			categoryId: true,
			category: {
				select: {
					id: true,
					slug: true,
					name: true
				}
			},
			isActive: true,
			sortOrder: true
		}
	},
	extraDamage: true,
	attackProfiles: {
		select: {
			id: true,
			kind: true,
			name: true,
			skillId: true,
			skill: {
				select: {
					id: true,
					slug: true,
					name: true,
					categoryId: true,
					category: {
						select: {
							id: true,
							slug: true,
							name: true
						}
					},
					isActive: true,
					sortOrder: true
				}
			},
			characteristicId: true,
			characteristic: {
				select: {
					id: true,
					name: true,
					isActive: true,
					sortOrder: true
				}
			},
			baseCost: true,
			baseDamage: true,
			rangeMeters: true,
			usesAmmo: true,
			canBeParried: true,
			damageTypeLinks: {
				select: {
					damageTypeId: true,
					damageType: { select: damageTypeOptionSelect },
					sortOrder: true
				},
				orderBy: [{ sortOrder: 'asc' }, { damageType: { name: 'asc' } }]
			},
			isActive: true,
			sortOrder: true,
			intentLinks: {
				select: {
					id: true,
					combatIntentId: true,
					combatIntent: {
						select: {
							id: true,
							slug: true,
							name: true,
							category: true,
							isActive: true,
							sortOrder: true
						}
					},
					costModifier: true,
					damageModifier: true,
					ruleText: true,
					sortOrder: true
				},
				orderBy: [{ sortOrder: 'asc' }, { combatIntent: { name: 'asc' } }]
			}
		},
		orderBy: [{ sortOrder: 'asc' }, { kind: 'asc' }]
	},
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.WeaponSelect;

const combatIntentOptionSelect = {
	id: true,
	slug: true,
	name: true,
	category: true,
	isActive: true,
	sortOrder: true
} satisfies Prisma.CombatIntentSelect;

const characteristicOptionSelect = {
	id: true,
	name: true,
	isActive: true,
	sortOrder: true
} satisfies Prisma.CharacteristicSelect;

const weaponTemplateSelect = {
	id: true,
	slug: true,
	name: true,
	skillId: true,
	skill: {
		select: {
			id: true,
			slug: true,
			name: true,
			categoryId: true,
			category: {
				select: {
					id: true,
					slug: true,
					name: true
				}
			},
			isActive: true,
			sortOrder: true
		}
	},
	handsMin: true,
	handsMax: true,
	defaultHands: true,
	attackProfiles: {
		select: {
			id: true,
			kind: true,
			name: true,
			skillId: true,
			skill: {
				select: {
					id: true,
					slug: true,
					name: true,
					categoryId: true,
					category: {
						select: {
							id: true,
							slug: true,
							name: true
						}
					},
					isActive: true,
					sortOrder: true
				}
			},
			characteristicId: true,
			characteristic: {
				select: characteristicOptionSelect
			},
			baseCost: true,
			baseDamage: true,
			rangeMeters: true,
			usesAmmo: true,
			canBeParried: true,
			damageTypeLinks: {
				select: {
					damageTypeId: true,
					damageType: { select: damageTypeOptionSelect },
					sortOrder: true
				},
				orderBy: [{ sortOrder: 'asc' }, { damageType: { name: 'asc' } }]
			},
			isActive: true,
			sortOrder: true,
			intentLinks: {
				select: {
					id: true,
					combatIntentId: true,
					combatIntent: {
						select: combatIntentOptionSelect
					},
					costModifier: true,
					damageModifier: true,
					ruleText: true,
					sortOrder: true
				},
				orderBy: [{ sortOrder: 'asc' }, { combatIntent: { name: 'asc' } }]
			}
		},
		orderBy: [{ sortOrder: 'asc' }, { kind: 'asc' }]
	},
	isActive: true,
	sortOrder: true,
	createdAt: true,
	updatedAt: true
} satisfies Prisma.WeaponTemplateSelect;

type WeaponRecord = Prisma.WeaponGetPayload<{
	select: typeof weaponSelect;
}>;
type WeaponTemplateRecord = Prisma.WeaponTemplateGetPayload<{
	select: typeof weaponTemplateSelect;
}>;

@Injectable()
export class WeaponsService {
	constructor(private readonly prisma: PrismaService) {}

	async getCatalog() {
		const [
			weapons,
			templates,
			skills,
			combatIntents,
			characteristics,
			damageTypes
		] = await this.prisma.$transaction([
			this.prisma.weapon.findMany({
				select: weaponSelect,
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.weaponTemplate.findMany({
				select: weaponTemplateSelect,
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.skill.findMany({
				select: {
					id: true,
					slug: true,
					name: true,
					categoryId: true,
					category: {
						select: {
							id: true,
							slug: true,
							name: true
						}
					},
					isActive: true,
					sortOrder: true
				},
				orderBy: [
					{ category: { sortOrder: 'asc' } },
					{ sortOrder: 'asc' },
					{ name: 'asc' }
				]
			}),
			this.prisma.combatIntent.findMany({
				select: combatIntentOptionSelect,
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.characteristic.findMany({
				select: characteristicOptionSelect,
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			}),
			this.prisma.damageType.findMany({
				select: damageTypeOptionSelect,
				where: {
					slug: { in: ['rezhuschiy', 'kolyuschiy', 'drobyaschiy'] }
				},
				orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
			})
		]);

		return {
			weapons: weapons.map(item => this.mapWeapon(item)),
			templates: templates.map(item => this.mapWeaponTemplate(item)),
			skills,
			characteristics,
			combatIntents,
			damageTypes
		};
	}

	async createWeapon(dto: CreateWeaponDto) {
		const profiles = this.normalizeProfiles(dto.attackProfiles, dto);
		await this.ensureTemplateExists(dto.templateId);
		await this.ensureProfileReferencesExist(profiles);
		const primaryProfile = profiles[0];

		try {
			const weapon = await this.prisma.weapon.create({
				select: weaponSelect,
				data: {
					...this.toCreateData(dto, primaryProfile),
					attackProfiles: {
						create: profiles.map(profile =>
							this.toProfileNestedCreateData(profile)
						)
					}
				}
			});

			return this.mapWeapon(weapon);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать оружие.', {
				uniqueMessage: 'Оружие с таким названием уже существует.'
			});
		}
	}

	async updateWeapon(id: string, dto: UpdateWeaponDto) {
		await this.ensureWeaponExists(id);

		const profiles =
			dto.attackProfiles === undefined
				? undefined
				: this.normalizeProfiles(dto.attackProfiles, dto);

		if (profiles) {
			await this.ensureProfileReferencesExist(profiles);
		} else if (dto.skillId !== undefined) {
			await this.ensureSkillExists(dto.skillId);
		}
		if (dto.templateId !== undefined) {
			await this.ensureTemplateExists(dto.templateId);
		}

		try {
			const weapon = await this.prisma.$transaction(async tx => {
				const updated = await tx.weapon.update({
					select: { id: true },
					where: { id },
					data: this.toUpdateData(dto, profiles?.[0])
				});

				if (profiles) {
					await tx.weaponAttackProfile.deleteMany({ where: { weaponId: id } });
					for (const profile of profiles) {
						await tx.weaponAttackProfile.create({
							data: {
								...this.toProfileCreateData(profile),
								weapon: { connect: { id: updated.id } }
							}
						});
					}
				}

				return tx.weapon.findUniqueOrThrow({
					select: weaponSelect,
					where: { id }
				});
			});

			return this.mapWeapon(weapon);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить оружие.', {
				uniqueMessage: 'Оружие с таким названием уже существует.'
			});
		}
	}

	async deleteWeapon(id: string) {
		await this.ensureWeaponExists(id);
		await this.prisma.weapon.delete({ where: { id } });
	}

	async createWeaponTemplate(dto: CreateWeaponTemplateDto) {
		const profiles = this.normalizeProfiles(dto.attackProfiles, {
			skillId: dto.skillId,
			extraDamage: 0
		});
		this.assertHandsRange({
			handsMin: dto.handsMin,
			handsMax: dto.handsMax,
			defaultHands: dto.defaultHands
		});
		await this.ensureSkillExists(dto.skillId);
		await this.ensureProfileReferencesExist(profiles);

		try {
			const template = await this.prisma.weaponTemplate.create({
				select: weaponTemplateSelect,
				data: {
					slug: createSlug(dto.name),
					name: dto.name.trim(),
					skillId: dto.skillId,
					handsMin: dto.handsMin,
					handsMax: dto.handsMax,
					defaultHands: dto.defaultHands,
					isActive: dto.isActive ?? true,
					sortOrder: dto.sortOrder ?? 0,
					attackProfiles: {
						create: profiles.map(profile =>
							this.toTemplateProfileCreateData(profile)
						)
					}
				}
			});

			return this.mapWeaponTemplate(template);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось создать шаблон оружия.', {
				uniqueMessage: 'Шаблон оружия с таким названием уже существует.'
			});
		}
	}

	async updateWeaponTemplate(id: string, dto: UpdateWeaponTemplateDto) {
		const existingTemplate = await this.ensureWeaponTemplateExists(id);
		const profiles =
			dto.attackProfiles === undefined
				? undefined
				: this.normalizeProfiles(dto.attackProfiles, {
						skillId: dto.skillId,
						extraDamage: 0
					});

		if (dto.skillId !== undefined) {
			await this.ensureSkillExists(dto.skillId);
		}
		if (profiles) {
			await this.ensureProfileReferencesExist(profiles);
		}
		this.assertHandsRange({
			handsMin: dto.handsMin ?? existingTemplate.handsMin,
			handsMax: dto.handsMax ?? existingTemplate.handsMax,
			defaultHands: dto.defaultHands ?? existingTemplate.defaultHands
		});

		try {
			const template = await this.prisma.$transaction(async tx => {
				await tx.weaponTemplate.update({
					select: { id: true },
					where: { id },
					data: {
						name: dto.name === undefined ? undefined : dto.name.trim(),
						skillId: dto.skillId,
						handsMin: dto.handsMin,
						handsMax: dto.handsMax,
						defaultHands: dto.defaultHands,
						isActive: dto.isActive,
						sortOrder: dto.sortOrder
					}
				});

				if (profiles) {
					await tx.weaponTemplateAttackProfile.deleteMany({
						where: { templateId: id }
					});
					for (const profile of profiles) {
						await tx.weaponTemplateAttackProfile.create({
							data: {
								...this.toTemplateProfileCreateData(profile),
								template: { connect: { id } }
							}
						});
					}
				}

				return tx.weaponTemplate.findUniqueOrThrow({
					select: weaponTemplateSelect,
					where: { id }
				});
			});

			return this.mapWeaponTemplate(template);
		} catch (error) {
			rethrowPrismaError(error, 'Не удалось обновить шаблон оружия.', {
				uniqueMessage: 'Шаблон оружия с таким названием уже существует.'
			});
		}
	}

	async deleteWeaponTemplate(id: string) {
		await this.ensureWeaponTemplateExists(id);
		try {
			await this.prisma.weaponTemplate.delete({ where: { id } });
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === 'P2003'
			) {
				throw new BadRequestException(
					'Шаблон используется видами оружия. Сначала переназначь эти виды на другой шаблон.'
				);
			}

			throw error;
		}
	}

	private async ensureWeaponExists(id: string) {
		const weapon = await this.prisma.weapon.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!weapon) {
			throw new NotFoundException('Оружие не найдено.');
		}
	}

	private async ensureSkillExists(skillId: string) {
		const skill = await this.prisma.skill.findUnique({
			select: { id: true },
			where: { id: skillId }
		});

		if (!skill) {
			throw new BadRequestException('Навык оружия не найден.');
		}
	}

	private async ensureTemplateExists(templateId: string) {
		const template = await this.prisma.weaponTemplate.findUnique({
			select: { id: true },
			where: { id: templateId }
		});

		if (!template) {
			throw new BadRequestException('Шаблон оружия не найден.');
		}
	}

	private async ensureWeaponTemplateExists(id: string) {
		const template = await this.prisma.weaponTemplate.findUnique({
			select: { id: true, handsMin: true, handsMax: true, defaultHands: true },
			where: { id }
		});

		if (!template) {
			throw new NotFoundException('Шаблон оружия не найден.');
		}

		return template;
	}

	private assertHandsRange(hands: {
		handsMin: number;
		handsMax: number;
		defaultHands: number;
	}) {
		if (hands.handsMin > hands.handsMax) {
			throw new BadRequestException(
				'Минимальное количество рук не может быть больше максимального.'
			);
		}

		if (
			hands.defaultHands < hands.handsMin ||
			hands.defaultHands > hands.handsMax
		) {
			throw new BadRequestException(
				'Количество рук по умолчанию должно быть внутри диапазона.'
			);
		}
	}

	private normalizeProfiles(
		profiles:
			| NonNullable<CreateWeaponDto['attackProfiles']>
			| NonNullable<UpdateWeaponDto['attackProfiles']>
			| undefined,
		dto: Pick<CreateWeaponDto | UpdateWeaponDto, 'skillId' | 'extraDamage'>
	) {
		const normalizedProfiles =
			profiles && profiles.length
				? profiles
				: dto.skillId
					? [
							{
								kind: 'melee' as const,
								name: 'Ближняя атака',
								skillId: dto.skillId,
								baseCost: 0,
								baseDamage: dto.extraDamage ?? 0,
								rangeMeters: 1,
								usesAmmo: false,
								canBeParried: true,
								isActive: true,
								sortOrder: 0,
								intents: []
							}
						]
					: [];

		if (!normalizedProfiles.length) {
			throw new BadRequestException(
				'Нужно настроить хотя бы один профиль атаки.'
			);
		}

		const kinds = new Set<string>();
		for (const profile of normalizedProfiles) {
			if (kinds.has(profile.kind)) {
				throw new BadRequestException(
					'Для оружия можно настроить только один ближний и один дистанционный профиль.'
				);
			}
			kinds.add(profile.kind);
		}

		return normalizedProfiles;
	}

	private async ensureProfileReferencesExist(
		profiles: ReturnType<WeaponsService['normalizeProfiles']>
	) {
		const skillIds = [...new Set(profiles.map(profile => profile.skillId))];
		const characteristicIds = [
			...new Set(
				profiles
					.map(profile => profile.characteristicId)
					.filter((id): id is string => Boolean(id))
			)
		];
		const combatIntentIds = [
			...new Set(
				profiles.flatMap(profile =>
					(profile.intents ?? []).map(intent => intent.combatIntentId)
				)
			)
		];
		const damageTypeIds = [
			...new Set(profiles.flatMap(profile => profile.damageTypeIds ?? []))
		];

		const [skills, characteristics, combatIntents, damageTypes] =
			await this.prisma.$transaction([
				this.prisma.skill.findMany({
					select: { id: true },
					where: { id: { in: skillIds } }
				}),
				characteristicIds.length
					? this.prisma.characteristic.findMany({
							select: { id: true },
							where: { id: { in: characteristicIds } }
						})
					: this.prisma.characteristic.findMany({
							select: { id: true },
							where: { id: { in: [] } }
						}),
				combatIntentIds.length
					? this.prisma.combatIntent.findMany({
							select: { id: true },
							where: { id: { in: combatIntentIds } }
						})
					: this.prisma.combatIntent.findMany({
							select: { id: true },
							where: { id: { in: [] } }
						}),
				damageTypeIds.length
					? this.prisma.damageType.findMany({
							select: { id: true },
							where: { id: { in: damageTypeIds } }
						})
					: this.prisma.damageType.findMany({
							select: { id: true },
							where: { id: { in: [] } }
						})
			]);

		if (skills.length !== skillIds.length) {
			throw new BadRequestException(
				'Все профили атаки должны ссылаться на существующие навыки.'
			);
		}

		if (characteristics.length !== characteristicIds.length) {
			throw new BadRequestException(
				'Все профили атаки должны ссылаться на существующие характеристики.'
			);
		}

		if (combatIntents.length !== combatIntentIds.length) {
			throw new BadRequestException(
				'Все профили атаки должны ссылаться на существующие боевые намерения.'
			);
		}

		if (damageTypes.length !== damageTypeIds.length) {
			throw new BadRequestException(
				'Все профили атаки должны ссылаться на существующие типы урона.'
			);
		}
	}

	private toCreateData(
		dto: CreateWeaponDto,
		primaryProfile: ReturnType<WeaponsService['normalizeProfiles']>[number]
	) {
		return {
			slug: createSlug(dto.name),
			name: dto.name.trim(),
			templateId: dto.templateId,
			skillId: primaryProfile.skillId,
			extraDamage: primaryProfile.baseDamage,
			isActive: dto.isActive ?? true,
			sortOrder: dto.sortOrder ?? 0
		};
	}

	private toUpdateData(
		dto: UpdateWeaponDto,
		primaryProfile?: ReturnType<WeaponsService['normalizeProfiles']>[number]
	) {
		return {
			name: dto.name === undefined ? undefined : dto.name.trim(),
			templateId: dto.templateId,
			skillId: primaryProfile?.skillId ?? dto.skillId,
			extraDamage: primaryProfile?.baseDamage ?? dto.extraDamage,
			isActive: dto.isActive,
			sortOrder: dto.sortOrder
		};
	}

	private toProfileCreateData(
		profile: ReturnType<WeaponsService['normalizeProfiles']>[number]
	) {
		return {
			kind:
				profile.kind === 'melee'
					? WeaponAttackProfileKind.MELEE
					: WeaponAttackProfileKind.RANGED,
			name: profile.name.trim() || this.profileKindLabel(profile.kind),
			skill: { connect: { id: profile.skillId } },
			characteristic: profile.characteristicId
				? { connect: { id: profile.characteristicId } }
				: undefined,
			baseCost: profile.baseCost,
			baseDamage: profile.baseDamage,
			rangeMeters: profile.rangeMeters,
			usesAmmo: profile.usesAmmo,
			canBeParried: profile.canBeParried ?? profile.kind === 'melee',
			isActive: profile.isActive ?? true,
			sortOrder: profile.sortOrder ?? 0,
			damageTypeLinks: {
				create: (profile.damageTypeIds ?? []).map((damageTypeId, index) => ({
					damageTypeId,
					sortOrder: index
				}))
			},
			intentLinks: {
				create: (profile.intents ?? []).map((intent, index) => ({
					combatIntentId: intent.combatIntentId,
					costModifier: intent.costModifier ?? 0,
					damageModifier: intent.damageModifier ?? 0,
					ruleText: intent.ruleText?.trim() || null,
					sortOrder: intent.sortOrder ?? index
				}))
			}
		};
	}

	private toProfileNestedCreateData(
		profile: ReturnType<WeaponsService['normalizeProfiles']>[number]
	) {
		return this.toProfileCreateData(profile);
	}

	private toTemplateProfileCreateData(
		profile: ReturnType<WeaponsService['normalizeProfiles']>[number]
	) {
		return this.toProfileCreateData(profile);
	}

	private profileKindLabel(kind: 'melee' | 'ranged') {
		return kind === 'melee' ? 'Ближняя атака' : 'Дистанционная атака';
	}

	private mapWeapon(weapon: WeaponRecord) {
		return {
			id: weapon.id,
			slug: weapon.slug,
			name: weapon.name,
			templateId: weapon.templateId,
			template: weapon.template,
			skillId: weapon.skillId,
			skill: weapon.skill,
			extraDamage: weapon.extraDamage,
			attackProfiles: weapon.attackProfiles.map(profile => ({
				id: profile.id,
				kind: profile.kind === 'MELEE' ? 'melee' : 'ranged',
				name: profile.name,
				skillId: profile.skillId,
				skill: profile.skill,
				characteristicId: profile.characteristicId,
				characteristic: profile.characteristic,
				baseCost: profile.baseCost,
				baseDamage: profile.baseDamage,
				rangeMeters: profile.rangeMeters,
				usesAmmo: profile.usesAmmo,
				canBeParried: profile.canBeParried,
				damageTypes: profile.damageTypeLinks.map(link => link.damageType),
				damageTypeIds: profile.damageTypeLinks.map(link => link.damageTypeId),
				isActive: profile.isActive,
				sortOrder: profile.sortOrder,
				intents: profile.intentLinks.map(link => ({
					id: link.id,
					combatIntentId: link.combatIntentId,
					combatIntent: link.combatIntent,
					costModifier: link.costModifier,
					damageModifier: link.damageModifier,
					ruleText: link.ruleText ?? '',
					sortOrder: link.sortOrder
				}))
			})),
			isActive: weapon.isActive,
			sortOrder: weapon.sortOrder,
			createdAt: weapon.createdAt.toISOString(),
			updatedAt: weapon.updatedAt.toISOString()
		};
	}

	private mapWeaponTemplate(template: WeaponTemplateRecord) {
		return {
			id: template.id,
			slug: template.slug,
			name: template.name,
			skillId: template.skillId,
			skill: template.skill,
			handsMin: template.handsMin,
			handsMax: template.handsMax,
			defaultHands: template.defaultHands,
			attackProfiles: template.attackProfiles.map(profile => ({
				id: profile.id,
				kind: profile.kind === 'MELEE' ? 'melee' : 'ranged',
				name: profile.name,
				skillId: profile.skillId,
				skill: profile.skill,
				characteristicId: profile.characteristicId,
				characteristic: profile.characteristic,
				baseCost: profile.baseCost,
				baseDamage: profile.baseDamage,
				rangeMeters: profile.rangeMeters,
				usesAmmo: profile.usesAmmo,
				canBeParried: profile.canBeParried,
				damageTypes: profile.damageTypeLinks.map(link => link.damageType),
				damageTypeIds: profile.damageTypeLinks.map(link => link.damageTypeId),
				isActive: profile.isActive,
				sortOrder: profile.sortOrder,
				intents: profile.intentLinks.map(link => ({
					id: link.id,
					combatIntentId: link.combatIntentId,
					combatIntent: link.combatIntent,
					costModifier: link.costModifier,
					damageModifier: link.damageModifier,
					ruleText: link.ruleText ?? '',
					sortOrder: link.sortOrder
				}))
			})),
			isActive: template.isActive,
			sortOrder: template.sortOrder,
			createdAt: template.createdAt.toISOString(),
			updatedAt: template.updatedAt.toISOString()
		};
	}
}
