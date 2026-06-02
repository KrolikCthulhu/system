import { IsObject, IsOptional } from 'class-validator';

export class UpdateCharacterSheetSandboxDraftDto {
	@IsOptional()
	@IsObject()
	inputValues?: Record<string, number>;
}
