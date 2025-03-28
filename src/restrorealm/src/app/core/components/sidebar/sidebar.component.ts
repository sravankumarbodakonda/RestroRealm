import { Component, OnInit, OnDestroy, HostListener, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '../../services/auth/auth.service';
import { User } from '../../../shared/models/user.model';
import { SidebarService } from '../../services/sidebar/sidebar.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule, FontAwesomeModule],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
    isExpanded = false;
    user: User | null = null;
    private subscriptions: Subscription[] = [];
    logoPath = environment.imageUrl + '/images/logo.png';
    
    // Permission flags
    readAllMenuItems = false;
    readAllTables = false;
    readAllReservations = false;
    readAllCategories = false;
    readAllKitchenOrders = false;
    readAllStaff = false;
    readAllOrders = false;
    readAllReports = false;
    readAllSettings = false;

    // For keyboard navigation
    activeMenuIndex = -1;
    menuItems: string[] = [];

    constructor(
        private authService: AuthService,
        private sidebarService: SidebarService,
        private router: Router,
        private renderer: Renderer2
    ) {
        // Initialize the sidebar in collapsed state
        this.isExpanded = false;
    }

    @HostListener('document:keydown.escape', ['$event'])
    onEscapeKey(event: KeyboardEvent) {
        this.closeSidebar();
    }

    @HostListener('document:keydown.arrowdown', ['$event'])
    onArrowDown(event: KeyboardEvent) {
        // Only handle arrow keys when sidebar is expanded
        if (this.isExpanded && this.menuItems.length > 0) {
            event.preventDefault();
            this.activeMenuIndex = (this.activeMenuIndex + 1) % this.menuItems.length;
            this.focusMenuItem();
        }
    }

    @HostListener('document:keydown.arrowup', ['$event'])
    onArrowUp(event: KeyboardEvent) {
        // Only handle arrow keys when sidebar is expanded
        if (this.isExpanded && this.menuItems.length > 0) {
            event.preventDefault();
            this.activeMenuIndex = (this.activeMenuIndex - 1 + this.menuItems.length) % this.menuItems.length;
            this.focusMenuItem();
        }
    }

    focusMenuItem() {
        // Find the currently active menu item and focus it
        if (this.activeMenuIndex >= 0) {
            const menuElements = document.querySelectorAll('.sidebar .nav-item');
            if (menuElements && menuElements.length > this.activeMenuIndex) {
                (menuElements[this.activeMenuIndex] as HTMLElement).focus();
            }
        }
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
        this.closeSidebar();
    }

    ngOnInit(): void {
        // Initialize user data and permissions
        this.subscriptions.push(
            this.sidebarService.isOpen$.subscribe(
                isExpanded => {
                    this.isExpanded = isExpanded;
                    
                    // Apply appropriate classes for layout adjustments
                    if (isExpanded) {
                        this.renderer.addClass(document.body, 'sidebar-expanded');
                    } else {
                        this.renderer.removeClass(document.body, 'sidebar-expanded');
                    }
                    
                    // Reset active menu index when sidebar closes
                    if (!isExpanded) {
                        this.activeMenuIndex = -1;
                    }
                }
            ),
            this.authService.user$.subscribe(
                user => {
                    this.user = user;
                    this.updatePermissions();
                    this.buildMenuItems();
                }
            )
        );
        
        // Update permissions
        this.updatePermissions();
        
        // Initialize the sidebar service with collapsed state
        this.sidebarService.close();
    }

    updatePermissions(): void {
        // Set permission flags based on user permissions
        this.readAllMenuItems = this.hasPermission('READ_ALL_MENU_ITEMS');
        this.readAllTables = this.hasPermission('READ_ALL_TABLES');
        this.readAllReservations = this.hasPermission('READ_ALL_RESERVATIONS');
        this.readAllKitchenOrders = this.hasPermission('READ_ALL_KITCHEN_ORDERS');
        this.readAllCategories = this.hasPermission('READ_ALL_CATEGORIES');
        this.readAllStaff = this.hasPermission('READ_ALL_STAFF');
        this.readAllOrders = this.hasPermission('READ_ALL_ORDERS');
        this.readAllReports = this.hasPermission('READ_ALL_REPORTS');
        this.readAllSettings = this.hasPermission('READ_ALL_SETTINGS');
    }

    buildMenuItems(): void {
        // Build list of available menu items for keyboard navigation
        this.menuItems = ['Dashboard'];
        
        if (this.readAllOrders) this.menuItems.push('Orders');
        if (this.readAllMenuItems) this.menuItems.push('Menu');
        if (this.readAllTables) this.menuItems.push('Tables');
        if (this.readAllReservations) this.menuItems.push('Reservations', 'My Reservations');
        if (this.readAllKitchenOrders) this.menuItems.push('Kitchen');
        if (this.readAllStaff) this.menuItems.push('Staff');
        if (this.readAllReports) this.menuItems.push('Reports');
        
        this.menuItems.push('Settings', 'My Profile', 'Logout');
    }

    ngOnDestroy(): void {
        // Clean up subscriptions
        this.subscriptions.forEach(sub => sub.unsubscribe());
        
        // Remove sidebar-expanded class
        this.renderer.removeClass(document.body, 'sidebar-expanded');
    }

    closeSidebar(): void {
        this.sidebarService.close();
    }

    toggleSidebar(): void {
        this.sidebarService.toggle();
    }

    hasPermission(requiredPermission: string): boolean {
        return this.user?.permissionDtoSet?.some(
            permission => permission.permissionCode === requiredPermission
        ) ?? false;
    }
    
    getUserInitials(): string {
        if (!this.user || !this.user.name) return 'U';
        
        const names = this.user.name.trim().split(' ');
        if (names.length === 1) {
            return names[0].charAt(0).toUpperCase();
        }
        
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
}
