import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	computed,
	inject,
	signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmationService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { MAGIC_WORDS_REPOSITORY } from '../../../data/magic-words-repository.port';
import {
	PersistedSpellStatus,
	SPELL_STATUS_OPTIONS,
	Spell,
	SpellCatalog,
	SpellFormulaCandidate,
	canManageSpellActivity,
	spellStatusLabel
} from '../../../domain/spell.models';

interface SpellDraft {
	id: string | null;
	actionId: string;
	essenceId: string;
	gestureId: string;
	formulaName: string;
	name: string;
	description: string;
	status: PersistedSpellStatus;
	isActive: boolean;
	sortOrder: number;
}

@Component({
	selector: 'app-admin-spell-detail-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Breadcrumb,
		Button,
		ConfirmDialog,
		InputNumber,
		InputText,
		Select,
		Tag,
		Textarea,
		ToggleSwitch,
		EditorActionsBarComponent
	],
	templateUrl: './admin-spell-detail-page.component.html',
	styleUrl: './admin-spell-detail-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService]
})
export class AdminSpellDetailPageComponent {
	private readonly repository = inject(MAGIC_WORDS_REPOSITORY);
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly statusOptions = SPELL_STATUS_OPTIONS;
	protected readonly draft = signal<SpellDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly breadcrumbs = computed(() => [
		{ label: 'Правила системы', routerLink: '/admin/rules/spells' },
		{ label: 'Заклинания', routerLink: '/admin/rules/spells' },
		{ label: this.draft()?.name || 'Заклинание' }
	]);
	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);

	constructor() {
		this.loadSpell();
	}

	protected updateDraftName(name: string) {
		this.patchDraft({ name });
	}

	protected updateDraftDescription(description: string) {
		this.patchDraft({ description });
	}

	protected updateDraftStatus(status: PersistedSpellStatus) {
		this.draft.update(draft =>
			draft
				? {
						...draft,
						status,
						isActive:
							status === 'DRAFT'
								? false
								: draft.status === 'DRAFT'
									? true
									: draft.isActive
					}
				: draft
		);
	}

	protected updateDraftActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected updateDraftSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected resetDraft() {
		this.loadSpell();
	}

	protected saveDraft() {
		const draft = this.draft();

		if (!draft || !this.hasChanges() || this.saving()) {
			return;
		}

		const name = draft.name.trim();

		if (!name) {
			this.errorMessage.set('Название заклинания обязательно.');
			return;
		}

		const command = {
			actionId: draft.actionId,
			essenceId: draft.essenceId,
			gestureId: draft.gestureId,
			name,
			description: draft.description.trim(),
			status: draft.status,
			isActive: draft.isActive,
			sortOrder: draft.sortOrder
		};
		const request = draft.id
			? this.repository.updateSpell(draft.id, command)
			: this.repository.createSpell(command);

		this.saving.set(true);
		this.errorMessage.set(null);
		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.setDraftFromSpell(saved);
				this.saving.set(false);

				if (!draft.id) {
					void this.router.navigate(['/admin/rules/spells', saved.id], {
						replaceUrl: true
					});
				}
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error ? error.message : 'Не удалось сохранить заклинание.'
				);
				this.saving.set(false);
			}
		});
	}

	protected deleteSpell() {
		const draft = this.draft();

		if (!draft?.id || this.saving()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Удалить заклинание?',
			message: `«${draft.name}» вернётся в состояние «Не заполнено».`,
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deleteSpellInternal(draft.id as string)
		});
	}

	protected statusLabel(status: PersistedSpellStatus) {
		return spellStatusLabel(status);
	}

	protected statusSeverity(status: PersistedSpellStatus) {
		switch (status) {
			case 'READY':
				return 'success';
			case 'TESTING':
				return 'info';
			case 'DRAFT':
				return 'warn';
		}
	}

	protected canManageActivity(status: PersistedSpellStatus) {
		return canManageSpellActivity(status);
	}

	private loadSpell() {
		this.loading.set(true);
		this.errorMessage.set(null);

		this.repository
			.loadSpellCatalog()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					const formula = findFormulaFromRoute(catalog, this.route);

					if (!formula) {
						this.errorMessage.set('Заклинание не найдено.');
						this.loading.set(false);
						return;
					}

					this.setDraftFromFormula(formula);
					this.loading.set(false);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить заклинание.'
					);
					this.loading.set(false);
				}
			});
	}

	private setDraftFromFormula(formula: SpellFormulaCandidate) {
		if (formula.spell) {
			this.setDraftFromSpell(formula.spell);
			return;
		}

		const draft: SpellDraft = {
			id: null,
			actionId: formula.action.id,
			essenceId: formula.essence.id,
			gestureId: formula.gesture.id,
			formulaName: `${formula.action.name} + ${formula.essence.name} + ${formula.gesture.name}`,
			name: `${formula.action.name} ${formula.essence.name}: ${formula.gesture.name}`,
			description: '',
			status: 'DRAFT',
			isActive: false,
			sortOrder: 0
		};

		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private setDraftFromSpell(spell: Spell) {
		const draft: SpellDraft = {
			id: spell.id,
			actionId: spell.actionId,
			essenceId: spell.essenceId,
			gestureId: spell.gestureId,
			formulaName: spell.formulaName,
			name: spell.name,
			description: spell.description,
			status: spell.status,
			isActive: spell.isActive,
			sortOrder: spell.sortOrder
		};

		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private patchDraft(patch: Partial<SpellDraft>) {
		this.draft.update(draft => (draft ? { ...draft, ...patch } : draft));
	}

	private deleteSpellInternal(id: string) {
		this.saving.set(true);
		this.errorMessage.set(null);
		this.repository
			.deleteSpell(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.saving.set(false);
					void this.router.navigate(['/admin/rules/spells']);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error ? error.message : 'Не удалось удалить заклинание.'
					);
					this.saving.set(false);
				}
			});
	}
}

function findFormulaFromRoute(
	catalog: SpellCatalog,
	route: ActivatedRoute
): SpellFormulaCandidate | null {
	const spellId = route.snapshot.paramMap.get('spellId');
	const actionId = route.snapshot.paramMap.get('actionId');
	const essenceId = route.snapshot.paramMap.get('essenceId');
	const gestureId = route.snapshot.paramMap.get('gestureId');

	for (const group of catalog.groups) {
		for (const formula of group.formulas) {
			if (spellId && formula.spell?.id === spellId) {
				return formula;
			}

			if (
				actionId &&
				essenceId &&
				gestureId &&
				formula.action.id === actionId &&
				formula.essence.id === essenceId &&
				formula.gesture.id === gestureId
			) {
				return formula;
			}
		}
	}

	return null;
}

function draftSignature(draft: SpellDraft | null): string {
	return JSON.stringify(draft ?? null);
}
