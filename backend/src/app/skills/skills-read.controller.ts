import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SkillsService } from './skills.service';

@Controller('skills')
@UseGuards(JwtAuthGuard)
export class SkillsReadController {
	constructor(private readonly skillsService: SkillsService) {}

	@Get('catalog')
	async getCatalog() {
		return this.skillsService.getAdminCatalog();
	}
}
