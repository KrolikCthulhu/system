import { IsUUID } from 'class-validator';

export class KnockdownSizeRuleQueryDto {
	@IsUUID()
	attackerParticipantId!: string;

	@IsUUID()
	targetParticipantId!: string;
}
