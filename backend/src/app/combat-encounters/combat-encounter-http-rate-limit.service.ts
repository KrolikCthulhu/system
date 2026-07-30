import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

export interface CombatEncounterHttpRateLimitInput {
	userId: string;
	encounterId: string;
	commandType: string;
	userLimit: number;
	encounterLimit: number;
	windowMs: number;
	nowMs?: number;
}

interface HttpRateLimitBucket {
	count: number;
	resetAtMs: number;
}

@Injectable()
export class CombatEncounterHttpRateLimitService {
	private readonly buckets = new Map<string, HttpRateLimitBucket>();

	assertAllowed(input: CombatEncounterHttpRateLimitInput) {
		const nowMs = input.nowMs ?? Date.now();
		const userResult = this.consume({
			key: `user:${input.userId}:${input.commandType}`,
			limit: input.userLimit,
			windowMs: input.windowMs,
			nowMs
		});
		const encounterResult = this.consume({
			key: `encounter:${input.encounterId}:${input.commandType}`,
			limit: input.encounterLimit,
			windowMs: input.windowMs,
			nowMs
		});

		if (userResult.allowed && encounterResult.allowed) {
			return;
		}

		throw new HttpException(
			{
				message: 'Слишком много боевых команд. Повторите позже.',
				code: 'combat_command_rate_limited',
				retryAfterMs: Math.max(
					userResult.retryAfterMs,
					encounterResult.retryAfterMs
				)
			},
			HttpStatus.TOO_MANY_REQUESTS
		);
	}

	private consume(input: {
		key: string;
		limit: number;
		windowMs: number;
		nowMs: number;
	}) {
		const bucket = this.buckets.get(input.key);

		if (!bucket || bucket.resetAtMs <= input.nowMs) {
			this.buckets.set(input.key, {
				count: 1,
				resetAtMs: input.nowMs + input.windowMs
			});
			return { allowed: true, retryAfterMs: 0 };
		}

		if (bucket.count >= input.limit) {
			return {
				allowed: false,
				retryAfterMs: Math.max(0, bucket.resetAtMs - input.nowMs)
			};
		}

		bucket.count += 1;
		return { allowed: true, retryAfterMs: 0 };
	}
}
