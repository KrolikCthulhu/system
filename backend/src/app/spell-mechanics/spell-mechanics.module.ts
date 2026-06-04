import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SpellMechanicsController } from './spell-mechanics.controller';
import { SpellMechanicsService } from './spell-mechanics.service';

@Module({
	imports: [PrismaModule],
	controllers: [SpellMechanicsController],
	providers: [SpellMechanicsService]
})
export class SpellMechanicsModule {}
