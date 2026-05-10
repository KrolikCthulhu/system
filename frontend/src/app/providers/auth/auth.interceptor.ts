import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthSessionService } from '@entities/session/model/auth-session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const authSession = inject(AuthSessionService);
	const accessToken = authSession.accessToken();

	if (!accessToken) {
		return next(req);
	}

	return next(
		req.clone({
			setHeaders: {
				Authorization: `Bearer ${accessToken}`
			}
		})
	);
};
