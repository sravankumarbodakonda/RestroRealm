import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable, catchError, tap, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private apiUrl = environment.apiUrl;
  private readonly categoriesSubject = new BehaviorSubject<any[]>([]);
  private readonly menuItemsSubject = new BehaviorSubject<any[]>([]);
  private readonly categories$ = this.categoriesSubject.asObservable();
  private readonly menuItems$ = this.menuItemsSubject.asObservable();
  
  constructor(
      private http: HttpClient,
      @Inject(PLATFORM_ID) private platformId: Object, 
      private authService: AuthService
    ) {
      if(this.authService.getRefreshToken()) {
        this.getHeaders();
        this.getCategories();
        this.getAllMenuItems();
      }
    }

    private getHeaders() {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authService.getRefreshToken()}`,
      });
    }
    
    private getHeadersNoJson() {
      return new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getRefreshToken()}`,
      });
    }
  
  getAllMenuItems(): Observable<any[]> {
      this.http.get<any[]>(`${this.apiUrl}/menu-item/`, { headers: this.getHeaders() })
        .pipe(
          // tap(data => console.log('Menu items received:', data)),
          catchError(error => {
            console.error('Error fetching menu items:', error);
            return of([]);
          })
        )
        .subscribe({
          next: (menuItems) => {
            this.menuItemsSubject.next(menuItems);
          },
          error: (err) => {
            console.error('Error fetching menu items:', err);
          }
        });

      return this.menuItems$;
  }
  
  getAllMenuItemsNoHeaders(): Observable<any[]> {
      return this.http.get<any[]>(`${this.apiUrl}/menu-item/public/all/`)
        .pipe(
          // tap(data => console.log('Public menu items received:', data)),
          catchError(error => {
            console.error('Error fetching public menu items:', error);
            return of([]);
          })
        );
  }
  
  getMenuItemsByCategory(categoryId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/menu-item/category/${categoryId}`, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error fetching items for category ${categoryId}:`, error);
          return of([]);
        })
      );
  }
  
  getMenuItemsByCategoryNoHeaders(categoryId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/menu-item/public/category/${categoryId}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching public items for category ${categoryId}:`, error);
          return of([]);
        })
      );
  }

  getMenuItemById(itemId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/menu-item/${itemId}`, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error(`Error fetching item ${itemId}:`, error);
          throw error;
        })
      );
  }

  createMenuItem(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/menu-item/`, formData, { headers: this.getHeadersNoJson() });
  }

  updateMenuItem(menuItemId: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/menu-item/${menuItemId}`, formData, { headers: this.getHeadersNoJson() });
  }

  deleteMenuItem(itemId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/menu-item/${itemId}`, { headers: this.getHeadersNoJson() });
  }

  getCategories(): Observable<any[]> {
    this.http.get<any[]>(`${this.apiUrl}/category/`, { headers: this.getHeaders() })
      .pipe(
        // tap(data => console.log('Categories received:', data)),
        catchError(error => {
          console.error('MenuService - Error fetching categories:', error);
          return of([]);
        })
      )
      .subscribe({
        next: (categories) => {
          this.categoriesSubject.next(categories);
        },
        error: (err) => {
          console.error('MenuService - Error fetching categories:', err);
        }
      });
    
    return this.categories$;
  }

  getCategoriesNoHeaders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/category/public/all/`)
      .pipe(
        // tap(data => console.log('Public categories received:', data)),
        catchError(error => {
          console.error('Error fetching public categories:', error);
          return of([]);
        })
      );
  }
  
  getCategoryById(categoryId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/category/${categoryId}`, { headers: this.getHeaders() });
  }

  createCategory(category: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/category/`, category, { headers: this.getHeadersNoJson() });
  }

  updateCategory(categoryId: number, category: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/category/${categoryId}`, category, { headers: this.getHeadersNoJson() });
  }

  deleteCategory(categoryId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/category/${categoryId}`, { headers: this.getHeaders() });
  }

  getMenuItemsByCategoryName(categoryName: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/menu-item/category/${encodeURIComponent(categoryName)}`, { 
      headers: this.getHeaders() 
    }).pipe(
      // tap(data => console.log(`Items for category '${categoryName}' received:`, data)),
      catchError(error => {
        console.error(`Error fetching items for category '${categoryName}':`, error);
        return of([]);
      })
    );
  }

  getMenuItemsByCategoryNameNoHeaders(categoryName: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/menu-item/public/category/${encodeURIComponent(categoryName)}`)
      .pipe(
        // tap(data => console.log(`Public items for category '${categoryName}' received:`, data.length)),
        catchError(error => {
          console.error(`Error fetching public items for category '${categoryName}':`, error);
          console.error(`Status: ${error.status}, Message: ${error.statusText}`);
          console.error(`URL called: ${this.apiUrl}/menu-item/public/category/${encodeURIComponent(categoryName)}`);
          return of([]);
        })
      );
  }
}
