import {
	AbstractControl,
	FormControl,
	FormGroup,
	ValidationErrors,
	ValidatorFn
} from '@angular/forms';
import { Characteristic } from '../../domain/attributes.models';

export type CharacteristicForm = FormGroup<{
	name: FormControl<string>;
	attributeId: FormControl<string>;
	description: FormControl<string>;
	minValue: FormControl<number>;
	maxValue: FormControl<number>;
	defaultValue: FormControl<number>;
	sortOrder: FormControl<number>;
}>;

export interface CharacteristicFormValue {
	name: string;
	attributeId: string;
	description: string;
	minValue: number;
	maxValue: number;
	defaultValue: number;
	sortOrder: number;
}

export function createCharacteristicForm(): CharacteristicForm {
	return new FormGroup(
		{
			name: new FormControl('', { nonNullable: true }),
			attributeId: new FormControl('', { nonNullable: true }),
			description: new FormControl('', { nonNullable: true }),
			minValue: new FormControl(0, { nonNullable: true }),
			maxValue: new FormControl(10, { nonNullable: true }),
			defaultValue: new FormControl(0, { nonNullable: true }),
			sortOrder: new FormControl(0, { nonNullable: true })
		},
		{ validators: [characteristicRangeValidator] }
	);
}

export function getCharacteristicFormValue(
	form: CharacteristicForm
): CharacteristicFormValue {
	const raw = form.getRawValue();

	return {
		name: raw.name,
		attributeId: raw.attributeId,
		description: raw.description,
		minValue: raw.minValue,
		maxValue: raw.maxValue,
		defaultValue: raw.defaultValue,
		sortOrder: raw.sortOrder
	};
}

export function patchCharacteristicForm(
	form: CharacteristicForm,
	characteristic: Characteristic | null
) {
	if (!characteristic) {
		resetCharacteristicForm(form);
		return;
	}

	form.enable({ emitEvent: false });
	form.setValue(
		{
			name: characteristic.name,
			attributeId: characteristic.attributeId,
			description: characteristic.description,
			minValue: characteristic.minValue,
			maxValue: characteristic.maxValue,
			defaultValue: characteristic.defaultValue,
			sortOrder: characteristic.sortOrder
		},
		{ emitEvent: false }
	);
	form.markAsPristine();
	form.markAsUntouched();
}

export function resetCharacteristicForm(form: CharacteristicForm) {
	form.reset(
		{
			name: '',
			attributeId: '',
			description: '',
			minValue: 0,
			maxValue: 10,
			defaultValue: 0,
			sortOrder: 0
		},
		{ emitEvent: false }
	);
	form.disable({ emitEvent: false });
	form.markAsPristine();
	form.markAsUntouched();
}

const characteristicRangeValidator: ValidatorFn = (
	control: AbstractControl
): ValidationErrors | null => {
	const value = control.value as CharacteristicFormValue | null;

	if (!value) {
		return null;
	}

	if (value.minValue > value.maxValue) {
		return { invalidRange: true };
	}

	if (
		value.defaultValue < value.minValue ||
		value.defaultValue > value.maxValue
	) {
		return { defaultOutOfRange: true };
	}

	return null;
};
