import { Component, OnInit, inject, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../core/services/cart/cart.service';
import { OrderService } from '../../core/services/orders/order.service';
import { Order } from '../../shared/models/order.model';
import { DomSanitizer } from '@angular/platform-browser';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { environment } from '../../../environments/environment';
import { trigger, transition, style, animate } from '@angular/animations';

// Declare global gtag function type
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.css'],
  animations: [
    trigger('fadeSlideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('0.3s ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class OrderConfirmationComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  cartService = inject(CartService);
  orderService = inject(OrderService);
  
  @ViewChild('receiptContent') receiptContent!: ElementRef;

  order!: Order;
  orderId!: string;
  isLoading: boolean = true;
  estimatedDeliveryTime: Date;
  isGeneratingReceipt: boolean = false;
  deliveryAddress: string = 'Not provided';
  logoUrl: string = '';
  currentYear: number = new Date().getFullYear();
  
  // Toast notification properties
  toastVisible = false;
  toastMessage = '';
  toastType = 'success'; // 'success', 'error'
  toastTimeout: any = null;
  
  constructor() {
    this.cartService.clearCart();
    this.estimatedDeliveryTime = this.calculateEstimatedDeliveryTime();
    this.logoUrl = environment.imageUrl + '/images/logo.png';
  }

  ngOnInit(): void {
    // Add a small delay to make loading state visible for better UX
    setTimeout(() => {
      this.orderId = this.route.snapshot.paramMap.get('id')!;
      if (!this.orderId) {
        this.showToast('error', 'Invalid order ID. Please try again.');
        this.isLoading = false;
        return;
      }
      
      this.fetchOrderDetails();
    }, 1000);
  }
  
  ngOnDestroy() {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  fetchOrderDetails(): void {
    this.isLoading = true;
    
    this.orderService.getOrder(this.orderId).subscribe({
      next: (orderData) => {
        // Add small delay to make loading state visible for better UX
        setTimeout(() => {
          this.order = orderData;
          this.formatDeliveryAddress();
          this.isLoading = false;
        }, 500);
      },
      error: (error) => {
        console.error('Error fetching order details', error);
        this.isLoading = false;
        this.showToast('error', 'Unable to load your order details. Please try again later.');
      }
    });
  }

  formatDeliveryAddress(): void {
    const addressParts = [];
    if (this.order.street1) addressParts.push(this.order.street1);
    if (this.order.street2) addressParts.push(this.order.street2);
    if (this.order.city) addressParts.push(this.order.city);
    if (this.order.state) addressParts.push(this.order.state);
    if (this.order.postalCode) addressParts.push(this.order.postalCode);
    
    if (addressParts.length > 0) {
      this.deliveryAddress = addressParts.join(', ');
    }
  }

  calculateEstimatedDeliveryTime(): Date {
    const deliveryTime = new Date();
    // Random delivery time between 30-50 minutes for a more realistic estimate
    const randomMinutes = Math.floor(Math.random() * (50 - 30 + 1)) + 30;
    deliveryTime.setMinutes(deliveryTime.getMinutes() + randomMinutes);
    return deliveryTime;
  }

  async downloadReceipt(): Promise<void> {
    if (this.isGeneratingReceipt) return;
    
    this.isGeneratingReceipt = true;
    
    try {
      this.showToast('success', 'Generating your receipt...');
      
      // Create a separate element for receipt generation
      const receiptHtml = this.generateReceiptHtml();
      const container = document.createElement('div');
      container.innerHTML = receiptHtml;
      
      // Important: Append to body and set styles to ensure proper rendering
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.width = '800px';
      document.body.appendChild(container);
      
      // Allow time for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        // First ensure all images are loaded
        const images = Array.from(container.querySelectorAll('img'));
        await Promise.all(
          images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
          })
        );
        
        // Now convert to canvas
        const canvas = await html2canvas(container, {
          scale: 2, // Higher resolution
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true,
          onclone: (clonedDoc) => {
            // Additional processing can be done here if needed
            return new Promise(resolve => setTimeout(resolve, 500));
          }
        });
        
        // Create and download PDF
        const pdfBlob = await this.convertCanvasToPdf(canvas);
        this.downloadPdf(pdfBlob);
        this.showToast('success', 'Your receipt has been downloaded successfully!');
      } catch (pdfError) {
        console.error('Error creating PDF:', pdfError);
        this.showToast('error', 'We encountered an issue creating your PDF. Please try again.');
      } finally {
        // Always clean up
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      this.showToast('error', 'We encountered an issue while creating your receipt. Please try again.');
    } finally {
      this.isGeneratingReceipt = false;
    }
  }
  
  private generateReceiptHtml(): string {
    const date = new Date(this.order.createdAt || new Date()).toLocaleDateString();
    const time = new Date(this.order.createdAt || new Date()).toLocaleTimeString();
    const formattedDate = `${date} at ${time}`;
    
    const logoUrl = this.logoUrl;
    const orderNumber = this.order.orderNumber || this.orderId || 'N/A';
    
    // Generate QR code - use a proper library in production
    // For demo, we'll use a static QR code image
    const qrCodeData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkAQMAAABKLAcXAAAABlBMVEX///8AAABVwtN+AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAzUlEQVQ4y43SsY3EMAxE0SELNzNXgkvYK9CLXEFuZqkEl0AFSNtgA3uwWe2/PGAAYYKnIYeivk7zifSXx9Zl1+Ie4fGLd1lqbPnp75egOFo+fMui/2cVv9QYi2JHjKLTKIzaZLTFMDORRdESYhldITy6hLDoCcGiLwSKHSFQdIVgMRQCxUgIFKEQKEoiMHpKBERXCRRdJVD0lUDRUwJFqASKQgkUlRIoaiVQ1EqgqJVAUSiBIuYCReRCo+lGRDxKMBksiR18B76XYLTDSb8AS7lEaHeOj+0AAAAASUVORK5CYII=";
    
    const itemRows = this.order.orderItems.map(item => `
      <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
        <div style="display: flex; align-items: center; flex: 1;">
          <div style="width: 50px; height: 50px; border-radius: 8px; background-color: #f7f7f7; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
            <div style="font-weight: 600; font-size: 18px; color: #FF6B35;">${item.menuItemName?.charAt(0) || 'I'}</div>
          </div>
          <div>
            <div style="font-weight: 600; color: #343a40; margin-bottom: 4px; font-size: 16px;">${item.menuItemName || item.name || 'Item'}</div>
            <div style="font-size: 14px; color: #6c757d;">Qty: ${item.quantity || 1} × ${(item.price || 0).toFixed(2)}</div>
            ${item.specialInstructions ? `<div style="font-size: 13px; color: #6c757d; margin-top: 4px; font-style: italic;">Note: ${item.specialInstructions}</div>` : ''}
          </div>
        </div>
        <div style="font-weight: 600; color: #FF6B35; font-size: 16px;">${((item.quantity || 1) * (item.price || 0)).toFixed(2)}</div>
      </div>
    `).join('');
    
    const subtotal = this.order.subtotal || 
      this.order.orderItems.reduce((sum, item) => sum + ((item.quantity || 1) * (item.price || 0)), 0);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Receipt - #${orderNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #343a40;
            background-color: #f8f9fa;
          }
          .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          }
          .receipt-header {
            background: linear-gradient(135deg, #FF6B35, #E54E15);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
          }
          .logo-container {
            width: 100px;
            height: 100px;
            background-color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          }
          .logo {
            max-width: 70px;
            max-height: 70px;
          }
          .receipt-title {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 600;
            margin: 0 0 5px;
          }
          .receipt-subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin: 0 0 15px;
          }
          .order-info {
            display: inline-block;
            background-color: rgba(255, 255, 255, 0.2);
            padding: 8px 20px;
            border-radius: 30px;
            font-size: 15px;
            font-weight: 500;
          }
          .receipt-body {
            padding: 30px;
          }
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .section-title {
            font-family: 'Poppins', sans-serif;
            font-size: 20px;
            font-weight: 600;
            color: #343a40;
            margin: 0 0 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
            position: relative;
          }
          .section-title::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 60px;
            height: 2px;
            background-color: #FF6B35;
          }
          .info-grid {
            display: flex;
            flex-wrap: wrap;
            margin: 0 -15px;
          }
          .info-column {
            flex: 1;
            min-width: 250px;
            padding: 20px;
            margin: 0 15px 15px;
            background-color: #f8f9fa;
            border-radius: 10px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-label {
            font-size: 14px;
            color: #6c757d;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 15px;
            font-weight: 500;
            color: #343a40;
          }
          .items-container {
            margin-bottom: 30px;
          }
          .summary-container {
            background-color: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 15px;
          }
          .summary-row:last-child {
            margin-bottom: 0;
          }
          .summary-row.total {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #e9ecef;
            font-weight: 700;
            font-size: 18px;
            color: #343a40;
          }
          .summary-row.total .summary-value {
            color: #FF6B35;
          }
          .discount {
            color: #EF476F;
          }
          .receipt-footer {
            text-align: center;
            padding: 30px;
            border-top: 1px solid #f0f0f0;
            page-break-inside: avoid;
          }
          .thank-you {
            font-family: 'Poppins', sans-serif;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #343a40;
          }
          .contact-info {
            font-size: 14px;
            color: #6c757d;
            margin-bottom: 20px;
          }
          .social-icons {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-bottom: 20px;
          }
          .social-icon {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
          }
          .facebook {
            background-color: #3b5998;
          }
          .twitter {
            background-color: #1da1f2;
          }
          .instagram {
            background-color: #c13584;
          }
          .store-info {
            font-size: 13px;
            color: #adb5bd;
          }
          .qr-container {
            text-align: center;
            margin-top: 20px;
          }
          .qr-code {
            width: 100px;
            height: 100px;
            margin: 0 auto;
          }
          .qr-text {
            font-size: 12px;
            color: #6c757d;
            margin-top: 5px;
          }
          .review-banner {
            background-color: #FFF3E0;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            text-align: center;
          }
          .review-text {
            font-size: 14px;
            color: #E54E15;
            font-weight: 500;
          }
          @media print {
            body {
              background-color: #ffffff;
            }
            .receipt-container {
              box-shadow: none;
              border-radius: 0;
            }
            .page-break {
              page-break-before: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header">
            <div class="logo-container">
              <img src="${logoUrl}" alt="RestroRealm Logo" class="logo">
            </div>
            <h1 class="receipt-title">Order Receipt</h1>
            <p class="receipt-subtitle">Thank you for choosing RestroRealm!</p>
            <div class="order-info">Order #${orderNumber} | ${formattedDate}</div>
          </div>
          
          <div class="receipt-body">
            <div class="section">
              <div class="info-grid">
                <div class="info-column">
                  <h2 class="section-title">Customer Information</h2>
                  <div class="info-item">
                    <div class="info-label">Name</div>
                    <div class="info-value">${this.order.customerName || 'Not provided'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${this.order.customerEmail || 'Not provided'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Phone</div>
                    <div class="info-value">${this.order.customerPhone || 'Not provided'}</div>
                  </div>
                </div>
                
                <div class="info-column">
                  <h2 class="section-title">Delivery Information</h2>
                  <div class="info-item">
                    <div class="info-label">Address</div>
                    <div class="info-value">${this.deliveryAddress}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Estimated Delivery</div>
                    <div class="info-value">${this.estimatedDeliveryTime.toLocaleString()}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Payment Method</div>
                    <div class="info-value">${this.order.paymentMethod || 'Not specified'}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2 class="section-title">Your Culinary Selection</h2>
              <div class="items-container">
                ${itemRows}
              </div>
            </div>
            
            <div class="section">
              <h2 class="section-title">Order Summary</h2>
              <div class="summary-container">
                <div class="summary-row">
                  <div>Subtotal</div>
                  <div>${subtotal.toFixed(2)}</div>
                </div>
                
                ${this.order.taxAmount ? `
                <div class="summary-row">
                  <div>Tax</div>
                  <div>${this.order.taxAmount.toFixed(2)}</div>
                </div>
                ` : ''}
                
                ${this.order.deliveryFee ? `
                <div class="summary-row">
                  <div>Delivery Fee</div>
                  <div>${this.order.deliveryFee.toFixed(2)}</div>
                </div>
                ` : ''}
                
                ${this.order.discount ? `
                <div class="summary-row">
                  <div>Discount</div>
                  <div class="discount">-${this.order.discount.toFixed(2)}</div>
                </div>
                ` : ''}
                
                <div class="summary-row total">
                  <div>Total</div>
                  <div class="summary-value">${(this.order.totalAmount || subtotal).toFixed(2)}</div>
                </div>
              </div>
              
              <div class="review-banner">
                <p class="review-text">Use code THANKYOU15 on your next order for 15% off!</p>
              </div>
            </div>
          </div>
          
          <div class="receipt-footer">
            <div class="thank-you">We hope you enjoy your meal!</div>
            <div class="contact-info">If you have any questions, please contact us at support@restrorealm.com</div>
            
            <div class="social-icons">
              <div class="social-icon facebook">f</div>
              <div class="social-icon twitter">t</div>
              <div class="social-icon instagram">i</div>
            </div>
            
            <div class="store-info">
              123 Main Street, Anytown, State 12345<br>
              Open Daily: 10:00 AM - 10:00 PM<br>
              © ${this.currentYear} RestroRealm. All flavors reserved.
            </div>
            
            <div class="qr-container">
              <img src="${qrCodeData}" class="qr-code" alt="QR Code">
              <div class="qr-text">Scan to view your order online</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async convertCanvasToPdf(canvas: HTMLCanvasElement): Promise<Blob> {
    // Create PDF with appropriate page size
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate the proportional height based on the image's aspect ratio
    const contentHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    // Set margins
    const margin = 10; // 10mm margin
    const printWidth = pdfWidth - (2 * margin);
    const maxHeightPerPage = pdfHeight - (2 * margin);
    
    // Check if the content fits on a single page
    if (contentHeight <= maxHeightPerPage) {
      // Single page - add the entire image
      pdf.addImage(imgData, 'PNG', margin, margin, printWidth, contentHeight);
    } else {
      // Create multiple pages using a different approach
      // First, create a temporary canvas for each page
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      const img = new Image();
      
      // Wait for the image to load
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = imgData;
      });
      
      // Set up canvas dimensions
      tempCanvas.width = canvas.width;
      
      // Calculate how many pages we need
      const pageCount = Math.ceil(contentHeight / maxHeightPerPage);
      
      // For each page
      for (let i = 0; i < pageCount; i++) {
        // Add new page if not the first page
        if (i > 0) {
          pdf.addPage();
        }
        
        // Calculate source and destination heights
        const sourceY = (i * maxHeightPerPage * imgProps.width) / printWidth;
        const sourceHeight = Math.min(
          ((maxHeightPerPage * imgProps.width) / printWidth),
          imgProps.height - sourceY
        );
        const destHeight = (sourceHeight * printWidth) / imgProps.width;
        
        // Clear and set up temporary canvas
        tempCanvas.height = sourceHeight;
        ctx?.clearRect(0, 0, tempCanvas.width, sourceHeight);
        
        // Draw the portion of the image to the canvas
        ctx?.drawImage(
          img,
          0, sourceY, // Source x, y
          imgProps.width, sourceHeight, // Source width, height
          0, 0, // Destination x, y
          tempCanvas.width, tempCanvas.height // Destination width, height
        );
        
        // Add this portion to the PDF
        const pageImgData = tempCanvas.toDataURL('image/png');
        pdf.addImage(pageImgData, 'PNG', margin, margin, printWidth, destHeight);
        
        // Add page numbers
        pdf.setFontSize(10);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Page ${i + 1} of ${pageCount}`, pdfWidth / 2, pdfHeight - 5, {
          align: 'center'
        });
      }
    }
    
    return pdf.output('blob');
  }
  
  private downloadPdf(pdfBlob: Blob): void {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RestroRealm-Receipt-${this.order.orderNumber || this.orderId || 'order'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    // Track download event if analytics are available
    if (typeof window.gtag !== 'undefined') {
      try {
        (window as any).gtag('event', 'receipt_download', {
          'event_category': 'order_confirmation',
          'event_label': this.order.orderNumber || this.orderId,
          'value': this.order.totalAmount
        });
      } catch (e) {
        console.debug('Analytics tracking not available');
      }
    }
  }

  shareOrder(): void {
    if (navigator.share) {
      navigator.share({
        title: `My Order from RestroRealm #${this.order.orderNumber || this.orderId}`,
        text: `I just ordered some delicious food from RestroRealm! Estimated delivery time: ${this.estimatedDeliveryTime.toLocaleTimeString()}`,
        url: window.location.href
      })
      .then(() => {
        this.showToast('success', 'Your culinary adventure has been shared!');
      })
      .catch((error) => {
        console.error('Error sharing order:', error);
        if (error.name !== 'AbortError') {
          this.showToast('error', 'We couldn\'t share your order at this time');
        }
      });
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          this.showToast('success', 'Order link copied! Share it with friends and family.');
        })
        .catch((error) => {
          console.error('Error copying to clipboard:', error);
          this.showToast('error', 'We couldn\'t copy your order link');
        });
    }
  }
  
  showToast(type: 'success' | 'error', message: string, duration: number = 5000) {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    
    this.toastType = type;
    this.toastMessage = message;
    this.toastVisible = true;
    
    this.toastTimeout = setTimeout(() => {
      this.closeToast();
    }, duration);
  }
  
  closeToast() {
    this.toastVisible = false;
  }
  
  // Method to track order status (would connect to a real-time service in production)
  trackOrderStatus() {
    // In a real implementation, this would connect to a websocket or polling service
    // For now, just show a toast with mock tracking info
    this.showToast('success', 'Your order is being prepared by our chefs!');
    
    // In a real app, we might update the progress steps based on the order status
    // For example:
    /*
    this.orderService.getOrderStatus(this.orderId).subscribe(status => {
      this.currentStatus = status;
      this.updateProgressSteps();
    });
    */
  }
  
  // Add a tip for the delivery person
  addDeliveryTip(amount: number) {
    // In a real app, this would call the order service to update the tip amount
    this.showToast('success', `Thank you! ${amount.toFixed(2)} tip added for delivery.`);
    
    // Mock implementation to update the UI
    if (this.order) {
      this.order.totalAmount = (this.order.totalAmount || 0) + amount;
    }
  }
}
