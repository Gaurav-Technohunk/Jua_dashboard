import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { gameList } from 'src/services/interface';
import { RedeemService } from 'src/services/redeem.service';
import { SnackbarService } from 'src/services/snackbar.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-game-edit-modal',
  templateUrl: './game-edit-modal.component.html',
  styleUrls: ['./game-edit-modal.component.scss'],
})
export class GameEditModalComponent implements OnInit, OnDestroy {
  settingForm!: FormGroup;
  gameList: gameList[] = [];
  organizations: any[] = [];
  hidePassword: boolean = true;
  private destroy$ = new Subject<void>();
  existingGames: any[] = [];
  currentGameId: string | null = null;
  
  constructor(
    private fb: FormBuilder,
    private redeemService: RedeemService,
    private snackbarService: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<GameEditModalComponent>
  ) {}

  ngOnInit(): void {
    this.settingForm = this.fb.group({
      orgName: ['', Validators.required],
      gameName: ['', Validators.required],
      userName: ['', Validators.required],
      password: [''],
      gameUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+$/)]],
      prefix: ['', Validators.required],
      suffix: ['', Validators.required],
      adminEmail: ['', [Validators.required, Validators.email]],
      status: [true],
    });
    
    this.currentGameId = this.data?.gameId || null;
    this.fetchOrganizations();
    this.fetchGameDetails();
    this.fetchExistingGames();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchOrganizations(): void {
    this.redeemService
      .getOrganizations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          let orgs: any[] = [];
          
          if (Array.isArray(response)) {
            orgs = response;
          } else if (response && Array.isArray(response.data)) {
            orgs = response.data;
          } else if (response && Array.isArray(response.organizations)) {
            orgs = response.organizations;
          }
          
          this.organizations = orgs.filter((org: any) => org.active !== false);
          this.organizations.sort((a: any, b: any) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching organizations:', error);
        },
      });
  }

  fetchGameDetails(): void {
    this.redeemService
      .fetchGameList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: gameList[]) => {
          if (result && result.length > 0) {
            this.gameList = result.filter(
              (ele: gameList) => ele.id === this.data.gameId
            );
            
            if (this.gameList.length > 0) {
              const game = this.gameList[0];
              
              // Set form values
              if (game.orgName) {
                this.settingForm.controls['orgName'].setValue(game.orgName);
              }
              this.settingForm.controls['gameName'].setValue(game.gameName);
              this.settingForm.controls['userName'].setValue(game.userName);
              this.settingForm.controls['password'].setValue(game.password || '');
              this.settingForm.controls['gameUrl'].setValue(game.gameUrl);
              this.settingForm.controls['prefix'].setValue(game.prefix);
              this.settingForm.controls['suffix'].setValue(game.suffix || '');
              
              if (game.adminEmail) {
                this.settingForm.controls['adminEmail'].setValue(game.adminEmail);
              }
              
              this.settingForm.controls['status'].setValue(game.status !== undefined ? game.status : true);
            }
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching game details:', error);
          this.snackbarService.openSnackbar(
            'Failed to load game details. Please try again.',
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
      // Exclude the current game being edited
      if (this.currentGameId && (game.id === this.currentGameId || game._id === this.currentGameId)) {
        return false;
      }

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

    const data: any = {
      id: this.data.gameId.trim(),
      orgName: orgName,
      gameName: gameName,
      userName: formData.userName.trim(),
      gameUrl: formData.gameUrl.trim(),
      prefix: formData.prefix.trim(),
      suffix: formData.suffix.trim(),
      adminEmail: adminEmail,
      status: formData.status !== undefined ? formData.status : true,
    };

    // Only include password if it was changed
    if (formData.password && formData.password.trim()) {
      data.password = formData.password.trim();
    }

    this.redeemService
      .updateGame(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.openSnackbar(
            'Game Record updated successfully!',
            'success'
          );
          this.dialogRef.close();
          this.redeemService.reloadComponent1();
        },
        error: (error: HttpErrorResponse) => {
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
          } else if (error.status === 404) {
            const message = errorMessage || 'Game not found. Please refresh and try again.';
            this.snackbarService.openSnackbar(message, 'failed');
          } else if (error.status === 401) {
            this.snackbarService.openSnackbar(
              'You are not authorized. Please log in again.',
              'failed'
            );
          } else if (error.status === 403) {
            this.snackbarService.openSnackbar(
              'You do not have permission to update games.',
              'failed'
            );
          } else {
            const message = errorMessage || 'Failed to update Game Record. Please try again.';
            this.snackbarService.openSnackbar(message, 'failed');
          }
        },
      });
  }
}
