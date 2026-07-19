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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmationService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { ANATOMY_SCHEMES_REPOSITORY } from '../../../data/anatomy-schemes-repository.port';
import {
	AnatomyScheme,
	AnatomyZoneKind
} from '../../../domain/anatomy-schemes.models';

interface SelectOption<TValue extends string> {
	label: string;
	value: TValue;
}

interface AnatomyZoneDraft {
	id: string;
	slug?: string;
	name: string;
	parentId: string | null;
	kind: AnatomyZoneKind;
	isRandomHitEligible: boolean;
	randomHitWeight: number;
	targetedAttackDicePenalty: number;
	extraPotentialCost: number;
	isActive: boolean;
	sortOrder: number;
}

interface AnatomySchemeDraft {
	id: string | null;
	name: string;
	description: string;
	zones: AnatomyZoneDraft[];
	isActive: boolean;
	sortOrder: number;
}

interface AnatomyZoneEditorItem {
	zone: AnatomyZoneDraft;
	index: number;
	children: AnatomyZoneEditorItem[];
}

interface AnatomyZoneEditorGroup {
	trackId: string;
	parent: AnatomyZoneEditorItem | null;
	children: AnatomyZoneEditorItem[];
}

const ZONE_KIND_OPTIONS: SelectOption<AnatomyZoneKind>[] = [
	{ label: 'Основная зона', value: 'MAIN' },
	{ label: 'Прицельная подзона', value: 'TARGETED' }
];

