import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RedeemService } from 'src/services/redeem.service';
import { SnackbarService } from 'src/services/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-player-edit-modal',
  templateUrl: './player-edit-modal.component.html',
  styleUrls: ['./player-edit-modal.component.scss'],
})
export class PlayerEditModalComponent implements OnInit, OnDestroy {
  playerForm!: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private redeemService: RedeemService,
    private snackbarService: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<PlayerEditModalComponent>
  ) {}

  ngOnInit(): void {
    this.playerForm = this.fb.group({
      plUname: ['', Validators.required],
      gameName: ['', Validators.required],
    });

    if (this.data && this.data.player) {
      const player = this.data.player;
      this.playerForm.patchValue({
        plUname: player.plUname || '',
        gameName: player.gameName || '',
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    this.playerForm.markAllAsTouched();
    if (this.playerForm.invalid) {
      this.snackbarService.openSnackbar(
        'Please fill in all required fields correctly.',
        'failed'
      );
      return;
    }

    const player = this.data?.player;
    const playerId =
      player?.id ||
      player?.playerId ||
      player?._id ||
      player?.plId ||
      player?.player_id ||
      (player
        ? Object.keys(player).find((k) => k.toLowerCase().includes('id')) &&
          String(player[
            Object.keys(player).find((k) =>
              k.toLowerCase().includes('id')
            ) as string
          ])
        : null);
    if (!playerId) {
      this.snackbarService.openSnackbar(
        'Player identifier is missing. Cannot update player.',
        'failed'
      );
      return;
    }

    const formData = this.playerForm.value;
    const updateData = {
      plUname: String(formData.plUname).trim(),
      gameName: String(formData.gameName).trim(),
    };

    this.redeemService
      .updatePlayer(playerId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.openSnackbar(
            'Player updated successfully!',
            'success'
          );
          this.dialogRef.close(true);
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
            const message =
              errorMessage ||
              'Invalid data. Please check all fields and try again.';
            this.snackbarService.openSnackbar(message, 'failed');
          } else if (error.status === 404) {
            const message =
              errorMessage ||
              'Player not found. Please refresh and try again.';
            this.snackbarService.openSnackbar(message, 'failed');
          } else if (error.status === 401) {
            this.snackbarService.openSnackbar(
              'You are not authorized. Please log in again.',
              'failed'
            );
          } else if (error.status === 403) {
            this.snackbarService.openSnackbar(
              'You do not have permission to update this player.',
              'failed'
            );
          } else {
            const message =
              errorMessage || 'Failed to update player. Please try again.';
            this.snackbarService.openSnackbar(message, 'failed');
          }
        },
      });
  }
}


