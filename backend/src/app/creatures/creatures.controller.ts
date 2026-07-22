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
import { CreateCreatureDto } from './dto/create-creature.dto';
import { UpdateCreatureDto } from './dto/update-creature.dto';
import { CreaturesService } from './creatures.service';

@Controller('admin/creatures')
@UseGuards(JwtAuthGuard)
export class CreaturesController {
	constructor(private readonly creaturesService: CreaturesService) {}

	@Get()
	async getCatalog(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.creaturesService.getCatalog();
	}

	@Post()
	async createCreature(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateCreatureDto
	) {
		this.assertAdmin(user);
		return this.creaturesService.createCreature(dto);
	}

	@Patch(':id')
	async updateCreature(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateCreatureDto
	) {
		this.assertAdmin(user);
		return this.creaturesService.updateCreature(id, dto);
	}

	@Delete(':id')
	async deleteCreature(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.creaturesService.deleteCreature(id);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Insufficient permissions.');
		}
	}
}

@Controller('creatures')
@UseGuards(JwtAuthGuard)
export class CreaturesReadController {
	constructor(private readonly creaturesService: CreaturesService) {}

	@Get('catalog')
	getCatalog() {
		return this.creaturesService.getCatalog();
	}
}
