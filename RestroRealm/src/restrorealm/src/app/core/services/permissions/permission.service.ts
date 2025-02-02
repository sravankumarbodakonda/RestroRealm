import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private apiUrl = environment.apiUrl;
  private readonly permissionsSubject = new BehaviorSubject<any[]>([]);
  private readonly permissions$ = this.permissionsSubject.asObservable();
  constructor(
      private http: HttpClient,
      @Inject(PLATFORM_ID) private platformId: Object, 
      private authService: AuthService
    ) {
      this.getPermissions();
      this.getHeaders();
    }

  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getRefreshToken()}`,
    });
  }

  getPermissions(): Observable<any[]> {
    this.http.get<any[]>(`${this.apiUrl}/permission/`, { headers: this.getHeaders() })
      .subscribe({
        next: (permissions) => {
          this.permissionsSubject.next(permissions);
        },
        error: (err) => {
          console.error('Error fetching permissions:', err);
        }
      });
    
    return this.permissions$;
  }
  
  getPermissionById(permissionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/permission/${permissionId}`, { headers: this.getHeaders() });
  }

  createPermission(permission: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/permission/`, permission, { headers: this.getHeaders() });
  }

  updatePermission(permissionId: number, permission: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/permission/${permissionId}`, permission, { headers: this.getHeaders() });
  }

  deletePermission(permissionId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/permission/${permissionId}`, { headers: this.getHeaders() });
  }
}
