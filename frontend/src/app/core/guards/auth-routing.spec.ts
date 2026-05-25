import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { AuthSessionService } from '../../features/auth/state/auth-session.service';
import { AuthUser } from '../../features/auth/domain/auth.models';
import {
	authChildGuard,
	authGuard
} from './auth.guard';
import { guestGuard } from './guest.guard';
import {
	roleChildGuard,
	roleGuard
} from './role.guard';
import { withRoles } from '../routing/route-data';

@Component({
	standalone: true,
	template: '<router-outlet></router-outlet>',
	imports: [RouterOutlet]
})
class RootShellComponent {}

@Component({
	standalone: true,
	template: '<router-outlet></router-outlet>',
	imports: [RouterOutlet]
})
class PrivateShellComponent {}

@Component({
	standalone: true,
	template: 'auth'
})
class AuthStubComponent {}

@Component({
	standalone: true,
	template: 'admin'
})
class AdminStubComponent {}

class AuthSessionServiceStub {
	private readonly userState = signal<AuthUser | null>(null);

	readonly user = this.userState.asReadonly();

	isAuthenticated() {
		return !!this.userState();
	}

	setUser(user: AuthUser | null) {
		this.userState.set(user);
	}
}

function createUser(role: AuthUser['role']): AuthUser {
	return {
		id: `${role.toLowerCase()}-1`,
		email: `${role.toLowerCase()}@example.com`,
		username: role.toLowerCase(),
		displayUsername: role.toLowerCase(),
		role
	};
}

describe('auth routing', () => {
	let router: Router;
	let location: Location;
	let authSession: AuthSessionServiceStub;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RootShellComponent],
			providers: [
				provideRouter([
					{
						path: '',
						component: RootShellComponent,
						children: [
							{
								path: 'auth',
								canActivate: [guestGuard],
								component: AuthStubComponent
							},
							{
								path: '',
								canActivate: [authGuard],
								canActivateChild: [authChildGuard],
								component: PrivateShellComponent,
								children: [
									{
										path: '',
										pathMatch: 'full',
										redirectTo: 'admin'
									},
									{
										path: 'admin',
										canActivate: [roleGuard],
										canActivateChild: [roleChildGuard],
										...withRoles('ADMIN'),
										children: [
											{
												path: '',
												component: AdminStubComponent
											}
										]
									}
								]
							},
							{
								path: '**',
								redirectTo: ''
							}
						]
					}
				]),
				provideLocationMocks(),
				{
					provide: AuthSessionService,
					useClass: AuthSessionServiceStub
				}
			]
		}).compileComponents();

		router = TestBed.inject(Router);
		location = TestBed.inject(Location);
		authSession = TestBed.inject(
			AuthSessionService
		) as unknown as AuthSessionServiceStub;

		TestBed.createComponent(RootShellComponent).detectChanges();
	});

	it('redirects guest from / to /auth', async () => {
		authSession.setUser(null);

		await router.navigateByUrl('/');

		expect(location.path()).toBe('/auth');
	});

	it('redirects user away from /admin to /auth', async () => {
		authSession.setUser(createUser('USER'));

		await router.navigateByUrl('/admin');

		expect(location.path()).toBe('/auth');
	});

	it('allows admin to open /admin', async () => {
		authSession.setUser(createUser('ADMIN'));

		await router.navigateByUrl('/admin');

		expect(location.path()).toBe('/admin');
	});

	it('allows authenticated user to remain on /auth', async () => {
		authSession.setUser(createUser('USER'));

		await router.navigateByUrl('/auth');

		expect(location.path()).toBe('/auth');
	});

	it('redirects authenticated admin away from /auth to /admin', async () => {
		authSession.setUser(createUser('ADMIN'));

		await router.navigateByUrl('/auth');

		expect(location.path()).toBe('/admin');
	});

	it('redirects admin from / to /admin', async () => {
		authSession.setUser(createUser('ADMIN'));

		await router.navigateByUrl('/');

		expect(location.path()).toBe('/admin');
	});
});
