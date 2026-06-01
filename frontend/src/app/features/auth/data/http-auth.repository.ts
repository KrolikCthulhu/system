import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { AuthRepository } from './auth-repository.port';
import { SignInCommand, SignUpCommand } from '../state/auth.commands';
import { AuthSession } from '../domain/auth.models';
import { environment } from '../../../infrastructure/config/environment';
import { ApiMessageDto, AuthSessionDto } from './dto/auth.dto';
import { mapAuthSessionDto } from './mappers/auth.mapper';
import { extractApiErrorMessage } from './auth-http-error.util';

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
				map(mapAuthSessionDto),
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
