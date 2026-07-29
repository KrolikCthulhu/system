import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { io } from 'socket.io-client';
import { environment } from '../../../infrastructure/config/environment';
import { AuthSessionService } from '../../auth/state/auth-session.service';
import { CombatEncounter } from '../domain/combat-encounters.models';
import { CombatEncounterDto } from './dto/combat-encounters.dto';
import { mapCombatEncounterDto } from './mappers/combat-encounters.mapper';

@Injectable({ providedIn: 'root' })
export class CombatEncounterRealtimeService {
	private readonly authSession = inject(AuthSessionService);

	watchEncounter(encounterId: string): Observable<CombatEncounter> {
		return new Observable<CombatEncounter>(subscriber => {
			const accessToken = this.authSession.accessToken();

			if (!accessToken) {
				subscriber.error(new Error('Нет активной сессии.'));
				return undefined;
			}

			const socket = io(environment.apiBaseUrl, {
				auth: { accessToken },
				withCredentials: true,
				transports: ['websocket']
			});

			socket.on('connect', () => {
				socket.emit('combat-encounter:join', { encounterId });
			});
			socket.on('combat-encounter:updated', (dto: CombatEncounterDto) => {
				subscriber.next(mapCombatEncounterDto(dto));
			});
			socket.on('connect_error', error => {
				subscriber.error(error);
			});

			return () => {
				socket.disconnect();
			};
		});
	}
}
