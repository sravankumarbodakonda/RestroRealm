import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { environment } from '../../../environments/environment';
import { MenuCustomizationService } from '../../core/services/menu/customization/menu-customization.service';
import { MenuCustomization, CustomizationType, CustomizationTypeOptions, MenuCustomizationOption } from '../../shared/models/menu-customization.model';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  selector: 'app-menu-customization',
  templateUrl: './menu-customization.component.html',
  styleUrls: ['./menu-customization.component.css']
})
export class MenuCustomizationComponent implements OnInit {
    // View state
    viewMode: 'card' | 'list' = 'card';
    
    // Data
    menuCustomizations: MenuCustomization[] = [];
    filteredCustomizations: MenuCustomization[] = [];
    editingCustomization: MenuCustomization | null = null;
    selectedCustomization: MenuCustomization | null = null;
    customizationToDelete: MenuCustomization | null = null;
    
    // UI constants
    customizationTypeOptions = CustomizationTypeOptions;
    
    // Pagination
    currentPage: number = 1;
    pageSize: number = 12;
    totalPages: number = 1;
    
    // Permissions
    editCustomization: boolean = false;
    createCustomization: boolean = false;
    deleteSingleCustomization: boolean = false;
    readSingleCustomization: boolean = false;
    readAllCustomizations: boolean = false;
    
    // UI state
    loading: boolean = false;
    formSubmitting: boolean = false;
    deletingCustomization: boolean = false;
    searchTerm: string = '';
    currentFilter: 'all' | 'active' | 'inactive' | 'required' = 'all';
    currentSort: string = 'name-asc';
    imageInputType: 'file' | 'url' = 'file';
    imagePreview: string | null = null;
    
    // Modals
    showDialog: boolean = false;
    showDetailsModal: boolean = false;
    showDeleteConfirmation: boolean = false;
    showOptionDialog: boolean = false;
    
    // Notifications
    toast: {
        message: string;
        type: 'success' | 'error';
    } | null = null;
    
    // Forms
    customizationForm: FormGroup;
    optionForm: FormGroup;
    editingOptionIndex: number | null = null;
    
    // Constants
    apiUrl = environment.imageUrl;
    Math = Math;
    
