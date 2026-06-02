import {
	Body,
	Controller,
	ForbiddenException,
	Get,
	Patch,
	Post,
	UseGuards
} from '@nestjs/common';
import { UserRole } from '@prisma/generated';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CharacterSheetSandboxService } from './character-sheet-sandbox.service';
import { RollCharacterSheetSandboxSkillDto } from './dto/roll-character-sheet-sandbox-skill.dto';
import { UpdateCharacterSheetSandboxDraftDto } from './dto/update-character-sheet-sandbox-draft.dto';

@Controller('admin/character-sheet-sandbox')
@UseGuards(JwtAuthGuard)
export class CharacterSheetSandboxController {
	constructor(private readonly service: CharacterSheetSandboxService) {}

	@Get()
	async getDraft(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.service.getDraft();
	}

	@Patch()
	async updateDraft(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: UpdateCharacterSheetSandboxDraftDto
	) {
		this.assertAdmin(user);
		return this.service.updateDraft(dto);
	}

	@Post('roll')
	async rollSkill(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: RollCharacterSheetSandboxSkillDto
	) {
		this.assertAdmin(user);
		return this.service.rollSkill(dto);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Недостаточно прав.');
		}
	}
}
