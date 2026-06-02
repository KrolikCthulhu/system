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
import { CreateManualSystemValueDto } from './dto/create-manual-system-value.dto';
import { UpdateSystemValueCalculationDto } from './dto/update-system-value-calculation.dto';
import { UpdateSystemValueDto } from './dto/update-system-value.dto';
import { ValuesService } from './values.service';

@Controller('admin/values')
@UseGuards(JwtAuthGuard)
export class ValuesController {
	constructor(private readonly valuesService: ValuesService) {}

	@Post()
	async createManualValue(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateManualSystemValueDto
	) {
		this.assertAdmin(user);
		return this.valuesService.createManualValue(dto);
	}

	@Patch(':id/calculation')
	async updateCalculation(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateSystemValueCalculationDto
	) {
		this.assertAdmin(user);
		return this.valuesService.updateCalculation(
			id,
			dto.calculationGraph
		);
	}

	@Patch(':id')
	async updateValue(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateSystemValueDto
	) {
		this.assertAdmin(user);
		return this.valuesService.updateManualValue(id, dto);
	}

	@Delete(':id')
	async deleteValue(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.valuesService.deleteManualValue(id);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Insufficient permissions.');
		}
	}
}
