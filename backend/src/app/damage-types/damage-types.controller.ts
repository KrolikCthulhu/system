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
import { DamageTypesService } from './damage-types.service';
import { CreateDamageTypeDto } from './dto/create-damage-type.dto';
import { UpdateDamageTypeDto } from './dto/update-damage-type.dto';

@Controller('admin/damage-types')
@UseGuards(JwtAuthGuard)
export class DamageTypesController {
	constructor(private readonly damageTypesService: DamageTypesService) {}

	@Get()
	async getCatalog(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.damageTypesService.getCatalog();
	}

	@Post()
	async createDamageType(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateDamageTypeDto
	) {
		this.assertAdmin(user);
		return this.damageTypesService.createDamageType(dto);
	}

	@Patch(':id')
	async updateDamageType(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateDamageTypeDto
	) {
		this.assertAdmin(user);
		return this.damageTypesService.updateDamageType(id, dto);
	}

	@Delete(':id')
	async deleteDamageType(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.damageTypesService.deleteDamageType(id);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Insufficient permissions.');
		}
	}
}
