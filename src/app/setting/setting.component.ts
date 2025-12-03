import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { settingForm } from 'src/services/interface';
import { RedeemService } from 'src/services/redeem.service';
import { SnackbarService } from 'src/services/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss'],
})
export class SettingComponent implements OnInit, OnDestroy {
  settingForm!: FormGroup;
  isChecked: boolean = true;
  organizations: any[] = [];
  hidePassword: boolean = true;
  private destroy$ = new Subject<void>();
  spinnerTimeout: any = null;
  existingGames: any[] = [];

  constructor(
    private fb: FormBuilder,
    private redeemService: RedeemService,
    private snackbarService: SnackbarService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.settingForm = this.fb.group({
      orgName: ['', Validators.required],
      gameName: ['', Validators.required],
      userName: ['', Validators.required],
      password: ['', Validators.required],
      gameUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+$/)]],
      prefix: ['', Validators.required],
      suffix: ['', Validators.required],
      adminEmail: ['', [Validators.required, Validators.email]],
      status: [true],
    });
    
    this.fetchOrganizations();
    this.fetchExistingGames();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
    }
  }

  fetchOrganizations(): void {
    this.redeemService
      .getOrganizations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          let orgs: any[] = [];
          
          // Handle different response structures
          if (Array.isArray(response)) {
            orgs = response;
          } else if (response && Array.isArray(response.data)) {
            orgs = response.data;
          } else if (response && Array.isArray(response.organizations)) {
            orgs = response.organizations;
          }
          
          // Filter for active organizations only
          this.organizations = orgs.filter((org: any) => org.active !== false);
          
          // Sort organizations by name
          this.organizations.sort((a: any, b: any) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching organizations:', error);
          this.snackbarService.openSnackbar(
            'Failed to load organizations. Please try again.',
            'failed'
          );
        },
      });
  }

  fetchExistingGames(): void {
    this.redeemService
      .fetchGameList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.existingGames = Array.isArray(response) ? response : [];
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching existing games:', error);
          this.existingGames = [];
        },
      });
  }

  checkForDuplicate(gameName: string, orgName: string, adminEmail: string): boolean {
    const normalizedGameName = (gameName || '').trim().toLowerCase();
    const normalizedOrgName = (orgName || '').trim().toLowerCase();
    const normalizedAdminEmail = (adminEmail || '').trim().toLowerCase();

    return this.existingGames.some((game: any) => {
      const existingGameName = (game.gameName || '').trim().toLowerCase();
      const existingOrgName = (game.orgName || '').trim().toLowerCase();
      const existingAdminEmail = (game.adminEmail || '').trim().toLowerCase();

      return (
        existingGameName === normalizedGameName &&
        existingOrgName === normalizedOrgName &&
        existingAdminEmail === normalizedAdminEmail
      );
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  getFieldIcon(field: string): string {
    const iconMap: { [key: string]: string } = {
      'orgName': 'business',
      'gameName': 'sports_esports',
      'userName': 'person',
      'password': 'lock',
      'gameUrl': 'link',
      'prefix': 'text_fields',
      'suffix': 'text_fields',
      'adminEmail': 'email',
      'status': 'toggle_on'
    };
    return iconMap[field] || 'info';
  }

  resetForm(): void {
    this.settingForm.reset({
      status: true,
    });
    this.isChecked = true;
    Object.keys(this.settingForm.controls).forEach((key) => {
      this.settingForm.get(key)?.setErrors(null);
      this.settingForm.get(key)?.markAsPristine();
      this.settingForm.get(key)?.markAsUntouched();
    });
  }

  onSubmit(): void {
    if (this.settingForm.invalid) {
      this.settingForm.markAllAsTouched();
      this.snackbarService.openSnackbar(
        'Please fill in all required fields correctly.',
        'failed'
      );
      return;
    }

    const formData = this.settingForm.value;
    const gameName = formData.gameName.trim();
    const orgName = formData.orgName.trim();
    const adminEmail = formData.adminEmail.trim().toLowerCase();

    // Check for duplicate combination of gameName + orgName + adminEmail
    if (this.checkForDuplicate(gameName, orgName, adminEmail)) {
      this.snackbarService.openSnackbar(
        'A game with the same Game Name, Organization, and Admin Email already exists. Please use different values.',
        'failed'
      );
      return;
    }

    const data: settingForm = {
      orgName: orgName,
      gameName: gameName,
      userName: formData.userName.trim(),
      password: formData.password.trim(),
      gameUrl: formData.gameUrl.trim(),
      prefix: formData.prefix.trim(),
      suffix: formData.suffix.trim(),
      adminEmail: adminEmail,
      status: formData.status !== undefined ? formData.status : this.isChecked,
    };

    // Show spinner with debounce
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
    }
    this.spinnerTimeout = setTimeout(() => {
      this.spinner.show('mainSpinner');
    }, 300);

    this.redeemService
      .addNewGame(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: any) => {
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
          }
          this.spinner.hide('mainSpinner');

          if (result) {
            this.snackbarService.openSnackbar(
              'Settings updated successfully!',
              'success'
            );
            this.fetchExistingGames(); // Refresh existing games list
            this.resetForm();
          }
        },
        error: (error: HttpErrorResponse) => {
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
          }
          this.spinner.hide('mainSpinner');

          let errorMessage = '';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }

          if (error.status === 400) {
            const message = errorMessage || 'Invalid data. Please check all fields and try again.';
            this.snackbarService.openSnackbar(message, 'failed');
          } else if (error.status === 409) {
            const message = errorMessage || 'Game settings already exist. Please update instead.';
            this.snackbarService.openSnackbar(message, 'failed');
          } else if (error.status === 404) {
            const message = errorMessage || 'Organization not found. Please select a valid organization.';
            this.snackbarService.openSnackbar(message, 'failed');
          } else if (error.status === 401) {
            this.snackbarService.openSnackbar(
              'You are not authorized. Please log in again.',
              'failed'
            );
          } else if (error.status === 403) {
            this.snackbarService.openSnackbar(
              'You do not have permission to update settings.',
              'failed'
            );
          } else if (error.status === 0) {
            this.snackbarService.openSnackbar(
              'Network error. Please check your connection and try again.',
              'failed'
            );
          } else {
            const message = errorMessage || 'Failed to update settings. Please try again.';
            this.snackbarService.openSnackbar(message, 'failed');
          }
        },
      });
  }
}
