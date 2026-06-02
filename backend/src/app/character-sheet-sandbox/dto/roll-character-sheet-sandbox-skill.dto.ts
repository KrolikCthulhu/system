import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class RollCharacterSheetSandboxSkillDto {
	@IsUUID()
	skillId!: string;

	@IsOptional()
	@IsObject()
	inputValues?: Record<string, number>;
}
