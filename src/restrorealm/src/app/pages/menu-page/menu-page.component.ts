import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MenuService } from '../../core/services/menu/menu.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CartService } from '../../core/services/cart/cart.service';
import { ToasterComponent } from "../../shared/components/toaster/toaster.component";
import { environment } from '../../../environments/environment';
import { debounceTime, distinctUntilChanged, Subject, finalize } from 'rxjs';
import { MenuItem } from '../../shared/models/MenuItem.model';
import { get } from 'http';

@Component({
  selector: 'app-menu',
  templateUrl: './menu-page.component.html',
  styleUrls: ['./menu-page.component.css'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FontAwesomeModule, ToasterComponent],
  standalone: true,
})
export class MenuPageComponent implements OnInit {
  // Data properties
  menuItems: MenuItem[] = [];
  filteredItems: MenuItem[] = [];
  categoryName: string = '';
  imageUrl = environment.imageUrl;
  loading: boolean = true;
  placeholderImagePath: string = 'https://www.partstown.com/about-us/wp-content/uploads/2023/07/Most-Profitable-Restaurant-Menu-Items-Menu-Stars.jpg';
  categoryAvailable: boolean = true;
  categories: any[] = []; // Store all categories for availability check
  
  // UI state properties
  toast: {
    message: string;
    type: 'success' | 'error';
  } | null = null;
  searchTerm: string = '';
  sortOption: string = 'name';
  selectedItem: MenuItem | null = null;
  orderQuantity: number = 1;
  private searchSubject = new Subject<string>();

