import { Component, OnInit, OnDestroy, HostListener, Renderer2 } from '@angular/core';
import { ReservationService } from '../../core/services/reservation/reservation.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableService } from '../../core/services/table/table.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-all-reservations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './all-reservations.component.html',
  styleUrls: ['./all-reservations.component.css']
})
export class AllReservationsComponent implements OnInit, OnDestroy {
  // View modes
  viewMode = 'grid';
  isViewTransitioning = false;
  
  // Data
  allReservations: any[] = [];
  reservations: any[] = [];
  availableTables: any[] = [];
  
  // Filtering
  selectedDate: string = new Date().toISOString().split('T')[0]; // Default to today
  nameQuery: string = '';
  phoneQuery: string = '';
  emailQuery: string = '';
  timeRangeStart: string = '';
  timeRangeEnd: string = '';
  selectedTables: string[] = [];
  selectedStatuses: string[] = ['ACTIVE'];
  statusOptions = ['ACTIVE', 'OCCUPIED', 'CANCELLED', 'COMPLETED'];
  showFilters: boolean = true; // Property for filter visibility
  
  // Multiselect dropdowns
  isTableDropdownOpen: boolean = false;
  isStatusDropdownOpen: boolean = false;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 8; // Changed from 10 to 8 for better grid layout
  totalReservations: number = 0;
  
  // Selection & UI state
  selectedReservations: Set<number> = new Set();
  showModal: boolean = false;
  selectedReservation: any = null;
  undoStates: Map<number, { originalStatus: string, timeout: any }> = new Map();
  
  // Permission check
  hasViewPermission: boolean = false;
  private subscriptions: Subscription = new Subscription();
  isLoading: boolean = true;
  
  // Toast messages
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  toastTimeout: any;
  
  constructor(
    private reservationService: ReservationService,
    private tableService: TableService,
    private authService: AuthService,
    private router: Router,
    private renderer: Renderer2
  ) {}

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Check if click was outside the dropdowns
    const clickedElement = event.target as HTMLElement;
    
    // Close table dropdown if clicked outside
    if (this.isTableDropdownOpen && 
        !clickedElement.closest('.table-filter') && 
        !clickedElement.closest('.table-dropdown')) {
      this.isTableDropdownOpen = false;
    }
    
