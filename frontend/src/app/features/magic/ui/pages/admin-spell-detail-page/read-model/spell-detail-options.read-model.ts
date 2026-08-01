import {
	Skill,
	SkillCategory
} from '../../../../../skills/domain/skills.models';
import { SystemValue } from '../../../../../values/domain/values.models';

export interface SelectOption {
	id: string;
	name: string;
	searchText: string;
}

export interface SelectOptionGroup {
	label: string;
	items: SelectOption[];
}

export interface CommandSelectOption {
	label: string;
	value: string;
}

export interface CommandSelectOptionGroup {
	label: string;
	items: CommandSelectOption[];
}

export function createSkillOptionGroups(
	categories: SkillCategory[],
	skills: Skill[]
): SelectOptionGroup[] {
	return categories
		.filter(category => category.isActive)
		.sort(compareByOrderAndName)
		.map(category => ({
			label: category.name,
			items: skills
				.filter(skill => skill.isActive && skill.categoryId === category.id)
				.sort(compareByOrderAndName)
				.map(toSelectOption)
		}))
		.filter(group => group.items.length);
}

export function createSingleOptionGroup(
	label: string,
	items: SelectOption[]
): SelectOptionGroup[] {
	return items.length ? [{ label, items }] : [];
}

export function createSingleCommandOptionGroup(
	label: string,
	items: CommandSelectOption[]
): CommandSelectOptionGroup[] {
	return items.length ? [{ label, items }] : [];
}

export function compareByOrderAndName<
	T extends { sortOrder?: number; name: string }
>(first: T, second: T) {
	const orderDiff = (first.sortOrder ?? 0) - (second.sortOrder ?? 0);
	return orderDiff || first.name.localeCompare(second.name, 'ru');
}

export function compareBySectionAndName(
	first: Pick<SystemValue, 'displaySection' | 'name'>,
	second: Pick<SystemValue, 'displaySection' | 'name'>
) {
	return (
		first.displaySection.localeCompare(second.displaySection, 'ru') ||
		first.name.localeCompare(second.name, 'ru')
	);
}

function toSelectOption(item: { id: string; name: string }) {
	return {
		id: item.id,
		name: item.name,
		searchText: item.name.toLowerCase()
	};
}
