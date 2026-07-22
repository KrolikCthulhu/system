import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class RollPlayerCharacterSkillDto {
	@IsUUID()
	skillId!: string;

	@IsOptional()
	@IsObject()
	inputValues?: Record<string, number>;
}
