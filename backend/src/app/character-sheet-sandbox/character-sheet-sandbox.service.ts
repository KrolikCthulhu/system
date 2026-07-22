import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { CharacterSheetRuntimeService } from '../character-sheet/character-sheet-runtime.service';
import { PrismaService } from '../prisma/prisma.service';
import { RollCharacterSheetSandboxSkillDto } from './dto/roll-character-sheet-sandbox-skill.dto';
import { UpdateCharacterSheetSandboxDraftDto } from './dto/update-character-sheet-sandbox-draft.dto';

const ADMIN_DRAFT_KEY = 'admin';

@Injectable()
export class CharacterSheetSandboxService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly runtime: CharacterSheetRuntimeService
	) {}

	async getDraft() {
		const draft = await this.prisma.characterSheetSandboxDraft.findUnique({
			where: { key: ADMIN_DRAFT_KEY }
		});

		return {
			inputValues: this.runtime.normalizeInputValues(draft?.inputValues ?? {})
		};
	}

	async updateDraft(dto: UpdateCharacterSheetSandboxDraftDto) {
		const inputValues = this.runtime.normalizeInputValues(
			dto.inputValues ?? {}
		);
		const draft = await this.persistDraft(inputValues);

		return {
			inputValues: this.runtime.normalizeInputValues(draft.inputValues)
		};
	}

	async rollSkill(dto: RollCharacterSheetSandboxSkillDto) {
		const result = await this.runtime.rollSkill(
			dto.skillId,
			dto.inputValues ?? {}
		);
		const draft = await this.persistDraft(result.inputValues);

		return {
			inputValues: this.runtime.normalizeInputValues(draft.inputValues),
			roll: result.roll
		};
	}

	private async persistDraft(inputValues: Record<string, number>) {
		return this.prisma.characterSheetSandboxDraft.upsert({
			where: { key: ADMIN_DRAFT_KEY },
			update: {
				inputValues
			},
			create: {
				key: ADMIN_DRAFT_KEY,
				inputValues
			}
		});
	}
}
