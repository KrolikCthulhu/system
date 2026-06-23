import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DamageTypesController } from './damage-types.controller';
import { DamageTypesService } from './damage-types.service';

@Module({
	imports: [PrismaModule],
	controllers: [DamageTypesController],
	providers: [DamageTypesService]
})
export class DamageTypesModule {}
