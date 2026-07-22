import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NaturalAttacksController } from './natural-attacks.controller';
import { NaturalAttacksService } from './natural-attacks.service';
import { WeaponTemplatesController } from './weapon-templates.controller';
import { WeaponsController } from './weapons.controller';
import { WeaponsService } from './weapons.service';

@Module({
	imports: [PrismaModule],
	controllers: [
		WeaponsController,
		WeaponTemplatesController,
		NaturalAttacksController
	],
	providers: [WeaponsService, NaturalAttacksService]
})
export class WeaponsModule {}
