import { inject, Injectable } from '@angular/core';
import { SKILLS_REPOSITORY } from '../ports/skills-repository.port';

@Injectable({ providedIn: 'root' })
export class LoadSkillsAdminCatalogUseCase {
	private readonly repository = inject(SKILLS_REPOSITORY);

	execute() {
		return this.repository.loadAdminCatalog();
	}
}