    // Close status dropdown if clicked outside
    if (this.isStatusDropdownOpen && 
        !clickedElement.closest('.status-filter') && 
        !clickedElement.closest('.status-dropdown')) {
      this.isStatusDropdownOpen = false;
    }
  }

  ngOnInit(): void {
    this.isLoading = true;
    // Add a small delay to ensure proper rendering of UI elements
    setTimeout(() => {
      this.checkPermission();
    }, 100);
    
    // Initialize the view mode toggle
    this.initializeViewModeToggle();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    // Clear all timeouts
    this.undoStates.forEach(state => {
      clearTimeout(state.timeout);
    });
    
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  // Initialize view mode toggle with proper positioning
  initializeViewModeToggle(): void {
    setTimeout(() => {
      const toggleContainer = document.querySelector('.view-mode-toggle');
      if (toggleContainer) {
        this.renderer.setAttribute(toggleContainer, 'data-view', this.viewMode);
      }
    }, 0);
  }

  // Set view mode (grid or list)
  setViewMode(mode: 'grid' | 'list'): void {
    if (this.viewMode === mode) return;
    
    this.viewMode = mode;
    
    // Update toggle attribute
    const toggleContainer = document.querySelector('.view-mode-toggle');
    if (toggleContainer) {
      this.renderer.setAttribute(toggleContainer, 'data-view', mode);
    }
    
    // Add transition class to container
    const container = document.querySelector('.item-container');
    if (container) {
      this.isViewTransitioning = true;
      this.renderer.addClass(container, 'view-transition');
      
      // Remove class after animation completes
      setTimeout(() => {
        if (container) {
          this.renderer.removeClass(container, 'view-transition');
        }
        this.isViewTransitioning = false;
      }, 500);
    }
  }

  // Toggle filters visibility
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    
    if (this.showFilters) {
      // Position the dropdowns after animation completes
      setTimeout(() => {
        this.positionDropdowns();
      }, 600);
    }
  }

  // Position dropdowns correctly
  positionDropdowns(): void {
    // Position table dropdown
    const tableDropdown = document.querySelector('.table-dropdown');
    const tableSelect = document.querySelector('.table-filter .multiselect-selected');
    
    if (tableDropdown && tableSelect && this.isTableDropdownOpen) {
      const rect = tableSelect.getBoundingClientRect();
      this.renderer.setStyle(tableDropdown, 'position', 'fixed');
      this.renderer.setStyle(tableDropdown, 'top', `${rect.bottom + 5}px`);
      this.renderer.setStyle(tableDropdown, 'left', `${rect.left}px`);
      this.renderer.setStyle(tableDropdown, 'width', `${rect.width}px`);
      this.renderer.setStyle(tableDropdown, 'z-index', '1000');
    }
    
    // Position status dropdown
    const statusDropdown = document.querySelector('.status-dropdown');
    const statusSelect = document.querySelector('.status-filter .multiselect-selected');
    
    if (statusDropdown && statusSelect && this.isStatusDropdownOpen) {
      const rect = statusSelect.getBoundingClientRect();
      this.renderer.setStyle(statusDropdown, 'position', 'fixed');
      this.renderer.setStyle(statusDropdown, 'top', `${rect.bottom + 5}px`);
      this.renderer.setStyle(statusDropdown, 'left', `${rect.left}px`);
      this.renderer.setStyle(statusDropdown, 'width', `${rect.width}px`);
      this.renderer.setStyle(statusDropdown, 'z-index', '1000');
    }
  }

  // Get count of applied filters for badge
  getAppliedFiltersCount(): number {
    let count = 0;
    if (this.nameQuery) count++;
    if (this.phoneQuery) count++;
    if (this.emailQuery) count++;
    if (this.timeRangeStart || this.timeRangeEnd) count++;
    if (this.selectedTables.length > 0) count++;
    if (!this.arraysEqual(this.selectedStatuses, ['ACTIVE'])) count++;
    return count;
  }

  // Helper to compare arrays for filter detection
  arraysEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  // Get appropriate Material Icon for status
  getStatusIcon(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'schedule';
      case 'OCCUPIED': return 'restaurant';
      case 'CANCELLED': return 'cancel';
      case 'COMPLETED': return 'check_circle';
      default: return 'help';
    }
  }

  // Get appropriate class for status styling
  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'active';
      case 'OCCUPIED': return 'occupied';
      case 'CANCELLED': return 'cancelled';
      case 'COMPLETED': return 'completed';
      default: return '';
    }
  }

  // Toggle multiselect dropdowns
  toggleTableDropdown(): void {
    this.isTableDropdownOpen = !this.isTableDropdownOpen;
    this.isStatusDropdownOpen = false; // Close other dropdown
    
    // Position the dropdown after it's opened
    if (this.isTableDropdownOpen) {
      setTimeout(() => {
        const tableDropdown = document.querySelector('.table-dropdown');
        const tableSelect = document.querySelector('.table-filter .multiselect-selected');
        
        if (tableDropdown && tableSelect) {
          const rect = tableSelect.getBoundingClientRect();
          this.renderer.setStyle(tableDropdown, 'position', 'fixed');
          this.renderer.setStyle(tableDropdown, 'top', `${rect.bottom + 5}px`);
          this.renderer.setStyle(tableDropdown, 'left', `${rect.left}px`);
          this.renderer.setStyle(tableDropdown, 'width', `${rect.width}px`);
          this.renderer.setStyle(tableDropdown, 'z-index', '1000');
        }
      }, 0);
    }
  }

  toggleStatusDropdown(): void {
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
    this.isTableDropdownOpen = false; // Close other dropdown
    
    // Position the dropdown after it's opened
    if (this.isStatusDropdownOpen) {
      setTimeout(() => {
        const statusDropdown = document.querySelector('.status-dropdown');
        const statusSelect = document.querySelector('.status-filter .multiselect-selected');
        
        if (statusDropdown && statusSelect) {
          const rect = statusSelect.getBoundingClientRect();
          this.renderer.setStyle(statusDropdown, 'position', 'fixed');
          this.renderer.setStyle(statusDropdown, 'top', `${rect.bottom + 5}px`);
          this.renderer.setStyle(statusDropdown, 'left', `${rect.left}px`);
          this.renderer.setStyle(statusDropdown, 'width', `${rect.width}px`);
          this.renderer.setStyle(statusDropdown, 'z-index', '1000');
        }
      }, 0);
    }
  }

  // Table selection methods
  toggleTableSelection(tableId: string): void {
    const index = this.selectedTables.indexOf(tableId);
    if (index === -1) {
      this.selectedTables.push(tableId);
    } else {
      this.selectedTables.splice(index, 1);
    }
  }

  toggleAllTables(event: any): void {
    if (event.target.checked) {
      this.selectedTables = this.availableTables.map(table => table.id.toString());
    } else {
      this.selectedTables = [];
    }
  }

  clearSelectedTables(): void {
    this.selectedTables = [];
  }

  // Status selection methods
  toggleStatusSelection(status: string): void {
    const index = this.selectedStatuses.indexOf(status);
    if (index === -1) {
      this.selectedStatuses.push(status);
    } else {
      this.selectedStatuses.splice(index, 1);
    }
  }

  toggleAllStatuses(event: any): void {
    if (event.target.checked) {
      this.selectedStatuses = [...this.statusOptions];
    } else {
      this.selectedStatuses = [];
    }
  }

  clearSelectedStatuses(): void {
    this.selectedStatuses = ['ACTIVE'];
  }

  // Get appropriate Material Icon for toast
  getToastIcon(): string {
    switch (this.toastType) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  }

  private checkPermission(): void {
    this.hasViewPermission = this.authService.hasPermission('READ_ALL_RESERVATIONS');
    
    if (this.hasViewPermission) {
      this.fetchReservations();
      this.fetchAvailableTables();
    } else {
      this.isLoading = false;
      this.showToastNotification('You do not have permission to view reservations', 'error');
    }
  }

  fetchReservations(): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.reservationService.getReservations().subscribe(
        (data) => {
          this.allReservations = data;
          this.applyFilters();
          this.isLoading = false;
        },
        (error) => {
          console.error('Error fetching reservations:', error);
          this.isLoading = false;
          this.showToastNotification('Failed to load reservations', 'error');
        }
      )
    );
  }

  fetchAvailableTables(): void {
    this.subscriptions.add(
      this.tableService.getTables().subscribe(
        tables => {
          this.availableTables = tables.filter(table => table.reservable);
        },
        error => {
          console.error('Error fetching tables:', error);
          this.showToastNotification('Failed to load tables', 'error');
        }
      )
    );
  }

  applyFilters(): void {
    let filtered = this.allReservations;

    // Date filter
    if (this.selectedDate) {
      filtered = filtered.filter(reservation => 
        reservation.reservationDate === this.selectedDate
      );
    }

    // Time range filter
    if (this.timeRangeStart && this.timeRangeEnd) {
      filtered = filtered.filter(reservation => {
        const resTime = this.timeToMinutes(reservation.reservationTime);
        return resTime >= this.timeToMinutes(this.timeRangeStart) && 
               resTime <= this.timeToMinutes(this.timeRangeEnd);
      });
    }

    // Text filters
    filtered = filtered.filter(reservation => 
      (!this.nameQuery || reservation.customerName.toLowerCase().includes(this.nameQuery.toLowerCase())) &&
      (!this.phoneQuery || reservation.phone?.includes(this.phoneQuery)) &&
      (!this.emailQuery || reservation.email?.toLowerCase().includes(this.emailQuery.toLowerCase()))
    );

    // Table filter
    if (this.selectedTables.length > 0) {
      filtered = filtered.filter(reservation => 
        this.selectedTables.includes(reservation.tableId?.toString())
      );
    }

    // Status filter
    if (this.selectedStatuses.length > 0) {
      filtered = filtered.filter(reservation => 
        this.selectedStatuses.includes(reservation.status)
      );
    }

    // Calculate total for pagination
    this.totalReservations = filtered.length;
    
    // Apply pagination
    this.reservations = filtered.slice(
      (this.currentPage - 1) * this.itemsPerPage,
      this.currentPage * this.itemsPerPage
    );
    
    // Add a transition class to the container to animate changes
    if (filtered.length > 0) {
      const container = document.querySelector('.item-container');
      if (container && !this.isViewTransitioning) {
        this.renderer.addClass(container, 'view-transition');
        setTimeout(() => {
          if (container) {
            this.renderer.removeClass(container, 'view-transition');
          }
        }, 500);
      }
    }
  }

  timeToMinutes(time: string): number {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  clearFilters(): void {
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.nameQuery = '';
    this.phoneQuery = '';
    this.emailQuery = '';
    this.timeRangeStart = '';
    this.timeRangeEnd = '';
    this.selectedTables = [];
    this.selectedStatuses = ['ACTIVE'];
    this.applyFilters();
    this.showToastNotification('Filters have been reset', 'info');
  }

  get isFiltersActive(): boolean {
    return !!this.nameQuery ||
      !!this.phoneQuery ||
      !!this.emailQuery ||
      !!this.timeRangeStart ||
      !!this.timeRangeEnd ||
      this.selectedTables.length > 0 ||
      this.selectedStatuses.length !== 1 ||
      this.selectedStatuses[0] !== 'ACTIVE';
  }

  setStatus(reservationId: number, status: string): void {
    const reservation = this.allReservations.find(r => r.id === reservationId);
    if (!reservation) return;

    const originalStatus = reservation.status;
    reservation.status = status;

    // Clear existing timeout if there is one
    const existing = this.undoStates.get(reservationId);
    if (existing) clearTimeout(existing.timeout);

    // Set new timeout
    const timeout = setTimeout(() => {
      this.undoStates.delete(reservationId);
      
      // Call the API to update the status
      this.reservationService.updateReservationStatus(reservationId, status).subscribe(
        () => {
          this.showToastNotification(`Reservation status updated to ${status}`, 'success');
        },
        error => {
          console.error('Error updating reservation status:', error);
          // Revert the status in UI
          reservation.status = originalStatus;
          this.showToastNotification('Failed to update reservation status', 'error');
        }
      );
      
    }, 5000);

    this.undoStates.set(reservationId, { originalStatus, timeout });
    this.applyFilters();
  }

  undoStatusChange(reservationId: number): void {
    const state = this.undoStates.get(reservationId);
    if (state) {
      clearTimeout(state.timeout);
      
      const reservation = this.allReservations.find(r => r.id === reservationId);
      if (reservation) reservation.status = state.originalStatus;
      
      this.undoStates.delete(reservationId);
      this.applyFilters();
      
      this.showToastNotification('Status change undone', 'info');
    }
  }

  occupySelected(): void {
    if (this.selectedReservations.size === 0) {
      this.showToastNotification('No reservations selected', 'warning');
      return;
    }
    
    this.selectedReservations.forEach(id => {
      this.setStatus(id, 'OCCUPIED');
    });
    
    this.showToastNotification(`${this.selectedReservations.size} reservations marked as occupied`, 'success');
    this.selectedReservations.clear();
  }

  addReservation(): void {
    this.router.navigate(['/reservation']);
  }

  changePage(page: number): void {
    if (page < 1 || page > Math.ceil(this.totalReservations / this.itemsPerPage)) return;
    
    this.currentPage = page;
    this.applyFilters();
    
    // Scroll to top of the container
    const container = document.querySelector('.menu-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toggleSelection(reservationId: number): void {
    if (this.selectedReservations.has(reservationId)) {
      this.selectedReservations.delete(reservationId);
    } else {
      this.selectedReservations.add(reservationId);
    }
  }

  cancelSelectedReservations(): void {
    if (this.selectedReservations.size === 0) {
      this.showToastNotification('No reservations selected', 'warning');
      return;
    }
    
    const count = this.selectedReservations.size;
    this.allReservations.forEach(reservation => {
      if (this.selectedReservations.has(reservation.id)) {
        this.setStatus(reservation.id, 'CANCELLED');
      }
    });
    
    this.selectedReservations.clear();
    this.applyFilters();
    
    this.showToastNotification(`${count} reservations cancelled`, 'success');
  }

  openModal(reservation: any): void {
    this.selectedReservation = reservation;
    this.showModal = true;
    
    // Add fade-in animation class to modal
    setTimeout(() => {
      const modal = document.querySelector('.modal');
      if (modal) {
        this.renderer.addClass(modal, 'fade-in');
      }
    }, 10);
  }

  closeModal(event: any): void {
    if (event.target.classList.contains('modal-backdrop')) {
      this.showModal = false;
      this.selectedReservation = null;
    }
  }

  closeModalButton(): void {
    this.showModal = false;
    this.selectedReservation = null;
  }

  showToastNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    // Clear any existing timeout
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    // Auto hide toast after 5 seconds
    this.toastTimeout = setTimeout(() => {
      this.closeToast();
    }, 5000);
  }

  closeToast(): void {
    // Add closing animation
    const toast = document.querySelector('.toast-notification');
    if (toast) {
      this.renderer.addClass(toast, 'fade-out');
      
      // Wait for animation to complete before hiding
      setTimeout(() => {
        this.showToast = false;
        // Remove the animation class for next time
        if (toast) {
          this.renderer.removeClass(toast, 'fade-out');
        }
      }, 300);
    } else {
      this.showToast = false;
    }
  }

  selectAll(): void {
    if (this.reservations.every(res => this.selectedReservations.has(res.id))) {
      // If all are selected, unselect all
      this.reservations.forEach(res => {
        this.selectedReservations.delete(res.id);
      });
    } else {
      // Otherwise, select all
      this.reservations.forEach(res => {
        this.selectedReservations.add(res.id);
      });
    }
  }

  formatDateTime(date: string, time: string): string {
    if (!date) return 'N/A';
    
    const dateObj = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    
    const formattedDate = dateObj.toLocaleDateString('en-US', options);
    
    return time ? `${formattedDate} at ${time}` : formattedDate;
  }
  
  // Expose Math to the template
  get Math() {
    return Math;
  }
}
