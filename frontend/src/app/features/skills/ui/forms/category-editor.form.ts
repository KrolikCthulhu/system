import { FormControl, FormGroup } from '@angular/forms';
import { SkillCategory } from '../../domain/skills.models';

export type CategoryForm = FormGroup<{
	name: FormControl<string>;
	description: FormControl<string>;
}>;

export interface CategoryFormValue {
	name: string;
	description: string;
}

export function createCategoryForm(): CategoryForm {
	return new FormGroup({
		name: new FormControl('', { nonNullable: true }),
		description: new FormControl('', { nonNullable: true })
	});
}

export function getCategoryFormValue(form: CategoryForm): CategoryFormValue {
	const raw = form.getRawValue();

	return {
		name: raw.name,
		description: raw.description
	};
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
			description: ''
		},
		{ emitEvent: false }
	);
	form.disable({ emitEvent: false });
	form.markAsPristine();
	form.markAsUntouched();
}
