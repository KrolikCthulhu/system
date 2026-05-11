import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SkillsReadController } from './skills-read.controller';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';

@Module({
	imports: [PrismaModule],
	controllers: [SkillsReadController, SkillsController],
	providers: [SkillsService]
})
export class SkillsModule {}
