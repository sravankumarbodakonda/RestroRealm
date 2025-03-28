import { OrderStatus } from "../enum/order-status.enum";

export interface Order {
    orderId: number;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    paymentMethod: string;
    status: OrderStatus;
    totalAmount: number;
    orderItems: any[];
    createdAt: Date;
    updatedAt: Date;
    tableId?: number;
    subtotal?: number;
    taxAmount?: number;
    deliveryFee?: number;
    discount?: number;
    street1: string;
    street2: string;
    city: string;
    state: string;
    postalCode: number;
    orderDetails: OrderDetails;
    deliveryInstructions?: any;
    specialInstructions?: any;
    statusHistory?: any;
    customerVip?: any;
  }

  
  export interface OrderDetails {
    reservationDate: any;
    reservationTime: any;
    numberOfGuests: number;
    specialRequests: any;
    orderType: 'delivery' | 'pickup' | 'dine-in';
    orderFor: 'self' | 'friend';
    tableId: number | null;
    pickupTime: string;
    customPickupTime: string;
    notes: string;
  }