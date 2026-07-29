import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import {
	MagicSpellFormulasCatalog,
	MagicWord,
	MagicWordsCatalog
} from '../domain/magic-word.models';
import {
	Spell,
	SpellCatalog,
	SpellRuntimePreview,
	SpellRuntimePreviewRequest
} from '../domain/spell.models';
import {
	CreateMagicWordDto,
	MagicSpellFormulasResponseDto,
	MagicWordDto,
	MagicWordsResponseDto,
	SaveSpellDto,
	SpellCatalogResponseDto,
	SpellDto,
	SpellRuntimePreviewDto,
	UpdateMagicWordDto
} from './dto/magic-words.dto';
import { MagicWordsRepository } from './magic-words-repository.port';
import {
	mapMagicSpellFormulasResponseDto,
	mapMagicWordDto,
	mapMagicWordsResponseDto,
	mapSpellCatalogResponseDto,
	mapSpellDto,
	mapSpellRuntimePreviewDto
} from './mappers/magic-words.mapper';

@Injectable({ providedIn: 'root' })
export class HttpMagicWordsRepository implements MagicWordsRepository {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCatalog(): Observable<MagicWordsCatalog> {
		return this.http
			.get<MagicWordsResponseDto>(`${this.baseUrl}/admin/magic/words`, {
				withCredentials: true
			})
			.pipe(map(mapMagicWordsResponseDto), catchError(handleApiError));
	}

	loadSpellFormulas(): Observable<MagicSpellFormulasCatalog> {
		return this.http
			.get<MagicSpellFormulasResponseDto>(
				`${this.baseUrl}/admin/magic/words/spell-formulas`,
				{ withCredentials: true }
			)
			.pipe(map(mapMagicSpellFormulasResponseDto), catchError(handleApiError));
	}

	createWord(command: CreateMagicWordDto): Observable<MagicWord> {
		return this.http
			.post<MagicWordDto>(`${this.baseUrl}/admin/magic/words`, command, {
				withCredentials: true
			})
			.pipe(map(mapMagicWordDto), catchError(handleApiError));
	}

	updateWord(id: string, command: UpdateMagicWordDto): Observable<MagicWord> {
		return this.http
			.patch<MagicWordDto>(`${this.baseUrl}/admin/magic/words/${id}`, command, {
				withCredentials: true
			})
			.pipe(map(mapMagicWordDto), catchError(handleApiError));
	}

	deleteWord(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/magic/words/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}

	loadSpellCatalog(): Observable<SpellCatalog> {
		return this.http
			.get<SpellCatalogResponseDto>(
				`${this.baseUrl}/admin/magic/spells/catalog`,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapSpellCatalogResponseDto), catchError(handleApiError));
	}

	loadSpell(id: string): Observable<Spell> {
		return this.http
			.get<SpellDto>(`${this.baseUrl}/admin/magic/spells/${id}`, {
				withCredentials: true
			})
			.pipe(map(mapSpellDto), catchError(handleApiError));
	}

	createSpell(command: SaveSpellDto): Observable<Spell> {
		return this.http
			.post<SpellDto>(`${this.baseUrl}/admin/magic/spells`, command, {
				withCredentials: true
			})
			.pipe(map(mapSpellDto), catchError(handleApiError));
	}

	updateSpell(id: string, command: SaveSpellDto): Observable<Spell> {
		return this.http
			.patch<SpellDto>(`${this.baseUrl}/admin/magic/spells/${id}`, command, {
				withCredentials: true
			})
			.pipe(map(mapSpellDto), catchError(handleApiError));
	}

	updateSpellActivity(id: string, isActive: boolean): Observable<Spell> {
		return this.http
			.patch<SpellDto>(
				`${this.baseUrl}/admin/magic/spells/${id}/activity`,
				{ isActive },
				{ withCredentials: true }
			)
			.pipe(map(mapSpellDto), catchError(handleApiError));
	}

	deleteSpell(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/magic/spells/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}

	executeSpellRuntimePreview(
		id: string,
		command: SpellRuntimePreviewRequest
	): Observable<SpellRuntimePreview> {
		return this.http
			.post<SpellRuntimePreviewDto>(
				`${this.baseUrl}/admin/magic/spells/${id}/runtime-preview`,
				command,
				{ withCredentials: true }
			)
			.pipe(map(mapSpellRuntimePreviewDto), catchError(handleApiError));
	}
}
