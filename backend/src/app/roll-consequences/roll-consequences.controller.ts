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
import { CreateRollConsequenceDto } from './dto/create-roll-consequence.dto';
import { UpdateRollConsequenceActiveDto } from './dto/update-roll-consequence-active.dto';
import { UpdateRollConsequenceDto } from './dto/update-roll-consequence.dto';
import { RollConsequencesService } from './roll-consequences.service';

@Controller('admin/roll-consequences')
@UseGuards(JwtAuthGuard)
export class RollConsequencesController {
	constructor(private readonly service: RollConsequencesService) {}

	@Get()
	async getCatalog(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.service.getCatalog();
	}

	@Get('options')
	async getOptions(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.service.getOptions();
	}

	@Get(':id')
	async get(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		return this.service.get(id);
	}

	@Post()
	async create(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateRollConsequenceDto
	) {
		this.assertAdmin(user);
		return this.service.create(dto);
	}

	@Patch(':id')
	async update(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateRollConsequenceDto
	) {
		this.assertAdmin(user);
		return this.service.update(id, dto);
	}

	@Patch(':id/active')
	async updateActive(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateRollConsequenceActiveDto
	) {
		this.assertAdmin(user);
		return this.service.updateActive(id, dto);
	}

	@Delete(':id')
	async delete(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.service.delete(id);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Недостаточно прав.');
		}
	}
}
