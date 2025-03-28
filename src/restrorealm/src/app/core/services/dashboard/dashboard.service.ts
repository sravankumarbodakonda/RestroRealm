import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = environment.apiUrl;
  
  // Notifications subject
  private notificationsSubject = new BehaviorSubject<any[]>([]);
  notifications$ = this.notificationsSubject.asObservable();
  
  // Mock data for development/demo purposes
  private mockData = {
    dashboard: {
      quickStats: {
        revenue: { today: 4289, week: 28750, month: 125430 },
        orders: { today: 142, week: 978, month: 4235, pending: 15 },
        reservations: { today: 64, week: 342, upcoming: 23 },
        customers: { new: 32, total: 5280, active: 128 }
      },
      salesChart: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Revenue',
            data: [65000, 72000, 84000, 78000, 92000, 104000, 115000, 98000, 87000, 96000, 110000, 125000]
          },
          {
            label: 'Orders',
            data: [2100, 2340, 2780, 2500, 3100, 3500, 3780, 3200, 2900, 3150, 3680, 4200]
          }
        ]
      },
      occupancyChart: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Lunch',
            data: [45, 40, 55, 60, 75, 90, 85]
          },
          {
            label: 'Dinner',
            data: [65, 70, 80, 85, 95, 98, 85]
          }
        ]
      },
      menuPerformance: {
        topSelling: [
          { name: 'Filet Mignon', quantity: 248, revenue: 12400 },
          { name: 'Lobster Risotto', quantity: 187, revenue: 9350 },
          { name: 'Truffle Pasta', quantity: 176, revenue: 7040 },
          { name: 'Sea Bass', quantity: 162, revenue: 8100 },
          { name: 'Ribeye Steak', quantity: 154, revenue: 7700 }
        ],
        lowSelling: [
          { name: 'Vegan Burger', quantity: 28, revenue: 840 },
          { name: 'Mushroom Soup', quantity: 34, revenue: 680 },
          { name: 'Caesar Salad', quantity: 42, revenue: 840 },
          { name: 'Asparagus Side', quantity: 45, revenue: 675 },
          { name: 'Tuna Tartare', quantity: 47, revenue: 1410 }
        ]
      }
    },
    chef: {
      pendingOrders: [
        { id: 'ORD-1234', table: 'Table 8', items: ['Filet Mignon (1)', 'Lobster Risotto (2)', 'Caesar Salad (1)'], time: '14:35', waitTime: '5m', priority: 'high', specialInstructions: 'Medium rare steak' },
        { id: 'ORD-1235', table: 'Table 12', items: ['Ribeye Steak (2)', 'Truffle Pasta (1)', 'Sea Bass (1)'], time: '14:40', waitTime: '0m', priority: 'normal', specialInstructions: 'Allergic to nuts' },
        { id: 'ORD-1236', table: 'Table 5', items: ['Vegan Burger (1)', 'Side Salad (1)'], time: '14:42', waitTime: '0m', priority: 'low', specialInstructions: '' }
      ],
      preparingOrders: [
        { id: 'ORD-1232', table: 'Table 9', items: ['Sea Bass (2)', 'Ribeye Steak (1)', 'Mushroom Soup (1)'], time: '14:28', progress: 75, estimatedCompletion: '2m', chef: 'Michael' },
        { id: 'ORD-1233', table: 'Table 3', items: ['Truffle Pasta (3)', 'Garlic Bread (1)'], time: '14:30', progress: 90, estimatedCompletion: '1m', chef: 'Sophie' }
      ],
      completedOrders: [
        { id: 'ORD-1230', table: 'Table 6', items: ['Filet Mignon (2)', 'Lobster Risotto (1)'], time: '14:10', completedAt: '14:25', chef: 'Michael' },
        { id: 'ORD-1231', table: 'Table 2', items: ['Sea Bass (1)', 'Vegan Burger (1)'], time: '14:15', completedAt: '14:27', chef: 'Sophie' }
      ],
      lowStockItems: [
        { name: 'Ribeye Steak', current: 3, threshold: 5, unit: 'kg' },
        { name: 'Fresh Lobster', current: 4, threshold: 8, unit: 'kg' },
        { name: 'Truffle Oil', current: 1, threshold: 2, unit: 'bottle' }
      ]
    },
    cashier: {
      recentTransactions: [
        { id: 'TRX-4532', table: 'Table 8', amount: 245.50, time: '14:35', status: 'completed', paymentMethod: 'Credit Card', server: 'Emily' },
        { id: 'TRX-4531', table: 'Table 3', amount: 178.25, time: '14:28', status: 'completed', paymentMethod: 'Cash', server: 'John' },
        { id: 'TRX-4530', table: 'Table 10', amount: 312.80, time: '14:15', status: 'completed', paymentMethod: 'Credit Card', server: 'Maria' },
        { id: 'TRX-4529', table: 'Table 7', amount: 95.40, time: '14:05', status: 'completed', paymentMethod: 'Mobile Payment', server: 'Emily' }
      ],
      openTables: [
        { table: 'Table 1', amount: 0, status: 'available' },
        { table: 'Table 2', amount: 147.50, status: 'occupied', server: 'John', openTime: '13:45' },
        { table: 'Table 5', amount: 86.75, status: 'occupied', server: 'Maria', openTime: '14:10' },
        { table: 'Table 6', amount: 0, status: 'available' },
        { table: 'Table 9', amount: 214.30, status: 'occupied', server: 'Emily', openTime: '13:30' }
      ],
      activeDiscounts: [
        { code: 'HAPPY25', description: 'Happy Hour 25% Off', type: 'percentage', value: 25, validUntil: '18:00' },
        { code: 'MEMBER10', description: 'Member Discount', type: 'percentage', value: 10, validUntil: 'Always' },
        { code: 'BDAY2023', description: 'Birthday Special', type: 'fixed', value: 50, validUntil: '23:59' }
      ]
    },
    server: {
      tables: [
        { id: 1, name: 'Table 1', status: 'available', capacity: 4, section: 'Main' },
        { id: 2, name: 'Table 2', status: 'occupied', capacity: 2, section: 'Main', server: 'John', occupiedSince: '13:45', order: 'ORD-1229' },
        { id: 3, name: 'Table 3', status: 'occupied', capacity: 4, section: 'Patio', server: 'Maria', occupiedSince: '14:00', order: 'ORD-1233' },
        { id: 5, name: 'Table 5', status: 'occupied', capacity: 6, section: 'VIP', server: 'Maria', occupiedSince: '14:10', order: 'ORD-1236' },
        { id: 6, name: 'Table 6', status: 'cleaning', capacity: 4, section: 'Main' },
        { id: 8, name: 'Table 8', status: 'occupied', capacity: 4, section: 'Main', server: 'Emily', occupiedSince: '14:20', order: 'ORD-1234' },
        { id: 9, name: 'Table 9', status: 'occupied', capacity: 6, section: 'Patio', server: 'John', occupiedSince: '14:15', order: 'ORD-1232' },
        { id: 12, name: 'Table 12', status: 'occupied', capacity: 2, section: 'Bar', server: 'Emily', occupiedSince: '14:35', order: 'ORD-1235' }
      ],
      activeOrders: [
        { id: 'ORD-1232', table: 'Table 9', items: ['Sea Bass (2)', 'Ribeye Steak (1)', 'Mushroom Soup (1)'], status: 'preparing', timePlaced: '14:28', estimate: '14:48' },
        { id: 'ORD-1233', table: 'Table 3', items: ['Truffle Pasta (3)', 'Garlic Bread (1)'], status: 'preparing', timePlaced: '14:30', estimate: '14:45' },
        { id: 'ORD-1234', table: 'Table 8', items: ['Filet Mignon (1)', 'Lobster Risotto (2)', 'Caeser Salad (1)'], status: 'pending', timePlaced: '14:35', estimate: '14:55' },
        { id: 'ORD-1235', table: 'Table 12', items: ['Ribeye Steak (2)', 'Truffle Pasta (1)', 'Sea Bass (1)'], status: 'pending', timePlaced: '14:40', estimate: '15:00' },
        { id: 'ORD-1236', table: 'Table 5', items: ['Vegan Burger (1)', 'Side Salad (1)'], status: 'pending', timePlaced: '14:42', estimate: '14:57' }
      ]
    },
    bartender: {
      drinkQueue: [
        { id: 'DRK-567', table: 'Table 2', items: ['Old Fashioned (1)', 'Margarita (2)'], time: '14:38', priority: 'high', notes: 'No salt on one Margarita' },
        { id: 'DRK-568', table: 'Table 9', items: ['Red Wine - Cabernet (2)'], time: '14:40', priority: 'normal', notes: '' },
        { id: 'DRK-569', table: 'Bar Seat 3', items: ['Whiskey Sour (1)', 'Cosmopolitan (1)'], time: '14:41', priority: 'normal', notes: 'Extra sour mix' }
      ],
      popularCocktails: [
        { name: 'Old Fashioned', count: 187, percentage: 15 },
        { name: 'Espresso Martini', count: 154, percentage: 12 },
        { name: 'Margarita', count: 143, percentage: 11 },
        { name: 'Manhattan', count: 126, percentage: 10 },
        { name: 'Negroni', count: 112, percentage: 9 }
      ],
      lowStockBeverages: [
        { name: 'Hendrick\'s Gin', current: 1, threshold: 2, unit: 'bottle' },
        { name: 'Angostura Bitters', current: 1, threshold: 3, unit: 'bottle' },
        { name: 'Cointreau', current: 1, threshold: 2, unit: 'bottle' }
      ]
    },
    notifications: [
      {
        id: 1,
        type: 'order',
        title: 'New Order Placed',
        message: 'Table 12 ordered 4 items',
        time: new Date(Date.now() - 5 * 60000),
        read: false
      },
      {
        id: 2,
        type: 'reservation',
        title: 'New Reservation',
        message: 'Party of 6 at 8:00 PM',
        time: new Date(Date.now() - 25 * 60000),
        read: false
      },
      {
        id: 3,
        type: 'alert',
        title: 'Inventory Alert',
        message: 'Low stock: Ribeye Steak (3 left)',
        time: new Date(Date.now() - 120 * 60000),
        read: true
      },
      {
        id: 4,
        type: 'system',
        title: 'System Maintenance',
        message: 'Scheduled maintenance at 2 AM',
        time: new Date(Date.now() - 240 * 60000),
        read: true
      }
    ]
  };

  constructor(private http: HttpClient) {
    // Initialize notifications
    this.loadNotifications();
  }

  /**
   * Get dashboard data
   */
  getDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`)
      .pipe(
        catchError(() => {
          return of(this.mockData.dashboard);
        })
      );
  }

  /**
   * Get chef-specific dashboard data
   */
  getChefDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/chef`)
      .pipe(
        catchError(() => {
          return of(this.mockData.chef);
        })
      );
  }

  /**
   * Get cashier-specific dashboard data
   */
  getCashierDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/cashier`)
      .pipe(
        catchError(() => {
          return of(this.mockData.cashier);
        })
      );
  }

  /**
   * Get server-specific dashboard data
   */
  getServerDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/server`)
      .pipe(
        catchError(() => {
          return of(this.mockData.server);
        })
      );
  }

  /**
   * Get bartender-specific dashboard data
   */
  getBartenderDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/bartender`)
      .pipe(
        catchError(() => {
          return of(this.mockData.bartender);
        })
      );
  }

  /**
   * Update order status
   */
  updateOrderStatus(orderId: string, status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/orders/${orderId}/status`, { status })
      .pipe(
        catchError(() => {
          // If using mock data, we'd update the local mock data
          this.updateMockOrderStatus(orderId, status);
          return of({ success: true });
        })
      );
  }

  /**
   * Mark all notifications as read
   */
  markNotificationsAsRead(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/notifications/mark-read`, {})
      .pipe(
        catchError(() => {
          // Update our local notifications
          const notifications = this.notificationsSubject.value.map(notif => ({
            ...notif,
            read: true
          }));
          this.notificationsSubject.next(notifications);
          return of({ success: true });
        })
      );
  }

  /**
   * Load notifications
   */
  private loadNotifications(): void {
    this.http.get<any>(`${this.apiUrl}/notifications`)
      .pipe(
        catchError(() => {
          return of(this.mockData.notifications);
        })
      )
      .subscribe(notifications => {
        this.notificationsSubject.next(notifications);
      });
  }

  /**
   * Add new notification (used for real-time updates)
   */
  addNotification(notification: any): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...currentNotifications]);
  }

  /**
   * Update mock order status (used for demo/development)
   */
  private updateMockOrderStatus(orderId: string, status: string): void {
    // Find which array contains the order
    const sourceArray = this.findOrderArray(orderId);
    if (!sourceArray) return;

    // Find the order in the array
    const orderIndex = sourceArray.findIndex(order => order.id === orderId);
    if (orderIndex === -1) return;

    const order = { ...sourceArray[orderIndex] };

    // Remove from source array
    sourceArray.splice(orderIndex, 1);

    // Add to target array based on status
    switch (status) {
      case 'pending':
        this.mockData.chef.pendingOrders.push(order);
        break;
      case 'preparing':
        this.mockData.chef.preparingOrders.push({
          ...order,
          progress: 0,
          estimatedCompletion: '15m',
          chef: 'You'
        });
        break;
      case 'completed':
        this.mockData.chef.completedOrders.push({
          ...order,
          completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        break;
    }

    // Create a notification
    const notification = {
      id: Date.now(),
      type: 'order',
      title: 'Order Status Changed',
      message: `Order ${orderId} is now ${status}`,
      time: new Date(),
      read: false
    };

    this.addNotification(notification);
  }

  /**
   * Find which array contains the order (used for mock data)
   */
  private findOrderArray(orderId: string): any[] | null {
    if (this.mockData.chef.pendingOrders.some(o => o.id === orderId)) {
      return this.mockData.chef.pendingOrders;
    }
    if (this.mockData.chef.preparingOrders.some(o => o.id === orderId)) {
      return this.mockData.chef.preparingOrders;
    }
    if (this.mockData.chef.completedOrders.some(o => o.id === orderId)) {
      return this.mockData.chef.completedOrders;
    }
    return null;
  }
}
