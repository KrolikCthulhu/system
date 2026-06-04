import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ConditionsController } from './conditions.controller';
import { ConditionsService } from './conditions.service';

@Module({
	imports: [PrismaModule],
	controllers: [ConditionsController],
	providers: [ConditionsService]
})
export class ConditionsModule {}
