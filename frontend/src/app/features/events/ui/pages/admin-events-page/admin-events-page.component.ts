import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmationService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import {
	ROLL_CONSEQUENCES_REPOSITORY,
	RollConsequencesRepository
} from '../../../../roll-consequences/data/roll-consequences-repository.port';
import { RollConsequence } from '../../../../roll-consequences/domain/roll-consequences.models';
import { RollEventGraphDefinition } from '../../../../roll-consequences/domain/roll-event-graph.models';
import { RollEventGraphEditorComponent } from '../../../../roll-consequences/ui/components/roll-event-graph-editor/roll-event-graph-editor.component';
import { SystemValuesCatalogFacade } from '../../../../values/state/system-values-catalog.facade';

interface EventHandlerGroup {
	label: string;
	items: RollConsequence[];
}

@Component({
	selector: 'app-admin-events-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Breadcrumb,
		Button,
		ConfirmDialog,
		IconField,
		InputIcon,
		InputText,
		Tag,
		RollEventGraphEditorComponent
	],
	templateUrl: './admin-events-page.component.html',
	styleUrl: './admin-events-page.component.scss',
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminEventsPageComponent {
	private readonly repository = inject<RollConsequencesRepository>(
		ROLL_CONSEQUENCES_REPOSITORY
	);
	private readonly valuesCatalogFacade = inject(SystemValuesCatalogFacade);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'События' }
	];
	protected readonly searchQuery = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly selectedHandlerId = signal<string | null>(null);
	protected readonly collapsedGroups = signal<ReadonlySet<string>>(new Set());
	protected readonly consequences = signal<RollConsequence[]>([]);
	protected readonly graphDraft = signal<RollEventGraphDefinition | null>(null);
	protected readonly availableValues = this.valuesCatalogFacade.values;
	private readonly savedGraphSignature = signal('');

	protected readonly selectedHandler = computed(() => {
		const selectedId = this.selectedHandlerId();
		return selectedId
			? this.consequences().find(consequence => consequence.id === selectedId) ??
					null
			: null;
	});
	protected readonly hasChanges = computed(
		() => graphSignature(this.graphDraft()) !== this.savedGraphSignature()
	);
	protected readonly handlerGroups = computed<EventHandlerGroup[]>(() => {
		const query = this.searchQuery().trim().toLowerCase();
		const items = this.consequences().filter(consequence => {
			const haystack =
				`${consequence.name} ${consequence.description} Совершён бросок Последствие броска`.toLowerCase();

			return !query || haystack.includes(query);
		});

		return [
			{
				label: 'Совершён бросок',
				items
			}
		];
	});

	constructor() {
		this.valuesCatalogFacade.ensureLoaded();
		this.loadHandlers();

		effect(() => {
			const handlers = this.consequences();

			if (!handlers.length) {
				this.selectedHandlerId.set(null);
				this.graphDraft.set(null);
				this.savedGraphSignature.set(graphSignature(null));
				return;
			}

			if (
				!this.selectedHandlerId() ||
				!handlers.some(handler => handler.id === this.selectedHandlerId())
			) {
				this.selectHandlerInternal(handlers[0].id);
			}
		});
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
	}

	protected isGroupCollapsed(label: string) {
		return this.collapsedGroups().has(label);
	}

	protected toggleGroup(label: string) {
		this.collapsedGroups.update(collapsed => {
			const next = new Set(collapsed);

			if (next.has(label)) {
				next.delete(label);
			} else {
				next.add(label);
			}

			return next;
		});
	}

	protected selectHandler(handlerId: string) {
		if (handlerId === this.selectedHandlerId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => this.selectHandlerInternal(handlerId)
		});
	}

	protected updateGraphDraft(graph: RollEventGraphDefinition | null) {
		this.graphDraft.set(graph);
	}

	protected resetDraft() {
		const handler = this.selectedHandler();
		const graph = handler?.rollEventGraph ?? null;

		this.graphDraft.set(graph);
		this.savedGraphSignature.set(graphSignature(graph));
	}

	protected saveDraft() {
		const handler = this.selectedHandler();

		if (!handler || !this.hasChanges() || this.saving()) {
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		this.repository
			.update({
				id: handler.id,
				name: handler.name,
				description: handler.description,
				rollEventGraph: this.graphDraft(),
				isActive: handler.isActive,
				sortOrder: handler.sortOrder,
				values: handler.values.map(value => ({
					id: value.id,
					name: value.name,
					description: value.description,
					isActive: value.isActive,
					sortOrder: value.sortOrder
				}))
			})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: saved => {
					this.consequences.update(consequences =>
						consequences.map(consequence =>
							consequence.id === saved.id ? saved : consequence
						)
					);
					this.graphDraft.set(saved.rollEventGraph);
					this.savedGraphSignature.set(graphSignature(saved.rollEventGraph));
					this.saving.set(false);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось сохранить обработчик события.'
					);
					this.saving.set(false);
				}
			});
	}

	protected activeLabel(isActive: boolean) {
		return isActive ? 'Активно' : 'Выключено';
	}

	protected activeSeverity(isActive: boolean) {
		return isActive ? 'success' : 'secondary';
	}

	private selectHandlerInternal(handlerId: string) {
		const handler = this.consequences().find(item => item.id === handlerId);

		if (!handler) {
			return;
		}

		this.selectedHandlerId.set(handler.id);
		this.graphDraft.set(handler.rollEventGraph);
		this.savedGraphSignature.set(graphSignature(handler.rollEventGraph));
	}

	private loadHandlers() {
		this.loading.set(true);
		this.errorMessage.set(null);

		this.repository
			.loadCatalog()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					this.consequences.set(
						[...catalog.consequences].sort((first, second) => {
							const orderDiff = first.sortOrder - second.sortOrder;
							return orderDiff || first.name.localeCompare(second.name, 'ru');
						})
					);
					this.loading.set(false);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить обработчики событий.'
					);
					this.loading.set(false);
				}
			});
	}
}

function graphSignature(graph: RollEventGraphDefinition | null): string {
	return JSON.stringify(graph ?? null);
}
