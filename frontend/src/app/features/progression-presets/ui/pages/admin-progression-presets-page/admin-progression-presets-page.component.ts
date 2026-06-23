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
import { PROGRESSION_PRESETS_REPOSITORY } from '../../../data/progression-presets-repository.port';
import {
	ProgressionPreset,
	ProgressionPresetConfig,
	ProgressionPresetKind,
	ProgressionPresetRoundingMode
} from '../../../domain/progression-presets.models';

interface ProgressionPresetDraft {
	id: string | null;
	name: string;
	description: string;
	kind: ProgressionPresetKind;
	config: ProgressionPresetConfig;
	isActive: boolean;
	sortOrder: number;
}

interface ProgressionKindOption {
	label: string;
	value: ProgressionPresetKind;
}

interface ConfigField {
	key: string;
	label: string;
	min?: number;
	step: number;
}

interface RoundingModeOption {
	label: string;
	value: ProgressionPresetRoundingMode;
}

@Component({
	selector: 'app-admin-progression-presets-page',
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
	templateUrl: './admin-progression-presets-page.component.html',
	styleUrl: './admin-progression-presets-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminProgressionPresetsPageComponent {
	private readonly repository = inject(PROGRESSION_PRESETS_REPOSITORY);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Прогрессии' }
	];
	protected readonly kindOptions: ProgressionKindOption[] = [
		{ label: 'Линейная', value: 'LINEAR' },
		{ label: 'Ступенчатая', value: 'STEP' },
		{ label: 'Квадратичная', value: 'QUADRATIC' },
		{ label: 'Корневая', value: 'SQUARE_ROOT' },
		{ label: 'Логарифмическая', value: 'LOGARITHMIC' },
		{ label: 'Насыщение', value: 'SATURATION' },
		{ label: 'Процентная', value: 'PERCENT' }
	];
	protected readonly roundingModeOptions: RoundingModeOption[] = [
		{ label: 'Вниз', value: 'floor' },
		{ label: 'Обычное', value: 'round' },
		{ label: 'Вверх', value: 'ceil' }
	];

	protected readonly selectedPresetId = signal<string | null>(null);
	protected readonly searchQuery = signal('');
	protected readonly presets = signal<ProgressionPreset[]>([]);
	protected readonly draft = signal<ProgressionPresetDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);
	protected readonly selectedPreset = computed(() => {
		const id = this.selectedPresetId();
		return id ? this.presets().find(item => item.id === id) ?? null : null;
	});
	protected readonly filteredPresets = computed(() => {
		const query = this.searchQuery().trim().toLowerCase();
		return this.presets()
			.filter(item => {
				const haystack =
					`${item.name} ${item.description} ${this.kindLabel(item.kind)}`.toLowerCase();
				return !query || haystack.includes(query);
			})
			.sort(comparePresets);
	});
	protected readonly title = computed(() => {
		const draft = this.draft();
		return draft?.id ? draft.name || 'Прогрессия' : 'Новая прогрессия';
	});
	protected readonly configFields = computed(() => {
		const draft = this.draft();
		return draft ? getConfigFields(draft.kind) : [];
	});
	protected readonly formulaPreview = computed(() => {
		const draft = this.draft();
		return draft ? buildFormulaLabel(draft.kind, draft.config) : '';
	});
	protected readonly previewRows = computed(() => {
		const draft = this.draft();

		if (!draft) {
			return [];
		}

		return Array.from({ length: 11 }, (_, x) => ({
			x,
			value: evaluateRoundedProgression(draft.kind, draft.config, x)
		}));
	});

	constructor() {
		this.loadCatalog();
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
	}

	protected selectPreset(preset: ProgressionPreset) {
		if (preset.id === this.selectedPresetId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => this.setDraftFromPreset(preset)
		});
	}

	protected createPreset() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				const draft = createEmptyDraft();
				this.selectedPresetId.set(null);
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

	protected updateDraftKind(kind: ProgressionPresetKind) {
		this.patchDraft({
			kind,
			config: createDefaultConfig(kind)
		});
	}

	protected updateDraftConfigValue(key: string, value: number | null) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			config: {
				...draft.config,
				[key]: value ?? 0
			}
		});
	}

	protected updateDraftRoundingMode(roundingMode: ProgressionPresetRoundingMode) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			config: {
				...draft.config,
				roundingMode
			}
		});
	}

	protected updateDraftSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected updateDraftActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected resetDraft() {
		const preset = this.selectedPreset();

		if (preset) {
			this.setDraftFromPreset(preset);
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
			this.errorMessage.set('Название прогрессии обязательно.');
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		const command = {
			name,
			description: draft.description.trim(),
			kind: draft.kind,
			config: draft.config,
			isActive: draft.isActive,
			sortOrder: draft.sortOrder
		};
		const request = draft.id
			? this.repository.updatePreset(draft.id, command)
			: this.repository.createPreset(command);

		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.upsertPreset(saved);
				this.setDraftFromPreset(saved);
				this.saving.set(false);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error ? error.message : 'Не удалось сохранить прогрессию.'
				);
				this.saving.set(false);
			}
		});
	}

	protected deleteSelectedPreset() {
		const draft = this.draft();

		if (!draft?.id || this.saving()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Удалить прогрессию?',
			message: `«${draft.name}» будет удалена из списка пресетов прогрессии.`,
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deletePreset(draft.id as string)
		});
	}

	protected kindLabel(kind: ProgressionPresetKind) {
		return this.kindOptions.find(option => option.value === kind)?.label ?? kind;
	}

	private loadCatalog() {
		this.loading.set(true);
		this.errorMessage.set(null);

		this.repository
			.loadCatalog()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					this.presets.set(catalog.presets);
					this.loading.set(false);
					this.selectFirstPreset();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить прогрессии.'
					);
					this.loading.set(false);
				}
			});
	}

	private selectFirstPreset() {
		const preset = [...this.presets()].sort(comparePresets)[0];

		if (preset) {
			this.setDraftFromPreset(preset);
			return;
		}

		const draft = createEmptyDraft();
		this.selectedPresetId.set(null);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private setDraftFromPreset(preset: ProgressionPreset) {
		const draft: ProgressionPresetDraft = {
			id: preset.id,
			name: preset.name,
			description: preset.description,
			kind: preset.kind,
			config: { ...preset.config },
			isActive: preset.isActive,
			sortOrder: preset.sortOrder
		};

		this.selectedPresetId.set(preset.id);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private patchDraft(patch: Partial<ProgressionPresetDraft>) {
		this.draft.update(draft => (draft ? { ...draft, ...patch } : draft));
	}

	private upsertPreset(preset: ProgressionPreset) {
		this.presets.update(items => {
			const index = items.findIndex(item => item.id === preset.id);

			if (index === -1) {
				return [...items, preset];
			}

			const next = [...items];
			next[index] = preset;
			return next;
		});
	}

	private deletePreset(id: string) {
		this.saving.set(true);
		this.errorMessage.set(null);

		this.repository
			.deletePreset(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.presets.update(items => items.filter(item => item.id !== id));
					this.saving.set(false);
					this.selectFirstPreset();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error ? error.message : 'Не удалось удалить прогрессию.'
					);
					this.saving.set(false);
				}
			});
	}
}

