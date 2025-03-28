import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Chart, registerables } from 'chart.js';
import { debounceTime, Subject, Subscription, takeUntil } from 'rxjs';
import { trigger, transition, style, animate, state } from '@angular/animations';

// Import Services
import { AuthService } from '../../core/services/auth/auth.service';
import { environment } from '../../../environments/environment';

// Models and enums
enum UserRole {
  CUSTOMER = 'CUSTOMER',
  CHEF = 'CHEF',
  CASHIER = 'CASHIER',
  SERVER = 'SERVER',
  BARTENDER = 'BARTENDER', 
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN'
}

// Permission constants - Define all permission strings here for consistency
export const PERMISSIONS = {
  // Customer permissions
  VIEW_LOYALTY_POINTS: 'VIEW_LOYALTY_POINTS',
  VIEW_RECENT_ORDERS: 'VIEW_RECENT_ORDERS',
  VIEW_RESERVATIONS: 'VIEW_RESERVATIONS',
  VIEW_REWARDS: 'VIEW_REWARDS',
  MAKE_RESERVATION: 'MAKE_RESERVATION',
  PLACE_ORDER: 'PLACE_ORDER',
  SUBMIT_FEEDBACK: 'SUBMIT_FEEDBACK',
  
  // Chef permissions
  VIEW_ACTIVE_ORDERS: 'VIEW_ACTIVE_ORDERS',
  VIEW_PREPARATION_METRICS: 'VIEW_PREPARATION_METRICS',
  VIEW_INVENTORY_ALERTS: 'VIEW_INVENTORY_ALERTS',
  VIEW_COMPLETED_ORDERS: 'VIEW_COMPLETED_ORDERS',
  MANAGE_ORDERS: 'MANAGE_ORDERS',
  
  // Cashier permissions
  VIEW_SALES_METRICS: 'VIEW_SALES_METRICS',
  VIEW_PENDING_ORDERS: 'VIEW_PENDING_ORDERS',
  VIEW_TRANSACTIONS: 'VIEW_TRANSACTIONS',
  VIEW_CASH_DRAWER: 'VIEW_CASH_DRAWER',
  PROCESS_PAYMENTS: 'PROCESS_PAYMENTS',
  
  // Server permissions
  VIEW_TABLE_LAYOUT: 'VIEW_TABLE_LAYOUT',
  VIEW_SERVER_ORDERS: 'VIEW_SERVER_ORDERS',
  VIEW_CUSTOMER_NOTES: 'VIEW_CUSTOMER_NOTES',
  DELIVER_ORDERS: 'DELIVER_ORDERS',
  
  // Bartender permissions
  VIEW_DRINK_QUEUE: 'VIEW_DRINK_QUEUE',
  VIEW_OPEN_TABS: 'VIEW_OPEN_TABS',
  VIEW_COCKTAIL_RECIPES: 'VIEW_COCKTAIL_RECIPES',
  MANAGE_TABS: 'MANAGE_TABS',
  
  // Manager permissions
  VIEW_STAFF_METRICS: 'VIEW_STAFF_METRICS',
  VIEW_RESERVATIONS_OVERVIEW: 'VIEW_RESERVATIONS_OVERVIEW',
  VIEW_SALES_DASHBOARD: 'VIEW_SALES_DASHBOARD',
  VIEW_INVENTORY_MANAGEMENT: 'VIEW_INVENTORY_MANAGEMENT',
  MANAGE_STAFF: 'MANAGE_STAFF',
  
  // Admin permissions
  VIEW_SYSTEM_OVERVIEW: 'VIEW_SYSTEM_OVERVIEW',
  VIEW_MENU_CONFIG: 'VIEW_MENU_CONFIG',
  VIEW_PAYMENT_CONFIG: 'VIEW_PAYMENT_CONFIG',
  MANAGE_SYSTEM: 'MANAGE_SYSTEM',
  
  // Superadmin permissions
  VIEW_MULTI_LOCATION: 'VIEW_MULTI_LOCATION',
  VIEW_FRANCHISE_MANAGEMENT: 'VIEW_FRANCHISE_MANAGEMENT',
  VIEW_GLOBAL_SETTINGS: 'VIEW_GLOBAL_SETTINGS',
  VIEW_BUSINESS_INTELLIGENCE: 'VIEW_BUSINESS_INTELLIGENCE',
  
  // Chart permissions
  VIEW_SALES_CHART: 'VIEW_SALES_CHART',
  VIEW_ORDERS_CHART: 'VIEW_ORDERS_CHART',
  VIEW_RESERVATIONS_CHART: 'VIEW_RESERVATIONS_CHART',
  VIEW_STAFF_CHART: 'VIEW_STAFF_CHART',
  VIEW_INVENTORY_CHART: 'VIEW_INVENTORY_CHART',
  VIEW_POPULAR_ITEMS_CHART: 'VIEW_POPULAR_ITEMS_CHART'
};

interface MetricCard {
  title: string;
  value: string | number;
  icon: string;
  trend?: number;
  trendUp?: boolean;
  color: string;
  link?: string;
  permission: string; // Add permission field to each metric card
}

interface TableReservation {
  id: string;
  customerName: string;
  time: string;
  date: string;
  guests: number;
  tableNumber?: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  specialRequests?: string;
  phoneNumber?: string;
}

