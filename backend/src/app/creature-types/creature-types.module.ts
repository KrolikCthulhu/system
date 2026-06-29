import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CreatureTypesController } from './creature-types.controller';
import { CreatureTypesService } from './creature-types.service';

@Module({
	imports: [PrismaModule],
	controllers: [CreatureTypesController],
	providers: [CreatureTypesService]
})
export class CreatureTypesModule {}
