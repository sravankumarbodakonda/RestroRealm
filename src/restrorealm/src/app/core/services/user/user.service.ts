import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  baseUrl = environment.apiUrl + '/user';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object, 
    private authService: AuthService
  ) {
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
  
  getAllUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}`,{ headers: this.getHeaders() });
  }

  getUserById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`,{ headers: this.getHeaders() });
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.baseUrl}/me`,{ headers: this.getHeaders() });
  }

  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/`, userData,{ headers: this.getHeaders() });
  }

  updateUser(id: number, userData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, userData,{ headers: this.getHeaders() });
  }

  updateCurrentUser(userData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/me`, userData,{ headers: this.getHeaders() });
  }

  uploadProfileImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.put(`${this.baseUrl}/me/profile-image`, formData,{ headers: this.getHeadersNoJson() });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`,{ headers: this.getHeaders() });
  }
}
