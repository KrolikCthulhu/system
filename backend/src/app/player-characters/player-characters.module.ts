import { Module } from '@nestjs/common';
import { CharacterSheetRuntimeModule } from '../character-sheet/character-sheet-runtime.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PlayerCharactersController } from './player-characters.controller';
import { PlayerCharactersService } from './player-characters.service';

@Module({
	imports: [PrismaModule, CharacterSheetRuntimeModule],
	controllers: [PlayerCharactersController],
	providers: [PlayerCharactersService]
})
export class PlayerCharactersModule {}
