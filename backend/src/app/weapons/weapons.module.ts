import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WeaponsController } from './weapons.controller';
import { WeaponsService } from './weapons.service';

@Module({
	imports: [PrismaModule],
	controllers: [WeaponsController],
	providers: [WeaponsService]
})
export class WeaponsModule {}
