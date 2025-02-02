import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
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
      this.getCategories();
      this.getAllMenuItems();
      this.getHeaders();
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
  
  getMenuItemsByCategory(categoryId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/menu-item/category/${categoryId}`, { headers: this.getHeaders() });
  }

  getMenuItemById(itemId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/menu-item/${itemId}`, { headers: this.getHeaders() });
  }

  // createMenuItem(item: any): Observable<any> {
  //   return this.http.post<any>(`${this.apiUrl}/menu-item/`, item, { headers: this.getHeaders() });
  // }

  // updateMenuItem(itemId: number, item: any): Observable<any> {
  //   return this.http.put<any>(`${this.apiUrl}/menu-item/${itemId}`, item, { headers: this.getHeaders() });
  // }

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
      .subscribe({
        next: (categories) => {
          this.categoriesSubject.next(categories);
        },
        error: (err) => {
          console.error('Error fetching categories:', err);
        }
      });
    
    return this.categories$;
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
    return this.http.get<any[]>(`${this.apiUrl}/menu-item/category/${categoryName}`, { headers: this.getHeaders() });
  }
}
