import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { SystemValueRuntimeService } from '../game-events/system-value-runtime.service';
import { PrismaService } from '../prisma/prisma.service';
import { coreSystemValueKeys } from '../values/core-system-values';

@Injectable()
export class CombatParticipantInitialValuesService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly systemValueRuntime: SystemValueRuntimeService
	) {}

	async resolvePlayerCharacterValues(inputValues: Prisma.JsonValue) {
		const normalizedInputValues = normalizeInputValues(inputValues);
		const values = await this.loadSystemValues();

		return {
			health: this.resolveCoreValue(
				coreSystemValueKeys.healthPoints,
				values,
				normalizedInputValues
			),
			potential: this.resolveCoreValue(
				coreSystemValueKeys.actionPoints,
				values,
				normalizedInputValues
			),
			speed: this.resolveCoreValue(
				coreSystemValueKeys.speed,
				values,
				normalizedInputValues
			)
		};
	}

	async resolveCreatureValues(tier: {
		characteristics: Array<{
			value: number;
			characteristic: { systemValueId: string };
		}>;
	}) {
		const inputValues = tier.characteristics.reduce<Record<string, number>>(
			(result, item) => ({
				...result,
				[item.characteristic.systemValueId]: item.value
			}),
			{}
		);
		const values = await this.loadSystemValues();

		return {
			potential: this.resolveCoreValue(
				coreSystemValueKeys.actionPoints,
				values,
				inputValues
			),
			speed: this.resolveCoreValue(
				coreSystemValueKeys.speed,
				values,
				inputValues
			)
		};
	}

	private loadSystemValues() {
		return this.prisma.systemValue.findMany({
			select: {
				id: true,
				name: true,
				coreKey: true,
				calculationGraph: true
			}
		});
	}

	private resolveCoreValue(
		coreKey: string,
		values: Array<{
			id: string;
			name: string;
			coreKey: string | null;
			calculationGraph: Prisma.JsonValue | null;
		}>,
		inputValues: Record<string, number>
	) {
		const value = values.find(item => item.coreKey === coreKey);

		if (!value) {
			throw new InternalServerErrorException(
				`Core system value is not configured: ${coreKey}.`
			);
		}

		return Math.max(
			0,
			Math.floor(
				this.systemValueRuntime.evaluateValue(value.id, values, inputValues)
			)
		);
	}
}

function normalizeInputValues(value: Prisma.JsonValue): Record<string, number> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return {};
	}

	return Object.entries(value).reduce<Record<string, number>>(
		(result, [key, rawValue]) => {
			if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
				result[key] = rawValue;
			}

			return result;
		},
		{}
	);
}
