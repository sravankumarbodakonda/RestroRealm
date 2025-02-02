import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ProfileComponent } from './features/profile/profile.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AuthGuard } from './core/guards/auth.guard';
import { MenuComponent } from './features/menu/menu.component';
import { CategoryComponent } from './features/category/category.component';
import { MenuOptionComponent } from './features/menu-option/menu-option.component';
import { RoleComponent } from './features/roles/roles.component';
import { SettingsComponent } from './core/components/settings/settings.component';
import { PermissionsComponent } from './features/permissions/permissions.component';
import { MenuAddonComponent } from './features/menu-addon/menu-addon.component';
import { CategoryPageComponent } from './pages/category-page/category-page.component';
import { MenuPageComponent } from './pages/menu-page/menu-page.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'categories', component: CategoryPageComponent },
    { path: 'menu/:categoryName', component: MenuPageComponent },
    { path: 'menu', component: MenuComponent, canActivate: [AuthGuard] },
    { path: 'settings/category', component: CategoryComponent, canActivate: [AuthGuard] },
    { path: 'settings/role', component: RoleComponent, canActivate: [AuthGuard] },
    { path: 'settings/permission', component: PermissionsComponent, canActivate: [AuthGuard] },
    { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
    { path: 'settings/menu-addon', component: MenuAddonComponent, canActivate: [AuthGuard] },
    { path: 'settings/menu-option', component: MenuOptionComponent, canActivate: [AuthGuard] },
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' }
];
