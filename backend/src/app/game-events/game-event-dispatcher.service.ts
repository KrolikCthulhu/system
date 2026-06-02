import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import {
	EventValueChange,
	RollEventGraphRuntimeService,
	RollEventPayload
} from './roll-event-graph-runtime.service';
import { RuntimeSystemValue } from './system-value-runtime.service';

export interface RollPerformedHandler {
	ownerType: 'ROLL_CONSEQUENCE' | 'GAME_EVENT_HANDLER';
	ownerId: string;
	name: string;
	graph: Prisma.JsonValue | null;
	isActive: boolean;
	sortOrder: number;
}

export interface GameEventDispatchResult {
	valueChanges: EventValueChange[];
	logs: string[];
}

@Injectable()
export class GameEventDispatcherService {
	constructor(private readonly rollRuntime: RollEventGraphRuntimeService) {}

	dispatchRollPerformed(params: {
		payload: RollEventPayload;
		handlers: RollPerformedHandler[];
		values: RuntimeSystemValue[];
		inputValues: Record<string, number>;
	}): GameEventDispatchResult {
		const sortedHandlers = [...params.handlers]
			.filter(handler => handler.isActive)
			.sort((left, right) => left.sortOrder - right.sortOrder);

		const logs: string[] = [];
		const valueChanges: EventValueChange[] = [];

		for (const handler of sortedHandlers) {
			const result = this.rollRuntime.execute({
				graph: handler.graph,
				payload: params.payload,
				values: params.values,
				inputValues: params.inputValues,
				handlerName: handler.name
			});

			logs.push(...result.logs);
			valueChanges.push(...result.valueChanges);
		}

		return {
			valueChanges,
			logs
		};
	}
}
