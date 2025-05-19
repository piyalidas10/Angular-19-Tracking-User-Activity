import {
  ApplicationConfig,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
  ],
};
