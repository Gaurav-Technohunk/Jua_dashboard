import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { settingForm } from 'src/services/interface';
import { RedeemService } from 'src/services/redeem.service';
import { SnackbarService } from 'src/services/snackbar.service';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss'],
})
export class SettingComponent implements OnInit {
  settingForm: any = FormGroup;
  isChecked: boolean = true;
  labelName = [
    { name: 'Game url', field: 'domain', placeholder: 'Enter Game url' },
    { name: 'Prefix', field: 'prefix', placeholder: 'Enter Game Prefix' },
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
      'domain': 'link',
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
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.settingForm = this.fb.group({
      domain: ['', Validators.required],
      prefix: ['', Validators.required],
      gameName: ['', Validators.required],
      userName: ['', Validators.required],
      password: ['', Validators.required],
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
      let data: settingForm = {
        userName: formData.userName.trim(),
        password: formData.password.trim(),
        prefix: formData.prefix.trim(),
        gameName: formData.gameName.trim(),
        gameUrl: formData.domain.trim(),
        status: this.isChecked,
      };
      this.redeemService
        .addNewGame(data)
        .subscribe({
          next: (result: any) => {
            if (result) {
              this.snackbarService.openSnackbar(
                'Settings updated successfully!',
                'success'
              );
              this.resetForm();
            }
          },
          error: (err) => {
            this.snackbarService.openSnackbar(
              'Failed to update settings.Please try again',
              'failed'
            );
          },
        });
    } else {
      this.settingForm.markAllAsTouched();
    }
  }
}
