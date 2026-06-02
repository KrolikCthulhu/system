import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, Observable, throwError } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { environment } from '../../../../../infrastructure/config/environment';
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
	items: EventHandlerItem[];
}

interface GameEventHandler {
	id: string;
	eventType: string;
	name: string;
	description: string;
	graph: RollEventGraphDefinition | null;
	isActive: boolean;
	sortOrder: number;
}

interface GameEventHandlersResponse {
	handlers: GameEventHandler[];
}

interface EventHandlerItem {
	key: string;
	id: string;
	type: 'global' | 'consequence';
	name: string;
	description: string;
	graph: RollEventGraphDefinition | null;
	isActive: boolean;
	sortOrder: number;
	subtitle: string;
	source: GameEventHandler | RollConsequence;
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
	private readonly http = inject(HttpClient);
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
		...this.globalHandlers().map(handler => ({
			key: `global:${handler.id}`,
			id: handler.id,
			type: 'global' as const,
			name: handler.name,
			description: handler.description,
			graph: handler.graph,
			isActive: handler.isActive,
			sortOrder: handler.sortOrder,
			subtitle: 'Глобальный обработчик',
			source: handler
		})),
		...this.consequences().map(consequence => ({
			key: `consequence:${consequence.id}`,
			id: consequence.id,
			type: 'consequence' as const,
			name: consequence.name,
			description: consequence.description,
			graph: consequence.rollEventGraph,
			isActive: consequence.isActive,
			sortOrder: consequence.sortOrder,
			subtitle: 'Последствие броска',
			source: consequence
		}))
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

		this.saveHandlerGraph(handler)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: saved => {
					this.applySavedHandler(handler, saved);
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

		forkJoin({
			globalHandlers: this.loadGlobalHandlers(),
			catalog: this.repository.loadCatalog()
		})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: ({ globalHandlers, catalog }) => {
					this.globalHandlers.set(globalHandlers);
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

	private loadGlobalHandlers(): Observable<GameEventHandler[]> {
		return this.http
			.get<GameEventHandlersResponse>(
				`${environment.apiBaseUrl}/admin/game-events/roll-performed/handlers`,
				{ withCredentials: true }
			)
			.pipe(
				map(response => response.handlers),
				catchError(error => this.handleHttpError(error))
			);
	}

	private saveHandlerGraph(
		handler: EventHandlerItem
	): Observable<EventHandlerItem> {
		if (handler.type === 'global') {
			return this.http
				.patch<GameEventHandler>(
					`${environment.apiBaseUrl}/admin/game-events/handlers/${handler.id}`,
					{ graph: this.graphDraft() },
					{ withCredentials: true }
				)
				.pipe(
					map(saved => this.toGlobalHandlerItem(saved)),
					catchError(error => this.handleHttpError(error))
				);
		}

		const consequence = handler.source as RollConsequence;

		return this.repository
			.update({
				id: consequence.id,
				name: consequence.name,
				description: consequence.description,
				rollEventGraph: this.graphDraft(),
				isActive: consequence.isActive,
				sortOrder: consequence.sortOrder,
				values: consequence.values.map(value => ({
					id: value.id,
					name: value.name,
					description: value.description,
					isActive: value.isActive,
					sortOrder: value.sortOrder
				}))
			})
			.pipe(map(saved => this.toConsequenceHandlerItem(saved)));
	}

	private applySavedHandler(
		handler: EventHandlerItem,
		saved: EventHandlerItem
	) {
		if (handler.type === 'global') {
			this.globalHandlers.update(handlers =>
				handlers.map(item =>
					item.id === saved.id ? (saved.source as GameEventHandler) : item
				)
			);
			return;
		}

		this.consequences.update(consequences =>
			consequences.map(consequence =>
				consequence.id === saved.id ? (saved.source as RollConsequence) : consequence
			)
		);
	}

	private toGlobalHandlerItem(handler: GameEventHandler): EventHandlerItem {
		return {
			key: `global:${handler.id}`,
			id: handler.id,
			type: 'global',
			name: handler.name,
			description: handler.description,
			graph: handler.graph,
			isActive: handler.isActive,
			sortOrder: handler.sortOrder,
			subtitle: 'Глобальный обработчик',
			source: handler
		};
	}

	private toConsequenceHandlerItem(consequence: RollConsequence): EventHandlerItem {
		return {
			key: `consequence:${consequence.id}`,
			id: consequence.id,
			type: 'consequence',
			name: consequence.name,
			description: consequence.description,
			graph: consequence.rollEventGraph,
			isActive: consequence.isActive,
			sortOrder: consequence.sortOrder,
			subtitle: 'Последствие броска',
			source: consequence
		};
	}

	private handleHttpError(error: unknown) {
		return throwError(() => new Error(extractApiErrorMessage(error)));
	}
}

function graphSignature(graph: RollEventGraphDefinition | null): string {
	return JSON.stringify(graph ?? null);
}

function extractApiErrorMessage(error: unknown): string {
	if (error instanceof HttpErrorResponse) {
		const message = error.error?.message;

		if (Array.isArray(message)) {
			return message.join('\n');
		}

		if (typeof message === 'string' && message.trim()) {
			return message;
		}

		if (error.status === 0) {
			return 'API is unavailable.';
		}
	}

	return 'Request failed.';
}
