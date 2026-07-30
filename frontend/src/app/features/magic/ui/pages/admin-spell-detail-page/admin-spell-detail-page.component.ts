import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject
} from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Dialog } from 'primeng/dialog';
import { Popover } from 'primeng/popover';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { MechanicCalculationGraphEditorComponent } from '../../../../spell-mechanics/ui/components/mechanic-calculation-graph-editor/mechanic-calculation-graph-editor.component';
import { SpellAddMechanicDialogComponent } from './dialogs/add-mechanic/spell-add-mechanic-dialog.component';
import { SpellAddMechanicDialogFacade } from './dialogs/add-mechanic/spell-add-mechanic-dialog.facade';
import { SpellAreaEditorComponent } from './area/spell-area-editor.component';
import { SpellDetailEditorHeaderComponent } from './shell/spell-detail-editor-header.component';
import { SpellMechanicsEditorComponent } from './mechanics/spell-mechanics-editor.component';
import { SpellMainEditorComponent } from './main/spell-main-editor.component';
import { SpellBalanceTabComponent } from './tabs/balance/spell-balance-tab.component';
import { SpellProblemsTabComponent } from './tabs/problems/spell-problems-tab.component';
import { SpellRuntimePreviewDrawerComponent } from './runtime/preview-drawer/spell-runtime-preview-drawer.component';
import { readSpellEffectScaleConfig } from './read-model/spell-effect-scale-config.presenter';
import {
	normalizeApplicationConfig,
	readDefaultApplicationConfig
} from './read-model/spell-mechanic-draft.helpers';
import { evaluateAutoParameterForGameText } from './read-model/spell-auto-parameter-runtime.presenter';
import { createMechanicProblems } from './read-model/spell-mechanic-readiness.presenter';
import {
	parameterValueLabel as parameterValuePreviewLabel,
	SpellTextPreviewContext
} from './read-model/spell-text-preview.presenter';
import {
	formulaSourceGroupsForBlock as formulaSourcePreviewGroupsForBlock,
	SpellParameterSourceOptionsContext
} from './read-model/spell-parameter-source-options.presenter';
import {
	autoSourceRuntimeValue as resolveAutoSourceRuntimeValue,
	SpellRuntimeSourceResolverContext
} from './read-model/spell-runtime-source-resolver.presenter';
import { SpellTextTabComponent } from './tabs/text/spell-text-tab.component';
import { SpellTextTabFacade } from './tabs/text/spell-text-tab.facade';
import { SpellTargetConfigsEditorComponent } from './targets/spell-target-configs-editor.component';
import { AdminSpellDetailPageStore } from './state/admin-spell-detail-page.store';
import {
	MechanicProblemItem,
	SpellMechanicBlockDraft
} from './models/spell-detail-page.types';
import {
	MechanicCalculationGraphState,
	MechanicCalculationSourceGroup
} from '../../../../spell-mechanics/ui/mechanic-calculation-graph.models';
import {
	SpellMechanicParameter,
	SpellMechanicParameterKind
} from '../../../../spell-mechanics/domain/spell-mechanics.models';
import {
	PersistedSpellStatus,
	SpellMechanicApplicationConfig,
	SpellEffectScaleConfig,
	spellStatusLabel
} from '../../../domain/spell.models';
import { AdminSpellDetailPageFacade } from './application/admin-spell-detail-page.facade';
import { DeleteSpellUseCase } from './application/delete-spell.use-case';
import { LoadSpellDetailPageUseCase } from './application/load-spell-detail-page.use-case';
import { SaveSpellDetailUseCase } from './application/save-spell-detail.use-case';
import { SpellMechanicDraftFacade } from './application/spell-mechanic-draft.facade';
import { SpellRuntimePreviewFacade } from './application/spell-runtime-preview.facade';
import { SpellTextDraftFacade } from './application/spell-text-draft.facade';
import {
	SpellAutoParameterSource,
	SpellAutoParameterValue,
	SpellFormulaParameterValue,
	isFormulaParameterValue,
} from './utils/spell-numeric-parameter.utils';

type AutoHelpKey =
	| 'character'
	| 'scale'
	| 'startLevel'
	| 'minimum'
	| 'maximum'
	| 'rangeMode'
	| 'finalScale'
	| 'sourceMode'
	| 'sourceKind'
	| 'sourceKey'
	| 'sourceTransform'
	| 'sourceTransformSource'
	| 'sourceTransformDivisor'
	| 'sourceTarget'
	| 'sourceCurve'
	| 'sourceWeight'
	| 'rounding';

