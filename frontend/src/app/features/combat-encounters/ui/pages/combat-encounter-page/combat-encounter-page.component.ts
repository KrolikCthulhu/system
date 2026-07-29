import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	computed,
	inject,
	signal
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { EMPTY, catchError, finalize, forkJoin } from 'rxjs';
import { PLAYER_CHARACTERS_REPOSITORY } from '../../../../player-characters/data/player-characters-repository.port';
import { AuthSessionService } from '../../../../auth/state/auth-session.service';
import { PlayerCharacterSummary } from '../../../../player-characters/domain/player-characters.models';
import { CREATURES_REPOSITORY } from '../../../../creatures/data/creatures-repository.port';
import {
	CreaturePublicSummary,
	CreaturePublicTierSummary,
	CreatureTierAction
} from '../../../../creatures/domain/creatures.models';
import { COMBAT_ENCOUNTERS_REPOSITORY } from '../../../data/combat-encounters-repository.port';
import { CombatEncounterRealtimeService } from '../../../data/combat-encounter-realtime.service';
import {
	CombatEncounter,
	CombatEncounterDeclaredAction,
	CombatEncounterDefenseRequest,
	CombatEncounterEvent,
	CombatEncounterParticipantCondition,
	CombatEncounterParticipant
} from '../../../domain/combat-encounters.models';

interface SelectOption<TValue extends string> {
	label: string;
	value: TValue;
}

interface ParticipantDraft {
	sceneName: string;
	currentHealth: number;
	currentPotential: number;
	initiative: number | null;
	isActive: boolean;
}

interface EncounterActionGroup {
	sourceName: string;
	profileName: string;
	rangeText: string;
	costText: string;
	actions: CreatureTierAction[];
}

interface EncounterActionSections {
	attacks: EncounterActionGroup[];
	abilities: CreatureTierAction[];
	contextualActions: CreatureTierAction[];
}

interface RollSummary {
	skillName: string;
	characteristicName: string;
	dice: number[];
	successes: number;
}

interface EventPayload {
	actionName?: string;
	declaredAtPotential?: number;
	resolveAtPotential?: number;
	fromPotential?: number;
	toPotential?: number;
	attackRoll?: RollSummary | null;
	defenseRoll?: RollSummary | null;
	defense?: {
		mode?: string;
		label?: string;
		skillName?: string | null;
	} | null;
	result?: {
		cleanSuccesses?: number;
	};
	effects?: unknown[];
}

