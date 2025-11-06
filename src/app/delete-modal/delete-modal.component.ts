import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/services/auth.service';
import { SnackbarService } from 'src/services/snackbar.service';

@Component({
  selector: 'app-delete-modal',
  templateUrl: './delete-modal.component.html',
  styleUrls: ['./delete-modal.component.scss'],
})
export class DeleteModalComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<DeleteModalComponent>,
    private authService: AuthService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {}

  close() {
    this.dialogRef.close();
  }

  logout() {
    this.authService.logout();
    this.snackbarService.openSnackbar(
      'You have been successfully logged out.',
      'success'
    );
  }
}
