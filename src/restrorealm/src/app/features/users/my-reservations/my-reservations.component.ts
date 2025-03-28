import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation/reservation.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-reservations',
  imports: [CommonModule, FormsModule],
  templateUrl: './my-reservations.component.html',
  styleUrl: './my-reservations.component.css'
})
export class MyReservationsComponent {
  viewMode = 'grid';
  allReservations: any[] = [];
  filteredReservations: any[] = [];
  reservations: any[] = [];
  selectedDate: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  statusOptions = ['ACTIVE', 'CANCELLED', 'COMPLETED'];
  selectedStatus: string = '';
  viewModes = ['grid', 'list'];
  isFiltersActive: boolean = false;

  constructor(
    private reservationService: ReservationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchReservations();
    if(this.allReservations.length == 0) {
      this.currentPage = 1;
      this.totalPages = 1;
    }
  }



  clearFilters(): void {
    this.selectedDate = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  fetchReservations(): void {
    this.reservationService.getMyReservations().subscribe({
      next: (data) => {
        this.allReservations = data.map(res => this.autoUpdateStatus(res));
        this.applyFilters();
      },
      error: (error) => console.error('Error fetching reservations:', error)
    });
  }

  private autoUpdateStatus(reservation: any): any {
    const now = new Date();
    const resDateTime = new Date(
      `${reservation.reservationDate}T${reservation.reservationTime}`
    );
    
    if (reservation.status === 'ACTIVE' && resDateTime < now) {
      return {...reservation, status: 'COMPLETED'};
    }
    return reservation;
  }

  applyFilters(): void {
    let filtered = this.allReservations;
    this.isFiltersActive = !!this.selectedDate || !!this.selectedStatus;

    if (this.selectedDate) {
      filtered = filtered.filter(res => 
        res.reservationDate === this.selectedDate
      );
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(res => 
        res.status === this.selectedStatus
      );
    }

    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.reservations = filtered.slice(
      (this.currentPage - 1) * this.itemsPerPage,
      this.currentPage * this.itemsPerPage
    );
  }

  addReservation(): void {
    this.router.navigate(['/reservation']);
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.applyFilters();
  }
}
