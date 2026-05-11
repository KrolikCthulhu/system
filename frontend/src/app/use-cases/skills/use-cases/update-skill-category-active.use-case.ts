import { inject, Injectable } from '@angular/core';
import { UpdateSkillCategoryActiveCommand } from '../commands/skills.commands';
import { SKILLS_REPOSITORY } from '../ports/skills-repository.port';

@Injectable({ providedIn: 'root' })
export class UpdateSkillCategoryActiveUseCase {
	private readonly repository = inject(SKILLS_REPOSITORY);

	execute(command: UpdateSkillCategoryActiveCommand) {
		return this.repository.updateCategoryActive(command);
	}
}
