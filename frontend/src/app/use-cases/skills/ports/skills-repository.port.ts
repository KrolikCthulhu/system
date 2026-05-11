import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	Skill,
	SkillCategory,
	SkillLevel,
	SkillsAdminCatalog
} from '../../../domain/skills/skills.models';
import {
	CreateSkillCategoryCommand,
	CreateSkillCommand,
	UpdateSkillActiveCommand,
	UpdateSkillCategoryActiveCommand,
	UpdateSkillCategoryCommand,
	UpdateSkillCommand,
	UpdateSkillLevelActiveCommand,
	UpdateSkillLevelCommand
} from '../commands/skills.commands';

export interface SkillsRepository {
	loadAdminCatalog(): Observable<SkillsAdminCatalog>;
	createSkill(command: CreateSkillCommand): Observable<Skill>;
	updateSkill(command: UpdateSkillCommand): Observable<Skill>;
	updateSkillActive(command: UpdateSkillActiveCommand): Observable<Skill>;
	createCategory(command: CreateSkillCategoryCommand): Observable<SkillCategory>;
	updateCategory(command: UpdateSkillCategoryCommand): Observable<SkillCategory>;
	updateCategoryActive(
		command: UpdateSkillCategoryActiveCommand
	): Observable<SkillCategory>;
	updateLevel(command: UpdateSkillLevelCommand): Observable<SkillLevel>;
	updateLevelActive(command: UpdateSkillLevelActiveCommand): Observable<SkillLevel>;
}

export const SKILLS_REPOSITORY = new InjectionToken<SkillsRepository>(
	'SKILLS_REPOSITORY'
);
