import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { environment } from '../../../environments/environment';
import { MenuOptionService } from '../../core/services/menu/option/menu-option.service';
import { MenuOption, SelectionType, DisplayStyle, SelectionTypeOptions, DisplayStyleOptions, MenuOptionChoice } from '../../shared/models/menu-option.model';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  selector: 'app-menu-option',
  templateUrl: './menu-option.component.html',
  styleUrls: ['./menu-option.component.css']
})
export class MenuOptionComponent implements OnInit {
    // View state
    viewMode: 'card' | 'list' = 'card';
    
    // Data
    menuOptions: MenuOption[] = [];
    filteredOptions: MenuOption[] = [];
    editingOption: MenuOption | null = null;
    selectedOption: MenuOption | null = null;
    optionToDelete: MenuOption | null = null;
    
    // UI constants
    selectionTypeOptions = SelectionTypeOptions;
    displayStyleOptions = DisplayStyleOptions;
    
    // Pagination
    currentPage: number = 1;
    pageSize: number = 12;
    totalPages: number = 1;
    
    // Permissions
    editOption: boolean = false;
    createOption: boolean = false;
    deleteSingleOption: boolean = false;
    readSingleOption: boolean = false;
    readAllOptions: boolean = false;
    
    // UI state
    loading: boolean = false;
    formSubmitting: boolean = false;
    deletingOption: boolean = false;
    searchTerm: string = '';
    currentFilter: 'all' | 'active' | 'inactive' | 'required' = 'all';
    currentSort: string = 'name-asc';
    imageInputType: 'file' | 'url' = 'file';
    imagePreview: string | null = null;
    
    // Modals
    showDialog: boolean = false;
    showDetailsModal: boolean = false;
    showDeleteConfirmation: boolean = false;
    showChoiceDialog: boolean = false;
    
    // Notifications
    toast: {
        message: string;
        type: 'success' | 'error';
    } | null = null;
    
    // Forms
    optionForm: FormGroup;
    choiceForm: FormGroup;
    editingChoiceIndex: number | null = null;
    
    // Constants
    apiUrl = environment.imageUrl;
    Math = Math;
    
