import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { redeemForm } from 'src/services/interface';
import { RedeemService } from 'src/services/redeem.service';
import { SnackbarService } from 'src/services/snackbar.service';

@Component({
  selector: 'app-manual-redeem',
  templateUrl: './manual-redeem.component.html',
  styleUrls: ['./manual-redeem.component.scss'],
})
export class ManualRedeemComponent implements OnInit {
  manualRedeemForm: any = FormGroup;
  gameList: string[] = [];
  playerList: any = [];
  filterPlayers: any = [];
  searchText: string = '';
  PlayerName: any = [];
  private spinnerTimeout: any;

  labelName = [
    {
      name: 'Amount in Dollars',
      field: 'amount',
      placeholder: '$0.00',
      type: 'number',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private redeemService: RedeemService,
    private snackbarService: SnackbarService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.manualRedeemForm = this.fb.group({
      userName: ['', Validators.required],
      amount: ['', Validators.required],
      selectGameName: ['', Validators.required],
    });
    this.getGameName();
  }

  getGameName() {
    this.redeemService.getGameName().subscribe((response: any) => {
      this.gameList = response;
    });
  }
  selectedGameName(gameName: string) {
    this.redeemService.searchPlayers(gameName).subscribe((response: any) => {
      this.playerList = response;
      this.filterPlayers = [];
    });
  }

  filteredUsers(searchItem: any) {
    this.searchText = searchItem;
    this.filterPlayers = this.playerList.filter((player: any) =>
      player.plUname.toLowerCase().includes(this.searchText.toLowerCase())
    );
    this.PlayerName = this.filterPlayers.filter((player: any) =>
        player.plUname.toLowerCase() === this.searchText.toLowerCase()
    );
  }

  onOptionSelected(event: any) {
    this.filteredUsers(event.option.value);
  }

  resetForm() {
    this.manualRedeemForm.reset();
    Object.keys(this.manualRedeemForm.controls).forEach((key) => {
      this.manualRedeemForm.get(key)?.setErrors(null);
      this.manualRedeemForm.get(key)?.markAsPristine();
      this.manualRedeemForm.get(key)?.markAsUntouched();
    });
    this.PlayerName = [];
    this.filterPlayers = [];
    this.searchText = '';
  }

  onSubmit() {
    // Mark all fields as touched to show validation errors
    this.manualRedeemForm.markAllAsTouched();
    
    // Check if form is valid
    if (!this.manualRedeemForm.valid) {
      this.snackbarService.openSnackbar(
        'Please fill in all required fields',
        'failed'
      );
      return;
    }
    
    // Check if player name is selected
    if (this.PlayerName.length === 0) {
      this.snackbarService.openSnackbar(
        'Please select a valid customer username',
        'failed'
      );
      return;
    }
    
    // Submit form
    let formData = this.manualRedeemForm.value;
    const data: redeemForm = {
      gameName: formData.selectGameName.trim(),
      username: formData.userName.trim(),
      amount: formData.amount.trim(),
    };
    
    // Debounced spinner to avoid flicker on very fast responses
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
    }
    this.spinnerTimeout = setTimeout(() => {
      this.spinner.show('mainSpinner');
    }, 300);

    this.redeemService
      .manualRedeem(data)
      .subscribe({
        next: (response) => {
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
          }
          this.spinner.hide('mainSpinner');
          if (response) {
            this.snackbarService.openSnackbar(
              'You have been successfully Redeem',
              'success'
            );
            this.resetForm();
          }
        },
        error: (err) => {
          if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
          }
          this.spinner.hide('mainSpinner');
          this.snackbarService.openSnackbar(
            'Redeem failed. Please try again',
            'failed'
          );
        },
      });
  }
}
