import { IsObject, IsOptional } from 'class-validator';

export class UpdatePlayerCharacterSheetDto {
	@IsOptional()
	@IsObject()
	inputValues?: Record<string, number>;
}
