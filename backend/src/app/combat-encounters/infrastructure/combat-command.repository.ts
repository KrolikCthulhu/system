import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CombatCommandRepository {
	constructor(private readonly prisma: PrismaService) {}

	findByRequest(input: {
		encounterId: string;
		userId: string;
		requestId: string;
	}) {
		return this.prisma.combatEncounterCommand.findUnique({
			select: { id: true },
			where: {
				encounterId_userId_requestId: {
					encounterId: input.encounterId,
					userId: input.userId,
					requestId: input.requestId
				}
			}
		});
	}

	create(input: {
		encounterId: string;
		userId: string;
		requestId: string;
		commandType: string;
	}) {
		return this.prisma.combatEncounterCommand.create({
			data: {
				encounterId: input.encounterId,
				userId: input.userId,
				requestId: input.requestId,
				commandType: input.commandType
			}
		});
	}
}