interface AutoHelpItem {
	term: string;
	description: string;
}

interface AutoHelpContent {
	title: string;
	description: string;
	items: AutoHelpItem[];
}

@Component({
	selector: 'app-admin-spell-detail-page',
	standalone: true,
	imports: [
		CommonModule,
		Breadcrumb,
		ConfirmDialog,
		Dialog,
		Popover,
		Tab,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
		EditorActionsBarComponent,
		MechanicCalculationGraphEditorComponent,
		SpellAddMechanicDialogComponent,
		SpellAreaEditorComponent,
		SpellDetailEditorHeaderComponent,
		SpellMechanicsEditorComponent,
		SpellMainEditorComponent,
		SpellBalanceTabComponent,
		SpellProblemsTabComponent,
		SpellRuntimePreviewDrawerComponent,
		SpellTextTabComponent,
		SpellTargetConfigsEditorComponent
	],
	templateUrl: './admin-spell-detail-page.component.html',
	styleUrl: './admin-spell-detail-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		ConfirmationService,
		AdminSpellDetailPageStore,
		AdminSpellDetailPageFacade,
		SpellTextDraftFacade,
		SpellMechanicDraftFacade,
		SpellRuntimePreviewFacade,
		SpellTextTabFacade,
		SpellAddMechanicDialogFacade,
		LoadSpellDetailPageUseCase,
		SaveSpellDetailUseCase,
		DeleteSpellUseCase
	]
})
export class AdminSpellDetailPageComponent {
	private readonly pageStore = inject(AdminSpellDetailPageStore);
	private readonly pageFacade = inject(AdminSpellDetailPageFacade);
	private readonly spellMechanicDraftFacade = inject(SpellMechanicDraftFacade);
	private readonly spellRuntimePreviewFacade = inject(
		SpellRuntimePreviewFacade
	);
	private readonly spellTextTabFacade = inject(SpellTextTabFacade);
	private readonly addMechanicDialogFacade = inject(
		SpellAddMechanicDialogFacade
	);
	private readonly confirmationService = inject(ConfirmationService);

