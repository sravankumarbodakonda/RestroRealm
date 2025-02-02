import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuService } from '../../core/services/menu/menu.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { ToasterComponent } from '../../shared/components/toaster/toaster.component';
import { environment } from '../../../environments/environment';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ToasterComponent],
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
    viewMode: 'card' | 'list' = 'card';
    menuItems: any[] = [];
    filteredMenuItems: any[] = [];
    categories: any[] = [];
    selectedCategory: any = null;
    searchTerm: string = '';
    showDialog = false;
    editingItem: any = null;
    menuForm: FormGroup;
    loading = false;
    toast: {
        message: string;
        type: 'success' | 'error';
    } | null = null;
    isEditable: boolean = false;
    createMenuItem: boolean = false;
    readSingleMenuItem: boolean = false;
    deleteMenuItem: boolean = false;
    apiUrl = environment.imageUrl;

    constructor(
        private menuService: MenuService,
        private authService: AuthService,
        private fb: FormBuilder
    ) {
        this.menuForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            basePrice: [0, [Validators.required, Validators.min(0)]],
            categoryId: [0, Validators.required],
            image: [null],
            calories: [0, [Validators.required, Validators.min(0)]],
        });
    }

    ngOnInit() {
        this.isEditable = this.hasPermission('UPDATE_SINGLE_MENU_ITEM');
        this.createMenuItem = this.hasPermission('CREATE_MENU_ITEM');
        this.readSingleMenuItem = this.hasPermission('READ_SINGLE_MENU_ITEM');
        this.deleteMenuItem = this.hasPermission('DELETE_MENU_ITEM')
        this.loadMenuItems();
        this.loadCategories();
    }

    loadMenuItems() {
        this.menuService.getAllMenuItems().subscribe({
            next: (items) => {
                this.menuItems = items;
                this.filteredMenuItems = items;
            },
            error: (error) => this.showToast(error.message, 'error')
        });
    }

    loadCategories() {
        this.menuService.getCategories().subscribe({
            next: (categories) => this.categories = categories,
            error: (error) => this.showToast(error.message, 'error')
        });
    }

    onSearch() {
        this.applyFilters();
    }

    filterByCategory(category: any): void {
        this.selectedCategory = this.selectedCategory === category ? null : category;
        this.applyFilters();
    }
    
    private applyFilters(): void {
        let filtered = [...this.menuItems];
        if (this.selectedCategory) {
            filtered = filtered.filter(item => 
                item.categoryId === this.selectedCategory.id
            );
        }
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(term) ||
                item.description.toLowerCase().includes(term)
            );
        }
        this.filteredMenuItems = filtered;
    }

    openCreateDialog() {
        this.editingItem = null;
        this.menuForm.reset();
        this.showDialog = true;
    }

    openEditDialog(item: any) {
        this.editingItem = item;
        this.menuForm.patchValue({
            name: item.name,
            description: item.description,
            basePrice: item.basePrice,
            categoryId: item.categoryId,
            calories: item.calories
        });
        this.showDialog = true;
    }

    closeDialog() {
        this.showDialog = false;
        this.editingItem = null;
        this.menuForm.reset();
    }

    onSubmit() {
        if (this.menuForm.invalid) return;
        this.loading = true;
        const formData = new FormData();
        const menuItemJson = JSON.stringify({
            name: this.menuForm.get('name')?.value,
            description: this.menuForm.get('description')?.value,
            basePrice: this.menuForm.get('basePrice')?.value,
            categoryId: this.menuForm.get('categoryId')?.value,
            calories: this.menuForm.get('calories')?.value
        });
        formData.append("menuItem", menuItemJson);
        if (this.menuForm.get('image')?.value) {
            formData.append("image", this.menuForm.get('image')?.value);
        }
        for (const pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }
        const request = this.editingItem
            ? this.menuService.updateMenuItem(this.editingItem.id, formData)
            : this.menuService.createMenuItem(formData);
        request.subscribe({
            next: () => {
                this.showToast(
                    `Item ${this.editingItem ? 'updated' : 'created'} successfully`,
                    'success'
                );
                this.loadMenuItems();
                this.closeDialog();
            },
            error: (error) => {
                console.error("API Error:", error);
                this.showToast(error.message, 'error');
            },
            complete: () => (this.loading = false)
        });
    }

    deleteItem(item: any) {
        if (confirm('Are you sure you want to delete this item?')) {
            this.menuService.deleteMenuItem(item.id).subscribe({
                next: () => {
                    this.showToast('Item deleted successfully', 'success');
                    this.loadMenuItems();
                },
                error: (error) => this.showToast(error.message, 'error')
            });
        }
    }

    viewDetails(item: any) {
        console.log('Viewing details for:', item);
        alert(`Details for ${item.name}:\n${item.description}\nPrice: $${item.basePrice}`);
    }

    getCategoryName(categoryId: number): string {
        const category = this.categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Uncategorized';
    }

    private showToast(message: string, type: 'success' | 'error') {
        this.toast = { message, type };
        setTimeout(() => this.toast = null, 3000);
    }

    hasPermission(permission: string): boolean {
        return this.authService.hasPermission(permission);
    }

    onImageSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            this.menuForm.patchValue({ image: file });
        }
    }    
}
