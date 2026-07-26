import { Condition } from './conditions.models';
import {
	ConditionEffect,
	ConditionParameter,
	ConditionRuleTemplateValue,
	ConditionRemovalMethod,
	ConditionTextToken
} from './condition-rules.models';

export interface ConditionInstanceTextContext {
	ownerName?: string;
	currentLevel?: number;
	remainingDuration?: string;
	parameters?: Record<
		string,
		string | number | boolean | ConditionRuleTemplateValue | null | undefined
	>;
	sourceName?: string;
	targetName?: string;
	bodyPartName?: string;
	holdingPartName?: string;
	maxDistanceMeters?: number;
	movementRule?: string;
	escapeMode?: 'opposed_check' | 'fixed_difficulty';
	escapeCostPotential?: number;
	escapeDifficulty?: number;
	escapeRule?: string;
}

export function renderConditionInstanceText(
	condition: Condition,
	context: ConditionInstanceTextContext = {}
) {
	const text = condition.textBlocks
		.filter(block => block.isActive)
		.sort((first, second) => first.sortOrder - second.sortOrder)
		.map(block =>
			block.kind === 'text'
				? block.text
				: renderConditionInstanceToken(condition, context, block.token)
		)
		.join('')
		.replace(/[ \t]+/g, ' ')
		.replace(/ *\n */g, '\n')
		.trim();

	return text || condition.description || condition.name;
}

function renderConditionInstanceToken(
	condition: Condition,
	context: ConditionInstanceTextContext,
	token: ConditionTextToken
) {
	if (token.startsWith('parameter:')) {
		const key = token.slice('parameter:'.length);
		const parameter = condition.parameters.find(item => item.key === key);
		const value = context.parameters?.[key];

		if (value !== undefined && value !== null && value !== '') {
			return parameter ? formatParameterValue(parameter, value) : String(value);
		}

		const defaultValue = parameter?.defaultValue;

		if (defaultValue !== undefined && defaultValue !== '') {
			return parameter
				? formatParameterValue(parameter, defaultValue)
				: String(defaultValue);
		}

		return parameter ? `{${parameter.label}}` : `{${key}}`;
	}

	switch (token) {
		case 'conditionName':
			return condition.name;
		case 'ownerName':
			return context.ownerName ?? 'существо';
		case 'description':
			return condition.description || 'Описание не заполнено.';
		case 'duration':
			return conditionDurationText(condition.durationType);
		case 'currentLevel':
			return String(context.currentLevel ?? 1);
		case 'maxLevel':
			return String(condition.maxLevel);
		case 'remainingDuration':
			return context.remainingDuration ?? 'пока не указано';
		case 'removalMethods':
			return condition.removalMethods.map(removalMethodText).join(', ');
		case 'effects':
			return renderConditionInstanceEffects(condition.effects);
		case 'source':
			return context.sourceName ?? 'источник состояния';
		case 'targetName':
			return context.targetName ?? 'цель';
		case 'bodyPart':
			return context.bodyPartName ?? 'часть тела';
		case 'holdingPart':
			return context.holdingPartName ?? 'удерживающая часть';
		case 'maxDistanceMeters':
			return context.maxDistanceMeters === undefined
				? 'допустимая дистанция'
				: `${context.maxDistanceMeters} м`;
		case 'movementRule':
			return (
				context.movementRule ??
				'Перемещение цели определяется правилом этого захвата.'
			);
		case 'escapeMode':
			return escapeModeText(context.escapeMode);
		case 'escapeCostPotential':
			return context.escapeCostPotential === undefined
				? 'стоимость освобождения'
				: `${context.escapeCostPotential} Потенциала`;
		case 'escapeDifficulty':
			return context.escapeDifficulty === undefined
				? 'сложность освобождения'
				: String(context.escapeDifficulty);
		case 'escapeRule':
			return context.escapeRule ?? defaultEscapeRule(context);
	}

	return '';
}

function renderConditionInstanceEffects(effects: ConditionEffect[]) {
	if (!effects.length) {
		return 'Механические эффекты не настроены.';
	}

	return effects
		.sort((first, second) => first.sortOrder - second.sortOrder)
		.map(effect => {
			const text = effect.config['text'];
			return typeof text === 'string' && text.trim()
				? text.trim()
				: 'Действует особое правило состояния.';
		})
		.join('; ');
}

function formatParameterValue(
	parameter: ConditionParameter,
	value: string | number | boolean | ConditionRuleTemplateValue
) {
	if (parameter.type === 'distance') {
		const meters = typeof value === 'number' ? value : Number(value) || 0;
		return `${meters} м`;
	}

	if (parameter.type === 'boolean') {
		return value ? 'да' : 'нет';
	}

	if (parameter.type === 'rule_template') {
		return renderRuleTemplateValue(readRuleTemplateValue(value));
	}

	return String(value);
}

