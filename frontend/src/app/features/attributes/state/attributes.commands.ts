export interface CreateAttributeCommand {
	name: string;
	description: string;
	sortOrder: number;
}

export interface UpdateAttributeCommand extends CreateAttributeCommand {
	id: string;
}

export interface UpdateAttributeActiveCommand {
	id: string;
	isActive: boolean;
}

export interface CreateCharacteristicCommand {
	name: string;
	attributeId: string;
	description: string;
	minValue: number;
	maxValue: number;
	defaultValue: number;
	sortOrder: number;
}

export interface UpdateCharacteristicCommand
	extends CreateCharacteristicCommand {
	id: string;
}

export interface UpdateCharacteristicActiveCommand {
	id: string;
	isActive: boolean;
}
