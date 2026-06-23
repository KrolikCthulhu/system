import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

export function handleApiError(error: unknown) {
	return throwError(() => new Error(extractApiErrorMessage(error)));
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

		if (error.status === 0) {
			return 'API is unavailable.';
		}
	}

	return 'Request failed.';
}
