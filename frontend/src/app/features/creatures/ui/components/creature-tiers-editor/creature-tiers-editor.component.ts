import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import {
	CreatureArmorPresetOption,
	CreatureCharacteristicOption,
	CreatureCombatIntentOption,
	CreatureConditionOption,
	CreatureDamageTypeOption,
	CreatureNaturalAttackOption,
	CreatureSizeOption,
	CreatureSkillOption,
	CreatureTargetSelectionScoringRule,
	CreatureTierAction,
	CreatureTierAttackOverride
} from '../../../domain/creatures.models';
import {
	CreatureTierAttackProfileOption,
	CreatureTierDraft,
	SelectOption
} from '../../pages/admin-creatures-page/admin-creature-editor.models';
import { CreatureTierActionsEditorComponent } from '../creature-tier-actions-editor/creature-tier-actions-editor.component';
import { CreatureTierAttackOverridesEditorComponent } from '../creature-tier-attack-overrides-editor/creature-tier-attack-overrides-editor.component';
import { CreatureTierCharacteristicsEditorComponent } from '../creature-tier-characteristics-editor/creature-tier-characteristics-editor.component';
import { CreatureTierMainEditorComponent } from '../creature-tier-main-editor/creature-tier-main-editor.component';
import { CreatureTierSkillsEditorComponent } from '../creature-tier-skills-editor/creature-tier-skills-editor.component';
import { CreatureTierTargetSelectionEditorComponent } from '../creature-tier-target-selection-editor/creature-tier-target-selection-editor.component';
import { Button } from 'primeng/button';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Tag } from 'primeng/tag';

@Component({
	selector: 'app-creature-tiers-editor',
	standalone: true,
	imports: [
		CommonModule,
		Button,
		Tab,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
		Tag,
		CreatureTierActionsEditorComponent,
		CreatureTierAttackOverridesEditorComponent,
		CreatureTierCharacteristicsEditorComponent,
		CreatureTierMainEditorComponent,
		CreatureTierSkillsEditorComponent,
		CreatureTierTargetSelectionEditorComponent
	],
	templateUrl: './creature-tiers-editor.component.html',
	styleUrl:
		'../../pages/admin-creatures-page/admin-creatures-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatureTiersEditorComponent {
	readonly tiers = input.required<CreatureTierDraft[]>();
	readonly selectedTierTab = input.required<string>();
	readonly selectedTierSectionTab = input.required<string>();
	readonly creatureSizes = input.required<CreatureSizeOption[]>();
	readonly armorPresets = input.required<CreatureArmorPresetOption[]>();
	readonly targetRuleOptions = input.required<SelectOption<string>[]>();
	readonly attackProfileOptions =
		input.required<CreatureTierAttackProfileOption[]>();
	readonly effectiveActionsByTier =
		input.required<Map<number, CreatureTierAction[]>>();
	readonly naturalAttacks = input.required<CreatureNaturalAttackOption[]>();
	readonly combatIntents = input.required<CreatureCombatIntentOption[]>();
	readonly damageTypes = input.required<CreatureDamageTypeOption[]>();
	readonly conditions = input.required<CreatureConditionOption[]>();
	readonly skills = input.required<CreatureSkillOption[]>();
	readonly characteristics = input.required<CreatureCharacteristicOption[]>();
	readonly characteristicsById =
		input.required<Map<string, CreatureCharacteristicOption>>();
	readonly skillOptionsByKey =
		input.required<
			Map<string, { label: string; items: CreatureSkillOption[] }[]>
		>();
	readonly armorSummaryById = input.required<Map<string | null, string>>();
	readonly sizeNameById = input.required<Map<string | null, string>>();

	readonly addTier = output<void>();
	readonly removeTier = output<number>();
	readonly selectedTierTabChange = output<string | number | undefined>();
	readonly selectedTierSectionTabChange = output<string | number | undefined>();
	readonly tierNameChange = output<{ tier: number; name: string }>();
	readonly tierHpChange = output<{ tier: number; hp: number | null }>();
	readonly tierSizeChange = output<{ tier: number; sizeId: string | null }>();
	readonly tierArmorChange = output<{
		tier: number;
		armorPresetId: string | null;
	}>();
	readonly addTargetRule = output<number>();
	readonly targetRuleKeyChange = output<{
		tier: number;
		index: number;
		key: string | null;
	}>();
	readonly targetRuleChange = output<{
		tier: number;
		index: number;
		patch: Partial<CreatureTargetSelectionScoringRule>;
	}>();
	readonly removeTargetRule = output<{ tier: number; index: number }>();
	readonly addAttackOverride = output<number>();
	readonly attackOverrideProfileChange = output<{
		tier: number;
		index: number;
		key: string;
	}>();
	readonly attackOverrideChange = output<{
		tier: number;
		index: number;
		patch: Partial<CreatureTierAttackOverride>;
	}>();
	readonly removeAttackOverride = output<{ tier: number; index: number }>();
	readonly tierActionsChange = output<{
		tier: CreatureTierDraft;
		actions: CreatureTierAction[];
	}>();
	readonly characteristicChange = output<{
		tier: number;
		characteristicId: string;
		value: number | null;
	}>();
	readonly addSkill = output<number>();
	readonly skillChange = output<{
		tier: number;
		index: number;
		skillId: string;
	}>();
	readonly skillLevelChange = output<{
		tier: number;
		index: number;
		level: number | null;
	}>();
	readonly removeSkill = output<{ tier: number; index: number }>();

	protected tierTabValue(tier: number): string {
		return String(tier);
	}

	protected effectiveActions(tier: CreatureTierDraft): CreatureTierAction[] {
		return this.effectiveActionsByTier().get(tier.tier) ?? tier.actions;
	}

	protected armorSummary(armorPresetId: string | null): string {
		return this.armorSummaryById().get(armorPresetId) ?? 'Без брони';
	}

	protected sizeName(sizeId: string | null): string {
		return this.sizeNameById().get(sizeId) ?? 'размер не выбран';
	}
}
