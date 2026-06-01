import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { Button } from 'primeng/button';
import { Toolbar } from 'primeng/toolbar';
import { EMPTY, catchError, finalize } from 'rxjs';
import { AuthFacade } from '../../../features/auth/state/auth.facade';
import { AuthUserRole } from '../../../features/auth/domain/auth.models';

@Component({
	selector: 'app-private-layout',
	imports: [Button, RouterOutlet, Toolbar],
	templateUrl: './private-layout.component.html',
	styleUrl: './private-layout.component.scss'
})
export class PrivateLayoutComponent {
	private readonly destroyRef = inject(DestroyRef);
	private readonly router = inject(Router);
	private readonly authFacade = inject(AuthFacade);

	protected readonly pending = signal(false);
	protected readonly errorMessage = signal('');
	protected readonly user = this.authFacade.user;

	protected getRoleLabel(role: AuthUserRole | undefined): string {
		return role === 'ADMIN' ? 'Admin' : 'User';
	}

	protected exit() {
		if (this.pending()) {
			return;
		}

		this.pending.set(true);
		this.errorMessage.set('');

		this.authFacade
			.logout()
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error ? error.message : 'Не удалось выйти.'
					);
					return EMPTY;
				}),
				finalize(() => {
					this.pending.set(false);
					void this.router.navigate(['/auth']);
				}),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe();
	}
}
