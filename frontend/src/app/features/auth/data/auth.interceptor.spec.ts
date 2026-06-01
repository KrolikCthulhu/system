import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import {
	AUTH_SESSION_STORAGE,
	AuthSessionStorage
} from './auth-session-storage.port';
import { authInterceptor } from './auth.interceptor';
import { AuthSession } from '../domain/auth.models';
import { AuthRefreshService } from '../state/auth-refresh.service';
import { AuthSessionService } from '../state/auth-session.service';

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

describe('authInterceptor', () => {
	let http: HttpClient;
	let httpMock: HttpTestingController;
	let authSession: AuthSessionService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				AuthRefreshService,
				AuthSessionService,
				provideHttpClient(withInterceptors([authInterceptor])),
				provideHttpClientTesting(),
				{
					provide: AUTH_SESSION_STORAGE,
					useClass: AuthSessionStorageStub
				}
			]
		});

		http = TestBed.inject(HttpClient);
		httpMock = TestBed.inject(HttpTestingController);
		authSession = TestBed.inject(AuthSessionService);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('refreshes the session and retries a protected request after 401', async () => {
		authSession.setSession(createSession('stale-token'));

		const responsePromise = firstValueFrom(
			http.get<{ ok: boolean }>('http://localhost:4000/protected')
		);

		const initialRequest = httpMock.expectOne('http://localhost:4000/protected');
		expect(initialRequest.request.headers.get('Authorization')).toBe(
			'Bearer stale-token'
		);
		initialRequest.flush('Unauthorized', {
			status: 401,
			statusText: 'Unauthorized'
		});

		const refreshRequest = httpMock.expectOne('http://localhost:4000/auth/refresh');
		expect(refreshRequest.request.headers.has('Authorization')).toBe(false);
		refreshRequest.flush(createSession('fresh-token'));

		const retriedRequest = httpMock.expectOne('http://localhost:4000/protected');
		expect(retriedRequest.request.headers.get('Authorization')).toBe(
			'Bearer fresh-token'
		);
		retriedRequest.flush({ ok: true });

		await expect(responsePromise).resolves.toEqual({ ok: true });
		expect(authSession.getSnapshot()?.accessToken).toBe('fresh-token');
	});

	it('does not try to refresh excluded auth endpoints', async () => {
		authSession.setSession(createSession('stale-token'));

		const responsePromise = firstValueFrom(
			http.post('http://localhost:4000/auth/login', {
				email: 'user@example.com',
				password: 'secret'
			})
		);

		const loginRequest = httpMock.expectOne('http://localhost:4000/auth/login');
		expect(loginRequest.request.headers.get('Authorization')).toBe('Bearer stale-token');
		loginRequest.flush('Unauthorized', {
			status: 401,
			statusText: 'Unauthorized'
		});

		await expect(responsePromise).rejects.toMatchObject({ status: 401 });
		httpMock.expectNone('http://localhost:4000/auth/refresh');
	});

	it('clears the client session when the retried request is rejected with 401 again', async () => {
		authSession.setSession(createSession('stale-token'));

		const responsePromise = firstValueFrom(
			http.get('http://localhost:4000/protected')
		);

		httpMock
			.expectOne('http://localhost:4000/protected')
			.flush('Unauthorized', {
				status: 401,
				statusText: 'Unauthorized'
			});

		httpMock
			.expectOne('http://localhost:4000/auth/refresh')
			.flush(createSession('fresh-token'));

		httpMock
			.expectOne('http://localhost:4000/protected')
			.flush('Unauthorized', {
				status: 401,
				statusText: 'Unauthorized'
			});

		await expect(responsePromise).rejects.toMatchObject({ status: 401 });
		expect(authSession.getSnapshot()).toBeNull();
	});
});
