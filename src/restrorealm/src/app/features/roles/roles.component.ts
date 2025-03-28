import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { AuthService } from '../../core/services/auth/auth.service';
import { RoleService } from '../../core/services/role/role.service';
import { PermissionService } from '../../core/services/permissions/permission.service';
import { Role } from '../../shared/models/role.model';
import { Permission } from '../../shared/models/permission.model';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css'],
  animations: [
    trigger('toastAnimation', [
      state('show', style({
        transform: 'translateY(0)',
        opacity: 1
      })),
      state('hide', style({
        transform: 'translateY(100px)',
        opacity: 0
      })),
      transition('hide => show', [
        animate('0.5s cubic-bezier(0.34, 1.56, 0.64, 1)')
      ]),
      transition('show => hide', [
        animate('0.3s ease-out')
      ])
    ]),
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.6s ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0.4s ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideInAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(40px) scale(0.95)', opacity: 0 }),
        animate('0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', 
          style({ transform: 'translateY(0) scale(1)', opacity: 1 }))
      ])
    ]),
    trigger('dialogAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(60px) scale(0.8)', opacity: 0 }),
        animate('0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', 
          style({ transform: 'translateY(0) scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0.3s ease-in', 
          style({ transform: 'translateY(60px) scale(0.8)', opacity: 0 }))
      ])
    ])
  ]
})
export class RoleComponent implements OnInit {
    viewMode: 'card' | 'list' = 'card';
    roles: Role[] = [];
    editRole: boolean = false;
    createRole: boolean = false;
    deleteSingleRole: boolean = false;
    readSingleRole: boolean = false;
    readAllRoles: boolean = false;
    
    toast: {
        message: string;
        type: 'success' | 'error';
    } | null = null;
    
    searchTerm: string = '';
    filteredRoles: Role[] = [];
    
    // Filter properties
    showFilters: boolean = false;
    filterStatus: string = 'all';
    filterPermissionCount: string = 'all';
    filterCreatedBy: string = 'all';
    filterBySpecificPermissions: string[] = [];
    sortBy: string = 'name';
    sortDirection: 'asc' | 'desc' = 'asc';
    filterCondition: 'any' | 'all' = 'any';
    availableStatuses: string[] = ['active', 'inactive', 'archived', 'draft'];
    filterPermissionOptions: {value: string, label: string}[] = [
        {value: 'all', label: 'All Permissions'},
        {value: 'none', label: 'No Permissions'},
        {value: 'few', label: '1-5 Permissions'},
        {value: 'many', label: '6+ Permissions'}
    ];
    
    editingRole: any = null;
    viewingRole: any = null;
    roleForm: FormGroup;
    showDialog = false;
    showViewDialog = false;
    loading = false;
    
    permissions: Permission[] = [];
    toastAnimationState: 'show' | 'hide' = 'show';

