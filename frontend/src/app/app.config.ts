import {
	ApplicationConfig,
	inject,
	provideAppInitializer,
	provideBrowserGlobalErrorListeners
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { provideArmorPresetsInfrastructure } from './features/armor-presets/data/provide-armor-presets-infrastructure';
import { provideAttributesInfrastructure } from './features/attributes/data/provide-attributes-infrastructure';
import { AuthFacade } from './features/auth/state/auth.facade';
import { appRoutes } from './app.routes';
import { authInterceptor } from './features/auth/data/auth.interceptor';
import { provideAuthInfrastructure } from './features/auth/data/provide-auth-infrastructure';
import { provideCharacterSheetInfrastructure } from './features/character-sheet/data/provide-character-sheet-infrastructure';
import { provideCombatIntentsInfrastructure } from './features/combat-intents/data/provide-combat-intents-infrastructure';
import { provideConditionsInfrastructure } from './features/conditions/data/provide-conditions-infrastructure';
import { provideCreatureTypesInfrastructure } from './features/creature-types/data/provide-creature-types-infrastructure';
import { provideCreaturesInfrastructure } from './features/creatures/data/provide-creatures-infrastructure';
import { provideDamageTypesInfrastructure } from './features/damage-types/data/provide-damage-types-infrastructure';
import { provideGameEventsInfrastructure } from './features/events/data/provide-game-events-infrastructure';
import { provideMagicWordsInfrastructure } from './features/magic/data/provide-magic-words-infrastructure';
import { provideProgressionPresetsInfrastructure } from './features/progression-presets/data/provide-progression-presets-infrastructure';
import { provideRollConsequencesInfrastructure } from './features/roll-consequences/data/provide-roll-consequences-infrastructure';
import { provideSkillsInfrastructure } from './features/skills/data/provide-skills-infrastructure';
import { provideSpellMechanicsInfrastructure } from './features/spell-mechanics/data/provide-spell-mechanics-infrastructure';
import { provideValuesInfrastructure } from './features/values/data/provide-values-infrastructure';
import { provideWeaponsInfrastructure } from './features/weapons/data/provide-weapons-infrastructure';

const appThemePreset = definePreset(Aura, {
	semantic: {
		primary: {
			50: '{stone.50}',
			100: '{stone.100}',
			200: '{stone.200}',
			300: '{stone.300}',
			400: '{stone.400}',
			500: '{stone.500}',
			600: '{stone.600}',
			700: '{stone.700}',
			800: '{stone.800}',
			900: '{stone.900}',
			950: '{stone.950}'
		}
	},
	components: {
		breadcrumb: {
			root: {
				padding: '1rem 1rem 0'
			}
		},
		tabs: {
			tab: {
				padding: '0.625rem 1.125rem'
			},
			tabpanel: {
				padding: '0.75rem 0 0'
			}
		},
		splitter: {
			root: {
				background: 'transparent',
				borderColor: 'transparent'
			},
			gutter: {
				background: '{content.border.color}'
			},
			handle: {
				size: '1px',
				background: '{content.border.color}',
				borderRadius: '0'
			}
		},
		inputtext: {
			root: {
				paddingY: '0.5rem'
			}
		},
		select: {
			root: {
				paddingY: '0.375rem',
				paddingX: '0.625rem'
			},
			list: {
				header: {
					padding: '0.375rem 0.5rem 0.25rem'
				}
			},
			option: {
				padding: '0.375rem 0.625rem'
			},
			optionGroup: {
				padding: '0.375rem 0.625rem 0.25rem'
			}
		},
		multiselect: {
			root: {
				paddingY: '0.375rem',
				paddingX: '0.625rem'
			},
			list: {
				header: {
					padding: '0.375rem 0.5rem 0.25rem'
				}
			},
			option: {
				padding: '0.375rem 0.625rem',
				gap: '0.5rem'
			},
			optionGroup: {
				padding: '0.375rem 0.625rem 0.25rem'
			}
		},
		textarea: {
			root: {
				paddingY: '0.5rem'
			}
		}
	}
});

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		...provideAuthInfrastructure(),
		...provideArmorPresetsInfrastructure(),
		...provideAttributesInfrastructure(),
		...provideCharacterSheetInfrastructure(),
		...provideCombatIntentsInfrastructure(),
		...provideConditionsInfrastructure(),
		...provideCreatureTypesInfrastructure(),
		...provideCreaturesInfrastructure(),
		...provideDamageTypesInfrastructure(),
		...provideGameEventsInfrastructure(),
		...provideMagicWordsInfrastructure(),
		...provideProgressionPresetsInfrastructure(),
		...provideRollConsequencesInfrastructure(),
		...provideSkillsInfrastructure(),
		...provideSpellMechanicsInfrastructure(),
		...provideValuesInfrastructure(),
		...provideWeaponsInfrastructure(),
		provideAppInitializer(() => inject(AuthFacade).initializeSession()),
		provideHttpClient(withInterceptors([authInterceptor])),
		provideRouter(appRoutes),
		providePrimeNG({
			theme: {
				preset: appThemePreset,
				options: {
					darkModeSelector: false,
					cssLayer: false
				}
			},
			ripple: true,
			inputVariant: 'filled'
		})
	]
};
