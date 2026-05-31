import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Fluid } from 'primeng/fluid';
import { Select } from 'primeng/select';
import { Splitter } from 'primeng/splitter';
import { TableModule } from 'primeng/table';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { getSystemValueBaseSourceLabel } from '../../../../../shared/types/system-value.models';
import {
	Attribute,
	Characteristic
} from '../../../domain/attributes.models';
import { SystemValuesCatalogFacade } from '../../../../values/state/system-values-catalog.facade';
import { SystemValueCalculationDefinition } from '../../../../values/domain/system-value-calculation.models';
import { SystemValueCalculationEditorComponent } from '../../../../values/ui/components/system-value-calculation-editor/system-value-calculation-editor.component';
import { AdminAttributesCatalogStore } from '../../../state/admin-attributes-catalog.store';
import { AttributeEditorFacade } from '../../../state/attribute-editor.facade';
import { AttributeEditorStore } from '../../../state/attribute-editor.store';
import { AttributesCatalogFacade } from '../../../state/attributes-catalog.facade';
import { CharacteristicEditorFacade } from '../../../state/characteristic-editor.facade';
import { CharacteristicEditorStore } from '../../../state/characteristic-editor.store';

@Component({
	selector: 'app-admin-attributes-page',
	imports: [
		Breadcrumb,
		Button,
		ConfirmDialog,
		FormsModule,
		Fluid,
		IconField,
		InputIcon,
		InputNumber,
		InputText,
		ReactiveFormsModule,
		Select,
		Splitter,
		Tab,
		TableModule,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
		Textarea,
		ToggleSwitch,
		SystemValueCalculationEditorComponent
	],
	templateUrl: './admin-attributes-page.component.html',
	styleUrl: './admin-attributes-page.component.scss',
	providers: [
		ConfirmationService,
		AdminAttributesCatalogStore,
		AttributeEditorStore,
		CharacteristicEditorStore,
		UnsavedChangesGuard,
		AttributesCatalogFacade,
		AttributeEditorFacade,
		CharacteristicEditorFacade
	]
})
export class AdminAttributesPageComponent {
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly catalogFacade = inject(AttributesCatalogFacade);
	private readonly attributeEditorFacade = inject(AttributeEditorFacade);
	private readonly characteristicEditorFacade = inject(
		CharacteristicEditorFacade
	);
	private readonly systemValuesCatalogFacade = inject(SystemValuesCatalogFacade);

	protected readonly tabValue = signal<string | number | undefined>(undefined);
	protected readonly attributeEditorOpen = signal(false);
	protected readonly characteristicEditorOpen = signal(false);

	protected readonly breadcrumbs = this.catalogFacade.breadcrumbs;
	protected readonly activeTab = this.catalogFacade.activeTab;
	protected readonly attributeSearch = this.catalogFacade.attributeSearch;
	protected readonly selectedCharacteristicFilterAttributeId =
		this.catalogFacade.selectedCharacteristicFilterAttributeId;
	protected readonly selectedAttributeId = this.catalogFacade.selectedAttributeId;
	protected readonly selectedCharacteristicId =
		this.catalogFacade.selectedCharacteristicId;
	protected readonly attributes = this.catalogFacade.attributes;
	protected readonly characteristics = this.catalogFacade.characteristics;
	protected readonly attributeForm = this.attributeEditorFacade.form;
	protected readonly characteristicForm = this.characteristicEditorFacade.form;
	protected readonly filteredAttributes = this.catalogFacade.filteredAttributes;
	protected readonly selectedCharacteristicFilterAttribute =
		this.catalogFacade.selectedCharacteristicFilterAttribute;
	protected readonly visibleCharacteristics =
		this.catalogFacade.visibleCharacteristics;
	protected readonly attributeOptions = this.catalogFacade.attributeOptions;
	protected readonly selectedAttribute = this.catalogFacade.selectedAttribute;
	protected readonly selectedCharacteristic =
		this.catalogFacade.selectedCharacteristic;
	protected readonly availableValues = this.systemValuesCatalogFacade.values;
	protected readonly attributeSystemValueCalculation =
		this.attributeEditorFacade.systemValueCalculation;
	protected readonly characteristicSystemValueCalculation =
		this.characteristicEditorFacade.systemValueCalculation;

	constructor() {
		this.systemValuesCatalogFacade.ensureLoaded();

		effect(() => {
			this.tabValue.set(this.activeTab());
		});

		effect(() => {
			if (this.attributeEditorOpen() && !this.selectedAttribute()) {
				this.attributeEditorOpen.set(false);
			}
		});

		effect(() => {
			if (this.characteristicEditorOpen() && !this.selectedCharacteristic()) {
				this.characteristicEditorOpen.set(false);
			}
		});
	}

	protected setAttributeSearch(query: string) {
		this.catalogFacade.setAttributeSearch(query);
	}

	protected selectCharacteristicFilterAttribute(attributeId: string) {
		this.characteristicEditorFacade.selectCharacteristicFilterAttribute(
			attributeId
		);
	}

	protected toggleAttributeActive(attributeId: string, isActive: boolean) {
		this.catalogFacade.toggleAttributeActive(attributeId, isActive);
	}

