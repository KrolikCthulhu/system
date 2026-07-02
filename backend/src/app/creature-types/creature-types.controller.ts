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
import { CreatureTypesService } from './creature-types.service';
import { CreateCreatureTypeDto } from './dto/create-creature-type.dto';
import { UpdateCreatureTypeDto } from './dto/update-creature-type.dto';

@Controller('admin/creature-types')
@UseGuards(JwtAuthGuard)
export class CreatureTypesController {
	constructor(private readonly creatureTypesService: CreatureTypesService) {}

	@Get()
	async getCatalog(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.creatureTypesService.getCatalog();
	}

	@Post()
	async createCreatureType(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateCreatureTypeDto
	) {
		this.assertAdmin(user);
		return this.creatureTypesService.createCreatureType(dto);
	}

	@Patch(':id')
	async updateCreatureType(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateCreatureTypeDto
	) {
		this.assertAdmin(user);
		return this.creatureTypesService.updateCreatureType(id, dto);
	}

	@Delete(':id')
	async deleteCreatureType(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.creatureTypesService.deleteCreatureType(id);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Insufficient permissions.');
		}
	}
}
