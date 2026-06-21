import { Prisma } from '../__generated__/index.js';
import {
	seedAttributeGraphs,
	seedAttributePoolRules,
	seedAttributes
} from './seed-attributes';
import { seedCharacteristics } from './seed-characteristics';
import { seedConditions } from './seed-conditions';
import { seedDamageTypes } from './seed-damage-types';
import { seedGameEventHandlers } from './seed-game-events';
import { seedAreaShapes } from './seed-area-shapes';
import { seedMagicWordLinks } from './seed-magic-word-links';
import { seedMagicWords } from './seed-magic-words';
import { seedProgressionPresets } from './seed-progression-presets';
import {
	seedRollConsequences,
	seedRollConsequenceValues,
	seedRollEventGraphs
} from './seed-roll-consequences';
import { seedSkillLevels } from './seed-skill-levels';
import { seedSkillCategories, seedSkills } from './seed-skills';
import { seedSpellMechanics } from './seed-spell-mechanics';
import { seedSpells } from './seed-spells';
import {
	seedHealthValue,
	seedPotentialValue,
	seedSourceValue,
	seedSpellcasterLevelValue
} from './seed-system-values';

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
	await seedHealthValue(tx);
	await seedRollEventGraphs(tx, {
		consequences,
		consequenceValues,
		attributes
	});
	await seedGameEventHandlers(tx, { sourceValue });
	await seedDamageTypes(tx);
	await seedConditions(tx);
	await seedProgressionPresets(tx);
	const categories = await seedSkillCategories(tx);
	await seedSkills(tx, {
		categories,
		characteristics,
		consequences
	});
	await seedSpellcasterLevelValue(tx);
	await seedSpellMechanics(tx);
	await seedMagicWords(tx);
	await seedAreaShapes(tx);
	await seedMagicWordLinks(tx);
	await seedSpells(tx);
}