@Component({
	selector: 'app-combat-encounter-page',
	imports: [
		Button,
		DatePipe,
		FormsModule,
		InputNumber,
		InputText,
		RouterLink,
		Select,
		Tag
	],
	templateUrl: './combat-encounter-page.component.html',
	styleUrl: './combat-encounter-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CombatEncounterPageComponent {
	private readonly destroyRef = inject(DestroyRef);
	private readonly route = inject(ActivatedRoute);
	private readonly encountersRepository = inject(COMBAT_ENCOUNTERS_REPOSITORY);
	private readonly realtime = inject(CombatEncounterRealtimeService);
	private readonly authSession = inject(AuthSessionService);
	private readonly charactersRepository = inject(PLAYER_CHARACTERS_REPOSITORY);
	private readonly creaturesRepository = inject(CREATURES_REPOSITORY);

	protected readonly encounter = signal<CombatEncounter | null>(null);
	protected readonly characters = signal<PlayerCharacterSummary[]>([]);
	protected readonly creatures = signal<CreaturePublicSummary[]>([]);
	protected readonly participantDrafts = signal<
		Record<string, ParticipantDraft>
	>({});
	protected readonly selectedCharacterId = signal<string | null>(null);
	protected readonly selectedCreatureId = signal<string | null>(null);
	protected readonly selectedCreatureTierId = signal<string | null>(null);
	protected readonly creatureSceneName = signal('');
	protected readonly creatureCount = signal(1);
	protected readonly loading = signal(true);
	protected readonly addingCharacter = signal(false);
	protected readonly addingCreature = signal(false);
	protected readonly savingParticipantId = signal<string | null>(null);
	protected readonly executingActionKey = signal<string | null>(null);
	protected readonly skippingParticipantId = signal<string | null>(null);
	protected readonly resolvingDeclaredActionId = signal<string | null>(null);
	protected readonly resolvingDefenseRequestId = signal<string | null>(null);
	protected readonly updatingEncounterStatus = signal(false);
	protected readonly combatLogCollapsed = signal(false);
	protected readonly participantTargetDrafts = signal<
		Record<string, string | null>
	>({});
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly activeParticipants = computed(() =>
		(this.encounter()?.participants ?? []).filter(
			participant => participant.isActive
		)
	);
	protected readonly isCurrentUserGm = computed(
		() => this.encounter()?.currentUserRole === 'GM'
	);
	protected readonly isCombatActive = computed(
		() => this.encounter()?.status === 'ACTIVE'
	);
	protected readonly isCombatStarted = computed(
		() => this.encounter()?.status !== 'DRAFT'
	);
	protected readonly potentialQueue = computed(() =>
		[...this.activeParticipants()].sort(
			(left, right) =>
				right.currentPotential - left.currentPotential ||
				left.sortOrder - right.sortOrder
		)
	);
	protected readonly highestCurrentPotential = computed(() =>
		Math.max(
			0,
			...this.activeParticipants().map(
				participant => participant.currentPotential
			)
		)
	);
	protected readonly pendingDeclaredActions = computed(() =>
		(this.encounter()?.declaredActions ?? []).filter(
			action =>
				action.status === 'pending' || action.status === 'waiting_defense'
		)
	);
	protected readonly dueDeclaredActions = computed(() =>
		this.pendingDeclaredActions()
			.filter(
				action =>
					action.status === 'pending' &&
					this.highestCurrentPotential() <= action.resolveAtPotential
			)
			.sort(
				(left, right) =>
					right.resolveAtPotential - left.resolveAtPotential ||
					left.createdAt.localeCompare(right.createdAt)
			)
	);
	protected readonly activeActor = computed(() =>
		this.dueDeclaredActions().length
			? null
			: (this.potentialQueue().find(
					participant => participant.currentPotential > 0
				) ?? null)
	);
	protected readonly displayedParticipants = computed(() => {
		const activeActorId = this.activeActor()?.id;
		const participants = this.activeParticipants();

		if (!activeActorId || !this.isCombatActive()) {
			return participants;
		}

		return [
			...participants.filter(participant => participant.id === activeActorId),
			...participants.filter(participant => participant.id !== activeActorId)
		];
	});
	protected readonly visibleDefenseRequests = computed(() => {
		const encounter = this.encounter();

		if (!encounter) {
			return [];
		}

		return encounter.defenseRequests.filter(request => {
			const target = this.participantById(request.targetParticipantId);
			return (
				request.status === 'pending' &&
				(this.isCurrentUserGm() || this.isCurrentUserParticipantOwner(target))
			);
		});
	});
	protected readonly characterOptions = computed<SelectOption<string>[]>(() =>
		this.characters().map(character => ({
			label: `${character.name} · ${character.owner.displayUsername}`,
			value: character.id
		}))
	);
	protected readonly creatureOptions = computed<SelectOption<string>[]>(() =>
		this.creatures()
			.filter(creature => creature.isActive)
			.map(creature => ({
				label: creature.name,
				value: creature.id
			}))
	);
	protected readonly selectedCreature = computed(() => {
		const id = this.selectedCreatureId();
		return id
			? (this.creatures().find(creature => creature.id === id) ?? null)
			: null;
	});
	protected readonly creatureTierOptions = computed<SelectOption<string>[]>(
		() =>
			(this.selectedCreature()?.tiers ?? [])
				.filter(tier => tier.isActive)
				.map(tier => ({
					label: `${tier.tier}: ${tier.name} · ${tier.size?.name ?? 'Средний'} · ${tier.hp} здоровья`,
					value: tier.id
				}))
	);

	protected readonly encounterStatusText = computed(() => {
		const encounter = this.encounter();

		if (!encounter) {
			return 'Столкновение';
		}

		if (encounter.status === 'DRAFT') {
			return 'Подготовка';
		}

		if (encounter.status === 'COMPLETED') {
			return 'Завершено';
		}

		const waiting = this.visibleDefenseRequests()[0];

		if (waiting) {
			const target = this.participantById(waiting.targetParticipantId);
			return `Бой · ожидается защита ${target?.sceneName ?? 'цели'}`;
		}

		return 'Бой';
	});

	constructor() {
		const id = this.route.snapshot.paramMap.get('id');

		if (id) {
			this.loadEncounter(id);
			this.watchEncounter(id);
		} else {
			this.loading.set(false);
			this.errorMessage.set('Столкновение не найдено.');
		}
	}

	protected addSelectedCharacter() {
		const encounter = this.encounter();
		const playerCharacterId = this.selectedCharacterId();

		if (!encounter || !playerCharacterId) {
			this.errorMessage.set('Выберите персонажа.');
			return;
		}

		this.addingCharacter.set(true);
		this.errorMessage.set(null);

		this.encountersRepository
			.addPlayerCharacter(encounter.id, { playerCharacterId })
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось добавить персонажа.'
					);
					return EMPTY;
				}),
				finalize(() => this.addingCharacter.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(updatedEncounter => {
				this.setEncounter(updatedEncounter);
				this.selectedCharacterId.set(null);
			});
	}

	protected addSelectedCreature() {
		const encounter = this.encounter();
		const creatureId = this.selectedCreatureId();

		if (!encounter || !creatureId) {
			this.errorMessage.set('Выберите существо.');
			return;
		}

		this.addingCreature.set(true);
		this.errorMessage.set(null);

		this.encountersRepository
			.addCreature(encounter.id, {
				creatureId,
				creatureTierId: this.selectedCreatureTierId() ?? undefined,
				sceneName: this.creatureSceneName().trim() || undefined,
				count: this.creatureCount()
			})
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось добавить существо.'
					);
					return EMPTY;
				}),
				finalize(() => this.addingCreature.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(updatedEncounter => {
				this.setEncounter(updatedEncounter);
				this.creatureSceneName.set('');
				this.creatureCount.set(1);
			});
	}

	protected updateSelectedCreature(creatureId: string | null) {
		this.selectedCreatureId.set(creatureId);
		this.selectedCreatureTierId.set(
			this.firstActiveTier(creatureId)?.id ?? null
		);
	}

	protected getParticipantDraft(participant: CombatEncounterParticipant) {
		return (
			this.participantDrafts()[participant.id] ??
			toParticipantDraft(participant)
		);
	}

	protected patchParticipantDraft(
		participantId: string,
		patch: Partial<ParticipantDraft>
	) {
		this.participantDrafts.update(drafts => ({
			...drafts,
			[participantId]: {
				...drafts[participantId],
				...patch
			}
		}));
	}

	protected saveParticipant(participant: CombatEncounterParticipant) {
		const encounter = this.encounter();

		if (!encounter) {
			return;
		}

		const draft = this.getParticipantDraft(participant);
		this.savingParticipantId.set(participant.id);
		this.errorMessage.set(null);

		this.encountersRepository
			.updateParticipant(encounter.id, participant.id, draft)
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось обновить участника.'
					);
					return EMPTY;
				}),
				finalize(() => this.savingParticipantId.set(null)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(updatedEncounter => this.setEncounter(updatedEncounter));
	}

	protected updateEncounterStatus(status: 'DRAFT' | 'ACTIVE' | 'COMPLETED') {
		const encounter = this.encounter();

		if (!encounter || !this.isCurrentUserGm()) {
			return;
		}

		this.updatingEncounterStatus.set(true);
		this.errorMessage.set(null);

		this.encountersRepository
			.updateEncounter(encounter.id, { status })
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось изменить состояние столкновения.'
					);
					return EMPTY;
				}),
				finalize(() => this.updatingEncounterStatus.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(updatedEncounter => this.setEncounter(updatedEncounter));
	}

	protected adjustParticipantValue(
		participant: CombatEncounterParticipant,
		field: 'currentHealth' | 'currentPotential',
		delta: number
	) {
		const encounter = this.encounter();

		if (!encounter || !this.isCurrentUserGm()) {
			return;
		}

		this.savingParticipantId.set(participant.id);
		this.errorMessage.set(null);

		this.encountersRepository
			.updateParticipant(encounter.id, participant.id, {
				[field]: Math.max(0, participant[field] + delta)
			})
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось обновить участника.'
					);
					return EMPTY;
				}),
				finalize(() => this.savingParticipantId.set(null)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(updatedEncounter => this.setEncounter(updatedEncounter));
	}

	protected participantKindLabel(participant: CombatEncounterParticipant) {
		return participant.kind === 'PLAYER_CHARACTER' ? 'Персонаж' : 'Существо';
	}

	protected conditionNames(participant: CombatEncounterParticipant) {
		return participant.conditions
			.map(condition => this.participantConditionLabel(condition))
			.join(', ');
	}

	protected participantConditionLabel(
		condition: CombatEncounterParticipantCondition
	) {
		const label =
			condition.displayName ||
			condition.condition.name ||
			condition.condition.slug;

		return condition.level > 1 ? `${label} ${condition.level}` : label;
	}

	protected actionSections(
		participant: CombatEncounterParticipant
	): EncounterActionSections {
		const actions = this.canShowParticipantActions(participant)
			? this.participantActions(participant)
			: [];

		return {
			attacks: this.attackGroups(participant, actions),
			abilities: actions.filter(action => action.kind === 'active_ability'),
			contextualActions: actions.filter(
				action => action.kind === 'condition_action'
			)
		};
	}

	protected participantActions(participant: CombatEncounterParticipant) {
		const actions = [
			...(participant.creature?.actions ?? []),
			...(participant.creatureTier?.actions ?? []),
			...(participant.creatureTier?.actionOverrides ?? [])
		];
		const bySlug = actions.reduce<Map<string, CreatureTierAction>>(
			(result, action) => result.set(action.slug, action),
			new Map<string, CreatureTierAction>()
		);

		return [...bySlug.values()]
			.filter(action => action.isActive && action.kind !== 'passive')
			.sort((first, second) => first.sortOrder - second.sortOrder);
	}

	protected canShowParticipantActions(participant: CombatEncounterParticipant) {
		if (!this.isCombatActive()) {
			return false;
		}

		if (participant.kind === 'CREATURE') {
			return this.isCurrentUserGm();
		}

		return this.isCurrentUserParticipantOwner(participant);
	}

	protected canSkipParticipantTurn(participant: CombatEncounterParticipant) {
		return (
			this.isCombatActive() &&
			this.activeActor()?.id === participant.id &&
			this.canShowParticipantActions(participant)
		);
	}

	protected attackGroups(
		participant: CombatEncounterParticipant,
		actions: CreatureTierAction[]
	) {
		const groups = new Map<string, EncounterActionGroup>();

		for (const action of actions.filter(item => item.kind === 'attack')) {
			const sourceName = action.source?.name || 'Источник не задан';
			const group = groups.get(sourceName) ?? {
				sourceName,
				profileName: action.source?.profileName ?? '',
				rangeText: this.actionRangeText(participant, action),
				costText: this.actionCostText(action),
				actions: []
			};
			group.actions.push(action);
			groups.set(sourceName, group);
		}

		return [...groups.values()];
	}

	protected targetOptions(
		actor: CombatEncounterParticipant
	): SelectOption<string>[] {
		return this.activeParticipants()
			.filter(participant => participant.id !== actor.id)
			.map(participant => ({
				label: participant.sceneName,
				value: participant.id
			}));
	}

	protected selectedTargetId(participant: CombatEncounterParticipant) {
		return (
			this.participantTargetDrafts()[participant.id] ??
			this.targetOptions(participant)[0]?.value ??
			null
		);
	}

	protected updateSelectedTarget(
		participant: CombatEncounterParticipant,
		targetParticipantId: string | null
	) {
		this.participantTargetDrafts.update(drafts => ({
			...drafts,
			[participant.id]: targetParticipantId
		}));
	}

	protected executeAction(
		participant: CombatEncounterParticipant,
		action: CreatureTierAction
	) {
		const encounter = this.encounter();

		if (!encounter) {
			return;
		}

		const actionKey = this.actionDraftKey(participant.id, action.slug);
		const targetParticipantId =
			action.target?.type === 'self' ||
			action.target?.type === 'linked_condition_target'
				? null
				: this.selectedTargetId(participant);

		if (this.actionRequiresTarget(action) && !targetParticipantId) {
			this.errorMessage.set('Выберите цель действия.');
			return;
		}

		this.executingActionKey.set(actionKey);
		this.errorMessage.set(null);

		this.encountersRepository
			.executeAction(encounter.id, {
				actorParticipantId: participant.id,
				actionSlug: action.slug,
				targetParticipantId
			})
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось выполнить действие.'
					);
					return EMPTY;
				}),
				finalize(() => this.executingActionKey.set(null)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(updatedEncounter => this.setEncounter(updatedEncounter));
	}

	protected skipParticipantTurn(participant: CombatEncounterParticipant) {
		const encounter = this.encounter();

		if (!encounter || !this.canSkipParticipantTurn(participant)) {
			return;
		}

		this.skippingParticipantId.set(participant.id);
		this.errorMessage.set(null);

		this.encountersRepository
			.skipParticipantTurn(encounter.id, participant.id)
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось пропустить ход.'
					);
					return EMPTY;
				}),
				finalize(() => this.skippingParticipantId.set(null)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(updatedEncounter => this.setEncounter(updatedEncounter));
	}

	protected canResolveDeclaredAction(action: CombatEncounterDeclaredAction) {
		return (
			this.isCurrentUserGm() &&
			action.status === 'pending' &&
			this.highestCurrentPotential() <= action.resolveAtPotential
		);
	}

	protected declaredActionTitle(action: CombatEncounterDeclaredAction) {
		const actorName =
			this.participantById(action.actorParticipantId)?.sceneName ?? 'Участник';
		const targetName = action.targetParticipantId
			? (this.participantById(action.targetParticipantId)?.sceneName ?? 'цель')
			: null;
		const actionName = this.declaredActionName(action);

		return targetName
			? `${actorName} → ${targetName}: ${actionName}`
			: `${actorName}: ${actionName}`;
	}

	protected declaredActionName(action: CombatEncounterDeclaredAction) {
		return readActionSnapshotName(action.actionSnapshot) ?? action.actionSlug;
	}

	protected declaredActionStateText(action: CombatEncounterDeclaredAction) {
		if (action.status === 'waiting_defense') {
			return 'Ожидается защита.';
		}

		if (this.canResolveDeclaredAction(action)) {
			return `Можно разыграть на ${action.resolveAtPotential} Потенциала.`;
		}

		return `Разыграется на ${action.resolveAtPotential} Потенциала.`;
	}

	protected resolveDeclaredAction(action: CombatEncounterDeclaredAction) {
		const encounter = this.encounter();

		if (!encounter || !this.canResolveDeclaredAction(action)) {
			return;
		}

		this.resolvingDeclaredActionId.set(action.id);
		this.errorMessage.set(null);

		this.encountersRepository
			.resolveDeclaredAction(encounter.id, {
				declaredActionId: action.id
			})
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось разыграть заявленное действие.'
					);
					return EMPTY;
				}),
				finalize(() => this.resolvingDeclaredActionId.set(null)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(updatedEncounter => this.setEncounter(updatedEncounter));
	}

	protected resolveDefense(
		request: CombatEncounterDefenseRequest,
		mode: 'dodge' | 'parry' | 'none',
		skillSlug: string | null
	) {
		const encounter = this.encounter();

		if (!encounter) {
			return;
		}

		this.resolvingDefenseRequestId.set(request.id);
		this.errorMessage.set(null);

		this.encountersRepository
			.resolveDefense(encounter.id, {
				defenseRequestId: request.id,
				mode,
				skillSlug
			})
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось выбрать защиту.'
					);
					return EMPTY;
				}),
				finalize(() => this.resolvingDefenseRequestId.set(null)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(updatedEncounter => this.setEncounter(updatedEncounter));
	}

	protected canResolveDefenseRequest(request: CombatEncounterDefenseRequest) {
		const target = this.participantById(request.targetParticipantId);

		return this.isCurrentUserParticipantOwner(target);
	}

	protected defenseRequestWaitingText(request: CombatEncounterDefenseRequest) {
		const target = this.participantById(request.targetParticipantId);
		const owner = target?.playerCharacter?.owner.displayUsername;

		return owner
			? `Ожидается решение игрока ${owner}.`
			: 'Ожидается решение игрока.';
	}

	protected participantById(participantId: string) {
		return (
			this.encounter()?.participants.find(
				participant => participant.id === participantId
			) ?? null
		);
	}

	private isCurrentUserParticipantOwner(
		participant: CombatEncounterParticipant | null
	) {
		const currentUser = this.authSession.user();
		const owner = participant?.playerCharacter?.owner;

		return !!currentUser && !!owner && owner.id === currentUser.id;
	}

	protected eventTitle(event: CombatEncounterEvent) {
		const payload = readEventPayload(event.payload);
		const actorName = event.actorParticipantId
			? this.participantById(event.actorParticipantId)?.sceneName
			: null;
		const targetName = event.targetParticipantId
			? this.participantById(event.targetParticipantId)?.sceneName
			: null;
		const actionName = payload.actionName ?? event.actionSlug ?? 'действие';

		switch (event.type) {
			case 'turn_skipped':
				return `${actorName ?? 'Участник'} пропустил ход`;
			case 'action_declared':
				return targetName
					? `${actorName ?? 'Участник'} заявил ${actionName} против ${targetName}`
					: `${actorName ?? 'Участник'} заявил ${actionName}`;
			case 'defense_requested':
				return `${actorName ?? 'Участник'} атакует ${targetName ?? 'цель'}: ${actionName}`;
			case 'action_resolved':
				return `${actorName ?? 'Участник'} атаковал ${targetName ?? 'цель'}: ${actionName}`;
			case 'action_executed':
				return targetName
					? `${actorName ?? 'Участник'} применил ${actionName} к ${targetName}`
					: `${actorName ?? 'Участник'} применил ${actionName}`;
			default:
				return event.type;
		}
	}

	protected eventDetails(event: CombatEncounterEvent) {
		const payload = readEventPayload(event.payload);
		const lines: string[] = [];

		if (event.type === 'defense_requested') {
			lines.push('Ожидается выбор защиты.');
			return lines;
		}

		if (event.type === 'turn_skipped') {
			if (
				typeof payload.fromPotential === 'number' &&
				typeof payload.toPotential === 'number'
			) {
				lines.push(
					`Потенциал: ${payload.fromPotential} → ${payload.toPotential}.`
				);
			}
			return lines;
		}

		if (event.type === 'action_declared') {
			const resolveAtPotential = payload.resolveAtPotential;
			lines.push(
				typeof resolveAtPotential === 'number'
					? `Разыграется на ${resolveAtPotential} Потенциала.`
					: 'Действие заявлено.'
			);
			return lines;
		}

		if (payload.attackRoll) {
			lines.push(`Атака: ${this.rollText(payload.attackRoll)}.`);
		}

		if (payload.defense) {
			const defenseLabel =
				payload.defense.mode === 'none'
					? 'без защиты'
					: (payload.defense.label ?? 'защита');
			const defenseRoll = payload.defenseRoll
				? `, ${this.rollText(payload.defenseRoll)}`
				: '';
			lines.push(`Защита: ${defenseLabel}${defenseRoll}.`);
		}

		if (payload.result?.cleanSuccesses !== undefined) {
			lines.push(`Чистые успехи: ${payload.result.cleanSuccesses}.`);
		}

		const effectsText = this.effectsText(payload.effects ?? []);

		if (effectsText) {
			lines.push(effectsText);
		}

		return lines.length ? lines : [event.actionSlug ?? event.type];
	}

	private rollText(roll: RollSummary) {
		const diceText = roll.dice.length ? roll.dice.join(', ') : 'нет кубов';
		const poolText =
			roll.characteristicName === 'По навыку'
				? roll.skillName
				: `${roll.characteristicName} + ${roll.skillName}`;

		return `${poolText}, кубы: ${diceText}, успехи: ${roll.successes}`;
	}

	private effectsText(effects: unknown[]) {
		const parts = effects
			.map(effect => this.effectText(effect))
			.filter((text): text is string => !!text);

		return parts.length ? `Эффекты: ${parts.join('; ')}.` : null;
	}

	private effectText(effect: unknown) {
		const record = readRecord(effect);
		const type = readString(record, 'type');
		const targetName = readString(record, 'targetParticipantId')
			? this.participantById(readString(record, 'targetParticipantId') ?? '')
					?.sceneName
			: null;

		switch (type) {
			case 'damage':
				return `${targetName ?? 'цель'} получает ${readNumber(record, 'value') ?? 0} урона`;
			case 'condition_applied':
				return `${targetName ?? 'цель'} получает состояние ${this.conditionLabelBySlug(readString(record, 'conditionSlug'))}`.trim();
			case 'condition_removed':
				return `${targetName ?? 'цель'} теряет состояние ${this.conditionLabelBySlug(readString(record, 'conditionSlug'))}`.trim();
			case 'conditions_linked':
				return 'состояния связаны';
			case 'conditions_unlinked':
				return 'связь состояний снята';
			case 'move_linked_target':
				return 'цель перемещена вместе со связью';
			case 'special_rule':
			case 'dice_pool_modifier':
				return readString(record, 'text');
			default:
				return null;
		}
	}

	private conditionLabelBySlug(slug: string | null) {
		if (!slug) {
			return '';
		}

		for (const participant of this.encounter()?.participants ?? []) {
			const condition = participant.conditions.find(
				item => item.condition.slug === slug
			);

			if (condition) {
				return this.participantConditionLabel(condition);
			}
		}

		return slug;
	}

	protected actionCostText(action: CreatureTierAction) {
		switch (action.cost.mode) {
			case 'free':
				return '0';
			case 'fixed':
				return `${action.cost.potential ?? 0}`;
			case 'per_meter':
				return `${action.cost.perMeter ?? 0}/м`;
			case 'rule':
				return 'по правилу';
		}
	}

	protected actionRangeText(
		participant: CombatEncounterParticipant,
		action: CreatureTierAction
	) {
		const rangeMeters = this.actionRangeMeters(participant, action);
		return rangeMeters === null ? '' : `${rangeMeters} м`;
	}

	protected actionRequiresTarget(action: CreatureTierAction) {
		return (
			action.target?.type === 'creature' ||
			action.target?.type === 'hostile_creature'
		);
	}

	private loadEncounter(id: string) {
		this.loading.set(true);
		this.errorMessage.set(null);

		forkJoin({
			encounter: this.encountersRepository.loadEncounter(id),
			creatures: this.creaturesRepository.loadPublicCatalog()
		})
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить столкновение.'
					);
					return EMPTY;
				}),
				finalize(() => this.loading.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(({ encounter, creatures }) => {
				this.setEncounter(encounter);
				this.creatures.set(creatures.creatures);
				this.updateSelectedCreature(creatures.creatures[0]?.id ?? null);
				this.loadCampaignCharacters(encounter.campaignId);
			});
	}

	private loadCampaignCharacters(campaignId: string) {
		this.charactersRepository
			.loadCampaignCharacters(campaignId)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(characters => this.characters.set(characters));
	}

	private watchEncounter(id: string) {
		this.realtime
			.watchEncounter(id)
			.pipe(
				catchError(() => EMPTY),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(encounter => this.setEncounter(encounter));
	}

	private setEncounter(encounter: CombatEncounter) {
		this.encounter.set(encounter);
		this.participantDrafts.set(
			encounter.participants.reduce<Record<string, ParticipantDraft>>(
				(result, participant) => ({
					...result,
					[participant.id]: toParticipantDraft(participant)
				}),
				{}
			)
		);
		this.participantTargetDrafts.update(drafts =>
			encounter.participants.reduce<Record<string, string | null>>(
				(result, participant) => ({
					...result,
					[participant.id]:
						drafts[participant.id] ??
						this.targetOptions(participant)[0]?.value ??
						null
				}),
				{}
			)
		);
	}

	private firstActiveTier(
		creatureId: string | null
	): CreaturePublicTierSummary | null {
		const creature = creatureId
			? this.creatures().find(item => item.id === creatureId)
			: null;

		return (
			creature?.tiers.find(tier => tier.isActive) ?? creature?.tiers[0] ?? null
		);
	}

	private actionDraftKey(participantId: string, actionSlug: string) {
		return `${participantId}:${actionSlug}`;
	}

	private actionRangeMeters(
		participant: CombatEncounterParticipant,
		action: CreatureTierAction
	) {
		if (action.source?.type !== 'natural_attack') {
			return null;
		}

		const naturalAttack = participant.creature?.naturalAttacks.find(
			item => item.naturalAttack.slug === action.source?.slug
		);
		const profile = naturalAttack?.attackProfiles.find(
			item => item.name === action.source?.profileName
		);

		return profile?.rangeMeters ?? null;
	}
}

