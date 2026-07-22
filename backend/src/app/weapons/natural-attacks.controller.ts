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
import { CreateNaturalAttackDto } from './dto/create-natural-attack.dto';
import { UpdateNaturalAttackDto } from './dto/update-natural-attack.dto';
import { NaturalAttacksService } from './natural-attacks.service';

@Controller('admin/natural-attacks')
@UseGuards(JwtAuthGuard)
export class NaturalAttacksController {
	constructor(private readonly naturalAttacksService: NaturalAttacksService) {}

	@Get()
	async getCatalog(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.naturalAttacksService.getCatalog();
	}

	@Post()
	async createNaturalAttack(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateNaturalAttackDto
	) {
		this.assertAdmin(user);
		return this.naturalAttacksService.createNaturalAttack(dto);
	}

	@Patch(':id')
	async updateNaturalAttack(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateNaturalAttackDto
	) {
		this.assertAdmin(user);
		return this.naturalAttacksService.updateNaturalAttack(id, dto);
	}

	@Delete(':id')
	async deleteNaturalAttack(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.naturalAttacksService.deleteNaturalAttack(id);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Insufficient permissions.');
		}
	}
}
