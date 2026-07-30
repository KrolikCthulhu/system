import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CharacterSheetRuntimeModule } from '../character-sheet/character-sheet-runtime.module';
import { GameEventsModule } from '../game-events/game-events.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
	AddCreatureParticipantUseCase,
	AddPlayerCharacterParticipantUseCase,
	CreateCombatEncounterUseCase,
	GetCombatEncounterUseCase,
	GetKnockdownSizeRuleUseCase,
	ListCampaignCombatEncountersUseCase,
	UpdateCombatEncounterUseCase,
	UpdateCombatParticipantUseCase
} from './application/combat-encounter-query.use-cases';
import { COMBAT_ENCOUNTER_REPOSITORY } from './application/combat-encounter-repository.port';
import { COMBAT_PARTICIPANT_REPOSITORY } from './application/combat-participant-repository.port';
import { EXECUTE_COMBAT_ACTION_INFRASTRUCTURE } from './application/execute-combat-action.port';
import { ExecuteCombatActionUseCase } from './application/execute-combat-action.use-case';
import { RESOLVE_COMBAT_DEFENSE_INFRASTRUCTURE } from './application/resolve-combat-defense.port';
import { ResolveCombatDefenseUseCase } from './application/resolve-combat-defense.use-case';
import { RESOLVE_DECLARED_COMBAT_ACTION_INFRASTRUCTURE } from './application/resolve-declared-combat-action.port';
import { ResolveDeclaredCombatActionUseCase } from './application/resolve-declared-combat-action.use-case';
import { SKIP_COMBAT_TURN_INFRASTRUCTURE } from './application/skip-combat-turn.port';
import { SkipCombatTurnUseCase } from './application/skip-combat-turn.use-case';
import { CombatActionCheckRuntimeService } from './combat-action-check-runtime.service';
import { CombatEncounterEffectRuntimeService } from './combat-encounter-effect-runtime.service';
import { CombatEncounterHttpRateLimitService } from './combat-encounter-http-rate-limit.service';
import { CombatEncounterPolicyService } from './combat-encounter-policy.service';
import { CombatEncounterRealtimeService } from './combat-encounter-realtime.service';
import { CombatEncounterSocketRateLimitService } from './combat-encounter-socket-rate-limit.service';
import { CombatEncounterViewService } from './combat-encounter-view.service';
import { CombatActionCheckEngine } from './domain/combat-action-check.engine';
import { CombatActionEffectEngine } from './domain/combat-action-effect.engine';
import { CombatEncounterRuntimeService } from './domain/combat-encounter-runtime.service';
import { CombatCommandRepository } from './infrastructure/combat-command.repository';
import { CombatEncounterRepository } from './infrastructure/combat-encounter.repository';
import { CombatEventRepository } from './infrastructure/combat-event.repository';
import { CombatParticipantRepository } from './infrastructure/combat-participant.repository';
import {
	ExecuteCombatActionInfrastructureAdapter,
	ResolveCombatDefenseInfrastructureAdapter,
	ResolveDeclaredCombatActionInfrastructureAdapter,
	SkipCombatTurnInfrastructureAdapter
} from './infrastructure/combat-encounter-action-infrastructure.adapters';
import { CombatEncountersController } from './presentation/combat-encounters.controller';
import { CombatEncountersGateway } from './presentation/combat-encounters.gateway';

@Module({
	imports: [
		PrismaModule,
		GameEventsModule,
		AuthModule,
		CharacterSheetRuntimeModule
	],
	controllers: [CombatEncountersController],
	providers: [
		CombatActionCheckEngine,
		CombatActionCheckRuntimeService,
		CombatActionEffectEngine,
		CombatEncounterEffectRuntimeService,
		CombatEncounterHttpRateLimitService,
		CombatEncounterPolicyService,
		CombatEncounterRuntimeService,
		CombatEncounterViewService,
		CombatCommandRepository,
		CombatEncounterRepository,
		CombatEventRepository,
		CombatParticipantRepository,
		SkipCombatTurnInfrastructureAdapter,
		ExecuteCombatActionInfrastructureAdapter,
		ResolveDeclaredCombatActionInfrastructureAdapter,
		ResolveCombatDefenseInfrastructureAdapter,
		{
			provide: COMBAT_ENCOUNTER_REPOSITORY,
			useExisting: CombatEncounterRepository
		},
		{
			provide: COMBAT_PARTICIPANT_REPOSITORY,
			useExisting: CombatParticipantRepository
		},
		{
			provide: SKIP_COMBAT_TURN_INFRASTRUCTURE,
			useExisting: SkipCombatTurnInfrastructureAdapter
		},
		{
			provide: EXECUTE_COMBAT_ACTION_INFRASTRUCTURE,
			useExisting: ExecuteCombatActionInfrastructureAdapter
		},
		{
			provide: RESOLVE_DECLARED_COMBAT_ACTION_INFRASTRUCTURE,
			useExisting: ResolveDeclaredCombatActionInfrastructureAdapter
		},
		{
			provide: RESOLVE_COMBAT_DEFENSE_INFRASTRUCTURE,
			useExisting: ResolveCombatDefenseInfrastructureAdapter
		},
		ListCampaignCombatEncountersUseCase,
		CreateCombatEncounterUseCase,
		GetCombatEncounterUseCase,
		UpdateCombatEncounterUseCase,
		GetKnockdownSizeRuleUseCase,
		AddPlayerCharacterParticipantUseCase,
		AddCreatureParticipantUseCase,
		UpdateCombatParticipantUseCase,
		SkipCombatTurnUseCase,
		ExecuteCombatActionUseCase,
		ResolveDeclaredCombatActionUseCase,
		ResolveCombatDefenseUseCase,
		CombatEncountersGateway,
		CombatEncounterRealtimeService,
		CombatEncounterSocketRateLimitService
	]
})
export class CombatEncountersModule {}
