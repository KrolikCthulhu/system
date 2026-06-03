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
import { CreateMagicWordDto } from './dto/create-magic-word.dto';
import { UpdateMagicWordDto } from './dto/update-magic-word.dto';
import { SaveSpellDto } from './dto/save-spell.dto';
import { MagicService } from './magic.service';

@Controller('admin/magic')
@UseGuards(JwtAuthGuard)
export class MagicController {
	constructor(private readonly magicService: MagicService) {}

	@Get('words')
	async getWords(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.magicService.getWords();
	}

	@Get('words/spell-formulas')
	async getSpellFormulas(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.magicService.getSpellFormulas();
	}

	@Post('words')
	async createWord(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: CreateMagicWordDto
	) {
		this.assertAdmin(user);
		return this.magicService.createWord(dto);
	}

	@Get('spells/catalog')
	async getSpellCatalog(@CurrentUser() user: AuthenticatedUser) {
		this.assertAdmin(user);
		return this.magicService.getSpellCatalog();
	}

	@Post('spells')
	async createSpell(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: SaveSpellDto
	) {
		this.assertAdmin(user);
		return this.magicService.createSpell(dto);
	}

	@Patch('spells/:id')
	async updateSpell(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: SaveSpellDto
	) {
		this.assertAdmin(user);
		return this.magicService.updateSpell(id, dto);
	}

	@Delete('spells/:id')
	async deleteSpell(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.magicService.deleteSpell(id);
	}

	@Patch('words/:id')
	async updateWord(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdateMagicWordDto
	) {
		this.assertAdmin(user);
		return this.magicService.updateWord(id, dto);
	}

	@Delete('words/:id')
	async deleteWord(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		this.assertAdmin(user);
		await this.magicService.deleteWord(id);
	}

	private assertAdmin(user: AuthenticatedUser) {
		if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Insufficient permissions.');
		}
	}
}
