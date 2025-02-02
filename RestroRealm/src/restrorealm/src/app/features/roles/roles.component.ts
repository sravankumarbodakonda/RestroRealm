import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToasterComponent } from '../../shared/components/toaster/toaster.component';
import { RoleService } from '../../core/services/role/role.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FontAwesomeModule, ToasterComponent],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css'
})
export class RoleComponent {
    viewMode: 'card' | 'list' = 'card';
    roles: any[] = [];
    editRole: boolean = false;
    createRole: boolean = false;
    deleteSingleRole: boolean = false;
    readSingleRole: boolean = false;
    toast: {
        message: string;
        type: 'success' | 'error';
    } | null = null;
    searchTerm: string = '';
    filteredRoles: any[] = [];
    editingRole: any = null;
    roleForm: FormGroup;
    showDialog = false;
    loading = false;

    ngOnInit(): void {
        this.editRole = this.hasPermission('UPDATE_SINGLE_ROLE');
        this.createRole = this.hasPermission('CREATE_ROLE');
        this.deleteSingleRole = this.hasPermission('DELETE_SINGLE_ROLE');
        this.readSingleRole = this.hasPermission('READ_SINGLE_ROLE');
        this.loadRoles();

    }

    constructor(
        private fb: FormBuilder, 
        private authService: AuthService, 
        private roleService: RoleService
    ) {
        const time = new Date();
        this.roleForm = this.fb.group({
            name: ['', Validators.required],
            description: ['']
        });
    }

    loadRoles() {
        this.roleService.getRoles().subscribe({
            next: (roles) => {
                this.roles = roles;
                this.filteredRoles = roles;
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
        let filtered = [...this.roles];
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(role =>
                role.name.toLowerCase().includes(term) 
                 || role.description.toLowerCase().includes(term)
            );
        }
        this.filteredRoles = filtered;
    }

    openCreateDialog() {
        this.editingRole = null;
        this.roleForm.reset();
        this.showDialog = true;
    }

    viewDetails(role: any) {
        console.log('Viewing details for:', role);
        alert(`Details for ${role.name}:\n${role.description}\nPrice: $${role.basePrice}`);
    }

    openEditDialog(role: any) {
        this.editingRole = role;
        this.roleForm.patchValue({
            name: role.name,
            description: role.description
        });
        this.showDialog = true;
    }

    deleteRole(role: any) {
        if (confirm('Are you sure you want to delete this role?')) {
            this.roleService.deleteRole(role.id).subscribe({
                next: () => {
                    this.showToast('Role deleted successfully', 'success');
                    this.loadRoles();
                },
                error: (error) => this.showToast(error.message, 'error')
            });
        }
    }

    onSubmit() {
        if (this.roleForm.invalid) return;

        this.loading = true;
        const roleData = this.roleForm.value;

        const request = this.editingRole
            ? this.roleService.updateRole(this.editingRole.id, roleData)
            : this.roleService.createRole(roleData);

        request.subscribe({
            next: () => {
                this.showToast(
                    `Role ${this.editingRole ? 'updated' : 'created'} successfully`,
                    'success'
                );
                this.loadRoles();
                this.closeDialog();
            },
            error: (error) => this.showToast(error.message, 'error'),
            complete: () => this.loading = false
        });
    }

    closeDialog() {
        this.showDialog = false;
        this.editingRole = null;
        this.roleForm.reset();
    }
}
