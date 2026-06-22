import {
	SpellMechanic,
	SpellMechanicParameterKind
} from '../../../../spell-mechanics/domain/spell-mechanics.models';
import type { SpellMechanicApplicationConfig } from '../../../domain/spell.models';

type MechanicTextTemplateSegment =
	| { kind: 'text'; text: string }
	| { kind: 'parameter'; parameterId?: string; parameterSlug?: string }
	| { kind: 'actionResult'; actionId: string; resultName: string }
	| { kind: 'applicationText' };

export function renderMechanicTextTemplate<TValue>(
	template: string,
	mechanic: SpellMechanic,
	values: Record<string, TValue>,
	application: SpellMechanicApplicationConfig | null,
	formatValue: (value: {
		parameter: SpellMechanic['parameters'][number];
		kind: SpellMechanicParameterKind;
		value: TValue | string;
	}) => string
) {
	const document = parseMechanicTextTemplate(template);

	return document
		.map(segment => {
			if (segment.kind === 'text') {
				return segment.text;
			}

			if (segment.kind === 'parameter') {
				const parameter = mechanic.parameters.find(
					item =>
						item.id === segment.parameterId ||
						item.slug === segment.parameterSlug
				);

				if (!parameter) {
					return '[Параметр не найден]';
				}

				return formatValue({
					parameter,
					kind: parameter.kind,
					value: values[parameter.slug] ?? parameter.defaultValue.value
				});
			}

			if (segment.kind === 'applicationText') {
				return application ? renderApplicationText(application) : '[Применение]';
			}

			return `[${segment.resultName}]`;
		})
		.join('');
}

export function renderApplicationText(config: SpellMechanicApplicationConfig) {
	const parts: string[] = [];

	if (config.visibilityRequired) {
		parts.push('цель должна быть видимой');
	}

	if (config.lineOfEffectRequired) {
		parts.push('путь эффекта не должен быть перекрыт');
	}

	if (!parts.length) {
		return 'без дополнительных ограничений применения';
	}

	return parts.join(', а ');
}

function parseMechanicTextTemplate(template: string): MechanicTextTemplateSegment[] {
	if (!template.trim()) {
		return [];
	}

	try {
		const parsed: unknown = JSON.parse(template);

		if (
			isRecord(parsed) &&
			Array.isArray(parsed['segments']) &&
			parsed['segments'].every(isMechanicTextTemplateSegment)
		) {
			return parsed['segments'];
		}
	} catch {
		return [{ kind: 'text', text: template }];
	}

	return [{ kind: 'text', text: template }];
}

function isMechanicTextTemplateSegment(
	value: unknown
): value is MechanicTextTemplateSegment {
	if (!isRecord(value) || typeof value['kind'] !== 'string') {
		return false;
	}

	if (value['kind'] === 'text') {
		return typeof value['text'] === 'string';
	}

	if (value['kind'] === 'parameter') {
		return (
			typeof value['parameterId'] === 'string' ||
			typeof value['parameterSlug'] === 'string'
		);
	}

	if (value['kind'] === 'actionResult') {
		return (
			typeof value['actionId'] === 'string' &&
			typeof value['resultName'] === 'string'
		);
	}

	if (value['kind'] === 'applicationText') {
		return true;
	}

	return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