	protected readonly draft = this.pageStore.draft;
	protected readonly spellMechanics = this.pageStore.spellMechanics;
	protected readonly magicWords = this.pageStore.magicWords;
	protected readonly skills = this.pageStore.skills;
	protected readonly skillCategories = this.pageStore.skillCategories;
	protected readonly skillLevels = this.pageStore.skillLevels;
	protected readonly damageTypes = this.pageStore.damageTypes;
	protected readonly conditions = this.pageStore.conditions;
	protected readonly creatures = this.pageStore.creatures;
	protected readonly creatureCharacteristics =
		this.pageStore.creatureCharacteristics;
	protected readonly progressionPresets = this.pageStore.progressionPresets;
	protected readonly systemValues = this.pageStore.systemValues;
	protected readonly sandboxInputValues = this.pageStore.sandboxInputValues;
	protected readonly selectedFormulaParameter =
		this.pageStore.selectedFormulaParameter;
	protected readonly activeTab = this.pageStore.activeTab;
	protected readonly loading = this.pageStore.loading;
	protected readonly saving = this.pageStore.saving;
	protected readonly errorMessage = this.pageStore.errorMessage;
	protected readonly runtimePreviewDrawerViewModel =
		this.spellRuntimePreviewFacade.drawerViewModel;
	protected readonly runtimePreviewDrawerRenderers =
		this.spellRuntimePreviewFacade.drawerRenderers;
	protected readonly runtimePreviewDrawerActions =
		this.spellRuntimePreviewFacade.drawerActions;
	protected readonly addMechanicDialogViewModel =
		this.addMechanicDialogFacade.viewModel;
	protected readonly addMechanicDialogActions =
		this.addMechanicDialogFacade.actions;
	protected readonly breadcrumbs = computed(() => [
		{ label: 'Правила системы', routerLink: '/admin/rules/spells' },
		{ label: 'Заклинания', routerLink: '/admin/rules/spells' },
		{ label: this.draft()?.name || 'Заклинание' }
	]);
	protected readonly hasChanges = this.pageStore.hasChanges;
	protected readonly mechanicProblems = computed<MechanicProblemItem[]>(() => {
		return createMechanicProblems(this.draft(), this.spellMechanics());
	});
	protected readonly spellTextPreviewMode = this.pageStore.spellTextPreviewMode;
	protected readonly spellTextTabViewModel = this.spellTextTabFacade.viewModel;
	protected readonly spellTextTabActions = this.spellTextTabFacade.actions;
	protected readonly activeAutoHelpKey = this.pageStore.activeAutoHelpKey;
	protected readonly activeAutoHelp = computed(
		() => this.autoHelpContent[this.activeAutoHelpKey()]
	);
	protected readonly autoHelpContent: Record<AutoHelpKey, AutoHelpContent> = {
		character: {
			title: 'Поведение',
			description:
				'Определяет общий характер числа и то, насколько охотно оно растёт от выбранных источников.',
			items: [
				{
					term: 'Стабильное',
					description:
						'почти не разгоняется от источников и подходит для предсказуемых значений.'
				},
				{
					term: 'Скалируемое',
					description:
						'растёт ровно и понятно, хороший базовый вариант для большинства параметров.'
				},
				{
					term: 'Стихийное',
					description:
						'лучше подходит для эффектов, где важны свойства выбранной сущности.'
				},
				{
					term: 'Мастерское',
					description:
						'заметнее раскрывается на высоких навыках и хуже ощущается на низких.'
				},
				{
					term: 'Ограниченное',
					description:
						'сильнее держит потолок и не даёт значению слишком быстро разгоняться.'
				},
				{
					term: 'Экстремальное',
					description:
						'даёт высокий потенциал, но требует сильных источников, чтобы раскрыться.'
				}
			]
		},
		scale: {
			title: 'Размер значения',
			description: 'Задаёт базовый масштаб результата до применения влияний.',
			items: [
				{
					term: 'Очень малый',
					description:
						'для бонусов, которые могут начинаться с нуля и расти осторожно.'
				},
				{
					term: 'Малый',
					description:
						'для точечных эффектов, небольшого урона, короткой длительности или малого числа целей.'
				},
				{
					term: 'Средний',
					description:
						'для обычных заклинаний, где значение должно расти без резких скачков.'
				},
				{
					term: 'Большой',
					description:
						'для дальности, области или заметных эффектов, которые должны быть ощутимыми.'
				},
				{
					term: 'Огромный',
					description:
						'для параметров, где нужны крупные числа и широкий диапазон роста.'
				}
			]
		},
		startLevel: {
			title: 'Старт расчёта',
			description:
				'Задаёт уровень, с которого источники начинают давать вклад в формулу.',
			items: [
				{ term: '0', description: 'значение считается уже с нулевого уровня.' },
				{
					term: '1',
					description:
						'на нулевом уровне параметр остаётся на минимуме, рост начинается с первого уровня.'
				},
				{
					term: 'Выше 1',
					description:
						'позволяет открыть заметный рост только на более сильном навыке.'
				}
			]
		},
		minimum: {
			title: 'Минимум',
			description:
				'Нижняя граница итогового значения и значение, которое используется до старта расчёта.',
			items: [
				{
					term: '0',
					description:
						'параметр может быть полностью недоступен или не давать эффекта.'
				},
				{
					term: 'Больше 0',
					description:
						'заклинание всегда сохраняет базовый минимум, даже при слабых источниках.'
				}
			]
		},
		maximum: {
			title: 'Максимум',
			description:
				'Верхняя граница параметра. Используется только если включён режим диапазона.',
			items: [
				{
					term: 'Пусто',
					description:
						'верхняя граница не задана, формула работает без масштабирования в диапазон.'
				},
				{
					term: 'Число',
					description:
						'итоговая прогрессия будет уложена между минимумом и этим максимумом.'
				}
			]
		},
		rangeMode: {
			title: 'Диапазон',
			description:
				'Определяет, нужно ли приводить итоговую прогрессию к заданному коридору значений.',
			items: [
				{
					term: 'Без диапазона',
					description:
						'формула считается напрямую и ограничивается только своим обычным минимумом.'
				},
				{
					term: 'Масштабировать',
					description:
						'результат растягивается или сжимается так, чтобы уровни укладывались между минимумом и максимумом.'
				}
			]
		},
		finalScale: {
			title: 'Итоговый масштаб',
			description: 'Умножает уже рассчитанное значение перед округлением.',
			items: [
				{
					term: '100%',
					description: 'оставляет рассчитанные числа без изменений.'
				},
				{
					term: '50%',
					description:
						'сохраняет форму роста, но делает все значения в два раза меньше.'
				},
				{
					term: 'Больше 100%',
					description:
						'усиливает готовую прогрессию без изменения вкладов источников.'
				}
			]
		},
		sourceMode: {
			title: 'Режим влияний',
			description:
				'Определяет, сколько источников участвует в формуле и насколько подробно они настраиваются.',
			items: [
				{
					term: 'Простой',
					description: 'оставляет одну базовую связь и быстрее настраивается.'
				},
				{
					term: 'Расширенный',
					description:
						'позволяет добавить несколько источников и отдельно задать роль каждого источника.'
				}
			]
		},
		sourceKind: {
			title: 'Что влияет',
			description: 'Выбирает тип данных, который будет участвовать в расчёте.',
			items: [
				{
					term: 'Системное значение',
					description:
						'берёт общий показатель системы, например уровень заклинателя.'
				},
				{
					term: 'Параметр механики',
					description:
						'берёт значение из текущей механики, например выбранный навык атаки.'
				},
				{
					term: 'Профиль сущности',
					description:
						'берёт вес свойства сущности: урон, дальность, область, длительность и т.д.'
				},
				{
					term: 'Ручной x',
					description:
						'даёт быстрый тестовый источник без привязки к справочникам.'
				}
			]
		},
		sourceKey: {
			title: 'Значение источника',
			description:
				'Выбирает конкретное значение внутри выбранного типа источника.',
			items: [
				{
					term: 'Для системного значения',
					description:
						'указывает конкретный системный показатель, который будет подставлен в формулу.'
				},
				{
					term: 'Для параметра механики',
					description:
						'указывает параметр текущей механики, значение которого станет источником расчёта.'
				},
				{
					term: 'Для профиля сущности',
					description:
						'указывает, какое свойство сущности будет влиять на итог.'
				}
			]
		},
		sourceTransform: {
			title: 'Что взять',
			description:
				'Определяет, какая часть выбранного источника попадёт в расчёт.',
			items: [
				{
					term: 'Как есть',
					description: 'использует полное значение источника без вычитаний.'
				},
				{
					term: 'Сверх старта',
					description: 'берёт только часть выше начального уровня расчёта.'
				},
				{
					term: 'Сверх источника',
					description:
						'берёт разницу между этим источником и другой строкой влияния.'
				},
				{
					term: 'Доля значения',
					description:
						'делит источник на заданное число и делает его вклад мягче.'
				}
			]
		},
		sourceTransformSource: {
			title: 'Сверх источника',
			description:
				'Выбирает строку влияния, которую нужно вычесть из текущего источника.',
			items: [
				{
					term: 'Пример использования',
					description:
						'уровень заклинателя может давать бонус только за значение выше выбранного навыка.'
				},
				{
					term: 'Если разница отрицательная',
					description: 'вклад становится 0 и не уменьшает итоговое значение.'
				}
			]
		},
		sourceTransformDivisor: {
			title: 'Делитель',
			description: 'Ослабляет вклад источника перед применением кривой и веса.',
			items: [
				{ term: '2', description: 'примерно половина значения источника.' },
				{
					term: '8',
					description:
						'каждые восемь пунктов источника дают около одного шага до округления.'
				}
			]
		},
		sourceTarget: {
			title: 'Влияет на',
			description: 'Определяет место источника в формуле.',
			items: [
				{
					term: 'Базовый масштаб',
					description: 'добавляет вклад к основе значения до основного роста.'
				},
				{
					term: 'Рост',
					description:
						'усиливает прогрессию по уровню навыка или другому основному источнику.'
				},
				{
					term: 'Множитель',
					description: 'умножает итог после базовых добавок и роста.'
				},
				{
					term: 'Максимум',
					description: 'задаёт или расширяет верхнюю границу значения.'
				},
				{
					term: 'Бонус сущности',
					description: 'добавляет вклад сущности до финального умножения.'
				}
			]
		},
		sourceCurve: {
			title: 'Кривая',
			description: 'Преобразует значение источника перед применением веса.',
			items: [
				{ term: 'Слабая', description: 'даёт мягкий вклад и сдерживает рост.' },
				{ term: 'Плавная', description: 'растёт ровно и предсказуемо.' },
				{
					term: 'Быстрая',
					description: 'сильнее раскрывается на ранних значениях.'
				},
				{
					term: 'Насыщение',
					description: 'быстро растёт в начале и постепенно замедляется.'
				},
				{
					term: 'Взрывная',
					description: 'заметнее награждает высокие значения источника.'
				}
			]
		},
		sourceWeight: {
			title: 'Вес',
			description: 'Задаёт силу выбранной строки влияния.',
			items: [
				{
					term: '0',
					description: 'отключает вклад, но оставляет строку в настройке.'
				},
				{ term: '0.5', description: 'использует половину вклада источника.' },
				{ term: '1', description: 'использует источник как есть.' },
				{ term: 'Больше 1', description: 'усиливает вклад источника.' }
			]
		},
		rounding: {
			title: 'Округление',
			description:
				'Определяет, как дробный результат формулы превращается в игровое целое число.',
			items: [
				{
					term: 'Округлить вниз',
					description: 'всегда берёт меньшее целое значение.'
				},
				{ term: 'Округлить', description: 'берёт ближайшее целое значение.' },
				{
					term: 'Округлить вверх',
					description: 'всегда берёт большее целое значение.'
				}
			]
		}
	};
	protected readonly formulaSourceGroups = computed<
		MechanicCalculationSourceGroup[]
	>(() => {
		const selection = this.selectedFormulaParameter();
		const block = selection
			? (this.draft()?.mechanicBlocks[selection.blockIndex] ?? null)
			: null;

		return this.formulaSourceGroupsForBlock(block);
	});
	protected readonly formulaSourceNames = computed(
		() =>
			new Map(
				this.formulaSourceGroups()
					.flatMap(group => group.items)
					.map(item => [item.id, item.name] as const)
			)
	);
	constructor() {
		this.pageFacade.loadFromRoute();
	}

