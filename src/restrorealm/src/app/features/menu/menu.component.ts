import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MenuService } from '../../core/services/menu/menu.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { MenuOptionService } from '../../core/services/menu/option/menu-option.service';
import { MenuAddonService } from '../../core/services/menu/add-on/menu-addon.service';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CustomizationGroup } from '../../shared/models/customization-group.model';
import { MenuOption } from '../../shared/models/menu-option.model';
import { MenuAddOn, SpiceLevel, SpiceLevelOptions } from '../../shared/models/menu-addon.model';
// import { CustomizationGroupService } from '../../core/services/menu/customization-group/customization-group.service';
import { MenuItem } from '../../shared/models/MenuItem.model';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, FontAwesomeModule, RouterModule],
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
    // View state
    viewMode: 'card' | 'list' = 'card';
    
    // Data
    menuItems: MenuItem[] = [];
    filteredMenuItems: MenuItem[] = [];
    categories: any[] = [];
    customizationGroups: CustomizationGroup[] = [];
    menuOptions: MenuOption[] = [];
    addOns: MenuAddOn[] = [];
    spiceLevelOptions = SpiceLevelOptions;
    
    editingItem: MenuItem | null = null;
    selectedItem: MenuItem | null = null;
    itemToDelete: MenuItem | null = null;
    
    // Pagination
    currentPage: number = 1;
    pageSize: number = 12;
    totalPages: number = 1;
    
    // Search & Filter
    searchTerm: string = '';
    selectedCategory: any = null;
    currentFilter: 'all' | 'customizable' | 'available' | 'spicy' | 'vegetarian' = 'all';
    currentSort: string = 'name-asc';
    
    // UI state
    loading: boolean = false;
    formSubmitting: boolean = false;
    deletingItem: boolean = false;
    imageInputType: 'file' | 'url' = 'file';
    imagePreview: string | null = null;
    
    // Permissions
    isEditable: boolean = false;
    createMenuItem: boolean = false;
    readSingleMenuItem: boolean = false;
    deleteMenuItem: boolean = false;
    
    // Modals
    showDialog: boolean = false;
    showDetailsModal: boolean = false;
    showDeleteConfirmation: boolean = false;
    showCustomizationModal: boolean = false;
    
    // Notifications
    toast: {
        message: string;
        type: 'success' | 'error';
    } | null = null;
    
    // Form
    menuForm: FormGroup;
    customizationGroupsFormArray: FormArray;
    
    // Constants
    apiUrl = environment.imageUrl;
    Math = Math;
    
    constructor(
        private fb: FormBuilder,
        private menuService: MenuService,
        private authService: AuthService,
        // private customizationGroupService: CustomizationGroupService,
        private menuOptionService: MenuOptionService,
        private menuAddonService: MenuAddonService
    ) {
        this.customizationGroupsFormArray = this.fb.array([]);
        
        this.menuForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            basePrice: [0, [Validators.required, Validators.min(0)]],
            categoryId: [null, Validators.required],
            calories: [0, [Validators.required, Validators.min(0)]],
            isVegetarian: [false],
            isSpicy: [false],
            spiceLevel: [SpiceLevel.NONE],
            unavailable: [false],
            isNew: [false],
            customizable: [false],
            hasAddOns: [false],
            image: [null],
            imageUrl: [''],
            // customizationGroups: this.customizationGroupsFormArray,
            addOns: [[]]
        });
        
        // Watch for customizable toggle changes
        this.menuForm.get('customizable')?.valueChanges.subscribe(value => {
            if (!value) {
                this.customizationGroupsFormArray.clear();
            }
        });
        
        // Watch for spicy toggle changes
        this.menuForm.get('isSpicy')?.valueChanges.subscribe(isSpicy => {
            const spiceLevelControl = this.menuForm.get('spiceLevel');
            if (!isSpicy && spiceLevelControl) {
                spiceLevelControl.setValue(SpiceLevel.NONE);
            } else if (isSpicy && spiceLevelControl && spiceLevelControl.value === SpiceLevel.NONE) {
                spiceLevelControl.setValue(SpiceLevel.MEDIUM); // Default to medium when enabling spicy
            }
        });
        
        // Update spicy status when spice level changes
        this.menuForm.get('spiceLevel')?.valueChanges.subscribe(level => {
            const isSpicyControl = this.menuForm.get('isSpicy');
            if (level !== SpiceLevel.NONE && isSpicyControl) {
                isSpicyControl.setValue(true);
            }
        });
    }
    
    ngOnInit() {
        // Check permissions
        this.isEditable = this.hasPermission('UPDATE_SINGLE_MENU_ITEM');
        this.createMenuItem = this.hasPermission('CREATE_MENU_ITEM');
        this.readSingleMenuItem = this.hasPermission('READ_SINGLE_MENU_ITEM');
        this.deleteMenuItem = this.hasPermission('DELETE_MENU_ITEM');
        
        // Load initial data
        this.loadMenuItems();
        this.loadCategories();
        // this.loadCustomizationGroups();
        this.loadMenuOptions();
        this.loadAddOns();
    }
    
    // Data loading methods
    loadMenuItems() {
        this.loading = true;
        this.menuService.getAllMenuItems().subscribe({
            next: (items) => {
                this.menuItems = items;
                this.filteredMenuItems = items;
                this.applyFiltersAndSort();
                this.loading = false;
            },
            error: (error) => {
                this.showToast(error.message || 'Failed to load menu items', 'error');
                this.loading = false;
            }
        });
    }
    
    loadCategories() {
        this.menuService.getCategories().subscribe({
            next: (categories) => this.categories = categories,
            error: (error) => this.showToast(error.message || 'Failed to load categories', 'error')
        });
    }
    
    // loadCustomizationGroups() {
    //     this.customizationGroupService.getCustomizationGroups().subscribe({
    //         next: (groups) => this.customizationGroups = groups,
    //         error: (error) => this.showToast(error.message || 'Failed to load customization groups', 'error')
    //     });
    // }
    
    loadMenuOptions() {
        this.menuOptionService.getMenuOptions().subscribe({
            next: (options) => this.menuOptions = options,
            error: (error) => this.showToast(error.message || 'Failed to load menu options', 'error')
        });
    }
    
    loadAddOns() {
        this.menuAddonService.getMenuAddons().subscribe({
            next: (addOns) => this.addOns = addOns,
            error: (error) => this.showToast(error.message || 'Failed to load add-ons', 'error')
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
    
    filterByCategory(category: any) {
        this.selectedCategory = this.selectedCategory === category ? null : category;
        this.currentPage = 1;
        this.applyFiltersAndSort();
    }
    
    filterMenuItems(filter: 'all' | 'customizable' | 'available' | 'spicy' | 'vegetarian') {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.applyFiltersAndSort();
    }
    
    sortMenuItems(event: any) {
        this.currentSort = event.target.value;
        this.applyFiltersAndSort();
    }
    
    private applyFiltersAndSort() {
        // Apply search filter
        let result = [...this.menuItems];
        
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter(item => 
                item.name.toLowerCase().includes(term) || 
                (item.description && item.description.toLowerCase().includes(term))
            );
        }
        
        // Apply category filter
        if (this.selectedCategory) {
            result = result.filter(item => item.category?.id === this.selectedCategory.id);
        }
        
        // Apply status filter
        if (this.currentFilter === 'customizable') {
            result = result.filter(item => item.customizable);
        } else if (this.currentFilter === 'available') {
            result = result.filter(item => !item.unavailable);
        } else if (this.currentFilter === 'spicy') {
            result = result.filter(item => item.isSpicy);
        } else if (this.currentFilter === 'vegetarian') {
            result = result.filter(item => item.isVegetarian);
        }
        
        // Apply sorting
        switch (this.currentSort) {
            case 'name-asc':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                result.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'price-low':
                result.sort((a, b) => a.basePrice - b.basePrice);
                break;
            case 'price-high':
                result.sort((a, b) => b.basePrice - a.basePrice);
                break;
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'oldest':
                result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                break;
        }
        
        this.filteredMenuItems = result;
        this.updatePagination();
    }
    
    // Pagination methods
    updatePagination() {
        this.totalPages = Math.ceil(this.filteredMenuItems.length / this.pageSize);
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages || 1;
        }
    }
    
    get paginatedMenuItems() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredMenuItems.slice(startIndex, startIndex + this.pageSize);
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
        this.menuForm.reset({
            name: '',
            description: '',
            basePrice: 0,
            categoryId: null,
            calories: 0,
            isVegetarian: false,
            isSpicy: false,
            spiceLevel: SpiceLevel.NONE,
            unavailable: false,
            isNew: true,
            customizable: false,
            hasAddOns: false,
            addOns: []
        });
        
        this.customizationGroupsFormArray.clear();
        this.editingItem = null;
        this.imagePreview = null;
        this.imageInputType = 'file';
        this.showDialog = true;
    }
    
    openEditDialog(item: MenuItem) {
        this.editingItem = item;
        
        // Clear customization groups first
        this.customizationGroupsFormArray.clear();
        
        // Load customization groups if needed
        if (item.customizable && item.id) {
            // this.customizationGroupService.getGroupsByMenuItem(item.id).subscribe({
            //     next: (groups) => {
            //         groups.forEach(group => {
            //             this.addExistingCustomizationGroup(group);
            //         });
            //     }
            // });
        }
        
        this.menuForm.patchValue({
            name: item.name,
            description: item.description,
            basePrice: item.basePrice,
            category: item.category,
            calories: item.calories,
            isVegetarian: item.isVegetarian || false,
            isSpicy: item.isSpicy || false,
            spiceLevel: item.spiceLevel || SpiceLevel.NONE,
            unavailable: item.unavailable || false,
            isNew: item.isNew || false,
            customizable: item.customizable || false,
            hasAddOns: item.hasAddOns || false,
            addOns: item.addOns || [],
            image: null
        });
        
        this.imagePreview = item.imagePath ? this.getImagePath(item) : null;
        this.imageInputType = 'file';
        this.showDialog = true;
    }
    
    closeDialog() {
        this.showDialog = false;
        this.menuForm.reset();
        this.customizationGroupsFormArray.clear();
        this.editingItem = null;
        this.imagePreview = null;
    }
    
    closeDialogIfBackdrop(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            this.closeDialog();
        }
    }
    
    // Customization Groups management
    get customizationGroupsControls() {
        return this.customizationGroupsFormArray.controls as FormGroup[];
    }
    
    addExistingCustomizationGroup(group: CustomizationGroup) {
        this.customizationGroupsFormArray.push(this.fb.group({
            id: [group.id],
            name: [group.name],
            required: [group.required],
            displayOrder: [group.displayOrder || 0]
        }));
    }
    
    addCustomizationGroup(group: CustomizationGroup) {
        // Check if group already exists
        const exists = this.customizationGroupsControls.some(
            ctrl => ctrl.get('id')?.value === group.id
        );
        
        if (!exists) {
            this.customizationGroupsFormArray.push(this.fb.group({
                id: [group.id],
                name: [group.name],
                required: [group.required],
                displayOrder: [this.customizationGroupsControls.length]
            }));
        }
    }
    
    removeCustomizationGroup(index: number) {
        this.customizationGroupsFormArray.removeAt(index);
    }
    
    openCustomizationManager() {
        // This would open the customization management modal
        this.showCustomizationModal = true;
    }
    
    closeCustomizationManager() {
        this.showCustomizationModal = false;
    }
    
    moveGroupUp(index: number) {
        if (index > 0) {
            const group = this.customizationGroupsFormArray.at(index);
            this.customizationGroupsFormArray.removeAt(index);
            this.customizationGroupsFormArray.insert(index - 1, group);
            
            // Update display orders
            this.updateGroupDisplayOrders();
        }
    }
    
    moveGroupDown(index: number) {
        if (index < this.customizationGroupsFormArray.length - 1) {
            const group = this.customizationGroupsFormArray.at(index);
            this.customizationGroupsFormArray.removeAt(index);
            this.customizationGroupsFormArray.insert(index + 1, group);
            
            // Update display orders
            this.updateGroupDisplayOrders();
        }
    }
    
    updateGroupDisplayOrders() {
        this.customizationGroupsControls.forEach((control, index) => {
            control.get('displayOrder')?.setValue(index);
        });
    }
    
    // AddOns management methods
    isAddonSelected(addonId: number): boolean {
        const addons = this.menuForm.get('addOns')?.value || [];
        return addons.includes(addonId);
    }
    
    toggleAddon(addonId: number): void {
        const addonsControl = this.menuForm.get('addOns');
        const currentAddons = [...(addonsControl?.value || [])];
        
        if (this.isAddonSelected(addonId)) {
            // Remove addon
            const index = currentAddons.indexOf(addonId);
            if (index !== -1) {
                currentAddons.splice(index, 1);
            }
        } else {
            // Add addon
            currentAddons.push(addonId);
        }
        
        addonsControl?.setValue(currentAddons);
    }
    
    getAddonById(addonId: number): any {
        return this.addOns.find(addon => addon.id === addonId);
    }
    
    getAddonName(addonId: number): string {
        const addon = this.getAddonById(addonId);
        return addon ? (addon.addOnName || addon.name || 'Unknown Add-on') : 'Unknown Add-on';
    }
    
    getAddonPrice(addonId: number): number {
        const addon = this.getAddonById(addonId);
        return addon ? (addon.addOnPrice || addon.price || 0) : 0;
    }
    
    getAddonImagePath(addon: any): string {
        if (!addon) return '';
        
        if (addon.imagePath) {
            return addon.imagePath.startsWith('http') 
                ? addon.imagePath 
                : this.apiUrl + addon.imagePath;
        }
        
        if (addon.imageUrl) {
            return addon.imageUrl.startsWith('http')
                ? addon.imageUrl
                : this.apiUrl + addon.imageUrl;
        }
        
        return '';
    }
    
    // Spice Level methods
    getSpiceLevelColor(level: SpiceLevel | string): string {
        switch(level) {
            case SpiceLevel.MILD:
                return '#FFC107'; // Amber
            case SpiceLevel.MEDIUM:
                return '#FF9800'; // Orange
            case SpiceLevel.HOT:
                return '#F44336'; // Red
            case SpiceLevel.EXTRA_HOT:
                return '#C62828'; // Dark Red
            default:
                return '#9E9E9E'; // Grey for NONE
        }
    }
    
    getSpiceLevelLabel(level: SpiceLevel | string): string {
        const option = this.spiceLevelOptions.find(opt => opt.value === level);
        return option ? option.label : 'None';
    }
    
    // Image handling methods
    onImageSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            
            // Update form value
            this.menuForm.patchValue({ image: file });
            
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
            this.menuForm.get('imageUrl')?.setValue('');
        } else {
            this.menuForm.get('image')?.setValue(null);
        }
    }
    
    updateImagePreviewFromUrl() {
        const url = this.menuForm.get('imageUrl')?.value;
        if (url) {
            this.imagePreview = url;
        }
    }
    
    getFileName(): string {
        const file = this.menuForm.get('image')?.value;
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
    
    // Form submission
    onSubmit() {
        if (this.menuForm.invalid || this.formSubmitting) {
            Object.keys(this.menuForm.controls).forEach(key => {
                const control = this.menuForm.get(key);
                control?.markAsTouched();
            });
            return;
        }
        
        this.formSubmitting = true;
        
        // Create FormData to handle file uploads
        const formData = new FormData();
        
        // Create menu item JSON
        const menuItemJson = JSON.stringify({
            name: this.menuForm.get('name')?.value,
            description: this.menuForm.get('description')?.value,
            basePrice: this.menuForm.get('basePrice')?.value,
            categoryId: this.menuForm.get('categoryId')?.value,
            calories: this.menuForm.get('calories')?.value,
            isVegetarian: this.menuForm.get('isVegetarian')?.value,
            isSpicy: this.menuForm.get('isSpicy')?.value,
            spiceLevel: this.menuForm.get('spiceLevel')?.value,
            unavailable: this.menuForm.get('unavailable')?.value,
            isNew: this.menuForm.get('isNew')?.value,
            customizable: this.menuForm.get('customizable')?.value,
            hasAddOns: this.menuForm.get('hasAddOns')?.value,
            // customizationGroups: this.menuForm.get('customizable')?.value ? 
                // this.menuForm.get('customizationGroups')?.value : [],
            addOns: this.menuForm.get('hasAddOns')?.value ? 
                this.menuForm.get('addOns')?.value : []
        });
        
        formData.append("menuItem", menuItemJson);
        
        // Add image if selected from file
        if (this.menuForm.get('image')?.value) {
            formData.append("image", this.menuForm.get('image')?.value);
        }
        
        // Add image URL if provided
        if (this.imageInputType === 'url' && this.menuForm.get('imageUrl')?.value) {
            formData.append("imageUrl", this.menuForm.get('imageUrl')?.value);
        }
        
        // Choose API call based on edit or create
        const request = this.editingItem
            ? this.menuService.updateMenuItem(this.editingItem.id, formData)
            : this.menuService.createMenuItem(formData);
        
        // Handle API response
        request.subscribe({
            next: () => {
                this.showToast(
                    `Menu item successfully ${this.editingItem ? 'updated' : 'created'}`,
                    'success'
                );
                this.loadMenuItems();
                this.closeDialog();
                this.formSubmitting = false;
            },
            error: (error) => {
                console.error("API Error:", error);
                this.showToast(error.message || `Failed to ${this.editingItem ? 'update' : 'create'} menu item`, 'error');
                this.formSubmitting = false;
            }
        });
    }
    
    // Menu item details
    viewDetails(item: MenuItem) {
        this.selectedItem = item;
        this.showDetailsModal = true;
        
        // Load customization groups if item is customizable
        if (item.customizable && item.id) {
            // this.customizationGroupService.getGroupsByMenuItem(item.id).subscribe({
            //     next: (groups) => {
            //         if (this.selectedItem) {
            //             this.selectedItem.customizationGroups = groups;
            //         }
            //     }
            // });
        }
    }
    
    closeDetailsModal(event?: MouseEvent) {
        if (event && event.target !== event.currentTarget) {
            return;
        }
        this.showDetailsModal = false;
        this.selectedItem = null;
    }
    
    editFromDetails() {
        if (this.selectedItem) {
            this.closeDetailsModal();
            this.openEditDialog(this.selectedItem);
        }
    }
    
    // Menu item deletion
    confirmDelete(item: MenuItem) {
        this.itemToDelete = item;
        this.showDeleteConfirmation = true;
    }
    
    cancelDelete(event?: MouseEvent) {
        if (event && event.target !== event.currentTarget) {
            return;
        }
        this.showDeleteConfirmation = false;
        this.itemToDelete = null;
        this.deletingItem = false;
    }
    
    proceedWithDelete() {
        if (!this.itemToDelete || this.deletingItem) return;
        
        this.deletingItem = true;
        
        this.menuService.deleteMenuItem(this.itemToDelete.id).subscribe({
            next: () => {
                this.showToast('Menu item successfully deleted', 'success');
                this.loadMenuItems();
                this.cancelDelete();
                this.deletingItem = false;
            },
            error: (error) => {
                this.showToast(error.message || 'Failed to delete menu item', 'error');
                this.deletingItem = false;
            }
        });
    }
    
    // Helper methods
    getCategoryName(categoryId: number): string {
        const category = this.categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Uncategorized';
    }
    
    getCustomizationGroupName(groupId: number): string {
        const group = this.customizationGroups.find(g => g.id === groupId);
        return group ? group.name : 'Unknown Group';
    }
    
    getImagePath(item: any): string {
        if (!item) return '';
        
        if (item.imagePath) {
            return item.imagePath.startsWith('http') 
                ? item.imagePath 
                : this.apiUrl + item.imagePath;
        }
        
        if (item.imageUrl) {
            return item.imageUrl.startsWith('http')
                ? item.imageUrl
                : this.apiUrl + item.imageUrl;
        }
        
        return '';
    }
    
    formatPrice(price: number): string {
        return price.toFixed(2);
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

    availableMenuItems() {
        return this.menuItems.filter(item => !item.unavailable).length;
    }

    customizedMenuItems() {
        return this.menuItems.filter(item => item.customizable).length;
    }
}
