import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { OrderStatus } from '../../../shared/enum/order-status.enum';
import { Order } from '../../../shared/models/order.model';
import { WebSocketService } from '../web-socket-service/web-socket.service';
import { NotificationService } from '../notification/notification.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private currentOrderId: string | null = null;
  apiUrl = environment.apiUrl;
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();
  private newOrdersSubject = new BehaviorSubject<Set<number>>(new Set<number>());
  public newOrders$ = this.newOrdersSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private notificationService: NotificationService
  ) {
    this.initializeOrderUpdates();
  }
  
  private initializeOrderUpdates() {
    this.webSocketService.subscribe<Order>('/topic/orders', (order) => {
      this.handleOrderUpdate(order);
    });
  }

  private handleOrderUpdate(updatedOrder: Order) {
    const currentOrders = this.ordersSubject.value;
    const existingOrderIndex = currentOrders.findIndex(order => order.orderId === updatedOrder.orderId);
    
    if (existingOrderIndex >= 0) {
      const updatedOrders = [...currentOrders];
      updatedOrders[existingOrderIndex] = updatedOrder;
      this.ordersSubject.next(updatedOrders);
    } else {
      const updatedOrders = [updatedOrder, ...currentOrders];
      this.ordersSubject.next(updatedOrders);
      
      const newOrders = new Set(this.newOrdersSubject.value);
      newOrders.add(updatedOrder.orderId);
      this.newOrdersSubject.next(newOrders);
      this.notificationService.playNewOrderNotification();
      
      setTimeout(() => {
        const currentNewOrders = new Set(this.newOrdersSubject.value);
        currentNewOrders.delete(updatedOrder.orderId);
        this.newOrdersSubject.next(currentNewOrders);
      }, 5 * 60 * 1000);
    }
  }
  
  clearNewOrderFlag(orderId: number) {
    const newOrders = this.newOrdersSubject.value;
    newOrders.delete(orderId);
    this.newOrdersSubject.next(newOrders);
  }
  
  updateOrderStatus(orderId: number, status: OrderStatus) {
    return this.http.put<Order>(
      `${this.apiUrl}/orders/${orderId}/status`, 
      null, 
      {
        headers: this.getHeaders(),
        params: { status: status.toString() }
      }
    );
  }
  
  getAllOrders() {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`, {headers: this.getHeaders()})
      .pipe(tap(orders => {
        this.ordersSubject.next(orders);
      }));
  }
  
  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getRefreshToken()}`,
    });
  }

  createOrder(orderData: any) {
    return this.http.post<any>(`${this.apiUrl}/orders`, {
      ...orderData,
      status: OrderStatus.PAYMENT_PENDING
    }, {headers: this.getHeaders()}).pipe(tap(order => this.currentOrderId = order.orderId));
  }

  getPendingOrder() {
    return this.http.get<any>(`${this.apiUrl}/orders/${this.currentOrderId}`, {headers: this.getHeaders()});
  }

  updateOrderPayment(paymentData: any) {
    return this.http.post(`${this.apiUrl}/payments/process`, paymentData, {headers: this.getHeaders()});
  }

  getOrder(orderId: any) {
    return this.http.get<any>(`${this.apiUrl}/orders/${orderId}`, {headers: this.getHeaders()});
  }
  getRecentOrders(userId: number, time: number) {
    return this.http.get<any>(`${this.apiUrl}/orders/${userId}/${time}`, {headers: this.getHeaders()});
  }

  getMyOrders() {
    return this.http.get<any>(`${this.apiUrl}/orders/my-orders`, {headers: this.getHeaders()});
  }
}