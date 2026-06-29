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
			label: 'Персонаж',
			expanded: true,
			items: [
				{
					label: 'Атрибуты и характеристики',
					routerLink: '/admin/rules/attributes'
				},
				{
					label: 'Навыки',
					routerLink: '/admin/rules/skills'
				},
				{
					label: 'Значения',
					routerLink: '/admin/rules/values'
				}
			]
		},
		{
			label: 'Броски и события',
			expanded: true,
			items: [
				{
					label: 'Последствия броска',
					routerLink: '/admin/rules/roll-consequences'
				},
				{
					label: 'События',
					routerLink: '/admin/rules/events'
				}
			]
		},
		{
			label: 'Эффекты',
			expanded: true,
			items: [
				{
					label: 'Типы урона',
					routerLink: '/admin/rules/damage-types'
				},
				{
					label: 'Состояния',
					routerLink: '/admin/rules/conditions'
				},
				{
					label: 'Пресеты брони',
					routerLink: '/admin/rules/armor-presets'
				}
			]
		},
		{
			label: 'Магия',
			expanded: true,
			items: [
				{
					label: 'Слова магии',
					routerLink: '/admin/rules/magic-words'
				},
				{
					label: 'Механики',
					routerLink: '/admin/rules/spell-mechanics'
				},
				{
					label: 'Прогрессии',
					routerLink: '/admin/rules/progression-presets'
				},
				{
					label: 'Заклинания',
					routerLink: '/admin/rules/spells'
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
