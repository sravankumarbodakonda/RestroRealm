import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../core/services/reservation/reservation.service';

interface TableOption {
  id: number;
  capacity: number;
  location: 'window' | 'center' | 'corner';
}

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.css']
})
export class ReservationComponent {
  private reservationService = inject(ReservationService);

  // Form data
  date: string = '';
  time: string = '';
  numGuests: number = 2;
  duration: number = 2;
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  phone: string = '';
  specialRequests: string = '';
  occasion: string = 'regular';

  // UI state
  currentStep: number = 1;
  availableTables: TableOption[] = [];
  selectedTableId: number | null = null;
  availableSlots: string[] = [];
  selectedTime: string = '';
  isLoggedIn: boolean = false;
  reservationComplete: boolean = false;
  confirmationCode: string = '';
  
  // Modal states
  showModal: boolean = false;
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  isErrorFading: boolean = false;
  errorMessage: string = '';
  
  /** Helper method to adjust guest count */
  adjustGuests(amount: number): void {
    const newCount = this.numGuests + amount;
    if (newCount >= 1 && newCount <= 20) {
      this.numGuests = newCount;
    }
  }
  
  /** Step 1: Find available tables based on selected date and time */
findTables() {
    if (!this.date || !this.time || !this.numGuests) {
      return;
    }
    
    this.reservationService.getAvailableTables(this.date, this.time, this.numGuests).subscribe({
      next: (tables) => {
        // Transform API response to include location information if needed
        this.availableTables = tables.map((table: any) => {
          // If the API already provides location, use it
          if (table.location) {
            return table;
          }
          
          // Otherwise, assign a location based on table ID or some other logic
          // This assumes your table IDs follow a pattern where:
          // - Lower IDs (1-4) are window tables
          // - Middle IDs (5-10) are center tables
          // - Higher IDs (11+) are corner tables
          let location: 'window' | 'center' | 'corner';
          
          if (table.id <= 4 || table.id % 10 <= 3) {
            location = 'window';
          } else if (table.id <= 10 || table.id % 10 <= 7) {
            location = 'center';
          } else {
            location = 'corner';
          }
          
          return {
            id: table.id || table,
            capacity: table.capacity || this.numGuests + 2,
            location: location
          };
        });
        
        this.selectedTableId = null;
        this.availableSlots = [];
        this.currentStep = 2;
      },
      error: (err) => {
        console.error('Error fetching tables:', err);
        alert('Unable to fetch available tables. Please try again later.');
      }
    });
  }

  /** Helper method to get tables by location */
  getTablesByLocation(location: 'window' | 'center' | 'corner'): TableOption[] {
    return this.availableTables.filter(table => table.location === location);
  }
  
  /** Helper method to get table location by id */
  getTableLocation(tableId: number | null): string {
    if (!tableId) return '';
    
    const table = this.availableTables.find(t => t.id === tableId);
    if (!table) return '';
    
    switch(table.location) {
      case 'window': return 'Window View';
      case 'center': return 'Center Area';
      case 'corner': return 'Private Corner';
      default: return '';
    }
  }

  /** Select a table and fetch available time slots */
  selectTable(tableId: number) {
    this.selectedTableId = tableId;
    this.fetchAvailableTimeSlots();
  }

  /** Fetch available time slots for selected table */
  fetchAvailableTimeSlots() {
    if (!this.date || !this.selectedTableId) {
      return;
    }

    this.reservationService.getAvailableTimeSlots(this.date, this.selectedTableId, this.numGuests).subscribe({
      next: (response) => {
        this.availableSlots = response.availableSlots;
        this.selectedTime = '';
        
        if (this.availableSlots.length === 0) {
          // Generate mock time slots
          this.generateMockTimeSlots();
        }
      },
      error: (err) => {
        console.error('Error fetching time slots:', err);
        // Generate mock time slots for demo
        this.generateMockTimeSlots();
      }
    });
  }
  
  /** Generate mock time slots for UI demonstration */
  private generateMockTimeSlots() {
    // Get hours based on selected time or default to evening
    const [hours, minutes] = this.time ? this.time.split(':').map(Number) : [18, 0];
    const baseTime = new Date();
    baseTime.setHours(hours, minutes, 0);
    
    this.availableSlots = [];
    // Generate slots 30 minutes apart
    for (let i = 0; i < 6; i++) {
      const slotTime = new Date(baseTime);
      slotTime.setMinutes(baseTime.getMinutes() + (i * 30));
      
      const formattedHours = slotTime.getHours();
      const formattedMinutes = slotTime.getMinutes().toString().padStart(2, '0');
      const period = formattedHours >= 12 ? 'PM' : 'AM';
      const displayHours = formattedHours > 12 ? formattedHours - 12 : formattedHours === 0 ? 12 : formattedHours;
      
      this.availableSlots.push(`${displayHours}:${formattedMinutes} ${period}`);
    }
  }

  /** Check if reservation data is valid */
  isValidReservation(): boolean {
    if (this.isLoggedIn) {
      return !!this.selectedTableId && !!this.selectedTime && !!this.duration;
    }
    
    return !!this.selectedTableId && 
           !!this.selectedTime && 
           !!this.duration &&
           !!this.firstName &&
           !!this.lastName &&
           !!this.email &&
           !!this.phone;
  }

  /** Make the reservation */
  makeReservation() {
    if (!this.isValidReservation()) {
      return;
    }

    const reservationData = {
      tableId: this.selectedTableId,
      numGuests: this.numGuests,
      reservationDate: this.date,
      reservationTime: this.selectedTime,
      duration: this.duration,
      customerName: `${this.firstName} ${this.lastName}`,
      customerContact: this.phone,
      email: this.email,
      specialRequests: this.specialRequests,
      occasion: this.occasion
    };

    this.reservationService.createReservation(reservationData).subscribe({
      next: (response) => {
        // Use the actual reservation ID from the API response
        this.confirmationCode = `RR-${response.id}`;
        this.reservationComplete = true;
        
        // Show success modal
        this.showSuccessModal = true;
        this.showModal = true;
      },
      error: (err) => {
        console.error('Error making reservation:', err);
        
        // Handle different error cases
        if (err.error && err.error.message && 
            err.error.message.includes('Table is already reserved')) {
          this.errorMessage = 'This table is already reserved for the requested time. Please select a different table or time slot.';
        } else {
          this.errorMessage = 'There was an error processing your reservation. Please try again later.';
        }
        
        // Show error modal
        this.showErrorModal = true;
        this.showModal = true;
        
        // Set timer to auto-dismiss the error modal after 5 seconds
        setTimeout(() => {
          this.isErrorFading = true;
          setTimeout(() => {
            this.closeModal();
          }, 500); // Match this to the fadeOut animation duration
        }, 5000);
      }
    });
  }
  
  /** Close modal and reset modal states */
  closeModal() {
    this.showModal = false;
    this.showSuccessModal = false;
    this.showErrorModal = false;
    this.isErrorFading = false;
  }

  /** Reset the form to make another reservation */
  resetForm() {
    this.date = '';
    this.time = '';
    this.numGuests = 2;
    this.duration = 2;
    this.selectedTableId = null;
    this.selectedTime = '';
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.phone = '';
    this.specialRequests = '';
    this.occasion = 'regular';
    this.currentStep = 1;
    this.reservationComplete = false;
  }
}
