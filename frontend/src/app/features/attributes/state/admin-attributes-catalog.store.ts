import { computed } from '@angular/core';
import {
	patchState,
	signalStore,
	withComputed,
	withMethods,
	withState
} from '@ngrx/signals';
import {
	Attribute,
	AttributesAdminCatalog,
	Characteristic
} from '../domain/attributes.models';

export type AttributesTabValue = 'attributes' | 'characteristics';

export interface AttributeFilterItem {
	id: string;
	name: string;
	count: number;
}

interface AdminAttributesCatalogState {
	activeTab: AttributesTabValue;
	attributeSearch: string;
	selectedCharacteristicFilterAttributeId: string;
	selectedAttributeId: string | null;
	selectedCharacteristicId: string | null;
	loading: boolean;
	attributes: Attribute[];
	characteristics: Characteristic[];
}

const initialState: AdminAttributesCatalogState = {
	activeTab: 'attributes',
	attributeSearch: '',
	selectedCharacteristicFilterAttributeId: 'all',
	selectedAttributeId: null,
	selectedCharacteristicId: null,
	loading: true,
	attributes: [],
	characteristics: []
};

export const AdminAttributesCatalogStore = signalStore(
	withState(initialState),
	withComputed(store => {
		const attributeFilters = computed<AttributeFilterItem[]>(() => {
			const characteristics = store.characteristics();
			const attributes = store.attributes().map(attribute => ({
				id: attribute.id,
				name: attribute.name,
				count: characteristics.filter(
					characteristic => characteristic.attributeId === attribute.id
				).length
			}));

			return [
				{
					id: 'all',
					name: 'Все характеристики',
					count: characteristics.length
				},
				...attributes
			];
		});

		const filteredAttributes = computed(() => {
			const query = store.attributeSearch().trim().toLowerCase();

			if (!query) {
				return attributeFilters();
			}

			return attributeFilters().filter(attribute =>
				attribute.name.toLowerCase().includes(query)
			);
		});

		const selectedCharacteristicFilterAttribute = computed(
			() =>
				attributeFilters().find(
					attribute =>
						attribute.id === store.selectedCharacteristicFilterAttributeId()
				) ?? attributeFilters()[0]
		);

		return {
			breadcrumbs: computed(() => [
				{ label: 'Правила системы' },
				{ label: 'Атрибуты и характеристики' }
			]),
			attributeFilters,
			filteredAttributes,
			selectedCharacteristicFilterAttribute,
			visibleCharacteristics: computed(() => {
				const filterAttributeId =
					store.selectedCharacteristicFilterAttributeId();

				if (filterAttributeId === 'all') {
					return store.characteristics();
				}

				return store
					.characteristics()
					.filter(
						characteristic => characteristic.attributeId === filterAttributeId
					);
			}),
			attributeOptions: computed(() =>
				store.attributes().map(attribute => ({
					label: attribute.name,
					value: attribute.id
				}))
			),
			selectedAttribute: computed(() => {
				const selectedAttributeId = store.selectedAttributeId();
				return (
					store
						.attributes()
						.find(attribute => attribute.id === selectedAttributeId) ?? null
				);
			}),
			selectedCharacteristic: computed(() => {
				const selectedCharacteristicId = store.selectedCharacteristicId();
				return (
					store
						.characteristics()
						.find(
							characteristic =>
								characteristic.id === selectedCharacteristicId
						) ?? null
				);
			})
		};
	}),
	withMethods(store => ({
		setLoading(loading: boolean) {
			patchState(store, { loading });
		},
		setCatalog(catalog: AttributesAdminCatalog) {
			patchState(store, {
				attributes: catalog.attributes,
				characteristics: catalog.characteristics,
				loading: false
			});
		},
		setActiveTab(activeTab: AttributesTabValue) {
			patchState(store, { activeTab });
		},
		setAttributeSearch(attributeSearch: string) {
			patchState(store, { attributeSearch });
		},
		setSelectedCharacteristicFilterAttributeId(
			selectedCharacteristicFilterAttributeId: string
		) {
			patchState(store, { selectedCharacteristicFilterAttributeId });
		},
		setSelectedAttributeId(selectedAttributeId: string | null) {
			patchState(store, { selectedAttributeId });
		},
		setSelectedCharacteristicId(selectedCharacteristicId: string | null) {
			patchState(store, { selectedCharacteristicId });
		},
		setAttributes(attributes: Attribute[]) {
			patchState(store, { attributes });
		},
		setCharacteristics(characteristics: Characteristic[]) {
			patchState(store, { characteristics });
		},
		prependAttribute(attribute: Attribute) {
			patchState(store, state => ({
				attributes: [attribute, ...state.attributes]
			}));
		},
		replaceAttribute(currentId: string, attribute: Attribute) {
			patchState(store, state => ({
				attributes: state.attributes.map(item =>
					item.id === currentId ? attribute : item
				)
			}));
		},
		upsertAttribute(attribute: Attribute) {
			patchState(store, state => ({
				attributes: state.attributes.map(item =>
					item.id === attribute.id ? attribute : item
				)
			}));
		},
		removeAttribute(attributeId: string) {
			patchState(store, state => ({
				attributes: state.attributes.filter(attribute => attribute.id !== attributeId)
			}));
		},
		prependCharacteristic(characteristic: Characteristic) {
			patchState(store, state => ({
				characteristics: [characteristic, ...state.characteristics]
			}));
		},
		replaceCharacteristic(currentId: string, characteristic: Characteristic) {
			patchState(store, state => ({
				characteristics: state.characteristics.map(item =>
					item.id === currentId ? characteristic : item
				)
			}));
		},
		upsertCharacteristic(characteristic: Characteristic) {
			patchState(store, state => ({
				characteristics: state.characteristics.map(item =>
					item.id === characteristic.id ? characteristic : item
				)
			}));
		},
		removeCharacteristic(characteristicId: string) {
			patchState(store, state => ({
				characteristics: state.characteristics.filter(
					characteristic => characteristic.id !== characteristicId
				)
			}));
		},
		removeCharacteristicsByAttribute(attributeId: string) {
			patchState(store, state => ({
				characteristics: state.characteristics.filter(
					characteristic => characteristic.attributeId !== attributeId
				)
			}));
		}
	}))
);
