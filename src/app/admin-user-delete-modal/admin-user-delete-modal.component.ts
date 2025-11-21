import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RedeemService } from 'src/services/redeem.service';
import { SnackbarService } from 'src/services/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-admin-user-delete-modal',
  templateUrl: './admin-user-delete-modal.component.html',
  styleUrls: ['./admin-user-delete-modal.component.scss'],
})
export class AdminUserDeleteModalComponent implements OnInit {
  username: string = '';
  adminUserName: string = '';
  adminUserEmail: string = '';
  isLoading: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AdminUserDeleteModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private redeemService: RedeemService,
    private snackbarService: SnackbarService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    if (this.data.adminUser) {
      this.username = this.data.adminUser.username || '';
      this.adminUserName = this.data.adminUser.username || 'this admin user';
      this.adminUserEmail = this.data.adminUser.email || '';
    } else if (this.data.username) {
      this.username = this.data.username;
      this.adminUserName = this.data.username;
      this.adminUserEmail = this.data.email || '';
    }
  }

  close() {
    this.dialogRef.close(false);
  }

  confirmDelete() {
    if (!this.username) {
      this.snackbarService.openSnackbar(
        'Admin user username is missing. Cannot delete.',
        'failed'
      );
      return;
    }

    this.isLoading = true;
    this.spinner.show('mainSpinner');

    this.redeemService.deleteAdminUser(this.username).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.spinner.hide('mainSpinner');
        this.snackbarService.openSnackbar(
          'Admin user deleted successfully!',
          'success'
        );
        this.dialogRef.close(true); // Pass true to indicate successful deletion
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.spinner.hide('mainSpinner');
        
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
        
        if (error.status === 404) {
          const message = errorMessage || 'Admin user not found. It may have already been deleted.';
          this.snackbarService.openSnackbar(message, 'failed');
        } else if (error.status === 403) {
          const message = errorMessage || 'You do not have permission to delete this admin user.';
          this.snackbarService.openSnackbar(message, 'failed');
        } else if (error.status === 401) {
          this.snackbarService.openSnackbar(
            'You are not authorized. Please log in again.',
            'failed'
          );
        } else {
          const message = errorMessage || 'Failed to delete admin user. Please try again.';
          this.snackbarService.openSnackbar(message, 'failed');
        }
      },
    });
  }
}

