import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = environment.apiUrl;
  private readonly rolesSubject = new BehaviorSubject<any[]>([]);
  private readonly roles$ = this.rolesSubject.asObservable();
  constructor(
      private http: HttpClient,
      @Inject(PLATFORM_ID) private platformId: Object, 
      private authService: AuthService
    ) {
      this.getRoles();
      this.getHeaders();
    }

  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getRefreshToken()}`,
    });
  }

  getRoles(): Observable<any[]> {
    this.http.get<any[]>(`${this.apiUrl}/role/`, { headers: this.getHeaders() })
      .subscribe({
        next: (roles) => {
          this.rolesSubject.next(roles);
        },
        error: (err) => {
          console.error('Error fetching roles:', err);
        }
      });
    
    return this.roles$;
  }
  
  getRoleById(roleId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/role/${roleId}`, { headers: this.getHeaders() });
  }

  createRole(role: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/role/`, role, { headers: this.getHeaders() });
  }

  updateRole(roleId: number, role: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/role/${roleId}`, role, { headers: this.getHeaders() });
  }

  deleteRole(roleId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/role/${roleId}`, { headers: this.getHeaders() });
  }
}
