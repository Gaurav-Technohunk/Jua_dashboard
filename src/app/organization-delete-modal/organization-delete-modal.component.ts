import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RedeemService } from 'src/services/redeem.service';
import { SnackbarService } from 'src/services/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-organization-delete-modal',
  templateUrl: './organization-delete-modal.component.html',
  styleUrls: ['./organization-delete-modal.component.scss'],
})
export class OrganizationDeleteModalComponent implements OnInit {
  organizationName: string = '';
  organizationId: string = '';
  isLoading: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<OrganizationDeleteModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private redeemService: RedeemService,
    private snackbarService: SnackbarService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    if (this.data.organization) {
      this.organizationName = this.data.organization.name || 'this organization';
      this.organizationId = this.data.organization.id;
    }
  }

  close() {
    this.dialogRef.close(false);
  }

  confirmDelete() {
    if (!this.organizationId) {
      this.snackbarService.openSnackbar(
        'Organization ID is missing. Cannot delete.',
        'failed'
      );
      return;
    }

    this.isLoading = true;
    this.spinner.show('mainSpinner');

    this.redeemService.deleteOrganization(this.organizationId).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.spinner.hide('mainSpinner');
        this.snackbarService.openSnackbar(
          'Organization deleted successfully!',
          'success'
        );
        this.dialogRef.close(true); // Pass true to indicate successful deletion
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.spinner.hide('mainSpinner');
        
        if (error.status === 404) {
          this.snackbarService.openSnackbar(
            'Organization not found. It may have already been deleted.',
            'failed'
          );
        } else if (error.status === 403) {
          this.snackbarService.openSnackbar(
            'You do not have permission to delete this organization.',
            'failed'
          );
        } else {
          this.snackbarService.openSnackbar(
            'Failed to delete organization. Please try again.',
            'failed'
          );
        }
      },
    });
  }
}

