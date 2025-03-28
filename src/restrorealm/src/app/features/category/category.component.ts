import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { MenuService } from '../../core/services/menu/menu.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
})
export class CategoryComponent implements OnInit {
    // View state
    viewMode: 'card' | 'list' = 'card';
    
    // Data
    categories: any[] = [];
    filteredCategories: any[] = [];
    editingCategory: any = null;
    selectedCategory: any = null;
    categoryToDelete: any = null;
    
    // Pagination
    currentPage: number = 1;
    pageSize: number = 12;
    totalPages: number = 1;
    
    // Permissions
    editCategory: boolean = false;
    createCategory: boolean = false;
    deleteSingleCategory: boolean = false;
    readSingleCategory: boolean = false;
    
    // UI state
    loading: boolean = false;
    formSubmitting: boolean = false;
    deletingCategory: boolean = false;
    searchTerm: string = '';
    currentFilter: 'all' | 'active' | 'restricted' = 'all';
    currentSort: string = 'name-asc';
    imageInputType: 'file' | 'url' = 'file';
    imagePreview: string | null = null;
    
    // Modals
    showDialog: boolean = false;
    showDetailsModal: boolean = false;
    showDeleteConfirmation: boolean = false;
    
    // Notifications
    toast: {
        message: string;
        type: 'success' | 'error';
    } | null = null;
    
    // Form
    categoryForm: FormGroup;
    
    // Constants
    apiUrl = environment.imageUrl;
    Math = Math;
    
