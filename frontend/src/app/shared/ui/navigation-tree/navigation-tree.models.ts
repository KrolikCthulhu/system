export interface NavigationTreeItem {
	id: string;
	label: string;
}

export interface NavigationTreeSubgroup {
	label: string;
	items: NavigationTreeItem[];
}

export interface NavigationTreeGroup {
	label: string;
	count: number;
	subgroups: NavigationTreeSubgroup[];
	items: NavigationTreeItem[];
}
