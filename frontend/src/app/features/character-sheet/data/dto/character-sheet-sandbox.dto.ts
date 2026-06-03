import { CharacterSheetSandboxRoll } from '../../domain/character-sheet-sandbox.models';

export interface CharacterSheetSandboxDraftDto {
	inputValues: Record<string, number>;
}

export interface CharacterSheetSandboxRollDto extends CharacterSheetSandboxDraftDto {
	roll: CharacterSheetSandboxRoll;
}
