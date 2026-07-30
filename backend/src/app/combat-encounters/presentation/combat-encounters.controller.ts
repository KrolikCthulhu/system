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
import { AuthenticatedUser } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
	AddCreatureParticipantUseCase,
	AddPlayerCharacterParticipantUseCase,
	CreateCombatEncounterUseCase,
	GetCombatEncounterUseCase,
	GetKnockdownSizeRuleUseCase,
	ListCampaignCombatEncountersUseCase,
	UpdateCombatEncounterUseCase,
	UpdateCombatParticipantUseCase
} from '../application/combat-encounter-query.use-cases';
import { ExecuteCombatActionUseCase } from '../application/execute-combat-action.use-case';
import { ResolveCombatDefenseUseCase } from '../application/resolve-combat-defense.use-case';
import { ResolveDeclaredCombatActionUseCase } from '../application/resolve-declared-combat-action.use-case';
import { SkipCombatTurnUseCase } from '../application/skip-combat-turn.use-case';
import { AddCreatureParticipantDto } from '../dto/add-creature-participant.dto';
import { AddPlayerCharacterParticipantDto } from '../dto/add-player-character-participant.dto';
import { CreateCombatEncounterDto } from '../dto/create-combat-encounter.dto';
import {
	ExecuteCombatActionDto,
	ResolveCombatDefenseDto,
	ResolveDeclaredCombatActionDto
} from '../dto/execute-combat-action.dto';
import { KnockdownSizeRuleQueryDto } from '../dto/knockdown-size-rule-query.dto';
import { SkipCombatTurnDto } from '../dto/skip-combat-turn.dto';
import { UpdateCombatEncounterDto } from '../dto/update-combat-encounter.dto';
import { UpdateCombatParticipantDto } from '../dto/update-combat-participant.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CombatEncountersController {
	constructor(
		private readonly listCampaignEncounters: ListCampaignCombatEncountersUseCase,
		private readonly createEncounter: CreateCombatEncounterUseCase,
		private readonly getEncounterUseCase: GetCombatEncounterUseCase,
		private readonly updateEncounterUseCase: UpdateCombatEncounterUseCase,
		private readonly getKnockdownSizeRuleUseCase: GetKnockdownSizeRuleUseCase,
		private readonly addPlayerCharacterUseCase: AddPlayerCharacterParticipantUseCase,
		private readonly addCreatureUseCase: AddCreatureParticipantUseCase,
		private readonly updateParticipantUseCase: UpdateCombatParticipantUseCase,
		private readonly skipCombatTurnUseCase: SkipCombatTurnUseCase,
		private readonly executeCombatActionUseCase: ExecuteCombatActionUseCase,
		private readonly resolveDeclaredCombatActionUseCase: ResolveDeclaredCombatActionUseCase,
		private readonly resolveCombatDefenseUseCase: ResolveCombatDefenseUseCase
	) {}

	@Get('campaigns/:campaignId/combat-encounters')
	getCampaignEncounters(
		@CurrentUser() user: AuthenticatedUser,
		@Param('campaignId') campaignId: string
	) {
		return this.listCampaignEncounters.execute(campaignId, user.id);
	}

	@Post('campaigns/:campaignId/combat-encounters')
	createCampaignEncounter(
		@CurrentUser() user: AuthenticatedUser,
		@Param('campaignId') campaignId: string,
		@Body() dto: CreateCombatEncounterDto
	) {
		return this.createEncounter.execute(campaignId, user.id, dto);
	}

	@Get('combat-encounters/:id')
	getEncounter(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		return this.getEncounterUseCase.execute(id, user.id);
	}

	@Patch('combat-encounters/:id')
	updateEncounter(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateCombatEncounterDto
	) {
		return this.updateEncounterUseCase.execute(id, user.id, dto);
	}

	@Get('combat-encounters/:id/rules/knockdown-size')
	getKnockdownSizeRule(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Query() query: KnockdownSizeRuleQueryDto
	) {
		return this.getKnockdownSizeRuleUseCase.execute(id, user.id, query);
	}

	@Post('combat-encounters/:id/player-characters')
	addPlayerCharacter(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: AddPlayerCharacterParticipantDto
	) {
		return this.addPlayerCharacterUseCase.execute(id, user.id, dto);
	}

	@Post('combat-encounters/:id/creatures')
	addCreature(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: AddCreatureParticipantDto
	) {
		return this.addCreatureUseCase.execute(id, user.id, dto);
	}

	@Patch('combat-encounters/:id/participants/:participantId')
	updateParticipant(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Param('participantId') participantId: string,
		@Body() dto: UpdateCombatParticipantDto
	) {
		return this.updateParticipantUseCase.execute(
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
		@Param('participantId') participantId: string,
		@Body() dto: SkipCombatTurnDto
	) {
		return this.skipCombatTurnUseCase.execute(id, participantId, user.id, dto);
	}

	@Post('combat-encounters/:id/actions/execute')
	executeAction(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: ExecuteCombatActionDto
	) {
		return this.executeCombatActionUseCase.execute(id, user.id, dto);
	}

	@Post('combat-encounters/:id/actions/resolve-declared')
	resolveDeclaredAction(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: ResolveDeclaredCombatActionDto
	) {
		return this.resolveDeclaredCombatActionUseCase.execute(id, user.id, dto);
	}

	@Post('combat-encounters/:id/defenses/resolve')
	resolveDefense(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: ResolveCombatDefenseDto
	) {
		return this.resolveCombatDefenseUseCase.execute(id, user.id, dto);
	}
}
