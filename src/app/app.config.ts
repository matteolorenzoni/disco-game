import { ApplicationConfig, provideZoneChangeDetection, isDevMode, LOCALE_ID, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './router/app.routes';
import { GlobalErrorHandler } from './handler/error.handler';

// Registrazione dei dati locali
registerLocaleData(localeIt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    provideAnimations(),
    { provide: LOCALE_ID, useValue: 'it' },
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
