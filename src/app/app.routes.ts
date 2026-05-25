import { Routes } from '@angular/router';
import { authGuard } from './services/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then((m) => m.Login),
  },
  {
    path: 'callback',
    loadComponent: () => import('./components/login/callback/callback').then((m) => m.Callback),
  },
  {
    path: 'drg/drg-seeker',
    loadComponent: () => import('./components/drg-utils/drg-seeker/drg-seeker.component').then((m) => m.DrgSeekerComponent),
  },
  {
    path: 'drg-util',
    canActivate: [authGuard],
    loadComponent: () => import('./components/drg-utils/drg-util-layout/drg-util-layout').then((m) => m.DrgUtilLayout),
    children: [
      { path: '', redirectTo: 'drg-seeker', pathMatch: 'full' },
      {
        path: 'drg-seeker',
        loadComponent: () => import('./components/drg-utils/drg-seeker/drg-seeker.component').then((m) => m.DrgSeekerComponent),
      },
      {
        path: 'data-list',
        loadComponent: () => import('./components/drg-utils/data-list/data-list.component').then((m) => m.DataListComponent),
      },
      {
        path: 'upload',
        loadComponent: () => import('./components/drg-utils/upload/upload.component').then((m) => m.UploadComponent),
      },
      {
        path: 'about',
        loadComponent: () => import('./components/about/about').then((m) => m.AboutComponent),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/layout/layout').then((m) => m.Layout),
    children: [
      { path: '', redirectTo: 'drg-prompt', pathMatch: 'full' },
      {
        path: 'drg-prompt',
        loadComponent: () => import('./components/ai-prompt/ai-prompt').then((m) => m.AiPrompt),
      },
      {
        path: 'ipd-summary',
        loadComponent: () => import('./components/ipd-ai-summary/ipd-ai-summary').then((m) => m.IpdAiSummary),
      },
    ],
  },
  {
    path: 'cmi-api',
    canActivate: [authGuard],
    loadComponent: () => import('./components/cmi-api/cmi-api-layout/cmi-api-layout').then((m) => m.CmiApiLayout),
    children: [
      { path: '', redirectTo: 'download', pathMatch: 'full' },
      {
        path: 'download',
        loadComponent: () => import('./components/cmi-api/api-request/api-request').then((m) => m.ApiRequest),
      },
    ]
  },
  { path: '**', redirectTo: 'login' },
];
