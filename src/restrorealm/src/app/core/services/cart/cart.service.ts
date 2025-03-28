import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MenuItem } from '../../../shared/models/MenuItem.model';
import { isPlatformBrowser } from '@angular/common';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface CartPayloadItem {
  menuItemId: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'cart';
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItems.asObservable();
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      this.cartItems.next(this.loadCartFromStorage());
      
      window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key === this.STORAGE_KEY) {
          this.cartItems.next(this.loadCartFromStorage());
        }
      });
    }
  }

  private saveCartToStorage(items: CartItem[]): void {
    if (this.isBrowser) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
      this.cartItems.next(items);
    }
  }

  private loadCartFromStorage(): CartItem[] {
    if (!this.isBrowser) {
      return [];
    }
    
    try {
      const cart = localStorage.getItem(this.STORAGE_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      return [];
    }
  }

  addToCart(menuItem: MenuItem): void {
    if (!menuItem?.id) {
      console.warn('Attempted to add invalid item to cart');
      return;
    }
    
    const items = this.isBrowser ? this.loadCartFromStorage() : this.cartItems.value;
    const existingItem = items.find(item => item.menuItem.id === menuItem.id);
    
    if (existingItem) {
      existingItem.quantity++;
    } else {
      items.push({ 
        menuItem: {
          id: menuItem.id,
          name: menuItem.name,
          basePrice: menuItem.basePrice,
          imageUrl: menuItem.imageUrl,
          description: menuItem.description,
          calories: menuItem.calories
        }, 
        quantity: 1 
      });
    }
    
    this.saveCartToStorage(items);
  }

  removeFromCart(itemId: number): void {
    if (!itemId) {
      console.warn('Invalid item ID provided for removal');
      return;
    }
    
    const currentItems = this.isBrowser ? this.loadCartFromStorage() : this.cartItems.value;
    const filteredItems = currentItems.filter(item => item.menuItem.id !== itemId);
    this.saveCartToStorage(filteredItems);
  }

  updateQuantity(itemId: number, quantity: number): void {
    if (!itemId) {
      console.warn('Invalid item ID provided for quantity update');
      return;
    }
    
    const items = this.isBrowser ? this.loadCartFromStorage() : this.cartItems.value;
    const item = items.find(i => i.menuItem.id === itemId);
    
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(itemId);
      } else {
        item.quantity = quantity;
        this.saveCartToStorage(items);
      }
    } else {
      console.warn(`Item with ID ${itemId} not found in cart`);
    }
  }

  clearCart(): void {
    this.saveCartToStorage([]);
  }

  getTotalItems(): number {
    const items = this.isBrowser ? this.loadCartFromStorage() : this.cartItems.value;
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }

  getTotalPrice(): number {
    const items = this.isBrowser ? this.loadCartFromStorage() : this.cartItems.value;
    return items.reduce(
      (acc, item) => acc + (item.menuItem.basePrice * item.quantity), 0
    );
  }

  getItems(): CartItem[] {
    return this.isBrowser ? this.loadCartFromStorage() : this.cartItems.value;
  }

  getPayload(): CartPayloadItem[] {
    const items = this.isBrowser ? this.loadCartFromStorage() : this.cartItems.value;
    return items.map(item => ({
      menuItemId: item.menuItem.id,
      quantity: item.quantity
    }));
  }
}
