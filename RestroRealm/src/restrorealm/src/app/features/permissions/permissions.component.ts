import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { PermissionService } from '../../core/services/permissions/permission.service';
import { ToasterComponent } from "../../shared/components/toaster/toaster.component";
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FontAwesomeModule, ToasterComponent],
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.css'
})
export class PermissionsComponent {
    viewMode: 'card' | 'list' = 'card';
    permissions: any[] = [];
    editPermission: boolean = false;
    createPermission: boolean = false;
    deleteSinglePermission: boolean = false;
    readSinglePermission: boolean = false;
    toast: {
        message: string;
        type: 'success' | 'error';
    } | null = null;
    searchTerm: string = '';
    filteredPermissions: any[] = [];
    editingPermission: any = null;
    permissionForm: FormGroup;
    showDialog = false;
    loading = false;

    ngOnInit(): void {
        this.editPermission = this.hasPermission('UPDATE_SINGLE_ROLE');
        this.createPermission = this.hasPermission('CREATE_ROLE');
        this.deleteSinglePermission = this.hasPermission('DELETE_SINGLE_ROLE');
        this.readSinglePermission = this.hasPermission('READ_SINGLE_ROLE');
        this.loadPermissions();

    }

    constructor(
        private fb: FormBuilder, 
        private authService: AuthService, 
        private permissionService: PermissionService
    ) {
        const time = new Date();
        this.permissionForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            permissionCode: ['', Validators.required]
        });
    }

    loadPermissions() {
        this.permissionService.getPermissions().subscribe({
            next: (permissions) => {
                this.permissions = permissions;
                this.filteredPermissions = permissions;
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
        let filtered = [...this.permissions];
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(permission =>
                permission.name.toLowerCase().includes(term) 
                 || permission.description.toLowerCase().includes(term)
            );
        }
        this.filteredPermissions = filtered;
    }

    openCreateDialog() {
        this.editingPermission = null;
        this.permissionForm.reset();
        this.showDialog = true;
    }

    viewDetails(permission: any) {
        console.log('Viewing details for:', permission);
        alert(`Details for ${permission.name}:\n${permission.description}\nPrice: $${permission.basePrice}`);
    }

    openEditDialog(permission: any) {
        this.editingPermission = permission;
        this.permissionForm.patchValue({
            name: permission.name,
            description: permission.description,
            permissionCode: permission.permissionCode
        });
        this.showDialog = true;
    }

    deletePermission(permission: any) {
        if (confirm('Are you sure you want to delete this permission?')) {
            this.permissionService.deletePermission(permission.id).subscribe({
                next: () => {
                    this.showToast('Permission deleted successfully', 'success');
                    this.loadPermissions();
                },
                error: (error) => this.showToast(error.message, 'error')
            });
        }
    }

    onSubmit() {
        if (this.permissionForm.invalid) return;

        this.loading = true;
        const permissionData = this.permissionForm.value;

        const request = this.editingPermission
            ? this.permissionService.updatePermission(this.editingPermission.id, permissionData)
            : this.permissionService.createPermission(permissionData);

        request.subscribe({
            next: () => {
                this.showToast(
                    `Permission ${this.editingPermission ? 'updated' : 'created'} successfully`,
                    'success'
                );
                this.loadPermissions();
                this.closeDialog();
            },
            error: (error) => this.showToast(error.message, 'error'),
            complete: () => this.loading = false
        });
    }

    closeDialog() {
        this.showDialog = false;
        this.editingPermission = null;
        this.permissionForm.reset();
    }
}

