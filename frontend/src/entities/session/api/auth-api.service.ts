import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@app/config/environment';
import {
	AuthUser,
	LoginResponse,
	MessageResponse
} from '@entities/session/model/session.types';
import { SignInPayload, SignUpPayload } from '@entities/session/api/auth.contracts';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	register(payload: SignUpPayload): Observable<MessageResponse> {
		return this.http.post<MessageResponse>(`${this.baseUrl}/auth/register`, payload, {
			withCredentials: true
		});
	}

	login(payload: SignInPayload): Observable<LoginResponse> {
		return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, payload, {
			withCredentials: true
		});
	}

	refresh(): Observable<LoginResponse> {
		return this.http.post<LoginResponse>(
			`${this.baseUrl}/auth/refresh`,
			{},
			{
				withCredentials: true
			}
		);
	}

	me(): Observable<AuthUser> {
		return this.http.get<AuthUser>(`${this.baseUrl}/auth/me`, {
			withCredentials: true
		});
	}

	logout(): Observable<void> {
		return this.http.post<void>(
			`${this.baseUrl}/auth/logout`,
			{},
			{
				withCredentials: true
			}
		);
	}
}

export function extractApiErrorMessage(error: unknown): string {
	if (error instanceof HttpErrorResponse) {
		const message = error.error?.message;

		if (Array.isArray(message)) {
			return message.join('\n');
		}

		if (typeof message === 'string' && message.trim()) {
			return message;
		}
	}

	return 'Request failed.';
}
