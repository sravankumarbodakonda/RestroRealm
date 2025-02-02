import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '../../services/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { icon } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FontAwesomeModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  viewMode: 'card' | 'list' = 'card';
  settings: any[] = [];
  searchTerm: string = '';
  filteredSettings: any[] = [];
  
  constructor(
      private router: Router,
      private authService: AuthService, 
  ) {}

  ngOnInit(): void {
      this.loadSettings();
  }

  loadSettings() {
      this.settings = [
          { name: 'Roles', description: 'Able to manage roles', navigateTo: '/settings/role', isVisible: this.hasPermission('READ_ALL_ROLES'), icon: 'fas fa-users' },
          { name: 'Permissions', description: 'Able to manage permissions', navigateTo: '/settings/permission', isVisible: this.hasPermission('READ_ALL_PERMISSIONS'), icon: 'fas fa-user-shield' },
          { name: 'Category', description: 'Manage categories for menu', navigateTo: '/settings/category', isVisible: this.hasPermission('READ_ALL_CATEGORIES'), icon: 'fas fa-list' },
          { name: 'Menu Add-on', description: 'Manage the Add-ons for menu', navigateTo: '/settings/menu-addon', isVisible: this.hasPermission('READ_ALL_MENU_ADD_ONS'), icon: 'fas fa-utensils' },
          { name: 'Setting 5', description: 'This is the fifth setting', isVisible: false  },
          { name: 'Setting 6', description: 'This is the sixth setting', isVisible: false  },
          { name: 'Setting 7', description: 'This is the seventh setting', isVisible: false  },
          { name: 'Setting 8', description: 'This is the eighth setting', isVisible: false  },
          { name: 'Setting 9', description: 'This is the ninth setting', isVisible: false  },
          { name: 'Setting 10', description: 'This is the tenth setting', isVisible: false  },
      ];
      this.filteredSettings = this.settings;
  }

  hasPermission(permission: string): boolean {
      return this.authService.hasPermission(permission);
  }

  onSearch() {
      this.applyFilters();
  }
  
  private applyFilters(): void {
      let filtered = [...this.settings];
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
      this.router.navigate([navigateTo]);
  }
}
