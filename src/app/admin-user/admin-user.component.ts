import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SnackbarService } from 'src/services/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';
import { RedeemService } from 'src/services/redeem.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { adminUserForm } from 'src/services/interface';
import { AdminUserEditModalComponent } from '../admin-user-edit-modal/admin-user-edit-modal.component';
import { AdminUserDeleteModalComponent } from '../admin-user-delete-modal/admin-user-delete-modal.component';

@Component({
  selector: 'app-admin-user',
  templateUrl: './admin-user.component.html',
  styleUrls: ['./admin-user.component.scss'],
})
export class AdminUserComponent implements OnInit, OnDestroy {
  adminUserForm!: FormGroup;
  spinnerTimeout: any;
  viewMode: string = 'create'; // 'create' or 'view'
  
  // Password visibility states
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;
  
  // Organizations list for dropdown
  organizationsList: any[] = [];
  loadingOrganizations: boolean = false;
  
  // Table properties for admin users list
  adminUsersList: any[] = [];
  displayedColumns: string[] = ['username', 'email', 'organization', 'role', 'createdBy', 'creationDateTime', 'action'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  searchFilter: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private redeemService: RedeemService,
    private snackbarService: SnackbarService,
    private spinner: NgxSpinnerService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.fetchOrganizations();
    this.setupFilterPredicate();
    
    // Subscribe to reload events
    this.redeemService.reloadComponent1$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.viewMode === 'view') {
          this.fetchAdminUsers();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
    }
  }

  setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const username = (data.username || '').toLowerCase();
      const email = (data.email || '').toLowerCase();
      const orgName = (data.organizationName || '').toLowerCase();
      const role = (data.role || '').toLowerCase();
      const createdBy = (data.createdBy || '').toLowerCase();
      const filterLower = filter.toLowerCase();
      return username.includes(filterLower) || 
             email.includes(filterLower) || 
             orgName.includes(filterLower) ||
             role.includes(filterLower) ||
             createdBy.includes(filterLower);
    };
  }

  onViewModeChange(mode: string): void {
    this.viewMode = mode;
    if (mode === 'view') {
      this.fetchAdminUsers();
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchFilter = filterValue.trim().toLowerCase();
    this.dataSource.filter = this.searchFilter;
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  fetchAdminUsers(): void {
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
    }
    this.spinnerTimeout = setTimeout(() => {
      this.spinner.show('mainSpinner');
    }, 300);

    this.redeemService
      .getAdminUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
          }
          this.spinner.hide('mainSpinner');

          let adminUsers: any[] = [];
          
          // Handle different response structures
          if (Array.isArray(response)) {
            adminUsers = response;
          } else if (response && Array.isArray(response.data)) {
            adminUsers = response.data;
          } else if (response && Array.isArray(response.admins)) {
            adminUsers = response.admins;
          } else if (response && Array.isArray(response.adminUsers)) {
            adminUsers = response.adminUsers;
          }

          // Map organization IDs to names and format dates
          this.adminUsersList = adminUsers.map((admin: any) => {
            const org = this.organizationsList.find(o => 
              o.id === admin.organizationId || 
              o.id === admin.orgId ||
              o.id === admin.organization?.id
            );
            
            // Handle different date field names - keep the raw value for formatting
            const dateValue = admin.creationDateTime || admin.createdAt || admin.creationDate || admin.date || null;
            
            // Debug: Log the date value to see what we're getting
            if (dateValue) {
              console.log('Date value from API:', dateValue, 'Type:', typeof dateValue);
            }
            
            return {
              ...admin,
              organizationName: org ? org.name : (admin.organization?.name || 'N/A'),
              creationDateTime: dateValue, // Keep raw value, formatDateTime will handle it
            };
          });

          this.dataSource.data = this.adminUsersList;
          
          // Set paginator and sort after data is loaded
          setTimeout(() => {
            if (this.paginator && this.dataSource) {
              this.dataSource.paginator = this.paginator;
            }
            if (this.sort && this.dataSource) {
              this.dataSource.sort = this.sort;
            }
          });
        },
        error: (error: HttpErrorResponse) => {
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
          }
          this.spinner.hide('mainSpinner');

          console.error('Error fetching admin users:', error);
          let errorMessage = '';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          if (error.status === 401) {
            this.snackbarService.openSnackbar(
              'You are not authorized. Please log in again.',
              'failed'
            );
          } else if (error.status === 403) {
            this.snackbarService.openSnackbar(
              'You do not have permission to view admin users.',
              'failed'
            );
          } else {
            const message = errorMessage || 'Failed to load admin users. Please try again.';
            this.snackbarService.openSnackbar(message, 'failed');
          }
        },
      });
  }

  roles = [
    { value: 'ORG_ADMIN', label: 'Admin', icon: 'admin_panel_settings' },
    { value: 'SUPER_ADMIN', label: 'Super Admin', icon: 'supervisor_account' }
  ];
  
  private initializeForm(): void {
    this.adminUserForm = this.fb.group({
      role: ['ORG_ADMIN', [Validators.required]],
      organizationId: ['', []],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
    }, { validators: this.passwordMatchValidator });
    
    // Update confirm password validation when password changes
    this.adminUserForm.get('password')?.valueChanges.subscribe(() => {
      this.adminUserForm.get('confirmPassword')?.updateValueAndValidity();
    });
    
    // Update organization field requirement based on role
    this.adminUserForm.get('role')?.valueChanges.subscribe((role) => {
      const orgControl = this.adminUserForm.get('organizationId');
      if (role === 'ORG_ADMIN') {
        orgControl?.setValidators([Validators.required]);
      } else if (role === 'SUPER_ADMIN') {
        orgControl?.clearValidators();
        orgControl?.setValue('');
        orgControl?.markAsUntouched();
      }
      orgControl?.updateValueAndValidity();
    });
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

  fetchOrganizations(): void {
    this.loadingOrganizations = true;
    
    this.redeemService.getOrganizations().subscribe({
      next: (response: any) => {
        this.loadingOrganizations = false;
        
        // Handle both array and object responses
        if (Array.isArray(response)) {
          this.organizationsList = response.filter(org => org.active !== false);
        } else if (response && Array.isArray(response.data)) {
          this.organizationsList = response.data.filter((org: any) => org.active !== false);
        } else if (response && Array.isArray(response.organizations)) {
          this.organizationsList = response.organizations.filter((org: any) => org.active !== false);
        } else {
          this.organizationsList = [];
        }
        
        // Sort organizations by name
        if (this.organizationsList.length > 0) {
          this.organizationsList.sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loadingOrganizations = false;
        this.snackbarService.openSnackbar(
          'Failed to fetch organizations. Please try again.',
          'failed'
        );
      },
    });
  }

  resetForm(): void {
    this.adminUserForm.reset({
      role: 'ORG_ADMIN',
      organizationId: '',
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
    });
    Object.keys(this.adminUserForm.controls).forEach((key) => {
      const control = this.adminUserForm.get(key);
      if (control) {
        control.setErrors(null);
        control.markAsPristine();
        control.markAsUntouched();
      }
    });
    
    // Reset password visibility
    this.hidePassword = true;
    this.hideConfirmPassword = true;
  }

  onSubmit(): void {
    // Mark all fields as touched to show validation errors
    this.adminUserForm.markAllAsTouched();
    
    // Check if form is valid
    if (!this.adminUserForm.valid) {
      this.snackbarService.openSnackbar(
        'Please fill in all required fields correctly',
        'failed'
      );
      return;
    }
    
    // Validate password match
    if (this.adminUserForm.errors?.['passwordMismatch']) {
      this.snackbarService.openSnackbar('Passwords do not match', 'failed');
      return;
    }
    
    // Prepare form data
    const formData = this.adminUserForm.value;
    const adminUserData: any = {
      username: formData.username.trim(),
      password: formData.password.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
    };
    
    // Only include orgId if role is ORG_ADMIN and organizationId is provided
    if (formData.role === 'ORG_ADMIN') {
      if (!formData.organizationId || formData.organizationId.trim() === '') {
        this.snackbarService.openSnackbar(
          'Organization is required for Admin role.',
          'failed'
        );
        this.adminUserForm.get('organizationId')?.markAsTouched();
        return;
      }
      adminUserData.orgId = formData.organizationId.trim();
    }
    
    // For SUPER_ADMIN, don't include orgId at all
    // (API might not expect it, so we exclude it completely)
    
    // Show spinner with debounce
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
    }
    this.spinnerTimeout = setTimeout(() => {
      this.spinner.show('mainSpinner');
    }, 300);

    // Debug: Log the payload being sent
    console.log('Register payload:', adminUserData);
    
    this.redeemService
      .createAdminUser(adminUserData)
      .subscribe({
        next: (response) => {
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
          }
          this.spinner.hide('mainSpinner');
          
          if (response) {
            this.snackbarService.openSnackbar(
              'Admin user created successfully!',
              'success'
            );
            this.resetForm();
            // Reload admin users list if in view mode
            if (this.viewMode === 'view') {
              this.fetchAdminUsers();
            }
          }
        },
        error: (error: HttpErrorResponse) => {
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
          }
          this.spinner.hide('mainSpinner');
          
          // Debug: Log full error details for 400 errors
          if (error.status === 400) {
            console.error('400 Bad Request Error Details:', error);
            console.error('Request payload was:', adminUserData);
          }
          
          // Extract error message from response if available
          let errorMessage = '';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error && error.error.error) {
            errorMessage = error.error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          if (error.status === 400) {
            // Bad Request - show detailed error message
            const message = errorMessage || 'Invalid data. Please check all fields and try again.';
            this.snackbarService.openSnackbar(message, 'failed');
            
            // If error contains field-specific information, mark those fields
            if (error.error && error.error.errors) {
              const errors = error.error.errors;
              Object.keys(errors).forEach((field) => {
                const formControl = this.adminUserForm.get(field === 'orgId' ? 'organizationId' : field);
                if (formControl) {
                  formControl.setErrors({ serverError: Array.isArray(errors[field]) ? errors[field][0] : errors[field] });
                  formControl.markAsTouched();
                }
              });
            }
          } else if (error.status === 409) {
            // Conflict - username or email already exists
            const message = errorMessage || 'Username or email already exists. Please choose another one.';
            this.snackbarService.openSnackbar(message, 'failed');
            
            // Mark relevant fields as invalid if error message indicates which field
            if (errorMessage.toLowerCase().includes('username')) {
              this.adminUserForm.get('username')?.setErrors({ duplicate: true });
              this.adminUserForm.get('username')?.markAsTouched();
            }
            if (errorMessage.toLowerCase().includes('email')) {
              this.adminUserForm.get('email')?.setErrors({ duplicate: true });
              this.adminUserForm.get('email')?.markAsTouched();
            }
          } else if (error.status === 400) {
            const message = errorMessage || 'Invalid data. Please check all fields and try again.';
            this.snackbarService.openSnackbar(message, 'failed');
          } else if (error.status === 404) {
            const message = errorMessage || 'Organization not found. Please select a valid organization.';
            this.snackbarService.openSnackbar(message, 'failed');
          } else if (error.status === 401) {
            this.snackbarService.openSnackbar(
              'You are not authorized to create admin users. Please log in again.',
              'failed'
            );
          } else if (error.status === 403) {
            this.snackbarService.openSnackbar(
              'You do not have permission to create admin users.',
              'failed'
            );
          } else if (error.status === 0) {
            this.snackbarService.openSnackbar(
              'Network error. Please check your connection and try again.',
              'failed'
            );
          } else {
            const message = errorMessage || 'Admin user creation failed. Please try again.';
            this.snackbarService.openSnackbar(message, 'failed');
          }
        },
      });
  }

  formatDateTime(dateValue: any): string {
    if (!dateValue) {
      return 'N/A';
    }

    try {
      // If it's already a Date object
      if (dateValue instanceof Date) {
        return dateValue.toLocaleString();
      }

      // If it's a number (timestamp)
      if (typeof dateValue === 'number') {
        return new Date(dateValue).toLocaleString();
      }

      // If it's a string, try to parse it
      if (typeof dateValue === 'string') {
        // Try ISO format first
        let date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString();
        }

        // Try format like "21/11/2025 17:35:38"
        const dateTimeMatch = dateValue.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (dateTimeMatch) {
          const [, day, month, year, hour, minute, second] = dateTimeMatch;
          date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
          if (!isNaN(date.getTime())) {
            return date.toLocaleString();
          }
        }

        // Return as is if we can't parse it
        return dateValue;
      }

      return 'N/A';
    } catch (e) {
      console.error('Error formatting date:', dateValue, e);
      return dateValue ? String(dateValue) : 'N/A';
    }
  }

  openEditModal(adminUser: any): void {
    const dialogRef = this.dialog.open(AdminUserEditModalComponent, {
      data: { adminUser: adminUser },
      width: '650px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      panelClass: 'edit-admin-user-dialog',
      autoFocus: false,
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Refresh the admin users list if update was successful
        if (this.viewMode === 'view') {
          this.fetchAdminUsers();
        }
      }
    });
  }

  openDeleteModal(adminUser: any): void {
    const dialogRef = this.dialog.open(AdminUserDeleteModalComponent, {
      data: { adminUser: adminUser },
      width: '500px',
      maxWidth: '90vw',
      panelClass: 'delete-admin-user-dialog',
      autoFocus: false,
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Refresh the admin users list if deletion was successful
        if (this.viewMode === 'view') {
          this.fetchAdminUsers();
        }
      }
    });
  }
}

