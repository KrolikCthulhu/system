import { Logger } from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TokenService } from '../auth/token.service';
import { CombatEncountersService } from './combat-encounters.service';
import {
	CombatEncounterRealtimeService,
	combatEncounterEvents
} from './combat-encounter-realtime.service';

interface JoinEncounterPayload {
	encounterId?: string;
}

@WebSocketGateway({
	cors: {
		origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:4200',
		credentials: true
	}
})
export class CombatEncountersGateway
	implements OnGatewayInit, OnGatewayConnection
{
	@WebSocketServer()
	private server!: Server;

	private readonly logger = new Logger(CombatEncountersGateway.name);

	constructor(
		private readonly tokenService: TokenService,
		private readonly encountersService: CombatEncountersService,
		private readonly realtime: CombatEncounterRealtimeService
	) {}

	afterInit(server: Server) {
		this.realtime.bindServer(server);
	}

	async handleConnection(client: Socket) {
		const token = this.readAccessToken(client);

		if (!token) {
			client.disconnect(true);
			return;
		}

		try {
			const payload = await this.tokenService.verifyAccessToken(token);
			client.data.userId = payload.sub;
		} catch (error) {
			this.logger.warn(
				`Rejected combat socket connection: ${error instanceof Error ? error.message : 'invalid token'}`
			);
			client.disconnect(true);
		}
	}

	@SubscribeMessage('combat-encounter:join')
	async joinEncounter(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: JoinEncounterPayload
	) {
		const userId = this.readClientUserId(client);
		const encounterId = payload.encounterId;

		if (!userId || !encounterId) {
			client.disconnect(true);
			return;
		}

		const encounter = await this.encountersService.getEncounter(
			encounterId,
			userId
		);
		await client.join(this.realtime.roomName(encounterId));
		client.emit(combatEncounterEvents.updated, encounter);
	}

	private readAccessToken(client: Socket) {
		const token = client.handshake.auth?.['accessToken'];
		return typeof token === 'string' && token.trim() ? token.trim() : null;
	}

	private readClientUserId(client: Socket) {
		const userId = client.data['userId'];
		return typeof userId === 'string' ? userId : null;
	}
}
