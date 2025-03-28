import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CartService } from '../../../core/services/cart/cart.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { OrderService } from '../../../core/services/orders/order.service';
import { of, forkJoin } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { Table } from '../../../shared/models/table.model';
import { User } from '../../../shared/models/user.model';
import { Order, OrderDetails } from '../../../shared/models/order.model';
import { UserService } from '../../../core/services/user/user.service';
import { ReservationService } from '../../../core/services/reservation/reservation.service';

interface ShippingInfo {
  customerName: string;
  phone: string;
  email: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  postalCode: number | undefined;
  paymentMethod: string;
}

@Component({
  selector: 'app-new-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-checkout.component.html',
  styleUrls: ['./new-checkout.component.css']
})
export class NewCheckoutComponent implements OnInit {
  shippingInfo: ShippingInfo = {
    customerName: '',
    phone: '',
    email: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    postalCode: undefined,
    paymentMethod: 'credit'
  };

  orderDetails: OrderDetails = {
    orderType: 'delivery',
    orderFor: 'self',
    tableId: 0,
    pickupTime: 'asap',
    customPickupTime: '',
    notes: '',
    reservationDate: this.getTodayDate(),
    reservationTime: '19:00',
    numberOfGuests: 2,
    specialRequests: ''
  };

  isAdmin = false;
  adminOrderFor: 'self' | 'customer' = 'self';
  selectedCustomerId: number | null = null;
  showNewCustomerForm = false;
  customersList: User[] = [];
  availableTables: Table[] = [];
  newCustomer: Partial<User> = {
    name: '',
    phone: '',
    email: ''
  };
  errorMessage = '';
  isSubmitting = false;
  
  minPickupTime = '';
  maxPickupTime = '';
  minReservationDate = '';
  
