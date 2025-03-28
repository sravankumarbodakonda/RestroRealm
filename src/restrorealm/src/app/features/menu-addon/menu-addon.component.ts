import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { environment } from '../../../environments/environment';
import { MenuAddonService } from '../../core/services/menu/add-on/menu-addon.service';
import { MenuAddOn, SpiceLevelOptions, CommonAllergens, SpiceLevel } from '../../shared/models/menu-addon.model';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  selector: 'app-menu-addon',
  templateUrl: './menu-addon.component.html',
  styleUrls: ['./menu-addon.component.css']
})
export class MenuAddonComponent implements OnInit {
    // View state
    viewMode: 'card' | 'list' = 'card';
    
    // Data
    menuAddons: MenuAddOn[] = [];
    filteredAddons: MenuAddOn[] = [];
    editingAddon: MenuAddOn | null = null;
    selectedAddon: MenuAddOn | null = null;
    addonToDelete: MenuAddOn | null = null;
    
    // UI constants
    spiceLevelOptions = SpiceLevelOptions;
    commonAllergens = CommonAllergens;
    
    // Pagination
    currentPage: number = 1;
    pageSize: number = 12;
    totalPages: number = 1;
    
    // Permissions
    editAddon: boolean = false;
    createAddon: boolean = false;
    deleteSingleAddon: boolean = false;
    readSingleAddon: boolean = false;
    readAllAddons: boolean = false;
    
    // UI state
    loading: boolean = false;
    formSubmitting: boolean = false;
    deletingAddon: boolean = false;
    searchTerm: string = '';
    currentFilter: 'all' | 'active' | 'inactive' = 'all';
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
    addonForm: FormGroup;
    
    // Constants
    apiUrl = environment.imageUrl;
    Math = Math;
    
