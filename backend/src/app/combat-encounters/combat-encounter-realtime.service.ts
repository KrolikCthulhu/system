import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { SocketAuthData } from '../auth/socket-auth.types';
import type { CombatEncounterSnapshot } from './application/combat-encounter.read-model';

export const combatEncounterEvents = {
	join: 'combat-encounter:join',
	leave: 'combat-encounter:leave',
	ack: 'combat-encounter:ack',
	error: 'combat-encounter:error',
	updated: 'combat-encounter:updated'
} as const;

export type CombatEncounterRealtimeSnapshotResolver = (
	encounterId: string,
	userId: string
) => Promise<CombatEncounterSnapshot>;

@Injectable()
export class CombatEncounterRealtimeService {
	private readonly logger = new Logger(CombatEncounterRealtimeService.name);

	private server: Server | null = null;
	private snapshotResolver: CombatEncounterRealtimeSnapshotResolver | null =
		null;

	bindServer(server: Server) {
		this.server = server;
	}

	bindSnapshotResolver(resolver: CombatEncounterRealtimeSnapshotResolver) {
		this.snapshotResolver = resolver;
	}

	async publishEncounterUpdated(encounterId: string) {
		if (!this.server) {
			return;
		}

		if (!this.snapshotResolver) {
			this.logger.warn(
				`Cannot publish combat encounter ${encounterId}: snapshot resolver is not bound.`
			);
			return;
		}

		const roomName = this.roomName(encounterId);
		const sockets = await this.server.in(roomName).fetchSockets();
		const resolveSnapshot = this.snapshotResolver;

		await Promise.all(
			sockets.map(async socket => {
				const user = (socket.data as SocketAuthData).user;

				if (!user) {
					await socket.leave(roomName);
					return;
				}

				try {
					const encounter = await resolveSnapshot(encounterId, user.id);
					socket.emit(combatEncounterEvents.updated, encounter);
				} catch (error) {
					this.logger.warn(
						`Failed to publish combat encounter ${encounterId} to user ${user.id}: ${error instanceof Error ? error.message : 'unknown error'}`
					);
					await socket.leave(roomName);
				}
			})
		);
	}

	roomName(encounterId: string) {
		return `combat-encounter:${encounterId}`;
	}
}
