export const coreCombatActionKeys = {
	waitUntilAfterParticipant: 'wait_until_after_participant',
	enterDefenseStance: 'enter_defense_stance',
	endRoundParticipation: 'end_round_participation'
} as const;

export type CoreCombatActionKey =
	(typeof coreCombatActionKeys)[keyof typeof coreCombatActionKeys];
