import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { PermissionService } from '../../core/services/permissions/permission.service';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.css'
})
export class PermissionsComponent implements OnInit {
    viewMode: 'card' | 'list' = 'card';
    permissions: any[] = [];
    editPermission: boolean = false;
    createPermission: boolean = false;
    deleteSinglePermission: boolean = false;
    readSinglePermission: boolean = false;
    readAllPermissions: boolean = false;
    
    toast: {
        message: string;
        type: 'success' | 'error';
    } | null = null;
    
    searchTerm: string = '';
    filteredPermissions: any[] = [];
    editingPermission: any = null;
    viewingPermission: any = null;
    permissionForm: FormGroup;
    showDialog = false;
    showViewDialog = false;
    loading = false;

    // Filter variables
    showFilters: boolean = false;
    filterType: string = 'all';
    filterScope: string = 'all';
    sortBy: string = 'name';
    sortDirection: 'asc' | 'desc' = 'asc';
    activeFiltersCount: number = 0;

    ngOnInit(): void {
        this.editPermission = this.hasPermission('UPDATE_SINGLE_ROLE');
        this.createPermission = this.hasPermission('CREATE_ROLE');
        this.deleteSinglePermission = this.hasPermission('DELETE_SINGLE_ROLE');
        this.readSinglePermission = this.hasPermission('READ_SINGLE_ROLE');
        this.readAllPermissions = this.hasPermission('READ_ALL_PERMISSIONS');
        this.loadPermissions();
    }

    constructor(
        private fb: FormBuilder, 
        private authService: AuthService, 
        private permissionService: PermissionService
    ) {
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
                this.applyFilters();
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
    
    applyFilters(): void {
        // Start with all permissions
        let filtered = [...this.permissions];
        this.activeFiltersCount = 0;
        
        // Apply search filter
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(permission =>
                permission.name.toLowerCase().includes(term) ||
                permission.description?.toLowerCase().includes(term) ||
                permission.permissionCode?.toLowerCase().includes(term)
            );
        }
        
        // Apply type filter
        if (this.filterType !== 'all') {
            filtered = filtered.filter(permission => 
                permission.permissionCode.includes(this.filterType)
            );
            this.activeFiltersCount++;
        }
        
        // Apply scope filter
        if (this.filterScope !== 'all') {
            filtered = filtered.filter(permission => {
                const parts = permission.permissionCode.split('_');
                return parts.includes(this.filterScope);
            });
            this.activeFiltersCount++;
        }
        
        // Apply sorting
        filtered = this.sortPermissions(filtered, this.sortBy, this.sortDirection);
        
        this.filteredPermissions = filtered;
    }
    
    sortPermissions(permissions: any[], sortBy: string, direction: 'asc' | 'desc'): any[] {
        return [...permissions].sort((a, b) => {
            let valueA, valueB;
            
            // Extract the values to compare based on sortBy
            if (sortBy === 'name') {
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
            } else if (sortBy === 'createdAt') {
                valueA = new Date(a.createdAt || 0).getTime();
                valueB = new Date(b.createdAt || 0).getTime();
            } else if (sortBy === 'updatedAt') {
                valueA = new Date(a.updatedAt || 0).getTime();
                valueB = new Date(b.updatedAt || 0).getTime();
            } else {
                valueA = a[sortBy];
                valueB = b[sortBy];
            }
            
            // Determine sort direction
            if (direction === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
    }
    
    setSorting(sortBy: string): void {
        if (this.sortBy === sortBy) {
            // Toggle direction if clicking the same sort option
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // Set new sort option with default ascending direction
            this.sortBy = sortBy;
            this.sortDirection = 'asc';
        }
        this.applyFilters();
    }
    
    toggleFilters(): void {
        this.showFilters = !this.showFilters;
    }
    
    resetFilters(): void {
        this.filterType = 'all';
        this.filterScope = 'all';
        this.sortBy = 'name';
        this.sortDirection = 'asc';
        this.applyFilters();
    }
    
    clearTypeFilter(): void {
        this.filterType = 'all';
        this.applyFilters();
    }
    
    clearScopeFilter(): void {
        this.filterScope = 'all';
        this.applyFilters();
    }
    
    getPermissionTypeAndScope(permissionCode: string): string {
        if (!permissionCode) return '';
        
        const parts = permissionCode.split('_');
        if (parts.length < 2) return permissionCode;
        
        const type = parts[0];
        const scope = parts.includes('SINGLE') ? 'SINGLE' : parts.includes('ALL') ? 'ALL' : '';
        
        return `${type}${scope ? ' - ' + scope : ''}`;
    }

    openCreateDialog() {
        this.editingPermission = null;
        this.permissionForm.reset();
        this.showDialog = true;
    }

    viewDetails(permission: any) {
        this.viewingPermission = permission;
        this.showViewDialog = true;
    }
    
    closeViewDialog() {
        this.showViewDialog = false;
        this.viewingPermission = null;
    }
    
    viewToEdit() {
        this.openEditDialog(this.viewingPermission);
        this.closeViewDialog();
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
