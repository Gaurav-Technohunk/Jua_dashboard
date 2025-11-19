import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { gameList } from 'src/services/interface';
import { RedeemService } from 'src/services/redeem.service';
import { SnackbarService } from 'src/services/snackbar.service';

@Component({
  selector: 'app-game-edit-modal',
  templateUrl: './game-edit-modal.component.html',
  styleUrls: ['./game-edit-modal.component.scss'],
})
export class GameEditModalComponent implements OnInit {
  settingForm: any = FormGroup;
  isChecked: boolean = true;
  gameList: gameList[] = [];
  labelName = [
    { name: 'Game url', field: 'gameUrl', placeholder: 'Enter Game url' },
    {
      name: 'Prefix',
      field: 'prefix',
      placeholder: 'Enter Game Prefix',
    },
    { name: 'Game Name', field: 'gameName', placeholder: 'Enter Game Name' },
    {
      name: "Customer's Username",
      field: 'userName',
      placeholder: 'Enter Username',
    },
    {
      name: "Customer's Password",
      field: 'password',
      placeholder: 'Enter Password',
    },
  ];
  
  getFieldIcon(field: string): string {
    const iconMap: { [key: string]: string } = {
      'gameUrl': 'link',
      'prefix': 'text_fields',
      'gameName': 'sports_esports',
      'userName': 'person',
      'password': 'lock'
    };
    return iconMap[field] || 'info';
  }
  
  constructor(
    private fb: FormBuilder,
    private redeemService: RedeemService,
    private snackbarService: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<GameEditModalComponent>
  ) {}

  ngOnInit(): void {
    this.settingForm = this.fb.group({
      gameUrl: ['', Validators.required],
      prefix: ['', Validators.required],
      gameName: ['', Validators.required],
      userName: ['', Validators.required],
      password: ['', Validators.required],
    });
    this.redeemService.fetchGameList().subscribe((result: gameList[]) => {
      if (result) {
        this.gameList = result.filter(
          (ele: gameList) => ele.id === this.data.gameId
        );
        if (this.gameList[0].suffix) {
          this.settingForm.controls['prefix'].setValue(this.gameList[0].suffix);
        } else {
          this.settingForm.controls['prefix'].setValue(this.gameList[0].prefix);
        }
        this.isChecked = this.gameList[0].status;
        this.settingForm.controls['gameUrl'].setValue(this.gameList[0].gameUrl);
        this.settingForm.controls['gameName'].setValue(
          this.gameList[0].gameName
        );
        this.settingForm.controls['userName'].setValue(
          this.gameList[0].userName
        );
        this.settingForm.controls['password'].setValue(
          this.gameList[0].password
        );
      }
    });
  }

  resetForm() {
    this.settingForm.reset();
    Object.keys(this.settingForm.controls).forEach((key) => {
      this.settingForm.get(key).setErrors(null);
      this.settingForm.get(key).markAsPristine();
      this.settingForm.get(key).markAsUntouched();
    });
  }

  onSubmit() {
    if (this.settingForm.valid) {
      let formData = this.settingForm.value;
      let data = {
        id: this.data.gameId.trim(),
        gameName: formData.gameName.trim(),
        userName: formData.userName.trim(),
        gameUrl: formData.gameUrl.trim(),
        prefix: formData.prefix.trim(),
        password: formData.password.trim(),
        status: this.isChecked,
      };
      this.redeemService
        .updateGame(data)
        .subscribe({
          next: () => {
            this.snackbarService.openSnackbar(
              'Game Record updated successfully!',
              'success'
            );
            this.dialogRef.close();
            this.redeemService.reloadComponent1();
          },
          error: () => {
            this.snackbarService.openSnackbar(
              'Failed to update Game Record.Please try again',
              'failed'
            );
          },
        });
    } else {
      this.settingForm.markAllAsTouched();
    }
  }
}
