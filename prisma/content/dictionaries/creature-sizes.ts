import type { ContentDocument, CreatureSizeContent } from '../content-types';

export default {
	creatureSizes: [
		{
			name: 'Крошечный',
			slug: 'kroshechnyy',
			description:
				'Существо намного меньше человека: мелкий зверек, насекомое или небольшой фамильяр.',
			rank: 0,
			sortOrder: 0
		},
		{
			name: 'Малый',
			slug: 'malyy',
			description:
				'Существо заметно меньше человека: ребенок, крупная собака или молодой хищник.',
			rank: 1,
			sortOrder: 1
		},
		{
			name: 'Средний',
			slug: 'sredniy',
			description: 'Существо примерно человеческого масштаба.',
			rank: 2,
			sortOrder: 2
		},
		{
			name: 'Крупный',
			slug: 'krupnyy',
			description:
				'Существо существенно больше человека: медведь, крупный хищник или массивный монстр.',
			rank: 3,
			sortOrder: 3
		},
		{
			name: 'Огромный',
			slug: 'ogromnyy',
			description:
				'Существо размером с повозку, небольшое строение или очень крупное чудовище.',
			rank: 4,
			sortOrder: 4
		},
		{
			name: 'Гигантский',
			slug: 'gigantskiy',
			description:
				'Существо исключительного масштаба, значительно превосходящее обычных противников.',
			rank: 5,
			sortOrder: 5
		}
	],
	schemaVersion: 1
} satisfies ContentDocument<{ creatureSizes: CreatureSizeContent[] }>;
