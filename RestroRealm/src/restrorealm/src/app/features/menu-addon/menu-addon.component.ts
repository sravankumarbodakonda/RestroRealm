import { Component, OnInit } from '@angular/core';
import { ToasterComponent } from "../../shared/components/toaster/toaster.component";
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MenuAddonService } from '../../core/services/menu/add-on/menu-addon.service';

@Component({
  selector: 'app-menu-addon',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FontAwesomeModule, ToasterComponent],
  templateUrl: './menu-addon.component.html',
  styleUrl: './menu-addon.component.css'
})
export class MenuAddonComponent implements OnInit {
    viewMode: 'card' | 'list' = 'card';
    menuAddons: any[] = [];
    editMenuAddon: boolean = false;
    createMenuAddon: boolean = false;
    deleteSingleMenuAddon: boolean = false;
    readSingleMenuAddon: boolean = false;
    toast: {
        message: string;
        type: 'success' | 'error';
    } | null = null;
    searchTerm: string = '';
    filteredMenuAddons: any[] = [];
    editingMenuAddon: any = null;
    menuAddonForm: FormGroup;
    showDialog = false;
    loading = false;

    ngOnInit(): void {
        this.editMenuAddon = this.hasPermission('UPDATE_SINGLE_MENU_ADD_ON');
        this.createMenuAddon = this.hasPermission('CREATE_MENU_ADD_ON');
        this.deleteSingleMenuAddon = this.hasPermission('DELETE_SINGLE_MENU_ADD_ON');
        this.readSingleMenuAddon = this.hasPermission('READ_SINGLE_MENU_ADD_ON');
        this.loadMenuAddons();

    }

    constructor(
        private fb: FormBuilder, 
        private authService: AuthService, 
        private menuAddonService: MenuAddonService
    ) {
        const time = new Date();
        this.menuAddonForm = this.fb.group({
            addOnName: ['', Validators.required],
            description: [''],
            addOnPrice: [0, Validators.required],
            isSuggested: [false],
        });
    }

    loadMenuAddons() {
        this.menuAddonService.getMenuAddons().subscribe({
            next: (menuAddons) => {
                this.menuAddons = menuAddons;
                this.filteredMenuAddons = menuAddons;
            },
            error: (error) => this.showToast(error.message, 'error')
        });
    }

    private showToast(message: string, type: 'success' | 'error') {
        this.toast = { message, type };
        setTimeout(() => this.toast = null, 3000);
    }

    hasPermission(permission: string): boolean {
        return this.authService.hasPermission(permission);
    }

    onSearch() {
        this.applyFilters();
    }
    
    private applyFilters(): void {
        let filtered = [...this.menuAddons];
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(menuAddon =>
                menuAddon.name.toLowerCase().includes(term) 
                 || menuAddon.description.toLowerCase().includes(term)
            );
        }
        this.filteredMenuAddons = filtered;
    }

    openCreateDialog() {
        this.editingMenuAddon = null;
        this.menuAddonForm.reset();
        this.showDialog = true;
    }

    viewDetails(menuAddon: any) {
        console.log('Viewing details for:', menuAddon);
        alert(`Details for ${menuAddon.name}:\n${menuAddon.description}\nPrice: $${menuAddon.basePrice}`);
    }

    openEditDialog(menuAddon: any) {
        this.editingMenuAddon = menuAddon;
        this.menuAddonForm.patchValue({
            addOnName: menuAddon.addOnName,
            addOnPrice: menuAddon.addOnPrice,
            isSuggested: menuAddon.isSuggested,
            description: menuAddon.description
        });
        this.showDialog = true;
    }

    deleteMenuAddon(menuAddon: any) {
        if (confirm('Are you sure you want to delete this Menu Addon?')) {
            this.menuAddonService.deleteMenuAddon(menuAddon.id).subscribe({
                next: () => {
                    this.showToast('Menu Addon deleted successfully', 'success');
                    this.loadMenuAddons();
                },
                error: (error) => this.showToast(error.message, 'error')
            });
        }
    }

    onSubmit() {
        if (this.menuAddonForm.invalid) return;

        this.loading = true;
        const menuAddonData = this.menuAddonForm.value;

        const request = this.editingMenuAddon
            ? this.menuAddonService.updateMenuAddon(this.editingMenuAddon.id, menuAddonData)
            : this.menuAddonService.createMenuAddon(menuAddonData);

        request.subscribe({
            next: () => {
                this.showToast(
                    `Menu Addon ${this.editingMenuAddon ? 'updated' : 'created'} successfully`,
                    'success'
                );
                this.loadMenuAddons();
                this.closeDialog();
            },
            error: (error) => this.showToast(error.message, 'error'),
            complete: () => this.loading = false
        });
    }

    closeDialog() {
        this.showDialog = false;
        this.editingMenuAddon = null;
        this.menuAddonForm.reset();
    }
}
