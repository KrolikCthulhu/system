import { Component, effect, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';

@Component({
	selector: 'app-navigation-sidebar',
	imports: [RouterLink, RouterLinkActive],
	templateUrl: './navigation-sidebar.component.html',
	styleUrl: './navigation-sidebar.component.scss'
})
export class NavigationSidebarComponent {
	readonly eyebrow = input<string>('');
	readonly title = input.required<string>();
	readonly navigationItems = input.required<MenuItem[]>();

	protected readonly expandedIndexes = signal<Record<number, boolean>>({});

	constructor() {
		effect(() => {
			const nextState: Record<number, boolean> = {};

			this.navigationItems().forEach((item, index) => {
				nextState[index] = item.expanded ?? false;
			});

			this.expandedIndexes.set(nextState);
		});
	}

	protected toggleSection(index: number) {
		this.expandedIndexes.update(current => ({
			...current,
			[index]: !current[index]
		}));
	}

	protected isExpanded(index: number): boolean {
		return this.expandedIndexes()[index] ?? false;
	}
}
