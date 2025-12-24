// src/app/app.config.ts
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptor } from './interceptors/jwt.interceptor';

export const appConfig = [
  provideRouter(routes),
  importProvidersFrom(HttpClientModule),
  { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
];
