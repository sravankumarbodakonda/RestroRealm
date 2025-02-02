import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { User } from '../../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private readonly isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private readonly userSubject = new BehaviorSubject<User | null>(null);

  public readonly isLoggedIn$ = this.isLoggedInSubject.asObservable();
  public readonly user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object 
  ) {
    this.checkInitialAuthState();
  }

  private checkInitialAuthState(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('accessToken');
      const user = localStorage.getItem('user');
  
      try {
        const parsedUser = user ? JSON.parse(user) : null;
        if (token && parsedUser) {
          this.isLoggedInSubject.next(true);
          this.userSubject.next(parsedUser);
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        this.clearInvalidData();
      }
    }
  }
  
  private clearInvalidData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
  

  getUserInfo(): User | null {
    return this.userSubject.value;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
      return localStorage.getItem('refreshToken');
  }

  refreshAccessToken(refreshToken: string) {
      return this.http.post<{ accessToken: string }>(`${this.apiUrl}/auth/refresh`, {
          refreshToken,
      }).pipe(
          tap((response) => {
              localStorage.setItem('accessToken', response.accessToken);
          })
      );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      map((response: any) => {
        if (isPlatformBrowser(this.platformId)) {
          this.getUserInfoFromToken(response.accessToken);
          this.storeTokens(response.accessToken, response.refreshToken);
        }
        this.setLoginStatus(true);
        return response;
      })
    );
  }

  register(name: string, email: string, password: string): Observable<any> {
    const roleId = -1;
    return this.http.post(`${this.apiUrl}/auth/signup`, { name, email, password, roleId }).pipe(
      map((response: any) => {
        return response;
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.clearTokens();
    }
    this.setLoginStatus(false);
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  getUserInfoFromToken(accessToken: string) {
    return this.http.get(`${this.apiUrl}/auth/validate/` + accessToken).subscribe({
      next: (response: any) => {
        console.log('User info from token:', response);
        this.userSubject.next(response);
        localStorage.setItem('user', JSON.stringify(response));
      },
      error: (error) => {
        console.error('Error fetching user info:', error);
      }
    });
  }

  private clearTokens(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  private setLoginStatus(status: boolean): void {
    this.isLoggedInSubject.next(status);
  }

  hasPermission(requiredPermission: string): boolean {
    return this.userSubject.value?.permissionDtoSet?.some(
        permission => permission.permissionCode === requiredPermission
    ) ?? false;
  }
}
