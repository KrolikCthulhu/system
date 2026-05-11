import { inject, Injectable } from '@angular/core';
import { UpdateSkillActiveCommand } from '../commands/skills.commands';
import { SKILLS_REPOSITORY } from '../ports/skills-repository.port';

@Injectable({ providedIn: 'root' })
export class UpdateSkillActiveUseCase {
	private readonly repository = inject(SKILLS_REPOSITORY);

	execute(command: UpdateSkillActiveCommand) {
		return this.repository.updateSkillActive(command);
	}
}