	protected toggleCharacteristicActive(
		characteristicId: string,
		isActive: boolean
	) {
		this.catalogFacade.toggleCharacteristicActive(characteristicId, isActive);
	}

	protected openAttributeEditor(attributeId: string) {
		this.attributeEditorFacade.selectAttribute(attributeId);
		this.attributeEditorOpen.set(true);
	}

	protected openCharacteristicEditor(characteristicId: string) {
		this.characteristicEditorFacade.selectCharacteristic(characteristicId);
		this.characteristicEditorOpen.set(true);
	}

	protected closeAttributeEditor() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.attributeEditorFacade.hasUnsavedChanges(),
			discard: () => this.attributeEditorFacade.cancelAttribute(),
			proceed: () => this.attributeEditorOpen.set(false)
		});
	}

	protected closeCharacteristicEditor() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.characteristicEditorFacade.hasUnsavedChanges(),
			discard: () => this.characteristicEditorFacade.cancelCharacteristic(),
			proceed: () => this.characteristicEditorOpen.set(false)
		});
	}

	protected addAttribute() {
		this.attributeEditorFacade.addAttribute();
		this.attributeEditorOpen.set(true);
	}

	protected addCharacteristic() {
		this.characteristicEditorFacade.addCharacteristic();
		this.characteristicEditorOpen.set(true);
	}

	protected saveAttribute() {
		this.attributeEditorFacade.saveAttribute();
	}

	protected cancelAttribute() {
		this.attributeEditorFacade.cancelAttribute();
	}

	protected saveCharacteristic() {
		this.characteristicEditorFacade.saveCharacteristic();
	}

	protected cancelCharacteristic() {
		this.characteristicEditorFacade.cancelCharacteristic();
	}

	protected confirmDeleteAttribute(attribute: Attribute) {
		const relatedCharacteristicsCount = this.countAttributeCharacteristics(
			attribute.id
		);
		const message =
			relatedCharacteristicsCount > 0
				? `Атрибут "${attribute.name}" будет удалён вместе со связанными характеристиками (${relatedCharacteristicsCount}). Это действие нельзя отменить.`
				: `Атрибут "${attribute.name}" будет удалён без возможности восстановления.`;

		this.confirmationService.confirm({
			header: 'Удалить атрибут?',
			message,
			icon: 'pi pi-trash',
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.attributeEditorFacade.deleteAttribute(attribute.id)
		});
	}

	protected confirmDeleteCharacteristic(characteristic: Characteristic) {
		this.confirmationService.confirm({
			header: 'Удалить характеристику?',
			message: `Характеристика "${characteristic.name}" будет удалена без возможности восстановления.`,
			icon: 'pi pi-trash',
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () =>
				this.characteristicEditorFacade.deleteCharacteristic(characteristic.id)
		});
	}

	protected setActiveTab(value: string | number | undefined) {
		if (value !== 'attributes' && value !== 'characteristics') {
			return;
		}

		const currentTab = this.activeTab();

		if (value === currentTab) {
			return;
		}

		this.tabValue.set(currentTab);

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasCurrentTabUnsavedChanges(),
			discard: () => this.discardCurrentTabChanges(),
			proceed: () => this.catalogFacade.setActiveTab(value)
		});
	}

	protected requestActiveTabChange(
		event: Event,
		value: 'attributes' | 'characteristics'
	) {
		event.preventDefault();
		event.stopPropagation();
		this.setActiveTab(value);
	}

	protected isAttributeSaveDisabled() {
		return this.attributeEditorFacade.isSaveDisabled();
	}

	protected isCharacteristicSaveDisabled() {
		return this.characteristicEditorFacade.isSaveDisabled();
	}

	protected isDraftAttributeSelected() {
		return this.attributeEditorFacade.isDraftSelected();
	}

	protected isDraftCharacteristicSelected() {
		return this.characteristicEditorFacade.isDraftSelected();
	}

	protected updateAttributeSystemValueCalculation(
		next: SystemValueCalculationDefinition
	) {
		this.attributeEditorFacade.updateSystemValueCalculation(next);
	}

	protected updateCharacteristicSystemValueCalculation(
		next: SystemValueCalculationDefinition
	) {
		this.characteristicEditorFacade.updateSystemValueCalculation(next);
	}

	protected getSystemValueBaseSourceLabel = getSystemValueBaseSourceLabel;

	private hasCurrentTabUnsavedChanges() {
		switch (this.activeTab()) {
			case 'attributes':
				return this.attributeEditorFacade.hasUnsavedChanges();
			case 'characteristics':
				return this.characteristicEditorFacade.hasUnsavedChanges();
		}
	}

	private discardCurrentTabChanges() {
		switch (this.activeTab()) {
			case 'attributes':
				this.attributeEditorFacade.cancelAttribute();
				return;
			case 'characteristics':
				this.characteristicEditorFacade.cancelCharacteristic();
				return;
		}
	}

	private countAttributeCharacteristics(attributeId: string) {
		return this.catalogFacade
			.characteristics()
			.filter(characteristic => characteristic.attributeId === attributeId)
			.length;
	}
}