function createEmptyDraft(): ProgressionPresetDraft {
	return {
		id: null,
		name: '',
		description: '',
		kind: 'LINEAR',
		config: createDefaultConfig('LINEAR'),
		isActive: true,
		sortOrder: 0
	};
}

function createDefaultConfig(kind: ProgressionPresetKind): ProgressionPresetConfig {
	switch (kind) {
		case 'LINEAR':
			return { base: 0, step: 1, roundingMode: 'round' };
		case 'STEP':
			return { base: 0, step: 1, interval: 2, roundingMode: 'floor' };
		case 'QUADRATIC':
			return { base: 0, multiplier: 1, roundingMode: 'round' };
		case 'SQUARE_ROOT':
			return { base: 0, multiplier: 2, roundingMode: 'round' };
		case 'LOGARITHMIC':
			return { base: 0, multiplier: 3, roundingMode: 'round' };
		case 'SATURATION':
			return { min: 0, max: 10, speed: 0.35, roundingMode: 'round' };
		case 'PERCENT':
			return { base: 10, percent: 0.1, roundingMode: 'round' };
	}
}

function getConfigFields(kind: ProgressionPresetKind): ConfigField[] {
	switch (kind) {
		case 'LINEAR':
			return [
				{ key: 'base', label: 'База', step: 1 },
				{ key: 'step', label: 'Шаг', step: 1 }
			];
		case 'STEP':
			return [
				{ key: 'base', label: 'База', step: 1 },
				{ key: 'step', label: 'Шаг', step: 1 },
				{ key: 'interval', label: 'Интервал', min: 1, step: 1 }
			];
		case 'QUADRATIC':
		case 'SQUARE_ROOT':
		case 'LOGARITHMIC':
			return [
				{ key: 'base', label: 'База', step: 1 },
				{ key: 'multiplier', label: 'Множитель', step: 0.1 }
			];
		case 'SATURATION':
			return [
				{ key: 'min', label: 'Минимум', step: 1 },
				{ key: 'max', label: 'Максимум', step: 1 },
				{ key: 'speed', label: 'Скорость', min: 0, step: 0.05 }
			];
		case 'PERCENT':
			return [
				{ key: 'base', label: 'База', step: 1 },
				{ key: 'percent', label: 'Процент', step: 0.01 }
			];
	}
}

