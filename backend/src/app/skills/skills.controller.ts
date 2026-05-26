import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Param,
	Patch,
	Post,
	UseGuards
} from '@nestjs/common';
import { UserRole } from '@prisma/generated';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateSkillCategoryDto } from './dto/create-skill-category.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillCategoryActiveDto } from './dto/update-skill-category-active.dto';
import { UpdateSkillCategoryDto } from './dto/update-skill-category.dto';
import { UpdateSkillActiveDto } from './dto/update-skill-active.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { UpdateSkillLevelActiveDto } from './dto/update-skill-level-active.dto';
import { UpdateSkillLevelDto } from './dto/update-skill-level.dto';
import { SkillsService } from './skills.service';

@Controller('admin/skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
	constructor(private readonly skillsService: SkillsService) {}

	@Post()
	async createSkill(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateSkillDto
	) {
		this.assertAdmin(user);
		return this.skillsService.createSkill(dto);
	}

	@Patch(':id')
	async updateSkill(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateSkillDto
	) {
		this.assertAdmin(user);
		return this.skillsService.updateSkill(id, dto);
	}

	@Patch(':id/active')
	async updateSkillActive(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateSkillActiveDto
	) {
		this.assertAdmin(user);
		return this.skillsService.updateSkillActive(id, dto);
	}

	@Delete(':id')
	async deleteSkill(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.skillsService.deleteSkill(id);
	}

	@Post('categories')
	async createCategory(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateSkillCategoryDto
	) {
		this.assertAdmin(user);
		return this.skillsService.createCategory(dto);
	}

	@Patch('categories/:id')
	async updateCategory(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateSkillCategoryDto
	) {
		this.assertAdmin(user);
		return this.skillsService.updateCategory(id, dto);
	}

	@Patch('categories/:id/active')
	async updateCategoryActive(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateSkillCategoryActiveDto
	) {
		this.assertAdmin(user);
		return this.skillsService.updateCategoryActive(id, dto);
	}

	@Delete('categories/:id')
	async deleteCategory(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.skillsService.deleteCategory(id);
	}

	@Patch('levels/:id')
	async updateLevel(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateSkillLevelDto
	) {
		this.assertAdmin(user);
		return this.skillsService.updateLevel(id, dto);
	}

	@Patch('levels/:id/active')
	async updateLevelActive(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateSkillLevelActiveDto
	) {
		this.assertAdmin(user);
		return this.skillsService.updateLevelActive(id, dto);
	}

	@Delete('levels/:id')
	async deleteLevel(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.skillsService.deleteLevel(id);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Недостаточно прав.');
		}
	}
}
