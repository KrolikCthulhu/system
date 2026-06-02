import { Attribute, Characteristic } from './attributes.models';

export interface CharacteristicOption {
	label: string;
	value: string;
}

export interface CharacteristicOptionGroup {
	label: string;
	items: CharacteristicOption[];
}

export function createCharacteristicOptionGroups(
	attributes: Attribute[],
	characteristics: Characteristic[]
): CharacteristicOptionGroup[] {
	const activeCharacteristics = characteristics.filter(
		characteristic => characteristic.isActive
	);

	return attributes
		.filter(attribute => attribute.isActive)
		.map(attribute => ({
			label: attribute.name,
			items: activeCharacteristics
				.filter(characteristic => characteristic.attributeId === attribute.id)
				.map(characteristic => ({
					label: characteristic.name,
					value: characteristic.id
				}))
		}))
		.filter(group => group.items.length > 0);
}
