import {
	Body,
	Controller,
	ForbiddenException,
	Param,
	Patch,
	UseGuards
} from '@nestjs/common';
import { UserRole } from '@prisma/generated';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSystemValueCalculationDto } from './dto/update-system-value-calculation.dto';
import { ValuesService } from './values.service';

@Controller('admin/values')
@UseGuards(JwtAuthGuard)
export class ValuesController {
	constructor(private readonly valuesService: ValuesService) {}

	@Patch(':id/calculation')
	async updateCalculation(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateSystemValueCalculationDto
	) {
		this.assertAdmin(user);
		return this.valuesService.updateCalculation(
			id,
			dto.baseSourceType,
			dto.calculationGraph
		);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Insufficient permissions.');
		}
	}
}
