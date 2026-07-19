import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpCode,
	Param,
	Patch,
	Post,
	UseGuards
} from '@nestjs/common';
import { UserRole } from '@prisma/generated';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnatomySchemesService } from './anatomy-schemes.service';
import { CreateAnatomySchemeDto } from './dto/create-anatomy-scheme.dto';
import { UpdateAnatomySchemeDto } from './dto/update-anatomy-scheme.dto';

@Controller('admin/anatomy-schemes')
@UseGuards(JwtAuthGuard)
export class AnatomySchemesController {
	constructor(private readonly anatomySchemesService: AnatomySchemesService) {}

	@Get()
	async getCatalog(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.anatomySchemesService.getCatalog();
	}

	@Post()
	async createScheme(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateAnatomySchemeDto
	) {
		this.assertAdmin(user);
		return this.anatomySchemesService.createScheme(dto);
	}

	@Patch(':id')
	async updateScheme(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateAnatomySchemeDto
	) {
		this.assertAdmin(user);
		return this.anatomySchemesService.updateScheme(id, dto);
	}

	@Delete(':id')
	@HttpCode(204)
	async deleteScheme(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.anatomySchemesService.deleteScheme(id);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Insufficient permissions.');
		}
	}
}
