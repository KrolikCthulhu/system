import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RollConsequencesController } from './roll-consequences.controller';
import { RollConsequencesService } from './roll-consequences.service';

@Module({
	imports: [PrismaModule],
	controllers: [RollConsequencesController],
	providers: [RollConsequencesService],
	exports: [RollConsequencesService]
})
export class RollConsequencesModule {}
