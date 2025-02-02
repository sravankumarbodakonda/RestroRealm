import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { PlatformService } from '../services/platform.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private platformService: PlatformService
  ) {}

  canActivate(): boolean {
    if (this.platformService.isBrowser()) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        return true;
      }
    }
    
    this.router.navigate(['/login']);
    return false;
  }
}
