import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { NavigationSidebarComponent } from '../../../shared/ui/navigation-sidebar/navigation-sidebar.component';

@Component({
	selector: 'app-admin-layout',
	imports: [NavigationSidebarComponent, RouterOutlet],
	templateUrl: './admin-layout.component.html',
	styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
	protected readonly navigationItems: MenuItem[] = [
		{
			label: 'Правила системы',
			expanded: true,
			items: [
				{
					label: 'Навыки',
					routerLink: '/admin/rules/skills'
				},
				{
					label: 'Атрибуты и характеристики',
					routerLink: '/admin/rules/attributes'
				},
				{
					label: 'Последствия броска',
					routerLink: '/admin/rules/roll-consequences'
				},
				{
					label: 'Значения',
					routerLink: '/admin/rules/values'
				},
				{
					label: 'События',
					routerLink: '/admin/rules/events'
				}
			]
		},
		{
			label: 'Песочница',
			expanded: true,
			items: [
				{
					label: 'Лист персонажа',
					routerLink: '/admin/sandbox/character-sheet'
				}
			]
		}
	];
}
