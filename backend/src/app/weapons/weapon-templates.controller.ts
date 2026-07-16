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
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWeaponTemplateDto } from './dto/create-weapon-template.dto';
import { UpdateWeaponTemplateDto } from './dto/update-weapon-template.dto';
import { WeaponsService } from './weapons.service';

@Controller('admin/weapon-templates')
@UseGuards(JwtAuthGuard)
export class WeaponTemplatesController {
	constructor(private readonly weaponsService: WeaponsService) {}

	@Post()
	async createWeaponTemplate(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateWeaponTemplateDto
	) {
		this.assertAdmin(user);
		return this.weaponsService.createWeaponTemplate(dto);
	}

	@Patch(':id')
	async updateWeaponTemplate(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateWeaponTemplateDto
	) {
		this.assertAdmin(user);
		return this.weaponsService.updateWeaponTemplate(id, dto);
	}

	@Delete(':id')
	async deleteWeaponTemplate(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.weaponsService.deleteWeaponTemplate(id);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Insufficient permissions.');
		}
	}
}
