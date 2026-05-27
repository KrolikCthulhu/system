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
import { provideAttributesInfrastructure } from './features/attributes/data/provide-attributes-infrastructure';
import { AuthFacade } from './features/auth/state/auth.facade';
import { appRoutes } from './app.routes';
import { authInterceptor } from './features/auth/data/auth.interceptor';
import { provideAuthInfrastructure } from './features/auth/data/provide-auth-infrastructure';
import { provideSkillsInfrastructure } from './features/skills/data/provide-skills-infrastructure';
import { provideValuesInfrastructure } from './features/values/data/provide-values-infrastructure';

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
		tabs: {
			tab: {
				padding: '0.625rem 1.125rem'
			}
		}
	}
});

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		...provideAuthInfrastructure(),
		...provideAttributesInfrastructure(),
		...provideSkillsInfrastructure(),
		...provideValuesInfrastructure(),
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
