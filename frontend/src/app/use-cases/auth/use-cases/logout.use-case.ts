import { inject, Injectable } from '@angular/core';
import { EMPTY, Observable, finalize, ignoreElements } from 'rxjs';
import { AUTH_REPOSITORY } from '../ports/auth-repository.port';
import { AuthSessionService } from '../state/auth-session.service';

@Injectable({ providedIn: 'root' })
export class LogoutUseCase {
	private readonly authRepository = inject(AUTH_REPOSITORY);
	private readonly authSession = inject(AuthSessionService);

	execute(): Observable<never> {
		if (!this.authSession.accessToken()) {
			this.authSession.clearSession();
			return EMPTY;
		}

		return this.authRepository.logout().pipe(
			ignoreElements(),
			finalize(() => {
				this.authSession.clearSession();
			})
		);
	}
}
