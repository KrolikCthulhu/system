import type { AreaShapeContent, ContentDocument } from '../content-types';

export default {
	areaShapes: [
		{
			slug: 'tochka',
			name: 'Точка',
			gestureSlug: 'tochka',
			kind: 'POINT',
			description: 'Одна выбранная точка без протяжённой области.',
			dimensions: {
				version: 1,
				primaryDimension: '',
				unit: 'cell',
				base: {}
			},
			influenceConfig: {
				version: 1,
				sources: []
			},
			sortOrder: 0
		},
		{
			slug: 'liniya',
			name: 'Линия',
			gestureSlug: 'liniya',
			kind: 'LINE',
			description: 'Прямая область с длиной и небольшой шириной.',
			dimensions: {
				version: 1,
				primaryDimension: 'length',
				unit: 'cell',
				base: {
					length: 5,
					width: 1
				}
			},
			influenceConfig: {
				version: 1,
				sources: []
			},
			sortOrder: 1
		},
		{
			slug: 'konus',
			name: 'Конус',
			gestureSlug: 'konus',
			kind: 'CONE',
			description: 'Область, расширяющаяся от точки происхождения.',
			dimensions: {
				version: 1,
				primaryDimension: 'length',
				unit: 'cell',
				base: {
					length: 4
				}
			},
			influenceConfig: {
				version: 1,
				sources: []
			},
			sortOrder: 3
		},
		{
			slug: 'ploskost',
			name: 'Плоскость',
			gestureSlug: 'ploskost',
			kind: 'PLANE',
			description: 'Плоская область из квадратов 1 на 1 метр с горизонтальной, вертикальной или свободной ориентацией.',
			dimensions: {
				version: 1,
				primaryDimension: 'tiles',
				unit: 'cell',
				base: {
					tiles: 4
				}
			},
			influenceConfig: {
				version: 1,
				sources: []
			},
			sortOrder: 2
		},
		{
			slug: 'sfera',
			name: 'Сфера',
			gestureSlug: 'sfera',
			kind: 'SPHERE',
			description: 'Объёмная область вокруг выбранной точки.',
			dimensions: {
				version: 1,
				primaryDimension: 'radius',
				unit: 'cell',
				base: {
					radius: 2
				}
			},
			influenceConfig: {
				version: 1,
				sources: []
			},
			sortOrder: 4
		},
		{
			slug: 'kub',
			name: 'Куб',
			gestureSlug: 'kub',
			kind: 'CUBE',
			description: 'Область с равными сторонами.',
			dimensions: {
				version: 1,
				primaryDimension: 'side',
				unit: 'cell',
				base: {
					side: 3
				}
			},
			influenceConfig: {
				version: 1,
				sources: []
			},
			sortOrder: 5
		},
		{
			slug: 'tsilindr',
			name: 'Цилиндр',
			gestureSlug: 'tsilindr',
			kind: 'CYLINDER',
			description: 'Область с радиусом основания и высотой.',
			dimensions: {
				version: 1,
				primaryDimension: 'radius',
				unit: 'cell',
				base: {
					radius: 2,
					height: 4
				}
			},
			influenceConfig: {
				version: 1,
				sources: []
			},
			sortOrder: 6
		},
		{
			slug: 'koltso',
			name: 'Кольцо',
			gestureSlug: 'koltso',
			kind: 'RING',
			description: 'Кольцевая область между внутренним и внешним радиусом.',
			dimensions: {
				version: 1,
				primaryDimension: 'innerRadius',
				unit: 'cell',
				base: {
					innerRadius: 1,
					thickness: 2
				}
			},
			influenceConfig: {
				version: 1,
				sources: []
			},
			sortOrder: 7
		}
	],
	schemaVersion: 1
} satisfies ContentDocument<{ areaShapes: AreaShapeContent[] }>;
