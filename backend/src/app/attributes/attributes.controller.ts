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
import { AttributesService } from './attributes.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { CreateCharacteristicDto } from './dto/create-characteristic.dto';
import { UpdateAttributeActiveDto } from './dto/update-attribute-active.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { UpdateCharacteristicActiveDto } from './dto/update-characteristic-active.dto';
import { UpdateCharacteristicDto } from './dto/update-characteristic.dto';

@Controller('admin/attributes')
@UseGuards(JwtAuthGuard)
export class AttributesController {
	constructor(private readonly attributesService: AttributesService) {}

	@Post()
	async createAttribute(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateAttributeDto
	) {
		this.assertAdmin(user);
		return this.attributesService.createAttribute(dto);
	}

	@Patch(':id')
	async updateAttribute(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateAttributeDto
	) {
		this.assertAdmin(user);
		return this.attributesService.updateAttribute(id, dto);
	}

	@Patch(':id/active')
	async updateAttributeActive(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateAttributeActiveDto
	) {
		this.assertAdmin(user);
		return this.attributesService.updateAttributeActive(id, dto);
	}

	@Delete(':id')
	async deleteAttribute(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.attributesService.deleteAttribute(id);
	}

	@Post('characteristics')
	async createCharacteristic(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateCharacteristicDto
	) {
		this.assertAdmin(user);
		return this.attributesService.createCharacteristic(dto);
	}

	@Patch('characteristics/:id')
	async updateCharacteristic(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateCharacteristicDto
	) {
		this.assertAdmin(user);
		return this.attributesService.updateCharacteristic(id, dto);
	}

	@Patch('characteristics/:id/active')
	async updateCharacteristicActive(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateCharacteristicActiveDto
	) {
		this.assertAdmin(user);
		return this.attributesService.updateCharacteristicActive(id, dto);
	}

	@Delete('characteristics/:id')
	async deleteCharacteristic(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.attributesService.deleteCharacteristic(id);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Insufficient permissions.');
		}
	}
}
