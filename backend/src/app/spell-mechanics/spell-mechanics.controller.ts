import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	Param,
	Patch,
	Post,
	UseGuards
} from '@nestjs/common';
import { UserRole } from '@prisma/generated';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSpellMechanicCategoryDto } from './dto/create-spell-mechanic-category.dto';
import { CreateSpellMechanicDto } from './dto/create-spell-mechanic.dto';
import { UpdateSpellMechanicCategoryDto } from './dto/update-spell-mechanic-category.dto';
import { UpdateSpellMechanicDto } from './dto/update-spell-mechanic.dto';
import { SpellMechanicsService } from './spell-mechanics.service';

@Controller('admin/spell-mechanics')
@UseGuards(JwtAuthGuard)
export class SpellMechanicsController {
	constructor(private readonly spellMechanicsService: SpellMechanicsService) {}

	@Get('catalog')
	async getCatalog(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.spellMechanicsService.getCatalog();
	}

	@Post('categories')
	async createCategory(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateSpellMechanicCategoryDto
	) {
		this.assertAdmin(user);
		return this.spellMechanicsService.createCategory(dto);
	}

	@Patch('categories/:id')
	async updateCategory(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateSpellMechanicCategoryDto
	) {
		this.assertAdmin(user);
		return this.spellMechanicsService.updateCategory(id, dto);
	}

	@Delete('categories/:id')
	async deleteCategory(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.spellMechanicsService.deleteCategory(id);
	}

	@Post()
	async createMechanic(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateSpellMechanicDto
	) {
		this.assertAdmin(user);
		return this.spellMechanicsService.createMechanic(dto);
	}

	@Patch(':id')
	async updateMechanic(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateSpellMechanicDto
	) {
		this.assertAdmin(user);
		return this.spellMechanicsService.updateMechanic(id, dto);
	}

	@Delete(':id')
	async deleteMechanic(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.spellMechanicsService.deleteMechanic(id);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Insufficient permissions.');
		}
	}
}
