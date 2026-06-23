import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProgressionPresetsController } from './progression-presets.controller';
import { ProgressionPresetsService } from './progression-presets.service';

@Module({
	imports: [PrismaModule],
	controllers: [ProgressionPresetsController],
	providers: [ProgressionPresetsService]
})
export class ProgressionPresetsModule {}
