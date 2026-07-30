import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { PrismaService } from '../../prisma/prisma.service';
import { SpellRuntimePreviewRepositoryPort } from '../application/spell-runtime-preview-repository.port';

const runtimeSpellSelect = {
	id: true,
	name: true,
	action: { select: { id: true, name: true } },
	essence: {
		select: {
			id: true,
			name: true,
			skillLinks: {
				select: {
					skillId: true,
					skill: {
						select: {
							id: true,
							name: true,
							sortOrder: true,
							systemValueId: true
						}
					}
				}
			},
			damageTypeLinks: {
				select: {
					damageTypeId: true,
					damageType: { select: { id: true, name: true, sortOrder: true } }
				}
			},
			conditionLinks: {
				select: {
					conditionId: true,
					condition: { select: { id: true, name: true, sortOrder: true } }
				}
			}
		}
	},
	gesture: { select: { id: true, name: true } },
	targetConfigs: true,
	mechanicBlocks: {
		select: {
			id: true,
			parameterValues: true,
			config: true,
			isActive: true,
			sortOrder: true,
			mechanic: {
				select: {
					id: true,
					name: true,
					parameters: {
						select: {
							id: true,
							slug: true,
							name: true,
							kind: true,
							defaultMode: true,
							staticSkillId: true,
							staticDamageTypeId: true,
							staticConditionId: true,
							staticSystemValueId: true,
							staticTextValue: true,
							sortOrder: true
						},
						orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
					},
					actions: {
						select: {
							id: true,
							name: true,
							kind: true,
							config: true,
							isActive: true,
							sortOrder: true
						},
						orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
					}
				}
			}
		},
		orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
	}
} satisfies Prisma.SpellSelect;

@Injectable()
export class PrismaSpellRuntimePreviewRepository
	implements SpellRuntimePreviewRepositoryPort
{
	constructor(private readonly prisma: PrismaService) {}

	findSpell(spellId: string) {
		return this.prisma.spell.findUnique({
			select: runtimeSpellSelect,
			where: { id: spellId }
		});
	}

	findActiveMechanics() {
		return this.prisma.spellMechanic.findMany({
			select: runtimeSpellSelect.mechanicBlocks.select.mechanic.select,
			where: { isActive: true }
		});
	}
}
