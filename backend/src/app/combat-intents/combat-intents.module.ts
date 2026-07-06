import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CombatIntentsController } from './combat-intents.controller';
import { CombatIntentsService } from './combat-intents.service';

@Module({
	imports: [PrismaModule],
	controllers: [CombatIntentsController],
	providers: [CombatIntentsService]
})
export class CombatIntentsModule {}
