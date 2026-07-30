import { IsInt, IsUUID, Min } from 'class-validator';

export class SkipCombatTurnDto {
	@IsUUID()
	requestId!: string;

	@IsInt()
	@Min(0)
	expectedVersion!: number;
}
