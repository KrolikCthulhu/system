import { Module } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaModule } from '../prisma/prisma.module';
import { ExecuteSpellRuntimePreviewUseCase } from './application/execute-spell-runtime-preview.use-case';
import { SPELL_RUNTIME_PREVIEW_REPOSITORY } from './application/spell-runtime-preview-repository.port';
import { SpellRuntimePreviewEngine } from './domain/spell-runtime-preview.engine';
import { PrismaSpellRuntimePreviewRepository } from './infrastructure/prisma-spell-runtime-preview.repository';
import { MagicController } from './magic.controller';
import { MagicService } from './magic.service';
import { SpellRuntimePreviewService } from './spell-runtime-preview.service';

@Module({
	imports: [PrismaModule],
	controllers: [MagicController],
	providers: [
		MagicService,
		PrismaSpellRuntimePreviewRepository,
		{
			provide: SPELL_RUNTIME_PREVIEW_REPOSITORY,
			useExisting: PrismaSpellRuntimePreviewRepository
		},
		{
			provide: SpellRuntimePreviewEngine,
			useFactory: () =>
				new SpellRuntimePreviewEngine({
					idGenerator: randomUUID
				})
		},
		ExecuteSpellRuntimePreviewUseCase,
		SpellRuntimePreviewService
	]
})
export class MagicModule {}
