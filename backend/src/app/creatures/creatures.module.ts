import { Module } from '@nestjs/common';
import { AnatomySyncService } from '../anatomy-schemes/anatomy-sync.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CreaturesController } from './creatures.controller';
import { CreaturesService } from './creatures.service';

@Module({
	imports: [PrismaModule],
	controllers: [CreaturesController],
	providers: [CreaturesService, AnatomySyncService]
})
export class CreaturesModule {}
