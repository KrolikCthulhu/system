import { computed, inject, Injectable } from '@angular/core';
import {
	SpellMechanic,
	SpellMechanicParameter
} from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import { defaultParameterValue } from '../../read-model/spell-mechanic-draft.helpers';
import { isConfiguredParameterValue } from '../../read-model/spell-mechanic-readiness.presenter';
import { parameterValueLabel } from '../../read-model/spell-text-preview.presenter';
import { SpellTextTabFacade } from '../../tabs/text/spell-text-tab.facade';
import { targetConfigText } from '../../utils/spell-target-config.utils';
import { isStaticParameterValue } from '../../utils/spell-numeric-parameter.utils';
import { SpellMechanicDraftFacade } from '../../application/spell-mechanic-draft.facade';
import { AdminSpellDetailPageStore } from '../../state/admin-spell-detail-page.store';
import {
	SpellAddMechanicDialogActions,
	SpellAddMechanicDialogViewModel
} from './spell-add-mechanic-dialog.component';

@Injectable()
export class SpellAddMechanicDialogFacade {
	private readonly store = inject(AdminSpellDetailPageStore);
	private readonly mechanicDraftFacade = inject(SpellMechanicDraftFacade);
	private readonly textTabFacade = inject(SpellTextTabFacade);

	readonly viewModel = computed<SpellAddMechanicDialogViewModel>(() => ({
		visible: this.store.addMechanicWizardVisible(),
		mechanicOptions: this.mechanicOptions(),
		selectedMechanicId: this.store.selectedWizardMechanicId(),
		selectedMechanic: this.selectedMechanic(),
		requiredParameters: mechanic => this.requiredParameters(mechanic),
		parameterDefaultLabel: parameter => this.parameterDefaultLabel(parameter),
		parameterReady: parameter => this.parameterReady(parameter)
	}));
	readonly actions: SpellAddMechanicDialogActions = {
		setVisible: visible => this.store.setAddMechanicWizardVisible(visible),
		updateMechanic: mechanicId =>
			this.store.setSelectedWizardMechanicId(mechanicId),
		confirm: () => this.mechanicDraftFacade.addSelectedMechanicBlock()
	};

	private readonly mechanicOptions = computed(() =>
		this.store
			.spellMechanics()
			.filter(mechanic => mechanic.isActive)
			.sort((left, right) => left.sortOrder - right.sortOrder)
			.map(mechanic => ({
				label: mechanic.name,
				value: mechanic.id
			}))
	);
	private readonly selectedMechanic = computed(() => {
		const mechanicId = this.store.selectedWizardMechanicId();

		return (
			this.store
				.spellMechanics()
				.find(mechanic => mechanic.id === mechanicId) ??
			this.store.spellMechanics().filter(mechanic => mechanic.isActive)[0] ??
			null
		);
	});

	private requiredParameters(mechanic: SpellMechanic) {
		return mechanic.parameters.filter(parameter => parameter.required);
	}

	private parameterDefaultLabel(parameter: SpellMechanicParameter) {
		const essence = this.essenceMagicWord();

		if (parameter.kind === 'target' && parameter.defaultTargetConfig) {
			return targetConfigText(parameter.defaultTargetConfig);
		}

		const value = defaultParameterValue(parameter, essence, {});

		if (isStaticParameterValue(value)) {
			return value.value || 'Требуется настройка';
		}

		if (typeof value === 'string' && value) {
			return parameterValueLabel(
				parameter.kind,
				value,
				this.textTabFacade.previewContext()
			);
		}

		if (parameter.defaultValue.mode === 'fromMagicWord') {
			return 'Из сущности, если связь задана';
		}

		return 'Требуется настройка';
	}

	private parameterReady(parameter: SpellMechanicParameter) {
		const value = defaultParameterValue(parameter, this.essenceMagicWord(), {});

		if (parameter.kind === 'target') {
			return !!parameter.defaultTargetConfig;
		}

		return isConfiguredParameterValue(parameter, value, this.store.draft());
	}

	private essenceMagicWord() {
		const essenceId = this.store.draft()?.essenceId;

		return (
			this.store
				.magicWords()
				.find(word => word.id === essenceId && word.type === 'ESSENCE') ?? null
		);
	}
}
