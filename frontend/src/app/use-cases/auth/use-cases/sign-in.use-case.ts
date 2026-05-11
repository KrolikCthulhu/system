import { inject, Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { AuthUser } from '../../../domain/auth/auth.models';
import { SignInCommand } from '../commands/auth.commands';
import { AUTH_REPOSITORY } from '../ports/auth-repository.port';
import { AuthSessionService } from '../state/auth-session.service';

@Injectable({ providedIn: 'root' })
export class SignInUseCase {
	private readonly authRepository = inject(AUTH_REPOSITORY);
	private readonly authSession = inject(AuthSessionService);

	execute(command: SignInCommand): Observable<AuthUser> {
		return this.authRepository.signIn(command).pipe(
			tap(session => {
				this.authSession.setSession(session);
			}),
			map(session => session.user)
		);
	}
}
