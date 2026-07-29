import { IsIn, IsOptional } from 'class-validator';

export class UpdateCombatEncounterDto {
	@IsOptional()
	@IsIn(['DRAFT', 'ACTIVE', 'COMPLETED'])
	status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
}
