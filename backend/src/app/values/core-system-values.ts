export const coreSystemValueKeys = {
	healthPoints: 'health_points',
	actionPoints: 'action_points',
	speed: 'speed'
} as const;

export type CoreSystemValueKey =
	(typeof coreSystemValueKeys)[keyof typeof coreSystemValueKeys];
