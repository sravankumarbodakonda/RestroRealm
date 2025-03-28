import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { Table } from '../../../shared/models/table.model';
import { BehaviorSubject, delay, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TableService {
  private apiUrl = environment.apiUrl;
  private readonly tablesSubject = new BehaviorSubject<any[]>([]);
  private readonly tables$ = this.tablesSubject.asObservable();
  constructor(
      private http: HttpClient,
      @Inject(PLATFORM_ID) private platformId: Object, 
      private authService: AuthService
    ) {
      this.getTables();
      this.getHeaders();
    }

  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getRefreshToken()}`,
    });
  }

  getTables(): Observable<any[]> {
    this.http.get<any[]>(`${this.apiUrl}/tables/`, { headers: this.getHeaders() })
      .subscribe({
        next: (tables) => {
          this.tablesSubject.next(tables);
        },
        error: (err) => {
          console.error('Error fetching tables:', err);
        }
      });
    
    return this.tables$;
  }
  
  getTableById(tableId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tables/${tableId}`, { headers: this.getHeaders() });
  }

  createTable(table: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tables/`, table, { headers: this.getHeaders() });
  }

  updateTable(tableId: number, table: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/tables/${tableId}`, table, { headers: this.getHeaders() });
  }

  deleteTable(tableId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/tables/${tableId}`, { headers: this.getHeaders() });
  }
}
