import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MAGIC_WORDS_REPOSITORY } from '../../../../data/magic-words-repository.port';
import { Spell } from '../../../../domain/spell.models';
import { SaveSpellCommand } from './spell-detail-draft.helpers';

@Injectable()
export class SaveSpellDetailUseCase {
	private readonly repository = inject(MAGIC_WORDS_REPOSITORY);

	execute(input: {
		spellId: string | null;
		command: SaveSpellCommand;
	}): Observable<Spell> {
		return input.spellId
			? this.repository.updateSpell(input.spellId, input.command)
			: this.repository.createSpell(input.command);
	}
}
