import { Injectable } from '@nestjs/common';

export interface CombatEncounterSocketRateLimitInput {
	socketId: string;
	eventName: string;
	limit: number;
	windowMs: number;
	nowMs?: number;
}

interface SocketRateLimitBucket {
	count: number;
	resetAtMs: number;
}

@Injectable()
export class CombatEncounterSocketRateLimitService {
	private readonly buckets = new Map<string, SocketRateLimitBucket>();

	consume(input: CombatEncounterSocketRateLimitInput) {
		const nowMs = input.nowMs ?? Date.now();
		const key = `${input.socketId}:${input.eventName}`;
		const bucket = this.buckets.get(key);

		if (!bucket || bucket.resetAtMs <= nowMs) {
			this.buckets.set(key, {
				count: 1,
				resetAtMs: nowMs + input.windowMs
			});
			return { allowed: true, retryAfterMs: 0 };
		}

		if (bucket.count >= input.limit) {
			return {
				allowed: false,
				retryAfterMs: Math.max(0, bucket.resetAtMs - nowMs)
			};
		}

		bucket.count += 1;
		return { allowed: true, retryAfterMs: 0 };
	}

	clearSocket(socketId: string) {
		const prefix = `${socketId}:`;

		for (const key of this.buckets.keys()) {
			if (key.startsWith(prefix)) {
				this.buckets.delete(key);
			}
		}
	}
}
