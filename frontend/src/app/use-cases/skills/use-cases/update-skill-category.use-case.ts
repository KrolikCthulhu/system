import { inject, Injectable } from '@angular/core';
import { UpdateSkillCategoryCommand } from '../commands/skills.commands';
import { SKILLS_REPOSITORY } from '../ports/skills-repository.port';

@Injectable({ providedIn: 'root' })
export class UpdateSkillCategoryUseCase {
	private readonly repository = inject(SKILLS_REPOSITORY);

	execute(command: UpdateSkillCategoryCommand) {
		return this.repository.updateCategory(command);
	}
}
