import {
	CombatActionDefenseConfig,
	CombatDefenseOption,
	DefenseMode,
	ParrySkillGroup
} from './combat-action-check.types';
import { JsonObject, JsonValue } from './json.types';

export type CombatActionCheckErrorCode = 'defense_option_unavailable';

export interface CombatActionCheckFailure {
	ok: false;
	error: {
		code: CombatActionCheckErrorCode;
		message: string;
	};
}

export interface CombatActionCheckSuccess<T> {
	ok: true;
	value: T;
}

export type CombatActionCheckResult<T> =
	| CombatActionCheckSuccess<T>
	| CombatActionCheckFailure;

export class CombatActionCheckEngine {
	resolveSelectedDefenseOption(params: {
		options: CombatDefenseOption[];
		mode: DefenseMode;
		skillSlug?: string | null;
	}): CombatActionCheckResult<CombatDefenseOption> {
		const option =
			params.options.find(
				item =>
					item.mode === params.mode &&
					(params.mode === 'none' ||
						!params.skillSlug ||
						item.skillSlug === params.skillSlug)
			) ?? null;

		if (!option) {
			return {
				ok: false,
				error: {
					code: 'defense_option_unavailable',
					message: 'Выбранный способ защиты недоступен.'
				}
			};
		}

		return { ok: true, value: option };
	}

	findAttackProfile(
		attackProfiles: JsonValue[],
		profileName: string | null
	): JsonObject | null {
		const profile = attackProfiles.find(
			item =>
				this.isJsonObject(item) &&
				(this.readString(item, 'name') === profileName ||
					this.readString(item, 'kind') === 'melee')
		);

		return this.isJsonObject(profile) ? profile : null;
	}

	readDefense(value: JsonValue | undefined): CombatActionDefenseConfig | null {
		if (!this.isJsonObject(value)) {
			return null;
		}

		const type = this.readString(value, 'type');

		if (type !== 'target_physical_defense') {
			return {
				type: 'none',
				canDodge: false,
				canParry: false,
				parrySkillGroups: []
			};
		}

		const canParry = this.readBoolean(value, 'canParry') ?? false;

		return {
			type,
			canDodge: this.readBoolean(value, 'canDodge') ?? false,
			canParry,
			parrySkillGroups: canParry
				? this.readParrySkillGroups(value['parrySkillGroups'])
				: []
		};
	}

	private readParrySkillGroups(
		value: JsonValue | undefined
	): ParrySkillGroup[] {
		if (!Array.isArray(value)) {
			return [];
		}

		return value.filter(
			(item): item is ParrySkillGroup =>
				item === 'unarmed' || item === 'melee_weapon' || item === 'shield'
		);
	}

	private isJsonObject(value: JsonValue | undefined): value is JsonObject {
		return !!value && typeof value === 'object' && !Array.isArray(value);
	}

	private readString(value: JsonObject, key: string): string | null {
		const rawValue = value[key];
		return typeof rawValue === 'string' ? rawValue : null;
	}

	private readBoolean(value: JsonObject, key: string): boolean | null {
		const rawValue = value[key];
		return typeof rawValue === 'boolean' ? rawValue : null;
	}
}
