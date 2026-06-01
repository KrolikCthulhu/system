import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import {
	AUTH_SESSION_STORAGE,
	AuthSessionStorage
} from '../data/auth-session-storage.port';
import { AuthSession } from '../domain/auth.models';
import { AuthRefreshService } from './auth-refresh.service';
import { AuthSessionService } from './auth-session.service';

class AuthSessionStorageStub implements AuthSessionStorage {
	private session: AuthSession | null = null;

	readSession() {
		return this.session;
	}

	writeSession(session: AuthSession) {
		this.session = session;
	}

	clear() {
		this.session = null;
	}
}

function createSession(accessToken: string): AuthSession {
	return {
		accessToken,
		user: {
			id: 'user-1',
			email: 'user@example.com',
			username: 'user',
			displayUsername: 'User',
			role: 'USER',
			sessionId: 'session-1'
		}
	};
}

describe('AuthRefreshService', () => {
	let service: AuthRefreshService;
	let authSession: AuthSessionService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				AuthRefreshService,
				AuthSessionService,
				provideHttpClient(),
				provideHttpClientTesting(),
				{
					provide: AUTH_SESSION_STORAGE,
					useClass: AuthSessionStorageStub
				}
			]
		});

		service = TestBed.inject(AuthRefreshService);
		authSession = TestBed.inject(AuthSessionService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('stores refreshed session returned by the backend', async () => {
		const session = createSession('fresh-token');
		const refreshPromise = firstValueFrom(service.refreshSession());

		const request = httpMock.expectOne('http://localhost:4000/auth/refresh');
		expect(request.request.withCredentials).toBe(true);
		request.flush(session);

		await expect(refreshPromise).resolves.toEqual(session);
		expect(authSession.getSnapshot()).toEqual(session);
	});

	it('reuses the same in-flight refresh request for concurrent subscribers', async () => {
		const session = createSession('shared-token');
		const firstRefresh = firstValueFrom(service.refreshSession());
		const secondRefresh = firstValueFrom(service.refreshSession());

		const request = httpMock.expectOne('http://localhost:4000/auth/refresh');
		request.flush(session);

		await expect(firstRefresh).resolves.toEqual(session);
		await expect(secondRefresh).resolves.toEqual(session);
	});
});
