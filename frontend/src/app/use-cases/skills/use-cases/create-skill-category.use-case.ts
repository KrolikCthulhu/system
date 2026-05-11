import { inject, Injectable } from '@angular/core';
import { CreateSkillCategoryCommand } from '../commands/skills.commands';
import { SKILLS_REPOSITORY } from '../ports/skills-repository.port';

@Injectable({ providedIn: 'root' })
export class CreateSkillCategoryUseCase {
	private readonly repository = inject(SKILLS_REPOSITORY);

	execute(command: CreateSkillCategoryCommand) {
		return this.repository.createCategory(command);
	}
}
