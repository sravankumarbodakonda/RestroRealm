import { CommonModule } from '@angular/common';
import { Component, Injectable, OnDestroy, OnInit, Inject, PLATFORM_ID, HostListener, Renderer2 } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { Subscription } from 'rxjs';
import { User } from '../../../shared/models/user.model';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { SidebarService } from '../../services/sidebar/sidebar.service';
import { CartService } from '../../services/cart/cart.service';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive, SidebarComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  standalone: true
})
@Injectable({
  providedIn: 'root',
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  isSidebarOpen = false;
  isMobileMenuOpen = false;
  showProfileDropdown = false;
  user: User | null = null;
  cartCount = 0;
  isBrowser: boolean;
  logoPath = environment.imageUrl + '/images/logo.png';
  
  private cartSubscription?: Subscription;
  private authSubscription?: Subscription;
  private sidebarSubscription?: Subscription;
  private clickEventListener: ((event: any) => void) | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private sidebarService: SidebarService,
    private cartService: CartService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Handle keyboard navigation
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.showProfileDropdown) {
      this.showProfileDropdown = false;
    }
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
    if (this.isSidebarOpen) {
      this.closeSidebar();
    }
  }

  toggleSidebar() {
    // Make sure to set the sidebar state
    this.isSidebarOpen = !this.isSidebarOpen;
    this.sidebarService.toggle();
    
    // Apply sidebar-expanded class to body for layout adjustments
    if (this.isBrowser) {
      if (this.isSidebarOpen) {
        this.renderer.addClass(document.body, 'sidebar-expanded');
      } else {
        this.renderer.removeClass(document.body, 'sidebar-expanded');
      }
    }
    
    // Close other menus when sidebar is opened
    if (this.isSidebarOpen) {
      this.showProfileDropdown = false;
      this.closeMobileMenu();
    }
  }

  closeSidebar() {
    if (this.isSidebarOpen) {
      this.isSidebarOpen = false;
      this.sidebarService.close();
      
      // Remove sidebar-expanded class from body
      if (this.isBrowser) {
        this.renderer.removeClass(document.body, 'sidebar-expanded');
      }
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    // Close other menus when mobile menu is opened
    if (this.isMobileMenuOpen) {
      this.showProfileDropdown = false;
      this.closeSidebar();
    }
  }

  closeMobileMenu() {
    if (this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  toggleProfileDropdown(event: Event) {
    // Prevent event from propagating to document click handler
    event.stopPropagation();
    
    this.showProfileDropdown = !this.showProfileDropdown;
    // Close mobile menu when profile dropdown is opened
    if (this.showProfileDropdown) {
      this.closeMobileMenu();
    }
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.showProfileDropdown = false;
    this.closeMobileMenu();
    this.closeSidebar();
  }

  viewProfile() {
    this.router.navigate(['/profile']).then(() => {
      this.showProfileDropdown = false;
    });
  }

  navigateToLogin() {
    this.router.navigate(['/login']).then(() => {
      this.showProfileDropdown = false;
      this.closeMobileMenu();
    });
  }

  navigateToRegister() {
    this.router.navigate(['/register']).then(() => {
      this.showProfileDropdown = false;
      this.closeMobileMenu();
    });
  }

  getUserInitials(): string {
    if (!this.user || !this.user.name) return '';
    
    const names = this.user.name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  // Close dropdowns when clicking outside
  handleOutsideClick(event: MouseEvent) {
    if (this.isBrowser) {
      const profileWrapper = document.querySelector('.profile-wrapper');
      const mobileMenu = document.querySelector('.mobile-nav');
      
      // Close profile dropdown if click is outside
      if (profileWrapper && !profileWrapper.contains(event.target as Node) && this.showProfileDropdown) {
        this.showProfileDropdown = false;
      }
      
      // Don't close mobile menu if clicked inside
      if (mobileMenu && mobileMenu.contains(event.target as Node)) {
        return;
      }
    }
  }

  ngOnInit(): void {
    // Only add browser-specific event listeners when running in the browser
    if (this.isBrowser) {
      this.clickEventListener = this.handleOutsideClick.bind(this);
      document.addEventListener('click', this.clickEventListener);
    }

    this.cartSubscription = this.cartService.cartItems$.subscribe(items => {
      this.cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
    });
    
    this.authSubscription = this.authService.isLoggedIn$.subscribe({
      next: (isLoggedIn) => {
        this.isLoggedIn = isLoggedIn;
        
        // Initialize user info when logged in
        if (isLoggedIn) {
          this.user = this.authService.getUserInfo();
        } else {
          this.user = null;
          // Make sure sidebar is closed when logged out
          this.closeSidebar();
        }
      },
      error: (error) => {
        console.error('Auth subscription error:', error);
        this.isLoggedIn = false;
      }
    });
  
    this.sidebarSubscription = this.sidebarService.isOpen$.subscribe({
      next: (isOpen) => {
        this.isSidebarOpen = isOpen;
        
        // Apply sidebar-expanded class to body for layout adjustments
        if (this.isBrowser) {
          if (isOpen) {
            this.renderer.addClass(document.body, 'sidebar-expanded');
          } else {
            this.renderer.removeClass(document.body, 'sidebar-expanded');
          }
        }
      },
      error: (error) => {
        console.error('Sidebar subscription error:', error);
      }
    });
  }

  ngOnDestroy(): void {
    // Only remove event listeners when running in the browser
    if (this.isBrowser && this.clickEventListener) {
      document.removeEventListener('click', this.clickEventListener);
    }
    
    // Reset state
    this.isSidebarOpen = false;
    this.showProfileDropdown = false;
    
    // Remove sidebar-expanded class from body
    if (this.isBrowser) {
      this.renderer.removeClass(document.body, 'sidebar-expanded');
    }
    
    // Clean up subscriptions
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }
}
