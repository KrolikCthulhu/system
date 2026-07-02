export interface SpellMechanicCategory {
	id: string;
	slug: string;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface SpellMechanic {
	id: string;
	categoryId: string;
	slug: string;
	name: string;
	description: string;
	configSchema: SpellMechanicConfigSchema;
	textTemplate: string;
	parameters: SpellMechanicParameter[];
	actions: SpellMechanicAction[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface SpellMechanicsCatalog {
	categories: SpellMechanicCategory[];
	mechanics: SpellMechanic[];
}

export type SpellMechanicParameterKind =
	| 'target'
	| 'skill'
	| 'number'
	| 'formula'
	| 'damageType'
	| 'condition'
	| 'systemValue'
	| 'text';

export type SpellMechanicNumericRole =
	| 'damage'
	| 'range'
	| 'duration'
	| 'area'
	| 'targetCount'
	| 'custom';

export type SpellMechanicParameterScope =
	| 'caster'
	| 'target'
	| 'spell'
	| 'effect'
	| 'environment';

export interface SpellMechanicParameter {
	id: string;
	mechanicId: string;
	slug: string;
	name: string;
	kind: SpellMechanicParameterKind;
	numericRole: SpellMechanicNumericRole;
	scope: SpellMechanicParameterScope;
	required: boolean;
	configuredBySpell: boolean;
	overrideAllowed: boolean;
	defaultValue: SpellMechanicParameterDefaultValue;
	defaultTargetConfig: SpellMechanicTargetConfig | null;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export type SpellMechanicTargetSource = 'caster' | 'selected' | 'area';
export type SpellMechanicTargetRelation = 'self' | 'any' | 'enemy' | 'ally';
export type SpellMechanicTargetCountMode = 'one' | 'all' | 'upTo' | 'exact';
export type SpellMechanicTargetCountValueMode =
	| 'fixed'
	| 'formula'
	| 'parameter';

export interface SpellMechanicTargetConfig {
	name: string;
	source: SpellMechanicTargetSource;
	relation: SpellMechanicTargetRelation;
	countMode: SpellMechanicTargetCountMode;
	countValueMode: SpellMechanicTargetCountValueMode;
	countValue: number;
	countFormula: string;
	targetCountParameterId: string;
	isRequired: boolean;
}

export type SpellMechanicParameterDefaultValueMode =
	| 'empty'
	| 'static'
	| 'fromMagicWord';

export interface SpellMechanicParameterDefaultValue {
	mode: SpellMechanicParameterDefaultValueMode;
	value: string;
}

export type SpellMechanicParameterCommand = Omit<
	SpellMechanicParameter,
	'slug' | 'mechanicId' | 'createdAt' | 'updatedAt'
>;

export type SpellMechanicActionKind =
	| 'roll'
	| 'check'
	| 'comparison'
	| 'calculation'
	| 'branch'
	| 'effectScale'
	| 'valueChange'
	| 'conditionAdd'
	| 'conditionRemove'
	| 'text'
	| 'custom';

export interface SpellMechanicAction {
	id: string;
	mechanicId: string;
	name: string;
	kind: SpellMechanicActionKind;
	config: SpellMechanicConfigSchema;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export type SpellMechanicActionCommand = Omit<
	SpellMechanicAction,
	'mechanicId' | 'createdAt' | 'updatedAt'
>;

export type SpellMechanicConfigSchema = Record<string, unknown>;
