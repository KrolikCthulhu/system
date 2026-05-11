import { inject, Injectable } from '@angular/core';
import { CreateSkillCommand } from '../commands/skills.commands';
import { SKILLS_REPOSITORY } from '../ports/skills-repository.port';

@Injectable({ providedIn: 'root' })
export class CreateSkillUseCase {
	private readonly repository = inject(SKILLS_REPOSITORY);

	execute(command: CreateSkillCommand) {
		return this.repository.createSkill(command);
	}
}
