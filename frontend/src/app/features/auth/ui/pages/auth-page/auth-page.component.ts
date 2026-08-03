import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { EMPTY, catchError, finalize, from, switchMap } from 'rxjs';
import { SignInCommand, SignUpCommand } from '../../../state/auth.commands';
import { AuthFacade } from '../../../state/auth.facade';
import { SignInFormComponent } from '../../components/sign-in-form/sign-in-form.component';
import { SignUpFormComponent } from '../../components/sign-up-form/sign-up-form.component';
import { FluidModule, Fluid } from 'primeng/fluid';

type AuthMode = 'sign-in' | 'register';

@Component({
	selector: 'app-auth-page',
	imports: [
		Button,
		Card,
		Message,
		SignInFormComponent,
		SignUpFormComponent,
		Fluid
	],
	templateUrl: './auth-page.component.html',
	styleUrl: './auth-page.component.scss'
})
export class AuthPageComponent {
	private readonly authFacade = inject(AuthFacade);
	private readonly destroyRef = inject(DestroyRef);
	private readonly router = inject(Router);

	protected readonly cardStyle = { width: 'min(37.5rem, 92vw)' };
	protected readonly contentMinHeight = signal('0px');
	protected readonly mode = signal<AuthMode>('sign-in');
	protected readonly pending = signal(false);
	protected readonly errorMessage = signal('');

	protected setMode(mode: AuthMode) {
		if (this.pending() || this.mode() === mode) {
			return;
		}

		this.mode.set(mode);
		this.errorMessage.set('');
	}

	protected handleSignIn(command: SignInCommand) {
		this.errorMessage.set('');
		this.pending.set(true);

		this.authFacade
			.signIn(command)
			.pipe(
				switchMap(() => from(this.router.navigate(['/']))),
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error ? error.message : 'Request failed.'
					);
					return EMPTY;
				}),
				finalize(() => {
					this.pending.set(false);
				}),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe();
	}

	protected handleSignUp(command: SignUpCommand) {
		this.errorMessage.set('');
		this.pending.set(true);

		this.authFacade
			.signUp(command)
			.pipe(
				switchMap(() => from(this.router.navigate(['/']))),
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error ? error.message : 'Request failed.'
					);
					return EMPTY;
				}),
				finalize(() => {
					this.pending.set(false);
				}),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe();
	}
}
