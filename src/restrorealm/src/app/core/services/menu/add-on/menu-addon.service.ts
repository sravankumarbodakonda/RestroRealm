import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { MenuAddOn } from '../../../../shared/models/menu-addon.model';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MenuAddonService {
  private apiUrl = environment.apiUrl;
  private readonly menuAddonsSubject = new BehaviorSubject<MenuAddOn[]>([]);
  private readonly menuAddons$ = this.menuAddonsSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object, 
    private authService: AuthService
  ) {
    this.loadMenuAddons();
  }

  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getRefreshToken()}`,
    });
  }

  // This method both loads data and returns the observable
  loadMenuAddons(): Observable<MenuAddOn[]> {
    this.http.get<MenuAddOn[]>(`${this.apiUrl}/menu-addon/`, { headers: this.getHeaders() })
      .subscribe({
        next: (menuAddons) => {
          console.log('Menu addons loaded:', menuAddons.length);
          this.menuAddonsSubject.next(menuAddons);
        },
        error: (err) => {
          console.error('Error fetching menu addons:', err);
        }
      });
    
    return this.menuAddons$;
  }
  
  // This just returns the observable without loading
  getMenuAddons(): Observable<MenuAddOn[]> {
    return this.menuAddons$;
  }
  
  // Refresh the menu addons list by calling the API
  refreshMenuAddons(): void {
    console.log('Refreshing menu addons from API');
    this.http.get<MenuAddOn[]>(`${this.apiUrl}/menu-addon/`, { headers: this.getHeaders() })
      .subscribe({
        next: (menuAddons) => {
          console.log('Menu addons refreshed:', menuAddons.length);
          this.menuAddonsSubject.next(menuAddons);
        },
        error: (err) => {
          console.error('Error refreshing menu addons:', err);
        }
      });
  }
  
  getMenuAddonById(menuAddonId: string): Observable<MenuAddOn> {
    return this.http.get<MenuAddOn>(`${this.apiUrl}/menu-addon/${menuAddonId}`, { 
      headers: this.getHeaders() 
    });
  }

  createMenuAddon(formData: FormData): Observable<MenuAddOn> {
    return this.http.post<MenuAddOn>(`${this.apiUrl}/menu-addon/`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getRefreshToken()}`
      })
    }).pipe(
      tap((newAddon) => {
        console.log('Created new addon:', newAddon);
        // Update the subject with the new addon
        const currentAddons = this.menuAddonsSubject.getValue();
        this.menuAddonsSubject.next([...currentAddons, newAddon]);
        
        // Also refresh from API for complete data
        this.refreshMenuAddons();
      })
    );
  }

  updateMenuAddon(menuAddonId: number, formData: FormData): Observable<MenuAddOn> {
    return this.http.put<MenuAddOn>(`${this.apiUrl}/menu-addon/${menuAddonId}`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getRefreshToken()}`
      })
    }).pipe(
      tap((updatedAddon) => {
        console.log('Updated addon:', updatedAddon);
        // Update the subject with the updated addon
        const currentAddons = this.menuAddonsSubject.getValue();
        const updatedAddons = currentAddons.map(addon => 
          addon.id === updatedAddon.id ? updatedAddon : addon
        );
        this.menuAddonsSubject.next(updatedAddons);
        
        // Also refresh from API for complete data
        this.refreshMenuAddons();
      })
    );
  }

  deleteMenuAddon(menuAddonId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/menu-addon/${menuAddonId}`, { 
      headers: this.getHeaders() 
    }).pipe(
      tap(() => {
        console.log('Deleted addon with ID:', menuAddonId);
        // Remove the deleted addon from the subject
        const currentAddons = this.menuAddonsSubject.getValue();
        const updatedAddons = currentAddons.filter(addon => addon.id !== menuAddonId);
        this.menuAddonsSubject.next(updatedAddons);
        
        // Also refresh from API for complete data
        this.refreshMenuAddons();
      })
    );
  }
}
