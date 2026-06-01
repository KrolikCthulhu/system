import {
	HttpContextToken,
	HttpErrorResponse,
	HttpInterceptorFn,
	HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { AuthRefreshService } from '../state/auth-refresh.service';
import { AuthSessionService } from '../state/auth-session.service';

const AUTH_REFRESH_ATTEMPTED = new HttpContextToken<boolean>(() => false);
const AUTH_REFRESH_EXCLUDED_PATHS = new Set([
	'/auth/login',
	'/auth/register',
	'/auth/verify-email',
	'/auth/resend-verification',
	'/auth/refresh'
]);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const authSession = inject(AuthSessionService);
	const authRefresh = inject(AuthRefreshService);
	const accessToken = authSession.accessToken();
	const request = accessToken ? attachAccessToken(req, accessToken) : req;

	return next(request).pipe(
		catchError(error => {
			if (!shouldRefreshSession(request, accessToken, error)) {
				if (
					request.context.get(AUTH_REFRESH_ATTEMPTED) &&
					error instanceof HttpErrorResponse &&
					error.status === 401
				) {
					authSession.clearSession();
				}

				return throwError(() => error);
			}

			return authRefresh.refreshSession().pipe(
				switchMap(session =>
					next(
						attachAccessToken(
							request.clone({
								context: request.context.set(AUTH_REFRESH_ATTEMPTED, true)
							}),
							session.accessToken
						)
					)
				),
				catchError(refreshError => {
					if (
						refreshError instanceof HttpErrorResponse &&
						refreshError.status === 401
					) {
						authSession.clearSession();
					}

					return throwError(() => refreshError);
				})
			);
		})
	);
};

function attachAccessToken<T>(request: HttpRequest<T>, accessToken: string) {
	return request.clone({
		setHeaders: {
			Authorization: `Bearer ${accessToken}`
		}
	});
}

function shouldRefreshSession(
	request: HttpRequest<unknown>,
	accessToken: string | null,
	error: unknown
) {
	if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
		return false;
	}

	if (!accessToken || request.context.get(AUTH_REFRESH_ATTEMPTED)) {
		return false;
	}

	return !AUTH_REFRESH_EXCLUDED_PATHS.has(resolvePathname(request.url));
}

function resolvePathname(url: string) {
	if (url.startsWith('http://') || url.startsWith('https://')) {
		return new URL(url).pathname;
	}

	return new URL(url, environment.apiBaseUrl).pathname;
}