  reservationAvailable: boolean | null = null;
  alternativeTimes: string[] = [];

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private cartService: CartService,
    private reservationService: ReservationService
  ) {}

  ngOnInit() {
    if (!this.authService.getRefreshToken()) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/checkout' } 
      });
      return;
    }
    const refreshToken = this.authService.getRefreshToken();
    if (refreshToken) {
      this.isAdmin = this.authService.getUserInfo()?.roleName != 'User';
    } else {
      this.isAdmin = false;
    }
    
    this.setTimeConstraints();

    const user = this.authService.getUserInfo();
    if (user) {
      this.shippingInfo.customerName = user.name || '';
      this.shippingInfo.phone = user.phone || '';
      this.shippingInfo.email = user.email || '';
      this.shippingInfo.street1 = user.street1 || '';
      this.shippingInfo.street2 = user.street2 || '';
      this.shippingInfo.city = user.city || '';
      this.shippingInfo.state = user.state || '';
      this.shippingInfo.postalCode = user.postalCode;
    }

    if (this.isAdmin) {
      this.loadCustomersAndTables();
    }
    this.route.queryParams.subscribe(params => {
      if (params['date'] && params['time']) {
        this.orderDetails.orderType = 'dine-in';
        this.orderDetails.reservationDate = params['date'];
        this.orderDetails.reservationTime = params['time'];
        if (params['numGuests']) {
          this.orderDetails.numberOfGuests = +params['numGuests'];
        }
        this.checkTableAvailability();
      }
    });
  }

  setTimeConstraints() {
    const now = new Date();
    this.minPickupTime = now.toISOString().slice(0, 16);
    
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    this.maxPickupTime = maxDate.toISOString().slice(0, 16);
    
    this.minReservationDate = now.toISOString().split('T')[0];
  }
  
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadCustomersAndTables() {
    const [date, time] = new Date().toISOString().split("T");
    const timeFormatted: string = time.substring(0, 5);
    forkJoin({
      customers: this.userService.getAllUsers(),
      tables: this.reservationService.getAvailableTables(
        date, 
        timeFormatted, 
        1
      )
    }).subscribe({
      next: (result) => {
        this.customersList = result.customers;
        this.availableTables = result.tables;
      },
      error: (error) => {
        console.error('Failed to load admin data:', error);
        this.errorMessage = 'Could not load customers or tables. Please try again.';
      }
    });
  }

  updateOrderForSelection() {
    if (this.orderDetails.orderFor === 'self') {
      const user = this.authService.getUserInfo();
      if (user) {
        this.shippingInfo.customerName = user.name || '';
        this.shippingInfo.phone = user.phone || '';
        this.shippingInfo.email = user.email || '';
      } 
    } else if (this.orderDetails.orderFor === 'friend') {
      this.shippingInfo.customerName = '';
      this.shippingInfo.phone = '';
      this.shippingInfo.email = '';
    }
  }

  updateAdminOrderSelection() {
    if (this.adminOrderFor === 'self') {
      const user = this.authService.getUserInfo();
      if (user) {
        this.shippingInfo.customerName = user.name || '';
        this.shippingInfo.phone = user.phone || '';
        this.shippingInfo.email = user.email || '';
      }
      this.orderDetails.tableId = null;
    } else {
      this.selectedCustomerId = null;
      this.shippingInfo.customerName = '';
      this.shippingInfo.phone = '';
      this.shippingInfo.email = '';
      this.shippingInfo.street1 = '';
      this.shippingInfo.street2 = '';
      this.shippingInfo.city = '';
      this.shippingInfo.state = '';
      this.shippingInfo.postalCode = undefined;
    }
  }

  loadCustomerInfo() {
    if (!this.selectedCustomerId) return;

    this.userService.getUserById(this.selectedCustomerId).subscribe({
      next: (customer) => {
        console.log('Customer info:', customer);
        this.shippingInfo.customerName = customer.name;
        this.shippingInfo.phone = customer.phone;
        this.shippingInfo.email = customer.email;
        this.shippingInfo.street1 = customer.street1 || '';
        this.shippingInfo.street2 = customer.street2 || '';
        this.shippingInfo.city = customer.city || '';
        this.shippingInfo.state = customer.state || '';
        this.shippingInfo.postalCode = customer.postalCode;
      },
      error: (error) => {
        console.error('Failed to load customer info:', error);
        this.errorMessage = 'Could not load customer information. Please try again.';
      }
    });
  }

  saveNewCustomer() {
    if (!this.newCustomer.name || !this.newCustomer.phone || !this.newCustomer.email) {
      this.errorMessage = 'Please fill in all required customer fields.';
      return;
    }

    this.userService.createUser(this.newCustomer as User).subscribe({
      next: (customer) => {
        this.customersList.push(customer);
        this.selectedCustomerId = customer.id;
        this.showNewCustomerForm = false;
        this.loadCustomerInfo();
      },
      error: (error) => {
        console.error('Failed to create customer:', error);
        this.errorMessage = 'Could not create customer. Please try again.';
      }
    });
  }

  isPersonalInfoDisabled(): boolean {
    return (this.isAdmin && this.adminOrderFor === 'customer') || 
           (this.isAdmin && this.orderDetails.orderFor === 'self') || 
           (!this.isAdmin && this.orderDetails.orderFor === 'self');
  }
  
  checkTableAvailability() {
    if (!this.orderDetails.reservationDate || !this.orderDetails.reservationTime || !this.orderDetails.numberOfGuests) {
      this.errorMessage = 'Please enter all reservation details';
      return;
    }
    
    this.reservationService.getAvailableTables(
      this.orderDetails.reservationDate,
      this.orderDetails.reservationTime,
      this.orderDetails.numberOfGuests
    ).subscribe({
      next: (response) => {
        this.reservationAvailable = response.length > 0;
        // this.alternativeTimes = response.alternativeTimes || [];
        
        // if (!this.reservationAvailable) {
        //   console.log('No tables available. Alternative times:', response.alternativeTimes);
        // }
      },
      error: (error) => {
        console.error('Failed to check availability:', error);
        this.errorMessage = 'Could not check table availability. Please try again.';
        this.reservationAvailable = null;
      }
    });
  }
  
  selectAlternativeTime(time: string) {
    this.orderDetails.reservationTime = time;
    this.checkTableAvailability();
  }
  
  formatTime(time: string): string {
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      
      return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
      return time;
    }
  }

  submitOrder() {
    this.errorMessage = '';
    
    if (this.cartService.getTotalItems() === 0) {
      this.errorMessage = 'Your cart is empty';
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    const orderData: any = {
      ...this.shippingInfo,
      orderItems: this.cartService.getItems(),
      total: this.cartService.getTotalPrice(),
      orderNumber: this.generateOrderNumber(),
      orderType: this.orderDetails.orderType,
      notes: this.orderDetails.notes
    };

    if (this.orderDetails.orderType === 'pickup') {
      orderData.pickupTime = this.orderDetails.pickupTime === 'custom' 
        ? new Date(this.orderDetails.customPickupTime).toISOString()
        : this.orderDetails.pickupTime;
    }
    
    if (this.orderDetails.orderType === 'dine-in') {
      orderData.reservation = {
        date: this.orderDetails.reservationDate,
        time: this.orderDetails.reservationTime,
        numberOfGuests: this.orderDetails.numberOfGuests,
        specialRequests: this.orderDetails.specialRequests
      };
    }

    if (this.isAdmin && this.adminOrderFor === 'customer' && this.orderDetails.tableId) {
      orderData.tableId = this.orderDetails.tableId;
    } else if (!this.isAdmin && this.orderDetails.orderFor === 'friend') {
      orderData.tableId = 0; // or 1, depending on your system configuration
    }

    this.orderService.createOrder(orderData).subscribe({
      next: (order) => {
        console.log('Order created:', order);
        this.cartService.clearCart();
        this.router.navigate(['/payment'], { 
          queryParams: { 
            orderId: order.orderId, 
            method: this.shippingInfo.paymentMethod 
          }
        }).then(navigationResult => {
          if (!navigationResult) {
            console.error('Navigation to payment failed');
            this.errorMessage = 'Could not proceed to payment';
            this.isSubmitting = false;
          }
        });
      },
      error: (error) => {
        this.errorMessage = 'Failed to create order: ' + error.message;
        this.isSubmitting = false;
      }
    });
  }

  validateForm(): boolean {
    if (!this.shippingInfo.customerName) {
      this.errorMessage = 'Please enter a name';
      return false;
    }

    if (!this.shippingInfo.phone) {
      this.errorMessage = 'Please enter a phone number';
      return false;
    }

    if (!this.shippingInfo.email) {
      this.errorMessage = 'Please enter an email address';
      return false;
    }

    if (this.orderDetails.orderType === 'delivery') {
      if (!this.shippingInfo.street1 || !this.shippingInfo.city || 
          !this.shippingInfo.state || !this.shippingInfo.postalCode) {
        this.errorMessage = 'Please enter complete delivery address';
        return false;
      }
    }

    if (this.orderDetails.orderType === 'pickup' && 
        this.orderDetails.pickupTime === 'custom' && 
        !this.orderDetails.customPickupTime) {
      this.errorMessage = 'Please select a pickup time';
      return false;
    }
    
    if (this.orderDetails.orderType === 'dine-in') {
      if (!this.orderDetails.reservationDate || !this.orderDetails.reservationTime || !this.orderDetails.numberOfGuests) {
        this.errorMessage = 'Please enter complete reservation details';
        return false;
      }
      
      if (this.reservationAvailable === false) {
        this.errorMessage = 'Please select an available reservation time';
        return false;
      }
    }

    if (this.isAdmin && this.adminOrderFor === 'customer') {
      if (!this.selectedCustomerId && !this.showNewCustomerForm) {
        this.errorMessage = 'Please select a customer or create a new one';
        return false;
      }
    }

    return true;
  }

  generateOrderNumber(): string {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }
}
