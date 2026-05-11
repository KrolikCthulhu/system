import {
	Component,
	DestroyRef,
	ElementRef,
	HostListener,
	afterNextRender,
	inject,
	signal,
	viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { EMPTY, catchError, finalize, from, switchMap } from 'rxjs';
import {
	SignInCommand,
	SignUpCommand
} from '../../../../use-cases/auth/commands/auth.commands';
import { SignInUseCase } from '../../../../use-cases/auth/use-cases/sign-in.use-case';
import { SignUpUseCase } from '../../../../use-cases/auth/use-cases/sign-up.use-case';
import { SignInFormComponent } from '../../../features/auth/sign-in-by-email/ui/sign-in-form.component';
import { SignUpFormComponent } from '../../../features/auth/sign-up/ui/sign-up-form.component';

type AuthMode = 'sign-in' | 'register';

@Component({
	selector: 'app-auth-page',
	imports: [Button, Card, Message, SignInFormComponent, SignUpFormComponent],
	templateUrl: './auth-page.component.html',
	styleUrl: './auth-page.component.scss'
})
export class AuthPageComponent {
	private readonly signInUseCase = inject(SignInUseCase);
	private readonly signUpUseCase = inject(SignUpUseCase);
	private readonly destroyRef = inject(DestroyRef);
	private readonly router = inject(Router);
	private readonly signInMeasureRef =
		viewChild.required<ElementRef<HTMLElement>>('signInMeasure');
	private readonly signUpMeasureRef =
		viewChild.required<ElementRef<HTMLElement>>('signUpMeasure');

	protected readonly cardStyle = { width: 'min(37.5rem, 92vw)' };
	protected readonly contentMinHeight = signal('0px');
	protected readonly mode = signal<AuthMode>('sign-in');
	protected readonly pending = signal(false);
	protected readonly errorMessage = signal('');

	constructor() {
		afterNextRender(() => {
			this.updateContentMinHeight();
		});
	}

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

		this.signInUseCase
			.execute(command)
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

		this.signUpUseCase
			.execute(command)
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

	@HostListener('window:resize')
	protected onWindowResize() {
		this.updateContentMinHeight();
	}

	private updateContentMinHeight() {
		const signInHeight =
			this.signInMeasureRef().nativeElement.getBoundingClientRect().height;
		const signUpHeight =
			this.signUpMeasureRef().nativeElement.getBoundingClientRect().height;
		const maxHeight = Math.max(signInHeight, signUpHeight);

		this.contentMinHeight.set(`${Math.ceil(maxHeight)}px`);
	}
}
