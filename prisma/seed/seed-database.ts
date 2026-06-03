import { Prisma } from '../__generated__/index.js';
import {
	seedAttributeGraphs,
	seedAttributePoolRules,
	seedAttributes
} from './seed-attributes';
import { seedCharacteristics } from './seed-characteristics';
import { seedGameEventHandlers } from './seed-game-events';
import {
	seedRollConsequences,
	seedRollConsequenceValues,
	seedRollEventGraphs
} from './seed-roll-consequences';
import { seedSkillLevels } from './seed-skill-levels';
import { seedSkillCategories, seedSkills } from './seed-skills';
import { seedPotentialValue, seedSourceValue } from './seed-system-values';

export async function seedDatabase(tx: Prisma.TransactionClient) {
	await seedSkillLevels(tx);

	const consequences = await seedRollConsequences(tx);
	const consequenceValues = await seedRollConsequenceValues(tx, consequences);
	const sourceValue = await seedSourceValue(tx);
	const attributes = await seedAttributes(tx);
	const characteristics = await seedCharacteristics(tx, attributes);

	await seedAttributeGraphs(tx, attributes, characteristics);
	await seedAttributePoolRules(tx, {
		attributes,
		consequenceValues
	});
	await seedPotentialValue(tx, {
		attributes,
		consequenceValues
	});
	await seedRollEventGraphs(tx, {
		consequences,
		consequenceValues,
		attributes
	});
	await seedGameEventHandlers(tx, { sourceValue });

	const categories = await seedSkillCategories(tx);
	await seedSkills(tx, {
		categories,
		characteristics,
		consequences
	});
}
