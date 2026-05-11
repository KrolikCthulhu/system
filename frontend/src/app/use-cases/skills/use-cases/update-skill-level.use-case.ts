import { inject, Injectable } from '@angular/core';
import { UpdateSkillLevelCommand } from '../commands/skills.commands';
import { SKILLS_REPOSITORY } from '../ports/skills-repository.port';

@Injectable({ providedIn: 'root' })
export class UpdateSkillLevelUseCase {
	private readonly repository = inject(SKILLS_REPOSITORY);

	execute(command: UpdateSkillLevelCommand) {
		return this.repository.updateLevel(command);
	}
}
