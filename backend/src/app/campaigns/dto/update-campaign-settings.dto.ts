import { IsIn } from 'class-validator';

export class UpdateCampaignSettingsDto {
	@IsIn(['delayed', 'immediate'])
	combatActionResolutionMode!: 'delayed' | 'immediate';
}
