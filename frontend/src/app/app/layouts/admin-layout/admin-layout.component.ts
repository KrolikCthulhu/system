import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { PanelMenu } from 'primeng/panelmenu';

@Component({
	selector: 'app-admin-layout',
	imports: [PanelMenu, RouterOutlet],
	templateUrl: './admin-layout.component.html',
	styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
	protected readonly navigationItems: MenuItem[] = [
		{
			label: 'Правила системы',
			icon: 'pi pi-book',
			expanded: true,
			items: [
				{
					label: 'Навыки',
					icon: 'pi pi-sparkles',
					routerLink: '/admin/rules/skills'
				}
			]
		}
	];
}