    // Constructor with dependency injection
    constructor(
        private fb: FormBuilder, 
        private authService: AuthService, 
        private menuCustomizationService: MenuCustomizationService
    ) {
        // Initialize forms with validators
        this.customizationForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
            description: ['', [Validators.maxLength(500)]],
            required: [false],
            active: [true],
            multiSelect: [false],
            maxSelections: [1, [Validators.min(1)]],
            customizationType: [CustomizationType.TOPPING, Validators.required],
            options: this.fb.array([]),
            image: [null],
            imageUrl: [''],
            categories: [[]]
        }, { validators: this.validateMaxSelections });

        this.optionForm = this.fb.group({
            optionName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
            description: ['', [Validators.maxLength(200)]],
            additionalPrice: [0, [Validators.min(0)]],
            calories: [0, [Validators.min(0)]],
            default: [false],
            active: [true],
            image: [null],
            imageUrl: ['']
        });
    }

    ngOnInit(): void {
        // Check user permissions
        this.editCustomization = this.hasPermission('UPDATE_SINGLE_CUSTOMIZATION');
        this.createCustomization = this.hasPermission('CREATE_CUSTOMIZATION');
        this.deleteSingleCustomization = this.hasPermission('DELETE_CUSTOMIZATION');
        this.readSingleCustomization = this.hasPermission('READ_SINGLE_CUSTOMIZATION');
        this.readAllCustomizations = this.hasPermission('READ_ALL_CUSTOMIZATIONS');
        
        console.log('Permissions:', {
            edit: this.editCustomization,
            create: this.createCustomization,
            delete: this.deleteSingleCustomization,
            readSingle: this.readSingleCustomization,
            readAll: this.readAllCustomizations
        });
        
        // Load initial data if user has permissions
        if (this.readAllCustomizations) {
            this.loadMenuCustomizations();
        }
        
        // Watch for multiSelect changes to update maxSelections
        this.customizationForm.get('multiSelect')?.valueChanges.subscribe(isMultiSelect => {
            if (!isMultiSelect) {
                this.customizationForm.get('maxSelections')?.setValue(1);
            }
        });
    }

    // Validator to check maxSelections against options count
    validateMaxSelections(control: AbstractControl): ValidationErrors | null {
        const form = control as FormGroup;
        const multiSelect = form.get('multiSelect')?.value;
        const maxSelections = form.get('maxSelections')?.value;
        const options = form.get('options')?.value;
        
        if (multiSelect && options && options.length > 0 && maxSelections > options.length) {
            return { maxSelectionsExceedsOptions: true };
        }
        
        return null;
    }

    // Data fetch method
    loadMenuCustomizations() {
        this.loading = true;
        this.menuCustomizationService.getMenuCustomizations().subscribe({
            next: (customizations) => {
                console.log('Loaded customizations:', customizations);
                this.menuCustomizations = [...customizations];
                this.applyFiltersAndSort();
                this.loading = false;
            },
            error: (error) => {
                console.error('Failed to load menu customizations:', error);
                this.showToast(error.message || 'Failed to load menu customizations', 'error');
                this.loading = false;
            },
            complete: () => {
                console.log('Menu customizations loading complete');
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

    filterCustomizations(filter: 'all' | 'active' | 'inactive' | 'required') {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.applyFiltersAndSort();
    }

    sortCustomizations(event: any) {
        this.currentSort = event.target.value;
        this.applyFiltersAndSort();
    }
    
    private applyFiltersAndSort() {        
        // First apply search filter
        let result = [...this.menuCustomizations];
        
        // Apply search term filter
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter(customization => 
                (customization.name && customization.name.toLowerCase().includes(term)) || 
                (customization.customizationName && customization.customizationName.toLowerCase().includes(term)) || 
                (customization.description && customization.description.toLowerCase().includes(term))
            );
        }
        
        // Apply status filter
        if (this.currentFilter === 'active') {
            result = result.filter(customization => customization.active);
        } else if (this.currentFilter === 'inactive') {
            result = result.filter(customization => !customization.active);
        } else if (this.currentFilter === 'required') {
            result = result.filter(customization => customization.required);
        }
        
        // Apply sorting
        switch (this.currentSort) {
            case 'name-asc':
                result.sort((a, b) => {
                    const nameA = a.name || a.customizationName || '';
                    const nameB = b.name || b.customizationName || '';
                    return nameA.localeCompare(nameB);
                });
                break;
            case 'name-desc':
                result.sort((a, b) => {
                    const nameA = a.name || a.customizationName || '';
                    const nameB = b.name || b.customizationName || '';
                    return nameB.localeCompare(nameA);
                });
                break;
            case 'options-desc':
                result.sort((a, b) => b.options.length - a.options.length);
                break;
            case 'options-asc':
                result.sort((a, b) => a.options.length - b.options.length);
                break;
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
                break;
            case 'oldest':
                result.sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
                break;
        }
        this.filteredCustomizations = [...result];
        this.updatePagination();
    }

    // Pagination methods
    updatePagination() {
        this.totalPages = Math.ceil(this.filteredCustomizations.length / this.pageSize);
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages || 1;
        }
    }

    get paginatedCustomizations() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredCustomizations.slice(startIndex, startIndex + this.pageSize);
    }

    goToPage(page: number) {
        this.currentPage = page;
    }

    updatePageSize() {
        this.currentPage = 1;
        this.updatePagination();
    }

    // Status helper methods
    getActiveCustomizations(): number {
        return this.menuCustomizations.filter(customization => customization.active).length;
    }

    getInactiveCustomizations(): number {
        return this.menuCustomizations.filter(customization => !customization.active).length;
    }

    getRequiredCustomizations(): number {
        return this.menuCustomizations.filter(customization => customization.required).length;
    }

    formatPrice(price: number): string {
        return price.toFixed(2);
    }
    
    getCustomizationTypeLabel(type: CustomizationType): string {
        return CustomizationTypeOptions.find(option => option.value === type)?.label || 'Unknown';
    }

    // Form related methods
    openCreateDialog() {
        this.customizationForm.reset({
            name: '',
            description: '',
            required: false,
            active: true,
            multiSelect: false,
            maxSelections: 1,
            customizationType: CustomizationType.TOPPING,
            categories: []
        });
        
        // Clear options
        this.optionsFormArray.clear();
        
        this.editingCustomization = null;
        this.imagePreview = null;
        this.imageInputType = 'file';
        this.showDialog = true;
    }

    openEditDialog(customization: MenuCustomization) {
        this.editingCustomization = customization;
        
        // Clear options first
        this.optionsFormArray.clear();
        
        // Add existing options
        if (customization.options && customization.options.length > 0) {
            customization.options.forEach(option => {
                this.addExistingOption(option);
            });
        }
        
        this.customizationForm.patchValue({
            name: customization.name || customization.customizationName,
            description: customization.description,
            required: customization.required,
            active: customization.active,
            multiSelect: customization.multiSelect,
            maxSelections: customization.maxSelections || 1,
            customizationType: customization.customizationType,
            image: null,
            imageUrl: '',
            categories: customization.categories || []
        });
        
        this.imagePreview = null;
        this.imageInputType = 'file';
        this.showDialog = true;
    }

    closeDialog() {
        this.showDialog = false;
        this.customizationForm.reset();
        this.editingCustomization = null;
        this.imagePreview = null;
    }

    closeDialogIfBackdrop(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            this.closeDialog();
        }
    }

    // Options management
    get optionsFormArray() {
        return this.customizationForm.get('options') as FormArray;
    }
    
    addExistingOption(option: MenuCustomizationOption) {
        this.optionsFormArray.push(this.fb.group({
            id: [option.id],
            optionName: [option.optionName, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
            description: [option.description || '', [Validators.maxLength(200)]],
            additionalPrice: [option.additionalPrice || 0, [Validators.min(0)]],
            calories: [option.calories || 0, [Validators.min(0)]],
            default: [option.default || false],
            active: [option.active],
            imagePath: [option.imagePath || '']
        }));
    }
    
    openOptionDialog() {
        // Reset option form
        this.optionForm.reset({
            optionName: '',
            description: '',
            additionalPrice: 0,
            calories: 0,
            default: false,
            active: true,
            image: null,
            imageUrl: ''
        });
        
        this.editingOptionIndex = null;
        this.imagePreview = null;
        this.imageInputType = 'file';
        this.showOptionDialog = true;
    }
    
    editOption(index: number) {
        this.editingOptionIndex = index;
        const option = this.optionsFormArray.at(index).value;
        
        this.optionForm.patchValue({
            optionName: option.optionName,
            description: option.description,
            additionalPrice: option.additionalPrice,
            calories: option.calories || 0,
            default: option.default,
            active: option.active,
            image: null,
            imageUrl: ''
        });
        
        this.imagePreview = option.imagePath ? this.getImagePath({ imagePath: option.imagePath }) : null;
        this.imageInputType = 'file';
        this.showOptionDialog = true;
    }
    
    closeOptionDialog(event?: MouseEvent) {
        if (event && event.target !== event.currentTarget) {
            return;
        }
        this.showOptionDialog = false;
        this.optionForm.reset();
        this.editingOptionIndex = null;
        this.imagePreview = null;
    }
    
    saveOption() {
        if (this.optionForm.invalid) {
            // Mark all fields as touched to trigger validation errors
            Object.keys(this.optionForm.controls).forEach(key => {
                const control = this.optionForm.get(key);
                control?.markAsTouched();
            });
            return;
        }
        
        const optionData: {
            optionName: any;
            description: any;
            additionalPrice: any;
            calories: any;
            default: any;
            active: any;
            imagePath: string | null;
            id?: string;
        } = {
            optionName: this.optionForm.get('optionName')?.value,
            description: this.optionForm.get('description')?.value,
            additionalPrice: this.optionForm.get('additionalPrice')?.value,
            calories: this.optionForm.get('calories')?.value,
            default: this.optionForm.get('default')?.value,
            active: this.optionForm.get('active')?.value,
            imagePath: this.imagePreview
        };
        
        if (this.editingOptionIndex !== null) {
            // Update existing option
            const existingOption = this.optionsFormArray.at(this.editingOptionIndex).value;
            if (existingOption.id) {
                optionData['id'] = existingOption.id;
            }
            this.optionsFormArray.at(this.editingOptionIndex).patchValue(optionData);
        } else {
            // Add new option
            this.optionsFormArray.push(this.fb.group(optionData));
        }
        
        // Close dialog
        this.closeOptionDialog();
    }
    
    removeOption(index: number) {
        this.optionsFormArray.removeAt(index);
    }

    // Image handling methods
    onImageSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            
            // Update form value
            if (this.showOptionDialog) {
                this.optionForm.patchValue({ image: file });
            } else {
                this.customizationForm.patchValue({ image: file });
            }
            
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
            if (this.showOptionDialog) {
                this.optionForm.get('imageUrl')?.setValue('');
            } else {
                this.customizationForm.get('imageUrl')?.setValue('');
            }
        } else {
            if (this.showOptionDialog) {
                this.optionForm.get('image')?.setValue(null);
            } else {
                this.customizationForm.get('image')?.setValue(null);
            }
        }
    }

    updateImagePreviewFromUrl() {
        const url = this.showOptionDialog 
            ? this.optionForm.get('imageUrl')?.value 
            : this.customizationForm.get('imageUrl')?.value;
            
        if (url) {
            this.imagePreview = url;
        }
    }

    getFileName(): string {
        const file = this.showOptionDialog 
            ? this.optionForm.get('image')?.value 
            : this.customizationForm.get('image')?.value;
            
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
        if (this.customizationForm.invalid || this.formSubmitting) {
            // Mark all fields as touched to trigger validation errors
            Object.keys(this.customizationForm.controls).forEach(key => {
                const control = this.customizationForm.get(key);
                control?.markAsTouched();
            });
            return;
        }
        
        this.formSubmitting = true;
        
        // Create FormData to handle file uploads
        const formData = new FormData();
        
        // Create customization JSON
        const customizationJson = JSON.stringify({
            name: this.customizationForm.get('name')?.value,
            description: this.customizationForm.get('description')?.value,
            required: this.customizationForm.get('required')?.value,
            active: this.customizationForm.get('active')?.value,
            multiSelect: this.customizationForm.get('multiSelect')?.value,
            maxSelections: this.customizationForm.get('maxSelections')?.value,
            customizationType: this.customizationForm.get('customizationType')?.value,
            options: this.customizationForm.get('options')?.value,
            categories: this.customizationForm.get('categories')?.value,
        });
        
        formData.append("customization", customizationJson);
        
        // Add image if selected from file
        if (this.customizationForm.get('image')?.value) {
            formData.append("image", this.customizationForm.get('image')?.value);
        }
        
        // Add image URL if provided
        if (this.imageInputType === 'url' && this.customizationForm.get('imageUrl')?.value) {
            formData.append("imageUrl", this.customizationForm.get('imageUrl')?.value);
        }
        
        console.log('Submitting form with data:', {
            jsonData: JSON.parse(customizationJson),
            imageType: this.imageInputType,
            imageUrl: this.customizationForm.get('imageUrl')?.value
        });
        
        // Choose API call based on edit or create
        const request = this.editingCustomization
            ? this.menuCustomizationService.updateMenuCustomization(this.editingCustomization.id!, formData)
            : this.menuCustomizationService.createMenuCustomization(formData);
        
        // Handle API response
        request.subscribe({
            next: (response) => {
                
                // First reset all UI states
                this.closeDialog();
                this.formSubmitting = false;
                
                // Show success message
                this.showToast(
                    `Customization successfully ${this.editingCustomization ? 'updated' : 'created'}`,
                    'success'
                );
                
                // Explicitly trigger a complete refresh of data after a short delay
                setTimeout(() => {
                    // Force a fresh load from the service instead of using loadMenuCustomizations()
                    this.menuCustomizationService.getMenuCustomizations().subscribe({
                        next: (customizations) => {
                            console.log('Reloaded customizations after update:', customizations);
                            this.menuCustomizations = [...customizations];
                            this.applyFiltersAndSort();
                        },
                        error: (err) => {
                            console.error('Failed to reload customizations after update:', err);
                        }
                    });
                }, 300);
            },
            error: (error) => {
                console.error("API Error:", error);
                this.showToast(
                    error.error?.error || error.message || `Failed to ${this.editingCustomization ? 'update' : 'create'} customization`, 
                    'error'
                );
                this.formSubmitting = false;
            }
        });
    }

    // Customization details modal
    viewDetails(customization: MenuCustomization) {
        this.selectedCustomization = customization;
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
        this.openEditDialog(this.selectedCustomization!);
    }

    // Customization deletion
    confirmDelete(customization: MenuCustomization) {
        this.customizationToDelete = customization;
        this.showDeleteConfirmation = true;
    }

    cancelDelete(event?: MouseEvent) {
        if (event && event.target !== event.currentTarget) {
            return;
        }
        this.showDeleteConfirmation = false;
        this.customizationToDelete = null;
        this.deletingCustomization = false;
    }

    proceedWithDelete() {
        if (!this.customizationToDelete || this.deletingCustomization) return;
        
        this.deletingCustomization = true;
        
        this.menuCustomizationService.deleteMenuCustomization(this.customizationToDelete.id!).subscribe({
            next: () => {
                this.showToast('Customization successfully deleted', 'success');
                this.loadMenuCustomizations();
                this.cancelDelete();
                this.deletingCustomization = false;
            },
            error: (error) => {
                this.showToast(error.message || 'Failed to delete customization', 'error');
                this.deletingCustomization = false;
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
    getImagePath(item: any): string {
        if (!item || !item.imagePath) {
            return '';
        }
        return item.imagePath.startsWith('http') 
            ? item.imagePath 
            : this.apiUrl + item.imagePath;
    }
}
