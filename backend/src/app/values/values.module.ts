import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ValuesController } from './values.controller';
import { ValuesReadController } from './values-read.controller';
import { ValuesService } from './values.service';

@Module({
	imports: [PrismaModule],
	controllers: [ValuesController, ValuesReadController],
	providers: [ValuesService]
})
export class ValuesModule {}
