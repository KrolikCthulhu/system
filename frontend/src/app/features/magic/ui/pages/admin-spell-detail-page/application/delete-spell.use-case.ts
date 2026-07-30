import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MAGIC_WORDS_REPOSITORY } from '../../../../data/magic-words-repository.port';

@Injectable()
export class DeleteSpellUseCase {
	private readonly repository = inject(MAGIC_WORDS_REPOSITORY);

	execute(spellId: string): Observable<void> {
		return this.repository.deleteSpell(spellId);
	}
}
