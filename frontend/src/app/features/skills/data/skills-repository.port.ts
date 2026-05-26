import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	Skill,
	SkillCategory,
	SkillLevel,
	SkillsAdminCatalog
} from '../domain/skills.models';
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

export interface SkillsRepository {
	loadAdminCatalog(): Observable<SkillsAdminCatalog>;
	createSkill(command: CreateSkillCommand): Observable<Skill>;
	updateSkill(command: UpdateSkillCommand): Observable<Skill>;
	updateSkillActive(command: UpdateSkillActiveCommand): Observable<Skill>;
	deleteSkill(id: string): Observable<void>;
	createCategory(command: CreateSkillCategoryCommand): Observable<SkillCategory>;
	updateCategory(command: UpdateSkillCategoryCommand): Observable<SkillCategory>;
	updateCategoryActive(
		command: UpdateSkillCategoryActiveCommand
	): Observable<SkillCategory>;
	deleteCategory(id: string): Observable<void>;
	updateLevel(command: UpdateSkillLevelCommand): Observable<SkillLevel>;
	updateLevelActive(command: UpdateSkillLevelActiveCommand): Observable<SkillLevel>;
	deleteLevel(id: string): Observable<void>;
}

export const SKILLS_REPOSITORY = new InjectionToken<SkillsRepository>(
	'SKILLS_REPOSITORY'
);
