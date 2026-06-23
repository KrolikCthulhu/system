import { IsObject, IsOptional } from 'class-validator';

export class ExecuteSpellRuntimePreviewDto {
	@IsOptional()
	@IsObject()
	inputValues?: Record<string, unknown>;

	@IsOptional()
	@IsObject()
	rollResults?: Record<string, unknown>;

	@IsOptional()
	@IsObject()
	choiceResults?: Record<string, unknown>;
}
