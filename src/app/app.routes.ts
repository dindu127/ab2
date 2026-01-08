import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PropertyDetailComponent } from './pages/property-detail/property-detail.component';

import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';

import { ProfileInfoComponent } from './pages/profile/info/profile-info.component';
import { ProfileEditComponent } from './pages/profile/edit/profile-edit.component';
import { ChangePasswordComponent } from './pages/profile/change-password/change-password.component';

import { AdminUserListComponent } from './admin/admin-user-list/admin-user-list.component';
import { AdminUserUnlocksComponent } from './admin/admin-user-unlocks/admin-user-unlocks.component';
import { AdminPropertiesComponent } from './admin/admin-properties/admin-properties.component';
import { AdminUnlockLogsComponent } from './pages/admin-unlock-logs/admin-unlock-logs.component';

import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

import { MyPropertiesComponent } from './pages/my-properties/my-properties.component';
import { AddPropertyComponent } from './pages/add-property/add-property.component';
import { EditPropertyComponent } from './pages/edit-property/edit-property.component';
import { UnlockedContactsComponent } from './pages/unlocked-contacts/unlocked-contacts.component';
import { BlogComponent } from './blogs/blog.component';

export const routes: Routes = [
  

  /* ---------------- HOME ---------------- */
  { path: '', component: HomeComponent, pathMatch: 'full' },

    {path: 'blog/:slug', component: BlogComponent },

  /* ---------------- PROPERTY DETAIL ---------------- */
  { path: 'property/:id', component: PropertyDetailComponent },

  /* ---------------- AUTH ---------------- */
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },

  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'register', redirectTo: 'auth/register', pathMatch: 'full' },

  /* ---------------- DASHBOARD ---------------- */
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'my-properties', component: MyPropertiesComponent },
      { path: 'add-property', component: AddPropertyComponent },
      { path: 'edit-property/:id', component: EditPropertyComponent,canActivate: [AuthGuard] },
      { path: '', redirectTo: 'my-properties', pathMatch: 'full' },
      {  path: 'unlocked-contacts',  loadComponent: () =>
             import('./pages/unlocked-contacts/unlocked-contacts.component')
             .then(m => m.UnlockedContactsComponent)}  ]
        },

  /* ---------------- PROFILE ---------------- */
  {
    path: 'profile',
    canActivate: [AuthGuard],
    children: [
      { path: 'info', component: ProfileInfoComponent },
      { path: 'edit', component: ProfileEditComponent },
      { path: 'change-password', component: ChangePasswordComponent },
      { path: '', redirectTo: 'info', pathMatch: 'full' }
    ]
  },

  /* ---------------- ADMIN ---------------- */
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      { path: 'users', component: AdminUserListComponent },
      { path: 'users/:id/unlocked', component: AdminUserUnlocksComponent },
      { path: 'properties', component: AdminPropertiesComponent },
      { path: 'unlock-logs', component: AdminUnlockLogsComponent },
      { path: 'properties/:id/edit',component: EditPropertyComponent,canActivate: [AuthGuard]},
    ]
  },
   {path: 'profile/forgot-password', loadComponent: () => import('./pages/profile/forgot-password/forgot-password.component')
        .then(m => m.ForgotPasswordComponent) },
   {path: 'profile/reset-password', loadComponent: () => import('./pages/profile/reset-password/reset-password.component')
      .then(m => m.ResetPasswordComponent)},

  /* ---------------- FALLBACK ---------------- */
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
