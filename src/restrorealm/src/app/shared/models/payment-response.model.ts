export interface PaymentResponse {
  status: string;
  amount: number;
  paymentId: string;
  orderId: number;
  error?: string;
  orderNumber?: string;
}