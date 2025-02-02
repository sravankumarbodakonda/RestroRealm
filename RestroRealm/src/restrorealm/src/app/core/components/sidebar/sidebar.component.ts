import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '../../services/auth/auth.service';
import { User } from '../../../shared/models/user.model';
import { SidebarService } from '../../services/sidebar/sidebar.service';
import { Subscription } from 'rxjs';

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
    logoPath = '../../../../assets/logo.png';
    readAllMenuItems: boolean = false;
    readAllTables: boolean = false;
    readAllReservations: boolean = false;
    readAllCategories: boolean = false;
    readAllKitchenOrders: boolean = false;;
    readAllStaff: boolean = false;;
    readAllOrders: boolean = false;;
    readAllReports: boolean = false;;
    readAllSettings: boolean = false;;

    constructor(
        private authService: AuthService,
        private sidebarService: SidebarService
    ) {
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

    ngOnInit(): void {
        this.subscriptions.push(
            this.sidebarService.isOpen$.subscribe(
                isExpanded => this.isExpanded = isExpanded
            ),
            this.authService.user$.subscribe(
                user => this.user = user
            )
        );
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

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
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
}
