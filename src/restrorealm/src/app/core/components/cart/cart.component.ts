import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CartService, CartItem } from '../../services/cart/cart.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  cartItems$ = this.cartService.cartItems$;
  totalPrice = 0;
  removingItemId: number | null = null;
  
  // New properties for enhanced experience
  deliveryPrice = 0; // Free delivery by default
  estimatedTaxRate = 0.0825; // 8.25% tax rate
  promoCode: string = '';
  
  ngOnInit() {
    // Initialize total price
    this.updateTotalPrice();
    
    // Update total price whenever cart changes
    this.cartItems$.subscribe(() => {
      this.updateTotalPrice();
      this.updateDeliveryPrice();
    });
  }

  updateTotalPrice() {
    this.totalPrice = this.cartService.getTotalPrice();
  }
  
  updateDeliveryPrice() {
    // Make delivery free if order is over $35, otherwise $5
    this.deliveryPrice = this.totalPrice >= 35 ? 0 : 5;
  }
  
  calculateTax() {
    return this.totalPrice * this.estimatedTaxRate;
  }
  
  calculateTotal() {
    return this.totalPrice + this.calculateTax() + this.deliveryPrice;
  }

  updateQuantity(item: CartItem, quantity: number) {
    if (quantity < 1) quantity = 1;
    this.cartService.updateQuantity(item.menuItem.id, quantity);
  }
  
  async removeItem(itemId: number) {
    this.removingItemId = itemId;
    // Allow animation to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    this.cartService.removeFromCart(itemId);
    this.removingItemId = null;
  }
  
  clearCart() {
    // Confirm with the user before clearing the cart
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clearCart();
    }
  }
  
  // Generate a random pastel color based on item ID for visual differentiation
  getRandomPastelColor(id: number) {
    const hue = ((id * 83) % 360); // Use the ID to generate a repeatable hue
    return `hsl(${hue}, 70%, 80%)`;
  }
  
  // Estimate delivery time (15-30 minutes from now)
  estimateDeliveryTime() {
    const now = new Date();
    const minDelivery = new Date(now.getTime() + 15 * 60000);
    const maxDelivery = new Date(now.getTime() + 30 * 60000);
    
    return `${this.formatTime(minDelivery)} - ${this.formatTime(maxDelivery)}`;
  }
  
  // Format time for delivery estimate
  private formatTime(date: Date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutesStr} ${ampm}`;
  }
}