	protected setActiveTab(value: string | number | undefined) {
		this.pageStore.setActiveTab(value);
	}

	protected selectMechanicProblem(problem: MechanicProblemItem) {
		this.pageStore.selectMechanicProblem(problem.blockIndex);
	}

	protected mechanicBlockMechanic(block: SpellMechanicBlockDraft) {
		return this.findMechanic(block.mechanicId);
	}

	protected effectScaleConfig(
		block: SpellMechanicBlockDraft
	): SpellEffectScaleConfig {
		return readSpellEffectScaleConfig(block.config['effectScale']);
	}

	protected mechanicApplicationConfig(
		block: SpellMechanicBlockDraft
	): SpellMechanicApplicationConfig {
		return normalizeApplicationConfig(
			block.config.application ??
				readDefaultApplicationConfig(
					this.mechanicBlockMechanic(block)?.configSchema ?? {}
				)
		);
	}

	protected formulaParameterValue(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellFormulaParameterValue | null {
		const value = this.rawParameterValue(block, parameterId);
		return isFormulaParameterValue(value) ? value : null;
	}

	private maxActiveSkillLevel() {
		return Math.max(
			0,
			...this.skillLevels()
				.filter(level => level.isActive)
				.map(level => level.level)
		);
	}

	protected formulaSourceGroupsForBlock(
		block: SpellMechanicBlockDraft | null
	): MechanicCalculationSourceGroup[] {
		return formulaSourcePreviewGroupsForBlock(
			block,
			this.parameterSourceOptionsContext()
		);
	}

	private rawParameterValue(
		block: SpellMechanicBlockDraft,
		parameterIdOrSlug: string
	) {
		const key = this.parameterStorageKey(block, parameterIdOrSlug);

		return block.parameterValues[key];
	}

	private parameterStorageKey(
		block: SpellMechanicBlockDraft,
		parameterIdOrSlug: string
	) {
		const parameter = this.mechanicBlockMechanic(block)?.parameters.find(
			item => item.id === parameterIdOrSlug || item.slug === parameterIdOrSlug
		);

		return parameter ? parameterStorageKey(parameter) : parameterIdOrSlug;
	}

	protected closeFormulaGraphEditor() {
		this.pageStore.setSelectedFormulaParameter(null);
	}

	protected setFormulaGraphEditorVisible(visible: boolean) {
		if (!visible) {
			this.closeFormulaGraphEditor();
		}
	}

	protected selectedFormulaGraph() {
		const selection = this.selectedFormulaParameter();
		const block = selection
			? (this.draft()?.mechanicBlocks[selection.blockIndex] ?? null)
			: null;

		return block
			? (this.formulaParameterValue(block, selection?.parameterId ?? '')
					?.graph ?? null)
			: null;
	}

	protected updateSelectedFormulaGraph(
		graph: MechanicCalculationGraphState | null
	) {
		this.spellMechanicDraftFacade.updateSelectedFormulaGraph(graph);
	}

	protected showAutoHelp(event: Event, key: AutoHelpKey, popover: Popover) {
		this.pageStore.setActiveAutoHelpKey(key);
		popover.toggle(event);
	}

	protected resetDraft() {
		if (!this.hasChanges()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Сбросить изменения?',
			message: 'Все несохранённые изменения будут потеряны.',
			acceptLabel: 'Сбросить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.spellMechanicDraftFacade.resetDraft()
		});
	}

