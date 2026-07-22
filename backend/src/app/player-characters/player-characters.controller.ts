import {
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Post,
	UseGuards
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePlayerCharacterDto } from './dto/create-player-character.dto';
import { RollPlayerCharacterSkillDto } from './dto/roll-player-character-skill.dto';
import { UpdatePlayerCharacterSheetDto } from './dto/update-player-character-sheet.dto';
import { UpdatePlayerCharacterDto } from './dto/update-player-character.dto';
import { PlayerCharactersService } from './player-characters.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class PlayerCharactersController {
	constructor(private readonly charactersService: PlayerCharactersService) {}

	@Get('campaigns/:campaignId/characters')
	getCampaignCharacters(
		@CurrentUser() user: AuthenticatedUser,
		@Param('campaignId') campaignId: string
	) {
		return this.charactersService.getCampaignCharacters(campaignId, user.id);
	}

	@Post('campaigns/:campaignId/characters')
	createCharacter(
		@CurrentUser() user: AuthenticatedUser,
		@Param('campaignId') campaignId: string,
		@Body() dto: CreatePlayerCharacterDto
	) {
		return this.charactersService.createCharacter(campaignId, user.id, dto);
	}

	@Get('player-characters/:id')
	getCharacter(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		return this.charactersService.getCharacter(id, user.id);
	}

	@Patch('player-characters/:id')
	updateCharacter(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdatePlayerCharacterDto
	) {
		return this.charactersService.updateCharacter(id, user.id, dto);
	}

	@Get('player-characters/:id/sheet')
	getCharacterSheet(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string
	) {
		return this.charactersService.getCharacterSheet(id, user.id);
	}

	@Patch('player-characters/:id/sheet')
	updateCharacterSheet(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: UpdatePlayerCharacterSheetDto
	) {
		return this.charactersService.updateCharacterSheet(id, user.id, dto);
	}

	@Post('player-characters/:id/sheet/roll')
	rollSkill(
		@CurrentUser() user: AuthenticatedUser,
		@Param('id') id: string,
		@Body() dto: RollPlayerCharacterSkillDto
	) {
		return this.charactersService.rollSkill(id, user.id, dto);
	}
}
