import {
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Post,
	Query,
	UseGuards
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CombatEncountersService } from './combat-encounters.service';
import { AddCreatureParticipantDto } from './dto/add-creature-participant.dto';
import { AddPlayerCharacterParticipantDto } from './dto/add-player-character-participant.dto';
import { CreateCombatEncounterDto } from './dto/create-combat-encounter.dto';
import {
	ExecuteCombatActionDto,
	ResolveCombatDefenseDto,
	ResolveDeclaredCombatActionDto
} from './dto/execute-combat-action.dto';
import { KnockdownSizeRuleQueryDto } from './dto/knockdown-size-rule-query.dto';
import { UpdateCombatEncounterDto } from './dto/update-combat-encounter.dto';
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

	@Patch('combat-encounters/:id')
	updateEncounter(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateCombatEncounterDto
	) {
		return this.encountersService.updateEncounter(id, user.id, dto);
	}

	@Get('combat-encounters/:id/rules/knockdown-size')
	getKnockdownSizeRule(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Query() query: KnockdownSizeRuleQueryDto
	) {
		return this.encountersService.getKnockdownSizeRule(id, user.id, query);
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

	@Post('combat-encounters/:id/participants/:participantId/skip-turn')
	skipParticipantTurn(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Param('participantId') participantId: string
	) {
		return this.encountersService.skipParticipantTurn(
			id,
			participantId,
			user.id
		);
	}

	@Post('combat-encounters/:id/actions/execute')
	executeAction(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: ExecuteCombatActionDto
	) {
		return this.encountersService.executeAction(id, user.id, dto);
	}

	@Post('combat-encounters/:id/actions/resolve-declared')
	resolveDeclaredAction(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: ResolveDeclaredCombatActionDto
	) {
		return this.encountersService.resolveDeclaredAction(id, user.id, dto);
	}

	@Post('combat-encounters/:id/defenses/resolve')
	resolveDefense(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: ResolveCombatDefenseDto
	) {
		return this.encountersService.resolveDefense(id, user.id, dto);
	}
}
