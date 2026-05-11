import { inject, Injectable } from '@angular/core';
import { UpdateSkillLevelActiveCommand } from '../commands/skills.commands';
import { SKILLS_REPOSITORY } from '../ports/skills-repository.port';

@Injectable({ providedIn: 'root' })
export class UpdateSkillLevelActiveUseCase {
	private readonly repository = inject(SKILLS_REPOSITORY);

	execute(command: UpdateSkillLevelActiveCommand) {
		return this.repository.updateLevelActive(command);
	}
}