    // Constructor with dependency injection
    constructor(
        private fb: FormBuilder, 
        private authService: AuthService, 
        private menuService: MenuService
    ) {
        // Initialize form with validators
        this.categoryForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
            description: ['', [Validators.maxLength(500)]],
            image: [null],
            imageUrl: [''],
            ageRestricted: [false, Validators.required],
            availableStartTime: ['', Validators.required],
            availableEndTime: ['', Validators.required],
        }, { validators: this.timeRangeValidator });
    }

    ngOnInit(): void {
        // Check user permissions
        this.editCategory = this.hasPermission('UPDATE_SINGLE_CATEGORY');
        this.createCategory = this.hasPermission('CREATE_CATEGORY');
        this.deleteSingleCategory = this.hasPermission('DELETE_SINGLE_CATEGORY');
        this.readSingleCategory = this.hasPermission('READ_SINGLE_CATEGORY');
        
        // Load initial data
        this.loadCategories();
    }

    // Data fetch method
    loadCategories() {
        this.loading = true;
        this.menuService.getCategories().subscribe({
            next: (categories) => {
                this.categories = categories;
                this.applyFiltersAndSort();
                this.loading = false;
            },
            error: (error) => {
                this.showToast(error.message || 'Failed to load categories', 'error');
                this.loading = false;
            }
        });
    }

    // View methods
    setViewMode(mode: 'card' | 'list') {
        this.viewMode = mode;
    }

    // Search and filter methods
    onSearch() {
        this.currentPage = 1;
        this.applyFiltersAndSort();
    }

    clearSearch() {
        this.searchTerm = '';
        this.currentPage = 1;
        this.applyFiltersAndSort();
    }

    filterCategories(filter: 'all' | 'active' | 'restricted') {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.applyFiltersAndSort();
    }

    sortCategories(event: any) {
        this.currentSort = event.target.value;
        this.applyFiltersAndSort();
    }

    private applyFiltersAndSort() {
        // First apply search filter
        let result = [...this.categories];
        
        // Apply search term filter
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter(category => 
                category.name.toLowerCase().includes(term) || 
                (category.description && category.description.toLowerCase().includes(term))
            );
        }
        
        // Apply category filter
        if (this.currentFilter === 'active') {
            result = result.filter(category => this.isActive(category));
        } else if (this.currentFilter === 'restricted') {
            result = result.filter(category => category.ageRestricted);
        }
        
        // Apply sorting
        switch (this.currentSort) {
            case 'name-asc':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                result.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'oldest':
                result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                break;
        }
        
        this.filteredCategories = result;
        this.updatePagination();
    }

    // Pagination methods
    updatePagination() {
        this.totalPages = Math.ceil(this.filteredCategories.length / this.pageSize);
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages || 1;
        }
    }

    get paginatedCategories() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredCategories.slice(startIndex, startIndex + this.pageSize);
    }

    goToPage(page: number) {
        this.currentPage = page;
    }

    updatePageSize() {
        this.currentPage = 1;
        this.updatePagination();
    }

    // Status helper methods
    isActive(category: any): boolean {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const startParts = category.availableStartTime.split(':');
        const endParts = category.availableEndTime.split(':');
        
        const startTime = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        const endTime = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
        
        if (startTime <= endTime) {
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            // Handles overnight periods (e.g., 10:00 PM to 2:00 AM)
            return currentTime >= startTime || currentTime <= endTime;
        }
    }

    getActiveCategories(): number {
        return this.categories.filter(category => this.isActive(category)).length;
    }

    getRestrictedCategories(): number {
        return this.categories.filter(category => category.ageRestricted).length;
    }

    formatTime(time: string): string {
        if (!time) return '';
        
        const parts = time.split(':');
        if (parts.length !== 2) return time;
        
        const hours = parseInt(parts[0]);
        const minutes = parts[1];
        const period = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        
        return `${formattedHours}:${minutes} ${period}`;
    }

    // Form related methods
    openCreateDialog() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;
        
        this.categoryForm.reset({
            name: '',
            description: '',
            ageRestricted: false,
            availableStartTime: '08:00',
            availableEndTime: '22:00',
        });
        this.editingCategory = null;
        this.imagePreview = null;
        this.imageInputType = 'file';
        this.showDialog = true;
    }

    openEditDialog(category: any) {
        this.editingCategory = category;
        
        // Format times to match input[type=time] format
        let startTime = category.availableStartTime;
        let endTime = category.availableEndTime;
        
        if (typeof startTime === 'string' && startTime.includes(' ')) {
            startTime = this.convert12HourTo24Hour(startTime);
        }
        
        if (typeof endTime === 'string' && endTime.includes(' ')) {
            endTime = this.convert12HourTo24Hour(endTime);
        }
        
        this.categoryForm.patchValue({
            name: category.name,
            description: category.description,
            ageRestricted: category.ageRestricted,
            availableStartTime: startTime,
            availableEndTime: endTime,
            image: null,
            imageUrl: '',
        });
        
        this.imagePreview = null;
        this.imageInputType = 'file';
        this.showDialog = true;
    }

    convert12HourTo24Hour(timeStr: string): string {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (period === 'PM' && hours < 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    closeDialog() {
        this.showDialog = false;
        this.categoryForm.reset();
        this.editingCategory = null;
        this.imagePreview = null;
    }

    closeDialogIfBackdrop(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            this.closeDialog();
        }
    }

    // Image handling methods
    onImageSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            
            // Update form value
            this.categoryForm.patchValue({ image: file });
            
            // Generate preview
            const reader = new FileReader();
            reader.onload = () => {
                this.imagePreview = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    setImageInputType(type: 'file' | 'url') {
        this.imageInputType = type;
        
        if (type === 'file') {
            this.categoryForm.get('imageUrl')?.setValue('');
        } else {
            this.categoryForm.get('image')?.setValue(null);
        }
    }

    updateImagePreviewFromUrl() {
        const url = this.categoryForm.get('imageUrl')?.value;
        if (url) {
            this.imagePreview = url;
        }
    }

    getFileName(): string {
        const file = this.categoryForm.get('image')?.value;
        if (file) {
            if (file.name && file.name.length > 20) {
                return file.name.substring(0, 17) + '...';
            }
            return file.name || 'Selected file';
        }
        return '';
    }

    handleImageError(event: any) {
        event.target.src = 'https://www.partstown.com/about-us/wp-content/uploads/2023/07/Most-Profitable-Restaurant-Menu-Items-Menu-Stars.jpg';
    }

    handlePreviewError(event: any) {
        event.target.src = 'https://www.partstown.com/about-us/wp-content/uploads/2023/07/Most-Profitable-Restaurant-Menu-Items-Menu-Stars.jpg';
    }

    // Form submission
    onSubmit() {
        if (this.categoryForm.invalid || this.formSubmitting) {
            // Mark all fields as touched to trigger validation errors
            Object.keys(this.categoryForm.controls).forEach(key => {
                const control = this.categoryForm.get(key);
                control?.markAsTouched();
            });
            return;
        }
        
        this.formSubmitting = true;
        
        // Create FormData to handle file uploads
        const formData = new FormData();
        
        // Create category JSON
        const categoryJson = JSON.stringify({
            name: this.categoryForm.get('name')?.value,
            description: this.categoryForm.get('description')?.value,
            ageRestricted: this.categoryForm.get('ageRestricted')?.value,
            availableStartTime: this.categoryForm.get('availableStartTime')?.value,
            availableEndTime: this.categoryForm.get('availableEndTime')?.value,
        });
        
        formData.append("category", categoryJson);
        
        // Add image if selected from file
        if (this.categoryForm.get('image')?.value) {
            formData.append("image", this.categoryForm.get('image')?.value);
        }
        
        // Add image URL if provided
        if (this.imageInputType === 'url' && this.categoryForm.get('imageUrl')?.value) {
            formData.append("imageUrl", this.categoryForm.get('imageUrl')?.value);
        }
        
        // Choose API call based on edit or create
        const request = this.editingCategory
            ? this.menuService.updateCategory(this.editingCategory.id, formData)
            : this.menuService.createCategory(formData);
        
        // Handle API response
        request.subscribe({
            next: () => {
                this.showToast(
                    `Category successfully ${this.editingCategory ? 'updated' : 'created'}`,
                    'success'
                );
                this.loadCategories();
                this.closeDialog();
                this.formSubmitting = false;
            },
            error: (error) => {
                console.error("API Error:", error);
                this.showToast(error.message || `Failed to ${this.editingCategory ? 'update' : 'create'} category`, 'error');
                this.formSubmitting = false;
            }
        });
    }

    // Category details modal
    viewDetails(category: any) {
        this.selectedCategory = category;
        this.showDetailsModal = true;
    }

    closeDetailsModal(event?: MouseEvent) {
        if (event && event.target !== event.currentTarget) {
            return;
        }
        this.showDetailsModal = false;
        // this.selectedCategory = null;
    }

    editFromDetails() {
        this.closeDetailsModal();
        this.openEditDialog(this.selectedCategory);
    }

    // Category deletion
    confirmDelete(category: any) {
        this.categoryToDelete = category;
        this.showDeleteConfirmation = true;
    }

    cancelDelete(event?: MouseEvent) {
        if (event && event.target !== event.currentTarget) {
            return;
        }
        this.showDeleteConfirmation = false;
        this.categoryToDelete = null;
        this.deletingCategory = false;
    }

    proceedWithDelete() {
        if (!this.categoryToDelete || this.deletingCategory) return;
        
        this.deletingCategory = true;
        
        this.menuService.deleteCategory(this.categoryToDelete.id).subscribe({
            next: () => {
                this.showToast('Category successfully deleted', 'success');
                this.loadCategories();
                this.cancelDelete();
                this.deletingCategory = false;
            },
            error: (error) => {
                this.showToast(error.message || 'Failed to delete category', 'error');
                this.deletingCategory = false;
            }
        });
    }

    // Toast notifications
    private showToast(message: string, type: 'success' | 'error') {
        this.toast = { message, type };
        setTimeout(() => this.dismissToast(), 3000);
    }

    dismissToast() {
        this.toast = null;
    }

    // Permissions check
    hasPermission(permission: string): boolean {
        return this.authService.hasPermission(permission);
    }
    
    // Custom validator for time range
    private timeRangeValidator(control: AbstractControl): ValidationErrors | null {
        const startTime = control.get('availableStartTime')?.value;
        const endTime = control.get('availableEndTime')?.value;
        
        if (!startTime || !endTime) {
            return null;
        }
        
        // Convert to minutes for easy comparison
        const startParts = startTime.split(':');
        const endParts = endTime.split(':');
        
        if (startParts.length !== 2 || endParts.length !== 2) {
            return null;
        }
        
        const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
        
        // Allow end time to be less than start time (for overnight hours)
        // E.g., 22:00 to 02:00 is valid for a restaurant open late
        
        return null;
    }
    
    private getImageUrl(category: any): string {
        if (!category || !category.imageUrl) {
            return '';
        }
    
    return category.imageUrl.startsWith('http') 
        ? category.imageUrl 
        : this.apiUrl + category.imageUrl;
    }

    getImagePath(category: any): string {
        if (!category || !category.imagePath) {
            return this.getImageUrl(category);
        }
        return category.imagePath.startsWith('http') 
            ? category.imagePath 
            : this.apiUrl + category.imagePath;
    }
}
