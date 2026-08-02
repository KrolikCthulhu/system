import {
	Body,
	Controller,
	ForbiddenException,
	Get,
	Param,
	Patch,
	UseGuards
} from '@nestjs/common';
import { UserRole } from '@prisma/generated';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSystemCombatActionDto } from './dto/update-system-combat-action.dto';
import { SystemCombatActionsService } from './system-combat-actions.service';

@Controller('admin/system-combat-actions')
@UseGuards(JwtAuthGuard)
export class SystemCombatActionsController {
	constructor(private readonly actionsService: SystemCombatActionsService) {}

	@Get()
	getCatalog(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.actionsService.getCatalog();
	}

	@Patch(':id')
	updateAction(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateSystemCombatActionDto
	) {
		this.assertAdmin(user);
		return this.actionsService.updateAction(id, dto);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Insufficient permissions.');
		}
	}
}
