import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
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
import { UserListComponent } from './features/user-list/user-list.component';
import { UserProfileComponent } from './features/user-profile/user-profile.component';
import { TableComponent } from './features/table/table.component';
import { CartComponent } from './core/components/cart/cart.component';
import { CheckoutComponent } from './features/checkout/checkout.component';
import { PaymentComponent } from './features/payment/payment.component';
import { OrderConfirmationComponent } from './features/order-confirmation/order-confirmation.component';
import { ReservationComponent } from './features/reservation/reservation.component';
import { OrderGuard } from './core/guards/order/order.guard';
import { AllReservationsComponent } from './features/all-reservations/all-reservations.component';
import { MyReservationsComponent } from './features/users/my-reservations/my-reservations.component';
import { AllOrdersComponent } from './features/all-orders/all-orders.component';
import { HomeComponent } from './pages/home/home.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { ContactUsComponent } from './pages/contact-us/contact-us.component';
import { MenuCustomizationComponent } from './features/menu-customization/menu-customization.component';

export const routes: Routes = [
    { path :'home', component: HomeComponent },
    { path: 'categories', component: CategoryPageComponent },
    { path: 'menu', component: MenuPageComponent },
    { path: 'menu/:categoryName', component: MenuPageComponent },
    { path: 'about', component: AboutUsComponent},
    { path: 'contact', component: ContactUsComponent},
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'tables', component: TableComponent, canActivate: [AuthGuard] },
    { path: 'settings/users', component: UserListComponent, canActivate: [AuthGuard] },
    { path: 'settings/menu', component: MenuComponent, canActivate: [AuthGuard] },
    { path: 'settings/category', component: CategoryComponent, canActivate: [AuthGuard] },
    { path: 'settings/role', component: RoleComponent, canActivate: [AuthGuard] },
    { path: 'settings/permission', component: PermissionsComponent, canActivate: [AuthGuard] },
    { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
    { path: 'settings/menu-addon', component: MenuAddonComponent, canActivate: [AuthGuard] },
    { path: 'settings/menu-option', component: MenuOptionComponent, canActivate: [AuthGuard] },
    { path: 'settings/menu-customization', component: MenuCustomizationComponent, canActivate: [AuthGuard] },
    { path: 'profile', component: UserProfileComponent, canActivate:[AuthGuard] },
    { path: 'cart', component: CartComponent },
    { path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuard] },
    { path: 'payment', component: PaymentComponent, canActivate: [AuthGuard, OrderGuard]  },
    { path: 'order-confirmation/:id', component: OrderConfirmationComponent, canActivate: [AuthGuard]  },
    { path: 'reservation', component: ReservationComponent, canActivate: [AuthGuard]  },
    { path: 'all-reservations', component: AllReservationsComponent, canActivate: [AuthGuard]  },
    { path: 'orders', component: AllOrdersComponent, canActivate: [AuthGuard]  },
    { path: 'my-reservations', component: MyReservationsComponent, canActivate: [AuthGuard]  },
    //{ path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: '**', redirectTo: '/home' }
];
