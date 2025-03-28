import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { environment } from '../../../environments/environment';
import { MenuOptionService } from '../../core/services/menu/option/menu-option.service';
import { CustomizationGroup, CustomizationPosition, CustomizationPositionOptions, CustomizationQuantity, CustomizationQuantityOptions } from '../../shared/models/customization-group.model';
import { MenuOption } from '../../shared/models/menu-option.model';
import { CustomizationGroupService } from '../../core/services/menu/customization-group/customization-group.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  selector: 'app-customization-group',
  templateUrl: './customization-group.component.html',
  styleUrls: ['./customization-group.component.css']
})
export class CustomizationGroupComponent implements OnInit {
    // View state
    viewMode: 'card' | 'list' = 'card';
    
    // Data
    customizationGroups: CustomizationGroup[] = [];
    filteredGroups: CustomizationGroup[] = [];
    menuOptions: MenuOption[] = [];
    editingGroup: CustomizationGroup | null = null;
    selectedGroup: CustomizationGroup | null = null;
    groupToDelete: CustomizationGroup | null = null;
    
    // UI constants
    positionOptions = CustomizationPositionOptions;
    quantityOptions = CustomizationQuantityOptions;
    
    // Pagination
    currentPage: number = 1;
    pageSize: number = 12;
    totalPages: number = 1;
    
    // Permissions
    editGroup: boolean = false;
    createGroup: boolean = false;
    deleteGroup: boolean = false;
    readGroup: boolean = false;
    
    // UI state
    loading: boolean = false;
    formSubmitting: boolean = false;
    deletingGroup: boolean = false;
    searchTerm: string = '';
    currentFilter: 'all' | 'required' | 'position' | 'quantity' = 'all';
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
    groupForm: FormGroup;
    
    // Constants
    apiUrl = environment.imageUrl;
    Math = Math;
    
