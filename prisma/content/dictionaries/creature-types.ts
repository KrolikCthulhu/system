import type { ContentDocument, CreatureTypeContent } from '../content-types';

export default {
	creatureTypes: [
		{
			name: 'Звери',
			sortOrder: 0,
			slug: 'zveri'
		}
	],
	schemaVersion: 1
} satisfies ContentDocument<{ creatureTypes: CreatureTypeContent[] }>;
