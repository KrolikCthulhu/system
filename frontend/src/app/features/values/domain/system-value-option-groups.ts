import { SystemValue } from './values.models';

export interface SystemValueOption {
	label: string;
	value: string;
}

export interface SystemValueOptionGroup {
	label: string;
	value: string;
	items: SystemValueOption[];
}

export function createSystemValueOptionGroups(
	values: SystemValue[],
	options: { excludeIds?: readonly (string | null | undefined)[] } = {}
): SystemValueOptionGroup[] {
	const excludedIds = new Set(
		(options.excludeIds ?? []).filter((id): id is string => Boolean(id))
	);
	const grouped = new Map<string, SystemValueOption[]>();

	for (const value of values) {
		if (excludedIds.has(value.id)) {
			continue;
		}

		const groupLabel = value.contextLabel
			? `${value.groupLabel} / ${value.contextLabel}`
			: value.groupLabel;
		const items = grouped.get(groupLabel) ?? [];
		items.push({
			label: value.name,
			value: value.id
		});
		grouped.set(groupLabel, items);
	}

	return Array.from(grouped.entries()).map(([label, items]) => ({
		label,
		value: label,
		items
	}));
}
