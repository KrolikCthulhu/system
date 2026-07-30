import { BadRequestException, Injectable } from '@nestjs/common';
import { ExecuteSpellRuntimePreviewUseCase } from './application/execute-spell-runtime-preview.use-case';
import { ExecuteSpellRuntimePreviewDto } from './dto/execute-spell-runtime-preview.dto';

@Injectable()
export class SpellRuntimePreviewService {
	constructor(
		private readonly executeSpellRuntimePreview: ExecuteSpellRuntimePreviewUseCase
	) {}

	async executePreview(spellId: string, dto: ExecuteSpellRuntimePreviewDto) {
		const result = await this.executeSpellRuntimePreview.execute(spellId, dto);

		if (result.ok === false) {
			throw new BadRequestException({
				code: result.error.code,
				message: result.error.message
			});
		}

		return result.value;
	}
}
