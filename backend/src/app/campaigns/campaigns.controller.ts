import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	UseGuards
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { InviteCampaignMemberDto } from './dto/invite-campaign-member.dto';
import { UpdateCampaignSettingsDto } from './dto/update-campaign-settings.dto';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
	constructor(private readonly campaignsService: CampaignsService) {}

	@Get()
	getCampaigns(@CurrentUser() user: AuthenticatedUser) {
		return this.campaignsService.getCampaigns(user.id);
	}

	@Post()
	createCampaign(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateCampaignDto
	) {
		return this.campaignsService.createCampaign(user.id, dto);
	}

	@Post(':id/invitations')
	inviteMember(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: InviteCampaignMemberDto
	) {
		return this.campaignsService.inviteMember(id, user.id, dto);
	}

	@Patch(':id/settings')
	updateSettings(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateCampaignSettingsDto
	) {
		return this.campaignsService.updateSettings(id, user.id, dto);
	}

	@Post(':id/accept')
	acceptInvitation(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		return this.campaignsService.acceptInvitation(id, user.id);
	}

	@Delete(':id/members/me')
	leaveCampaign(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		return this.campaignsService.leaveCampaign(id, user.id);
	}
}
