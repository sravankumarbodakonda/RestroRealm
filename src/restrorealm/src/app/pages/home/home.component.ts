import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChildren, QueryList, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart/cart.service';
import { MenuService } from '../../core/services/menu/menu.service';
import { MenuItem } from '../../shared/models/MenuItem.model';
import { trigger, transition, style, animate, state, query, stagger } from '@angular/animations';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'translateY(20px)' })),
      transition(':enter', [
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('cardHover', [
      state('normal', style({ transform: 'scale(1) rotateY(0)' })),
      state('hovered', style({ transform: 'scale(1.02) rotateY(2deg)' })),
      transition('normal <=> hovered', animate('0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'))
    ]),
    trigger('slideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('0.3s ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ]),
    trigger('notificationAnimation', [
      state('void', style({ opacity: 0, transform: 'translateY(-100px)' })),
      state('showing', style({ opacity: 1, transform: 'translateY(0)' })),
      state('hidden', style({ opacity: 0, transform: 'translateY(-100px)' })),
      transition('void => showing', animate('300ms ease-out')),
      transition('showing => hidden', animate('300ms ease-in'))
    ]),
    trigger('staggerFadeIn', [
      transition(':enter', [
        query('.cuisine-category', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger('120ms', [
            animate('0.7s cubic-bezier(0.35, 0, 0.25, 1)', 
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('bounce', [
      state('inactive', style({ transform: 'scale(1)' })),
      state('active', style({ transform: 'scale(1.2)' })),
      transition('inactive <=> active', animate('0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'))
    ])
  ]
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChildren('cuisineCategory') cuisineCategories!: QueryList<ElementRef>;
  specialItems: MenuItem[] = [];
  categories: string[] = [];
  selectedCategory: string = 'All';
  loading = true;
  error = false;
  notificationState = 'void';
  imageUrl = environment.imageUrl;
  private subscriptions: Subscription = new Subscription();
  
  cardStates: { [key: string]: string } = {};
  
  currentSlide = 0;
  autoplayInterval: any;
  testimonials = [
    {
      text: "The flavors at RestroRealm are extraordinary! The Seared Salmon Niçoise made me feel like I was dining in a coastal French village. Definitely coming back!",
      author: "Emily Rodriguez",
      stars: 5,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=64&q=80",
      position: "Food Critic"
    },
    {
      text: "I've been to many fine dining establishments, but RestroRealm truly stands out. Their attention to detail and commitment to quality is unmatched. The wine pairing was exceptional.",
      author: "James Wilson",
      stars: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=64&q=80",
      position: "Executive Chef"
    },
    {
      text: "The Truffle Mushroom Risotto is absolutely divine. Rich, creamy, and full of flavor - I couldn't ask for more! The ambiance perfectly complements the culinary experience.",
      author: "Sarah Johnson",
      stars: 4,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=64&q=80",
      position: "Frequent Diner"
    },
    {
      text: "As a vegetarian, finding gourmet options can be challenging, but RestroRealm's plant-based menu exceeded all my expectations. Creative, flavorful, and beautifully presented.",
      author: "Michael Thompson",
      stars: 5,
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=64&q=80",
      position: "Food Blogger"
    }
  ];


  priorityCategories = ['Signature Dishes', 'Chef\'s Special', 'Seasonal'];

  constructor(
    private menuService: MenuService,
    private cartService: CartService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.loadFeaturedItems();
    this.startAutomaticSlideshow();
    this.initBackToTopButton();
  }
  
  ngAfterViewInit(): void {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Use a safe version of setTimeout that works with SSR
      setTimeout(() => this.addScrollEffects(), 500);
    }
  }

  // Key fixes start here
  loadFeaturedItems(): void {
    this.loading = true;
    this.subscriptions.add(
      this.menuService.getAllMenuItemsNoHeaders().subscribe({
        next: (items) => {
          if (!items?.length) {
            this.handleError();
            return;
          }

          // Process categories correctly
          const processedItems = items.map(item => ({
            ...item,
            category: item.category || { name: 'Uncategorized' }
          }));

          const allCategories = [...new Set(processedItems.map(item => item.category.name))];
          this.categories = ['All', ...allCategories.sort()];

          const itemsByCategory = this.groupByCategory(processedItems);
          const selectedItems: MenuItem[] = [];
          const processedCategories = new Set<string>();

          // Process priority categories
          this.priorityCategories.forEach(category => {
            if (itemsByCategory[category] && !processedCategories.has(category)) {
              selectedItems.push(this.getBestItemFromCategory(itemsByCategory[category]));
              processedCategories.add(category);
            }
          });

          // Process remaining categories
          Object.keys(itemsByCategory).forEach(category => {
            if (!processedCategories.has(category)) {
              selectedItems.push(this.getBestItemFromCategory(itemsByCategory[category]));
              processedCategories.add(category);
            }
          });

          // Handle minimum items display
          const MIN_ITEMS_TO_DISPLAY = 5;
          if (selectedItems.length < MIN_ITEMS_TO_DISPLAY && items.length >= MIN_ITEMS_TO_DISPLAY) {
            const categoriesWithMultipleItems = Object.keys(itemsByCategory)
              .filter(category => itemsByCategory[category].length > 1)
              .sort((a, b) => itemsByCategory[b].length - itemsByCategory[a].length);

            let index = 0;
            while (selectedItems.length < MIN_ITEMS_TO_DISPLAY && index < categoriesWithMultipleItems.length) {
              const category = categoriesWithMultipleItems[index];
              const categoryItems = [...itemsByCategory[category]];
              
              if (processedCategories.has(category)) {
                const bestItemId = this.getBestItemFromCategory(itemsByCategory[category]).id;
                const bestItemIndex = categoryItems.findIndex(item => item.id === bestItemId);
                if (bestItemIndex >= 0) categoryItems.splice(bestItemIndex, 1);
              }

              if (categoryItems.length > 0) {
                const nextBestItem = this.getBestItemFromCategory(categoryItems);
                // Create new category object to avoid mutation
                nextBestItem.category = { 
                  ...nextBestItem.category, 
                  name: `${nextBestItem.category.name} (Special)`
                };
                selectedItems.push(nextBestItem);
              }
              index++;
            }
          }

          this.specialItems = selectedItems.map(item => ({
            ...item,
            description: this.truncateDescription(item.description, 120),
            imageUrl: item.imageUrl || '/assets/images/placeholder.png'
          }));

          this.specialItems.forEach(item => {
            this.cardStates[item.id] = 'normal';
          });
          
          this.loading = false;
        },
        error: (err) => this.handleError()
      })
    );
  }

  private groupByCategory(items: MenuItem[]): { [key: string]: MenuItem[] } {
    return items.reduce((acc, item) => {
      const categoryName = item.category?.name || 'Uncategorized';
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(item);
      return acc;
    }, {} as { [key: string]: MenuItem[] });
  }
  // Key fixes end here

  ngOnDestroy(): void {
    this.stopAutomaticSlideshow();
    this.subscriptions.unsubscribe();
  }
  
  /**
   * Initialize the back-to-top button visibility
   */
  private initBackToTopButton(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    const scrollHandler = () => {
      const backToTopBtn = document.querySelector('.back-to-top') as HTMLElement;
      if (backToTopBtn) {
        if (window.scrollY > 300) {
          backToTopBtn.classList.add('visible');
        } else {
          backToTopBtn.classList.remove('visible');
        }
      }
    };
    
    window.addEventListener('scroll', scrollHandler);
    
    // Add to subscriptions for cleanup
    this.subscriptions.add({
      unsubscribe: () => window.removeEventListener('scroll', scrollHandler)
    });
  }
  
  /**
   * Add scroll-based animation effects to cuisine categories
   */
  private addScrollEffects(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !this.cuisineCategories) {
      return;
    }

    // Make sure IntersectionObserver is available (browser support)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.renderer.addClass(entry.target, 'in-view');
            }
          });
        },
        { threshold: 0.2 }
      );
      
      this.cuisineCategories.forEach(categoryRef => {
        observer.observe(categoryRef.nativeElement);
      });
      
      // Add to subscriptions for cleanup
      this.subscriptions.add({
        unsubscribe: () => observer.disconnect()
      });
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      // Just add the 'in-view' class to all elements
      this.cuisineCategories.forEach(categoryRef => {
        this.renderer.addClass(categoryRef.nativeElement, 'in-view');
      });
    }
  }
  
  /**
   * Generate a consistent hue value for a category to maintain visual consistency
   */
  private getHueForCategory(category: string): number {
    // Simple hash function to convert category string to a number
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert hash to a hue value (0-360)
    return Math.abs(hash % 360);
  }
  
  /**
   * Handle API error by showing error state and possibly loading static data
   */
  private handleError(): void {
    this.loading = false;
    this.error = true;
    // In a real application, you might want to load static fallback data here
  }
  
  /**
   * Select the best item from a category (featured, highest rated, or first)
   */
  private getBestItemFromCategory(items: MenuItem[]): MenuItem {
    // First try to find a featured item
    const featuredItem = items.find(item => item.featured);
    if (featuredItem) return featuredItem;
    
    // If no featured items, try to find the one with highest rating if available
    // if (items[0].rating) {
    //   return items.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
    // }
    
    // Otherwise just return the first item
    return items[0];
  }
  
  /**
   * Truncate long descriptions to keep cards uniform
   */
  private truncateDescription(description: string, maxLength: number): string {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    
    return description.substring(0, maxLength) + '...';
  }

  /**
   * Add an item to the shopping cart
   */
  addToCart(menuItem: MenuItem): void {
    this.cartService.addToCart({
      id: menuItem.id,
      name: menuItem.name,
      basePrice: menuItem.basePrice,
      imageUrl: menuItem.imageUrl,
      description: menuItem.description,
      calories: menuItem.calories || 0,
      quantity: 1
    });
    
    // Provide visual feedback that item was added
    this.showAddedToCartFeedback();
  }
  
  /**
   * Visual feedback when items are added to cart
   */
  showAddedToCartFeedback(): void {
    this.notificationState = 'showing';
    setTimeout(() => {
      this.notificationState = 'hidden';
    }, 2000);
  }
  
  /**
   * Filter items by category
   */
  filterByCategory(category: string): void {
    this.selectedCategory = category;
    // In a real app, you would re-fetch or filter items based on category
    // Since we're showing one per category already, we'll just highlight the selected category
  }
  
  /**
   * Navigate between testimonial slides
   */
  changeSlide(direction: number): void {
    this.currentSlide = (this.currentSlide + direction + this.testimonials.length) % this.testimonials.length;
    this.resetAutoplayTimer();
  }
  
  /**
   * Set slide directly
   */
  setSlide(index: number): void {
    this.currentSlide = index;
    this.resetAutoplayTimer();
  }
  
  /**
   * Start automatic slideshow
   */
  private startAutomaticSlideshow(): void {
    this.autoplayInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.testimonials.length;
    }, 5000);
  }
  
  /**
   * Stop automatic slideshow
   */
  private stopAutomaticSlideshow(): void {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
    }
  }
  
  /**
   * Reset autoplay timer when user interacts with carousel
   */
  private resetAutoplayTimer(): void {
    this.stopAutomaticSlideshow();
    this.startAutomaticSlideshow();
  }
  
  /**
   * Handle card hover state
   */
  onCardMouseEnter(itemId: number | string): void {
    if (this.cardStates) {
      this.cardStates[itemId] = 'hovered';
    }
  }

  onCardMouseLeave(itemId: number | string): void {
    if (this.cardStates) {
      this.cardStates[itemId] = 'normal';
    }
  }

  getRandomPastelColor(id: number): string { 
    const hue = Math.floor((id * 137.508) % 360);
    return `hsl(${hue}, 80%, 40%)`;
  }
    
  getImagePath(item: any): string {
      if (!item) return '';
      
      if (item.imagePath) {
          return item.imagePath.startsWith('http') 
              ? item.imagePath 
              : this.imageUrl + item.imagePath;
      }
      
      if (item.imageUrl) {
          return item.imageUrl.startsWith('http')
              ? item.imageUrl
              : this.imageUrl + item.imageUrl;
      }
      
      return '';
  }
}