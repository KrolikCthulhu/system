import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemCombatActionsController } from './system-combat-actions.controller';
import { SystemCombatActionsService } from './system-combat-actions.service';

@Module({
	imports: [PrismaModule],
	controllers: [SystemCombatActionsController],
	providers: [SystemCombatActionsService]
})
export class SystemCombatActionsModule {}
