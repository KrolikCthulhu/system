import {
	SpellMechanic,
	SpellMechanicParameterKind
} from '../../../../spell-mechanics/domain/spell-mechanics.models';

type MechanicTextTemplateSegment =
	| { kind: 'text'; text: string }
	| { kind: 'parameter'; parameterId: string }
	| { kind: 'actionResult'; actionId: string; resultName: string };

export function renderMechanicTextTemplate<TValue>(
	template: string,
	mechanic: SpellMechanic,
	values: Record<string, TValue>,
	formatValue: (value: {
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
					item => item.id === segment.parameterId
				);

				if (!parameter) {
					return '[Параметр не найден]';
				}

				return formatValue({
					kind: parameter.kind,
					value: values[parameter.slug] ?? parameter.defaultValue.value
				});
			}

			return `[${segment.resultName}]`;
		})
		.join('');
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
		return typeof value['parameterId'] === 'string';
	}

	if (value['kind'] === 'actionResult') {
		return (
			typeof value['actionId'] === 'string' &&
			typeof value['resultName'] === 'string'
		);
	}

	return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
