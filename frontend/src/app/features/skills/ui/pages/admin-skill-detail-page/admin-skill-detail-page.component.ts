import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Fluid } from 'primeng/fluid';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { SystemValueCalculationDefinition } from '../../../../values/domain/system-value-calculation.models';
import { SystemValueCalculationEditorComponent } from '../../../../values/ui/components/system-value-calculation-editor/system-value-calculation-editor.component';
import { AdminSkillDetailFacade } from '../../../state/admin-skill-detail.facade';
import { AdminSkillDetailStore } from '../../../state/admin-skill-detail.store';

@Component({
	selector: 'app-admin-skill-detail-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		Breadcrumb,
		Button,
		Fluid,
		InputNumber,
		InputText,
		Select,
		Tab,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
		Textarea,
		ToggleSwitch,
		SystemValueCalculationEditorComponent
	],
	templateUrl: './admin-skill-detail-page.component.html',
	styleUrl: './admin-skill-detail-page.component.scss',
	providers: [AdminSkillDetailStore, AdminSkillDetailFacade]
})
export class AdminSkillDetailPageComponent {
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly facade = inject(AdminSkillDetailFacade);

	protected readonly activeTab = this.facade.activeTab;
	protected readonly skillForm = this.facade.form;
	protected readonly loading = this.facade.loading;
	protected readonly saving = this.facade.saving;
	protected readonly errorMessage = this.facade.errorMessage;
	protected readonly skill = this.facade.skill;
	protected readonly categoryOptions = this.facade.categoryOptions;
	protected readonly availableValues = this.facade.availableValues;
	protected readonly skillSystemValueCalculation =
		this.facade.systemValueCalculation;
	protected readonly canEditCalculation = this.facade.canEditCalculation;
	protected readonly breadcrumbs = computed(() => [
		{ label: 'Правила системы', routerLink: '/admin/rules/skills' },
		{ label: 'Навыки', routerLink: '/admin/rules/skills' },
		{ label: this.skill()?.name ?? 'Навык' }
	]);

	constructor() {
		effect(() => {
			const skillId = this.route.snapshot.paramMap.get('skillId');

			if (!skillId) {
				void this.router.navigate(['/admin/rules/skills']);
				return;
			}

			if (!this.loading() && !this.errorMessage() && !this.skill()) {
				void this.router.navigate(['/admin/rules/skills']);
				return;
			}
		});

		const skillId = this.route.snapshot.paramMap.get('skillId');
		if (skillId) {
			this.facade.initialize(skillId);
		}
	}

	protected saveSkill() {
		this.facade.save();
	}

	protected cancelSkill() {
		this.facade.cancel();
	}

	protected isSkillSaveDisabled() {
		return this.facade.isSaveDisabled();
	}

	protected updateSkillSystemValueCalculation(
		next: SystemValueCalculationDefinition
	) {
		this.facade.updateSystemValueCalculation(next);
	}

	protected setActiveTab(value: string | number | undefined) {
		this.facade.setActiveTab(value);
	}
}
