import { Provider } from '@angular/core';
import { HttpMagicWordsRepository } from './http-magic-words.repository';
import { MAGIC_WORDS_REPOSITORY } from './magic-words-repository.port';

export function provideMagicWordsInfrastructure(): Provider[] {
	return [
		HttpMagicWordsRepository,
		{
			provide: MAGIC_WORDS_REPOSITORY,
			useExisting: HttpMagicWordsRepository
		}
	];
}
