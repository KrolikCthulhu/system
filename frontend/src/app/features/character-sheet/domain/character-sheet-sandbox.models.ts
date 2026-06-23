import {
	Attribute,
	Characteristic
} from '../../attributes/domain/attributes.models';
import {
	Skill,
	SkillCategory,
	SkillLevel
} from '../../skills/domain/skills.models';
import { SystemValue } from '../../values/domain/values.models';

export interface CharacterSheetSandboxDraft {
	inputValues: Record<string, number>;
}

export interface CharacterSheetSandboxRoll {
	skillId: string;
	skillName: string;
	diceCount: number;
	dice: number[];
	successes: number;
	sixes: number;
	ones: number;
	ignoredOnes: number;
	consequenceCount: number;
	consequenceName: string;
	eventLogs: string[];
	valueChanges: Array<{
		valueId: string;
		value: number;
	}>;
}

export interface CharacterSheetSandboxRollResult extends CharacterSheetSandboxDraft {
	roll: CharacterSheetSandboxRoll;
}

export interface CharacterSheetSandboxPageData {
	attributes: Attribute[];
	characteristics: Characteristic[];
	skillCategories: SkillCategory[];
	skills: Skill[];
	skillLevels: SkillLevel[];
	rollConsequences: Array<{ id: string; name: string }>;
	systemValues: SystemValue[];
	draft: CharacterSheetSandboxDraft;
}
