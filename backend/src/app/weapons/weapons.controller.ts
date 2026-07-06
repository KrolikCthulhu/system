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
import { CreateWeaponDto } from './dto/create-weapon.dto';
import { UpdateWeaponDto } from './dto/update-weapon.dto';
import { WeaponsService } from './weapons.service';

@Controller('admin/weapons')
@UseGuards(JwtAuthGuard)
export class WeaponsController {
	constructor(private readonly weaponsService: WeaponsService) {}

	@Get()
	async getCatalog(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.weaponsService.getCatalog();
	}

	@Post()
	async createWeapon(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateWeaponDto
	) {
		this.assertAdmin(user);
		return this.weaponsService.createWeapon(dto);
	}

	@Patch(':id')
	async updateWeapon(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateWeaponDto
	) {
		this.assertAdmin(user);
		return this.weaponsService.updateWeapon(id, dto);
	}

	@Delete(':id')
	async deleteWeapon(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.weaponsService.deleteWeapon(id);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Insufficient permissions.');
		}
	}
}
