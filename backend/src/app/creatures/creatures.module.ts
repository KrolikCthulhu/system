import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CreaturesController } from './creatures.controller';
import { CreaturesService } from './creatures.service';

@Module({
	imports: [PrismaModule],
	controllers: [CreaturesController],
	providers: [CreaturesService]
})
export class CreaturesModule {}
