import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SnackbarService } from 'src/services/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';
import { RedeemService } from 'src/services/redeem.service';

@Component({
  selector: 'app-player-registration',
  templateUrl: './player-registration.component.html',
  styleUrls: ['./player-registration.component.scss'],
})
export class PlayerRegistrationComponent implements OnInit {
  playerRegistrationForm: any = FormGroup;
  gameList: any = [];
  formType: string = 'single';
  selectedFile: File | null = null;
  fileExtension: any | null = null;
  invalidPlayers: any[] = [];

  constructor(
    private fb: FormBuilder,
    private redeemService: RedeemService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.playerRegistrationForm = this.fb.group({
      gameName: ['', Validators.required],
      plUname: ['', Validators.required],
    });
    this.getGameList();
  }

  getGameList() {
    this.redeemService.getGameName().subscribe(
      (response: any) => {
        this.gameList = response;
      },
      () => {
        this.snackbarService.openSnackbar(
          'Failed to fetch game list',
          'failed'
        );
      }
    );
  }

  resetForm() {
    this.playerRegistrationForm.reset();
    Object.keys(this.playerRegistrationForm.controls).forEach((key) => {
      this.playerRegistrationForm.get(key).setErrors(null);
      this.playerRegistrationForm.get(key).markAsPristine();
      this.playerRegistrationForm.get(key).markAsUntouched();
    });
  }

  onSubmit() {
    if (this.playerRegistrationForm.valid) {
      const formData = this.playerRegistrationForm.value;
      const registrationData = {
        plUname: formData.plUname.trim(),
        gameName: formData.gameName.trim(),
      };
      this.redeemService
        .registerPlayer(registrationData)
        .subscribe({
          next: (response) => {
            if (response) {
              this.snackbarService.openSnackbar(
                'Player registered successfully!',
                'success'
              );
              this.resetForm();
            }
          },
          error: (error: HttpErrorResponse) => {
            if (error.status === 409) {
              this.snackbarService.openSnackbar(
                'Username already exists. Please choose another one.',
                'failed'
              );
            } else {
              this.snackbarService.openSnackbar(
                'Player registration failed. Please try again.',
                'failed'
              );
            }
          }
        });
    } else {
      this.playerRegistrationForm.markAllAsTouched();
    }
  }
  onFileChange(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (
        this.fileExtension === 'csv' ||
        this.fileExtension === 'xlsx' ||
        this.fileExtension === 'json'
      ) {
        this.selectedFile = file;
        this.snackbarService.openSnackbar(
          `Selected file: ${file.name}`,
          'success'
        );
      } else {
        this.snackbarService.openSnackbar(
          'Invalid file type! Please upload a .csv or .json file.',
          'failed'
        );
      }
    } else {
      this.snackbarService.openSnackbar('No file selected.', 'failed');
    }
  }

  uploadCsvFile() {
    if (!this.selectedFile) {
      this.snackbarService.openSnackbar('No file selected!', 'failed');
      return;
    }

    if (this.fileExtension == 'json') {
      this.uploadJsonFile();
      return;
    }

    let formDataObj = new FormData();
    formDataObj.append('file', this.selectedFile);
  
    this.redeemService.uploadCsv(formDataObj).subscribe({
      next: (response: any) => {
        this.invalidPlayers = [];
  
        if (response?.msg && response?.msg.includes('Some players are not valid')) {
          this.invalidPlayers = response.player;  
          this.snackbarService.openSnackbar('Some players are invalid and were not saved.', 'failed');
        } else {
          this.snackbarService.openSnackbar('File uploaded successfully!', 'success');
        }
  
        this.selectedFile = null;
  
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';  
        }
        this.snackbarService.openSnackbar('You can now select a new file for upload.', 'info');
      },
      error: (error: HttpErrorResponse) => {
        this.snackbarService.openSnackbar('File upload failed. Please try again.', 'failed');
      }
    });
  }
  
  uploadJsonFile() {
    if (!this.selectedFile) {
      this.snackbarService.openSnackbar('No file selected!', 'failed');
      return;
    }
  
    let formDataObj = new FormData();
    formDataObj.append('file', this.selectedFile);
  
    this.redeemService.uploadJson(formDataObj).subscribe({
      next: (response: any) => {
        this.invalidPlayers = [];
  
        if (response?.msg && response?.msg.includes('Some players are not valid')) {
          this.invalidPlayers = response.player;  
          this.snackbarService.openSnackbar('Some players are invalid and were not saved.', 'failed');
        } else {
          this.snackbarService.openSnackbar('File uploaded successfully!', 'success');
        }
  
        this.selectedFile = null;
  
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
  
        this.snackbarService.openSnackbar('You can now select a new file for upload.', 'info');
      },
      error: (error: HttpErrorResponse) => {
        this.snackbarService.openSnackbar('File upload failed. Please try again.', 'failed');
      }
    });
  }
  
  downloadCSVTemplate() {
    const csvContent = `PlayerUsername,GameName
  player1,game1
  player2,game2`;
  
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'csv-template.csv';
    link.click();
  }
  
  downloadJSONTemplate() {
    const jsonContent = [
      {
        "plUname": "player1",
        "gameName": "game1"
      },
      {
        "plUname": "player2",
        "gameName": "game2"
      }
    ];
  
    const blob = new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'json-template.json';
    link.click();
  }
}
