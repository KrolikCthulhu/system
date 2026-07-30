import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ExecuteSpellRuntimePreviewDto } from '../dto/execute-spell-runtime-preview.dto';
import { SpellRuntimePreviewEngine } from '../domain/spell-runtime-preview.engine';
import {
	SPELL_RUNTIME_PREVIEW_REPOSITORY,
	SpellRuntimePreviewRepositoryPort
} from './spell-runtime-preview-repository.port';

@Injectable()
export class ExecuteSpellRuntimePreviewUseCase {
	constructor(
		@Inject(SPELL_RUNTIME_PREVIEW_REPOSITORY)
		private readonly repository: SpellRuntimePreviewRepositoryPort,
		private readonly engine: SpellRuntimePreviewEngine
	) {}

	async execute(spellId: string, dto: ExecuteSpellRuntimePreviewDto) {
		const spell = await this.repository.findSpell(spellId);

		if (!spell) {
			throw new NotFoundException('Заклинание не найдено.');
		}

		const mechanics = await this.repository.findActiveMechanics();

		return this.engine.execute({
			spell,
			mechanics,
			inputValues: dto.inputValues,
			rollResults: dto.rollResults,
			choiceResults: dto.choiceResults
		});
	}
}
