import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { AuthUser } from '../../../domain/auth/auth.models';
import { SignUpCommand } from '../commands/auth.commands';
import { AUTH_REPOSITORY } from '../ports/auth-repository.port';
import { SignInUseCase } from './sign-in.use-case';

@Injectable({ providedIn: 'root' })
export class SignUpUseCase {
	private readonly authRepository = inject(AUTH_REPOSITORY);
	private readonly signInUseCase = inject(SignInUseCase);

	execute(command: SignUpCommand): Observable<AuthUser> {
		return this.authRepository.signUp(command).pipe(
			switchMap(() =>
				this.signInUseCase.execute({
					email: command.email,
					password: command.password
				})
			)
		);
	}
}
