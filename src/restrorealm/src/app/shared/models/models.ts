export interface User {
    id: string;
    name: string;
    email: string;
    roleName: string;
    role?: string;
    profilePicture?: string;
    phoneNumber?: string;
    position?: string;
    department?: string;
    hireDate?: string;
    permissionDtoSet?: Permission[];
  }
  
  export interface Permission {
    id: string;
    permissionCode: string;
    description?: string;
  }
  
  export interface QuickStats {
    revenue: {
      today: number;
      week: number;
      month: number;
    };
    orders: {
      today: number;
      week: number;
      month: number;
      pending: number;
    };
    reservations: {
      today: number;
      week: number;
      upcoming: number;
    };
    customers: {
      new: number;
      total: number;
      active: number;
    };
  }
  
  export interface ChartDataset {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }
  
  export interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
  }
  
  export interface MenuItem {
    name: string;
    quantity: number;
    revenue: number;
  }
  
  export interface MenuPerformance {
    topSelling: MenuItem[];
    lowSelling: MenuItem[];
  }
  
  export interface Order {
    id: string;
    table: string;
    items: string[];
    time: string;
    waitTime?: string;
    priority?: 'high' | 'normal' | 'low';
    specialInstructions?: string;
    progress?: number;
    estimatedCompletion?: string;
    chef?: string;
    completedAt?: string;
    status?: string;
    timePlaced?: string;
    estimate?: string;
  }
  
  export interface InventoryItem {
    name: string;
    current: number;
    threshold: number;
    unit: string;
  }
  
  export interface ChefData {
    pendingOrders: Order[];
    preparingOrders: Order[];
    completedOrders: Order[];
    lowStockItems: InventoryItem[];
  }
  
  export interface Transaction {
    id: string;
    table: string;
    amount: number;
    time: string;
    status: string;
    paymentMethod: string;
    server: string;
  }
  
  export interface TableInfo {
    table: string;
    amount: number;
    status: string;
    server?: string;
    openTime?: string;
  }
  
  export interface Discount {
    code: string;
    description: string;
    type: 'percentage' | 'fixed';
    value: number;
    validUntil: string;
  }
  
  export interface CashierData {
    recentTransactions: Transaction[];
    openTables: TableInfo[];
    activeDiscounts: Discount[];
  }
  
  export interface Table {
    id: number;
    name: string;
    status: 'available' | 'occupied' | 'cleaning' | 'reserved';
    capacity: number;
    section: string;
    server?: string;
    occupiedSince?: string;
    order?: string;
  }
  
  export interface ServerData {
    tables: Table[];
    activeOrders: Order[];
  }
  
  export interface DrinkOrder {
    id: string;
    table: string;
    items: string[];
    time: string;
    priority: 'high' | 'normal' | 'low';
    notes?: string;
  }
  
  export interface Cocktail {
    name: string;
    count: number;
    percentage: number;
  }
  
  export interface BartenderData {
    drinkQueue: DrinkOrder[];
    popularCocktails: Cocktail[];
    lowStockBeverages: InventoryItem[];
  }
  
  export interface Notification {
    id: number;
    type: 'order' | 'reservation' | 'alert' | 'system';
    title: string;
    message: string;
    time: Date;
    read: boolean;
  }
  
  export interface DashboardPermissions {
    // User permissions
    canViewReservations: boolean;
    canCreateReservation: boolean;
    canViewOrders: boolean;
    canCreateOrder: boolean;
    canViewLoyalty: boolean;
    
    // Chef permissions
    canViewKitchen: boolean;
    canUpdateOrderStatus: boolean;
    canViewInventory: boolean;
    
    // Cashier permissions
    canProcessPayment: boolean;
    canApplyDiscount: boolean;
    canManageReceipts: boolean;
    
    // Server permissions
    canManageTables: boolean;
    canModifyOrders: boolean;
    
    // Bartender permissions
    canManageDrinks: boolean;
    canManageTabs: boolean;
    
    // Manager permissions
    canViewStaffing: boolean;
    canViewSales: boolean;
    canManageInventory: boolean;
    canViewReports: boolean;
    
    // Admin permissions
    canManageUsers: boolean;
    canManageMenu: boolean;
    canConfigureSystem: boolean;
    
    // Super Admin permissions
    canViewAllLocations: boolean;
    canManagePermissions: boolean;
  }
  