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
import { ConditionsService } from './conditions.service';
import { CreateConditionDto } from './dto/create-condition.dto';
import { UpdateConditionDto } from './dto/update-condition.dto';

@Controller('admin/conditions')
@UseGuards(JwtAuthGuard)
export class ConditionsController {
	constructor(private readonly conditionsService: ConditionsService) {}

	@Get()
	async getCatalog(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.conditionsService.getCatalog();
	}

	@Post()
	async createCondition(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateConditionDto
	) {
		this.assertAdmin(user);
		return this.conditionsService.createCondition(dto);
	}

	@Patch(':id')
	async updateCondition(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateConditionDto
	) {
		this.assertAdmin(user);
		return this.conditionsService.updateCondition(id, dto);
	}

	@Delete(':id')
	async deleteCondition(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.conditionsService.deleteCondition(id);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Insufficient permissions.');
		}
	}
}
