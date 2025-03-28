import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService, CartItem } from '../../core/services/cart/cart.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { OrderService } from '../../core/services/orders/order.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: [
    './checkout.component.css',
    './toast-notification.component.css',
  ]
})
export class CheckoutComponent implements OnInit {
  shippingInfo = {
    customerName: '' as string | undefined,
    street1: '' as string | undefined,
    street2: '' as string | undefined,
    city: '' as string | undefined,
    state: '' as string | undefined,
    postalCode: 0 as number | undefined,
    paymentMethod: 'credit'
  };
  
  // Enhanced experience properties
  cartItems: CartItem[] = [];
  deliveryFee = 0;
  estimatedTaxRate = 0.0825; // 8.25% tax rate
  promoCode = '';
  promoApplied = false;
  promoDiscount = 0;
  promoCodeVisible = false;
  
  // Toast notification properties
  toastVisible = false;
  toastMessage = '';
  toastType = 'success'; // 'success', 'error', 'info'
  toastTimeout: any = null;
  
  // Modal properties
  modalVisible = false;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private cartService: CartService,
  ) {}

  ngOnInit() {
    // Check if user is logged in
    if(!this.authService.isLoggedIn$) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/checkout' } 
      });
    } else {
      // Pre-fill user information
      const user = this.authService.getUserInfo();
      this.shippingInfo.customerName = user?.name;
      this.shippingInfo.street1 = user?.street1;
      this.shippingInfo.street2 = user?.street2;
      this.shippingInfo.city = user?.city;
      this.shippingInfo.state = user?.state;
      this.shippingInfo.postalCode = user?.postalCode;
    }
    
    // Load cart items
    this.loadCartItems();
    
    // Calculate delivery fee
    this.updateDeliveryFee();
  }
  
  // Load cart items for preview
  loadCartItems() {
    this.cartItems = this.cartService.getItems();
    
    // If cart is empty, redirect to cart page
    if (this.cartItems.length === 0) {
      this.router.navigate(['/cart']);
    }
  }
  
  // Update delivery fee based on subtotal
  updateDeliveryFee() {
    // Make delivery free if order is over $35, otherwise $5
    this.deliveryFee = this.calculateSubtotal() >= 35 ? 0 : 5;
  }
  
  // Calculate subtotal
  calculateSubtotal(): number {
    return this.cartService.getTotalPrice();
  }
  
  // Calculate tax
  calculateTax(): number {
    return this.calculateSubtotal() * this.estimatedTaxRate;
  }
  
  // Calculate total
  calculateTotal(): number {
    let total = this.calculateSubtotal() + this.calculateTax() + this.deliveryFee;
    
    // Apply promo discount if applicable
    if (this.promoApplied) {
      total -= this.promoDiscount;
    }
    
    return total;
  }
  
  // Select payment method
  selectPayment(method: string) {
    this.shippingInfo.paymentMethod = method;
  }
  
  // Toggle promo code input visibility
  togglePromoCodeVisibility() {
    this.promoCodeVisible = !this.promoCodeVisible;
  }
  
  // Apply promo code
  applyPromoCode() {
    if (!this.promoCode) return;
    
    // Simulate promo code validation
    if (this.promoCode.toUpperCase() === 'WELCOME10') {
      const subtotal = this.calculateSubtotal();
      this.promoDiscount = subtotal * 0.1; // 10% off
      this.promoApplied = true;
      
      // Show success message
      this.showToast('success', `Promo code applied successfully! You saved $${this.promoDiscount.toFixed(2)}`);
    } else if (this.promoCode.toUpperCase() === 'FREESHIP') {
      if (this.deliveryFee > 0) {
        this.promoDiscount = this.deliveryFee;
        this.deliveryFee = 0;
        this.promoApplied = true;
        
        // Show success message
        this.showToast('success', 'Free shipping applied!');
      } else {
        this.showToast('info', 'This order already qualifies for free shipping!');
      }
    } else {
      // Show error message
      this.showToast('error', 'Invalid promo code. Please try again.');
    }
    
    // Clear promo code input
    this.promoCode = '';
    this.promoCodeVisible = false;
  }
  
  // Estimate delivery time
  estimateDeliveryTime(): string {
    const now = new Date();
    const minDelivery = new Date(now.getTime() + 30 * 60000); // 30 minutes from now
    const maxDelivery = new Date(now.getTime() + 60 * 60000); // 60 minutes from now
    
    return `${this.formatTime(minDelivery)} - ${this.formatTime(maxDelivery)}`;
  }
  
  // Format time for delivery estimate
  private formatTime(date: Date): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutesStr} ${ampm}`;
  }
  
  // Generate random order number for display
  generateOrderNumber(): string {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  
  // Generate a random pastel color based on item ID for visual differentiation
  getRandomPastelColor(id: number): string {
    const hue = ((id * 83) % 360); // Use the ID to generate a repeatable hue
    return `hsl(${hue}, 70%, 80%)`;
  }
  
  submitOrder() {
    if (this.cartService.getTotalItems() === 0) {
      this.showToast('error', 'Your cart is empty');
      return;
    }
    
    this.modalVisible = true;
  }
  
  confirmOrder() {
    const orderData = {
      ...this.shippingInfo,
      orderItems: this.cartService.getPayload(),
      total: this.calculateTotal(),
      subtotal: this.calculateSubtotal(),
      tax: this.calculateTax(),
      deliveryFee: this.deliveryFee,
      promoDiscount: this.promoApplied ? this.promoDiscount : 0,
      orderNumber: this.generateOrderNumber(),
    };
    
    this.modalVisible = false;
    
    this.showToast('info', 'Processing your order...');
    
    this.orderService.createOrder(orderData).subscribe({
      next: (order) => {
        console.log('Order created:', order);
        
        this.showToast('success', 'Order placed successfully!');
        
        this.cartService.clearCart();
        
        setTimeout(() => {
          this.router.navigate(['/payment'], { 
            queryParams: { 
              orderId: order.orderId, 
              method: this.shippingInfo.paymentMethod,
              total: this.calculateTotal()
            } 
          }).then(navigationResult => {
            if (!navigationResult) {
              console.error('Navigation to payment failed');
              this.showToast('error', 'Could not proceed to payment');
            }
          });
        }, 1500);
      },
      error: (error) => {
        this.showToast('error', 'Failed to create order: ' + error.message);
      }
    });
  }
  
  showToast(type: 'success' | 'error' | 'info', message: string) {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    
    this.toastType = type;
    this.toastMessage = message;
    this.toastVisible = true;
    
    this.toastTimeout = setTimeout(() => {
      this.closeToast();
    }, 5000);
  }
  
  closeToast() {
    this.toastVisible = false;
  }
  
  closeModal(event?: MouseEvent) {
    if (event && event.target === event.currentTarget) {
      this.modalVisible = false;
    } else if (!event) {
      this.modalVisible = false;
    }
  }
  
  getPaymentMethodName(): string {
    switch (this.shippingInfo.paymentMethod) {
      case 'credit':
        return 'Credit Card';
      case 'debit':
        return 'Debit Card';
      case 'paypal':
        return 'PayPal';
      case 'cash':
        return 'Cash at Counter';
      default:
        return 'Credit Card';
    }
  }
}
