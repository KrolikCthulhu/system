import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnatomySchemesController } from './anatomy-schemes.controller';
import { AnatomySchemesService } from './anatomy-schemes.service';
import { AnatomySyncService } from './anatomy-sync.service';

@Module({
	imports: [PrismaModule],
	controllers: [AnatomySchemesController],
	providers: [AnatomySchemesService, AnatomySyncService]
})
export class AnatomySchemesModule {}