	protected saveDraft() {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.pageFacade.saveDraft(draft, this.hasChanges(), this.saving());
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
			accept: () => this.pageFacade.deleteSpell(draft.id as string)
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

	protected runRuntimePreview(resetRolls = true) {
		this.spellRuntimePreviewFacade.runRuntimePreview(resetRolls);
	}

	private findMechanic(mechanicId: string) {
		return (
			this.spellMechanics().find(mechanic => mechanic.id === mechanicId) ?? null
		);
	}

	private essenceMagicWord() {
		const essenceId = this.draft()?.essenceId;
		return (
			this.magicWords().find(
				word => word.id === essenceId && word.type === 'ESSENCE'
			) ?? null
		);
	}

	private spellTextPreviewContext(): SpellTextPreviewContext {
		return {
			draft: this.draft(),
			mechanics: this.spellMechanics(),
			progressionPresets: this.progressionPresets(),
			skills: this.skills(),
			damageTypes: this.damageTypes(),
			conditions: this.conditions(),
			formulaSourceNames: this.formulaSourceNames(),
			mode: this.spellTextPreviewMode(),
			mechanicApplicationConfig: block => this.mechanicApplicationConfig(block),
			effectScaleConfig: block => this.effectScaleConfig(block),
			evaluateAutoParameterForGameText: (block, value) =>
				this.evaluateAutoParameterForGameText(block, value)
		};
	}

	private parameterSourceOptionsContext(): SpellParameterSourceOptionsContext {
		return {
			mechanics: this.spellMechanics(),
			skillCategories: this.skillCategories(),
			skills: this.skills(),
			systemValues: this.systemValues(),
			parameterValueLabel: (kind, value) =>
				this.parameterValueLabel(kind, value)
		};
	}

	private runtimeSourceResolverContext(): SpellRuntimeSourceResolverContext {
		return {
			essenceProfile: this.essenceMagicWord()?.essenceProfile ?? null,
			mechanics: this.spellMechanics(),
			sandboxInputValues: this.sandboxInputValues(),
			skills: this.skills(),
			systemValues: this.systemValues()
		};
	}

	private parameterValueLabel(
		kind: SpellMechanicParameterKind,
		value: unknown
	): string {
		return parameterValuePreviewLabel(
			kind,
			value,
			this.spellTextPreviewContext()
		);
	}

	private evaluateAutoParameterForGameText(
		block: SpellMechanicBlockDraft,
		value: SpellAutoParameterValue
	) {
		return evaluateAutoParameterForGameText(block, value, {
			maxActiveSkillLevel: this.maxActiveSkillLevel(),
			sourceValue: (sourceBlock, source) =>
				this.autoSourceRuntimeValue(sourceBlock, source)
		});
	}

	private autoSourceRuntimeValue(
		block: SpellMechanicBlockDraft,
		source: SpellAutoParameterSource
	) {
		return resolveAutoSourceRuntimeValue(
			block,
			source,
			this.runtimeSourceResolverContext()
		);
	}
}

function parameterStorageKey(parameter: SpellMechanicParameter) {
	return parameter.slug || parameter.id;
}