@Component({
	selector: 'app-admin-anatomy-schemes-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Breadcrumb,
		Button,
		ConfirmDialog,
		IconField,
		InputIcon,
		InputNumber,
		InputText,
		Select,
		Tag,
		Textarea,
		ToggleSwitch,
		EditorActionsBarComponent
	],
	templateUrl: './admin-anatomy-schemes-page.component.html',
	styleUrl: './admin-anatomy-schemes-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminAnatomySchemesPageComponent {
	private readonly repository = inject(ANATOMY_SCHEMES_REPOSITORY);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Бестиарий' },
		{ label: 'Анатомические схемы' }
	];
	protected readonly zoneKindOptions = ZONE_KIND_OPTIONS;
	protected readonly selectedSchemeId = signal<string | null>(null);
	protected readonly searchQuery = signal('');
	protected readonly schemes = signal<AnatomyScheme[]>([]);
	protected readonly draft = signal<AnatomySchemeDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);
	protected readonly selectedScheme = computed(() => {
		const id = this.selectedSchemeId();
		return id ? (this.schemes().find(item => item.id === id) ?? null) : null;
	});
	protected readonly filteredSchemes = computed(() => {
		const query = this.searchQuery().trim().toLowerCase();
		return this.schemes()
			.filter(item => {
				const haystack = `${item.name} ${item.description}`.toLowerCase();
				return !query || haystack.includes(query);
			})
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			});
	});
	protected readonly title = computed(() => {
		const draft = this.draft();
		return draft?.id ? draft.name || 'Анатомическая схема' : 'Новая схема';
	});
	protected readonly zoneGroups = computed<AnatomyZoneEditorGroup[]>(() =>
		buildZoneGroups(this.draft()?.zones ?? [])
	);

	constructor() {
		this.loadCatalog();
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
	}

	protected selectScheme(scheme: AnatomyScheme) {
		if (scheme.id === this.selectedSchemeId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => this.setDraftFromScheme(scheme)
		});
	}

	protected createScheme() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				const draft = createEmptyDraft();
				this.selectedSchemeId.set(null);
				this.draft.set(draft);
				this.savedDraftSignature.set(draftSignature(draft));
			}
		});
	}

	protected updateDraftName(name: string) {
		this.patchDraft({ name });
	}

	protected updateDraftDescription(description: string) {
		this.patchDraft({ description });
	}

	protected updateDraftSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected updateDraftActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected parentOptions(currentZoneId: string) {
		const zones = this.draft()?.zones ?? [];
		const excludedIds = collectDescendantIds(zones, currentZoneId);
		excludedIds.add(currentZoneId);

		return zones
			.filter(zone => !excludedIds.has(zone.id))
			.map(zone => ({ label: zone.name || 'Зона', value: zone.id }));
	}

	protected zoneKindLabel(kind: AnatomyZoneKind) {
		return (
			ZONE_KIND_OPTIONS.find(option => option.value === kind)?.label ?? kind
		);
	}

	protected addMainZone() {
		this.addZone('MAIN');
	}

	protected addTargetedZone() {
		this.addZone('TARGETED');
	}

	protected updateZone(
		index: number,
		patch: Partial<Omit<AnatomyZoneDraft, 'id'>>
	) {
		this.draft.update(draft =>
			draft
				? {
						...draft,
						zones: draft.zones.map((zone, zoneIndex) =>
							zoneIndex === index ? { ...zone, ...patch } : zone
						)
					}
				: draft
		);
	}

	protected removeZone(index: number) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		const removedZone = draft.zones[index];
		this.patchDraft({
			zones: draft.zones
				.filter((_, zoneIndex) => zoneIndex !== index)
				.map((zone, sortOrder) => ({
					...zone,
					parentId: zone.parentId === removedZone.id ? null : zone.parentId,
					sortOrder
				}))
		});
	}

	protected resetDraft() {
		const scheme = this.selectedScheme();

		if (scheme) {
			this.setDraftFromScheme(scheme);
			return;
		}

		const draft = createEmptyDraft();
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	protected saveDraft() {
		const draft = this.draft();

		if (!draft || !this.hasChanges() || this.saving()) {
			return;
		}

		const name = draft.name.trim();

		if (!name) {
			this.errorMessage.set('Название анатомической схемы обязательно.');
			return;
		}

		if (draft.zones.some(zone => !zone.name.trim())) {
			this.errorMessage.set('У каждой зоны должно быть название.');
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		const command = {
			name,
			description: draft.description.trim(),
			zones: draft.zones.map((zone, sortOrder) => ({
				id: zone.id,
				slug: zone.slug,
				name: zone.name.trim(),
				parentId: zone.parentId,
				kind: zone.kind,
				isRandomHitEligible: zone.isRandomHitEligible,
				randomHitWeight: zone.randomHitWeight,
				targetedAttackDicePenalty: zone.targetedAttackDicePenalty,
				extraPotentialCost: zone.extraPotentialCost,
				isActive: zone.isActive,
				sortOrder
			})),
			isActive: draft.isActive,
			sortOrder: draft.sortOrder
		};
		const request = draft.id
			? this.repository.updateScheme(draft.id, command)
			: this.repository.createScheme(command);

		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.upsertScheme(saved);
				this.setDraftFromScheme(saved);
				this.saving.set(false);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error
						? error.message
						: 'Не удалось сохранить анатомическую схему.'
				);
				this.saving.set(false);
			}
		});
	}

	protected deleteSelectedScheme() {
		const draft = this.draft();

		if (!draft?.id || this.saving()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Удалить анатомическую схему?',
			message: `«${draft.name}» будет удалена вместе со своими зонами.`,
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deleteScheme(draft.id as string)
		});
	}

	private loadCatalog() {
		this.loading.set(true);
		this.errorMessage.set(null);

		this.repository
			.loadCatalog()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					this.schemes.set(catalog.anatomySchemes);
					this.loading.set(false);
					this.selectFirstScheme();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить анатомические схемы.'
					);
					this.loading.set(false);
				}
			});
	}

	private selectFirstScheme() {
		const scheme = this.filteredSchemes()[0];

		if (scheme) {
			this.setDraftFromScheme(scheme);
			return;
		}

		const draft = createEmptyDraft();
		this.selectedSchemeId.set(null);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private setDraftFromScheme(scheme: AnatomyScheme) {
		const draft: AnatomySchemeDraft = {
			id: scheme.id,
			name: scheme.name,
			description: scheme.description,
			zones: scheme.zones.map(zone => ({ ...zone })),
			isActive: scheme.isActive,
			sortOrder: scheme.sortOrder
		};

		this.selectedSchemeId.set(scheme.id);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private addZone(kind: AnatomyZoneKind) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			zones: [
				...draft.zones,
				{
					id: `new-${Date.now()}-${draft.zones.length}`,
					name: '',
					parentId: null,
					kind,
					isRandomHitEligible: kind === 'MAIN',
					randomHitWeight: kind === 'MAIN' ? 1 : 0,
					targetedAttackDicePenalty: kind === 'MAIN' ? -1 : -2,
					extraPotentialCost: 1,
					isActive: true,
					sortOrder: draft.zones.length
				}
			]
		});
	}

	private patchDraft(patch: Partial<AnatomySchemeDraft>) {
		this.draft.update(draft => (draft ? { ...draft, ...patch } : draft));
	}

	private upsertScheme(scheme: AnatomyScheme) {
		this.schemes.update(items => {
			const index = items.findIndex(item => item.id === scheme.id);

			if (index === -1) {
				return [...items, scheme];
			}

			const next = [...items];
			next[index] = scheme;
			return next;
		});
	}

	private deleteScheme(id: string) {
		this.saving.set(true);
		this.errorMessage.set(null);

		this.repository
			.deleteScheme(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.schemes.update(items => items.filter(item => item.id !== id));
					this.saving.set(false);
					this.selectFirstScheme();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось удалить анатомическую схему.'
					);
					this.saving.set(false);
				}
			});
	}
}