    // Constructor with dependency injection
    constructor(
        private fb: FormBuilder, 
        private authService: AuthService, 
        private menuAddonService: MenuAddonService
    ) {
        // Initialize form with validators
        this.addonForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
            description: ['', [Validators.maxLength(500)]],
            price: [0, [Validators.required, Validators.min(0)]],
            active: [true, Validators.required],
            suggested: [false],
            calories: [0, [Validators.required, Validators.min(0)]],
            vegetarian: [true],
            spiceLevel: [SpiceLevel.NONE],
            allergens: [[]],
            image: [null],
            imageUrl: [''],
            categories: [[]]
        });
    }

    ngOnInit(): void {
        // Check user permissions
        this.editAddon = this.hasPermission('UPDATE_SINGLE_MENU_ADD_ON');
        this.createAddon = this.hasPermission('CREATE_MENU_ADD_ON');
        this.deleteSingleAddon = this.hasPermission('DELETE_MENU_ADD_ON');
        this.readSingleAddon = this.hasPermission('READ_SINGLE_MENU_ADD_ON');
        this.readAllAddons = this.hasPermission('READ_ALL_MENU_ADD_ONS');
        
        console.log('Permissions:', {
            edit: this.editAddon,
            create: this.createAddon,
            delete: this.deleteSingleAddon,
            readSingle: this.readSingleAddon,
            readAll: this.readAllAddons
        });
        
        // Load initial data if user has permissions
        if (this.readAllAddons) {
            this.loadMenuAddons();
        }
    }

    // Data fetch method
    loadMenuAddons() {
        this.loading = true;
        this.menuAddonService.getMenuAddons().subscribe({
            next: (addons) => {
                console.log('Loaded addons:', addons);
                this.menuAddons = [...addons];
                this.applyFiltersAndSort();
                this.loading = false;
            },
            error: (error) => {
                console.error('Failed to load menu add-ons:', error);
                this.showToast(error.message || 'Failed to load menu add-ons', 'error');
                this.loading = false;
            },
            complete: () => {
                console.log('Menu addons loading complete');
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

    filterAddons(filter: 'all' | 'active' | 'inactive') {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.applyFiltersAndSort();
    }

    sortAddons(event: any) {
        this.currentSort = event.target.value;
        this.applyFiltersAndSort();
    }
    
    // Filter methods
    filterByVegetarian(show: boolean) {
        if (show) {
            this.filteredAddons = this.menuAddons.filter(addon => addon.vegetarian);
        } else {
            this.applyFiltersAndSort();
        }
        this.updatePagination();
    }
    
    filterBySpiceLevel(event: Event | string | null) {
        let level: SpiceLevel | null = null;
        
        if (typeof event === 'string') {
            level = event as SpiceLevel;
        } else if (event instanceof Event) {
            const selectElement = event.target as HTMLSelectElement;
            level = selectElement.value as SpiceLevel;
        }
        
        if (level !== null) {
            this.filteredAddons = this.menuAddons.filter(addon => addon.spiceLevel === level);
        } else {
            this.applyFiltersAndSort();
        }
        this.updatePagination();
    }
    
    getSpiceLevelLabel(level: SpiceLevel): string {
        return SpiceLevelOptions.find(option => option.value === level)?.label || 'Unknown';
    }

    private applyFiltersAndSort() {        
        // First apply search filter
        let result = [...this.menuAddons];
        
        // Apply search term filter
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter(addon => 
                addon.addOnName.toLowerCase().includes(term) || 
                (addon.description && addon.description.toLowerCase().includes(term))
            );
        }
        
        // Apply status filter
        if (this.currentFilter === 'active') {
            result = result.filter(addon => addon.active);
        } else if (this.currentFilter === 'inactive') {
            result = result.filter(addon => !addon.active);
        }
        
        // Apply sorting
        switch (this.currentSort) {
            case 'name-asc':
                result.sort((a, b) => a.addOnName.localeCompare(b.addOnName));
                break;
            case 'name-desc':
                result.sort((a, b) => b.addOnName.localeCompare(a.addOnName));
                break;
            case 'price-low':
                result.sort((a, b) => a.addOnPrice - b.addOnPrice);
                break;
            case 'price-high':
                result.sort((a, b) => b.addOnPrice - a.addOnPrice);
                break;
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
                break;
            case 'oldest':
                result.sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
                break;
        }
        this.filteredAddons = [...result];
        this.updatePagination();
    }

    // Pagination methods
    updatePagination() {
        this.totalPages = Math.ceil(this.filteredAddons.length / this.pageSize);
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages || 1;
        }
    }

    get paginatedAddons() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredAddons.slice(startIndex, startIndex + this.pageSize);
    }

    goToPage(page: number) {
        this.currentPage = page;
    }

    updatePageSize() {
        this.currentPage = 1;
        this.updatePagination();
    }

    // Status helper methods
    getActiveAddons(): number {
        return this.menuAddons.filter(addon => addon.active).length;
    }

    getInactiveAddons(): number {
        return this.menuAddons.filter(addon => !addon.active).length;
    }

    formatPrice(price: number): string {
        return price.toFixed(2);
    }
    
    // Allergen methods
    toggleAllergen(allergenId: string) {
        const currentAllergens = [...(this.addonForm.get('allergens')?.value || [])];
        const index = currentAllergens.indexOf(allergenId);
        
        if (index === -1) {
            // Add allergen
            currentAllergens.push(allergenId);
        } else {
            // Remove allergen
            currentAllergens.splice(index, 1);
        }
        
        this.addonForm.get('allergens')?.setValue(currentAllergens);
    }
    
    hasAllergen(addon: MenuAddOn, allergenId: string): boolean {
        return addon.allergens?.includes(allergenId) || false;
    }
    
    getAllergenNames(addon: MenuAddOn): string[] {
        return addon.allergens?.map(allergenId => {
            const allergen = this.commonAllergens.find(a => a.id === allergenId);
            return allergen ? allergen.name : allergenId;
        }) || [];
    }

    // Form related methods
    openCreateDialog() {
        this.addonForm.reset({
            name: '',
            description: '',
            price: 0,
            active: true,
            suggested: false,
            calories: 0,
            vegetarian: true,
            spiceLevel: SpiceLevel.NONE,
            allergens: [],
            categories: []
        });
        this.editingAddon = null;
        this.imagePreview = null;
        this.imageInputType = 'file';
        this.showDialog = true;
    }

    openEditDialog(addon: MenuAddOn) {
        this.editingAddon = addon;
        
        this.addonForm.patchValue({
            name: addon.addOnName || addon.name,
            description: addon.description,
            price: addon.addOnPrice || addon.price,
            active: addon.active,
            suggested: addon.suggested,
            calories: addon.calories || 0,
            vegetarian: addon.vegetarian || false,
            spiceLevel: addon.spiceLevel || SpiceLevel.NONE,
            allergens: addon.allergens || [],
            image: null,
            imageUrl: '',
            categories: addon.categories || []
        });
        
        this.imagePreview = null;
        this.imageInputType = 'file';
        this.showDialog = true;
    }

    closeDialog() {
        this.showDialog = false;
        this.addonForm.reset();
        this.editingAddon = null;
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
            this.addonForm.patchValue({ image: file });
            
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
            this.addonForm.get('imageUrl')?.setValue('');
        } else {
            this.addonForm.get('image')?.setValue(null);
        }
    }

    updateImagePreviewFromUrl() {
        const url = this.addonForm.get('imageUrl')?.value;
        if (url) {
            this.imagePreview = url;
        }
    }

    getFileName(): string {
        const file = this.addonForm.get('image')?.value;
        if (file) {
            if (file.name && file.name.length > 20) {
                return file.name.substring(0, 17) + '...';
            }
            return file.name || 'Selected file';
        }
        return '';
    }

    handleImageError(event: any) {
        event.target.src = 'https://media.istockphoto.com/id/1409329028/vector/no-picture-available-placeholder-thumbnail-icon-illustration-design.jpg?s=612x612&w=0&k=20&c=_zOuJu755g2eEUioiOUdz_mHKJQJn-tDgIAhQzyeKUQ=';
    }

    handlePreviewError(event: any) {
        event.target.src = 'https://media.istockphoto.com/id/1409329028/vector/no-picture-available-placeholder-thumbnail-icon-illustration-design.jpg?s=612x612&w=0&k=20&c=_zOuJu755g2eEUioiOUdz_mHKJQJn-tDgIAhQzyeKUQ=';
    }

    // Form submission
    onSubmit() {
        if (this.addonForm.invalid || this.formSubmitting) {
            // Mark all fields as touched to trigger validation errors
            Object.keys(this.addonForm.controls).forEach(key => {
                const control = this.addonForm.get(key);
                control?.markAsTouched();
            });
            return;
        }
        
        this.formSubmitting = true;
        
        // Create FormData to handle file uploads
        const formData = new FormData();
        
        // Create addon JSON
        const addonJson = JSON.stringify({
            addOnName: this.addonForm.get('name')?.value,
            description: this.addonForm.get('description')?.value,
            addOnPrice: this.addonForm.get('price')?.value,
            active: this.addonForm.get('active')?.value,
            suggested: this.addonForm.get('suggested')?.value,
            calories: this.addonForm.get('calories')?.value,
            vegetarian: this.addonForm.get('vegetarian')?.value,
            spiceLevel: this.addonForm.get('spiceLevel')?.value,
            allergens: this.addonForm.get('allergens')?.value,
            categories: this.addonForm.get('categories')?.value,
        });
        
        formData.append("addon", addonJson);
        
        // Add image if selected from file
        if (this.addonForm.get('image')?.value) {
            formData.append("image", this.addonForm.get('image')?.value);
        }
        
        // Add image URL if provided
        if (this.imageInputType === 'url' && this.addonForm.get('imageUrl')?.value) {
            formData.append("imageUrl", this.addonForm.get('imageUrl')?.value);
        }
        
        console.log('Submitting form with data:', {
            jsonData: JSON.parse(addonJson),
            imageType: this.imageInputType,
            imageUrl: this.addonForm.get('imageUrl')?.value
        });
        
        // Choose API call based on edit or create
        const request = this.editingAddon
            ? this.menuAddonService.updateMenuAddon(this.editingAddon.id!, formData)
            : this.menuAddonService.createMenuAddon(formData);
        
        // Handle API response
        request.subscribe({
            next: (response) => {
                
                // First reset all UI states
                this.closeDialog();
                this.formSubmitting = false;
                
                // Show success message
                this.showToast(
                    `Add-on successfully ${this.editingAddon ? 'updated' : 'created'}`,
                    'success'
                );
                
                // Explicitly trigger a complete refresh of data after a short delay
                setTimeout(() => {
                    // Force a fresh load from the service instead of using loadMenuAddons()
                    this.menuAddonService.getMenuAddons().subscribe({
                        next: (addons) => {
                            console.log('Reloaded addons after update:', addons);
                            this.menuAddons = [...addons];
                            this.applyFiltersAndSort();
                        },
                        error: (err) => {
                            console.error('Failed to reload addons after update:', err);
                        }
                    });
                }, 300);
            },
            error: (error) => {
                console.error("API Error:", error);
                this.showToast(
                    error.error?.error || error.message || `Failed to ${this.editingAddon ? 'update' : 'create'} add-on`, 
                    'error'
                );
                this.formSubmitting = false;
            }
        });
    }

    // Addon details modal
    viewDetails(addon: MenuAddOn) {
        this.selectedAddon = addon;
        this.showDetailsModal = true;
    }

    closeDetailsModal(event?: MouseEvent) {
        if (event && event.target !== event.currentTarget) {
            return;
        }
        this.showDetailsModal = false;
    }

    editFromDetails() {
        this.closeDetailsModal();
        this.openEditDialog(this.selectedAddon!);
    }

    // Addon deletion
    confirmDelete(addon: MenuAddOn) {
        this.addonToDelete = addon;
        this.showDeleteConfirmation = true;
    }

    cancelDelete(event?: MouseEvent) {
        if (event && event.target !== event.currentTarget) {
            return;
        }
        this.showDeleteConfirmation = false;
        this.addonToDelete = null;
        this.deletingAddon = false;
    }

    proceedWithDelete() {
        if (!this.addonToDelete || this.deletingAddon) return;
        
        this.deletingAddon = true;
        
        this.menuAddonService.deleteMenuAddon(this.addonToDelete.id!).subscribe({
            next: () => {
                this.showToast('Add-on successfully deleted', 'success');
                this.loadMenuAddons();
                this.cancelDelete();
                this.deletingAddon = false;
            },
            error: (error) => {
                this.showToast(error.message || 'Failed to delete add-on', 'error');
                this.deletingAddon = false;
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

    // Helper methods
    getImagePath(addon: MenuAddOn): string {
        if (!addon || !addon.imagePath) {
            return '';
        }
        return addon.imagePath.startsWith('http') 
            ? addon.imagePath 
            : this.apiUrl + addon.imagePath;
    }
}
