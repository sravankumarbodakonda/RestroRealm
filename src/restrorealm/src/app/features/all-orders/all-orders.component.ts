import { Component, OnDestroy, OnInit, HostListener, ElementRef, Renderer2, ChangeDetectorRef, NgZone } from '@angular/core';
import { Order } from '../../shared/models/order.model';
import { OrderStatus } from '../../shared/enum/order-status.enum';
import { Subscription, BehaviorSubject, debounceTime, distinctUntilChanged } from 'rxjs';
import { OrderService } from '../../core/services/orders/order.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-all-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './all-orders.component.html',
  styleUrl: './all-orders.component.css',
  animations: [
    trigger('toastAnimation', [
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      state('hidden', style({
        opacity: 0,
        transform: 'translateY(-30px)'
      })),
      transition('hidden => visible', animate('300ms ease-in')),
      transition('visible => hidden', animate('300ms ease-out'))
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class AllOrdersComponent implements OnInit, OnDestroy {
  // Order data
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  displayedOrders: Order[] = [];
  newOrders: Set<number> = new Set<number>();
  selectedOrders: Set<number> = new Set<number>();
  orderDetails: Order | null = null;
  
  // Enum reference for template
  OrderStatus = OrderStatus;
  
  // Subscriptions
  private subscriptions: Subscription = new Subscription();
  private searchSubject = new BehaviorSubject<string>('');
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  totalPages: number = 1;
  
  // Sorting
  sortBy: 'orderDate' | 'orderNumber' | 'totalAmount' = 'orderDate';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Filtering
  statusFilters: Set<OrderStatus> = new Set<OrderStatus>();
  showStatusFilterDropdown: boolean = false;
  searchQuery: string = '';
  dateRange = {
    start: '',
    end: ''
  };
  
  // View options
  viewMode: 'grid' | 'list' = 'grid';

  // Toast notification
  toasts: {id: number, message: string, type: 'success' | 'error' | 'warning' | 'info', visible: boolean}[] = [];
  private toastIdCounter: number = 0;

  // Loading state
  isLoading: boolean = false;
  
  // Permission constants - Detailed permissions for fine-grained control
  readonly PERM_VIEW_ALL_ORDERS = 'ORDERS_VIEW_ALL';
  readonly PERM_VIEW_MY_ORDERS = 'ORDERS_VIEW_MY';
  readonly PERM_VIEW_SINGLE_ORDER = 'ORDERS_VIEW_SINGLE';
  readonly PERM_CREATE_ORDER = 'ORDERS_CREATE';
  
  // Status update permissions
  readonly PERM_UPDATE_ORDER_STATUS_CONFIRMED = 'ORDERS_UPDATE_STATUS_CONFIRMED';
  readonly PERM_UPDATE_ORDER_STATUS_PREPARING = 'ORDERS_UPDATE_STATUS_PREPARING';
  readonly PERM_UPDATE_ORDER_STATUS_READY = 'ORDERS_UPDATE_STATUS_READY';
  readonly PERM_UPDATE_ORDER_STATUS_COMPLETED = 'ORDERS_UPDATE_STATUS_COMPLETED';
  readonly PERM_UPDATE_ORDER_STATUS_CANCELLED = 'ORDERS_UPDATE_STATUS_CANCELLED';
  readonly PERM_BULK_UPDATE = 'ORDERS_BULK_UPDATE';
  
  // Financial information viewing permissions
  readonly PERM_VIEW_SUBTOTAL = 'ORDERS_VIEW_SUBTOTAL';
  readonly PERM_VIEW_TAX = 'ORDERS_VIEW_TAX';
  readonly PERM_VIEW_TOTAL = 'ORDERS_VIEW_TOTAL';
  readonly PERM_VIEW_DISCOUNT = 'ORDERS_VIEW_DISCOUNT';
  readonly PERM_VIEW_PAYMENT_METHOD = 'ORDERS_VIEW_PAYMENT_METHOD';
  
  // Customer information viewing permissions
  readonly PERM_VIEW_CUSTOMER_NAME = 'ORDERS_VIEW_CUSTOMER_NAME';
  readonly PERM_VIEW_CUSTOMER_PHONE = 'ORDERS_VIEW_CUSTOMER_PHONE';
  readonly PERM_VIEW_CUSTOMER_EMAIL = 'ORDERS_VIEW_CUSTOMER_EMAIL';
  
  // Filter permissions
  readonly PERM_FILTER_BY_STATUS = 'ORDERS_FILTER_BY_STATUS';
  readonly PERM_FILTER_BY_DATE = 'ORDERS_FILTER_BY_DATE';
  readonly PERM_FILTER_STATUS_PENDING = 'ORDERS_FILTER_STATUS_PENDING';
  readonly PERM_FILTER_STATUS_CONFIRMED = 'ORDERS_FILTER_STATUS_CONFIRMED';
  readonly PERM_FILTER_STATUS_PREPARING = 'ORDERS_FILTER_STATUS_PREPARING';
  readonly PERM_FILTER_STATUS_READY = 'ORDERS_FILTER_STATUS_READY';
  readonly PERM_FILTER_STATUS_COMPLETED = 'ORDERS_FILTER_STATUS_COMPLETED';
  readonly PERM_FILTER_STATUS_CANCELLED = 'ORDERS_FILTER_STATUS_CANCELLED';
  readonly PERM_FILTER_STATUS_PAYMENT_PENDING = 'ORDERS_FILTER_STATUS_PAYMENT_PENDING';
  readonly PERM_FILTER_STATUS_PAYMENT_SUCCESSFUL = 'ORDERS_FILTER_STATUS_PAYMENT_SUCCESSFUL';
  readonly PERM_FILTER_STATUS_PAYMENT_FAILED = 'ORDERS_FILTER_STATUS_PAYMENT_FAILED';
  readonly PERM_FILTER_STATUS_CASHIER_PENDING = 'ORDERS_FILTER_STATUS_CASHIER_PENDING';
  
  // Item viewing permissions
  readonly PERM_VIEW_ORDER_ITEMS = 'ORDERS_VIEW_ITEMS';
  readonly PERM_VIEW_ITEM_IMAGES = 'ORDERS_VIEW_ITEM_IMAGES';
  readonly PERM_VIEW_ITEM_NOTES = 'ORDERS_VIEW_ITEM_NOTES';
  
  // Search permissions
  readonly PERM_SEARCH_ORDERS = 'ORDERS_SEARCH';
  
  // View mode permissions
  readonly PERM_CHANGE_VIEW_MODE = 'ORDERS_CHANGE_VIEW_MODE';
  
  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    // Close dropdown when clicking outside
    if (this.showStatusFilterDropdown) {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        this.showStatusFilterDropdown = false;
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Handle escape key to close modal
    if (event.key === 'Escape' && this.orderDetails) {
      this.closeOrderDetails();
    }
  }

  ngOnInit(): void {
    // Setup search debounce
    this.subscriptions.add(
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(() => {
        this.applySearch();
      })
    );
    
    // Subscribe to real-time order updates
    this.subscriptions.add(
      this.orderService.orders$.subscribe(orders => {
        // Filter out orders with pending payment
        this.orders = orders.filter(order => order.status !== OrderStatus.PAYMENT_PENDING);
        this.applyFilters();
        this.cdr.detectChanges();
      })
    );
    
    // Subscribe to new orders notifications
    this.subscriptions.add(
      this.orderService.newOrders$.subscribe(newOrders => {
        if (newOrders.size > 0 && this.newOrders.size < newOrders.size) {
          this.ngZone.run(() => {
            this.showToast('New orders have arrived!', 'info');
            
            // Play notification sound if available
            try {
              const audio = new Audio('assets/sounds/notification.mp3');
              audio.play().catch(error => {
                console.warn('Could not play notification sound', error);
              });
            } catch (error) {
              console.warn('Could not play notification sound', error);
            }
          });
        }
        this.newOrders = newOrders;
        this.cdr.detectChanges();
      })
    );
    
    // Initialize order data
    this.loadOrders();
  }
  
  loadOrders(): void {
    this.isLoading = true;
    
    // Initialize real-time data streams instead of one-time fetching
    if (this.authService.hasPermission(this.PERM_VIEW_ALL_ORDERS)) {
      // For users with all orders permission - connect to the all orders stream
      this.subscriptions.add(
        this.orderService.getAllOrders().subscribe({
          next: () => {
            this.isLoading = false;
            this.showToast('Connected to order updates', 'success');
          },
          error: (err) => {
            this.isLoading = false;
            this.showToast('Failed to connect to order updates. Please refresh.', 'error');
            console.error('Error connecting to all orders stream:', err);
          }
        })
      );
    } else {
      // For regular users - connect to their personal orders stream
      this.subscriptions.add(
        this.orderService.getMyOrders().subscribe({
          next: () => {
            this.isLoading = false;
            this.showToast('Connected to your order updates', 'success');
          },
          error: (err) => {
            this.isLoading = false;
            this.showToast('Failed to connect to your order updates. Please refresh.', 'error');
            console.error('Error connecting to user orders stream:', err);
          }
        })
      );
    }
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  // Permissions check
  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }
  
  // Check if user has permission to filter by a specific status
  hasPermissionToFilterStatus(status: OrderStatus): boolean {
    switch (status) {
      case OrderStatus.PENDING:
        return this.hasPermission(this.PERM_FILTER_STATUS_PENDING);
      case OrderStatus.CONFIRMED:
        return this.hasPermission(this.PERM_FILTER_STATUS_CONFIRMED);
      case OrderStatus.PREPARING:
        return this.hasPermission(this.PERM_FILTER_STATUS_PREPARING);
      case OrderStatus.READY_FOR_PICKUP:
        return this.hasPermission(this.PERM_FILTER_STATUS_READY);
      case OrderStatus.COMPLETED:
        return this.hasPermission(this.PERM_FILTER_STATUS_COMPLETED);
      case OrderStatus.CANCELLED:
        return this.hasPermission(this.PERM_FILTER_STATUS_CANCELLED);
      case OrderStatus.PAYMENT_PENDING:
        return this.hasPermission(this.PERM_FILTER_STATUS_PAYMENT_PENDING);
      case OrderStatus.PAYMENT_SUCCESSFUL:
        return this.hasPermission(this.PERM_FILTER_STATUS_PAYMENT_SUCCESSFUL);
      case OrderStatus.PAYMENT_FAILED:
        return this.hasPermission(this.PERM_FILTER_STATUS_PAYMENT_FAILED);
      case OrderStatus.CASHIER_PENDING:
        return this.hasPermission(this.PERM_FILTER_STATUS_CASHIER_PENDING);
      default:
        return false;
    }
  }
  
  // Check if user has permission to update to a specific status
  hasPermissionToUpdateStatus(status: OrderStatus): boolean {
    switch (status) {
      case OrderStatus.CONFIRMED:
        return this.hasPermission(this.PERM_UPDATE_ORDER_STATUS_CONFIRMED);
      case OrderStatus.PREPARING:
        return this.hasPermission(this.PERM_UPDATE_ORDER_STATUS_PREPARING);
      case OrderStatus.READY_FOR_PICKUP:
        return this.hasPermission(this.PERM_UPDATE_ORDER_STATUS_READY);
      case OrderStatus.COMPLETED:
        return this.hasPermission(this.PERM_UPDATE_ORDER_STATUS_COMPLETED);
      case OrderStatus.CANCELLED:
        return this.hasPermission(this.PERM_UPDATE_ORDER_STATUS_CANCELLED);
      default:
        return false;
    }
  }
  
  // Order status management
  updateOrderStatus(order: Order, status: OrderStatus, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    // Check appropriate permission based on status
    if (!this.hasPermissionToUpdateStatus(status)) {
      this.showToast(`You don't have permission to update orders to ${status} status.`, 'error');
      return;
    }
    
    this.isLoading = true;
    this.orderService.updateOrderStatus(order.orderId, status).subscribe({
      next: () => {
        this.isLoading = false;
        this.showToast(`Order #${order.orderNumber} status updated to ${status}.`, 'success');
        
        // Update local order details if open
        if (this.orderDetails && this.orderDetails.orderId === order.orderId) {
          this.orderDetails.status = status;
          // Add to status history if it exists
          if (this.orderDetails.statusHistory) {
            this.orderDetails.statusHistory.push({
              status,
              timestamp: new Date().toISOString(),
              note: `Status updated to ${status}`
            });
          }
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.showToast('Failed to update order status. Please try again.', 'error');
        console.error('Error updating order status:', err);
      }
    });
  }
  
  updateSelectedOrdersStatus(status: OrderStatus): void {
    if (this.selectedOrders.size === 0) return;
    
    // Check for bulk update permission
    if (!this.hasPermission(this.PERM_BULK_UPDATE)) {
      this.showToast('You do not have permission to perform bulk updates.', 'error');
      return;
    }
    
    // Check for specific status update permission
    if (!this.hasPermissionToUpdateStatus(status)) {
      this.showToast(`You don't have permission to update orders to ${status} status.`, 'error');
      return;
    }
    
    const orderCount = this.selectedOrders.size;
    let successCount = 0;
    let errorCount = 0;
    this.isLoading = true;
    
    const orderIds = Array.from(this.selectedOrders);
    orderIds.forEach(orderId => {
      this.orderService.updateOrderStatus(orderId, status).subscribe({
        next: () => {
          successCount++;
          
          // When all updates are processed, show summary notification
          if (successCount + errorCount === orderCount) {
            this.isLoading = false;
            if (errorCount === 0) {
              this.showToast(`Successfully updated all ${orderCount} orders to ${status}.`, 'success');
            } else {
              this.showToast(`Updated ${successCount} orders to ${status}. ${errorCount} updates failed.`, 'warning');
            }
            
            // Clear selections after update
            this.selectedOrders.clear();
          }
        },
        error: (err) => {
          console.error('Error updating order status:', err);
          errorCount++;
          
          // When all updates are processed, show summary notification
          if (successCount + errorCount === orderCount) {
            this.isLoading = false;
            if (successCount === 0) {
              this.showToast(`Failed to update orders to ${status}.`, 'error');
            } else {
              this.showToast(`Updated ${successCount} orders to ${status}. ${errorCount} updates failed.`, 'warning');
            }
            
            // Clear selections after update attempts
            this.selectedOrders.clear();
          }
        }
      });
    });
  }
  
  // Toast notification system
  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    const id = this.toastIdCounter++;
    const toast = { id, message, type, visible: true };
    this.toasts.push(toast);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideToast(id);
    }, 5000);
  }
  
  hideToast(id: number): void {
    const index = this.toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      this.toasts[index].visible = false;
      
      // Remove from array after animation completes
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.cdr.detectChanges();
      }, 300);
    }
  }
  
  // Order selection
  toggleOrderSelection(orderId: number, event: Event): void {
    event.stopPropagation();
    
    if (this.selectedOrders.has(orderId)) {
      this.selectedOrders.delete(orderId);
    } else {
      this.selectedOrders.add(orderId);
    }
  }
  
  isOrderSelected(orderId: number): boolean {
    return this.selectedOrders.has(orderId);
  }
  
  selectAllDisplayedOrders(): void {
    if (this.areAllDisplayedOrdersSelected()) {
      // Deselect all if all are already selected
      this.displayedOrders.forEach(order => {
        this.selectedOrders.delete(order.orderId);
      });
    } else {
      // Select all currently displayed orders
      this.displayedOrders.forEach(order => {
        this.selectedOrders.add(order.orderId);
      });
    }
  }
  
  areAllDisplayedOrdersSelected(): boolean {
    return this.displayedOrders.length > 0 && 
           this.displayedOrders.every(order => this.selectedOrders.has(order.orderId));
  }
  
  clearAllSelections(): void {
    this.selectedOrders.clear();
  }
  
  // New order indicators
  isNewOrder(orderId: number): boolean {
    return this.newOrders.has(orderId);
  }
  
  clearNewFlag(orderId: number): void {
    this.orderService.clearNewOrderFlag(orderId);
  }
  
  // Filtering
  toggleStatusFilter(status: OrderStatus): void {
    if (!this.hasPermissionToFilterStatus(status)) {
      this.showToast(`You don't have permission to filter by ${status} status.`, 'error');
      return;
    }
    
    if (this.statusFilters.has(status)) {
      this.statusFilters.delete(status);
    } else {
      this.statusFilters.add(status);
    }
    this.applyFilters();
  }
  
  isStatusFilterActive(status: OrderStatus): boolean {
    return this.statusFilters.has(status);
  }
  
  toggleStatusFilterDropdown(event: Event): void {
    if (!this.hasPermission(this.PERM_FILTER_BY_STATUS)) {
      this.showToast('You do not have permission to filter by status.', 'error');
      return;
    }
    
    event.stopPropagation();
    this.showStatusFilterDropdown = !this.showStatusFilterDropdown;
  }
  
  clearFilters(): void {
    this.statusFilters.clear();
    this.searchQuery = '';
    this.dateRange.start = '';
    this.dateRange.end = '';
    this.applyFilters();
  }
  
  onSearchInputChange(): void {
    this.searchSubject.next(this.searchQuery);
  }
  
  applySearch(): void {
    if (!this.hasPermission(this.PERM_SEARCH_ORDERS)) {
      this.showToast('You do not have permission to search orders.', 'error');
      return;
    }
    
    this.currentPage = 1;
    this.applyFilters();
  }
  
  applyDateFilter(): void {
    if (!this.hasPermission(this.PERM_FILTER_BY_DATE)) {
      this.showToast('You do not have permission to filter by date.', 'error');
      return;
    }
    
    this.currentPage = 1;
    this.applyFilters();
  }
  
  private applyFilters(): void {
    let result = [...this.orders];
    
    // Apply status filters if any are selected
    if (this.statusFilters.size > 0) {
      result = result.filter(order => this.statusFilters.has(order.status));
    }
    
    // Apply search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      result = result.filter(order => 
        order.orderNumber.toString().includes(query) ||
        (order.customerName && order.customerName.toLowerCase().includes(query)) ||
        (order.orderItems && order.orderItems.some(item => 
          item.menuItemName && item.menuItemName.toLowerCase().includes(query))
        )
      );
    }
    
    // Apply date range filter
    if (this.dateRange.start && this.dateRange.end) {
      const startDate = new Date(this.dateRange.start);
      const endDate = new Date(this.dateRange.end);
      endDate.setHours(23, 59, 59); // Include the entire end day
      
      result = result.filter(order => {
        const orderDate = this.parseDate(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }
    
    // Apply sorting
    result = this.sortOrders(result);
    
    this.filteredOrders = result;
    this.totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
    
    // Reset to first page if current page is now invalid
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    
    // Apply pagination
    this.updateDisplayedOrders();
  }
  
  // Sorting
  setSorting(sortField: 'orderDate' | 'orderNumber' | 'totalAmount'): void {
    if (this.sortBy === sortField) {
      // Toggle direction if clicking the same field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortField;
      // Default to descending for dates, ascending for others
      this.sortDirection = sortField === 'orderDate' ? 'desc' : 'asc';
    }
    
    this.applyFilters();
  }
  
  private sortOrders(orders: Order[]): Order[] {
    return orders.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'orderDate':
          comparison = this.parseDate(a.createdAt).getTime() - this.parseDate(b.createdAt).getTime();
          break;
        case 'orderNumber':
          comparison = Number(a.orderNumber) - Number(b.orderNumber);
          break;
        case 'totalAmount':
          comparison = a.totalAmount - b.totalAmount;
          break;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }
  
  getSortIndicator(field: string): string {
    if (this.sortBy !== field) return '';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }
  
  // Pagination
  updateDisplayedOrders(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredOrders.length);
    this.displayedOrders = this.filteredOrders.slice(startIndex, endIndex);
  }
  
  changeItemsPerPage(): void {
    this.currentPage = 1;
    this.updateDisplayedOrders();
  }
  
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updateDisplayedOrders();
  }
  
  getPaginationArray(): number[] {
    const maxButtons = 5;
    const pages: number[] = [];
    
    if (this.totalPages <= 0) {
      return pages;
    }
    
    // Always include first and last page
    if (this.totalPages <= maxButtons) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      // Calculate start and end based on current page
      let start = Math.max(2, this.currentPage - 1);
      let end = Math.min(this.totalPages - 1, start + 2);
      
      // Adjust start if end is maxed out
      start = Math.max(2, end - 2);
      
      // Add ellipsis before start if needed
      if (start > 2) {
        pages.push(-1); // -1 represents ellipsis
      }
      
      // Add pages between start and end
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis after end if needed
      if (end < this.totalPages - 1) {
        pages.push(-2); // -2 represents ellipsis
      }
      
      pages.push(this.totalPages);
    }
    
    return pages;
  }
  
  // Order details
  viewOrderDetails(order: Order, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    // Check view permission
    if (!this.hasPermission(this.PERM_VIEW_SINGLE_ORDER)) {
      this.showToast('You do not have permission to view order details.', 'error');
      return;
    }
    
    this.orderDetails = order;
    this.clearNewFlag(order.orderId);
  }
  
  closeOrderDetails(): void {
    this.orderDetails = null;
  }
  
  // Styling helpers
  getOrderStatusClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'badge-warning';
      case OrderStatus.CONFIRMED:
        return 'badge-info';
      case OrderStatus.IN_PROGRESS:
      case OrderStatus.PREPARING:
        return 'badge-primary';
      case OrderStatus.COMPLETED:
      case OrderStatus.READY_FOR_PICKUP:
      case OrderStatus.PAYMENT_SUCCESSFUL:
        return 'badge-success';
      case OrderStatus.REJECTED:
      case OrderStatus.CANCELLED:
      case OrderStatus.PAYMENT_FAILED:
        return 'badge-danger';
      case OrderStatus.CASHIER_PENDING:
        return 'badge-gold';
      default:
        return 'badge-secondary';
    }
  }
  
  getToastIconClass(type: string): string {
    switch (type) {
      case 'success':
        return 'fa-check-circle';
      case 'error':
        return 'fa-exclamation-circle';
      case 'warning':
        return 'fa-exclamation-triangle';
      case 'info':
        return 'fa-info-circle';
      default:
        return 'fa-bell';
    }
  }
  
  getMinValue(arg0: number, arg1: number) {
    return Math.min(arg0, arg1);
  }
  
  // Check if an order is VIP
  isVipOrder(order: Order): boolean {
    // Implement VIP logic here
    // For example, based on order total, customer status, etc.
    return order.customerVip === true || (typeof order.totalAmount === 'number' && order.totalAmount > 300);
  }
  
  // Format currency with appropriate localization
  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
  
  // Get order priority class based on order date and status
  getOrderPriorityClass(order: Order): string {
    if (this.isVipOrder(order)) {
      return 'priority-vip';
    }
    
    const now = new Date();
    const orderDate = this.parseDate(order.createdAt);
    const hoursDiff = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
    
    if (order.status === OrderStatus.PAYMENT_SUCCESSFUL || order.status === OrderStatus.CONFIRMED) {
      if (hoursDiff > 1) {
        return 'priority-high';
      } else if (hoursDiff > 0.5) {
        return 'priority-medium';
      }
    }
    
    return '';
  }
  
  // Parse date safely (handles both string and Date objects)
  parseDate(dateInput: string | Date | undefined): Date {
    if (!dateInput) {
      return new Date();
    }
    
    if (dateInput instanceof Date) {
      return dateInput;
    }
    
    // Handle invalid date strings
    const parsedDate = new Date(dateInput);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }
  
  // Format relative time (e.g., "5 minutes ago")
  getRelativeTime(dateInput: string | Date): string {
    const now = new Date();
    const date = this.parseDate(dateInput);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
    
    // For older dates, return formatted date
    return date.toLocaleDateString();
  }
  
  // Get image URL for a menu item
  getMenuItemImageUrl(itemId: number | undefined) {
    if (!itemId) {
      return 'assets/images/placeholder-dish.jpg';
    }
    return `assets/images/menu-items/${itemId}.jpg`;
  }
  
  // Default image handling
  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/placeholder-dish.jpg';
  }
}
