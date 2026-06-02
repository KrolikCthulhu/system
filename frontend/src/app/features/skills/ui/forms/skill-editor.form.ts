import { FormControl, FormGroup } from '@angular/forms';
import { Skill } from '../../domain/skills.models';

export type SkillForm = FormGroup<{
	name: FormControl<string>;
	categoryId: FormControl<string>;
	rollConsequenceId: FormControl<string | null>;
	rollCharacteristicId: FormControl<string | null>;
	defaultLevel: FormControl<number>;
	maxLevel: FormControl<number>;
	usesDefaultLevelRules: FormControl<boolean>;
	description: FormControl<string>;
}>;

export interface SkillFormValue {
	name: string;
	categoryId: string;
	rollConsequenceId: string | null;
	rollCharacteristicId: string | null;
	defaultLevel: number;
	maxLevel: number;
	usesDefaultLevelRules: boolean;
	description: string;
}

export function createSkillForm(): SkillForm {
	return new FormGroup({
		name: new FormControl('', { nonNullable: true }),
		categoryId: new FormControl('', { nonNullable: true }),
		rollConsequenceId: new FormControl<string | null>(null),
		rollCharacteristicId: new FormControl<string | null>(null),
		defaultLevel: new FormControl(0, { nonNullable: true }),
		maxLevel: new FormControl(6, { nonNullable: true }),
		usesDefaultLevelRules: new FormControl(true, { nonNullable: true }),
		description: new FormControl('', { nonNullable: true })
	});
}

export function getSkillFormValue(form: SkillForm): SkillFormValue {
	const raw = form.getRawValue();

	return {
		name: raw.name,
		categoryId: raw.categoryId,
		rollConsequenceId: raw.rollConsequenceId,
		rollCharacteristicId: raw.rollCharacteristicId,
		defaultLevel: raw.defaultLevel,
		maxLevel: raw.maxLevel,
		usesDefaultLevelRules: raw.usesDefaultLevelRules,
		description: raw.description
	};
}

export function patchSkillForm(form: SkillForm, skill: Skill | null) {
	if (!skill) {
		resetSkillForm(form);
		return;
	}

	form.enable({ emitEvent: false });
	form.patchValue(
		{
			name: skill.name,
			categoryId: skill.categoryId,
			rollConsequenceId: skill.rollConsequenceId ?? null,
			rollCharacteristicId: skill.rollCharacteristicId ?? null,
			defaultLevel: skill.defaultLevel,
			maxLevel: skill.maxLevel,
			usesDefaultLevelRules: skill.usesDefaultLevelRules,
			description: skill.description
		},
		{ emitEvent: false }
	);
	form.markAsPristine();
	form.markAsUntouched();
}

export function resetSkillForm(form: SkillForm) {
	form.reset(
		{
			name: '',
			categoryId: '',
			rollConsequenceId: null,
			rollCharacteristicId: null,
			defaultLevel: 0,
			maxLevel: 6,
			usesDefaultLevelRules: true,
			description: ''
		},
		{ emitEvent: false }
	);
	form.disable({ emitEvent: false });
	form.markAsPristine();
	form.markAsUntouched();
}
