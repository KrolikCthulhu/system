import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmationService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { RollConsequence } from '../../../../roll-consequences/domain/roll-consequences.models';
import { RollEventGraphDefinition } from '../../../../roll-consequences/domain/roll-event-graph.models';
import { RollEventGraphEditorComponent } from '../../../../roll-consequences/ui/components/roll-event-graph-editor/roll-event-graph-editor.component';
import { SystemValuesCatalogFacade } from '../../../../values/state/system-values-catalog.facade';
import {
	createConsequenceHandlerItem,
	createGlobalHandlerItem,
	EventHandlerItem,
	GameEventHandler
} from '../../../domain/game-events.models';
import { AdminEventsFacade } from '../../../state/admin-events.facade';

interface EventHandlerGroup {
	label: string;
	items: EventHandlerItem[];
}

@Component({
	selector: 'app-admin-events-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Breadcrumb,
		ConfirmDialog,
		IconField,
		InputIcon,
		InputText,
		Tag,
		EditorActionsBarComponent,
		RollEventGraphEditorComponent
	],
	templateUrl: './admin-events-page.component.html',
	styleUrl: './admin-events-page.component.scss',
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminEventsPageComponent {
	private readonly eventsFacade = inject(AdminEventsFacade);
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
	protected readonly selectedHandlerKey = signal<string | null>(null);
	protected readonly collapsedGroups = signal<ReadonlySet<string>>(new Set());
	protected readonly globalHandlers = signal<GameEventHandler[]>([]);
	protected readonly consequences = signal<RollConsequence[]>([]);
	protected readonly graphDraft = signal<RollEventGraphDefinition | null>(null);
	protected readonly availableValues = this.valuesCatalogFacade.values;
	private readonly savedGraphSignature = signal('');

	protected readonly selectedHandler = computed(() => {
		const selectedKey = this.selectedHandlerKey();
		return selectedKey
			? this.allHandlers().find(handler => handler.key === selectedKey) ?? null
			: null;
	});
	protected readonly allHandlers = computed<EventHandlerItem[]>(() => [
		...this.globalHandlers().map(createGlobalHandlerItem),
		...this.consequences().map(createConsequenceHandlerItem)
	]);
	protected readonly hasChanges = computed(
		() => graphSignature(this.graphDraft()) !== this.savedGraphSignature()
	);
	protected readonly handlerGroups = computed<EventHandlerGroup[]>(() => {
		const query = this.searchQuery().trim().toLowerCase();
		const items = this.allHandlers().filter(handler => {
			const haystack =
				`${handler.name} ${handler.description} Совершён бросок ${handler.subtitle}`.toLowerCase();

			return !query || haystack.includes(query);
		}).sort((first, second) => {
			const typeOrder = first.type === second.type ? 0 : first.type === 'global' ? -1 : 1;
			const orderDiff = first.sortOrder - second.sortOrder;
			return typeOrder || orderDiff || first.name.localeCompare(second.name, 'ru');
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
			const handlers = this.allHandlers();

			if (!handlers.length) {
				this.selectedHandlerKey.set(null);
				this.graphDraft.set(null);
				this.savedGraphSignature.set(graphSignature(null));
				return;
			}

			if (
				!this.selectedHandlerKey() ||
				!handlers.some(handler => handler.key === this.selectedHandlerKey())
			) {
				this.selectHandlerInternal(handlers[0].key);
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

	protected selectHandler(handlerKey: string) {
		if (handlerKey === this.selectedHandlerKey()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => this.selectHandlerInternal(handlerKey)
		});
	}

	protected updateGraphDraft(graph: RollEventGraphDefinition | null) {
		this.graphDraft.set(graph);
	}

	protected resetDraft() {
		const handler = this.selectedHandler();
		const graph = handler?.graph ?? null;

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

		this.eventsFacade
			.saveHandlerGraph(handler, this.graphDraft())
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: saved => {
					this.applySavedHandler(saved);
					this.graphDraft.set(saved.graph);
					this.savedGraphSignature.set(graphSignature(saved.graph));
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

	private selectHandlerInternal(handlerKey: string) {
		const handler = this.allHandlers().find(item => item.key === handlerKey);

		if (!handler) {
			return;
		}

		this.selectedHandlerKey.set(handler.key);
		this.graphDraft.set(handler.graph);
		this.savedGraphSignature.set(graphSignature(handler.graph));
	}

	private loadHandlers() {
		this.loading.set(true);
		this.errorMessage.set(null);

		this.eventsFacade
			.loadRollPerformedHandlers()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: ({ globalHandlers, consequences }) => {
					this.globalHandlers.set(globalHandlers);
					this.consequences.set(consequences);
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

	private applySavedHandler(saved: EventHandlerItem) {
		const next = this.eventsFacade.replaceSavedHandler(
			{
				globalHandlers: this.globalHandlers(),
				consequences: this.consequences()
			},
			saved
		);

		this.globalHandlers.set([...next.globalHandlers]);
		this.consequences.set([...next.consequences]);
	}
}

function graphSignature(graph: RollEventGraphDefinition | null): string {
	return JSON.stringify(graph ?? null);
}
