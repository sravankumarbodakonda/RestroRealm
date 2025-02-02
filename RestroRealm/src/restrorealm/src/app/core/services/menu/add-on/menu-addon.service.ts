import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MenuAddonService {
  private apiUrl = environment.apiUrl;
  private readonly menuAddonsSubject = new BehaviorSubject<any[]>([]);
  private readonly menuAddons$ = this.menuAddonsSubject.asObservable();
  constructor(
      private http: HttpClient,
      @Inject(PLATFORM_ID) private platformId: Object, 
      private authService: AuthService
    ) {
      this.getMenuAddons();
      this.getHeaders();
    }

  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getRefreshToken()}`,
    });
  }

  getMenuAddons(): Observable<any[]> {
    this.http.get<any[]>(`${this.apiUrl}/menu-addon/`, { headers: this.getHeaders() })
      .subscribe({
        next: (menuAddons) => {
          this.menuAddonsSubject.next(menuAddons);
        },
        error: (err) => {
          console.error('Error fetching menuAddons:', err);
        }
      });
    
    return this.menuAddons$;
  }
  
  getMenuAddonById(menuAddonId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/menu-addon/${menuAddonId}`, { headers: this.getHeaders() });
  }

  createMenuAddon(menuAddon: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/menu-addon/`, menuAddon, { headers: this.getHeaders() });
  }

  updateMenuAddon(menuAddonId: number, menuAddon: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/menu-addon/${menuAddonId}`, menuAddon, { headers: this.getHeaders() });
  }

  deleteMenuAddon(menuAddonId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/menu-addon/${menuAddonId}`, { headers: this.getHeaders() });
  }
}
