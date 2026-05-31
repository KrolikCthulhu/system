import { computed, signal } from '@angular/core';
import { normalizeGraphState } from './value-graph.runtime';
import { SystemValueCalculationDefinition } from './system-value-calculation.models';

export class SystemValueCalculationDraftController {
	private readonly original = signal<SystemValueCalculationDefinition | null>(null);
	readonly draft = signal<SystemValueCalculationDefinition | null>(null);
	readonly hasChanges = computed(
		() => !areCalculationDefinitionsEqual(this.original(), this.draft())
	);

	set(value: SystemValueCalculationDefinition | null) {
		const cloned = value ? structuredClone(value) : null;
		this.original.set(cloned);
		this.draft.set(cloned ? structuredClone(cloned) : null);
	}

	update(value: SystemValueCalculationDefinition | null) {
		this.draft.set(value ? structuredClone(value) : null);
	}

	reset() {
		const original = this.original();
		this.draft.set(original ? structuredClone(original) : null);
	}

	commit(value?: SystemValueCalculationDefinition | null) {
		const next = value === undefined ? this.draft() : value;
		const cloned = next ? structuredClone(next) : null;
		this.original.set(cloned);
		this.draft.set(cloned ? structuredClone(cloned) : null);
	}

	clear() {
		this.original.set(null);
		this.draft.set(null);
	}
}

export function areCalculationDefinitionsEqual(
	left: SystemValueCalculationDefinition | null,
	right: SystemValueCalculationDefinition | null
) {
	if (left === right) {
		return true;
	}

	if (!left || !right) {
		return false;
	}

	return (
		left.id === right.id &&
		left.isSystemValue === right.isSystemValue &&
		left.sourceType === right.sourceType &&
		left.baseSourceType === right.baseSourceType &&
		JSON.stringify(normalizeGraphState(left.calculationGraph)) ===
			JSON.stringify(normalizeGraphState(right.calculationGraph))
	);
}
