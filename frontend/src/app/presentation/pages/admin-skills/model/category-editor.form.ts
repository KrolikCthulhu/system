import { FormControl, FormGroup } from '@angular/forms';
import { SkillCategory } from '../../../../domain/skills/skills.models';

export type CategoryForm = FormGroup<{
	name: FormControl<string>;
	code: FormControl<string>;
	description: FormControl<string>;
}>;

export function createCategoryForm(): CategoryForm {
	return new FormGroup({
		name: new FormControl('', { nonNullable: true }),
		code: new FormControl('', { nonNullable: true }),
		description: new FormControl('', { nonNullable: true })
	});
}

export function patchCategoryForm(
	form: CategoryForm,
	category: SkillCategory | null
) {
	if (!category) {
		resetCategoryForm(form);
		return;
	}

	form.enable({ emitEvent: false });
	form.setValue(
		{
			name: category.name,
			code: category.code,
			description: category.description
		},
		{ emitEvent: false }
	);
	form.markAsPristine();
	form.markAsUntouched();
}

export function resetCategoryForm(form: CategoryForm) {
	form.reset(
		{
			name: '',
			code: '',
			description: ''
		},
		{ emitEvent: false }
	);
	form.disable({ emitEvent: false });
	form.markAsPristine();
	form.markAsUntouched();
}
