import {
	SpellRuntimeEffect,
	SpellRuntimePreview,
	SpellRuntimeTraceEntry
} from '../../../../domain/spell.models';
import { Skill } from '../../../../../skills/domain/skills.models';
import {
	RuntimeTraceRow,
	TagSeverity
} from '../models/spell-detail-page.types';

export function runtimeValueLabel(value: unknown, skills: Skill[]) {
	if (value === 'caster') {
		return 'Кастер';
	}

	if (value === 'spellTarget') {
		return 'Цель заклинания';
	}

	if (typeof value === 'string') {
		return skills.find(skill => skill.id === value)?.name ?? value;
	}

	if (typeof value === 'number') {
		return `${value}`;
	}

	if (typeof value === 'boolean') {
		return value ? 'Да' : 'Нет';
	}

	return 'Не выбрано';
}

export function runtimePreviewStatusLabel(
	status: SpellRuntimePreview['status']
) {
	switch (status) {
		case 'BLOCKED':
			return 'Недоступно';
		case 'COMPLETED':
			return 'Выполнено';
		case 'WAITING_FOR_CHOICE':
			return 'Ожидает выбор';
		case 'WAITING_FOR_ROLLS':
			return 'Ожидает броски';
	}
}

export function runtimePreviewStatusSeverity(
	status: SpellRuntimePreview['status']
): TagSeverity {
	switch (status) {
		case 'BLOCKED':
			return 'danger';
		case 'COMPLETED':
			return 'success';
		case 'WAITING_FOR_CHOICE':
		case 'WAITING_FOR_ROLLS':
			return 'warn';
	}
}

export function runtimeEffectTitle(effect: SpellRuntimeEffect) {
	switch (effect.kind) {
		case 'valueChange':
			return 'Изменение значения';
		case 'conditionAdd':
			return 'Наложение состояния';
		case 'conditionRemove':
			return 'Снятие состояния';
		case 'text':
			return 'Текст';
	}
}

export function runtimeEffectText(effect: SpellRuntimeEffect) {
	if (effect.kind === 'valueChange') {
		const valueName =
			effect.systemValueName ?? effect.systemValueId ?? 'значение';
		const operation =
			effect.operation === 'increase'
				? '+'
				: effect.operation === 'decrease'
					? '-'
					: '=';

		return `${valueName}: ${operation}${effect.amount ?? 0}`;
	}

	if (effect.kind === 'conditionAdd') {
		return `Состояние ${effect.conditionId ?? 'не выбрано'}, длительность ${effect.duration ?? 'не задана'}`;
	}

	if (effect.kind === 'conditionRemove') {
		return `Состояние ${effect.conditionId ?? 'не выбрано'}`;
	}

	return effect.text ?? '';
}

export function runtimeTraceSeverity(trace: RuntimeTraceRow): TagSeverity {
	return trace.status === 'pending' ? 'warn' : 'success';
}

export function flattenRuntimeTrace(
	trace: SpellRuntimeTraceEntry[],
	depth = 0
): RuntimeTraceRow[] {
	return trace.flatMap(entry => [
		{ ...entry, depth },
		...flattenRuntimeTrace(entry.children, depth + 1)
	]);
}