    // Constructor with dependency injection
    constructor(
        private fb: FormBuilder, 
        private authService: AuthService, 
        private menuOptionService: MenuOptionService
    ) {
        // Initialize forms with validators
        this.optionForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
            description: ['', [Validators.maxLength(500)]],
            required: [false],
            active: [true],
            selectionType: [SelectionType.SINGLE, Validators.required],
            displayStyle: [DisplayStyle.DROPDOWN, Validators.required],
            minSelect: [1, [Validators.min(0)]],
            maxSelect: [1, [Validators.min(1)]],
            choices: this.fb.array([]),
            image: [null],
            imageUrl: [''],
            categories: [[]]
        }, { validators: this.selectionRangeValidator });

        this.choiceForm = this.fb.group({
            choiceName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
            description: ['', [Validators.maxLength(200)]],
            additionalPrice: [0, [Validators.min(0)]],
            default: [false],
            active: [true],
            image: [null],
            imageUrl: ['']
        });
    }

    ngOnInit(): void {
        // Check user permissions
        this.editOption = this.hasPermission('UPDATE_SINGLE_MENU_OPTION');
        this.createOption = this.hasPermission('CREATE_MENU_OPTION');
        this.deleteSingleOption = this.hasPermission('DELETE_MENU_OPTION');
        this.readSingleOption = this.hasPermission('READ_SINGLE_MENU_OPTION');
        this.readAllOptions = this.hasPermission('READ_ALL_MENU_OPTIONS');
        
        console.log('Permissions:', {
            edit: this.editOption,
            create: this.createOption,
            delete: this.deleteSingleOption,
            readSingle: this.readSingleOption,
            readAll: this.readAllOptions
        });
        
        // Load initial data if user has permissions
        if (this.readAllOptions) {
            this.loadMenuOptions();
        }
        
        // Watch for selection type changes to update display style
        this.optionForm.get('selectionType')?.valueChanges.subscribe(value => {
            const displayStyleControl = this.optionForm.get('displayStyle');
            if (value === SelectionType.SINGLE) {
                displayStyleControl?.setValue(DisplayStyle.DROPDOWN);
            } else if (value === SelectionType.MULTIPLE) {
                displayStyleControl?.setValue(DisplayStyle.CHECKBOX);
            } else if (value === SelectionType.RANGE) {
                displayStyleControl?.setValue(DisplayStyle.SLIDER);
            }
            
            // Reset min/max based on selection type
            if (value === SelectionType.SINGLE) {
                this.optionForm.get('minSelect')?.setValue(1);
                this.optionForm.get('maxSelect')?.setValue(1);
            } else if (value === SelectionType.MULTIPLE) {
                this.optionForm.get('minSelect')?.setValue(1);
                this.optionForm.get('maxSelect')?.setValue(3);
            } else if (value === SelectionType.RANGE) {
                this.optionForm.get('minSelect')?.setValue(0);
                this.optionForm.get('maxSelect')?.setValue(100);
            }
        });
    }

    // Selection range validator
    selectionRangeValidator(control: AbstractControl): ValidationErrors | null {
        const form = control as FormGroup;
        const selectionType = form.get('selectionType')?.value;
        const minSelect = form.get('minSelect')?.value;
        const maxSelect = form.get('maxSelect')?.value;
        const choices = form.get('choices')?.value;
        
        if (selectionType === SelectionType.MULTIPLE) {
            if (minSelect > maxSelect) {
                return { minGreaterThanMax: true };
            }
            
            if (choices && choices.length > 0 && maxSelect > choices.length) {
                return { maxGreaterThanChoices: true };
            }
        }
        
        return null;
    }

    // Data fetch method
    loadMenuOptions() {
        this.loading = true;
        this.menuOptionService.getMenuOptions().subscribe({
            next: (options) => {
                console.log('Loaded options:', options);
                this.menuOptions = [...options];
                this.applyFiltersAndSort();
                this.loading = false;
            },
            error: (error) => {
                console.error('Failed to load menu options:', error);
                this.showToast(error.message || 'Failed to load menu options', 'error');
                this.loading = false;
            },
            complete: () => {
                console.log('Menu options loading complete');
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

    filterOptions(filter: 'all' | 'active' | 'inactive' | 'required') {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.applyFiltersAndSort();
    }

    sortOptions(event: any) {
        this.currentSort = event.target.value;
        this.applyFiltersAndSort();
    }
    
    private applyFiltersAndSort() {        
        // First apply search filter
        let result = [...this.menuOptions];
        
        // Apply search term filter
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter(option => 
                (option.name && option.name.toLowerCase().includes(term)) || 
                (option.optionName && option.optionName.toLowerCase().includes(term)) || 
                (option.description && option.description.toLowerCase().includes(term))
            );
        }
        
        // Apply status filter
        if (this.currentFilter === 'active') {
            result = result.filter(option => option.active);
        } else if (this.currentFilter === 'inactive') {
            result = result.filter(option => !option.active);
        } else if (this.currentFilter === 'required') {
            result = result.filter(option => option.required);
        }
        
        // Apply sorting
        switch (this.currentSort) {
            case 'name-asc':
                result.sort((a, b) => {
                    const nameA = a.name || a.optionName || '';
                    const nameB = b.name || b.optionName || '';
                    return nameA.localeCompare(nameB);
                });
                break;
            case 'name-desc':
                result.sort((a, b) => {
                    const nameA = a.name || a.optionName || '';
                    const nameB = b.name || b.optionName || '';
                    return nameB.localeCompare(nameA);
                });
                break;
            case 'choices-desc':
                result.sort((a, b) => b.choices.length - a.choices.length);
                break;
            case 'choices-asc':
                result.sort((a, b) => a.choices.length - b.choices.length);
                break;
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
                break;
            case 'oldest':
                result.sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
                break;
        }
        this.filteredOptions = [...result];
        this.updatePagination();
    }

    // Pagination methods
    updatePagination() {
        this.totalPages = Math.ceil(this.filteredOptions.length / this.pageSize);
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages || 1;
        }
    }

    get paginatedOptions() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredOptions.slice(startIndex, startIndex + this.pageSize);
    }

    goToPage(page: number) {
        this.currentPage = page;
    }

    updatePageSize() {
        this.currentPage = 1;
        this.updatePagination();
    }

    // Status helper methods
    getActiveOptions(): number {
        return this.menuOptions.filter(option => option.active).length;
    }

    getInactiveOptions(): number {
        return this.menuOptions.filter(option => !option.active).length;
    }

    getRequiredOptions(): number {
        return this.menuOptions.filter(option => option.required).length;
    }

    formatPrice(price: number): string {
        return price.toFixed(2);
    }
    
    getSelectionTypeLabel(type: SelectionType): string {
        return SelectionTypeOptions.find(option => option.value === type)?.label || 'Unknown';
    }
    
    getDisplayStyleLabel(style: DisplayStyle): string {
        return DisplayStyleOptions.find(option => option.value === style)?.label || 'Unknown';
    }

    // Form related methods
    openCreateDialog() {
        this.optionForm.reset({
            name: '',
            description: '',
            required: false,
            active: true,
            selectionType: SelectionType.SINGLE,
            displayStyle: DisplayStyle.DROPDOWN,
            minSelect: 1,
            maxSelect: 1,
            categories: []
        });
        
        // Clear choices
        this.choicesFormArray.clear();
        
        this.editingOption = null;
        this.imagePreview = null;
        this.imageInputType = 'file';
        this.showDialog = true;
    }

    openEditDialog(option: MenuOption) {
        this.editingOption = option;
        
        // Clear choices first
        this.choicesFormArray.clear();
        
        // Add existing choices
        if (option.choices && option.choices.length > 0) {
            option.choices.forEach(choice => {
                this.addExistingChoice(choice);
            });
        }
        
        this.optionForm.patchValue({
            name: option.name || option.optionName,
            description: option.description,
            required: option.required,
            active: option.active,
            selectionType: option.selectionType,
            displayStyle: option.displayStyle,
            minSelect: option.minSelect || 0,
            maxSelect: option.maxSelect || 1,
            image: null,
            imageUrl: '',
            categories: option.categories || []
        });
        
        this.imagePreview = null;
        this.imageInputType = 'file';
        this.showDialog = true;
    }

    closeDialog() {
        this.showDialog = false;
        this.optionForm.reset();
        this.editingOption = null;
        this.imagePreview = null;
    }

    closeDialogIfBackdrop(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            this.closeDialog();
        }
    }

    // Choices management
    get choicesFormArray() {
        return this.optionForm.get('choices') as FormArray;
    }
    
    addExistingChoice(choice: MenuOptionChoice) {
        this.choicesFormArray.push(this.fb.group({
            id: [choice.id],
            choiceName: [choice.choiceName, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
            description: [choice.description || '', [Validators.maxLength(200)]],
            additionalPrice: [choice.additionalPrice || 0, [Validators.min(0)]],
            default: [choice.default || false],
            active: [choice.active],
            imagePath: [choice.imagePath || '']
        }));
    }
    
    openChoiceDialog() {
        // Reset choice form
        this.choiceForm.reset({
            choiceName: '',
            description: '',
            additionalPrice: 0,
            default: false,
            active: true,
            image: null,
            imageUrl: ''
        });
        
        this.editingChoiceIndex = null;
        this.imagePreview = null;
        this.imageInputType = 'file';
        this.showChoiceDialog = true;
    }
    
    editChoice(index: number) {
        this.editingChoiceIndex = index;
        const choice = this.choicesFormArray.at(index).value;
        
        this.choiceForm.patchValue({
            choiceName: choice.choiceName,
            description: choice.description,
            additionalPrice: choice.additionalPrice,
            default: choice.default,
            active: choice.active,
            image: null,
            imageUrl: ''
        });
        
        this.imagePreview = choice.imagePath ? this.getImagePath({ imagePath: choice.imagePath }) : null;
        this.imageInputType = 'file';
        this.showChoiceDialog = true;
    }
    
    closeChoiceDialog(event?: MouseEvent) {
        if (event && event.target !== event.currentTarget) {
            return;
        }
        this.showChoiceDialog = false;
        this.choiceForm.reset();
        this.editingChoiceIndex = null;
        this.imagePreview = null;
    }
    
    saveChoice() {
        if (this.choiceForm.invalid) {
            // Mark all fields as touched to trigger validation errors
            Object.keys(this.choiceForm.controls).forEach(key => {
                const control = this.choiceForm.get(key);
                control?.markAsTouched();
            });
            return;
        }
        
        const choiceData: {
            choiceName: any;
            description: any;
            additionalPrice: any;
            default: any;
            active: any;
            imagePath: string | null;
            id?: string;
        } = {
            choiceName: this.choiceForm.get('choiceName')?.value,
            description: this.choiceForm.get('description')?.value,
            additionalPrice: this.choiceForm.get('additionalPrice')?.value,
            default: this.choiceForm.get('default')?.value,
            active: this.choiceForm.get('active')?.value,
            imagePath: this.imagePreview
        };
        
        if (this.editingChoiceIndex !== null) {
            // Update existing choice
            const existingChoice = this.choicesFormArray.at(this.editingChoiceIndex).value;
            if (existingChoice.id) {
                choiceData['id'] = existingChoice.id;
            }
            this.choicesFormArray.at(this.editingChoiceIndex).patchValue(choiceData);
        } else {
            // Add new choice
            this.choicesFormArray.push(this.fb.group(choiceData));
        }
        
        // Close dialog
        this.closeChoiceDialog();
    }
    
    removeChoice(index: number) {
        this.choicesFormArray.removeAt(index);
    }

    // Image handling methods
    onImageSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            
            // Update form value
            if (this.showChoiceDialog) {
                this.choiceForm.patchValue({ image: file });
            } else {
                this.optionForm.patchValue({ image: file });
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
            if (this.showChoiceDialog) {
                this.choiceForm.get('imageUrl')?.setValue('');
            } else {
                this.optionForm.get('imageUrl')?.setValue('');
            }
        } else {
            if (this.showChoiceDialog) {
                this.choiceForm.get('image')?.setValue(null);
            } else {
                this.optionForm.get('image')?.setValue(null);
            }
        }
    }

    updateImagePreviewFromUrl() {
        const url = this.showChoiceDialog 
            ? this.choiceForm.get('imageUrl')?.value 
            : this.optionForm.get('imageUrl')?.value;
            
        if (url) {
            this.imagePreview = url;
        }
    }

    getFileName(): string {
        const file = this.showChoiceDialog 
            ? this.choiceForm.get('image')?.value 
            : this.optionForm.get('image')?.value;
            
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
        if (this.optionForm.invalid || this.formSubmitting) {
            // Mark all fields as touched to trigger validation errors
            Object.keys(this.optionForm.controls).forEach(key => {
                const control = this.optionForm.get(key);
                control?.markAsTouched();
            });
            return;
        }
        
        this.formSubmitting = true;
        
        // Create FormData to handle file uploads
        const formData = new FormData();
        
        // Create option JSON
        const optionJson = JSON.stringify({
            name: this.optionForm.get('name')?.value,
            description: this.optionForm.get('description')?.value,
            required: this.optionForm.get('required')?.value,
            active: this.optionForm.get('active')?.value,
            selectionType: this.optionForm.get('selectionType')?.value,
            displayStyle: this.optionForm.get('displayStyle')?.value,
            minSelect: this.optionForm.get('minSelect')?.value,
            maxSelect: this.optionForm.get('maxSelect')?.value,
            choices: this.optionForm.get('choices')?.value,
            categories: this.optionForm.get('categories')?.value,
        });
        
        formData.append("option", optionJson);
        
        // Add image if selected from file
        if (this.optionForm.get('image')?.value) {
            formData.append("image", this.optionForm.get('image')?.value);
        }
        
        // Add image URL if provided
        if (this.imageInputType === 'url' && this.optionForm.get('imageUrl')?.value) {
            formData.append("imageUrl", this.optionForm.get('imageUrl')?.value);
        }
        
        console.log('Submitting form with data:', {
            jsonData: JSON.parse(optionJson),
            imageType: this.imageInputType,
            imageUrl: this.optionForm.get('imageUrl')?.value
        });
        
        // Choose API call based on edit or create
        const request = this.editingOption
            ? this.menuOptionService.updateMenuOption(this.editingOption.id!, formData)
            : this.menuOptionService.createMenuOption(formData);
        
        // Handle API response
        request.subscribe({
            next: (response) => {
                
                // First reset all UI states
                this.closeDialog();
                this.formSubmitting = false;
                
                // Show success message
                this.showToast(
                    `Option successfully ${this.editingOption ? 'updated' : 'created'}`,
                    'success'
                );
                
                // Explicitly trigger a complete refresh of data after a short delay
                setTimeout(() => {
                    // Force a fresh load from the service instead of using loadMenuOptions()
                    this.menuOptionService.getMenuOptions().subscribe({
                        next: (options) => {
                            console.log('Reloaded options after update:', options);
                            this.menuOptions = [...options];
                            this.applyFiltersAndSort();
                        },
                        error: (err) => {
                            console.error('Failed to reload options after update:', err);
                        }
                    });
                }, 300);
            },
            error: (error) => {
                console.error("API Error:", error);
                this.showToast(
                    error.error?.error || error.message || `Failed to ${this.editingOption ? 'update' : 'create'} option`, 
                    'error'
                );
                this.formSubmitting = false;
            }
        });
    }

    // Option details modal
    viewDetails(option: MenuOption) {
        this.selectedOption = option;
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
        this.openEditDialog(this.selectedOption!);
    }

    // Option deletion
    confirmDelete(option: MenuOption) {
        this.optionToDelete = option;
        this.showDeleteConfirmation = true;
    }

    cancelDelete(event?: MouseEvent) {
        if (event && event.target !== event.currentTarget) {
            return;
        }
        this.showDeleteConfirmation = false;
        this.optionToDelete = null;
        this.deletingOption = false;
    }

    proceedWithDelete() {
        if (!this.optionToDelete || this.deletingOption) return;
        
        this.deletingOption = true;
        
        this.menuOptionService.deleteMenuOption(this.optionToDelete.id!).subscribe({
            next: () => {
                this.showToast('Option successfully deleted', 'success');
                this.loadMenuOptions();
                this.cancelDelete();
                this.deletingOption = false;
            },
            error: (error) => {
                this.showToast(error.message || 'Failed to delete option', 'error');
                this.deletingOption = false;
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
