import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    todayRevenue = 2580.50;
    revenueChange = 12.5;
    activeOrders = 8;
    todayReservations = 24;
    availableTables = 12;
    totalTables = 20;

    recentOrders = [
        { id: 1, table: 5, items: [{}, {}, {}], total: 124.50, status: 'PREPARING' },
        { id: 2, table: 3, items: [{}, {}], total: 85.00, status: 'SERVED' },
        // Add more orders...
    ];

    tables = [
        { number: 1, capacity: 4, status: 'AVAILABLE' },
        { number: 2, capacity: 2, status: 'OCCUPIED' },
        { number: 3, capacity: 6, status: 'RESERVED' },
        // Add more tables...
    ];

    kitchenOrders = [
        { 
            id: 1, 
            table: 5, 
            items: [
                { quantity: 2, name: 'Pasta Carbonara' },
                { quantity: 1, name: 'Caesar Salad' }
            ],
            orderTime: new Date(),
            priority: 'urgent'
        },
        // Add more kitchen orders...
    ];

    constructor(private router: Router) {}

    ngOnInit(): void {
        // Initialize dashboard data
    }

    newOrder(): void {
        this.router.navigate(['/orders/new']);
    }

    newReservation(): void {
        this.router.navigate(['/reservations/new']);
    }

    viewKitchen(): void {
        this.router.navigate(['/kitchen']);
    }

    viewOrder(orderId: number): void {
        this.router.navigate(['/orders', orderId]);
    }

    viewTableOrder(tableNumber: number): void {
        this.router.navigate(['/tables', tableNumber]);
    }
}
