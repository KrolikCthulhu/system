import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreatureTierSkillDto {
	@IsUUID()
	skillId!: string;

	@IsInt()
	@Min(0)
	@Max(6)
	level!: number;
}
