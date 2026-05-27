import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AttributesReadController } from './attributes-read.controller';
import { AttributesController } from './attributes.controller';
import { AttributesService } from './attributes.service';

@Module({
	imports: [PrismaModule],
	controllers: [AttributesReadController, AttributesController],
	providers: [AttributesService]
})
export class AttributesModule {}
