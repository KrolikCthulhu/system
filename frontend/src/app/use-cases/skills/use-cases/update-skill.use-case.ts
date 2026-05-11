import { inject, Injectable } from '@angular/core';
import { UpdateSkillCommand } from '../commands/skills.commands';
import { SKILLS_REPOSITORY } from '../ports/skills-repository.port';

@Injectable({ providedIn: 'root' })
export class UpdateSkillUseCase {
	private readonly repository = inject(SKILLS_REPOSITORY);

	execute(command: UpdateSkillCommand) {
		return this.repository.updateSkill(command);
	}
}
