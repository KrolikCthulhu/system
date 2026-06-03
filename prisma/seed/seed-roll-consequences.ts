import { randomUUID } from 'crypto';
import { Prisma, SystemValueOwnerType } from '../__generated__/index.js';
import { createCharacterInputGraph } from '../../backend/src/app/shared/system-value-graph.factory';
import { ROLL_CONSEQUENCE_SEEDS } from './data';
import { createThresholdCounterRollEventGraph } from './graphs';
import {
	ensureSystemValue,
	findRequiredByName,
	findRequiredMapValue,
	findRollConsequenceByName,
	nullable
} from './helpers';
import {
	SeedAttribute,
	SeedRollConsequence,
	SeedSystemValue
} from './types';

export async function seedRollConsequences(tx: Prisma.TransactionClient) {
	const consequences: SeedRollConsequence[] = [];

	for (const seed of ROLL_CONSEQUENCE_SEEDS) {
		const existing = await findRollConsequenceByName(tx, seed.name);
		const consequence = existing
			? await tx.rollConsequence.update({
					where: { id: existing.id },
					data: {
						name: seed.name,
						description: nullable(seed.description),
						isActive: true,
						sortOrder: seed.sortOrder
					}
			  })
			: await tx.rollConsequence.create({
					data: {
						name: seed.name,
						description: nullable(seed.description),
						isActive: true,
						sortOrder: seed.sortOrder
					}
			  });

		consequences.push(consequence);
	}

	return consequences;
}

export async function seedRollConsequenceValues(
	tx: Prisma.TransactionClient,
	consequences: SeedRollConsequence[]
) {
	const values = new Map<string, SeedSystemValue>();

	for (const seed of ROLL_CONSEQUENCE_SEEDS) {
		const consequence = findRequiredByName(
			consequences,
			seed.name,
			'последствие'
		);

		for (let index = 0; index < seed.values.length; index += 1) {
			const valueName = seed.values[index];
			const existing = await tx.systemValue.findFirst({
				where: {
					name: valueName,
					primaryOwnerType: SystemValueOwnerType.ROLL_CONSEQUENCE,
					primaryOwnerId: consequence.id
				}
			});
			const id = existing?.id ?? randomUUID();
			const value = await ensureSystemValue(tx, {
				id,
				name: valueName,
				description: null,
				primaryOwnerType: SystemValueOwnerType.ROLL_CONSEQUENCE,
				primaryOwnerId: consequence.id,
				calculationGraph: createCharacterInputGraph(),
				isSystemManaged: false,
				isActive: true,
				sortOrder: index,
				link: {
					targetType: SystemValueOwnerType.ROLL_CONSEQUENCE,
					targetId: consequence.id,
					label: null,
					sortOrder: index
				}
			});

			values.set(valueName, value);
		}
	}

	return values;
}

export async function seedRollEventGraphs(
	tx: Prisma.TransactionClient,
	params: {
		consequences: SeedRollConsequence[];
		consequenceValues: Map<string, SeedSystemValue>;
		attributes: SeedAttribute[];
	}
) {
	const fatigue = findRequiredByName(
		params.consequences,
		'Усталость',
		'последствие'
	);
	const stress = findRequiredByName(params.consequences, 'Стресс', 'последствие');
	const body = findRequiredByName(params.attributes, 'Тело', 'атрибут');
	const mind = findRequiredByName(params.attributes, 'Разум', 'атрибут');

	await tx.rollConsequence.update({
		where: { id: fatigue.id },
		data: {
			rollEventGraph: createThresholdCounterRollEventGraph({
				accumulatorValueId: findRequiredMapValue(
					params.consequenceValues,
					'Очки усталости'
				).id,
				thresholdValueId: body.systemValueId,
				overflowValueId: findRequiredMapValue(
					params.consequenceValues,
					'Уровень усталости'
				).id
			}) as Prisma.InputJsonValue
		}
	});

	await tx.rollConsequence.update({
		where: { id: stress.id },
		data: {
			rollEventGraph: createThresholdCounterRollEventGraph({
				accumulatorValueId: findRequiredMapValue(
					params.consequenceValues,
					'Очки стресса'
				).id,
				thresholdValueId: mind.systemValueId,
				overflowValueId: findRequiredMapValue(
					params.consequenceValues,
					'Уровень стресса'
				).id
			}) as Prisma.InputJsonValue
		}
	});
}
