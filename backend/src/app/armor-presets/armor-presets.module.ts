import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ArmorPresetsController } from './armor-presets.controller';
import { ArmorPresetsService } from './armor-presets.service';

@Module({
	imports: [PrismaModule],
	controllers: [ArmorPresetsController],
	providers: [ArmorPresetsService]
})
export class ArmorPresetsModule {}
