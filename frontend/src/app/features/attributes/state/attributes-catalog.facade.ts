import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ATTRIBUTES_REPOSITORY } from '../data/attributes-repository.port';
import {
	AdminAttributesCatalogStore,
	AttributesTabValue
} from './admin-attributes-catalog.store';

@Injectable()
export class AttributesCatalogFacade {
	private readonly destroyRef = inject(DestroyRef);
	private readonly repository = inject(ATTRIBUTES_REPOSITORY);
	private readonly store = inject(AdminAttributesCatalogStore);

	readonly breadcrumbs = this.store.breadcrumbs;
	readonly activeTab = this.store.activeTab;
	readonly attributeSearch = this.store.attributeSearch;
	readonly selectedCharacteristicFilterAttributeId =
		this.store.selectedCharacteristicFilterAttributeId;
	readonly selectedAttributeId = this.store.selectedAttributeId;
	readonly selectedCharacteristicId = this.store.selectedCharacteristicId;
	readonly attributes = this.store.attributes;
	readonly characteristics = this.store.characteristics;
	readonly filteredAttributes = this.store.filteredAttributes;
	readonly selectedCharacteristicFilterAttribute =
		this.store.selectedCharacteristicFilterAttribute;
	readonly visibleCharacteristics = this.store.visibleCharacteristics;
	readonly attributeOptions = this.store.attributeOptions;
	readonly selectedAttribute = this.store.selectedAttribute;
	readonly selectedCharacteristic = this.store.selectedCharacteristic;

	constructor() {
		this.loadCatalog();
	}

	setAttributeSearch(query: string) {
		this.store.setAttributeSearch(query);
	}

	setActiveTab(tab: AttributesTabValue) {
		this.store.setActiveTab(tab);
	}

	setSelectedCharacteristicFilterAttributeId(attributeId: string) {
		this.store.setSelectedCharacteristicFilterAttributeId(attributeId);
	}

	setSelectedAttributeId(attributeId: string | null) {
		this.store.setSelectedAttributeId(attributeId);
	}

	setSelectedCharacteristicId(characteristicId: string | null) {
		this.store.setSelectedCharacteristicId(characteristicId);
	}

	prependAttribute: typeof this.store.prependAttribute = attribute =>
		this.store.prependAttribute(attribute);
	replaceAttribute: typeof this.store.replaceAttribute = (currentId, attribute) =>
		this.store.replaceAttribute(currentId, attribute);
	upsertAttribute: typeof this.store.upsertAttribute = attribute =>
		this.store.upsertAttribute(attribute);
	removeAttribute: typeof this.store.removeAttribute = attributeId =>
		this.store.removeAttribute(attributeId);
	prependCharacteristic: typeof this.store.prependCharacteristic = characteristic =>
		this.store.prependCharacteristic(characteristic);
	replaceCharacteristic: typeof this.store.replaceCharacteristic = (
		currentId,
		characteristic
	) => this.store.replaceCharacteristic(currentId, characteristic);
	upsertCharacteristic: typeof this.store.upsertCharacteristic = characteristic =>
		this.store.upsertCharacteristic(characteristic);
	removeCharacteristic: typeof this.store.removeCharacteristic = characteristicId =>
		this.store.removeCharacteristic(characteristicId);
	removeCharacteristicsByAttribute: typeof this.store.removeCharacteristicsByAttribute =
		attributeId => this.store.removeCharacteristicsByAttribute(attributeId);

	toggleAttributeActive(attributeId: string, isActive: boolean) {
		const previous = this.store.attributes();

		this.store.setAttributes(
			previous.map(attribute =>
				attribute.id === attributeId ? { ...attribute, isActive } : attribute
			)
		);

		this.repository
			.updateAttributeActive({ id: attributeId, isActive })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: attribute => this.store.upsertAttribute(attribute),
				error: () => this.store.setAttributes(previous)
			});
	}

	toggleCharacteristicActive(characteristicId: string, isActive: boolean) {
		const previous = this.store.characteristics();

		this.store.setCharacteristics(
			previous.map(characteristic =>
				characteristic.id === characteristicId
					? { ...characteristic, isActive }
					: characteristic
			)
		);

		this.repository
			.updateCharacteristicActive({ id: characteristicId, isActive })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: characteristic => this.store.upsertCharacteristic(characteristic),
				error: () => this.store.setCharacteristics(previous)
			});
	}

	deleteAttribute(attributeId: string) {
		return this.repository.deleteAttribute(attributeId);
	}

	deleteCharacteristic(characteristicId: string) {
		return this.repository.deleteCharacteristic(characteristicId);
	}

	private loadCatalog() {
		this.store.setLoading(true);

		this.repository
			.loadAdminCatalog()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => this.store.setCatalog(catalog),
				error: () => this.store.setLoading(false)
			});
	}
}
