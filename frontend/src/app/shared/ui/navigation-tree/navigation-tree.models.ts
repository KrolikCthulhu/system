export interface NavigationTreeItem {
	id: string;
	label: string;
}

export interface NavigationTreeSubgroup {
	id?: string;
	label: string;
	items: NavigationTreeItem[];
}

export interface NavigationTreeGroup {
	id?: string;
	label: string;
	count: number;
	subgroups: NavigationTreeSubgroup[];
	items: NavigationTreeItem[];
}