function toParticipantDraft(
	participant: CombatEncounterParticipant
): ParticipantDraft {
	return {
		sceneName: participant.sceneName,
		currentHealth: participant.currentHealth,
		currentPotential: participant.currentPotential,
		initiative: participant.initiative,
		isActive: participant.isActive
	};
}

function readEventPayload(value: unknown): EventPayload {
	const record = readRecord(value);

	return {
		actionName: readString(record, 'actionName') ?? undefined,
		declaredAtPotential: readNumber(record, 'declaredAtPotential') ?? undefined,
		resolveAtPotential: readNumber(record, 'resolveAtPotential') ?? undefined,
		fromPotential: readNumber(record, 'fromPotential') ?? undefined,
		toPotential: readNumber(record, 'toPotential') ?? undefined,
		attackRoll: readRollSummary(record['attackRoll']),
		defenseRoll: readRollSummary(record['defenseRoll']),
		defense: readDefenseSummary(record['defense']),
		result: readResultSummary(record['result']),
		effects: Array.isArray(record['effects']) ? record['effects'] : []
	};
}

function readActionSnapshotName(value: unknown) {
	return readString(readRecord(value), 'name');
}

function readRollSummary(value: unknown): RollSummary | null {
	const record = readRecord(value);

	if (!Object.keys(record).length) {
		return null;
	}

	return {
		skillName: readString(record, 'skillName') ?? 'навык',
		characteristicName:
			readString(record, 'characteristicName') ?? 'характеристика',
		dice: readNumberArray(record['dice']),
		successes: readNumber(record, 'successes') ?? 0
	};
}

function readDefenseSummary(value: unknown): EventPayload['defense'] {
	const record = readRecord(value);

	if (!Object.keys(record).length) {
		return null;
	}

	return {
		mode: readString(record, 'mode') ?? undefined,
		label: readString(record, 'label') ?? undefined,
		skillName: readString(record, 'skillName')
	};
}

function readResultSummary(value: unknown): EventPayload['result'] {
	const record = readRecord(value);

	if (!Object.keys(record).length) {
		return undefined;
	}

	return {
		cleanSuccesses: readNumber(record, 'cleanSuccesses') ?? 0
	};
}

function readRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function readString(
	record: Record<string, unknown>,
	key: string
): string | null {
	const value = record[key];
	return typeof value === 'string' ? value : null;
}

function readNumber(
	record: Record<string, unknown>,
	key: string
): number | null {
	const value = record[key];
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readNumberArray(value: unknown): number[] {
	return Array.isArray(value)
		? value.filter(
				(item): item is number =>
					typeof item === 'number' && Number.isFinite(item)
			)
		: [];
}
