import {
	ForbiddenException,
	Logger,
	NotFoundException,
	UseGuards
} from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from '../../auth/guards/ws-auth.guard';
import { SocketAuthService } from '../../auth/socket-auth.service';
import { GetCombatEncounterUseCase } from '../application/combat-encounter-query.use-cases';
import {
	CombatEncounterRealtimeService,
	combatEncounterEvents
} from '../combat-encounter-realtime.service';
import { CombatEncounterSocketRateLimitService } from '../combat-encounter-socket-rate-limit.service';

interface EncounterRoomPayload {
	encounterId?: string;
	requestId?: string;
}

interface EncounterErrorPayload {
	code:
		| 'invalid_payload'
		| 'not_found'
		| 'forbidden'
		| 'rate_limited'
		| 'internal';
	message: string;
	encounterId?: string;
	requestId?: string;
	retryAfterMs?: number;
}

interface EncounterAckPayload {
	event: string;
	encounterId?: string;
	requestId?: string;
}

@WebSocketGateway({
	cors: {
		origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:4200',
		credentials: true
	}
})
export class CombatEncountersGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer()
	private server!: Server;

	private readonly logger = new Logger(CombatEncountersGateway.name);

	constructor(
		private readonly socketAuth: SocketAuthService,
		private readonly getEncounterUseCase: GetCombatEncounterUseCase,
		private readonly realtime: CombatEncounterRealtimeService,
		private readonly rateLimit: CombatEncounterSocketRateLimitService
	) {}

	afterInit(server: Server) {
		server.use(async (client, next) => {
			try {
				await this.socketAuth.authenticate(client);
				next();
			} catch (error) {
				this.logger.warn(
					`Rejected combat socket connection: ${error instanceof Error ? error.message : 'invalid token'}`
				);
				next(new Error('Unauthorized.'));
			}
		});
		this.realtime.bindServer(server);
	}

	async handleConnection(client: Socket) {
		if (!this.socketAuth.getUser(client)) {
			client.disconnect(true);
		}
	}

	handleDisconnect(client: Socket) {
		this.rateLimit.clearSocket(client.id);
	}

	@SubscribeMessage(combatEncounterEvents.join)
	@UseGuards(WsAuthGuard)
	async joinEncounter(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: EncounterRoomPayload
	) {
		const user = this.socketAuth.getUser(client);
		const encounterId = payload.encounterId;

		if (!user) {
			client.disconnect(true);
			return;
		}

		if (
			!this.consumeRateLimit(client, combatEncounterEvents.join, payload, {
				limit: 30,
				windowMs: 60_000
			})
		) {
			return;
		}

		if (!encounterId) {
			this.emitEncounterError(client, {
				code: 'invalid_payload',
				message: 'Не указан id столкновения.',
				requestId: payload.requestId
			});
			return;
		}

		try {
			const encounter = await this.getEncounterUseCase.execute(
				encounterId,
				user.id
			);
			await client.join(this.realtime.roomName(encounterId));
			this.emitEncounterAck(client, {
				event: combatEncounterEvents.join,
				encounterId,
				requestId: payload.requestId
			});
			client.emit(combatEncounterEvents.updated, encounter);
		} catch (error) {
			this.emitEncounterError(client, {
				...this.mapEncounterError(error),
				encounterId,
				requestId: payload.requestId
			});
		}
	}

	@SubscribeMessage(combatEncounterEvents.leave)
	@UseGuards(WsAuthGuard)
	async leaveEncounter(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: EncounterRoomPayload
	) {
		const encounterId = payload.encounterId;

		if (
			!this.consumeRateLimit(client, combatEncounterEvents.leave, payload, {
				limit: 60,
				windowMs: 60_000
			})
		) {
			return;
		}

		if (!encounterId) {
			this.emitEncounterError(client, {
				code: 'invalid_payload',
				message: 'Не указан id столкновения.',
				requestId: payload.requestId
			});
			return;
		}

		await client.leave(this.realtime.roomName(encounterId));
		this.emitEncounterAck(client, {
			event: combatEncounterEvents.leave,
			encounterId,
			requestId: payload.requestId
		});
	}

	private emitEncounterError(client: Socket, payload: EncounterErrorPayload) {
		client.emit(combatEncounterEvents.error, payload);
	}

	private emitEncounterAck(client: Socket, payload: EncounterAckPayload) {
		client.emit(combatEncounterEvents.ack, payload);
	}

	private consumeRateLimit(
		client: Socket,
		eventName: string,
		payload: EncounterRoomPayload,
		options: { limit: number; windowMs: number }
	) {
		const result = this.rateLimit.consume({
			socketId: client.id,
			eventName,
			limit: options.limit,
			windowMs: options.windowMs
		});

		if (result.allowed) {
			return true;
		}

		this.emitEncounterError(client, {
			code: 'rate_limited',
			message: 'Слишком много realtime-запросов.',
			encounterId: payload.encounterId,
			requestId: payload.requestId,
			retryAfterMs: result.retryAfterMs
		});
		return false;
	}

	private mapEncounterError(
		error: unknown
	): Omit<EncounterErrorPayload, 'encounterId'> {
		if (error instanceof NotFoundException) {
			return {
				code: 'not_found',
				message: error.message
			};
		}

		if (error instanceof ForbiddenException) {
			return {
				code: 'forbidden',
				message: error.message
			};
		}

		this.logger.error(
			`Failed to join combat encounter: ${error instanceof Error ? error.message : 'unknown error'}`
		);
		return {
			code: 'internal',
			message: 'Не удалось подключиться к столкновению.'
		};
	}
}
