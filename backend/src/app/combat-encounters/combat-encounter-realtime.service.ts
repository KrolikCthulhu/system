import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

export const combatEncounterEvents = {
	updated: 'combat-encounter:updated'
} as const;

@Injectable()
export class CombatEncounterRealtimeService {
	private server: Server | null = null;

	bindServer(server: Server) {
		this.server = server;
	}

	publishEncounterUpdated(encounterId: string, encounter: unknown) {
		this.server
			?.to(this.roomName(encounterId))
			.emit(combatEncounterEvents.updated, encounter);
	}

	roomName(encounterId: string) {
		return `combat-encounter:${encounterId}`;
	}
}
