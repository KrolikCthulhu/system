import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MagicController } from './magic.controller';
import { MagicService } from './magic.service';

@Module({
	imports: [PrismaModule],
	controllers: [MagicController],
	providers: [MagicService]
})
export class MagicModule {}
