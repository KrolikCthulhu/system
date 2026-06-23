import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MagicController } from './magic.controller';
import { MagicService } from './magic.service';
import { SpellRuntimePreviewService } from './spell-runtime-preview.service';

@Module({
	imports: [PrismaModule],
	controllers: [MagicController],
	providers: [MagicService, SpellRuntimePreviewService]
})
export class MagicModule {}