function readRuleTemplateValue(
	value: string | number | boolean | ConditionRuleTemplateValue
): ConditionRuleTemplateValue {
	return isRuleTemplateValue(value)
		? normalizeRuleTemplateValue(value)
		: createRuleTemplateValue();
}

function createRuleTemplateValue(): ConditionRuleTemplateValue {
	return {
		template: 'opposed_check',
		checkName: 'проверка освобождения',
		potentialCost: 1,
		difficulty: 1
	};
}

function isRuleTemplateValue(
	value: unknown
): value is ConditionRuleTemplateValue {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false;
	}

	const template = (value as Record<string, unknown>)['template'];
	return (
		template === 'opposed_check' ||
		template === 'fixed_difficulty' ||
		template === 'spend_potential' ||
		template === 'remove_source'
	);
}

function normalizeRuleTemplateValue(
	value: ConditionRuleTemplateValue
): ConditionRuleTemplateValue {
	return {
		template: value.template,
		checkName: value.checkName?.trim() || 'проверка освобождения',
		potentialCost: Math.max(0, Math.trunc(value.potentialCost ?? 0)),
		difficulty: Math.max(0, Math.trunc(value.difficulty ?? 0))
	};
}

function renderRuleTemplateValue(value: ConditionRuleTemplateValue): string {
	const rule = normalizeRuleTemplateValue(value);
	const costText = rule.potentialCost
		? `потратить ${rule.potentialCost} ${pluralizeRu(rule.potentialCost, 'Потенциал', 'Потенциала', 'Потенциала')} и `
		: '';
	const checkName = rule.checkName || 'проверку';

	switch (rule.template) {
		case 'opposed_check':
			return `Чтобы освободиться, нужно ${costText}выиграть встречную проверку: ${checkName}.`;
		case 'fixed_difficulty':
			return `Чтобы освободиться, нужно ${costText}пройти проверку: ${checkName}. Сложность: ${rule.difficulty}.`;
		case 'spend_potential':
			return rule.potentialCost
				? `Чтобы снять состояние, нужно потратить ${rule.potentialCost} ${pluralizeRu(rule.potentialCost, 'Потенциал', 'Потенциала', 'Потенциала')}.`
				: 'Чтобы снять состояние, нужно потратить Потенциал.';
		case 'remove_source':
			return 'Состояние снимается, когда источник устранён.';
	}
}

function defaultEscapeRule(context: ConditionInstanceTextContext) {
	const cost =
		context.escapeCostPotential === undefined
			? 'указанную стоимость'
			: `${context.escapeCostPotential} Потенциала`;

	if (context.escapeMode === 'fixed_difficulty') {
		const difficulty =
			context.escapeDifficulty === undefined
				? 'заданной сложности'
				: `сложности ${context.escapeDifficulty}`;

		return `Чтобы освободиться, нужно потратить ${cost} и пройти проверку против ${difficulty}.`;
	}

	return `Чтобы освободиться, нужно потратить ${cost} и выиграть встречную проверку.`;
}

function escapeModeText(
	escapeMode: ConditionInstanceTextContext['escapeMode']
) {
	if (escapeMode === 'fixed_difficulty') {
		return 'фиксированная сложность';
	}

	return 'встречная проверка';
}

function removalMethodText(method: ConditionRemovalMethod) {
	switch (method) {
		case 'automatic':
			return 'автоматически';
		case 'spend_potential':
			return 'потратить Потенциал';
		case 'successful_check':
			return 'успешная проверка';
		case 'healing':
			return 'лечение';
		case 'rest':
			return 'отдых';
		case 'remove_source':
			return 'устранить источник';
	}
}

function conditionDurationText(durationType: Condition['durationType']) {
	switch (durationType) {
		case 'until_owner_next_activation':
			return 'до следующей активации владельца';
		case 'until_next_round_start':
			return 'до начала следующего раунда';
		case 'round_count':
			return 'количество раундов';
		case 'game_time':
			return 'игровое время';
		case 'until_short_rest':
			return 'до короткого отдыха';
		case 'until_full_rest':
			return 'до полноценного отдыха';
		case 'until_healed':
			return 'до лечения';
		case 'until_removed':
			return 'пока не снято';
		case 'permanent':
			return 'постоянно';
	}
}

function pluralizeRu(value: number, one: string, few: string, many: string) {
	const lastTwo = value % 100;
	const last = value % 10;

	if (lastTwo >= 11 && lastTwo <= 14) {
		return many;
	}

	if (last === 1) {
		return one;
	}

	if (last >= 2 && last <= 4) {
		return few;
	}

	return many;
}
