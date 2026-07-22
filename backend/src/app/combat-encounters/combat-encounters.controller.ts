import {
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Post,
	UseGuards
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CombatEncountersService } from './combat-encounters.service';
import { AddCreatureParticipantDto } from './dto/add-creature-participant.dto';
import { AddPlayerCharacterParticipantDto } from './dto/add-player-character-participant.dto';
import { CreateCombatEncounterDto } from './dto/create-combat-encounter.dto';
import { UpdateCombatParticipantDto } from './dto/update-combat-participant.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CombatEncountersController {
	constructor(private readonly encountersService: CombatEncountersService) {}

	@Get('campaigns/:campaignId/combat-encounters')
	getCampaignEncounters(
		@CurrentUser() user: AuthenticatedUser,
		@Param('campaignId') campaignId: string
	) {
		return this.encountersService.getCampaignEncounters(campaignId, user.id);
	}

	@Post('campaigns/:campaignId/combat-encounters')
	createEncounter(
		@CurrentUser() user: AuthenticatedUser,
		@Param('campaignId') campaignId: string,
		@Body() dto: CreateCombatEncounterDto
	) {
		return this.encountersService.createEncounter(campaignId, user.id, dto);
	}

	@Get('combat-encounters/:id')
	getEncounter(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		return this.encountersService.getEncounter(id, user.id);
	}

	@Post('combat-encounters/:id/player-characters')
	addPlayerCharacter(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: AddPlayerCharacterParticipantDto
	) {
		return this.encountersService.addPlayerCharacter(id, user.id, dto);
	}

	@Post('combat-encounters/:id/creatures')
	addCreature(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: AddCreatureParticipantDto
	) {
		return this.encountersService.addCreature(id, user.id, dto);
	}

	@Patch('combat-encounters/:id/participants/:participantId')
	updateParticipant(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Param('participantId') participantId: string,
		@Body() dto: UpdateCombatParticipantDto
	) {
		return this.encountersService.updateParticipant(
			id,
			participantId,
			user.id,
			dto
		);
	}
}