    constructor(
        private fb: FormBuilder, 
        private authService: AuthService, 
        private customizationGroupService: CustomizationGroupService,
        private menuOptionService: MenuOptionService
    ) {
        // Initialize form with validators
        this.groupForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
            description: ['', [Validators.maxLength(500)]],
            required: [false],
            allowMultiple: [false],
            positionEnabled: [false],
            quantityEnabled: [false],
            minSelect: [0, [Validators.min(0)]],
            maxSelect: [1, [Validators.min(1)]],
            priceImpact: ['ADDITIONAL'],
            options: [[]],
            active: [true],
            image: [null],
            imageUrl: [''],
            displayOrder: [0]
        }, { validators: this.selectionsValidator });
        
        // Watch for allowMultiple changes
        this.groupForm.get('allowMultiple')?.valueChanges.subscribe(value => {
            if (!value) {
                this.groupForm.get('minSelect')?.setValue(0);
                this.groupForm.get('maxSelect')?.setValue(1);
            } else {
                this.groupForm.get('minSelect')?.setValue(1);
                this.groupForm.get('maxSelect')?.setValue(3);
            }
        });
    }
    
    selectionsValidator(control: AbstractControl): ValidationErrors | null {
        const form = control as FormGroup;
        const allowMultiple = form.get('allowMultiple')?.value;
        const minSelect = form.get('minSelect')?.value;
        const maxSelect = form.get('maxSelect')?.value;
        
        if (allowMultiple && minSelect > maxSelect) {
            return { minGreaterThanMax: true };
        }
        
        return null;
    }

    ngOnInit(): void {
        // Check user permissions
        this.editGroup = this.hasPermission('UPDATE_CUSTOMIZATION_GROUP');
        this.createGroup = this.hasPermission('CREATE_CUSTOMIZATION_GROUP');
        this.deleteGroup = this.hasPermission('DELETE_CUSTOMIZATION_GROUP');
        this.readGroup = this.hasPermission('READ_CUSTOMIZATION_GROUP');
        
        // Load initial data
        this.loadCustomizationGroups();
        this.loadMenuOptions();
    }

    // Data fetch methods
    loadCustomizationGroups() {
        this.loading = true;
        this.customizationGroupService.getCustomizationGroups().subscribe({
            next: (groups) => {
                this.customizationGroups = groups;
                this.applyFiltersAndSort();
                this.loading = false;
            },
            error: (error) => {
                this.showToast(error.message || 'Failed to load customization groups', 'error');
                this.loading = false;
            }
        });
    }
    
    loadMenuOptions() {
        this.menuOptionService.getMenuOptions().subscribe({
            next: (options) => this.menuOptions = options,
            error: (error) => this.showToast(error.message || 'Failed to load menu options', 'error')
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

    filterGroups(filter: 'all' | 'required' | 'position' | 'quantity') {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.applyFiltersAndSort();
    }

    sortGroups(event: any) {
        this.currentSort = event.target.value;
        this.applyFiltersAndSort();
    }
    
    private applyFiltersAndSort() {        
        // First apply search filter
        let result = [...this.customizationGroups];
        
        // Apply search term filter
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter(group => 
                group.name.toLowerCase().includes(term) || 
                (group.description && group.description.toLowerCase().includes(term))
            );
        }
        
        // Apply status filter
        if (this.currentFilter === 'required') {
            result = result.filter(group => group.required);
        } else if (this.currentFilter === 'position') {
            result = result.filter(group => group.positionEnabled);
        } else if (this.currentFilter === 'quantity') {
            result = result.filter(group => group.quantityEnabled);
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
                result.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
                break;
            case 'oldest':
                result.sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
                break;
            case 'display-order':
                result.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
                break;
        }
        
        this.filteredGroups = result;
        this.updatePagination();
    }

    // Pagination methods
    updatePagination() {
        this.totalPages = Math.ceil(this.filteredGroups.length / this.pageSize);
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages || 1;
        }
    }

    get paginatedGroups() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredGroups.slice(startIndex, startIndex + this.pageSize);
    }

    goToPage(page: number) {
        this.currentPage = page;
    }

    updatePageSize() {
        this.currentPage = 1;
        this.updatePagination();
    }

    // Form related methods
    openCreateDialog() {
        this.groupForm.reset({
            name: '',
            description: '',
            required: false,
            allowMultiple: false,
            positionEnabled: false,
            quantityEnabled: false,
            minSelect: 0,
            maxSelect: 1,
            priceImpact: 'ADDITIONAL',
            options: [],
            active: true,
            displayOrder: this.customizationGroups.length
        });
        
        this.editingGroup = null;
        this.imagePreview = null;
        this.imageInputType = 'file';
        this.showDialog = true;
    }

    openEditDialog(group: CustomizationGroup) {
        this.editingGroup = group;
        
        this.groupForm.patchValue({
            name: group.name,
            description: group.description,
            required: group.required,
            allowMultiple: group.allowMultiple,
            positionEnabled: group.positionEnabled,
            quantityEnabled: group.quantityEnabled,
            minSelect: group.minSelect || 0,
            maxSelect: group.maxSelect || 1,
            priceImpact: group.priceImpact,
            options: group.options || [],
            active: group.active,
            displayOrder: group.displayOrder || 0,
            image: null,
            imageUrl: ''
        });
        
        this.imagePreview = group.imagePath ? this.getImagePath(group) : null;
        this.imageInputType = 'file';
        this.showDialog = true;
    }

    closeDialog() {
        this.showDialog = false;
        this.groupForm.reset();
        this.editingGroup = null;
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
            this.groupForm.patchValue({ image: file });
            
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
            this.groupForm.get('imageUrl')?.setValue('');
        } else {
            this.groupForm.get('image')?.setValue(null);
        }
    }

    updateImagePreviewFromUrl() {
        const url = this.groupForm.get('imageUrl')?.value;
        if (url) {
            this.imagePreview = url;
        }
    }

    getFileName(): string {
        const file = this.groupForm.get('image')?.value;
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
        if (this.groupForm.invalid || this.formSubmitting) {
            // Mark all fields as touched to trigger validation errors
            Object.keys(this.groupForm.controls).forEach(key => {
                const control = this.groupForm.get(key);
                control?.markAsTouched();
            });
            return;
        }
        
        this.formSubmitting = true;
        
        // Create FormData to handle file uploads
        const formData = new FormData();
        
        // Create group JSON
        const groupJson = JSON.stringify({
            name: this.groupForm.get('name')?.value,
            description: this.groupForm.get('description')?.value,
            required: this.groupForm.get('required')?.value,
            allowMultiple: this.groupForm.get('allowMultiple')?.value,
            positionEnabled: this.groupForm.get('positionEnabled')?.value,
            quantityEnabled: this.groupForm.get('quantityEnabled')?.value,
            minSelect: this.groupForm.get('minSelect')?.value,
            maxSelect: this.groupForm.get('maxSelect')?.value,
            priceImpact: this.groupForm.get('priceImpact')?.value,
            options: this.groupForm.get('options')?.value,
            active: this.groupForm.get('active')?.value,
            displayOrder: this.groupForm.get('displayOrder')?.value
        });
        
        formData.append("customizationGroup", groupJson);
        
        // Add image if selected from file
        if (this.groupForm.get('image')?.value) {
            formData.append("image", this.groupForm.get('image')?.value);
        }
        
        // Add image URL if provided
        if (this.imageInputType === 'url' && this.groupForm.get('imageUrl')?.value) {
            formData.append("imageUrl", this.groupForm.get('imageUrl')?.value);
        }
        
        // Choose API call based on edit or create
        const request = this.editingGroup
            ? this.customizationGroupService.updateCustomizationGroup(this.editingGroup.id!, formData)
            : this.customizationGroupService.createCustomizationGroup(formData);
        
        // Handle API response
        request.subscribe({
            next: () => {
                this.showToast(
                    `Customization group successfully ${this.editingGroup ? 'updated' : 'created'}`,
                    'success'
                );
                this.loadCustomizationGroups();
                this.closeDialog();
                this.formSubmitting = false;
            },
            error: (error) => {
                console.error("API Error:", error);
                this.showToast(error.message || `Failed to ${this.editingGroup ? 'update' : 'create'} customization group`, 'error');
                this.formSubmitting = false;
            }
        });
    }

    // Group details modal
    viewDetails(group: CustomizationGroup) {
        this.selectedGroup = group;
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
        if (this.selectedGroup) {
            this.openEditDialog(this.selectedGroup);
        }
    }

    // Group deletion
    confirmDelete(group: CustomizationGroup) {
        this.groupToDelete = group;
        this.showDeleteConfirmation = true;
    }

    cancelDelete(event?: MouseEvent) {
        if (event && event.target !== event.currentTarget) {
            return;
        }
        this.showDeleteConfirmation = false;
        this.groupToDelete = null;
        this.deletingGroup = false;
    }

    proceedWithDelete() {
        if (!this.groupToDelete || this.deletingGroup) return;
        
        this.deletingGroup = true;
        
        this.customizationGroupService.deleteCustomizationGroup(this.groupToDelete.id!).subscribe({
            next: () => {
                this.showToast('Customization group successfully deleted', 'success');
                this.loadCustomizationGroups();
                this.cancelDelete();
                this.deletingGroup = false;
            },
            error: (error) => {
                this.showToast(error.message || 'Failed to delete customization group', 'error');
                this.deletingGroup = false;
            }
        });
    }

    // Helper methods
    getOptionNames(options: (MenuOption | number)[] | null | undefined): string {
        const optionIds = options?.map(o => typeof o === 'number' ? o : o.id);
        if (!optionIds || !optionIds.length) return 'None';
        
        return optionIds.map(id => {
            const option = this.menuOptions.find(o => o.id === id);
            return option ? option.name : 'Unknown';
        }).join(', ');
    }
    
    getImagePath(group: any): string {
        if (!group || !group.imagePath) {
            return '';
        }
        return group.imagePath.startsWith('http') 
            ? group.imagePath 
            : this.apiUrl + group.imagePath;
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

    requiredGroupsCount() {
      return this.customizationGroups.filter(g => g.required).length;
    }

    positionGroupsCount() {
      return this.customizationGroups.filter(g => g.positionEnabled).length;
    }

    quantityEnabledCount() {
      return this.customizationGroups.filter(g => g.quantityEnabled).length
    }

    getMenuOptionsForGroup(group: CustomizationGroup) {
      return this.menuOptions.filter(option => group.options?.some(opt => (typeof opt === 'number' ? opt : opt.id) === option.id) ?? false);
    }
}
