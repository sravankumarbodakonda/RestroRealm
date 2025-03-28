import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { MenuOption } from '../../../../shared/models/menu-option.model';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MenuOptionService {
  private apiUrl = environment.apiUrl;
  private readonly menuOptionsSubject = new BehaviorSubject<MenuOption[]>([]);
  private readonly menuOptions$ = this.menuOptionsSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object, 
    private authService: AuthService
  ) {
    this.loadMenuOptions();
  }

  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getRefreshToken()}`,
    });
  }

  // This method both loads data and returns the observable
  loadMenuOptions(): Observable<MenuOption[]> {
    console.log('Loading menu options from API');
    this.http.get<MenuOption[]>(`${this.apiUrl}/menu-option/`, { headers: this.getHeaders() })
      .subscribe({
        next: (menuOptions) => {
          console.log('Menu options loaded:', menuOptions.length);
          this.menuOptionsSubject.next(menuOptions);
        },
        error: (err) => {
          console.error('Error fetching menu options:', err);
        }
      });
    
    return this.menuOptions$;
  }
  
  // This just returns the observable without loading
  getMenuOptions(): Observable<MenuOption[]> {
    return this.menuOptions$;
  }
  
  // Refresh the menu options list by calling the API
  refreshMenuOptions(): void {
    console.log('Refreshing menu options from API');
    this.http.get<MenuOption[]>(`${this.apiUrl}/menu-option/`, { headers: this.getHeaders() })
      .subscribe({
        next: (menuOptions) => {
          console.log('Menu options refreshed:', menuOptions.length);
          this.menuOptionsSubject.next(menuOptions);
        },
        error: (err) => {
          console.error('Error refreshing menu options:', err);
        }
      });
  }
  
  getMenuOptionById(menuOptionId: string): Observable<MenuOption> {
    return this.http.get<MenuOption>(`${this.apiUrl}/menu-option/${menuOptionId}`, { 
      headers: this.getHeaders() 
    });
  }

  createMenuOption(formData: FormData): Observable<MenuOption> {
    return this.http.post<MenuOption>(`${this.apiUrl}/menu-option/`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getRefreshToken()}`
      })
    }).pipe(
      tap((newOption) => {
        console.log('Created new option:', newOption);
        // Update the subject with the new option
        const currentOptions = this.menuOptionsSubject.getValue();
        this.menuOptionsSubject.next([...currentOptions, newOption]);
        
        // Also refresh from API for complete data
        this.refreshMenuOptions();
      })
    );
  }

  updateMenuOption(menuOptionId: number, formData: FormData): Observable<MenuOption> {
    return this.http.put<MenuOption>(`${this.apiUrl}/menu-option/${menuOptionId}`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getRefreshToken()}`
      })
    }).pipe(
      tap((updatedOption) => {
        console.log('Updated option:', updatedOption);
        // Update the subject with the updated option
        const currentOptions = this.menuOptionsSubject.getValue();
        const updatedOptions = currentOptions.map(option => 
          option.id === updatedOption.id ? updatedOption : option
        );
        this.menuOptionsSubject.next(updatedOptions);
        
        // Also refresh from API for complete data
        this.refreshMenuOptions();
      })
    );
  }

  deleteMenuOption(menuOptionId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/menu-option/${menuOptionId}`, { 
      headers: this.getHeaders() 
    }).pipe(
      tap(() => {
        console.log('Deleted option with ID:', menuOptionId);
        // Remove the deleted option from the subject
        const currentOptions = this.menuOptionsSubject.getValue();
        const updatedOptions = currentOptions.filter(option => option.id !== menuOptionId);
        this.menuOptionsSubject.next(updatedOptions);
        
        // Also refresh from API for complete data
        this.refreshMenuOptions();
      })
    );
  }
}