function evaluateProgression(
	kind: ProgressionPresetKind,
	config: ProgressionPresetConfig,
	x: number
) {
	switch (kind) {
		case 'LINEAR':
			return value(config, 'base') + x * value(config, 'step');
		case 'STEP':
			return (
				value(config, 'base') +
				Math.floor(x / Math.max(1, value(config, 'interval'))) *
					value(config, 'step')
			);
		case 'QUADRATIC':
			return value(config, 'base') + x ** 2 * value(config, 'multiplier');
		case 'SQUARE_ROOT':
			return value(config, 'base') + Math.sqrt(x) * value(config, 'multiplier');
		case 'LOGARITHMIC':
			return value(config, 'base') + Math.log(x + 1) * value(config, 'multiplier');
		case 'SATURATION':
			return (
				value(config, 'min') +
				(value(config, 'max') - value(config, 'min')) *
					(1 - Math.exp(-x * value(config, 'speed')))
			);
		case 'PERCENT':
			return value(config, 'base') * (1 + x * value(config, 'percent'));
	}
}

function evaluateRoundedProgression(
	kind: ProgressionPresetKind,
	config: ProgressionPresetConfig,
	x: number
) {
	const rawValue = evaluateProgression(kind, config, x);

	switch (roundingMode(config)) {
		case 'floor':
			return Math.floor(rawValue);
		case 'ceil':
			return Math.ceil(rawValue);
		case 'round':
			return Math.round(rawValue);
	}
}

function buildFormulaLabel(
	kind: ProgressionPresetKind,
	config: ProgressionPresetConfig
) {
	switch (kind) {
		case 'LINEAR':
			return `${value(config, 'base')} + x * ${value(config, 'step')}`;
		case 'STEP':
			return `${value(config, 'base')} + floor(x / ${value(config, 'interval')}) * ${value(config, 'step')}`;
		case 'QUADRATIC':
			return `${value(config, 'base')} + x² * ${value(config, 'multiplier')}`;
		case 'SQUARE_ROOT':
			return `${value(config, 'base')} + sqrt(x) * ${value(config, 'multiplier')}`;
		case 'LOGARITHMIC':
			return `${value(config, 'base')} + log(x + 1) * ${value(config, 'multiplier')}`;
		case 'SATURATION':
			return `${value(config, 'min')} + (${value(config, 'max')} - ${value(config, 'min')}) * (1 - e^(-x * ${value(config, 'speed')}))`;
		case 'PERCENT':
			return `${value(config, 'base')} * (1 + x * ${value(config, 'percent')})`;
	}
}

function value(config: ProgressionPresetConfig, key: string) {
	const configValue = config[key];
	return typeof configValue === 'number' ? configValue : 0;
}

function roundingMode(config: ProgressionPresetConfig): ProgressionPresetRoundingMode {
	const mode = config['roundingMode'];

	if (mode === 'floor' || mode === 'round' || mode === 'ceil') {
		return mode;
	}

	return 'round';
}

function comparePresets(first: ProgressionPreset, second: ProgressionPreset) {
	const orderDiff = first.sortOrder - second.sortOrder;
	return orderDiff || first.name.localeCompare(second.name, 'ru');
}

function draftSignature(draft: ProgressionPresetDraft | null): string {
	return JSON.stringify(draft ?? null);
}