  constructor(
    private route: ActivatedRoute,
    private menuService: MenuService,
    private cartService: CartService
  ) {
    // Set up debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.filterItems();
    });
  }

  ngOnInit(): void {
    // First, fetch all categories for availability status
    this.fetchAllCategories();
    
    this.route.paramMap.subscribe(params => {
      this.categoryName = params.get('categoryName') || '';
      this.loading = true;      
      if (this.categoryName && this.categoryName !== 'All') {
        this.checkCategoryAvailability();
      } else {
        this.categoryAvailable = true;
        this.fetchMenuItems();
      }
    });
  }

  fetchAllCategories(): void {
    this.menuService.getCategoriesNoHeaders().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Error fetching all categories:', err);
        this.showToast("Could not load categories", "error");
      }
    });
  }

  checkCategoryAvailability(): void {
    if (this.categories.length > 0) {
      // If categories already loaded, use them
      const category = this.categories.find(cat => 
        cat.name.toLowerCase() === this.categoryName.toLowerCase()
      );
      
      if (category) {
        this.categoryAvailable = !category.unavailable;
      } else {
        this.categoryAvailable = false;
      }
      
      this.fetchMenuItems();
    } else {
      // Otherwise fetch them
      this.menuService.getCategoriesNoHeaders().subscribe({
        next: (categories) => {
          this.categories = categories;
          const category = categories.find(cat => 
            cat.name.toLowerCase() === this.categoryName.toLowerCase()
          );
          
          if (category) {
            this.categoryAvailable = !category.unavailable;
          } else {
            this.categoryAvailable = false;
          }
          
          this.fetchMenuItems();
        },
        error: (err) => {
          console.error('Error fetching categories:', err);
          this.categoryAvailable = false;
          this.fetchMenuItems();
        }
      });
    }
  }

  getImageUrl(item: MenuItem): string {
    if (!item || !item.imageUrl) {
      return this.placeholderImagePath;
    }
    
    return item.imageUrl.startsWith('http') 
      ? item.imageUrl 
      : this.imageUrl + item.imageUrl;
  }

  fetchMenuItems(): void {
    if(!this.categoryName || this.categoryName === "All") {
      this.categoryName = "All";
      this.menuService.getAllMenuItemsNoHeaders().pipe(
        finalize(() => {
          this.loading = false;
        })
      ).subscribe({
        next: (menuItems) => {
          if (!menuItems || menuItems.length === 0) {
            console.warn('No menu items received from API');
            this.showToast("No menu items found", "error");
          }
          this.processMenuItems(menuItems);
        },
        error: (err) => {
          console.error('Error fetching menu items:', err);
          this.showToast("Could not load menu items", "error");
        }
      });
    } else {
      this.menuService.getMenuItemsByCategoryNameNoHeaders(this.categoryName).pipe(
        finalize(() => {
          this.loading = false;
        })
      ).subscribe({
        next: (menuItems) => {
          if (!menuItems || menuItems.length === 0) {
            console.warn(`No menu items found for category: ${this.categoryName}`);
            // Try with different casing as a fallback
            this.tryAlternativeCategoryFetch();
          } else {
            this.processMenuItems(menuItems);
          }
        },
        error: (err) => {
          console.error(`Error fetching menu items for category ${this.categoryName}:`, err);
          this.showToast("Could not load menu items for this category", "error");
          // Try a fallback method
          this.tryAlternativeCategoryFetch();
        }
      });
    }
  }

  // Fallback method to try different cases for category name
  tryAlternativeCategoryFetch(): void {
    // Try with capitalized first letter
    const capitalizedCategory = this.categoryName.charAt(0).toUpperCase() + this.categoryName.slice(1).toLowerCase();    
    this.menuService.getMenuItemsByCategoryNameNoHeaders(capitalizedCategory).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (menuItems) => {
        if (menuItems && menuItems.length > 0) {
          this.processMenuItems(menuItems);
        } else {
          console.warn('No menu items found with alternative category casing');
          this.processMenuItems([]); // Process empty array to update UI
        }
      },
      error: (err) => {
        console.error('Error in fallback category fetch:', err);
        this.processMenuItems([]); // Process empty array to update UI
      }
    });
  }

  processMenuItems(menuItems: any[]): void {    
    // Handle undefined or null menuItems
    if (!menuItems) {
      console.warn('Received undefined or null menuItems array');
      this.menuItems = [];
      this.filteredItems = [];
      this.loading = false;
      return;
    }
    
    // Transform and add extra properties for UI enhancement
    this.menuItems = menuItems.map(item => {
      // Check if item should be marked as new (created within last 60 days)
      const isNewItem = this.isItemNew(item.createdAt);
      
      // Determine if item is unavailable based on category
      const isItemUnavailable = this.isItemUnavailable(item);
      
      // Create enhanced item with proper properties
      const enhancedItem: MenuItem = {
        ...item,
        calories: item.calories || Math.floor(Math.random() * 800) + 200, // Fallback calories if not provided
        unavailable: isItemUnavailable,
        isNew: isNewItem,
        isVegetarian: item.isVegetarian || false,
        isSpicy: item.isSpicy || false,
        imageUrl: item.imagePath || item.imageUrl || null, // Handle different property names
      };
      
      // Add customization options only if the item type supports it
      if (this.shouldHaveCustomizations(item)) {
        enhancedItem.customizations = this.generateCustomizationsForItem(item);
      }
      
      return enhancedItem;
    });
    
    this.filteredItems = [...this.menuItems];
    this.sortItems(); // Apply default sorting
    this.loading = false;
  }

  isItemNew(createdAtString?: string): boolean {
    if (!createdAtString) return false;
    
    try {
      const createdAt = new Date(createdAtString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Item is new if created within the last 60 days
      return diffDays <= 60;
    } catch (e) {
      console.error('Error parsing date:', e);
      return false;
    }
  }

  isItemUnavailable(item: any): boolean {
    // If we're viewing all items, check if the item's category is unavailable
    if (this.categoryName === "All") {
      if (item.categoryId && this.categories.length > 0) {
        const itemCategory = this.categories.find(cat => cat.id === item.categoryId);
        if (itemCategory && itemCategory.unavailable) {
          return true; // Category is unavailable
        }
      }
    } else if (!this.categoryAvailable) {
      return true; // Current category is unavailable
    }
    
    // Only mark as unavailable if explicitly set to unavailable
    return item.unavailable === true || item.isAvailable === false;
  }


  shouldHaveCustomizations(item: any): boolean {
    // Determine if an item should have customizations based on its type
    // For example, main dishes, pizzas, and burgers might have customizations
    const customizableTypes = ['main', 'pizza', 'burger', 'sandwich', 'salad'];
    return customizableTypes.includes(item.type?.toLowerCase()) || 
           (item.customizable === true);
  }

  generateCustomizationsForItem(item: any): Array<{
    name: string;
    choices: Array<{
      id: number;
      name: string;
      priceAdjustment: number;
      selected: boolean;
    }>
  }> {
    // Generate relevant customizations based on item type
    const customizations: Array<{
      name: string;
      choices: Array<{
        id: number;
        name: string;
        priceAdjustment: number;
        selected: boolean;
      }>
    }> = [];
    
    // Common extras group
    const extrasGroup: {
      name: string;
      choices: Array<{
        id: number;
        name: string;
        priceAdjustment: number;
        selected: boolean;
      }>
    } = {
      name: 'Add Extras',
      choices: []
    };
    
    // Size options group
    const sizeGroup: {
      name: string;
      choices: Array<{
        id: number;
        name: string;
        priceAdjustment: number;
        selected: boolean;
      }>
    } = {
      name: 'Choose Size',
      choices: [
        { id: 101, name: 'Regular', priceAdjustment: 0.00, selected: true },
        { id: 102, name: 'Large', priceAdjustment: 3.00, selected: false },
      ]
    };
    
    // Add specific extras based on item type
    if (item.type?.toLowerCase() === 'pizza' || item.type?.toLowerCase() === 'burger') {
      extrasGroup.choices.push(
        { id: 1, name: 'Extra Cheese', priceAdjustment: 1.50, selected: false },
        { id: 2, name: 'Bacon', priceAdjustment: 2.00, selected: false }
      );
      
      if (item.type?.toLowerCase() === 'pizza') {
        extrasGroup.choices.push(
          { id: 3, name: 'Extra Pepperoni', priceAdjustment: 1.75, selected: false },
          { id: 4, name: 'Mushrooms', priceAdjustment: 1.25, selected: false }
        );
        
        // Add extra size option for pizza
        sizeGroup.choices.push(
          { id: 103, name: 'Extra Large', priceAdjustment: 5.00, selected: false }
        );
      }
    } else if (item.type?.toLowerCase() === 'salad') {
      extrasGroup.choices.push(
        { id: 5, name: 'Grilled Chicken', priceAdjustment: 3.00, selected: false },
        { id: 6, name: 'Avocado', priceAdjustment: 1.75, selected: false },
        { id: 7, name: 'Croutons', priceAdjustment: 0.75, selected: false }
      );
    } else if (item.type?.toLowerCase() === 'sandwich') {
      extrasGroup.choices.push(
        { id: 8, name: 'Extra Meat', priceAdjustment: 2.50, selected: false },
        { id: 9, name: 'Avocado', priceAdjustment: 1.75, selected: false },
        { id: 10, name: 'Double Cheese', priceAdjustment: 1.00, selected: false }
      );
    }
    
    // Add the groups with choices to customizations
    if (extrasGroup.choices.length > 0) {
      customizations.push(extrasGroup);
    }
    
    // Add size options for appropriate items
    if (['pizza', 'burger', 'sandwich', 'salad'].includes(item.type?.toLowerCase())) {
      customizations.push(sizeGroup);
    }
    
    return customizations;
  }

  filterItems(): void {
    if (!this.searchTerm.trim()) {
      this.filteredItems = [...this.menuItems];
    } else {
      const search = this.searchTerm.toLowerCase();
      this.filteredItems = this.menuItems.filter(item => 
        item.name?.toLowerCase().includes(search) || 
        item.description?.toLowerCase().includes(search)
      );
    }
    this.sortItems();
  }

  sortItems(): void {
    switch (this.sortOption) {
      case 'name':
        this.filteredItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'price-low':
        this.filteredItems.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
        break;
      case 'price-high':
        this.filteredItems.sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0));
        break;
      case 'calories-low':
        this.filteredItems.sort((a, b) => (a.calories || 0) - (b.calories || 0));
        break;
    }
  }

  addToCart(menuItem: MenuItem): void {
    if (menuItem.unavailable) return;
    
    this.cartService.addToCart({
      id: menuItem.id,
      name: menuItem.name,
      imageUrl: this.getImageUrl(menuItem),
      description: menuItem.description,
      basePrice: menuItem.basePrice,
      calories: menuItem.calories,
      quantity: 1, // Default quantity
      customizations: [] // No customizations when adding directly
    });
    
    this.showToast(`Added ${menuItem.name} to cart`, "success");
  }

  showItemDetails(item: MenuItem): void {
    if (item.unavailable) return;
    
    this.selectedItem = { ...item };
    this.orderQuantity = 1;
    
    // Reset any previously selected customizations
    if (this.selectedItem.customizations) {
      this.selectedItem.customizations.forEach(group => {
        group.choices.forEach(choice => {
          // Reset all except those that should be default selected
          if (choice.name !== 'Regular') {
            choice.selected = false;
          }
        });
      });
    }
  }

  closeItemDetails(): void {
    this.selectedItem = null;
  }

  increaseQuantity(): void {
    this.orderQuantity++;
  }

  decreaseQuantity(): void {
    if (this.orderQuantity > 1) {
      this.orderQuantity--;
    }
  }

  calculateTotalPrice(): number {
    if (!this.selectedItem) return 0;
    
    let total = this.selectedItem.basePrice;
    
    // Add customization costs
    if (this.selectedItem.customizations) {
      this.selectedItem.customizations.forEach(group => {
        group.choices.forEach(choice => {
          if (choice.selected) {
            total += choice.priceAdjustment;
          }
        });
      });
    }
    
    return total * this.orderQuantity;
  }

  addCustomizedItemToCart(): void {
    if (!this.selectedItem || this.selectedItem.unavailable) return;
    
    // Get selected customizations for cart display
    const selectedCustomizations: string[] = [];
    
    if (this.selectedItem.customizations) {
      this.selectedItem.customizations.forEach(group => {
        group.choices.forEach(choice => {
          if (choice.selected) {
            selectedCustomizations.push(`${choice.name} (+$${choice.priceAdjustment.toFixed(2)})`);
          }
        });
      });
    }
    
    // Create the customized item for the cart
    const customizedItem: MenuItem = {
      id: this.selectedItem.id,
      name: this.selectedItem.name,
      imageUrl: this.getImageUrl(this.selectedItem),
      description: this.selectedItem.description,
      basePrice: this.calculateTotalPrice() / this.orderQuantity, // Unit price with customizations
      calories: this.selectedItem.calories,
      customizations: this.selectedItem.customizations // Keep original customizations structure
    };
    
    // Add to cart
    for (let i = 0; i < this.orderQuantity; i++) {
      this.cartService.addToCart(customizedItem);
    }
    
    this.showToast(`Added ${this.orderQuantity}x ${this.selectedItem.name} to cart`, "success");
    this.closeItemDetails();
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/placeholder-food.png';
  }
  
  private showToast(message: string, type: 'success' | 'error') {
    this.toast = { message, type };
    setTimeout(() => this.toast = null, 3000);
  }
  
}
