import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { EMPTY } from 'rxjs';
import { vi } from 'vitest';
import { AuthFacade } from '../../../features/auth/state/auth.facade';
import { PrivateLayoutComponent } from './private-layout.component';

describe('PrivateLayoutComponent', () => {
	let fixture: ComponentFixture<PrivateLayoutComponent>;
	let component: PrivateLayoutComponent;
	let authFacade: Pick<AuthFacade, 'logout' | 'user'>;
	let router: Pick<Router, 'navigate'>;

	beforeEach(async () => {
		authFacade = {
			logout: vi.fn(() => EMPTY),
			user: signal(null).asReadonly()
		};
		router = {
			navigate: vi.fn().mockResolvedValue(true)
		};

		await TestBed.configureTestingModule({
			imports: [PrivateLayoutComponent],
			providers: [
				{
					provide: AuthFacade,
					useValue: authFacade
				},
				{
					provide: Router,
					useValue: router
				}
			]
		}).compileComponents();

		fixture = TestBed.createComponent(PrivateLayoutComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('navigates to /auth after exit completes', () => {
		(component as unknown as { exit(): void }).exit();

		expect(authFacade.logout).toHaveBeenCalled();
		expect(router.navigate).toHaveBeenCalledWith(['/auth']);
	});
});
