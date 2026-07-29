import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	computed,
	inject,
	signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { EMPTY, catchError, finalize } from 'rxjs';
import { AuthFacade } from '../../../../auth/state/auth.facade';
import { COMBAT_ENCOUNTERS_REPOSITORY } from '../../../../combat-encounters/data/combat-encounters-repository.port';
import { CombatEncounterSummary } from '../../../../combat-encounters/domain/combat-encounters.models';
import { PLAYER_CHARACTERS_REPOSITORY } from '../../../../player-characters/data/player-characters-repository.port';
import { PlayerCharacterSummary } from '../../../../player-characters/domain/player-characters.models';
import { CAMPAIGNS_REPOSITORY } from '../../../data/campaigns-repository.port';
import {
	Campaign,
	CampaignCombatActionResolutionMode,
	CampaignMemberRole,
	CampaignMemberStatus
} from '../../../domain/campaigns.models';

interface SelectOption<TValue extends string> {
	label: string;
	value: TValue;
}

interface CampaignDraft {
	name: string;
	description: string;
}

@Component({
	selector: 'app-campaigns-page',
	imports: [Button, FormsModule, InputText, RouterLink, Select, Tag, Textarea],
	templateUrl: './campaigns-page.component.html',
	styleUrl: './campaigns-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignsPageComponent {
	private readonly destroyRef = inject(DestroyRef);
	private readonly router = inject(Router);
	private readonly campaignsRepository = inject(CAMPAIGNS_REPOSITORY);
	private readonly charactersRepository = inject(PLAYER_CHARACTERS_REPOSITORY);
	private readonly encountersRepository = inject(COMBAT_ENCOUNTERS_REPOSITORY);
	private readonly authFacade = inject(AuthFacade);

	protected readonly campaigns = signal<Campaign[]>([]);
	protected readonly characters = signal<PlayerCharacterSummary[]>([]);
	protected readonly encounters = signal<CombatEncounterSummary[]>([]);
	protected readonly selectedCampaignId = signal<string | null>(null);
	protected readonly loading = signal(true);
	protected readonly loadingCharacters = signal(false);
	protected readonly loadingEncounters = signal(false);
	protected readonly saving = signal(false);
	protected readonly inviting = signal(false);
	protected readonly creatingCharacter = signal(false);
	protected readonly creatingEncounter = signal(false);
	protected readonly updatingSettings = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly inviteErrorMessage = signal<string | null>(null);
	protected readonly characterErrorMessage = signal<string | null>(null);
	protected readonly encounterErrorMessage = signal<string | null>(null);
	protected readonly draft = signal<CampaignDraft>({
		name: '',
		description: ''
	});
	protected readonly inviteIdentifier = signal('');
	protected readonly inviteRole = signal<CampaignMemberRole>('PLAYER');
	protected readonly characterName = signal('');
	protected readonly currentUser = this.authFacade.user;
	protected readonly roleOptions: SelectOption<CampaignMemberRole>[] = [
		{ label: 'Игрок', value: 'PLAYER' },
		{ label: 'Мастер', value: 'GM' }
	];
	protected readonly actionResolutionModeOptions: SelectOption<CampaignCombatActionResolutionMode>[] =
		[
			{ label: 'Отложенное', value: 'delayed' },
			{ label: 'Мгновенное', value: 'immediate' }
		];

	protected readonly selectedCampaign = computed(() => {
		const id = this.selectedCampaignId();
		return this.campaigns().find(campaign => campaign.id === id) ?? null;
	});

	protected readonly canInvite = computed(
		() => this.selectedCampaign()?.currentUserRole === 'GM'
	);

	protected readonly activeCampaigns = computed(() =>
		this.campaigns().filter(campaign => campaign.currentUserStatus === 'ACTIVE')
	);

	protected readonly invitedCampaigns = computed(() =>
		this.campaigns().filter(
			campaign => campaign.currentUserStatus === 'INVITED'
		)
	);

	constructor() {
		this.loadCampaigns();
	}

	protected loadCampaigns() {
		this.loading.set(true);
		this.errorMessage.set(null);

		this.campaignsRepository
			.loadCampaigns()
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить кампании.'
					);
					return EMPTY;
				}),
				finalize(() => this.loading.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(campaigns => {
				this.campaigns.set(campaigns);
				this.ensureSelectedCampaign();
			});
	}

	protected selectCampaign(campaign: Campaign) {
		this.selectedCampaignId.set(campaign.id);
		this.inviteErrorMessage.set(null);
		this.characterErrorMessage.set(null);
		this.encounterErrorMessage.set(null);
		this.loadCharacters(campaign.id);
		this.loadEncounters(campaign.id);
	}

	protected updateDraftName(name: string) {
		this.draft.update(draft => ({ ...draft, name }));
	}

	protected updateDraftDescription(description: string) {
		this.draft.update(draft => ({ ...draft, description }));
	}

	protected createCampaign() {
		const draft = this.draft();
		const name = draft.name.trim();

		if (!name) {
			this.errorMessage.set('Название кампании обязательно.');
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		this.campaignsRepository
			.createCampaign({
				name,
				description: draft.description.trim() || undefined
			})
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось создать кампанию.'
					);
					return EMPTY;
				}),
				finalize(() => this.saving.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(campaign => {
				this.campaigns.update(campaigns => [campaign, ...campaigns]);
				this.selectedCampaignId.set(campaign.id);
				this.draft.set({ name: '', description: '' });
				this.loadCharacters(campaign.id);
			});
	}

	protected createCharacter() {
		const campaign = this.selectedCampaign();
		const name = this.characterName().trim();

		if (!campaign || !name) {
			this.characterErrorMessage.set('Имя персонажа обязательно.');
			return;
		}

		this.creatingCharacter.set(true);
		this.characterErrorMessage.set(null);

		this.charactersRepository
			.createCharacter(campaign.id, { name })
			.pipe(
				catchError(error => {
					this.characterErrorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось создать персонажа.'
					);
					return EMPTY;
				}),
				finalize(() => this.creatingCharacter.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(character => {
				this.characters.update(characters => [...characters, character]);
				this.characterName.set('');
				void this.router.navigate(['/characters', character.id]);
			});
	}

	protected createEncounter() {
		const campaign = this.selectedCampaign();

		if (!campaign) {
			this.encounterErrorMessage.set('Кампания не выбрана.');
			return;
		}

		this.creatingEncounter.set(true);
		this.encounterErrorMessage.set(null);

		this.encountersRepository
			.createEncounter(campaign.id, {})
			.pipe(
				catchError(error => {
					this.encounterErrorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось создать столкновение.'
					);
					return EMPTY;
				}),
				finalize(() => this.creatingEncounter.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(encounter => {
				this.encounters.update(encounters => [
					{
						id: encounter.id,
						campaignId: encounter.campaignId,
						name: encounter.name,
						status: encounter.status,
						isActive: encounter.isActive,
						participantsCount: encounter.participants.length,
						createdAt: encounter.createdAt,
						updatedAt: encounter.updatedAt
					},
					...encounters
				]);
				void this.router.navigate(['/combat-encounters', encounter.id]);
			});
	}

	protected updateActionResolutionMode(
		mode: CampaignCombatActionResolutionMode
	) {
		const campaign = this.selectedCampaign();

		if (!campaign || campaign.combatActionResolutionMode === mode) {
			return;
		}

		this.updatingSettings.set(true);
		this.errorMessage.set(null);

		this.campaignsRepository
			.updateSettings(campaign.id, {
				combatActionResolutionMode: mode
			})
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось обновить настройки кампании.'
					);
					return EMPTY;
				}),
				finalize(() => this.updatingSettings.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(updatedCampaign => this.replaceCampaign(updatedCampaign));
	}

	protected inviteMember() {
		const campaign = this.selectedCampaign();
		const identifier = this.inviteIdentifier().trim();

		if (!campaign || !identifier) {
			this.inviteErrorMessage.set('Укажите email или имя пользователя.');
			return;
		}

		this.inviting.set(true);
		this.inviteErrorMessage.set(null);

		this.campaignsRepository
			.inviteMember(campaign.id, {
				identifier,
				role: this.inviteRole()
			})
			.pipe(
				catchError(error => {
					this.inviteErrorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось пригласить игрока.'
					);
					return EMPTY;
				}),
				finalize(() => this.inviting.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(updatedCampaign => {
				this.replaceCampaign(updatedCampaign);
				this.inviteIdentifier.set('');
			});
	}

	protected acceptInvitation(campaign: Campaign) {
		this.campaignsRepository
			.acceptInvitation(campaign.id)
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось принять приглашение.'
					);
					return EMPTY;
				}),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(updatedCampaign => this.replaceCampaign(updatedCampaign));
	}

	protected memberRoleLabel(role: CampaignMemberRole) {
		return role === 'GM' ? 'Мастер' : 'Игрок';
	}

	protected memberStatusLabel(status: CampaignMemberStatus): string {
		switch (status) {
			case 'ACTIVE':
				return 'В кампании';
			case 'INVITED':
				return 'Приглашён';
			case 'LEFT':
				return 'Вышел';
			default:
				return status;
		}
	}

	protected memberStatusSeverity(
		status: CampaignMemberStatus
	): 'success' | 'warn' | 'secondary' {
		switch (status) {
			case 'ACTIVE':
				return 'success';
			case 'INVITED':
				return 'warn';
			case 'LEFT':
				return 'secondary';
			default:
				return 'secondary';
		}
	}

	private replaceCampaign(updatedCampaign: Campaign) {
		this.campaigns.update(campaigns =>
			campaigns.map(campaign =>
				campaign.id === updatedCampaign.id ? updatedCampaign : campaign
			)
		);
		this.selectedCampaignId.set(updatedCampaign.id);
		this.loadCharacters(updatedCampaign.id);
		this.loadEncounters(updatedCampaign.id);
	}

	private ensureSelectedCampaign() {
		const campaigns = this.campaigns();
		const selectedId = this.selectedCampaignId();

		if (selectedId && campaigns.some(campaign => campaign.id === selectedId)) {
			return;
		}

		const nextId = campaigns[0]?.id ?? null;
		this.selectedCampaignId.set(nextId);

		if (nextId) {
			this.loadCharacters(nextId);
			this.loadEncounters(nextId);
		} else {
			this.characters.set([]);
			this.encounters.set([]);
		}
	}

	private loadCharacters(campaignId: string) {
		this.loadingCharacters.set(true);
		this.characterErrorMessage.set(null);

		this.charactersRepository
			.loadCampaignCharacters(campaignId)
			.pipe(
				catchError(error => {
					this.characterErrorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить персонажей.'
					);
					return EMPTY;
				}),
				finalize(() => this.loadingCharacters.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(characters => this.characters.set(characters));
	}

	private loadEncounters(campaignId: string) {
		this.loadingEncounters.set(true);
		this.encounterErrorMessage.set(null);

		this.encountersRepository
			.loadCampaignEncounters(campaignId)
			.pipe(
				catchError(error => {
					this.encounterErrorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить столкновения.'
					);
					return EMPTY;
				}),
				finalize(() => this.loadingEncounters.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(encounters => this.encounters.set(encounters));
	}
}
