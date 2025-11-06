import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomSnackbarComponent } from 'src/app/custom-snackbar/custom-snackbar.component';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  constructor(private snackbar: MatSnackBar) {}

  openSnackbar(message: string, status: string) {
    if (status === 'success') {
      this.snackbar.openFromComponent(CustomSnackbarComponent, {
        data: {
          message: message,
          snackbar: this.snackbar,
          icon: 'check_circle',
          type: 'success',
        },
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 5000,
        panelClass: ['snackbar-success'],
      });
    } else if (status === 'failed') {
      this.snackbar.openFromComponent(CustomSnackbarComponent, {
        data: {
          message: message,
          snackbar: this.snackbar,
          icon: 'error',
          type: 'failed',
        },
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 5000,
        panelClass: ['snackbar-danger'],
      });
    }
  }
}
