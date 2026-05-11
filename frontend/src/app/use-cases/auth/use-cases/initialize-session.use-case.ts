import { inject, Injectable } from '@angular/core';
import { EMPTY, Observable, catchError, finalize, ignoreElements, tap } from 'rxjs';
import { AUTH_REPOSITORY } from '../ports/auth-repository.port';
import { AuthSessionService } from '../state/auth-session.service';

@Injectable({ providedIn: 'root' })
export class InitializeSessionUseCase {
	private readonly authRepository = inject(AUTH_REPOSITORY);
	private readonly authSession = inject(AuthSessionService);

	execute(): Observable<never> {
		return this.authRepository.restoreSession().pipe(
			tap(session => {
				this.authSession.setSession(session);
			}),
			ignoreElements(),
			catchError(() => {
				this.authSession.clearSession();
				return EMPTY;
			}),
			finalize(() => {
				this.authSession.markInitialized();
			})
		);
	}
}
