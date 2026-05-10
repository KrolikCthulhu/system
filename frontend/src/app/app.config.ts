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
import { AuthSessionService } from '@entities/session/model/auth-session.service';
import { authInterceptor } from '@app/providers/auth/auth.interceptor';
import { appRoutes } from '@app/app.routes';

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
	}
});

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideAppInitializer(() => inject(AuthSessionService).initializeSession()),
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
