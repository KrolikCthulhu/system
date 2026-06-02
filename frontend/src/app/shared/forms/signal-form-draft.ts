import { computed, DestroyRef, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';

export class SignalFormDraft<T> {
	private readonly valueSignal: WritableSignal<T>;
	private readonly baselineSnapshot = signal<string | null>(null);

	readonly value: Signal<T>;
	readonly hasChanges: Signal<boolean>;

	constructor(
		form: AbstractControl,
		private readonly readValue: () => T,
		destroyRef: DestroyRef,
		private readonly serialize: (value: T) => string = value =>
			JSON.stringify(value)
	) {
		this.valueSignal = signal<T>(this.readValue());
		this.value = this.valueSignal.asReadonly();
		this.hasChanges = computed(() => {
			const baseline = this.baselineSnapshot();

			return baseline !== null && this.serialize(this.value()) !== baseline;
		});

		form.valueChanges
			.pipe(takeUntilDestroyed(destroyRef))
			.subscribe(() => this.syncFromForm());
	}

	syncFromForm() {
		this.valueSignal.set(this.readValue());
	}

	capture(value: T = this.readValue()) {
		this.valueSignal.set(value);
		this.baselineSnapshot.set(this.serialize(value));
	}

	clear() {
		this.valueSignal.set(this.readValue());
		this.baselineSnapshot.set(null);
	}
}