    constructor(
        private fb: FormBuilder, 
        private authService: AuthService, 
        private roleService: RoleService,
        private permissionService: PermissionService
    ) {
        this.roleForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            permissions: [[]]
        });
    }

    ngOnInit(): void {
        // Check permissions
        this.editRole = this.hasPermission('UPDATE_SINGLE_ROLE');
        this.createRole = this.hasPermission('CREATE_ROLE');
        this.deleteSingleRole = this.hasPermission('DELETE_SINGLE_ROLE');
        this.readSingleRole = this.hasPermission('READ_SINGLE_ROLE');
        this.readAllRoles = this.hasPermission('READ_ALL_ROLES');
        
        // Load data if user has permission to view roles
        if (this.readAllRoles) {
            this.loadRoles();
            this.loadPermissions();
        } else {
            this.showToast('You do not have permission to view roles', 'error');
        }
    }

    loadRoles() {
        this.loading = true;
        this.roleService.getRoles().subscribe({
            next: (roles) => {
                this.roles = roles;
                this.filteredRoles = roles;
                this.loading = false;
            },
            error: (error) => {
                this.showToast(error.message || 'Failed to load roles', 'error');
                this.loading = false;
            }
        });
    }

    loadPermissions() {
        this.permissionService.getPermissions().subscribe({
            next: (permissions) => {
                this.permissions = permissions;
            },
            error: (error) => this.showToast(error.message || 'Failed to load permissions', 'error')
        });
    }

    onSearch() {
        this.applyFilters();
    }
    
    toggleFilters() {
        this.showFilters = !this.showFilters;
    }
    
    resetFilters() {
        this.filterStatus = 'all';
        this.filterPermissionCount = 'all';
        this.filterCreatedBy = 'all';
        this.filterBySpecificPermissions = [];
        this.filterCondition = 'any';
        this.sortBy = 'name';
        this.sortDirection = 'asc';
        this.searchTerm = '';
        this.applyFilters();
    }
    
    applySorting(field: string) {
        if (this.sortBy === field) {
            // Toggle direction if clicking the same field
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = field;
            this.sortDirection = 'asc';
        }
        this.applyFilters();
    }
    
    applyFilters(): void {
        let filtered = [...this.roles];
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(role =>
                role.name?.toLowerCase().includes(term) || 
                role.description?.toLowerCase().includes(term)
            );
        }
        if (this.filterStatus !== 'all') {
            filtered = filtered.filter(role => role.status === this.filterStatus);
        }
        if (this.filterPermissionCount !== 'all') {
            filtered = filtered.filter(role => {
                const count = role.permissions?.length || 0;
                switch (this.filterPermissionCount) {
                    case 'none': return count === 0;
                    case 'few': return count >= 1 && count <= 5;
                    case 'many': return count >= 6;
                    default: return true;
                }
            });
        }
        
        if (this.filterBySpecificPermissions.length > 0) {
            filtered = filtered.filter(role => {
                if (!role.permissions?.length) return false;
                
                if (this.filterCondition === 'all') {
                    return this.filterBySpecificPermissions.every(permId => 
                        role.permissions.some(p => p.id.toString() == permId || p.permissionCode == permId)
                    );
                } else {
                    return this.filterBySpecificPermissions.some(permId => 
                        role.permissions.some(p => p.id.toString() == permId || p.permissionCode == permId)
                    );
                }
            });
        }
        
        if (this.filterCreatedBy !== 'all') {
            filtered = filtered.filter(role => role.createdBy === this.filterCreatedBy);
        }
        
        filtered.sort((a, b) => {
            let comparison = 0;
            
            switch (this.sortBy) {
                case 'name':
                    comparison = (a.name || '').localeCompare(b.name || '');
                    break;
                case 'permissions':
                    comparison = (a.permissions?.length || 0) - (b.permissions?.length || 0);
                    break;
                case 'date':
                    comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
                    break;
                default:
                    comparison = 0;
            }
            
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });
        
        this.filteredRoles = filtered;
    }

    // Permission management
    onPermissionChange(permission: any, event: Event) {
        const isChecked = (event.target as HTMLInputElement).checked;
        let updatedPermissions = [...(this.roleForm.value.permissions || [])];
        
        if (isChecked) {
            if (!updatedPermissions.some((p: any) => p.id === permission.id)) {
                updatedPermissions.push(permission);
            }
        } else {
            updatedPermissions = updatedPermissions.filter((p: any) => p.id !== permission.id);
        }
        
        this.roleForm.patchValue({ permissions: updatedPermissions });
    }
    
    isPermissionChecked(permission: any): boolean {
        const selectedPermissions = this.roleForm.value.permissions || [];
        return selectedPermissions.some((p: any) => p.id === permission.id);
    }

    areAllPermissionsSelected(): boolean {
        const selectedPermissions = this.roleForm.value.permissions || [];
        return this.permissions.length > 0 && selectedPermissions.length === this.permissions.length;
    }

    toggleAllPermissions(event: Event): void {
        const isChecked = (event.target as HTMLInputElement).checked;
        
        if (isChecked) {
            // Select all permissions
            this.roleForm.patchValue({ permissions: [...this.permissions] });
        } else {
            // Deselect all permissions
            this.roleForm.patchValue({ permissions: [] });
        }
    }
    
    clearPermissionFilter(): void {
        this.filterBySpecificPermissions = [];
        this.applyFilters();
    }
    
    togglePermissionFilter(permissionId: any): void {
        const index = this.filterBySpecificPermissions.indexOf(permissionId);
        if (index > -1) {
            // Remove permission if already selected
            this.filterBySpecificPermissions.splice(index, 1);
        } else {
            // Add permission if not selected
            this.filterBySpecificPermissions.push(permissionId);
        }
        this.applyFilters();
    }
    
    isPermissionSelected(permissionId: any): boolean {
        return this.filterBySpecificPermissions.includes(permissionId);
    }
    
    getPermissionName(permissionId: any): string {
        const permission = this.permissions.find(p => p.id.toString() === permissionId);
        return permission ? permission.name : 'Unknown Permission';
    }

    // Dialog management
    openCreateDialog() {
        this.editingRole = null;
        this.roleForm.reset({
            name: '',
            description: '',
            permissions: []
        });
        this.showDialog = true;
    }

    openEditDialog(role: any) {
        this.editingRole = role;
        const rolePermissions = role.permissions ? role.permissions.map((p: any) => ({
            id: p.id,
            name: p.name,
            permissionCode: p.permissionCode,
            description: p.description
        })) : [];
        
        this.roleForm.patchValue({
            name: role.name,
            description: role.description,
            permissions: rolePermissions
        });
        
        this.showDialog = true;
    }

    openViewDialog(role: any) {
        this.viewingRole = role;
        this.showViewDialog = true;
    }

    closeViewDialog() {
        this.showViewDialog = false;
        this.viewingRole = null;
    }
    
    editFromViewDialog(viewingRole:any) {
        this.closeViewDialog();
        this.openEditDialog(viewingRole);
    }

    deleteRole(role: any) {
        if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
            this.loading = true;
            this.roleService.deleteRole(role.id).subscribe({
                next: () => {
                    this.showToast('Role deleted successfully', 'success');
                    this.loadRoles();
                },
                error: (error) => this.showToast(error.message || 'Failed to delete role', 'error'),
                complete: () => this.loading = false
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
            error: (error) => this.showToast(error.message || 'Failed to save role', 'error'),
            complete: () => this.loading = false
        });
    }

    closeDialog() {
        this.showDialog = false;
        this.editingRole = null;
        this.roleForm.reset({
            name: '',
            description: '',
            permissions: []
        });
    }

    private showToast(message: string, type: 'success' | 'error') {
        this.toast = { message, type };
        this.toastAnimationState = 'show';
        
        // Handle animated exit
        setTimeout(() => {
            this.toastAnimationState = 'hide';
            setTimeout(() => {
                this.toast = null;
            }, 300); // Duration of the hide animation
        }, 4000);
    }

    hasPermission(permission: string): boolean {
        return this.authService.hasPermission(permission);
    }
}
