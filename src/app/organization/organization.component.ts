import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SnackbarService } from 'src/services/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';
import { RedeemService } from 'src/services/redeem.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { OrganizationEditModalComponent } from '../organization-edit-modal/organization-edit-modal.component';
import { OrganizationDeleteModalComponent } from '../organization-delete-modal/organization-delete-modal.component';

@Component({
  selector: 'app-organization',
  templateUrl: './organization.component.html',
  styleUrls: ['./organization.component.scss'],
})
export class OrganizationComponent implements OnInit {
  organizationForm: any = FormGroup;
  spinnerTimeout: any;
  viewMode: string = 'create'; // 'create' or 'view'
  
  // Password visibility states
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;
  
  // Table properties
  organizationsList: any[] = [];
  displayedColumns: string[] = ['name', 'username', 'active', 'createdBy', 'action'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private redeemService: RedeemService,
    private snackbarService: SnackbarService,
    private spinner: NgxSpinnerService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.organizationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      active: [true, Validators.required],
    }, { validators: this.passwordMatchValidator });
    
    // Update confirm password validation when password changes
    this.organizationForm.get('password')?.valueChanges.subscribe(() => {
      this.organizationForm.get('confirmPassword')?.updateValueAndValidity();
    });
    
    // Setup filter predicate for table
    this.setupFilterPredicate();
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');
    
    if (password && confirmPassword) {
      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        // Clear passwordMismatch error if passwords match
        if (confirmPassword.hasError('passwordMismatch')) {
          const errors = { ...confirmPassword.errors };
          delete errors['passwordMismatch'];
          confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
        return null;
      }
    }
    return null;
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword') {
    if (field === 'password') {
      this.hidePassword = !this.hidePassword;
    } else {
      this.hideConfirmPassword = !this.hideConfirmPassword;
    }
  }
  
  setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const name = (data.name || '').toLowerCase();
      const username = (data.username || '').toLowerCase();
      const filterLower = filter.toLowerCase();
      return name.includes(filterLower) || username.includes(filterLower);
    };
  }
  
  onViewModeChange(mode: string) {
    this.viewMode = mode;
    if (mode === 'view') {
      this.fetchOrganizations();
    }
  }
  
  fetchOrganizations() {
    // Clear any existing timeout
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
    }
    
    // Show spinner only if loading takes more than 300ms
    this.spinnerTimeout = setTimeout(() => {
      this.spinner.show('mainSpinner');
    }, 300);
    
    this.redeemService.getOrganizations().subscribe({
      next: (response: any) => {
        // Clear the timeout and hide spinner
        if (this.spinnerTimeout) {
          clearTimeout(this.spinnerTimeout);
          this.spinnerTimeout = null;
        }
        this.spinner.hide('mainSpinner');
        
        console.log('API Response:', response); // Debug log
        
        // Handle both array and object responses
        if (Array.isArray(response)) {
          this.organizationsList = response;
        } else if (response && Array.isArray(response.data)) {
          this.organizationsList = response.data;
        } else if (response && Array.isArray(response.organizations)) {
          this.organizationsList = response.organizations;
        } else {
          this.organizationsList = [];
        }
        
        console.log('Organizations List:', this.organizationsList); // Debug log
        
        // Sort by ID (newest first) - using ID as it's usually sorted by creation
        if (this.organizationsList.length > 0) {
          // Sort by ID in descending order (assuming newer IDs are larger)
          this.organizationsList.sort((a, b) => {
            if (a.id && b.id) {
              return a.id.localeCompare(b.id) * -1;
            }
            return 0;
          });
        }
        
        // Update dataSource data directly (more reliable than creating new instance)
        this.dataSource.data = this.organizationsList;
        
        // Re-apply filter predicate after updating data
        this.setupFilterPredicate();
        
        // Set paginator and sort after view init
        setTimeout(() => {
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          if (this.sort) {
            this.dataSource.sort = this.sort;
          }
        }, 0);
        
        console.log('DataSource data:', this.dataSource.data); // Debug log
        console.log('DataSource length:', this.dataSource.data.length); // Debug log
      },
      error: (error: HttpErrorResponse) => {
        // Clear the timeout and hide spinner on error
        if (this.spinnerTimeout) {
          clearTimeout(this.spinnerTimeout);
          this.spinnerTimeout = null;
        }
        this.spinner.hide('mainSpinner');
        this.snackbarService.openSnackbar(
          'Failed to fetch organizations. Please try again.',
          'failed'
        );
      },
    });
  }
  
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    
    // Reset paginator to first page when filtering
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  resetForm() {
    this.organizationForm.reset({
      name: '',
      username: '',
      password: '',
      confirmPassword: '',
      active: true,
    });
    Object.keys(this.organizationForm.controls).forEach((key) => {
      this.organizationForm.get(key).setErrors(null);
      this.organizationForm.get(key).markAsPristine();
      this.organizationForm.get(key).markAsUntouched();
    });
  }

  onSubmit() {
    // Mark all fields as touched to show validation errors
    this.organizationForm.markAllAsTouched();
    
    // Check if form is valid
    if (!this.organizationForm.valid) {
      this.snackbarService.openSnackbar(
        'Please fill in all required fields correctly',
        'failed'
      );
      return;
    }
    
    // Submit form
    const formData = this.organizationForm.value;
    const organizationData = {
      name: formData.name.trim(),
      username: formData.username.trim(),
      password: formData.password.trim(),
      active: formData.active,
    };
    
    // Debounced spinner to avoid flicker on very fast responses
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
    }
    this.spinnerTimeout = setTimeout(() => {
      this.spinner.show('mainSpinner');
    }, 300);

    this.redeemService
      .createOrganization(organizationData)
      .subscribe({
        next: (response) => {
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
          }
          this.spinner.hide('mainSpinner');
          if (response) {
            this.snackbarService.openSnackbar(
              'Organization created successfully!',
              'success'
            );
            this.resetForm();
            // If in view mode, refresh the list
            if (this.viewMode === 'view') {
              this.fetchOrganizations();
            }
          }
        },
        error: (error: HttpErrorResponse) => {
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
          }
          this.spinner.hide('mainSpinner');
          
          if (error.status === 409) {
            this.snackbarService.openSnackbar(
              'Organization name or username already exists. Please choose another one.',
              'failed'
            );
          } else if (error.status === 400) {
            this.snackbarService.openSnackbar(
              'Invalid data. Please check all fields and try again.',
              'failed'
            );
          } else {
            this.snackbarService.openSnackbar(
              'Organization creation failed. Please try again.',
              'failed'
            );
          }
        },
      });
  }

  openEditModal(organization: any) {
    const dialogRef = this.dialog.open(OrganizationEditModalComponent, {
      data: { organization: organization },
      width: '650px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      panelClass: 'edit-organization-dialog',
      autoFocus: false,
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Refresh the organizations list if update was successful
        this.fetchOrganizations();
      }
    });
  }

  openDeleteModal(organization: any) {
    const dialogRef = this.dialog.open(OrganizationDeleteModalComponent, {
      data: { organization: organization },
      width: '500px',
      maxWidth: '90vw',
      panelClass: 'delete-organization-dialog',
      autoFocus: false,
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Refresh the organizations list if deletion was successful
        this.fetchOrganizations();
      }
    });
  }

  toggleOrganizationStatus(organization: any, newStatus: boolean) {
    // Prevent multiple simultaneous updates
    if (organization.updatingStatus) {
      return;
    }

    // Store original status in case of error
    const originalStatus = organization.active;
    
    // Optimistically update UI
    organization.active = newStatus;
    organization.updatingStatus = true;

    // Prepare update data (only status change)
    const updateData: any = {
      name: organization.name,
      username: organization.username,
      active: newStatus,
      // Don't include password for status-only updates
    };

    this.redeemService
      .updateOrganization(organization.id, updateData)
      .subscribe({
        next: (response) => {
          organization.updatingStatus = false;
          this.snackbarService.openSnackbar(
            `Organization ${newStatus ? 'activated' : 'deactivated'} successfully!`,
            'success'
          );
          
          // Update the organization in the list with response data if available
          if (response) {
            const index = this.organizationsList.findIndex(org => org.id === organization.id);
            if (index !== -1 && response.active !== undefined) {
              this.organizationsList[index].active = response.active;
              this.dataSource.data = [...this.organizationsList];
            }
          }
        },
        error: (error: HttpErrorResponse) => {
          // Revert to original status on error
          organization.active = originalStatus;
          organization.updatingStatus = false;
          
          // Update dataSource to reflect reverted status
          this.dataSource.data = [...this.organizationsList];
          
          if (error.status === 403) {
            this.snackbarService.openSnackbar(
              'You do not have permission to update organization status.',
              'failed'
            );
          } else if (error.status === 404) {
            this.snackbarService.openSnackbar(
              'Organization not found. It may have been deleted.',
              'failed'
            );
            // Refresh list in case organization was deleted
            this.fetchOrganizations();
          } else {
            this.snackbarService.openSnackbar(
              'Failed to update organization status. Please try again.',
              'failed'
            );
          }
        },
      });
  }
}

