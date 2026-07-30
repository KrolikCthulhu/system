import {
	RuntimeMechanic,
	RuntimeSpell
} from '../domain/spell-runtime-preview.types';

export const SPELL_RUNTIME_PREVIEW_REPOSITORY = Symbol(
	'SPELL_RUNTIME_PREVIEW_REPOSITORY'
);

export interface SpellRuntimePreviewRepositoryPort {
	findSpell(spellId: string): Promise<RuntimeSpell | null>;
	findActiveMechanics(): Promise<RuntimeMechanic[]>;
}
