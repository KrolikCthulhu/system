import { FormControl, FormGroup } from '@angular/forms';
import { Attribute } from '../../domain/attributes.models';

export type AttributeForm = FormGroup<{
	name: FormControl<string>;
	description: FormControl<string>;
	poolPenaltyValueId: FormControl<string | null>;
	sortOrder: FormControl<number>;
}>;

export interface AttributeFormValue {
	name: string;
	description: string;
	poolPenaltyValueId: string | null;
	sortOrder: number;
}

export function createAttributeForm(): AttributeForm {
	return new FormGroup({
		name: new FormControl('', { nonNullable: true }),
		description: new FormControl('', { nonNullable: true }),
		poolPenaltyValueId: new FormControl<string | null>(null),
		sortOrder: new FormControl(0, { nonNullable: true })
	});
}

export function getAttributeFormValue(form: AttributeForm): AttributeFormValue {
	const raw = form.getRawValue();

	return {
		name: raw.name,
		description: raw.description,
		poolPenaltyValueId: raw.poolPenaltyValueId,
		sortOrder: raw.sortOrder
	};
}

export function patchAttributeForm(
	form: AttributeForm,
	attribute: Attribute | null
) {
	if (!attribute) {
		resetAttributeForm(form);
		return;
	}

	form.enable({ emitEvent: false });
	form.setValue(
		{
			name: attribute.name,
			description: attribute.description,
			poolPenaltyValueId: attribute.poolPenaltyValueId,
			sortOrder: attribute.sortOrder
		},
		{ emitEvent: false }
	);
	form.markAsPristine();
	form.markAsUntouched();
}

export function resetAttributeForm(form: AttributeForm) {
	form.reset(
		{
			name: '',
			description: '',
			poolPenaltyValueId: null,
			sortOrder: 0
		},
		{ emitEvent: false }
	);
	form.disable({ emitEvent: false });
	form.markAsPristine();
	form.markAsUntouched();
}
