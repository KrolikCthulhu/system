import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {
	NavigationTreeGroup,
	NavigationTreeItem,
	NavigationTreeSubgroup
} from './navigation-tree.models';

@Component({
	selector: 'app-navigation-tree',
	standalone: true,
	templateUrl: './navigation-tree.component.html',
	styleUrl: './navigation-tree.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigationTreeComponent {
	readonly groups = input<NavigationTreeGroup[]>([]);
	readonly selectedItemId = input<string | null>(null);
	readonly selectedGroupId = input<string | null>(null);
	readonly collapsedGroups = input<ReadonlySet<string>>(new Set());
	readonly collapsedSubgroups = input<ReadonlySet<string>>(new Set());
	readonly selectableGroups = input(false);

	readonly itemSelect = output<string>();
	readonly groupSelect = output<string>();
	readonly groupToggle = output<string>();
	readonly subgroupToggle = output<{
		groupLabel: string;
		subgroupLabel: string;
	}>();

	protected isGroupCollapsed(label: string) {
		return this.collapsedGroups().has(label);
	}

	protected isSubgroupCollapsed(groupLabel: string, subgroupLabel: string) {
		return this.collapsedSubgroups().has(
			this.subgroupKey(groupLabel, subgroupLabel)
		);
	}

	protected selectItem(item: NavigationTreeItem) {
		this.itemSelect.emit(item.id);
	}

	protected selectOrToggleGroup(group: NavigationTreeGroup) {
		if (this.selectableGroups() && group.id) {
			this.groupSelect.emit(group.id);
			return;
		}

		this.toggleGroup(group);
	}

	protected toggleGroup(group: NavigationTreeGroup, event?: MouseEvent) {
		event?.stopPropagation();
		this.groupToggle.emit(group.label);
	}

	protected toggleSubgroup(
		group: NavigationTreeGroup,
		subgroup: NavigationTreeSubgroup
	) {
		this.subgroupToggle.emit({
			groupLabel: group.label,
			subgroupLabel: subgroup.label
		});
	}

	private subgroupKey(groupLabel: string, subgroupLabel: string) {
		return `${groupLabel}::${subgroupLabel}`;
	}
}
