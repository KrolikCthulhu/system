import { FormControl, FormGroup } from '@angular/forms';
import { SkillLevel } from '../../domain/skills.models';

export type LevelForm = FormGroup<{
	name: FormControl<string>;
	canRoll: FormControl<boolean>;
	successMin: FormControl<number | null>;
	doubleSuccessMin: FormControl<number | null>;
	ignoreOnesCount: FormControl<number>;
	ruleText: FormControl<string>;
}>;

export interface LevelFormValue {
	name: string;
	canRoll: boolean;
	successMin: number | null;
	doubleSuccessMin: number | null;
	ignoreOnesCount: number;
	ruleText: string;
}

export function createLevelForm(): LevelForm {
	return new FormGroup({
		name: new FormControl('', { nonNullable: true }),
		canRoll: new FormControl(true, { nonNullable: true }),
		successMin: new FormControl<number | null>(null),
		doubleSuccessMin: new FormControl<number | null>(null),
		ignoreOnesCount: new FormControl(0, { nonNullable: true }),
		ruleText: new FormControl('', { nonNullable: true })
	});
}

export function getLevelFormValue(form: LevelForm): LevelFormValue {
	const raw = form.getRawValue();

	return {
		name: raw.name,
		canRoll: raw.canRoll,
		successMin: raw.successMin,
		doubleSuccessMin: raw.doubleSuccessMin,
		ignoreOnesCount: raw.ignoreOnesCount,
		ruleText: raw.ruleText
	};
}

export function patchLevelForm(form: LevelForm, level: SkillLevel | null) {
	if (!level) {
		resetLevelForm(form);
		return;
	}

	form.enable({ emitEvent: false });
	form.setValue(
		{
			name: level.name,
			canRoll: level.canRoll,
			successMin: level.successMin,
			doubleSuccessMin: level.doubleSuccessMin,
			ignoreOnesCount: level.ignoreOnesCount,
			ruleText: level.ruleText
		},
		{ emitEvent: false }
	);
	form.markAsPristine();
	form.markAsUntouched();
}

export function resetLevelForm(form: LevelForm) {
	form.reset(
		{
			name: '',
			canRoll: true,
			successMin: null,
			doubleSuccessMin: null,
			ignoreOnesCount: 0,
			ruleText: ''
		},
		{ emitEvent: false }
	);
	form.disable({ emitEvent: false });
	form.markAsPristine();
	form.markAsUntouched();
}
