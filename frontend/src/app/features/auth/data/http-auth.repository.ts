import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { handleApiError } from '../../../shared/http/api-error.util';
import { AuthRepository } from './auth-repository.port';
import { SignInCommand, SignUpCommand } from '../state/auth.commands';
import { AuthSession } from '../domain/auth.models';
import { environment } from '../../../infrastructure/config/environment';
import { ApiMessageDto, AuthSessionDto } from './dto/auth.dto';
import { mapAuthSessionDto } from './mappers/auth.mapper';

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
				catchError(handleApiError)
			);
	}

	signUp(command: SignUpCommand): Observable<void> {
		return this.http
			.post<ApiMessageDto>(`${this.baseUrl}/auth/register`, command, {
				withCredentials: true
			})
			.pipe(
				map(() => undefined),
				catchError(handleApiError)
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
				catchError(handleApiError)
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
			.pipe(catchError(handleApiError));
	}
}
