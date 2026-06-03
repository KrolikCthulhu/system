import { Prisma } from '../__generated__/index.js';
import { createSourceGainRollEventGraph } from './graphs';
import { SeedSystemValue } from './types';

export async function seedGameEventHandlers(
	tx: Prisma.TransactionClient,
	params: {
		sourceValue: SeedSystemValue;
	}
) {
	const existing = await tx.gameEventHandler.findFirst({
		where: {
			eventType: 'ROLL_PERFORMED',
			name: 'Начисление источника'
		}
	});
	const data = {
		eventType: 'ROLL_PERFORMED',
		name: 'Начисление источника',
		description: 'За каждую выпавшую 6 добавляет 1 к значению Источник.',
		graph: createSourceGainRollEventGraph(
			params.sourceValue.id
		) as Prisma.InputJsonValue,
		isActive: true,
		sortOrder: -100
	};

	if (existing) {
		await tx.gameEventHandler.update({
			where: { id: existing.id },
			data
		});
		return;
	}

	await tx.gameEventHandler.create({ data });
}
