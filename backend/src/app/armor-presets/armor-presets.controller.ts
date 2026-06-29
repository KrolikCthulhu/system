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
import { ArmorPresetsService } from './armor-presets.service';
import { CreateArmorPresetDto } from './dto/create-armor-preset.dto';
import { UpdateArmorPresetDto } from './dto/update-armor-preset.dto';

@Controller('admin/armor-presets')
@UseGuards(JwtAuthGuard)
export class ArmorPresetsController {
	constructor(private readonly armorPresetsService: ArmorPresetsService) {}

	@Get()
	async getCatalog(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.armorPresetsService.getCatalog();
	}

	@Post()
	async createArmorPreset(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateArmorPresetDto
	) {
		this.assertAdmin(user);
		return this.armorPresetsService.createArmorPreset(dto);
	}

	@Patch(':id')
	async updateArmorPreset(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateArmorPresetDto
	) {
		this.assertAdmin(user);
		return this.armorPresetsService.updateArmorPreset(id, dto);
	}

	@Delete(':id')
	async deleteArmorPreset(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.armorPresetsService.deleteArmorPreset(id);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Insufficient permissions.');
		}
	}
}
