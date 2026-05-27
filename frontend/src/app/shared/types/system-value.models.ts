export type SystemValueSourceType =
	| 'attribute'
	| 'characteristic'
	| 'skill';

export type SystemValueBaseSourceType =
	| 'character-input'
	| 'computed';

export interface SystemValueDefinition {
	id: string;
	isSystemValue: boolean;
	sourceType: SystemValueSourceType;
	baseSourceType: SystemValueBaseSourceType;
}

export function createSystemValueDefinition(
	id: string,
	sourceType: SystemValueSourceType,
	baseSourceType: SystemValueBaseSourceType
): SystemValueDefinition {
	return {
		id,
		isSystemValue: true,
		sourceType,
		baseSourceType
	};
}

export function mapSystemValueBaseSourceType(
	value: 'CHARACTER_INPUT' | 'COMPUTED'
): SystemValueBaseSourceType {
	switch (value) {
		case 'CHARACTER_INPUT':
			return 'character-input';
		case 'COMPUTED':
			return 'computed';
	}
}

export function getSystemValueBaseSourceLabel(
	value: SystemValueBaseSourceType
) {
	switch (value) {
		case 'character-input':
			return 'Вводится у персонажа';
		case 'computed':
			return 'Вычисляется системой';
	}
}
