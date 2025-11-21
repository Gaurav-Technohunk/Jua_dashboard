import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RedeemService } from 'src/services/redeem.service';
import { SnackbarService } from 'src/services/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-admin-user-edit-modal',
  templateUrl: './admin-user-edit-modal.component.html',
  styleUrls: ['./admin-user-edit-modal.component.scss'],
})
export class AdminUserEditModalComponent implements OnInit, OnDestroy {
  adminUserForm!: FormGroup;
  
  // Password visibility states
  hidePassword: boolean = true;
  
  // Organizations list for dropdown
  organizationsList: any[] = [];
  loadingOrganizations: boolean = false;
  
  // Roles
  roles = [
    { value: 'ORG_ADMIN', label: 'Admin', icon: 'admin_panel_settings' },
    { value: 'SUPER_ADMIN', label: 'Super Admin', icon: 'supervisor_account' }
  ];
  
  private destroy$ = new Subject<void>();
  spinnerTimeout: any = null;

  constructor(
    private fb: FormBuilder,
    private redeemService: RedeemService,
    private snackbarService: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AdminUserEditModalComponent>
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.fetchOrganizations();
    
    // Populate form with existing admin user data
    if (this.data.adminUser) {
      const admin = this.data.adminUser;
      this.adminUserForm.patchValue({
        email: admin.email || '',
        role: admin.role || 'ORG_ADMIN',
        organizationId: admin.orgId || admin.organizationId || '',
        password: '', // Don't populate password for security
      });
      
      // Update organization field requirement based on role
      this.updateOrganizationValidation();
    }
    
    // Update organization field requirement when role changes
    this.adminUserForm.get('role')?.valueChanges.subscribe(() => {
      this.updateOrganizationValidation();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
    }
  }

  private initializeForm(): void {
    this.adminUserForm = this.fb.group({
      role: ['ORG_ADMIN', [Validators.required]],
      organizationId: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(8)]], // Optional, min 8 if provided
    });
  }

  private updateOrganizationValidation(): void {
    const roleControl = this.adminUserForm.get('role');
    const orgControl = this.adminUserForm.get('organizationId');
    
    if (roleControl?.value === 'ORG_ADMIN') {
      orgControl?.setValidators([Validators.required]);
    } else {
      orgControl?.clearValidators();
      orgControl?.setValue('');
      orgControl?.markAsUntouched();
    }
    orgControl?.updateValueAndValidity();
  }

  fetchOrganizations(): void {
    this.loadingOrganizations = true;
    
    this.redeemService
      .getOrganizations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.loadingOrganizations = false;
          
          // Handle both array and object responses
          if (Array.isArray(response)) {
            this.organizationsList = response.filter((org: any) => org.active !== false);
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
          console.error('Error fetching organizations:', error);
        },
      });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(): void {
    // Mark all fields as touched to show validation errors
    this.adminUserForm.markAllAsTouched();
    
    // Check if form is valid
    if (!this.adminUserForm.valid) {
      this.snackbarService.openSnackbar(
        'Please fill in all required fields correctly.',
        'failed'
      );
      return;
    }
    
    // Validate organization is selected for ORG_ADMIN
    const formData = this.adminUserForm.value;
    if (formData.role === 'ORG_ADMIN' && (!formData.organizationId || formData.organizationId.trim() === '')) {
      this.snackbarService.openSnackbar(
        'Organization is required for Admin role.',
        'failed'
      );
      this.adminUserForm.get('organizationId')?.markAsTouched();
      return;
    }
    
    // Prepare update data
    const updateData: any = {
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
    };
    
    // Only include orgId if role is ORG_ADMIN
    if (formData.role === 'ORG_ADMIN' && formData.organizationId) {
      updateData.orgId = formData.organizationId.trim();
    }
    
    // Only include password if it was provided
    if (formData.password && formData.password.trim().length > 0) {
      if (formData.password.trim().length < 8) {
        this.snackbarService.openSnackbar(
          'Password must be at least 8 characters long.',
          'failed'
        );
        this.adminUserForm.get('password')?.markAsTouched();
        return;
      }
      updateData.password = formData.password.trim();
    }
    
    // Show spinner with debounce
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
    }
    this.spinnerTimeout = setTimeout(() => {
      // Spinner will be shown in parent component if needed
    }, 300);

    const username = this.data.adminUser?.username || this.data.username;
    
    this.redeemService
      .updateAdminUser(username, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
          }
          
          this.snackbarService.openSnackbar(
            'Admin user updated successfully!',
            'success'
          );
          this.dialogRef.close(true); // Pass true to indicate success
          this.redeemService.reloadComponent1(); // Trigger refresh
        },
        error: (error: HttpErrorResponse) => {
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
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
            const message = errorMessage || 'Invalid data. Please check all fields and try again.';
            this.snackbarService.openSnackbar(message, 'failed');
          } else if (error.status === 404) {
            const message = errorMessage || 'Admin user not found. Please refresh and try again.';
            this.snackbarService.openSnackbar(message, 'failed');
          } else if (error.status === 409) {
            const message = errorMessage || 'Email already exists. Please choose another one.';
            this.snackbarService.openSnackbar(message, 'failed');
          } else if (error.status === 401) {
            this.snackbarService.openSnackbar(
              'You are not authorized. Please log in again.',
              'failed'
            );
          } else if (error.status === 403) {
            this.snackbarService.openSnackbar(
              'You do not have permission to update admin users.',
              'failed'
            );
          } else {
            const message = errorMessage || 'Failed to update admin user. Please try again.';
            this.snackbarService.openSnackbar(message, 'failed');
          }
        },
      });
  }
}