interface Order {
  id: string;
  tableNumber?: number;
  customerName: string;
  items: OrderItem[];
  status: 'new' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  timestamp: Date;
  estimatedCompletionTime?: Date;
  specialInstructions?: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  assignedTo?: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  special?: string;
  category?: string;
  preparationTime?: number;
  status?: 'pending' | 'preparing' | 'completed';
  dietaryNotes?: string[];
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'on-break' | 'off-duty';
  image?: string;
  performance?: number;
  shift?: {start: string, end: string};
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  status: 'ok' | 'low' | 'critical' | 'overstocked';
  lastUpdated: Date;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    fill?: boolean;
    tension?: number;
  }[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0
      })),
      transition('void <=> *', animate('400ms ease-in-out')),
    ]),
    trigger('slideInOut', [
      state('void', style({
        transform: 'translateY(20px)',
        opacity: 0
      })),
      transition('void <=> *', animate('400ms ease-out')),
    ]),
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0',
        overflow: 'hidden',
        opacity: 0
      })),
      state('expanded', style({
        height: '*',
        opacity: 1
      })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out'))
    ])
  ]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  // View children for charts
  @ViewChild('salesChart') salesChartRef!: ElementRef;
  @ViewChild('ordersChart') ordersChartRef!: ElementRef;
  @ViewChild('reservationsChart') reservationsChartRef!: ElementRef;
  @ViewChild('staffPerformanceChart') staffPerformanceChartRef!: ElementRef;
  @ViewChild('inventoryChart') inventoryChartRef!: ElementRef;
  @ViewChild('popularItemsChart') popularItemsChartRef!: ElementRef;
  
  // User information
  currentUser: any;
  userRole = UserRole.CUSTOMER; // Still keep role for backward compatibility
  apiUrl = environment.imageUrl;
  
  // Dashboard state
  loading = true;
  timeOfDay = '';
  currentTime = new Date();
  currentDate = new Date();
  isDarkMode = false;
  dashboardReady = false;
  charts: {[key: string]: Chart} = {};
  
  // Metrics and data
  metricCards: MetricCard[] = [];
  reservations: TableReservation[] = [];
  pendingOrders: Order[] = [];
  activeOrders: Order[] = [];
  completedOrders: Order[] = [];
  staffMembers: StaffMember[] = [];
  inventoryItems: InventoryItem[] = [];
  
  // UI state
  expandedSections: {[key: string]: boolean} = {
    metrics: true,
    orderQueue: true,
    reservations: true,
    inventory: true,
    staff: true,
    analytics: true
  };
  
  // User forms
  reservationForm: FormGroup;
  feedbackForm: FormGroup;
  orderFilterForm: FormGroup;
  
  // Helper properties
  Math = Math;
  totalSales = 0;
  dailySales = 0;
  weeklyReservations = 0;
  pendingReservations = 0;
  lowStockItems = 0;
  
  // Export permissions for template usage
  permissions = PERMISSIONS;
  
  // Event handling
  private resizeSubject = new Subject<void>();
  private destroy$ = new Subject<void>();
  private subscriptions: Subscription[] = [];
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private elementRef: ElementRef
  ) {
    // Initialize Chart.js
    Chart.register(...registerables);
    
    // Initialize forms
    this.reservationForm = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
      guests: [2, [Validators.required, Validators.min(1), Validators.max(20)]],
      name: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      specialRequests: ['']
    });
    
    this.feedbackForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', Validators.required],
      visitDate: ['', Validators.required]
    });
    
    this.orderFilterForm = this.fb.group({
      status: ['all'],
      dateRange: ['today'],
      orderType: ['all']
    });
  }

  ngOnInit(): void {
    // Set time of day greeting
    this.setTimeOfDay();
    
    // Subscribe to authentication service to get current user info
    this.subscriptions.push(
      this.authService.user$.subscribe(user => {
        if (user) {
          this.currentUser = user;
          // Set role based on user permissions (keep for backward compatibility)
          this.determineUserRole();
          // Load dashboard data regardless of role - we'll use permissions to control visibility
          this.loadDashboardData();
        } else {
          this.router.navigate(['/login']);
        }
      })
    );
    
    // Handle screen resize events for responsive charts
    this.resizeSubject.pipe(
      debounceTime(200),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.resizeCharts();
    });
    
    // Setup demo data for the dashboard
    this.setupDemoData();
    
    // Check if dark mode preference exists
    const darkModePref = localStorage.getItem('dashboardDarkMode');
    if (darkModePref === 'true') {
      this.toggleDarkMode(true);
    }
    
    // Set loading state to false
    setTimeout(() => {
      this.loading = false;
      setTimeout(() => {
        this.dashboardReady = true;
      }, 200);
    }, 1500);
  }
  
  ngAfterViewInit(): void {
    // Initialize charts after view has initialized
    setTimeout(() => {
      this.initializeCharts();
    }, 200);
  }
  
  @HostListener('window:resize')
  onResize() {
    this.resizeSubject.next();
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions and destroy charts
    this.destroy$.next();
    this.destroy$.complete();
    
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Destroy all chart instances
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
  }
  
  // Permission check method
  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }
  
  // Helper methods
  determineUserRole(): void {
    // Keep for backward compatibility
    // In a real app, this would be determined from user permissions
    if (this.currentUser.roleName) {
      const roleName = this.currentUser.roleName.toUpperCase();
      if (Object.values(UserRole).includes(roleName as UserRole)) {
        this.userRole = roleName as UserRole;
      }
    } else if (this.currentUser.permissionDtoSet) {
      // More complex permission-based role determination
      const permissions = this.currentUser.permissionDtoSet.map((p: any) => p.permissionCode);
      
      if (permissions.includes('MANAGE_ALL_LOCATIONS')) {
        this.userRole = UserRole.SUPERADMIN;
      } else if (permissions.includes('MANAGE_SYSTEM_CONFIG')) {
        this.userRole = UserRole.ADMIN;
      } else if (permissions.includes('VIEW_REPORTS')) {
        this.userRole = UserRole.MANAGER;
      } else if (permissions.includes('MANAGE_ORDERS')) {
        this.userRole = UserRole.CASHIER;
      } else if (permissions.includes('KITCHEN_ACCESS')) {
        this.userRole = UserRole.CHEF;
      } else if (permissions.includes('BARTENDER_ACCESS')) {
        this.userRole = UserRole.BARTENDER;
      } else if (permissions.includes('SERVER_ACCESS')) {
        this.userRole = UserRole.SERVER;
      } else {
        this.userRole = UserRole.CUSTOMER;
      }
    }
  }
  
  setTimeOfDay(): void {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.timeOfDay = 'Morning';
    } else if (hour < 17) {
      this.timeOfDay = 'Afternoon';
    } else {
      this.timeOfDay = 'Evening';
    }
  }
  
  toggleDarkMode(value?: boolean): void {
    this.isDarkMode = value !== undefined ? value : !this.isDarkMode;
    
    // Save preference
    localStorage.setItem('dashboardDarkMode', this.isDarkMode.toString());
    
    // Apply dark mode class to component
    if (this.isDarkMode) {
      this.elementRef.nativeElement.classList.add('dark-mode');
    } else {
      this.elementRef.nativeElement.classList.remove('dark-mode');
    }
    
    // Recreate charts with new theme
    this.updateChartsTheme();
  }
  
  toggleSection(section: string): void {
    this.expandedSections[section] = !this.expandedSections[section];
    
    // Trigger resize event to redraw charts if necessary
    if (section === 'analytics' && this.expandedSections[section]) {
      setTimeout(() => {
        this.resizeCharts();
      }, 300);
    }
  }
  
  // Dashboard data loading and initialization
  loadDashboardData(): void {
    // Load all possible dashboard data regardless of role
    // We'll use permissions to control visibility in the template
    this.setupAllMetrics();
    
    // Compute all dashboard metrics
    this.calculateMetrics();
  }
  
  setupDemoData(): void {
    // Generate realistic demo data
    this.setupReservations();
    this.setupOrders();
    this.setupInventory();
    this.setupStaff();
    
    // Calculate summary metrics
    this.calculateMetrics();
  }
  
  initializeCharts(): void {
    const fontFamily = "'Montserrat', sans-serif";
    const textColor = this.isDarkMode ? '#e1e1e1' : '#333';
    const gridColor = this.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Common chart options
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            font: {
              family: fontFamily,
              size: 12
            },
            color: textColor
          }
        },
        tooltip: {
          titleFont: {
            family: fontFamily,
            size: 14
          },
          bodyFont: {
            family: fontFamily,
            size: 13
          },
          backgroundColor: this.isDarkMode ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          titleColor: this.isDarkMode ? '#fff' : '#333',
          bodyColor: this.isDarkMode ? '#e1e1e1' : '#555',
          borderColor: this.isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          padding: 10,
          boxPadding: 5,
          usePointStyle: true
        }
      },
      scales: {
        x: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor,
            font: {
              family: fontFamily
            }
          }
        },
        y: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor,
            font: {
              family: fontFamily
            }
          }
        }
      },
      animation: {
        duration: 1000
      }
    };
    
    // Initialize charts if the elements exist and user has permission
    
    // ===== ANALYTICS SECTION CHARTS =====
    // Sales Chart - only initialize if user has permission
    if (this.hasPermission(PERMISSIONS.VIEW_SALES_CHART) && this.salesChartRef) {
      const salesCanvas = this.salesChartRef.nativeElement.getContext('2d');
      this.charts['sales'] = new Chart(salesCanvas, {
        type: 'line',
        data: this.getSalesChartData(),
        options: {
          ...chartOptions,
          plugins: {
            ...chartOptions.plugins,
            title: {
              display: true,
              text: 'Daily Sales',
              font: {
                family: fontFamily,
                size: 16,
                weight: 'bold'
              },
              color: textColor,
              padding: {
                top: 10,
                bottom: 20
              }
            }
          }
        }
      });
    }
    
    // Reservations Chart
    if (this.hasPermission(PERMISSIONS.VIEW_RESERVATIONS_CHART) && this.reservationsChartRef) {
      const reservationsCanvas = this.reservationsChartRef.nativeElement.getContext('2d');
      this.charts['reservations'] = new Chart(reservationsCanvas, {
        type: 'bar',
        data: this.getReservationsChartData(),
        options: chartOptions
      });
    }
    
    // Staff Performance Chart
    if (this.hasPermission(PERMISSIONS.VIEW_STAFF_CHART) && this.staffPerformanceChartRef) {
      const staffCanvas = this.staffPerformanceChartRef.nativeElement.getContext('2d');
      this.charts['staff'] = new Chart(staffCanvas, {
        type: 'radar',
        data: this.getStaffPerformanceData(),
        options: {
          ...chartOptions,
          elements: {
            line: {
              borderWidth: 3
            }
          }
        }
      });
    }
    
    // Orders Chart
    if (this.hasPermission(PERMISSIONS.VIEW_ORDERS_CHART) && this.ordersChartRef) {
      const ordersCanvas = this.ordersChartRef.nativeElement.getContext('2d');
      this.charts['orders'] = new Chart(ordersCanvas, {
        type: 'doughnut',
        data: this.getOrdersChartData(),
        options: {
          ...chartOptions,
          cutout: '70%'
        }
      });
    }
    
    // Inventory Chart
    if (this.hasPermission(PERMISSIONS.VIEW_INVENTORY_CHART) && this.inventoryChartRef) {
      const inventoryCanvas = this.inventoryChartRef.nativeElement.getContext('2d');
      this.charts['inventory'] = new Chart(inventoryCanvas, {
        type: 'polarArea',
        data: this.getInventoryChartData(),
        options: chartOptions
      });
    }
    
    // Popular Items Chart
    if (this.hasPermission(PERMISSIONS.VIEW_POPULAR_ITEMS_CHART) && this.popularItemsChartRef) {
      const itemsCanvas = this.popularItemsChartRef.nativeElement.getContext('2d');
      this.charts['popularItems'] = new Chart(itemsCanvas, {
        type: 'bar',
        data: this.getPopularItemsData(),
        options: {
          ...chartOptions,
          indexAxis: 'y'
        }
      });
    }
    
    // ===== SALES DASHBOARD SECTION CHARTS =====
    if (this.hasPermission(PERMISSIONS.VIEW_SALES_DASHBOARD) && this.hasPermission(PERMISSIONS.VIEW_SALES_CHART)) {
      const salesDashboardCanvas = document.getElementById('salesDashboardChart') as HTMLCanvasElement;
      if (salesDashboardCanvas) {
        this.charts['salesDashboard'] = new Chart(salesDashboardCanvas, {
          type: 'line',
          data: this.getSalesChartData(),
          options: chartOptions
        });
      }
      
      const salesReservationsCanvas = document.getElementById('salesDashboardReservationsChart') as HTMLCanvasElement;
      if (salesReservationsCanvas && this.hasPermission(PERMISSIONS.VIEW_RESERVATIONS_CHART)) {
        this.charts['salesDashboardReservations'] = new Chart(salesReservationsCanvas, {
          type: 'bar',
          data: this.getReservationsChartData(),
          options: chartOptions
        });
      }
      
      const salesStaffCanvas = document.getElementById('salesDashboardStaffChart') as HTMLCanvasElement;
      if (salesStaffCanvas && this.hasPermission(PERMISSIONS.VIEW_STAFF_CHART)) {
        this.charts['salesDashboardStaff'] = new Chart(salesStaffCanvas, {
          type: 'radar',
          data: this.getStaffPerformanceData(),
          options: {
            ...chartOptions,
            elements: {
              line: {
                borderWidth: 3
              }
            }
          }
        });
      }
      
      const salesInventoryCanvas = document.getElementById('salesDashboardInventoryChart') as HTMLCanvasElement;
      if (salesInventoryCanvas && this.hasPermission(PERMISSIONS.VIEW_INVENTORY_CHART)) {
        this.charts['salesDashboardInventory'] = new Chart(salesInventoryCanvas, {
          type: 'polarArea',
          data: this.getInventoryChartData(),
          options: chartOptions
        });
      }
    }
    
    // ===== BUSINESS INTELLIGENCE SECTION CHARTS =====
    if (this.hasPermission(PERMISSIONS.VIEW_BUSINESS_INTELLIGENCE)) {
      // Multi-Location Performance
      const biMultiLocationCanvas = document.getElementById('biMultiLocationChart') as HTMLCanvasElement;
      if (biMultiLocationCanvas && this.hasPermission(PERMISSIONS.VIEW_SALES_CHART)) {
        this.charts['biMultiLocation'] = new Chart(biMultiLocationCanvas, {
          type: 'line',
          data: {
            labels: ['Downtown', 'Uptown', 'Riverside', 'Eastside'],
            datasets: [
              {
                label: 'This Month',
                data: [58750, 42180, 28950, 12970],
                borderColor: '#e74c3c',
                backgroundColor: ['rgba(231, 76, 60, 0.1)'],
                fill: true,
                tension: 0.4
              },
              {
                label: 'Last Month',
                data: [52200, 38900, 25100, 14500],
                borderColor: '#3498db',
                backgroundColor: ['rgba(52, 152, 219, 0.1)'],
                fill: true,
                tension: 0.4
              }
            ]
          },
          options: chartOptions
        });
      }
      
      // Customer Demographics
      const biDemographicsCanvas = document.getElementById('biDemographicsChart') as HTMLCanvasElement;
      if (biDemographicsCanvas && this.hasPermission(PERMISSIONS.VIEW_ORDERS_CHART)) {
        this.charts['biDemographics'] = new Chart(biDemographicsCanvas, {
          type: 'doughnut',
          data: {
            labels: ['18-25', '26-35', '36-45', '46-55', '56+'],
            datasets: [
              {
                label: 'Customer Age Groups',
                data: [15, 30, 25, 20, 10],
                backgroundColor: [
                  'rgba(46, 204, 113, 0.7)',
                  'rgba(52, 152, 219, 0.7)',
                  'rgba(155, 89, 182, 0.7)',
                  'rgba(241, 196, 15, 0.7)',
                  'rgba(230, 126, 34, 0.7)'
                ]
              }
            ]
          },
          options: {
            ...chartOptions,
            cutout: '50%'
          }
        });
      }
      
      // Seasonal Trends
      const biSeasonalTrendsCanvas = document.getElementById('biSeasonalTrendsChart') as HTMLCanvasElement;
      if (biSeasonalTrendsCanvas && this.hasPermission(PERMISSIONS.VIEW_RESERVATIONS_CHART)) {
        this.charts['biSeasonalTrends'] = new Chart(biSeasonalTrendsCanvas, {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
              {
                label: 'Reservations',
                data: [350, 380, 460, 520, 590, 650, 680, 720, 560, 480, 420, 390],
                borderColor: '#8e44ad',
                backgroundColor: ['rgba(155, 89, 182, 0.1)'],
                fill: true,
                tension: 0.4
              }
            ]
          },
          options: chartOptions
        });
      }
      
      // Menu Popularity
      const biMenuPopularityCanvas = document.getElementById('biMenuPopularityChart') as HTMLCanvasElement;
      if (biMenuPopularityCanvas && this.hasPermission(PERMISSIONS.VIEW_POPULAR_ITEMS_CHART)) {
        this.charts['biMenuPopularity'] = new Chart(biMenuPopularityCanvas, {
          type: 'bar',
          data: this.getPopularItemsData(),
          options: {
            ...chartOptions,
            indexAxis: 'y'
          }
        });
      }
    }
  }
  
  updateChartsTheme(): void {
    // Destroy and recreate charts with new theme
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key].destroy();
      }
    });
    
    // Reinitialize charts
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }
  
  resizeCharts(): void {
    // Update chart sizes on window resize
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.resize();
      }
    });
  }
  
  // Chart data methods
  getSalesChartData(): ChartData {
    return {
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      datasets: [
        {
          label: 'This Week',
          data: [4200, 3800, 5100, 5800, 7200, 8500, 6900],
          borderColor: '#e74c3c',
          backgroundColor: ['rgba(231, 76, 60, 0.1)'],
          fill: true,
          tension: 0.4
        },
        {
          label: 'Last Week',
          data: [3900, 3600, 4800, 5500, 6800, 7900, 6500],
          borderColor: '#3498db',
          backgroundColor: ['rgba(52, 152, 219, 0.1)'],
          fill: true,
          tension: 0.4
        }
      ]
    };
  }
  
  getReservationsChartData(): ChartData {
    return {
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      datasets: [
        {
          label: 'Reservations',
          data: [12, 19, 15, 22, 35, 48, 42],
          backgroundColor: ['rgba(155, 89, 182, 0.7)'],
        }
      ]
    };
  }
  
  getOrdersChartData(): ChartData {
    return {
      labels: ['Dine-in', 'Takeaway', 'Delivery'],
      datasets: [
        {
          label: 'Orders by Type',
          data: [45, 30, 25],
          backgroundColor: [
            'rgba(46, 204, 113, 0.7)',
            'rgba(52, 152, 219, 0.7)',
            'rgba(231, 76, 60, 0.7)'
          ]
        }
      ]
    };
  }
  
  getStaffPerformanceData(): ChartData {
    return {
      labels: ['Service Speed', 'Customer Rating', 'Attendance', 'Order Accuracy', 'Team Collaboration', 'Upselling'],
      datasets: [
        {
          label: 'Target',
          data: [80, 80, 80, 80, 80, 80],
          borderColor: 'rgba(231, 76, 60, 0.3)',
          backgroundColor: ['rgba(231, 76, 60, 0.1)'],
        },
        {
          label: 'Current',
          data: [75, 85, 70, 90, 80, 65],
          borderColor: '#3498db',
          backgroundColor: ['rgba(52, 152, 219, 0.2)'],
        }
      ]
    };
  }
  
  getInventoryChartData(): ChartData {
    return {
      labels: ['Proteins', 'Produce', 'Dairy', 'Dry Goods', 'Beverages', 'Desserts'],
      datasets: [
        {
          label: 'Inventory Levels',
          data: [65, 75, 80, 85, 90, 70],
          backgroundColor: [
            'rgba(231, 76, 60, 0.7)',
            'rgba(46, 204, 113, 0.7)',
            'rgba(241, 196, 15, 0.7)',
            'rgba(52, 152, 219, 0.7)',
            'rgba(155, 89, 182, 0.7)',
            'rgba(230, 126, 34, 0.7)'
          ]
        }
      ]
    };
  }
  
  getPopularItemsData(): ChartData {
    return {
      labels: ['Filet Mignon', 'Lobster Bisque', 'Truffle Risotto', 'Wagyu Burger', 'Chocolate Soufflé'],
      datasets: [
        {
          label: 'Orders This Week',
          data: [120, 90, 85, 110, 95],
          backgroundColor: ['rgba(52, 152, 219, 0.7)']
        }
      ]
    };
  }
  
  // Setup ALL possible metrics regardless of role
  setupAllMetrics(): void {
    // We're loading all possible metrics, but we'll check permissions in the template
    this.metricCards = [];
    
    // Customer metrics
    this.metricCards.push(
      {
        title: 'Loyalty Points',
        value: '450',
        icon: 'fa-medal',
        color: 'gold',
        link: '/loyalty',
        permission: PERMISSIONS.VIEW_LOYALTY_POINTS
      },
      {
        title: 'Recent Orders',
        value: '3',
        icon: 'fa-receipt',
        color: 'teal',
        link: '/orders',
        permission: PERMISSIONS.VIEW_RECENT_ORDERS
      },
      {
        title: 'Next Reservation',
        value: 'May 22',
        icon: 'fa-calendar-check',
        color: 'purple',
        link: '/reservations',
        permission: PERMISSIONS.VIEW_RESERVATIONS
      },
      {
        title: 'Rewards Available',
        value: '2',
        icon: 'fa-gift',
        color: 'orange',
        link: '/rewards',
        permission: PERMISSIONS.VIEW_REWARDS
      }
    );
    
    // Chef metrics
    this.metricCards.push(
      {
        title: 'Active Orders',
        value: this.getActiveOrdersCount(),
        icon: 'fa-utensils',
        color: 'red',
        link: '/orders',
        permission: PERMISSIONS.VIEW_ACTIVE_ORDERS
      },
      {
        title: 'Avg Preparation Time',
        value: '24 min',
        icon: 'fa-clock',
        color: 'blue',
        trend: -2,
        trendUp: false,
        permission: PERMISSIONS.VIEW_PREPARATION_METRICS
      },
      {
        title: 'Low Stock Items',
        value: this.getLowStockItemsCount(),
        icon: 'fa-exclamation-triangle',
        color: 'orange',
        link: '/inventory',
        permission: PERMISSIONS.VIEW_INVENTORY_ALERTS
      },
      {
        title: 'Completed Today',
        value: this.getCompletedOrdersCount(),
        icon: 'fa-check-circle',
        color: 'green',
        trend: 5,
        trendUp: true,
        permission: PERMISSIONS.VIEW_COMPLETED_ORDERS
      }
    );
    
    // Cashier metrics
    this.metricCards.push(
      {
        title: 'Today\'s Sales',
        value: `$${this.dailySales.toLocaleString()}`,
        icon: 'fa-cash-register',
        color: 'green',
        trend: 7.5,
        trendUp: true,
        permission: PERMISSIONS.VIEW_SALES_METRICS
      },
      {
        title: 'Pending Orders',
        value: this.getPendingOrdersCount(),
        icon: 'fa-clock',
        color: 'blue',
        link: '/orders',
        permission: PERMISSIONS.VIEW_PENDING_ORDERS
      },
      {
        title: 'Avg Transaction',
        value: '$68.50',
        icon: 'fa-credit-card',
        color: 'purple',
        trend: 2.3,
        trendUp: true,
        permission: PERMISSIONS.VIEW_TRANSACTIONS
      },
      {
        title: 'Cash Balance',
        value: '$1,250.00',
        icon: 'fa-money-bill-wave',
        color: 'gold',
        link: '/cash-drawer',
        permission: PERMISSIONS.VIEW_CASH_DRAWER
      }
    );
    
    // Server metrics
    this.metricCards.push(
      {
        title: 'Active Tables',
        value: '5/8',
        icon: 'fa-chair',
        color: 'blue',
        link: '/tables',
        permission: PERMISSIONS.VIEW_TABLE_LAYOUT
      },
      {
        title: 'Order Ready',
        value: this.getReadyOrdersCount(),
        icon: 'fa-bell',
        color: 'orange',
        link: '/orders',
        permission: PERMISSIONS.VIEW_SERVER_ORDERS
      },
      {
        title: 'Tips Today',
        value: '$125',
        icon: 'fa-comment-dollar',
        color: 'green',
        trend: 15,
        trendUp: true,
        permission: PERMISSIONS.VIEW_SERVER_ORDERS
      },
      {
        title: 'Customer Satisfaction',
        value: '94%',
        icon: 'fa-smile',
        color: 'gold',
        trend: 2,
        trendUp: true,
        permission: PERMISSIONS.VIEW_CUSTOMER_NOTES
      }
    );
    
    // Bartender metrics
    this.metricCards.push(
      {
        title: 'Drink Orders',
        value: '18',
        icon: 'fa-glass-martini-alt',
        color: 'blue',
        link: '/drinks',
        permission: PERMISSIONS.VIEW_DRINK_QUEUE
      },
      {
        title: 'Open Tabs',
        value: '7',
        icon: 'fa-clipboard-list',
        color: 'purple',
        link: '/tabs',
        permission: PERMISSIONS.VIEW_OPEN_TABS
      },
      {
        title: 'Low Stock Spirits',
        value: '3',
        icon: 'fa-wine-bottle',
        color: 'orange',
        link: '/inventory',
        permission: PERMISSIONS.VIEW_INVENTORY_ALERTS
      },
      {
        title: 'Popular Cocktail',
        value: 'Mojito',
        icon: 'fa-cocktail',
        color: 'teal',
        permission: PERMISSIONS.VIEW_COCKTAIL_RECIPES
      }
    );
    
    // Manager metrics
    this.metricCards.push(
      {
        title: 'Today\'s Revenue',
        value: `$${this.dailySales.toLocaleString()}`,
        icon: 'fa-chart-line',
        color: 'green',
        trend: 12,
        trendUp: true,
        link: '/reports/sales',
        permission: PERMISSIONS.VIEW_SALES_DASHBOARD
      },
      {
        title: 'Today\'s Reservations',
        value: this.pendingReservations,
        icon: 'fa-calendar-alt',
        color: 'blue',
        trend: 5,
        trendUp: true,
        link: '/reservations',
        permission: PERMISSIONS.VIEW_RESERVATIONS_OVERVIEW
      },
      {
        title: 'Staff On Duty',
        value: `${this.getActiveStaffCount()}/${this.getStaffCount()}`,
        icon: 'fa-users',
        color: 'purple',
        link: '/staff',
        permission: PERMISSIONS.VIEW_STAFF_METRICS
      },
      {
        title: 'Low Stock Alerts',
        value: this.getLowStockItemsCount(),
        icon: 'fa-exclamation-triangle',
        color: 'orange',
        link: '/inventory',
        permission: PERMISSIONS.VIEW_INVENTORY_MANAGEMENT
      }
    );
    
    // Admin metrics
    this.metricCards.push(
      {
        title: 'Weekly Revenue',
        value: `$${this.totalSales.toLocaleString()}`,
        icon: 'fa-dollar-sign',
        color: 'green',
        trend: 8.5,
        trendUp: true,
        link: '/reports',
        permission: PERMISSIONS.VIEW_SYSTEM_OVERVIEW
      },
      {
        title: 'Active Users',
        value: '24',
        icon: 'fa-user-check',
        color: 'blue',
        trend: 3,
        trendUp: true,
        link: '/users',
        permission: PERMISSIONS.VIEW_SYSTEM_OVERVIEW
      },
      {
        title: 'System Health',
        value: '98%',
        icon: 'fa-heartbeat',
        color: 'red',
        link: '/system',
        permission: PERMISSIONS.VIEW_SYSTEM_OVERVIEW
      },
      {
        title: 'Pending Issues',
        value: '3',
        icon: 'fa-exclamation-circle',
        color: 'orange',
        link: '/issues',
        permission: PERMISSIONS.VIEW_SYSTEM_OVERVIEW
      }
    );
    
    // Superadmin metrics
    this.metricCards.push(
      {
        title: 'All Locations Revenue',
        value: '$142,850',
        icon: 'fa-building',
        color: 'gold',
        trend: 15,
        trendUp: true,
        link: '/multi-location',
        permission: PERMISSIONS.VIEW_MULTI_LOCATION
      },
      {
        title: 'Total Active Users',
        value: '156',
        icon: 'fa-users-cog',
        color: 'blue',
        trend: 12,
        trendUp: true,
        link: '/users',
        permission: PERMISSIONS.VIEW_MULTI_LOCATION
      },
      {
        title: 'Top Location',
        value: 'Downtown',
        icon: 'fa-trophy',
        color: 'green',
        link: '/locations',
        permission: PERMISSIONS.VIEW_MULTI_LOCATION
      },
      {
        title: 'System Alerts',
        value: '2',
        icon: 'fa-bell',
        color: 'orange',
        link: '/alerts',
        permission: PERMISSIONS.VIEW_MULTI_LOCATION
      }
    );
  }
  
  // Demo data setup methods
  setupReservations(): void {
    // Create realistic reservation demo data
    const statuses: ('confirmed' | 'pending' | 'cancelled' | 'completed')[] = ['confirmed', 'pending', 'cancelled', 'completed'];
    const names = ['John Smith', 'Emma Wilson', 'Michael Brown', 'Sophia Davis', 'James Miller', 'Olivia Garcia', 'Daniel Martinez', 'Ava Rodriguez', 'David Hernandez', 'Mia Lopez'];
    
    for (let i = 0; i < 20; i++) {
      // Generate a random date within next 7 days
      const date = new Date();
      date.setDate(date.getDate() + Math.floor(Math.random() * 7));
      
      const hour = 12 + Math.floor(Math.random() * 9); // Between 12 PM and 9 PM
      const minutes = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
      
      const reservation: TableReservation = {
        id: `RES-${1000 + i}`,
        customerName: names[Math.floor(Math.random() * names.length)],
        date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: `${hour}:${minutes.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`,
        guests: 1 + Math.floor(Math.random() * 10),
        tableNumber: Math.floor(Math.random() * 20) + 1,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        specialRequests: Math.random() > 0.7 ? 'Window seat preferred' : undefined,
        phoneNumber: `(${100 + Math.floor(Math.random() * 900)}) ${100 + Math.floor(Math.random() * 900)}-${1000 + Math.floor(Math.random() * 9000)}`
      };
      
      this.reservations.push(reservation);
    }
    
    // Sort by date
    this.reservations.sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime());
  }
  
  setupOrders(): void {
    // Menu items for demo
    const menuItems = [
      { name: 'Filet Mignon', price: 42.99, category: 'Main' },
      { name: 'Lobster Bisque', price: 18.50, category: 'Starter' },
      { name: 'Truffle Risotto', price: 28.75, category: 'Main' },
      { name: 'Wagyu Burger', price: 26.99, category: 'Main' },
      { name: 'Chocolate Soufflé', price: 14.50, category: 'Dessert' },
      { name: 'Caesar Salad', price: 12.99, category: 'Starter' },
      { name: 'Seafood Paella', price: 38.50, category: 'Main' },
      { name: 'Crème Brûlée', price: 12.75, category: 'Dessert' },
      { name: 'Mojito', price: 14.50, category: 'Beverage' },
      { name: 'Old Fashioned', price: 16.00, category: 'Beverage' }
    ];
    
    const statuses: ('new' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled')[] = 
      ['new', 'preparing', 'ready', 'delivered', 'completed', 'cancelled'];
    
    const paymentStatuses: ('pending' | 'paid' | 'refunded')[] = ['pending', 'paid', 'refunded'];
    const orderTypes: ('dine-in' | 'takeaway' | 'delivery')[] = ['dine-in', 'takeaway', 'delivery'];
    const names = ['Alex Johnson', 'Taylor Smith', 'Jordan Lee', 'Casey Williams', 'Morgan Brown', 'Riley Davis', 'Avery Miller', 'Quinn Wilson', 'Jamie Garcia', 'Reese Martinez'];
    
    // Create 30 orders with different statuses
    for (let i = 0; i < 30; i++) {
      // Random order time within past 24 hours
      const orderTime = new Date();
      orderTime.setHours(orderTime.getHours() - Math.floor(Math.random() * 24));
      
      // Random number of items (1-5)
      const itemCount = 1 + Math.floor(Math.random() * 5);
      const items: OrderItem[] = [];
      let totalAmount = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
        const quantity = 1 + Math.floor(Math.random() * 3);
        const price = menuItem.price;
        
        items.push({
          name: menuItem.name,
          quantity: quantity,
          price: price,
          category: menuItem.category,
          status: Math.random() > 0.5 ? 'completed' : 'preparing',
          preparationTime: 5 + Math.floor(Math.random() * 20)
        });
        
        totalAmount += price * quantity;
      }
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const order: Order = {
        id: `ORD-${10000 + i}`,
        tableNumber: Math.random() > 0.3 ? Math.floor(Math.random() * 20) + 1 : undefined,
        customerName: names[Math.floor(Math.random() * names.length)],
        items: items,
        status: status,
        totalAmount: totalAmount,
        paymentStatus: status === 'completed' ? 'paid' : paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
        timestamp: orderTime,
        estimatedCompletionTime: new Date(orderTime.getTime() + 30 * 60000),
        orderType: orderTypes[Math.floor(Math.random() * orderTypes.length)],
        specialInstructions: Math.random() > 0.8 ? 'No onions please' : undefined
      };
      
      // Add to appropriate list based on status
      if (status === 'new' || status === 'preparing') {
        this.activeOrders.push(order);
      } else if (status === 'completed') {
        this.completedOrders.push(order);
      } else {
        this.pendingOrders.push(order);
      }
    }
    
    // Sort orders by timestamp
    this.activeOrders.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    this.pendingOrders.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    this.completedOrders.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  setupInventory(): void {
    const categories = ['Proteins', 'Produce', 'Dairy', 'Dry Goods', 'Beverages', 'Desserts'];
    const units = ['kg', 'lbs', 'oz', 'bottles', 'crates', 'packages', 'units'];
    const items = [
      'Ribeye Steak', 'Chicken Breast', 'Salmon Fillet', 'Tomatoes', 'Onions', 'Potatoes',
      'Heavy Cream', 'Butter', 'Cheese', 'Rice', 'Flour', 'Sugar', 'Red Wine', 'White Wine',
      'Vodka', 'Rum', 'Chocolate', 'Fresh Fruits', 'Herbs', 'Olive Oil'
    ];
    
    // Create 20 inventory items with different statuses
    for (let i = 0; i < 20; i++) {
      const currentStock = Math.floor(Math.random() * 100);
      const minThreshold = Math.floor(Math.random() * 20) + 10;
      let status: 'ok' | 'low' | 'critical' | 'overstocked' = 'ok';
      
      if (currentStock < minThreshold / 2) {
        status = 'critical';
      } else if (currentStock < minThreshold) {
        status = 'low';
      } else if (currentStock > minThreshold * 5) {
        status = 'overstocked';
      }
      
      // Last updated time random in the past 7 days
      const lastUpdated = new Date();
      lastUpdated.setDate(lastUpdated.getDate() - Math.floor(Math.random() * 7));
      
      const item: InventoryItem = {
        id: `INV-${1000 + i}`,
        name: items[i % items.length],
        category: categories[Math.floor(Math.random() * categories.length)],
        currentStock: currentStock,
        minThreshold: minThreshold,
        unit: units[Math.floor(Math.random() * units.length)],
        status: status,
        lastUpdated: lastUpdated
      };
      
      this.inventoryItems.push(item);
    }
    
    // Count low stock items
    this.lowStockItems = this.getLowStockItemsCount();
  }
  
  setupStaff(): void {
    const roles = ['Chef', 'Sous Chef', 'Line Cook', 'Server', 'Bartender', 'Host', 'Cashier', 'Manager'];
    const statuses: ('active' | 'on-break' | 'off-duty')[] = ['active', 'on-break', 'off-duty'];
    
    const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Susan', 'Richard', 'Jessica', 'Joseph', 'Sarah'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'];
    
    // Create 15 staff members
    for (let i = 0; i < 15; i++) {
      // Create shift times
      const startHour = 7 + Math.floor(Math.random() * 8);
      const endHour = startHour + 6 + Math.floor(Math.random() * 4);
      
      const shift = {
        start: `${startHour % 12 || 12}:00 ${startHour >= 12 ? 'PM' : 'AM'}`,
        end: `${endHour % 12 || 12}:00 ${endHour >= 12 ? 'PM' : 'AM'}`
      };
      
      const role = roles[Math.floor(Math.random() * roles.length)];
      
      const staffMember: StaffMember = {
        id: `EMP-${1000 + i}`,
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        role: role,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        performance: 70 + Math.floor(Math.random() * 30),
        shift: shift
      };
      
      this.staffMembers.push(staffMember);
    }
    
    // Sort by role
    this.staffMembers.sort((a, b) => a.role.localeCompare(b.role));
  }
  
  calculateMetrics(): void {
    // Calculate total sales from completed orders
    this.totalSales = this.completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Calculate daily sales (orders from today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.dailySales = this.completedOrders
      .filter(order => order.timestamp >= today)
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Calculate weekly reservations
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    this.weeklyReservations = this.reservations
      .filter(res => {
        const resDate = new Date(res.date);
        return resDate >= today && resDate <= oneWeekFromNow;
      }).length;
      
    // Calculate pending reservations
    this.pendingReservations = this.reservations
      .filter(res => res.status === 'pending' || res.status === 'confirmed').length;
  }
  
  // User actions
  placeOrder(): void {
    // Check permission
    if (this.hasPermission(PERMISSIONS.PLACE_ORDER)) {
      console.log('Place order');
      // Implementation for placing a new order
    }
  }
  
  makeReservation(): void {
    // Check permission
    if (this.hasPermission(PERMISSIONS.MAKE_RESERVATION) && this.reservationForm.valid) {
      console.log('Make reservation: ', this.reservationForm.value);
      // Implementation for making a new reservation
    }
  }
  
  submitFeedback(): void {
    // Check permission
    if (this.hasPermission(PERMISSIONS.SUBMIT_FEEDBACK) && this.feedbackForm.valid) {
      console.log('Submit feedback: ', this.feedbackForm.value);
      // Implementation for submitting feedback
    }
  }
  
  processPayment(order: Order): void {
    // Check permission
    if (this.hasPermission(PERMISSIONS.PROCESS_PAYMENTS)) {
      console.log('Process payment: ', order);
      // Implementation for processing a payment
    }
  }
  
  updateOrderStatus(order: Order, status: string): void {
    // Check permission
    if (this.hasPermission(PERMISSIONS.MANAGE_ORDERS)) {
      console.log(`Update order ${order.id} status to ${status}`);
      // Implementation for updating order status
    }
  }
  
  filterOrders(): void {
    console.log('Filter orders: ', this.orderFilterForm.value);
    // Implementation for filtering orders
  }
  
  // Methods for calculating counts - these were previously inline in the template or only calculated for specific roles
  getActiveOrdersCount(): number {
    return this.activeOrders.length;
  }
  
  getPendingOrdersCount(): number {
    return this.pendingOrders.length;
  }
  
  getCompletedOrdersCount(): number {
    return this.completedOrders.length;
  }
  
  getLowStockItemsCount(): number {
    return this.inventoryItems.filter(item => item.status === 'low' || item.status === 'critical').length;
  }
  
  getOkStockItemsCount(): number {
    return this.inventoryItems.filter(item => item.status === 'ok').length;
  }
  
  getCriticalStockItemsCount(): number {
    return this.inventoryItems.filter(item => item.status === 'critical').length;
  }
  
  getOverstockedItemsCount(): number {
    return this.inventoryItems.filter(item => item.status === 'overstocked').length;
  }
  
  getNewOrdersCount(): number {
    return this.activeOrders.filter(o => o.status === 'new').length;
  }
  
  getPreparingOrdersCount(): number {
    return this.activeOrders.filter(o => o.status === 'preparing').length;
  }
  
  getReadyOrdersCount(): number {
    return this.activeOrders.filter(o => o.status === 'ready').length;
  }
  
  getActiveStaffCount(): number {
    return this.staffMembers.filter(s => s.status === 'active').length;
  }
  
  getOnBreakStaffCount(): number {
    return this.staffMembers.filter(s => s.status === 'on-break').length;
  }
  
  getOffDutyStaffCount(): number {
    return this.staffMembers.filter(s => s.status === 'off-duty').length;
  }
  
  getStaffCount(): number {
    return this.staffMembers.length;
  }
  
  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).join('');
  }
}
