import { CommonModule } from '@angular/common';
import { Component, OnInit, HostListener, ElementRef, Renderer2 } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '../../services/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger, keyframes, state } from '@angular/animations';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FontAwesomeModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ 
          opacity: 0, 
          transform: 'translateY(30px) scale(0.9)' 
        }),
        animate('0.6s {{delay}}ms cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
          style({ 
            opacity: 1, 
            transform: 'translateY(0) scale(1)' 
          })
        )
      ], { params: { delay: 0 } })
    ]),
    trigger('staggerAnimation', [
      transition('* => *', [
        query(':enter', [
          stagger(80, [
            animate('0.5s ease-out', 
              keyframes([
                style({ opacity: 0, transform: 'translateY(20px)', offset: 0 }),
                style({ opacity: 0.5, transform: 'translateY(10px)', offset: 0.5 }),
                style({ opacity: 1, transform: 'translateY(0)', offset: 1 })
              ])
            )
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0.5s ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class SettingsComponent implements OnInit {
  viewMode: 'card' | 'list' = 'card';
  settings: any[] = [];
  searchTerm: string = '';
  filteredSettings: any[] = [];
  hoveredSetting: string | null = null;
  isLoading: boolean = true;
  
  constructor(
      private router: Router,
      private authService: AuthService,
      private renderer: Renderer2,
      private el: ElementRef
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    // Automatically switch to list view on smaller screens
    if (event.target.innerWidth < 768 && this.viewMode === 'card') {
      this.viewMode = 'list';
      this.saveViewPreference('list');
    }
  }

  ngOnInit(): void {
    this.loadViewPreference();
    this.loadSettings();
    
    // Simulate loading state for visual effect
    setTimeout(() => {
      this.isLoading = false;
    }, 800);
  }

  loadSettings() {
    // Simulate API call
    setTimeout(() => {
      this.settings = [
        { 
          name: 'Roles', 
          description: 'Configure user roles and set access levels for different functionality across the system', 
          navigateTo: '/settings/role', 
          isVisible: this.hasPermission('READ_ALL_ROLES'), 
          icon: 'fas fa-users-cog',
          count: 0,
          lastUpdated: new Date('2025-02-15')
        },
        { 
          name: 'Permissions', 
          description: 'Define fine-grained permissions and security controls for system-wide access management', 
          navigateTo: '/settings/permission', 
          isVisible: this.hasPermission('READ_ALL_PERMISSIONS'), 
          icon: 'fas fa-shield-alt',
          count: 0,
          lastUpdated: new Date('2025-02-28')
        },
        { 
          name: 'Category', 
          description: 'Organize menu items into categories and subcategories for better navigation and user experience', 
          navigateTo: '/settings/category', 
          isVisible: this.hasPermission('READ_ALL_CATEGORIES'), 
          icon: 'fas fa-tags',
          count: 0,
          lastUpdated: new Date('2025-03-01')
        },
        { 
          name: 'Menu Add-on', 
          description: 'Create and manage additional options, toppings and customizations for menu items', 
          navigateTo: '/settings/menu-addon', 
          isVisible: this.hasPermission('READ_ALL_MENU_ADD_ONS'), 
          icon: 'fas fa-plus-circle',
          count: 0,
          lastUpdated: new Date('2025-03-04')
        },
        { 
          name: 'Menu Options', 
          description: 'Create and manage additional options, toppings and customizations for menu items', 
          navigateTo: '/settings/menu-option', 
          isVisible: this.hasPermission('READ_ALL_MENU_OPTIONS'), 
          icon: 'fas fa-list-alt',
          count: 0,
          lastUpdated: new Date('2025-03-17')
        },
        { 
          name: 'Menu Customizations', 
          description: 'Create and manage additional customizations, toppings and customizations for menu items', 
          navigateTo: '/settings/menu-customization', 
          isVisible: this.hasPermission('READ_ALL_CUSTOMIZATIONS'), 
          icon: 'fas fa-wrench',
          count: 0,
          lastUpdated: new Date('2025-03-17')
        },
        { 
          name: 'Users', 
          description: 'Manage user accounts, profiles, access controls and authentication settings', 
          navigateTo: '/settings/users', 
          isVisible: this.hasPermission('READ_ALL_USERS'), 
          icon: 'fas fa-user-friends',
          count: 0,
          lastUpdated: new Date('2025-03-05')
        },
        // Keep the non-visible settings as they may become visible based on permissions
        { name: 'Setting 6', description: 'This is the sixth setting', isVisible: false, icon: 'fas fa-cog', count: 0, lastUpdated: null  },
        { name: 'Setting 7', description: 'This is the seventh setting', isVisible: false, icon: 'fas fa-cog', count: 0, lastUpdated: null  },
        { name: 'Setting 8', description: 'This is the eighth setting', isVisible: false, icon: 'fas fa-cog', count: 0, lastUpdated: null  },
        { name: 'Setting 9', description: 'This is the ninth setting', isVisible: false, icon: 'fas fa-cog', count: 0, lastUpdated: null  },
        { name: 'Setting 10', description: 'This is the tenth setting', isVisible: false, icon: 'fas fa-cog', count: 0, lastUpdated: null  },
      ];
      this.applyFilters();
    }, 300);
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  onSearch() {
    this.applyFilters();
  }
  
  private applyFilters(): void {
    let filtered = [...this.settings].filter(setting => setting.isVisible);
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(setting =>
        setting.name.toLowerCase().includes(term) 
          || setting.description.toLowerCase().includes(term)
      );
    }
    this.filteredSettings = filtered;
  }

  onSelect(navigateTo: string) {
    if (navigateTo) {
      // Add a small delay for visual transition
      setTimeout(() => {
        this.router.navigate([navigateTo]);
      }, 300);
    }
  }

  resetSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  getSettingClass(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('role')) return 'roles';
    if (lowerName.includes('permission')) return 'permissions';
    if (lowerName.includes('category')) return 'category';
    if (lowerName.includes('add-on') || lowerName.includes('addon')) return 'addon';
    if (lowerName.includes('option') || lowerName.includes('option')) return 'option';
    if (lowerName.includes('user')) return 'users';
    return '';
  }

  onSettingHover(name: string) {
    this.hoveredSetting = name;
  }

  // Store view preference in local storage
  saveViewPreference(mode: 'card' | 'list') {
    localStorage.setItem('settings_view_mode', mode);
  }
  
  // Load view preference from local storage
  loadViewPreference() {
    const savedMode = localStorage.getItem('settings_view_mode') as 'card' | 'list';
    if (savedMode) {
      this.viewMode = savedMode;
    } else {
      // Default to card view on larger screens, list on mobile
      this.viewMode = window.innerWidth > 768 ? 'card' : 'list';
    }
  }
  
  // Get icon tooltip text
  getIconTooltip(setting: any): string {
    if (setting.count > 0) {
      return `${setting.count} ${setting.name.toLowerCase()} configured`;
    }
    return setting.name;
  }
  
  // Enhanced interactive features - without relationships
  enhanceItem(settingName: string, event: MouseEvent) {
    // Simple hover effect without relationships
    // This preserves the method signature but doesn't implement relationships
    // console.log(`User interacted with ${settingName}`);
  }
  
  // Format date for display
  formatLastUpdated(date: Date | null): string {
    if (!date) return 'Never updated';
    
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays === 0) return 'Updated today';
    if (diffDays === 1) return 'Updated yesterday';
    if (diffDays < 7) return `Updated ${diffDays} days ago`;
    
    return `Updated on ${date.toLocaleDateString()}`;
  }
}
