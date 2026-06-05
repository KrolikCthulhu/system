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
import { CreateProgressionPresetDto } from './dto/create-progression-preset.dto';
import { UpdateProgressionPresetDto } from './dto/update-progression-preset.dto';
import { ProgressionPresetsService } from './progression-presets.service';

@Controller('admin/progression-presets')
@UseGuards(JwtAuthGuard)
export class ProgressionPresetsController {
	constructor(private readonly progressionPresetsService: ProgressionPresetsService) {}

	@Get()
	async getCatalog(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.progressionPresetsService.getCatalog();
	}

	@Post()
	async createPreset(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateProgressionPresetDto
	) {
		this.assertAdmin(user);
		return this.progressionPresetsService.createPreset(dto);
	}

	@Patch(':id')
	async updatePreset(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateProgressionPresetDto
	) {
		this.assertAdmin(user);
		return this.progressionPresetsService.updatePreset(id, dto);
	}

	@Delete(':id')
	async deletePreset(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.progressionPresetsService.deletePreset(id);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Insufficient permissions.');
		}
	}
}
