import {
	CharacterSheetSandboxDraft,
	CharacterSheetSandboxRollResult
} from '../../domain/character-sheet-sandbox.models';
import {
	CharacterSheetSandboxDraftDto,
	CharacterSheetSandboxRollDto
} from '../dto/character-sheet-sandbox.dto';

export function mapCharacterSheetSandboxDraftDto(
	dto: CharacterSheetSandboxDraftDto
): CharacterSheetSandboxDraft {
	return {
		inputValues: dto.inputValues
	};
}

export function mapCharacterSheetSandboxRollDto(
	dto: CharacterSheetSandboxRollDto
): CharacterSheetSandboxRollResult {
	return {
		inputValues: dto.inputValues,
		roll: dto.roll
	};
}
