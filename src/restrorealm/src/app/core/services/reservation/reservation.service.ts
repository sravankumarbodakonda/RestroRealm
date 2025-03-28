import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private apiUrl = environment.apiUrl;
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object, 
    private authService: AuthService
  ) {}

  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getRefreshToken()}`
    });
  }

  getAvailableTables(date: string, time: string, numGuests: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/reservations/tables-availability?date=${date}&time=${time}&numGuests=${numGuests}`,
      { headers: this.getHeaders() }
    );
  }

  getAvailableTimeSlots(date: string, tableId: number, numGuests: number): Observable<{ availableSlots: string[] }> {
    return this.http.get<{ availableSlots: string[] }>(
      `${this.apiUrl}/reservations/availability?date=${date}&tableId=${tableId}&numGuests=${numGuests}`,
      { headers: this.getHeaders() }
    );
  }

  createReservation(reservationData: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/reservations`, 
      reservationData, 
      { headers: this.getHeaders() }
    );
  }

  getReservations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reservations`, { headers: this.getHeaders() });
  }

  getMyReservations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reservations/my`, { headers: this.getHeaders() });
  }

  updateReservationStatus(reservationId: number, status: string) {
    return this.http.get<any>(
      `${this.apiUrl}/reservations/${reservationId}/status/${status}`,  
      { headers: this.getHeaders() }
    );
  }
}
