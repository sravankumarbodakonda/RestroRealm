import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToasterComponent } from "../../shared/components/toaster/toaster.component";
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TableService } from '../../core/services/table/table.service';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, ToasterComponent, FontAwesomeModule, FormsModule, ReactiveFormsModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent {
    viewMode: 'card' | 'list' = 'card';
    tables: any[] = [];
    toast: { message: string; type: 'success' | 'error' } | null = null;
    searchTerm: string = '';
    filteredTables: any[] = [];
    editingTable: any = null;
    tableForm: FormGroup;
    showDialog = false;
    loading = false;
    createTable: boolean = false;
    viewAllTables: boolean = false;
    editTable: boolean = false;
    isDeleteTable: boolean = false;

    ngOnInit(): void {
        this.loadTables();
    }

    constructor(
        private fb: FormBuilder,
        private tableService: TableService,
        private authService: AuthService
    ) {
        this.createTable = this.hasPermission("CREATE_TABLE");
        this.editTable = this.hasPermission("UPDATE_SINGLE_TABLE");
        this.isDeleteTable = this.hasPermission("DELETE_SINGLE_TABLE");
        this.viewAllTables = this.hasPermission("READ_ALL_TABLES");
        this.tableForm = this.fb.group({
            tableNumber: ['', Validators.required],
            capacity: ['', [Validators.required, Validators.min(1)]],
            reservable: [true],
            metadata: ['']
        });
    }

    loadTables() {
        this.tableService.getTables().subscribe({
            next: (tables) => {
                this.tables = tables;
                this.filteredTables = tables;
            },
            error: (error) => this.showToast(error.message, 'error')
        });
    }

    private showToast(message: string, type: 'success' | 'error') {
        this.toast = { message, type };
        setTimeout(() => this.toast = null, 3000);
    }

    onSearch() {
        this.applyFilters();
    }
    
    private applyFilters(): void {
        let filtered = [...this.tables];
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(table =>
                table.tableNumber.toLowerCase().includes(term) ||
                table.metadata.toLowerCase().includes(term)
            );
        }
        this.filteredTables = filtered;
    }

    openCreateDialog() {
        this.editingTable = null;
        this.tableForm.reset({ reservable: true });
        this.showDialog = true;
    }

    openEditDialog(table: any) {
        this.editingTable = table;
        this.tableForm.patchValue({
            tableNumber: table.tableNumber,
            capacity: table.capacity,
            reservable: table.reservable,
            metadata: table.metadata
        });
        this.showDialog = true;
    }

    deleteTable(table: any) {
        if (confirm('Are you sure you want to delete this table?')) {
            this.tableService.deleteTable(table.id).subscribe({
                next: () => {
                    this.showToast('Table deleted successfully', 'success');
                    this.loadTables();
                },
                error: (error) => this.showToast(error.message, 'error')
            });
        }
    }

    onSubmit() {
        if (this.tableForm.invalid) return;

        this.loading = true;
        const tableData = this.tableForm.value;

        const request = this.editingTable
            ? this.tableService.updateTable(this.editingTable.id, tableData)
            : this.tableService.createTable(tableData);

        request.subscribe({
            next: () => {
                this.showToast(
                    `Table ${this.editingTable ? 'updated' : 'created'} successfully`,
                    'success'
                );
                this.loadTables();
                this.closeDialog();
            },
            error: (error) => this.showToast(error.message, 'error'),
            complete: () => this.loading = false
        });
    }

    closeDialog() {
        this.showDialog = false;
        this.editingTable = null;
        this.tableForm.reset({ reservable: true });
    }

    hasPermission(permission: string): boolean {
        return this.authService.hasPermission(permission);
    }
}
