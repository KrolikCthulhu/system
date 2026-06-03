import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import {
	Skill,
	SkillCategory,
	SkillLevel,
	SkillsAdminCatalog
} from '../domain/skills.models';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import {
	CreateSkillCategoryCommand,
	CreateSkillCommand,
	UpdateSkillActiveCommand,
	UpdateSkillCategoryActiveCommand,
	UpdateSkillCategoryCommand,
	UpdateSkillCommand,
	UpdateSkillLevelActiveCommand,
	UpdateSkillLevelCommand
} from '../state/skills.commands';
import { SkillsRepository } from './skills-repository.port';
import {
	SkillCategoryDto,
	SkillDto,
	SkillLevelDto,
	SkillsAdminCatalogDto
} from './dto/skills.dto';
import {
	mapSkillCategoryDto,
	mapSkillDto,
	mapSkillLevelDto,
	mapSkillsAdminCatalogDto
} from './mappers/skills.mapper';

@Injectable({ providedIn: 'root' })
export class HttpSkillsRepository implements SkillsRepository {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadAdminCatalog(): Observable<SkillsAdminCatalog> {
		return this.http
			.get<SkillsAdminCatalogDto>(`${this.baseUrl}/skills/catalog`, {
				withCredentials: true
			})
			.pipe(
				map(mapSkillsAdminCatalogDto),
				catchError(handleApiError)
			);
	}

	loadCategories(): Observable<SkillCategory[]> {
		return this.http
			.get<SkillCategoryDto[]>(`${this.baseUrl}/admin/skills/categories`, {
				withCredentials: true
			})
			.pipe(
				map(categories => categories.map(mapSkillCategoryDto)),
				catchError(handleApiError)
			);
	}

	loadSkill(id: string): Observable<Skill> {
		return this.http
			.get<SkillDto>(`${this.baseUrl}/admin/skills/${id}`, {
				withCredentials: true
			})
			.pipe(map(mapSkillDto), catchError(handleApiError));
	}

	createSkill(command: CreateSkillCommand): Observable<Skill> {
		return this.http
			.post<SkillDto>(`${this.baseUrl}/admin/skills`, command, {
				withCredentials: true
			})
			.pipe(map(mapSkillDto), catchError(handleApiError));
	}

	updateSkill(command: UpdateSkillCommand): Observable<Skill> {
		const { id, ...payload } = command;

		return this.http
			.patch<SkillDto>(`${this.baseUrl}/admin/skills/${id}`, payload, {
				withCredentials: true
			})
			.pipe(map(mapSkillDto), catchError(handleApiError));
	}

	updateSkillActive(command: UpdateSkillActiveCommand): Observable<Skill> {
		return this.http
			.patch<SkillDto>(
				`${this.baseUrl}/admin/skills/${command.id}/active`,
				{ isActive: command.isActive },
				{ withCredentials: true }
			)
			.pipe(map(mapSkillDto), catchError(handleApiError));
	}

	deleteSkill(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/skills/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}

	createCategory(command: CreateSkillCategoryCommand): Observable<SkillCategory> {
		return this.http
			.post<SkillCategoryDto>(
				`${this.baseUrl}/admin/skills/categories`,
				command,
				{ withCredentials: true }
			)
			.pipe(
				map(mapSkillCategoryDto),
				catchError(handleApiError)
			);
	}

	updateCategory(command: UpdateSkillCategoryCommand): Observable<SkillCategory> {
		const { id, ...payload } = command;

		return this.http
			.patch<SkillCategoryDto>(
				`${this.baseUrl}/admin/skills/categories/${id}`,
				payload,
				{ withCredentials: true }
			)
			.pipe(
				map(mapSkillCategoryDto),
				catchError(handleApiError)
			);
	}

	updateCategoryActive(
		command: UpdateSkillCategoryActiveCommand
	): Observable<SkillCategory> {
		return this.http
			.patch<SkillCategoryDto>(
				`${this.baseUrl}/admin/skills/categories/${command.id}/active`,
				{ isActive: command.isActive },
				{ withCredentials: true }
			)
			.pipe(
				map(mapSkillCategoryDto),
				catchError(handleApiError)
			);
	}

	deleteCategory(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/skills/categories/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}

	updateLevel(command: UpdateSkillLevelCommand): Observable<SkillLevel> {
		const { id, ...payload } = command;

		return this.http
			.patch<SkillLevelDto>(
				`${this.baseUrl}/admin/skills/levels/${id}`,
				payload,
				{ withCredentials: true }
			)
			.pipe(
				map(mapSkillLevelDto),
				catchError(handleApiError)
			);
	}

	updateLevelActive(
		command: UpdateSkillLevelActiveCommand
	): Observable<SkillLevel> {
		return this.http
			.patch<SkillLevelDto>(
				`${this.baseUrl}/admin/skills/levels/${command.id}/active`,
				{ isActive: command.isActive },
				{ withCredentials: true }
			)
			.pipe(
				map(mapSkillLevelDto),
				catchError(handleApiError)
			);
	}

	deleteLevel(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/skills/levels/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}
}