function createEmptyDraft(): AnatomySchemeDraft {
	return {
		id: null,
		name: '',
		description: '',
		zones: [],
		isActive: true,
		sortOrder: 0
	};
}

function draftSignature(draft: AnatomySchemeDraft | null): string {
	return JSON.stringify(draft ?? null);
}

function buildZoneGroups(zones: AnatomyZoneDraft[]): AnatomyZoneEditorGroup[] {
	const items = zones.map((zone, index) => ({
		zone,
		index,
		children: [] as AnatomyZoneEditorItem[]
	}));
	const itemsById = new Map(items.map(item => [item.zone.id, item]));
	const roots: AnatomyZoneEditorItem[] = [];
	const orphanChildren: AnatomyZoneEditorItem[] = [];

	for (const item of items) {
		const parent = item.zone.parentId
			? itemsById.get(item.zone.parentId)
			: undefined;

		if (parent) {
			parent.children.push(item);
			continue;
		}

		if (item.zone.parentId) {
			orphanChildren.push(item);
			continue;
		}

		roots.push(item);
	}

	const sortItems = (
		first: AnatomyZoneEditorItem,
		second: AnatomyZoneEditorItem
	) =>
		first.zone.sortOrder - second.zone.sortOrder ||
		first.zone.name.localeCompare(second.zone.name, 'ru');

	for (const item of items) {
		item.children.sort(sortItems);
	}

	const groups: AnatomyZoneEditorGroup[] = roots.sort(sortItems).map(item => ({
		trackId: item.zone.id,
		parent: item,
		children: item.children
	}));

	if (orphanChildren.length) {
		groups.push({
			trackId: 'orphan',
			parent: null,
			children: orphanChildren.sort(sortItems)
		});
	}

	return groups;
}

function collectDescendantIds(
	zones: AnatomyZoneDraft[],
	zoneId: string
): Set<string> {
	const descendantIds = new Set<string>();
	let hasChanges = true;

	while (hasChanges) {
		hasChanges = false;

		for (const zone of zones) {
			if (
				zone.parentId &&
				(zone.parentId === zoneId || descendantIds.has(zone.parentId)) &&
				!descendantIds.has(zone.id)
			) {
				descendantIds.add(zone.id);
				hasChanges = true;
			}
		}
	}

	return descendantIds;
}
