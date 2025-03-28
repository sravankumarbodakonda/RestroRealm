import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart/cart.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { switchMap, catchError, take } from 'rxjs/operators';
import { of, Subscription, lastValueFrom } from 'rxjs';
import { OrderService } from '../../core/services/orders/order.service';
import { environment } from '../../../environments/environment';
import { OrderStatus } from '../../shared/enum/order-status.enum';
import { PaymentResponse } from './../../shared/models/payment-response.model';
import { Order } from '../../shared/models/order.model';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cardElement') cardElementRef!: ElementRef;
  @ViewChild('paypalButtonContainer') paypalButtonContainerRef!: ElementRef;

  paymentForm: FormGroup;
  stripe: any;
  cardElement: any;
  paypalButton: any;
  orderId!: number;
  orderDetails: Order = {} as Order; // Initialize as empty object
  paymentMethod: string | null = null;
  isProcessing = false;
  errorMessage = '';
  stripeElementLoaded = false;
  paypalLoaded = false;
  price = 0;
  
  // Toast notification properties
  toastVisible = false;
  toastMessage = '';
  toastType = 'success'; // 'success', 'error', 'info'
  toastTimeout: any = null;
  
  paymentMethods = [
    { id: 'credit', name: 'Credit Card', icon: 'credit_card' },
    { id: 'debit', name: 'Debit Card', icon: 'credit_card' },
    { id: 'paypal', name: 'PayPal', icon: 'account_balance_wallet' },
    { id: 'cash', name: 'Cash at Counter', icon: 'payments' }
  ];
  
  private subscriptions = new Subscription();

  constructor(
    private cartService: CartService,
    private router: Router,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private cdRef: ChangeDetectorRef,
    private orderService: OrderService
  ) {
    this.paymentForm = this.fb.group({
      cardholderName: ['', [Validators.required, Validators.maxLength(50)]]
    });
  }

  ngOnInit() {
    const routeSub = this.route.queryParams.pipe(
      switchMap(params => {
        this.paymentMethod = params['method'];
        this.orderId = params['orderId'];
        
        if (!this.orderId || !this.paymentMethod) {
          this.router.navigate(['/checkout']);
          return of(null);
        }

        return this.orderService.getOrder(this.orderId).pipe(
          catchError(() => {
            this.router.navigate(['/checkout']);
            return of(null);
          })
        );
      })
    ).subscribe(order => {
      if (!order) return;
      
      // Assign the entire order object to orderDetails
      this.orderDetails = order;
      
      // Set the price for payment processing
      this.price = this.orderDetails.totalAmount;
      
      // Check if payment is already successful
      if (order.payment?.status === 'succeeded' || order.payment?.status === 'CASHIER_PENDING') {
        this.router.navigate(['/order-confirmation', order.orderId]);
        return;
      }

      this.initializePayment();
    });
    
    this.subscriptions.add(routeSub);
  }

  ngAfterViewInit() {
    this.cdRef.detectChanges();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.cardElement) this.cardElement.destroy();
    if (this.paypalButton) this.paypalButton.close();
    
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  private initializePayment() {
    switch (this.paymentMethod) {
      case 'cash':
        break;
      case 'credit':
      case 'debit':
        this.initializeStripe();
        break;
      case 'paypal':
        this.initializePayPal();
        break;
      default:
        this.router.navigate(['/checkout']);
    }
  }

  private async initializeStripe() {
    try {
      await this.loadStripeScript();
      
      this.stripe = (window as any).Stripe(environment.stripeKey);
      const elements = this.stripe.elements();
      
      this.cardElement = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#32325d',
            fontFamily: 'Inter, sans-serif',
            '::placeholder': {
              color: '#aab7c4',
            },
            iconColor: '#FF6B35',
          },
          invalid: {
            color: '#EF476F',
            iconColor: '#EF476F',
          }
        }
      });

      if (this.cardElementRef?.nativeElement) {
        this.cardElement.mount(this.cardElementRef.nativeElement);
        
        this.cardElement.on('ready', () => {
          this.stripeElementLoaded = true;
          this.cdRef.detectChanges();
        });

        this.cardElement.on('change', (event: any) => {
          if (event.error) {
            this.errorMessage = event.error.message;
          } else {
            this.errorMessage = '';
          }
          this.cdRef.detectChanges();
        });
      }
    } catch (error) {
      console.error('Stripe initialization error:', error);
      this.showToast('error', 'Card payment unavailable. Please try another method.');
      this.cdRef.detectChanges();
    }
  }

  private async initializePayPal() {
    try {
      await this.loadPayPalScript();
      
      this.paypalLoaded = true;
      this.cdRef.detectChanges();

      this.paypalButton = (window as any).paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'pill',
          label: 'pay',
          height: 40
        },
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: this.orderDetails.totalAmount.toFixed(2),
                currency_code: 'USD'
              }
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          try {
            this.isProcessing = true;
            this.cdRef.detectChanges();
            const captureResult = await actions.order.capture();
            await this.processPaymentResult('paypal', {
              id: captureResult.id,
              success: captureResult.status === 'COMPLETED'
            });
          } catch (error) {
            this.handlePaymentError(error);
          }
        },
        onError: (error: any) => this.handlePaymentError(error)
      });

      if (this.paypalButtonContainerRef?.nativeElement) {
        this.paypalButton.render(this.paypalButtonContainerRef.nativeElement);
      }
    } catch (error) {
      this.handlePaymentError(error);
    }
  }

  private async loadStripeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Stripe) return resolve();
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Stripe script failed to load'));
      document.head.appendChild(script);
    });
  }

  private async loadPayPalScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).paypal) return resolve();
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypalClientId}&currency=USD`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('PayPal script failed to load'));
      document.head.appendChild(script);
    });
  }

  async processPayment() {
    if (!this.paymentForm.valid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isProcessing = true;
    this.cdRef.detectChanges();

    try {
      const { error, paymentMethod } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardElement,
        billing_details: {
          name: this.paymentForm.value.cardholderName
        }
      });

      if (error) throw error;

      await this.processPaymentResult(this.paymentMethod!, {
        id: paymentMethod.id,
        success: true
      });
    } catch (error) {
      this.handlePaymentError(error);
    }
  }

  confirmCashPayment() {
    this.isProcessing = true;
    this.showToast('info', 'Processing your payment...');
    this.processPaymentResult('cash', { id: `cash-${Date.now()}`, success: true })
      .catch(error => this.handlePaymentError(error));
  }

  private handlePaymentError(error: any) {
    console.error('Payment Error:', error);
    this.errorMessage = error.message || 'Payment processing failed. Please try again.';
    this.isProcessing = false;
    this.showToast('error', this.errorMessage);
    this.cdRef.detectChanges();
  }

  get f() {
    return this.paymentForm.controls;
  }

  private async processPaymentResult(method: string, paymentResult: any) {
    this.isProcessing = true;
    try {
      const paymentData = {
        orderId: this.orderId,
        amount: this.orderDetails.totalAmount,
        currency: 'USD',
        paymentMethodId: paymentResult.id
      }
      
      const response = await lastValueFrom(
        this.orderService.updateOrderPayment(paymentData)
      ) as PaymentResponse;
  
      if (response.status === 'succeeded' || response.status === 'CASHIER_PENDING') {
        if(response.status === 'CASHIER_PENDING'){
          this.orderService.updateOrderStatus(this.orderId, OrderStatus.CASHIER_PENDING).subscribe();
          this.showToast('success', 'Payment confirmed! Please pay at the counter upon pickup.');
        } else {
          this.orderService.updateOrderStatus(this.orderId, OrderStatus.PAYMENT_SUCCESSFUL).subscribe();
          this.showToast('success', 'Payment successful! Your order is being processed.');
        }
        this.cartService.clearCart();
        
        setTimeout(() => {
          this.router.navigate(['/order-confirmation', this.orderDetails.orderId]);
        }, 1500);
      } else {
        throw new Error(response.error || 'Payment failed');
      }
    } catch (error) {
      this.handlePaymentError(error);
    } finally {
      this.isProcessing = false;
    }
  }
  
  goBackToCheckout() {
    this.router.navigate(['/checkout']);
  }

  getPaymentMethodName(): string {
    switch (this.paymentMethod) {
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
  
  getPaymentIcon() {
    const method = this.paymentMethods.find(m => m.id === this.paymentMethod);
    return method ? method.icon : 'payment';
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
  
  formatErrorMessage(message: string): string {
    if (message.includes('card number')) {
      return 'Please check your card number and try again.';
    } else if (message.includes('expiration')) {
      return 'Please check your card expiration date.';
    } else if (message.includes('CVC')) {
      return 'Please check your card security code (CVC).';
    } else {
      return message;
    }
  }
  
  generateOrderNumber(): string {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  
  estimateDeliveryTime(): string {
    const now = new Date();
    const minDelivery = new Date(now.getTime() + 15 * 60000);
    const maxDelivery = new Date(now.getTime() + 30 * 60000);
    
    return `${this.formatTime(minDelivery)} - ${this.formatTime(maxDelivery)}`;
  }
  
  private formatTime(date: Date): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutesStr} ${ampm}`;
  }
}
