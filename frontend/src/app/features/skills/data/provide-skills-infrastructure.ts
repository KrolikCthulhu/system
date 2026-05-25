import { Provider } from '@angular/core';
import { SKILLS_REPOSITORY } from './skills-repository.port';
import { HttpSkillsRepository } from './http-skills.repository';

export function provideSkillsInfrastructure(): Provider[] {
	return [
		HttpSkillsRepository,
		{
			provide: SKILLS_REPOSITORY,
			useExisting: HttpSkillsRepository
		}
	];
}
