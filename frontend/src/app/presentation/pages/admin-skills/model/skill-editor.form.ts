import { FormControl, FormGroup } from '@angular/forms';
import { Skill } from '../../../../domain/skills/skills.models';

export type SkillForm = FormGroup<{
	name: FormControl<string>;
	code: FormControl<string>;
	categoryId: FormControl<string>;
	defaultLevel: FormControl<number>;
	maxLevel: FormControl<number>;
	usesDefaultLevelRules: FormControl<boolean>;
	description: FormControl<string>;
}>;

export function createSkillForm(): SkillForm {
	return new FormGroup({
		name: new FormControl('', { nonNullable: true }),
		code: new FormControl('', { nonNullable: true }),
		categoryId: new FormControl('', { nonNullable: true }),
		defaultLevel: new FormControl(0, { nonNullable: true }),
		maxLevel: new FormControl(6, { nonNullable: true }),
		usesDefaultLevelRules: new FormControl(true, { nonNullable: true }),
		description: new FormControl('', { nonNullable: true })
	});
}

export function patchSkillForm(form: SkillForm, skill: Skill | null) {
	if (!skill) {
		resetSkillForm(form);
		return;
	}

	form.enable({ emitEvent: false });
	form.setValue(
		{
			name: skill.name,
			code: skill.code,
			categoryId: skill.categoryId,
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
			code: '',
			categoryId: '',
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
