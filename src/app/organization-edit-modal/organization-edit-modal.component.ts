import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RedeemService } from 'src/services/redeem.service';
import { SnackbarService } from 'src/services/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-organization-edit-modal',
  templateUrl: './organization-edit-modal.component.html',
  styleUrls: ['./organization-edit-modal.component.scss'],
})
export class OrganizationEditModalComponent implements OnInit {
  organizationForm: any = FormGroup;
  
  // Password visibility states
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;

  constructor(
    private fb: FormBuilder,
    private redeemService: RedeemService,
    private snackbarService: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<OrganizationEditModalComponent>
  ) {}

  ngOnInit(): void {
    this.organizationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.minLength(6)]], // Optional for updates
      confirmPassword: [''],
      active: [true, Validators.required],
    }, { validators: this.passwordMatchValidator });

    // Populate form with existing organization data
    if (this.data.organization) {
      const org = this.data.organization;
      this.organizationForm.patchValue({
        name: org.name || '',
        username: org.username || '',
        password: '', // Don't populate password for security
        confirmPassword: '',
        active: org.active !== undefined ? org.active : true,
      });
    }
    
    // Update confirm password validation when password changes
    this.organizationForm.get('password')?.valueChanges.subscribe(() => {
      this.organizationForm.get('confirmPassword')?.updateValueAndValidity();
    });
  }

  passwordMatchValidator(formGroup: FormGroup): ValidationErrors | null {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    // Only validate if password field has a value
    if (password.value && password.value.trim().length > 0) {
      if (confirmPassword.value !== password.value) {
        const error = { passwordMismatch: true };
        confirmPassword.setErrors(error);
        return error;
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
    
    // If password is empty, clear confirm password mismatch errors
    if (!password.value || password.value.trim().length === 0) {
      if (confirmPassword.hasError('passwordMismatch')) {
        const errors = { ...confirmPassword.errors };
        delete errors['passwordMismatch'];
        confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
      return null;
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

  resetForm() {
    this.organizationForm.reset({
      name: '',
      username: '',
      password: '',
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
    
    // Check if passwords match
    const password = this.organizationForm.get('password')?.value;
    const confirmPassword = this.organizationForm.get('confirmPassword')?.value;
    
    // If password is provided, confirm password is required
    if (password && password.trim().length > 0) {
      if (!confirmPassword || confirmPassword.trim().length === 0) {
        this.snackbarService.openSnackbar(
          'Please confirm the password',
          'failed'
        );
        this.organizationForm.get('confirmPassword')?.setErrors({ required: true });
        this.organizationForm.get('confirmPassword')?.markAsTouched();
        return;
      }
      
      if (password.trim() !== confirmPassword.trim()) {
        this.snackbarService.openSnackbar(
          'Passwords do not match',
          'failed'
        );
        this.organizationForm.get('confirmPassword')?.setErrors({ passwordMismatch: true });
        this.organizationForm.get('confirmPassword')?.markAsTouched();
        return;
      }
    }
    
    // Re-validate form after password checks
    if (this.organizationForm.errors?.['passwordMismatch']) {
      return;
    }
    
    // Check if form is valid (excluding confirmPassword if password is empty)
    if (!this.organizationForm.valid) {
      this.snackbarService.openSnackbar(
        'Please fill in all required fields correctly',
        'failed'
      );
      return;
    }

    const formData = this.organizationForm.value;
    const organizationData: any = {
      name: formData.name.trim(),
      username: formData.username.trim(),
      active: formData.active,
    };
    
    // Only include password if it was provided
    if (formData.password && formData.password.trim().length > 0) {
      organizationData.password = formData.password.trim();
    }

    this.redeemService
      .updateOrganization(this.data.organization.id, organizationData)
      .subscribe({
        next: (response) => {
          this.snackbarService.openSnackbar(
            'Organization updated successfully!',
            'success'
          );
          this.dialogRef.close(true); // Pass true to indicate success
        },
        error: (error: HttpErrorResponse) => {
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
              'Organization update failed. Please try again.',
              'failed'
            );
          }
        },
      });
  }
}

