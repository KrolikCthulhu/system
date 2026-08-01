import { computed, inject, Injectable } from '@angular/core';
import { SkillLevel } from '../../../../../skills/domain/skills.models';
import {
	SpellRuntimePendingChoice,
	SpellRuntimePendingRoll
} from '../../../../domain/spell.models';
import { RuntimeRollDraft } from '../models/spell-detail-page.types';
import {
	SpellRuntimePreviewDrawerActions,
	SpellRuntimePreviewDrawerRenderers,
	SpellRuntimePreviewDrawerViewModel
} from '../runtime/preview-drawer/spell-runtime-preview-drawer.component';
import {
	flattenRuntimeTrace,
	runtimeEffectText,
	runtimeEffectTitle,
	runtimePreviewStatusLabel,
	runtimePreviewStatusSeverity,
	runtimeTraceSeverity,
	runtimeValueLabel
} from '../runtime/spell-runtime-preview.view-model';
import { AdminSpellDetailPageStore } from '../state/admin-spell-detail-page.store';

@Injectable()
export class SpellRuntimePreviewFacade {
	private readonly store = inject(AdminSpellDetailPageStore);

	readonly drawerViewModel = computed<SpellRuntimePreviewDrawerViewModel>(
		() => ({
			visible: this.store.runtimePreviewVisible(),
			loading: this.store.runtimePreviewLoading(),
			error: this.store.runtimePreviewError(),
			preview: this.store.runtimePreview(),
			skillLevelOptions: this.skillLevelOptions()
		})
	);
	readonly drawerRenderers: SpellRuntimePreviewDrawerRenderers = {
		rollKey: roll => this.store.runtimeRollKey(roll),
		choiceKey: choice => this.store.runtimeChoiceKey(choice),
		rollDraft: roll => this.runtimeRollDraft(roll),
		valueLabel: value => runtimeValueLabel(value, this.store.skills()),
		statusLabel: status => runtimePreviewStatusLabel(status),
		statusSeverity: status => runtimePreviewStatusSeverity(status),
		effectTitle: effect => runtimeEffectTitle(effect),
		effectText: effect => runtimeEffectText(effect),
		traceSeverity: trace => runtimeTraceSeverity(trace),
		traceRows: trace => flattenRuntimeTrace(trace)
	};
	readonly drawerActions: SpellRuntimePreviewDrawerActions = {
		setVisible: visible => this.setRuntimePreviewVisible(visible),
		rerun: () => this.runRuntimePreview(),
		updateRollDiceCount: (roll, diceCount) =>
			this.updateRuntimeRollDiceCount(roll, diceCount),
		updateRollSkillLevel: (roll, skillLevel) =>
			this.updateRuntimeRollSkillLevel(roll, skillLevel),
		submitRoll: roll => this.rollRuntimePendingRoll(roll),
		selectChoice: (choice, optionId) =>
			this.chooseRuntimePendingChoice(choice, optionId)
	};

	setRuntimePreviewVisible(visible: boolean) {
		this.store.setRuntimePreviewVisible(visible);
	}

	runRuntimePreview(resetRolls = true) {
		this.store.runRuntimePreview({
			resetRolls,
			hasChanges: this.store.hasChanges(),
			defaultSkillLevel: this.defaultRuntimeSkillLevel()
		});
	}

	runtimeRollDraft(roll: SpellRuntimePendingRoll): RuntimeRollDraft {
		return this.store.runtimeRollDraft(roll, this.defaultRuntimeSkillLevel());
	}

	updateRuntimeRollDiceCount(
		roll: SpellRuntimePendingRoll,
		diceCount: number | null
	) {
		this.store.updateRuntimeRollDiceCount(
			roll,
			diceCount,
			this.defaultRuntimeSkillLevel()
		);
	}

	updateRuntimeRollSkillLevel(
		roll: SpellRuntimePendingRoll,
		skillLevel: number | null
	) {
		this.store.updateRuntimeRollSkillLevel(
			roll,
			skillLevel,
			this.defaultRuntimeSkillLevel()
		);
	}

	rollRuntimePendingRoll(roll: SpellRuntimePendingRoll) {
		const draft = this.runtimeRollDraft(roll);
		const dice = Array.from({ length: draft.diceCount }, () => randomD6());
		const successes = countRuntimeSuccesses(
			dice,
			this.store.skillLevels(),
			draft.skillLevel
		);

		this.store.submitRuntimeRoll({
			roll,
			dice,
			successes,
			hasChanges: this.store.hasChanges(),
			defaultSkillLevel: this.defaultRuntimeSkillLevel()
		});
	}

	chooseRuntimePendingChoice(
		choice: SpellRuntimePendingChoice,
		optionId: string
	) {
		this.store.chooseRuntimePendingChoice({
			choice,
			optionId,
			hasChanges: this.store.hasChanges(),
			defaultSkillLevel: this.defaultRuntimeSkillLevel()
		});
	}

	private skillLevelOptions() {
		return this.store
			.skillLevels()
			.filter(level => level.isActive)
			.sort((left, right) => left.level - right.level)
			.map(level => ({
				label: `${level.level} - ${level.name}`,
				value: level.level
			}));
	}

	private defaultRuntimeSkillLevel() {
		return (
			this.store
				.skillLevels()
				.filter(level => level.isActive && level.canRoll)
				.sort((left, right) => left.level - right.level)[0]?.level ?? 0
		);
	}
}

function randomD6() {
	return Math.floor(Math.random() * 6) + 1;
}

function countRuntimeSuccesses(
	dice: number[],
	levels: SkillLevel[],
	skillLevel: number
) {
	const rule = levels.find(level => level.level === skillLevel);

	if (!rule?.canRoll || rule.successMin === null) {
		return 0;
	}

	const successMin = rule.successMin;
	const doubleSuccessMin = rule.doubleSuccessMin;

	return dice.reduce((total, die) => {
		const normalSuccess = die >= successMin ? 1 : 0;
		const doubleSuccess =
			doubleSuccessMin !== null && die >= doubleSuccessMin ? 1 : 0;

		return total + normalSuccess + doubleSuccess;
	}, 0);
}
