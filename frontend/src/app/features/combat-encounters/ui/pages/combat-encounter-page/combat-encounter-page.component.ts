import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	computed,
	inject,
	signal
} from '@angular/core';
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
import { PlayerCharacter } from '../../../../player-characters/domain/player-characters.models';
import { CREATURES_REPOSITORY } from '../../../../creatures/data/creatures-repository.port';
import {
	Creature,
	CreatureTier
} from '../../../../creatures/domain/creatures.models';
import { COMBAT_ENCOUNTERS_REPOSITORY } from '../../../data/combat-encounters-repository.port';
import {
	CombatEncounter,
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

@Component({
	selector: 'app-combat-encounter-page',
	imports: [
		Button,
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
	private readonly charactersRepository = inject(PLAYER_CHARACTERS_REPOSITORY);
	private readonly creaturesRepository = inject(CREATURES_REPOSITORY);

	protected readonly encounter = signal<CombatEncounter | null>(null);
	protected readonly characters = signal<PlayerCharacter[]>([]);
	protected readonly creatures = signal<Creature[]>([]);
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
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly activeParticipants = computed(() =>
		(this.encounter()?.participants ?? []).filter(
			participant => participant.isActive
		)
	);
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
					label: `${tier.tier}: ${tier.name} · ${tier.hp} здоровья`,
					value: tier.id
				}))
	);

	constructor() {
		const id = this.route.snapshot.paramMap.get('id');

		if (id) {
			this.loadEncounter(id);
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

	protected participantKindLabel(participant: CombatEncounterParticipant) {
		return participant.kind === 'PLAYER_CHARACTER' ? 'Персонаж' : 'Существо';
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
	}

	private firstActiveTier(creatureId: string | null): CreatureTier | null {
		const creature = creatureId
			? this.creatures().find(item => item.id === creatureId)
			: null;

		return (
			creature?.tiers.find(tier => tier.isActive) ?? creature?.tiers[0] ?? null
		);
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
