import { Injectable, inject } from '@angular/core';
import { Observable, Subscriber, firstValueFrom } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { environment } from '../../../infrastructure/config/environment';
import { AuthRefreshService } from '../../auth/state/auth-refresh.service';
import { AuthSessionService } from '../../auth/state/auth-session.service';
import { CombatEncounter } from '../domain/combat-encounters.models';
import { CombatEncounterDto } from './dto/combat-encounters.dto';
import { mapCombatEncounterDto } from './mappers/combat-encounters.mapper';

const combatEncounterSocketEvents = {
	join: 'combat-encounter:join',
	leave: 'combat-encounter:leave',
	ack: 'combat-encounter:ack',
	error: 'combat-encounter:error',
	updated: 'combat-encounter:updated'
} as const;

interface CombatEncounterSocketErrorDto {
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

interface CombatEncounterSocketAckDto {
	event: string;
	encounterId?: string;
	requestId?: string;
}

@Injectable({ providedIn: 'root' })
export class CombatEncounterRealtimeService {
	private readonly authSession = inject(AuthSessionService);
	private readonly authRefresh = inject(AuthRefreshService);

	private socket: Socket | null = null;
	private refreshPromise: Promise<void> | null = null;
	private nextRequestIndex = 0;
	private readonly subscribersByEncounterId = new Map<
		string,
		Set<Subscriber<CombatEncounter>>
	>();

	watchEncounter(encounterId: string): Observable<CombatEncounter> {
		return new Observable<CombatEncounter>(subscriber => {
			const wasWatched = this.subscribersByEncounterId.has(encounterId);
			const subscribers = this.ensureSubscriberSet(encounterId);
			subscribers.add(subscriber);

			try {
				this.ensureSocket();
				if (!wasWatched) {
					this.joinEncounter(encounterId);
				}
			} catch (error) {
				subscribers.delete(subscriber);
				this.deleteSubscriberSetIfEmpty(encounterId);
				subscriber.error(error);
			}

			return () => {
				subscribers.delete(subscriber);
				if (!subscribers.size) {
					this.subscribersByEncounterId.delete(encounterId);
					this.leaveEncounter(encounterId);
				}
				this.disconnectIfIdle();
			};
		});
	}

	private ensureSubscriberSet(encounterId: string) {
		const existing = this.subscribersByEncounterId.get(encounterId);
		if (existing) {
			return existing;
		}

		const subscribers = new Set<Subscriber<CombatEncounter>>();
		this.subscribersByEncounterId.set(encounterId, subscribers);
		return subscribers;
	}

	private deleteSubscriberSetIfEmpty(encounterId: string) {
		const subscribers = this.subscribersByEncounterId.get(encounterId);
		if (subscribers && !subscribers.size) {
			this.subscribersByEncounterId.delete(encounterId);
		}
	}

	private ensureSocket() {
		if (this.socket) {
			return this.socket;
		}

		const socket = io(environment.apiBaseUrl, {
			auth: { accessToken: this.readAccessToken() },
			withCredentials: true,
			transports: ['websocket'],
			autoConnect: false
		});

		socket.on('connect', () => {
			this.rejoinWatchedEncounters();
		});
		socket.io.on('reconnect_attempt', () => {
			this.updateSocketAuth(socket);
		});
		socket.on('connect_error', error => {
			if (this.isUnauthorizedError(error)) {
				void this.refreshAndReconnect(socket);
			}
		});
		socket.on(
			combatEncounterSocketEvents.error,
			(error: CombatEncounterSocketErrorDto) => {
				this.dispatchEncounterError(error);
			}
		);
		socket.on(
			combatEncounterSocketEvents.ack,
			(_ack: CombatEncounterSocketAckDto) => {
				return;
			}
		);
		socket.on(
			combatEncounterSocketEvents.updated,
			(dto: CombatEncounterDto) => {
				this.dispatchEncounterUpdated(dto);
			}
		);

		this.socket = socket;
		socket.connect();
		return socket;
	}

	private readAccessToken() {
		const accessToken = this.authSession.accessToken();
		if (!accessToken) {
			throw new Error('Нет активной сессии.');
		}

		return accessToken;
	}

	private updateSocketAuth(socket: Socket) {
		try {
			socket.auth = { accessToken: this.readAccessToken() };
		} catch (error) {
			this.failWatchers(this.toError(error));
		}
	}

	private async refreshAndReconnect(socket: Socket) {
		if (this.refreshPromise) {
			return this.refreshPromise;
		}

		this.refreshPromise = firstValueFrom(this.authRefresh.refreshSession())
			.then(session => {
				socket.auth = { accessToken: session.accessToken };
				if (!socket.connected && this.socket === socket) {
					socket.connect();
				}
			})
			.catch(error => {
				this.failWatchers(this.toError(error));
			})
			.finally(() => {
				this.refreshPromise = null;
			});

		return this.refreshPromise;
	}

	private isUnauthorizedError(error: Error) {
		return error.message === 'Unauthorized.';
	}

	private joinEncounter(encounterId: string) {
		const socket = this.ensureSocket();
		if (socket.connected) {
			socket.emit(combatEncounterSocketEvents.join, {
				encounterId,
				requestId: this.createRequestId()
			});
		}
	}

	private leaveEncounter(encounterId: string) {
		const socket = this.socket;
		if (socket?.connected) {
			socket.emit(combatEncounterSocketEvents.leave, {
				encounterId,
				requestId: this.createRequestId()
			});
		}
	}

	private rejoinWatchedEncounters() {
		for (const encounterId of this.subscribersByEncounterId.keys()) {
			this.socket?.emit(combatEncounterSocketEvents.join, {
				encounterId,
				requestId: this.createRequestId()
			});
		}
	}

	private dispatchEncounterUpdated(dto: CombatEncounterDto) {
		const encounter = mapCombatEncounterDto(dto);
		const subscribers = this.subscribersByEncounterId.get(encounter.id);

		for (const subscriber of subscribers ?? []) {
			subscriber.next(encounter);
		}
	}

	private dispatchEncounterError(error: CombatEncounterSocketErrorDto) {
		const runtimeError = new Error(error.message);

		if (!error.encounterId) {
			this.failWatchers(runtimeError);
			return;
		}

		const subscribers = this.subscribersByEncounterId.get(error.encounterId);
		this.subscribersByEncounterId.delete(error.encounterId);

		for (const subscriber of subscribers ?? []) {
			subscriber.error(runtimeError);
		}

		this.disconnectIfIdle();
	}

	private disconnectIfIdle() {
		if (this.subscribersByEncounterId.size) {
			return;
		}

		this.disconnectSocket();
	}

	private disconnectSocket() {
		const socket = this.socket;
		this.socket = null;

		if (!socket) {
			return;
		}

		socket.removeAllListeners();
		socket.io.removeAllListeners('reconnect_attempt');
		socket.disconnect();
	}

	private failWatchers(error: Error) {
		const subscribers = Array.from(
			this.subscribersByEncounterId.values()
		).flatMap(subscriberSet => Array.from(subscriberSet));
		this.subscribersByEncounterId.clear();
		this.disconnectSocket();

		for (const subscriber of subscribers) {
			subscriber.error(error);
		}
	}

	private toError(error: unknown) {
		return error instanceof Error
			? error
			: new Error('Ошибка realtime соединения.');
	}

	private createRequestId() {
		this.nextRequestIndex += 1;
		return `combat-realtime-${Date.now()}-${this.nextRequestIndex}`;
	}
}
