import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { ROLL_PERFORMED_EVENT_TYPE } from './game-events.constants';
import { UpdateGameEventHandlerDto } from './dto/update-game-event-handler.dto';

const gameEventHandlerSelect = {
	id: true,
	eventType: true,
	name: true,
	description: true,
	graph: true,
	isActive: true,
	sortOrder: true
} satisfies Prisma.GameEventHandlerSelect;

@Injectable()
export class GameEventHandlersService {
	constructor(private readonly prisma: PrismaService) {}

	async getRollPerformedHandlers() {
		const handlers = await this.prisma.gameEventHandler.findMany({
			select: gameEventHandlerSelect,
			where: { eventType: ROLL_PERFORMED_EVENT_TYPE },
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		});

		return {
			handlers: handlers.map(mapGameEventHandler)
		};
	}

	async getActiveRollPerformedHandlers() {
		const handlers = await this.prisma.gameEventHandler.findMany({
			select: gameEventHandlerSelect,
			where: {
				eventType: ROLL_PERFORMED_EVENT_TYPE,
				isActive: true
			},
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		});

		return handlers.map(handler => ({
			ownerType: 'GAME_EVENT_HANDLER' as const,
			ownerId: handler.id,
			name: handler.name,
			graph: handler.graph,
			isActive: handler.isActive,
			sortOrder: handler.sortOrder
		}));
	}

	async update(id: string, dto: UpdateGameEventHandlerDto) {
		await this.ensureExists(id);

		const handler = await this.prisma.gameEventHandler.update({
			select: gameEventHandlerSelect,
			where: { id },
			data: {
				name: dto.name,
				description:
					dto.description === undefined ? undefined : dto.description || null,
				graph:
					dto.graph === undefined
						? undefined
						: dto.graph === null
							? Prisma.JsonNull
							: (dto.graph as Prisma.InputJsonValue),
				isActive: dto.isActive,
				sortOrder: dto.sortOrder
			}
		});

		return mapGameEventHandler(handler);
	}

	private async ensureExists(id: string) {
		const handler = await this.prisma.gameEventHandler.findUnique({
			select: { id: true },
			where: { id }
		});

		if (!handler) {
			throw new NotFoundException('Обработчик события не найден.');
		}
	}
}

function mapGameEventHandler(handler: {
	id: string;
	eventType: string;
	name: string;
	description: string | null;
	graph: Prisma.JsonValue | null;
	isActive: boolean;
	sortOrder: number;
}) {
	return {
		id: handler.id,
		eventType: handler.eventType,
		name: handler.name,
		description: handler.description ?? '',
		graph: normalizeJsonObject(handler.graph),
		isActive: handler.isActive,
		sortOrder: handler.sortOrder
	};
}

function normalizeJsonObject(value: Prisma.JsonValue | null) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null;
	}

	return value;
}
