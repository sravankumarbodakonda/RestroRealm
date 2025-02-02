import { CommonModule } from '@angular/common';
import { Component, Injectable, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { Subscription } from 'rxjs';
import { User } from '../../../shared/models/user.model';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { SidebarService } from '../../services/sidebar/sidebar.service';


@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, SidebarComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  standalone: true,
})
@Injectable({
  providedIn: 'root',
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  isSidebarOpen = true;
  showProfileDropdown = false;
  user: User | null = null;
  private authSubscription?: Subscription;
  private sidebarSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private sidebarService: SidebarService
  ) {}

  toggleSidebar() {
    this.sidebarService.toggle();
  }
  closeSidebar() {
    this.sidebarService.close();
  }

  toggleProfileDropdown() {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  viewProfile() {
    this.router.navigate(['/profile']).then(() => {
      console.log('Navigated to profile page');
    });
  }

  navigateToLogin() {
    this.router.navigate(['/login']).then(() => {
      console.log('Navigated to login page');
    });
  }

  navigateToRegister() {
    this.router.navigate(['/register']).then(() => {
      console.log('Navigated to register page');
    });
  }

  ngOnInit(): void {
    this.authSubscription = this.authService.isLoggedIn$.subscribe({
      next: (isLoggedIn) => {
        this.isLoggedIn = isLoggedIn;
      },
      error: (error) => {
        console.error('Auth subscription error:', error);
        this.isLoggedIn = false;
      }
    });
  
    this.sidebarSubscription = this.sidebarService.isOpen$.subscribe({
      next: (isOpen) => {
        this.isSidebarOpen = isOpen;
      },
      error: (error) => {
        console.error('Sidebar subscription error:', error);
      }
    });
  
    this.user = this.authService.getUserInfo();
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }
}
