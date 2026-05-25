import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { AuthRepository } from './auth-repository.port';
import {
	SignInCommand,
	SignUpCommand
} from '../state/auth.commands';
import { AuthSession } from '../domain/auth.models';
import { environment } from '../../../infrastructure/config/environment';
import { ApiMessageDto, AuthSessionDto, AuthUserDto } from './dto/auth.dto';
import { mapAuthSessionDto, mapAuthUserDto } from './mappers/auth.mapper';

@Injectable({ providedIn: 'root' })
export class HttpAuthRepository implements AuthRepository {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	signIn(command: SignInCommand): Observable<AuthSession> {
		return this.http
			.post<AuthSessionDto>(`${this.baseUrl}/auth/login`, command, {
				withCredentials: true
			})
			.pipe(
				map(mapAuthSessionDto),
				catchError(error => this.handleHttpError(error))
			);
	}

	signUp(command: SignUpCommand): Observable<void> {
		return this.http
			.post<ApiMessageDto>(`${this.baseUrl}/auth/register`, command, {
				withCredentials: true
			})
			.pipe(
				map(() => undefined),
				catchError(error => this.handleHttpError(error))
			);
	}

	restoreSession(): Observable<AuthSession> {
		return this.http
			.post<AuthSessionDto>(
				`${this.baseUrl}/auth/refresh`,
				{},
				{
					withCredentials: true
				}
			)
			.pipe(
				switchMap(refreshResult =>
					this.http
						.get<AuthUserDto>(`${this.baseUrl}/auth/me`, {
							withCredentials: true
						})
						.pipe(
							map(user => ({
								accessToken: refreshResult.accessToken,
								user: mapAuthUserDto(user)
							}))
						)
				),
				catchError(error => this.handleHttpError(error))
			);
	}

	logout(): Observable<void> {
		return this.http
			.post<void>(
				`${this.baseUrl}/auth/logout`,
				{},
				{
					withCredentials: true
				}
			)
			.pipe(catchError(error => this.handleHttpError(error)));
	}

	private handleHttpError(error: unknown) {
		return throwError(() => new Error(extractApiErrorMessage(error)));
	}
}

function extractApiErrorMessage(error: unknown): string {
	if (error instanceof HttpErrorResponse) {
		const message = error.error?.message;

		if (Array.isArray(message)) {
			return message.join('\n');
		}

		if (typeof message === 'string' && message.trim()) {
			return message;
		}

		if (error.status === 0) {
			return 'API is unavailable.';
		}
	}

	return 'Request failed.';
}
