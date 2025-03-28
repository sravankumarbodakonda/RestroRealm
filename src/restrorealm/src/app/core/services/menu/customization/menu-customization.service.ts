import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { MenuCustomization } from '../../../../shared/models/menu-customization.model';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MenuCustomizationService {
  private apiUrl = environment.apiUrl;
  private readonly menuCustomizationsSubject = new BehaviorSubject<MenuCustomization[]>([]);
  private readonly menuCustomizations$ = this.menuCustomizationsSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object, 
    private authService: AuthService
  ) {
    this.loadMenuCustomizations();
  }

  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getRefreshToken()}`,
    });
  }

  // This method both loads data and returns the observable
  loadMenuCustomizations(): Observable<MenuCustomization[]> {
    console.log('Loading menu customizations from API');
    this.http.get<MenuCustomization[]>(`${this.apiUrl}/customization/`, { headers: this.getHeaders() })
      .subscribe({
        next: (menuCustomizations) => {
          console.log('Menu customizations loaded:', menuCustomizations.length);
          this.menuCustomizationsSubject.next(menuCustomizations);
        },
        error: (err) => {
          console.error('Error fetching menu customizations:', err);
        }
      });
    
    return this.menuCustomizations$;
  }
  
  // This just returns the observable without loading
  getMenuCustomizations(): Observable<MenuCustomization[]> {
    return this.menuCustomizations$;
  }
  
  // Refresh the menu customizations list by calling the API
  refreshMenuCustomizations(): void {
    console.log('Refreshing menu customizations from API');
    this.http.get<MenuCustomization[]>(`${this.apiUrl}/customization/`, { headers: this.getHeaders() })
      .subscribe({
        next: (menuCustomizations) => {
          console.log('Menu customizations refreshed:', menuCustomizations.length);
          this.menuCustomizationsSubject.next(menuCustomizations);
        },
        error: (err) => {
          console.error('Error refreshing menu customizations:', err);
        }
      });
  }
  
  getMenuCustomizationById(menuCustomizationId: string): Observable<MenuCustomization> {
    return this.http.get<MenuCustomization>(`${this.apiUrl}/customization/${menuCustomizationId}`, { 
      headers: this.getHeaders() 
    });
  }

  createMenuCustomization(formData: FormData): Observable<MenuCustomization> {
    return this.http.post<MenuCustomization>(`${this.apiUrl}/customization/`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getRefreshToken()}`
      })
    }).pipe(
      tap((newCustomization) => {
        console.log('Created new customization:', newCustomization);
        // Update the subject with the new customization
        const currentCustomizations = this.menuCustomizationsSubject.getValue();
        this.menuCustomizationsSubject.next([...currentCustomizations, newCustomization]);
        
        // Also refresh from API for complete data
        this.refreshMenuCustomizations();
      })
    );
  }

  updateMenuCustomization(menuCustomizationId: number, formData: FormData): Observable<MenuCustomization> {
    return this.http.put<MenuCustomization>(`${this.apiUrl}/customization/${menuCustomizationId}`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getRefreshToken()}`
      })
    }).pipe(
      tap((updatedCustomization) => {
        console.log('Updated customization:', updatedCustomization);
        // Update the subject with the updated customization
        const currentCustomizations = this.menuCustomizationsSubject.getValue();
        const updatedCustomizations = currentCustomizations.map(customization => 
          customization.id === updatedCustomization.id ? updatedCustomization : customization
        );
        this.menuCustomizationsSubject.next(updatedCustomizations);
        
        // Also refresh from API for complete data
        this.refreshMenuCustomizations();
      })
    );
  }

  deleteMenuCustomization(menuCustomizationId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/customization/${menuCustomizationId}`, { 
      headers: this.getHeaders() 
    }).pipe(
      tap(() => {
        console.log('Deleted customization with ID:', menuCustomizationId);
        // Remove the deleted customization from the subject
        const currentCustomizations = this.menuCustomizationsSubject.getValue();
        const updatedCustomizations = currentCustomizations.filter(customization => customization.id !== menuCustomizationId);
        this.menuCustomizationsSubject.next(updatedCustomizations);
        
        // Also refresh from API for complete data
        this.refreshMenuCustomizations();
      })
    );
  }
}
